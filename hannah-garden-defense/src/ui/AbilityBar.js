import { GameConfig } from "../config.js";

const COLORS = GameConfig.colors;

const ABILITY_COLORS = {
  SUNSHINE_BURST: 0xffd700,
  GARDEN_RAIN: 0x4da6ff,
  RAINBOW_SHIELD: 0x4caf50,
  FLOWER_BOMB: 0xff69b4,
};

const ABILITY_ICONS = {
  SUNSHINE_BURST: "☀",
  GARDEN_RAIN: "🌧",
  RAINBOW_SHIELD: "🛡",
  FLOWER_BOMB: "💣",
};

export class AbilityBar {
  /** @param {import("../scenes/UIScene.js").UIScene} scene */
  constructor(scene) {
    this.scene = scene;
    this.abilityButtons = [];
    this._abilityObjects = [];
    this._sendWaveObjects = [];
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
    const btnRadius = 32;
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
          .setStrokeStyle(3, COLORS.outline)
          .setInteractive({ useHandCursor: unlocked }),
        y,
      );

      const icon = ABILITY_ICONS[key] || config.label.charAt(0);
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
        ? config.label
        : `${config.label} (Lv.${config.unlockLevel})`;
      const tooltip = trackY(
        scene.add
          .text(x, y + btnRadius + 8, tooltipText, {
            fontFamily: "Kenney Future",
            fontSize: "9px",
            color: "#FFFFFF",
            backgroundColor: "#000000aa",
            padding: { x: 4, y: 2 },
          })
          .setOrigin(0.5, 0)
          .setVisible(false),
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
        tooltip.setVisible(true);
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
        tooltip.setVisible(false);
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

    this.sendWaveBonusText = trackY(
      scene.add
        .text(x, y + 20, "+10 BONUS", {
          fontFamily: "Kenney Future",
          fontSize: "12px",
          color: "#FFD700",
          shadow: { offsetX: 1, offsetY: 1, color: "#000", blur: 2, fill: true },
        })
        .setOrigin(0.5, 0)
        .setDepth(10),
      y + 20,
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
        targets: [this.sendWaveBg, this.sendWaveText, this.sendWaveBonusText],
        scaleX: 1.08,
        scaleY: 1.08,
        duration: 60,
      });
    });
    this.sendWaveBg.on("pointerout", () => {
      scene.tweens.add({
        targets: [this.sendWaveBg, this.sendWaveText, this.sendWaveBonusText],
        scaleX: 1,
        scaleY: 1,
        duration: 60,
      });
    });
    this.sendWaveBg.on("pointerdown", () => {
      scene.sound.play("buttonClick", { volume: GameConfig.audio.sfxVolume });
      scene.tweens.add({
        targets: [this.sendWaveBg, this.sendWaveText, this.sendWaveBonusText],
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
    this.sendWaveGlow.setVisible(visible);
    if (visible) {
      this._sendWaveGlowTween.resume();
    } else {
      this._sendWaveGlowTween.pause();
    }
  }

  resetSendWaveLabels() {
    this.sendWaveText.setText("SEND WAVE");
    this.sendWaveBonusText.setText("+10 BONUS");
  }

  updateSendWaveCooldown({ seconds, isPrep, manualFirstWave }) {
    if (!this.sendWaveBg?.visible) {
      if (seconds <= 0) return;
      this.sendWaveBg.setVisible(true);
      this.sendWaveText.setVisible(true);
      this.sendWaveBonusText.setVisible(true);
      this.sendWaveText.setText(`Next in ${seconds}s`);
      this.sendWaveBonusText.setText("");
      this._sendWaveGlowTween?.pause();
      return;
    }

    if (manualFirstWave && isPrep) {
      this.sendWaveText.setText("SEND WAVE");
      this.sendWaveBonusText.setText(
        seconds > 0 ? `${seconds}s prep — tap when ready` : "Tap when ready!",
      );
      return;
    }

    if (seconds > 0) {
      if (this.sendWaveText.text !== "NEXT WAVE") {
        this.sendWaveText.setText("SEND WAVE");
      }
      this.sendWaveBonusText.setText(`Next in ${seconds}s · +10 BONUS`);
    } else {
      this.resetSendWaveLabels();
    }
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

  onAbilityFired(data) {
    const btn = this.abilityButtons.find((b) => b.key === data.key);
    if (!btn) return;
    btn.pending = false;
    this.startAbilityCooldown(btn, data.cooldown);
  }

  _requestAbility(key, config, btn) {
    const scene = this.scene;
    if (!this._isAbilityUnlocked(config) || btn.onCooldown) return;

    scene.tweens.add({
      targets: [btn.circle, btn.label],
      scaleX: 0.9,
      scaleY: 0.9,
      duration: 50,
      yoyo: true,
    });

    scene.game.events.emit("ability-used", { key, config });
    btn.pending = true;
    scene.time.delayedCall(50, () => {
      if (btn.pending) btn.pending = false;
    });
  }

  applyLayout(m, canonical) {
    const sendDelta = m.sendWaveY - canonical.sendWaveY;
    this._sendWaveObjects?.forEach((obj) => {
      if (obj?.active) obj.setY(obj.getData("layoutY") + sendDelta);
    });

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
    });
  }
}
