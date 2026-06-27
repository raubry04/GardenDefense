import { GameConfig } from "../config.js";
import { sfxVol } from "../utils/audioMix.js";
import { setTouchFriendlyCircleHit } from "../utils/battleInput.js";
import { showToast } from "./Toast.js";

const COLORS = GameConfig.colors;

const ABILITY_COLORS = {
  SUNSHINE_BURST: 0xffd700,
  GARDEN_RAIN: 0x4da6ff,
  RAINBOW_SHIELD: 0x4caf50,
  FLOWER_BOMB: 0xff69b4,
};

const ABILITY_LABELS = {
  SUNSHINE_BURST: 'S',
  GARDEN_RAIN: 'R',
  RAINBOW_SHIELD: 'D',
  FLOWER_BOMB: 'F',
};

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
    const abilities = Object.entries(GameConfig.hannahAbilities);
    const btnRadius = 36;
    const spacing = 80;
    const startY = height / 2 - ((abilities.length - 1) * spacing) / 2;
    const x = width - 50;
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

      const circle = trackY(
        scene.add
          .circle(x, y, btnRadius, abilityColor)
          .setStrokeStyle(3, COLORS.outline),
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
            fontSize: "24px",
            color: unlocked ? "#FFFFFF" : "#AAAAAA",
            shadow: {
              offsetX: 1,
              offsetY: 1,
              color: "#000",
              blur: 2,
              fill: true,
            },
          })
          .setOrigin(0.5),
        y,
      );

      const tooltipText = unlocked
        ? `${config.label}\n${config.description || ''}`
        : `${config.label} (Lv.${config.unlockLevel})`;
      const tooltip = trackY(
        scene.add
          .text(x, y + btnRadius + 8, tooltipText, {
            fontFamily: "Kenney Future",
            fontSize: "9px",
            color: "#FFFFFF",
            backgroundColor: "#000000aa",
            padding: { x: 4, y: 2 },
            align: 'center',
            wordWrap: { width: 120 },
          })
          .setOrigin(0.5, 0)
          .setVisible(this._touchMode),
        y + btnRadius + 8,
      );

      const cooldownGfx = scene.add.graphics();
      cooldownGfx.setVisible(false);
      this._abilityObjects.push(cooldownGfx);

      const btn = {
        circle,
        label,
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
        this._requestAbility(key, config, btn);
      });
      label.setInteractive({ useHandCursor: unlocked });
      label.on("pointerdown", () => {
        if (!unlocked) return;
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

    const bonusY = y + 34;
    this.sendWaveBonusBg = trackY(
      scene.add
        .rectangle(x, bonusY + 8, 280, 22, 0x000000, 0.65)
        .setStrokeStyle(1, 0x4a2c0a, 0.5)
        .setDepth(10),
      bonusY + 8,
    );

    this.sendWaveBonusText = trackY(
      scene.add
        .text(x, bonusY, "+10 BONUS", {
          fontFamily: "Kenney Future",
          fontSize: "12px",
          color: "#FFF9E6",
          shadow: { offsetX: 1, offsetY: 1, color: "#000", blur: 2, fill: true },
        })
        .setOrigin(0.5, 0)
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
      scene.tweens.add({
        targets: [this.sendWaveBg, this.sendWaveText],
        scaleX: 1.08,
        scaleY: 1.08,
        duration: 60,
      });
    });
    this.sendWaveBg.on("pointerout", () => {
      scene.tweens.add({
        targets: [this.sendWaveBg, this.sendWaveText],
        scaleX: 1,
        scaleY: 1,
        duration: 60,
      });
    });
    this.sendWaveBg.on("pointerdown", () => {
      scene.sound.play("buttonClick", { volume: sfxVol('buttonClick') });
      scene.tweens.add({
        targets: [this.sendWaveBg, this.sendWaveText],
        scaleX: 0.94,
        scaleY: 0.94,
        duration: 50,
        yoyo: true,
      });
      scene.game.events.emit("send-wave-early");
    });
  }

  setSendWaveVisible(visible) {
    this.sendWaveBg.setVisible(visible);
    this.sendWaveText.setVisible(visible);
    this.sendWaveBonusText.setVisible(visible);
    this.sendWaveBonusBg?.setVisible(visible);
    this.sendWaveGlow.setVisible(visible);
    if (visible) {
      this._sendWaveGlowTween.resume();
    } else {
      this._sendWaveGlowTween.pause();
    }
  }

  _showAbilityTooltip(btn, persistent = false) {
    const state = btn.onCooldown ? ' (cooldown)' : btn.unlocked ? '' : ' (locked)';
    const desc = btn.config.description ? `\n${btn.config.description}` : '';
    btn.tooltip.setText(`${btn.config.label}${state}${desc}`);
    btn.tooltip.setVisible(true);
    if (!persistent) return;
    this._openAbilityTooltip = btn;
  }

  _dismissAbilityTooltips() {
    this._openAbilityTooltip = null;
    this.abilityButtons?.forEach((b) => b.tooltip?.setVisible(false));
  }

  dismissTouchTooltips() {
    this._dismissAbilityTooltips();
  }

  resetSendWaveLabels() {
    this.sendWaveText.setText("SEND WAVE");
    this.sendWaveBonusText.setText("+10 BONUS");
    this.sendWaveBonusText.setVisible(true);
    this.sendWaveBonusBg?.setVisible(this.sendWaveBg.visible);
  }

  updateSendWaveCooldown({ seconds, isPrep, manualFirstWave }) {
    const setBonus = (text) => {
      this.sendWaveBonusText.setText(text);
      const show = Boolean(text);
      this.sendWaveBonusText.setVisible(show);
      this.sendWaveBonusBg?.setVisible(show && this.sendWaveBg.visible);
    };

    if (!this.sendWaveBg?.visible) {
      if (seconds <= 0) return;
      this.sendWaveBg.setVisible(true);
      this.sendWaveText.setVisible(true);
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
      this.sendWaveBonusText.setText("+10 BONUS");
      this.sendWaveBonusText.setVisible(true);
      this.sendWaveBonusBg?.setVisible(this.sendWaveBg.visible);
    } else {
      this.resetSendWaveLabels();
    }
  }

  _compactBonusText(seconds, betweenWaves) {
    const compact = this.scene._uiMetrics?.ui?.compact;
    if (compact) return `${seconds}s · +10 early`;
    return `Next in ${seconds}s · +10 bonus if you send early`;
  }

  _compactPrepText(seconds) {
    const compact = this.scene._uiMetrics?.ui?.compact;
    return compact ? `${seconds}s prep` : `${seconds}s prep — tap when ready`;
  }

  resetSendWaveBonus() {
    this.sendWaveBonusText.setText("+10 BONUS");
    this.sendWaveBonusText.setVisible(true);
    this.sendWaveBonusBg?.setVisible(this.sendWaveBg.visible);
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
      },
    });
  }

  refreshUnlocks() {
    const scene = this.scene;
    this.abilityButtons.forEach((btn) => {
      const unlocked = this._isAbilityUnlocked(btn.config);
      btn.unlocked = unlocked;
      const abilityColor = unlocked ? (ABILITY_COLORS[btn.key] || COLORS.accent) : 0x555555;
      btn.circle.setFillStyle(abilityColor);
      btn.label.setColor(unlocked ? '#FFFFFF' : '#AAAAAA');
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
    if (!this._isAbilityUnlocked(config)) {
      scene.game.events.emit('ability-rejected', { key, reason: `Unlocks at Hannah Level ${config.unlockLevel}` });
      return;
    }
    if (btn.onCooldown) {
      scene.game.events.emit('ability-rejected', { key, reason: 'On cooldown' });
      return;
    }

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
    btn.pending = true;
    scene.time.delayedCall(50, () => {
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
      this.sendWaveBg.setDisplaySize(sendW, 50);
      this.sendWaveGlow?.setPosition(this.sendWaveBg.x, this.sendWaveBg.y);
      this.sendWaveGlow?.setRadius(Math.max(sendW * 0.55, 90));
    }
    if (this.sendWaveBonusBg?.active && this.sendWaveBg?.active) {
      this.sendWaveBonusBg.setSize(sendW + 40, 22);
      this.sendWaveBonusBg.setPosition(this.sendWaveBg.x, this.sendWaveBonusBg.y);
    }
    if (compact && this.sendWaveText?.active) {
      this.sendWaveText.setFontSize('18px');
      this.sendWaveBonusText?.setFontSize('10px');
    }

    const n = this.abilityButtons?.length ?? 0;
    if (n === 0) return;

    const canonicalStart =
      canonical.abilityCenterY - ((n - 1) * canonical.abilitySpacing) / 2;
    const newStart = m.abilityCenterY - ((n - 1) * m.abilityStep) / 2;

    this.abilityButtons.forEach((btn, idx) => {
      const canonicalY = canonicalStart + idx * canonical.abilitySpacing;
      const newY = newStart + idx * m.abilityStep;
      const deltaY = newY - canonicalY;

      btn.circle.setPosition(m.abilityX, btn.circle.getData("layoutY") + deltaY);
      btn.label.setPosition(m.abilityX, btn.label.getData("layoutY") + deltaY);
      btn.tooltip.setPosition(m.abilityX, btn.tooltip.getData("layoutY") + deltaY);
      if (btn.cooldownGfx?.active) {
        btn.cooldownGfx.setPosition(m.abilityX, btn.circle.y);
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
