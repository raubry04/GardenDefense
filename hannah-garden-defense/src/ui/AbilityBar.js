import { GameConfig } from "../config.js";
import { sfxVol } from "../utils/audioMix.js";
import { setTouchFriendlyCircleHit } from "../utils/battleInput.js";
import {
  TEXT_ON_LIGHT,
  readableHudStyle,
  readableCaptionStyle,
} from "../utils/textReadability.js";
import { showToast } from "./Toast.js";
import { battleAbilityKeys } from "../utils/collection.js";
import { loadLocalProgress, loadPlayerName } from "../utils/hannahProgress.js";

const COLORS = GameConfig.colors;
const ABILITY_DEPTH = 250;

const ABILITY_COLORS = {
  SUNSHINE_BURST: 0xffd700,
  GARDEN_RAIN: 0x4da6ff,
  RAINBOW_SHIELD: 0x4caf50,
  SEED_STORM: 0x8bc34a,
  FLOWER_BOMB: 0xff69b4,
};

/** Short readable names drawn on ability circles (kid-friendly, not cryptic codes). */
export const ABILITY_SHORT_NAMES = {
  SUNSHINE_BURST: 'Burst',
  GARDEN_RAIN: 'Rain',
  RAINBOW_SHIELD: 'Shield',
  SEED_STORM: 'Seeds',
  FLOWER_BOMB: 'Bomb',
};

const ABILITY_LABELS = ABILITY_SHORT_NAMES;

/** Kid-friendly ready / cooldown copy helpers (testable). */
export function abilityReadyLabel(onCooldown, secondsLeft) {
  if (!onCooldown) return 'Ready!';
  const s = Math.max(1, Math.ceil(secondsLeft || 0));
  return `${s}s`;
}

/** @param {string} text */
export function isNextWaveLabel(text) {
  return text === 'NEXT WAVE';
}

export class AbilityBar {
  /** @param {import("../scenes/UIScene.js").UIScene} scene */
  constructor(scene) {
    this.scene = scene;
    this.abilityButtons = [];
    this._abilityObjects = [];
    this._sendWaveObjects = [];
    this._touchMode = scene.sys.game.device.input.touch;
    this._openAbilityTooltip = null;
  }

  create(width, height) {
    this._createAbilityButtons(width, height);
    this._createSendWaveButton(width, height);
  }

  _isAbilityUnlocked(config) {
    if (!config.unlockLevel) return true;
    return this.scene.hannahLevel >= config.unlockLevel;
  }

  _createAbilityButtons(width, height) {
    const scene = this.scene;
    const playerName = scene.playerName || loadPlayerName() || '';
    const progress = loadLocalProgress(playerName);
    const loadoutKeys = battleAbilityKeys(progress.collection, scene.hannahLevel ?? 1);
    const abilities = loadoutKeys
      .map((key) => [key, GameConfig.hannahAbilities[key]])
      .filter(([, config]) => !!config);
    const btnRadius = 36;
    const spacing = 80;
    const startY = height / 2 - ((abilities.length - 1) * spacing) / 2;
    // Keep circles inset so left-side name labels stay on-screen (portrait
    // applyLayout pushes further left via computeDesignUIMetrics.abilityX).
    const x = width - 72;
    this._abilityObjects = [];

    const trackY = (obj, layoutY) => {
      obj.setData("layoutY", layoutY);
      this._abilityObjects.push(obj);
      return obj;
    };

    this.abilityButtons = [];

    abilities.forEach(([key, config], idx) => {
      const y = startY + idx * spacing;
      const unlocked = this._isAbilityUnlocked(config);
      const abilityColor = unlocked ? (ABILITY_COLORS[key] || COLORS.accent) : 0x555555;

      // Status pill only (Ready! / Ns) — do not mirror SHLD/BOMB beside the circle.
      const nameLabel = trackY(
        scene.add
          .text(x - btnRadius - 10, y, '', {
            ...readableHudStyle('15px', unlocked ? TEXT_ON_LIGHT : "#888888"),
            align: "right",
          })
          .setOrigin(1, 0.5)
          .setDepth(ABILITY_DEPTH)
          .setVisible(false),
        y,
      );

      const circle = trackY(
        scene.add
          .circle(x, y, btnRadius, abilityColor)
          .setStrokeStyle(3, COLORS.outline)
          .setDepth(ABILITY_DEPTH + 1),
        y,
      );
      if (this._touchMode) {
        setTouchFriendlyCircleHit(circle, 16);
        circle.input.cursor = unlocked ? 'pointer' : 'default';
      } else {
        circle.setInteractive({ useHandCursor: unlocked });
      }

      const icon = ABILITY_LABELS[key] || config.label.charAt(0);
      const label = trackY(
        scene.add
          .text(x, y, icon, {
            fontFamily: "Kenney Future",
            fontSize: icon.length > 2 ? "14px" : "22px",
            color: unlocked ? "#FFFFFF" : "#AAAAAA",
            shadow: {
              offsetX: 1,
              offsetY: 1,
              color: "#000",
              blur: 2,
              fill: true,
            },
          })
          .setOrigin(0.5)
          .setDepth(ABILITY_DEPTH + 2),
        y,
      );

      const tooltipText = unlocked
        ? `${config.label}\n${config.description || ''}`
        : `${config.label} (Lv.${config.unlockLevel})`;
      // Detail tooltip sits left of the circle (same side as short name) so it
      // never clips off the right edge of the viewport.
      const tooltip = trackY(
        scene.add
          .text(x - btnRadius - 10, y, tooltipText, {
            ...readableCaptionStyle('13px', TEXT_ON_LIGHT),
            align: 'right',
            wordWrap: { width: 180 },
          })
          .setOrigin(1, 0.5)
          .setDepth(ABILITY_DEPTH + 3)
          .setVisible(false),
        y,
      );

      const cooldownGfx = scene.add.graphics().setDepth(ABILITY_DEPTH + 2);
      cooldownGfx.setVisible(false);
      this._abilityObjects.push(cooldownGfx);

      const btn = {
        circle,
        label,
        nameLabel,
        cooldownGfx,
        tooltip,
        key,
        config,
        onCooldown: false,
        pending: false,
        cooldownTween: null,
        unlocked,
      };

      circle.on("pointerover", () => {
        if (this._touchMode) return;
        this._showAbilityTooltip(btn);
        if (unlocked && !btn.onCooldown) {
          scene.tweens.add({
            targets: [circle, label],
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 60,
          });
        }
      });
      circle.on("pointerout", () => {
        if (this._touchMode) return;
        btn.tooltip.setVisible(false);
        scene.tweens.add({
          targets: [circle, label],
          scaleX: 1,
          scaleY: 1,
          duration: 60,
        });
      });
      circle.on("pointerdown", () => {
        if (!unlocked) return;
        if (this._touchMode) this._showAbilityTooltip(btn, true);
        this._requestAbility(key, config, btn);
      });
      label.setInteractive({ useHandCursor: unlocked });
      label.on("pointerdown", () => {
        if (!unlocked) return;
        if (this._touchMode) this._showAbilityTooltip(btn, true);
        this._requestAbility(key, config, btn);
      });

      this.abilityButtons.push(btn);
    });
  }

  _createSendWaveButton(width, height) {
    const scene = this.scene;
    const x = width / 2;
    const y = height - 140;
    this._sendWaveObjects = [];

    const trackY = (obj, layoutY) => {
      obj.setData("layoutY", layoutY);
      this._sendWaveObjects.push(obj);
      return obj;
    };

    this.sendWaveGlow = trackY(
      scene.add
        .circle(x, y, 110, 0xffd700, 0)
        .setStrokeStyle(4, 0xffd700)
        .setAlpha(0)
        .setDepth(9),
      y,
    );

    this.sendWaveBg = trackY(
      scene.add
        .image(x, y, "ui_buttonRect")
        .setDisplaySize(200, 50)
        .setInteractive({ useHandCursor: true })
        .setDepth(10),
      y,
    );
    // sendWaveBg is an image scaled via setDisplaySize, so its base scale != 1.
    // Hover/press tweens must animate relative to this base (recaptured whenever
    // applyLayout resizes the button); absolute scale values would collapse it
    // to the native texture size after a tap on a static (non-relayout) screen.
    this._captureSendWaveBaseScale();

    this.sendWaveText = trackY(
      scene.add
        .text(x, y - 4, "SEND WAVE", {
          fontFamily: "Kenney Future",
          fontSize: "22px",
          color: "#4A2C0A",
        })
        .setOrigin(0.5)
        .setDepth(10),
      y - 4,
    );

    const bonusY = y + 42;
    this.sendWaveBonusBg = null;

    this.sendWaveBonusText = trackY(
      scene.add
        .text(x, bonusY, this._earlyBonusLabel(), {
          ...readableHudStyle('15px', TEXT_ON_LIGHT),
        })
        .setOrigin(0.5)
        .setDepth(11),
      bonusY,
    );

    this._sendWaveGlowTween = scene.tweens.add({
      targets: this.sendWaveGlow,
      alpha: { from: 0.6, to: 0 },
      duration: 1200,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.sendWaveBg.on("pointerover", () => {
      this._tweenSendWaveScale(1.08, 60);
    });
    this.sendWaveBg.on("pointerout", () => {
      this._tweenSendWaveScale(1, 60);
    });
    this.sendWaveBg.on("pointerdown", () => {
      scene.sound.play("buttonClick", { volume: sfxVol('buttonClick') });
      this._tweenSendWaveScale(0.94, 50, true);
      scene.game.events.emit("send-wave-early");
    });
  }

  /** Store the send-wave button's current display scale as its animation base. */
  _captureSendWaveBaseScale() {
    if (this.sendWaveBg?.active) {
      this._sendWaveBaseScaleX = this.sendWaveBg.scaleX;
      this._sendWaveBaseScaleY = this.sendWaveBg.scaleY;
    }
  }

  /**
   * Scale the send-wave button by `factor` relative to its display-size base
   * scale (the bg image) while scaling the label absolutely (its base is 1).
   */
  _tweenSendWaveScale(factor, duration, yoyo = false) {
    const scene = this.scene;
    const baseX = this._sendWaveBaseScaleX ?? 1;
    const baseY = this._sendWaveBaseScaleY ?? 1;
    if (this.sendWaveBg?.active) {
      scene.tweens.add({
        targets: this.sendWaveBg,
        scaleX: baseX * factor,
        scaleY: baseY * factor,
        duration,
        yoyo,
      });
    }
    if (this.sendWaveText?.active) {
      scene.tweens.add({
        targets: this.sendWaveText,
        scaleX: factor,
        scaleY: factor,
        duration,
        yoyo,
      });
    }
  }

  setSendWaveVisible(visible) {
    this.sendWaveBg.setVisible(visible);
    this.sendWaveText.setVisible(visible);
    this.sendWaveBonusText.setVisible(visible);
    this.sendWaveBonusBg?.setVisible(visible);
    this.sendWaveGlow.setVisible(visible);
    // Phaser can still hit-test interactive objects that are merely invisible.
    // Disable input while a wave is active so a mid-wave tap can't fire
    // send-wave-early (and so kids don't get a confusing "Wait for the wave timer!" toast).
    if (visible) {
      this.sendWaveBg.setInteractive({ useHandCursor: true });
      this._sendWaveGlowTween.resume();
    } else {
      this.sendWaveBg.disableInteractive();
      this._sendWaveGlowTween.pause();
    }
  }

  /** No-op: bonus label uses stroke readability (no backing pill). */
  _fitSendWaveBonusBg() {}

  _showAbilityTooltip(btn, persistent = false) {
    const state = btn.onCooldown ? ' (cooldown)' : btn.unlocked ? '' : ' (locked)';
    const desc = btn.config.description ? `\n${btn.config.description}` : '';
    btn.tooltip.setText(`${btn.config.label}${state}${desc}`);
    btn.tooltip.setVisible(true);
    if (!persistent) return;
    this._openAbilityTooltip = btn;
    this.abilityButtons?.forEach((b) => {
      if (b !== btn) {
        b.tooltip?.setVisible(false);
      }
    });
  }

  _dismissAbilityTooltips() {
    this._openAbilityTooltip = null;
    this.abilityButtons?.forEach((b) => {
      b.tooltip?.setVisible(false);
    });
  }

  dismissTouchTooltips() {
    this._dismissAbilityTooltips();
  }

  _earlyBonusPoints() {
    return GameConfig.earlyWaveBonusPoints ?? 25;
  }

  _earlyBonusLabel() {
    return `+${this._earlyBonusPoints()} BONUS`;
  }

  resetSendWaveLabels() {
    this.sendWaveText.setText("SEND WAVE");
    this.sendWaveBonusText.setText(this._earlyBonusLabel());
    this.sendWaveBonusText.setVisible(true);
    this.sendWaveBonusBg?.setVisible(this.sendWaveBg.visible);
    this._fitSendWaveBonusBg();
  }

  updateSendWaveCooldown({ seconds, isPrep, manualFirstWave }) {
    const setBonus = (text) => {
      this.sendWaveBonusText.setText(text);
      const show = Boolean(text);
      this.sendWaveBonusText.setVisible(show);
      this.sendWaveBonusBg?.setVisible(show && this.sendWaveBg.visible);
      if (show) this._fitSendWaveBonusBg();
    };

    if (!this.sendWaveBg?.visible) {
      if (seconds <= 0) return;
      this.setSendWaveVisible(true);
      this.sendWaveText.setText(`Next in ${seconds}s`);
      setBonus("");
      this._sendWaveGlowTween?.pause();
      return;
    }

    if (manualFirstWave && isPrep) {
      this.sendWaveText.setText("SEND WAVE");
      setBonus(seconds > 0 ? (this._compactPrepText(seconds)) : "Tap when ready!");
      return;
    }

    if (seconds > 0) {
      const betweenWaves = isNextWaveLabel(this.sendWaveText.text);
      if (!betweenWaves) {
        this.sendWaveText.setText("SEND WAVE");
      }
      setBonus(this._compactBonusText(seconds, betweenWaves));
    } else if (isNextWaveLabel(this.sendWaveText.text)) {
      this.sendWaveBonusText.setText(this._earlyBonusLabel());
      this.sendWaveBonusText.setVisible(true);
      this.sendWaveBonusBg?.setVisible(this.sendWaveBg.visible);
      this._fitSendWaveBonusBg();
    } else {
      this.resetSendWaveLabels();
    }
  }

  _compactBonusText(seconds, betweenWaves) {
    const bonus = this._earlyBonusPoints();
    const compact = this.scene._uiMetrics?.ui?.compact;
    if (compact) return `${seconds}s · +${bonus} early`;
    return `Next in ${seconds}s · +${bonus} bonus if you send early`;
  }

  _compactPrepText(seconds) {
    const compact = this.scene._uiMetrics?.ui?.compact;
    return compact ? `${seconds}s prep` : `${seconds}s prep — tap when ready`;
  }

  resetSendWaveBonus() {
    this.sendWaveBonusText.setText(this._earlyBonusLabel());
    this.sendWaveBonusText.setVisible(true);
    this.sendWaveBonusBg?.setVisible(this.sendWaveBg.visible);
    this._fitSendWaveBonusBg();
  }

  startAbilityCooldown(btn, duration) {
    const scene = this.scene;
    if (btn.cooldownTween) btn.cooldownTween.stop();

    btn.onCooldown = true;
    btn.cooldownGfx.setVisible(true);

    btn.cooldownTween = scene.tweens.add({
      targets: { val: 1 },
      val: 0,
      duration,
      onUpdate: (tween) => {
        const cooldownProgress = tween.getValue();
        btn.cooldownGfx.clear();
        btn.cooldownGfx.fillStyle(0x000000, 0.55);
        btn.cooldownGfx.beginPath();
        btn.cooldownGfx.moveTo(btn.circle.x, btn.circle.y);
        const startAngle = -Math.PI / 2;
        const endAngle = startAngle + cooldownProgress * Math.PI * 2;
        btn.cooldownGfx.arc(
          btn.circle.x,
          btn.circle.y,
          btn.circle.radius,
          startAngle,
          endAngle,
          false,
        );
        btn.cooldownGfx.closePath();
        btn.cooldownGfx.fillPath();
      },
      onComplete: () => {
        btn.onCooldown = false;
        btn.cooldownGfx.clear();
        btn.cooldownGfx.setVisible(false);
        btn.cooldownTween = null;
        if (btn.nameLabel?.active && btn.unlocked) {
          btn.nameLabel.setVisible(true);
          btn.nameLabel.setText(abilityReadyLabel(false));
          scene.time.delayedCall(1200, () => {
            if (!btn.nameLabel?.active || btn.onCooldown) return;
            btn.nameLabel.setVisible(false);
            btn.nameLabel.setText('');
          });
        }
      },
    });
    // Show remaining seconds beside the circle while cooling down.
    if (btn.nameLabel?.active) {
      const totalSec = duration / 1000;
      btn.nameLabel.setVisible(true);
      btn.nameLabel.setText(abilityReadyLabel(true, totalSec));
      btn._readyTick = scene.time.addEvent({
        delay: 250,
        repeat: Math.ceil(totalSec * 4),
        callback: () => {
          if (!btn.onCooldown || !btn.nameLabel?.active) {
            btn._readyTick?.remove?.(false);
            btn._readyTick = null;
            return;
          }
          const left = (btn.cooldownTween?.getValue?.() ?? 0) * totalSec;
          btn.nameLabel.setText(abilityReadyLabel(true, left));
        },
      });
    }
  }

  refreshUnlocks() {
    const scene = this.scene;
    this.abilityButtons.forEach((btn) => {
      const unlocked = this._isAbilityUnlocked(btn.config);
      btn.unlocked = unlocked;
      const abilityColor = unlocked ? (ABILITY_COLORS[btn.key] || COLORS.accent) : 0x555555;
      btn.circle.setFillStyle(abilityColor);
      btn.label.setColor(unlocked ? '#FFFFFF' : '#AAAAAA');
      btn.nameLabel?.setColor(unlocked ? TEXT_ON_LIGHT : '#888888');
      if (this._touchMode) {
        setTouchFriendlyCircleHit(btn.circle, 16);
        btn.circle.input.cursor = unlocked ? 'pointer' : 'default';
      } else {
        btn.circle.setInteractive({ useHandCursor: unlocked });
      }
    });
  }

  onAbilityRejected(data) {
    const btn = this.abilityButtons.find((b) => b.key === data.key);
    if (!btn) return;
    btn.pending = false;
    const scene = this.scene;
    showToast(scene, data.reason || 'Ability unavailable');
    scene.tweens.add({
      targets: [btn.circle, btn.label],
      x: btn.circle.x + 6,
      duration: 50,
      yoyo: true,
      repeat: 2,
    });
  }

  onAbilityFired(data) {
    const btn = this.abilityButtons.find((b) => b.key === data.key);
    if (!btn) return;
    btn.pending = false;
    this.startAbilityCooldown(btn, data.cooldown);
  }

  _requestAbility(key, config, btn) {
    const scene = this.scene;
    // Guard against touch double-fire: a second tap before cooldown is recorded
    // (common on iOS) would otherwise emit ability-used twice.
    if (btn.pending) return;
    if (!this._isAbilityUnlocked(config)) {
      scene.game.events.emit('ability-rejected', { key, reason: `Unlocks at Hannah Level ${config.unlockLevel}` });
      return;
    }
    if (btn.onCooldown) {
      scene.game.events.emit('ability-rejected', { key, reason: 'On cooldown' });
      return;
    }

    btn.pending = true;
    scene.tweens.add({
      targets: [btn.circle, btn.label],
      scaleX: 0.9,
      scaleY: 0.9,
      duration: 50,
      yoyo: true,
    });

    scene.game.events.emit("ability-used", { key, config });
    if (config.description) {
      showToast(scene, config.description, 2200);
    }
    scene.time.delayedCall(400, () => {
      if (btn.pending) btn.pending = false;
    });
  }

  applyLayout(m, canonical) {
    const sendDelta = m.sendWaveY - canonical.sendWaveY;
    const sendW = m.ui?.sendWaveWidth ?? 200;
    const compact = m.ui?.compact;
    this._sendWaveObjects?.forEach((obj) => {
      if (obj?.active) obj.setY(obj.getData("layoutY") + sendDelta);
    });
    if (this.sendWaveBg?.active) {
      this.scene.tweens.killTweensOf(this.sendWaveBg);
      this.sendWaveBg.setDisplaySize(sendW, 50);
      this._captureSendWaveBaseScale();
      this.sendWaveGlow?.setPosition(this.sendWaveBg.x, this.sendWaveBg.y);
      this.sendWaveGlow?.setRadius(Math.max(sendW * 0.55, 90));
    }
    if (this.sendWaveBonusBg?.active && this.sendWaveBonusText?.active) {
      this.sendWaveBonusBg.setPosition(this.sendWaveBonusText.x, this.sendWaveBonusText.y);
      this._fitSendWaveBonusBg();
    }
    if (compact && this.sendWaveText?.active) {
      this.sendWaveText.setFontSize('18px');
      // Keep bonus readable on phones — 11px was too small over grass.
      this.sendWaveBonusText?.setFontSize('13px');
      this._fitSendWaveBonusBg();
    }

    const n = this.abilityButtons?.length ?? 0;
    if (n === 0) return;

    const canonicalStart =
      canonical.abilityCenterY - ((n - 1) * canonical.abilitySpacing) / 2;
    const newStart = m.abilityCenterY - ((n - 1) * m.abilityStep) / 2;
    const btnRadius = 36;
    // Keep circles inset from the right so left-side labels stay on-screen.
    const abilityX = Math.min(m.abilityX, GameConfig.canvas.width - 72);

    this.abilityButtons.forEach((btn, idx) => {
      const canonicalY = canonicalStart + idx * canonical.abilitySpacing;
      const newY = newStart + idx * m.abilityStep;
      const deltaY = newY - canonicalY;
      const cy = btn.circle.getData("layoutY") + deltaY;

      btn.circle.setPosition(abilityX, cy);
      btn.label.setPosition(abilityX, btn.label.getData("layoutY") + deltaY);
      const labelX = abilityX - btnRadius - 10;
      btn.nameLabel?.setPosition(labelX, cy);
      btn.tooltip.setPosition(labelX, cy);
      if (btn.cooldownGfx?.active) {
        btn.cooldownGfx.setPosition(0, 0);
      }
    });
  }

  destroy() {
    this._sendWaveGlowTween?.stop();
    this._sendWaveGlowTween = null;
    this._abilityObjects?.forEach((o) => o?.destroy?.());
    this._sendWaveObjects?.forEach((o) => o?.destroy?.());
  }
}
