import { GameConfig } from "../config.js";
import { setTouchFriendlyCircleHit } from "../utils/battleInput.js";

const COLORS = GameConfig.colors;
const HUD_DEPTH = 200;

export function formatWaveHudLabel(wave, total) {
  if (total == null) return `Wave: ${wave} ♾`;
  return `Wave: ${wave} / ${total}`;
}

export class BattleHud {
  /** @param {import("../scenes/UIScene.js").UIScene} scene */
  constructor(scene) {
    this.scene = scene;
    this.heartIcons = [];
    this._lowHealthTimer = null;
  }

  create(width) {
    const scene = this.scene;
    const hudDepth = HUD_DEPTH;
    this._hudWidth = width;
    this._hudRow1Y = 42;
    this._hudRow2Y = 74;
    const row1Y = this._hudRow1Y;
    const row2Y = this._hudRow2Y;

    const maxIcons = Math.min(scene.lives, 8);
    const heartSpacing = 22;
    const startX = 20;

    for (let i = 0; i < maxIcons; i++) {
      const heart = scene.add
        .image(startX + i * heartSpacing, row1Y, "heartIcon")
        .setDisplaySize(22, 22)
        .setDepth(hudDepth);
      heart.setData('layoutY', row1Y);
      this.heartIcons.push(heart);
    }

    const livesX = startX + maxIcons * heartSpacing + (maxIcons > 0 ? 8 : 0);
    this.livesText = scene.add
      .text(livesX, row1Y - 10, this.livesLabel(), {
        fontFamily: "Kenney Future",
        fontSize: "20px",
        color: "#FFF9E6",
        shadow: { offsetX: 1, offsetY: 1, color: "#000", blur: 2, fill: true },
      })
      .setDepth(hudDepth);

    this.startLowHealthPulse();

    const wavePanelX = width / 2;
    this.wavePanel = scene.add
      .rectangle(wavePanelX, row2Y, 240, 44, 0x000000, 0.45)
      .setStrokeStyle(2, COLORS.outline)
      .setDepth(hudDepth);
    this.wavePanel.setOrigin(0.5);

    this.waveText = scene.add
      .text(wavePanelX, row2Y - 16, formatWaveHudLabel(0, scene.totalWaves), {
        fontFamily: "Kenney Future",
        fontSize: "22px",
        color: "#FFD700",
        shadow: { offsetX: 1, offsetY: 1, color: "#000", blur: 3, fill: true },
      })
      .setOrigin(0.5, 0)
      .setDepth(hudDepth);

    const barWidth = 180;
    const barY = row2Y + 12;
    this.waveBarBg = scene.add
      .rectangle(wavePanelX, barY, barWidth, 8, 0x333333, 0.7)
      .setOrigin(0.5)
      .setDepth(hudDepth);
    this.waveBarFill = scene.add
      .rectangle(wavePanelX - barWidth / 2, barY, 0, 8, 0x4caf50, 1)
      .setOrigin(0, 0.5)
      .setDepth(hudDepth);
    this.waveBarWidth = barWidth;

    this._createTopRightControls(width, row1Y, hudDepth);
    this._canonicalRow1Y = row1Y;
    this._canonicalRow2Y = row2Y;
    this._trackHudY(this.livesText, row1Y - 10);
    this._trackHudY(this.pauseBtn, row1Y);
    this._trackHudY(this.pauseLabel, row1Y);
    this._trackHudY(this.pauseHint, row1Y + 24);
    this._trackHudY(this.speedBtn, row1Y);
    this._trackHudY(this.speedLabel, row1Y);
    this._trackHudY(this.speedHint, row1Y + 24);
    this._trackHudY(this.sunPanel, row1Y);
    this._trackHudY(this._hudStarIcon, row1Y);
    this._trackHudY(this.pointsText, row1Y - 10);
    this._trackHudY(this.wavePanel, row2Y);
    this._trackHudY(this.waveText, row2Y - 16);
    this._trackHudY(this.waveBarBg, row2Y + 12);
    this._trackHudY(this.waveBarFill, row2Y + 12);
  }

  _trackHudY(obj, y) {
    if (obj) obj.setData('layoutY', y);
  }

  applyLayout(m) {
    if (m.hudRow1Y == null) return;
    const row1Delta = m.hudRow1Y - this._canonicalRow1Y;
    const row2Delta = m.hudRow2Y - this._canonicalRow2Y;

    this.heartIcons.forEach((h) => {
      if (h?.active) h.setY(h.getData('layoutY') + row1Delta);
    });
    if (this.livesText?.active) this.livesText.setY(this.livesText.getData('layoutY') + row1Delta);
    if (this.wavePanel?.active) this.wavePanel.setY(this.wavePanel.getData('layoutY') + row2Delta);
    if (this.waveText?.active) this.waveText.setY(this.waveText.getData('layoutY') + row2Delta);
    if (this.waveBarBg?.active) this.waveBarBg.setY(this.waveBarBg.getData('layoutY') + row2Delta);
    if (this.waveBarFill?.active) this.waveBarFill.setY(this.waveBarFill.getData('layoutY') + row2Delta);

    for (const key of ['pauseBtn', 'pauseLabel', 'pauseHint', 'speedBtn', 'speedLabel', 'speedHint', 'sunPanel', '_hudStarIcon', 'pointsText']) {
      const obj = this[key];
      if (obj?.active && obj.getData('layoutY') != null) {
        obj.setY(obj.getData('layoutY') + row1Delta);
      }
    }

    if (m.hudPauseX != null) {
      this._repositionTopRight(m.hudRow1Y, m.hudPauseX, m.hudSpeedX, m.hudSunPanelX);
    }

    this._hudRow1Y = m.hudRow1Y;
    this._hudRow2Y = m.hudRow2Y;
  }

  pulseWavePanel() {
    const scene = this.scene;
    if (!this.wavePanel?.active) return;
    scene.tweens.add({
      targets: this.wavePanel,
      scaleX: 1.06,
      scaleY: 1.06,
      duration: 150,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
  }

  _createTopRightControls(width, row1Y, hudDepth) {
    const scene = this.scene;
    const rightMargin = 16;
    const btnGap = 8;
    const btnR = 22;

    const pauseX = width - rightMargin - btnR;
    const speedX = pauseX - btnR * 2 - btnGap;

    const touch = scene.sys.game.device.input.touch;
    this._touchMode = touch;

    this.pauseBtn = scene.add
      .circle(pauseX, row1Y, btnR, COLORS.button)
      .setStrokeStyle(2, COLORS.outline)
      .setDepth(hudDepth);
    if (touch) {
      setTouchFriendlyCircleHit(this.pauseBtn, 16);
      this.pauseBtn.input.cursor = 'pointer';
    } else {
      this.pauseBtn.setInteractive({ useHandCursor: true });
    }
    this.pauseLabel = scene.add
      .text(pauseX, row1Y, "⏸", {
        fontFamily: "Kenney Future",
        fontSize: "16px",
        color: "#4A2C0A",
      })
      .setOrigin(0.5)
      .setDepth(hudDepth);
    this.pauseHint = scene.add
      .text(pauseX, row1Y + btnR + 2, "Pause", {
        fontFamily: "Kenney Future",
        fontSize: "9px",
        color: "#FFF9E6",
        shadow: { offsetX: 1, offsetY: 1, color: "#000", blur: 2, fill: true },
      })
      .setOrigin(0.5, 0)
      .setDepth(hudDepth);

    this.speedBtn = scene.add
      .circle(speedX, row1Y, btnR, COLORS.button)
      .setStrokeStyle(2, COLORS.outline)
      .setDepth(hudDepth);
    if (touch) {
      setTouchFriendlyCircleHit(this.speedBtn, 16);
      this.speedBtn.input.cursor = 'pointer';
    } else {
      this.speedBtn.setInteractive({ useHandCursor: true });
    }
    this.speedLabel = scene.add
      .text(speedX, row1Y, "×1", {
        fontFamily: "Kenney Future",
        fontSize: "14px",
        color: "#4A2C0A",
      })
      .setOrigin(0.5)
      .setDepth(hudDepth);
    this.speedHint = scene.add
      .text(speedX, row1Y + btnR + 2, "Speed", {
        fontFamily: "Kenney Future",
        fontSize: "9px",
        color: "#FFF9E6",
        shadow: { offsetX: 1, offsetY: 1, color: "#000", blur: 2, fill: true },
      })
      .setOrigin(0.5, 0)
      .setDepth(hudDepth);
    this._battleSpeed = 1;

    const sunPanelRight = speedX - btnR - 12;
    const sunPanelW = 108;
    const sunPanelX = sunPanelRight - sunPanelW / 2;
    this.sunPanel = scene.add
      .rectangle(sunPanelX, row1Y, sunPanelW, 34, 0x000000, 0.5)
      .setStrokeStyle(2, COLORS.outline)
      .setDepth(hudDepth - 1);

    this._hudStarIcon = scene.add
      .image(sunPanelX - sunPanelW / 2 + 18, row1Y, "ui_uiStar")
      .setDisplaySize(22, 22)
      .setTint(0xffd700)
      .setDepth(hudDepth);
    this.pointsText = scene.add
      .text(sunPanelX - sunPanelW / 2 + 32, row1Y - 10, `${scene.sunshinePoints}`, {
        fontFamily: "Kenney Future",
        fontSize: "22px",
        color: "#FFD700",
        shadow: { offsetX: 1, offsetY: 1, color: "#000", blur: 2, fill: true },
      })
      .setDepth(hudDepth);

    const speedTooltip = scene.add
      .text(speedX, row1Y - btnR - 6, "Toggle 1× / 2× speed", {
        fontFamily: "Kenney Future",
        fontSize: "10px",
        color: "#FFFFFF",
        backgroundColor: "#000000cc",
        padding: { x: 6, y: 3 },
      })
      .setOrigin(0.5, 1)
      .setVisible(false)
      .setDepth(hudDepth + 1);

    const toggleSpeed = () => {
      this._battleSpeed = this._battleSpeed === 1 ? 2 : 1;
      this.speedLabel.setText(`×${this._battleSpeed}`);
      scene.game.events.emit("battle-speed-changed", { speed: this._battleSpeed });
      scene.sound.play("buttonClick", { volume: GameConfig.audio.sfxVolume });
    };

    const togglePause = () => {
      scene.game.events.emit("toggle-pause");
      scene.sound.play("buttonClick", { volume: GameConfig.audio.sfxVolume * 0.8 });
    };

    if (!touch) {
      this.speedBtn.on("pointerover", () => speedTooltip.setVisible(true));
      this.speedBtn.on("pointerout", () => speedTooltip.setVisible(false));
    }
    this.speedBtn.on("pointerdown", toggleSpeed);

    this.pauseBtn.on("pointerdown", togglePause);
    // Labels sit on top of circles — wire them so taps on the icon text still work.
    for (const label of [this.pauseLabel, this.pauseHint, this.speedLabel, this.speedHint]) {
      label.setInteractive({ useHandCursor: true });
      label.on("pointerdown", label === this.speedLabel || label === this.speedHint ? toggleSpeed : togglePause);
    }

    this._canonicalPauseX = pauseX;
    this._canonicalSpeedX = speedX;
    this._canonicalSunPanelX = sunPanelX;
    this._sunPanelW = sunPanelW;
    this._speedTooltip = speedTooltip;
  }

  _repositionTopRight(row1Y, pauseX, speedX, sunPanelX) {
    const sunPanelW = this._sunPanelW ?? 108;
    this.pauseBtn?.setPosition(pauseX, row1Y);
    this.pauseLabel?.setPosition(pauseX, row1Y);
    this.pauseHint?.setPosition(pauseX, row1Y + 24);
    this.speedBtn?.setPosition(speedX, row1Y);
    this.speedLabel?.setPosition(speedX, row1Y);
    this.speedHint?.setPosition(speedX, row1Y + 24);
    this._speedTooltip?.setPosition(speedX, row1Y - 28);
    this.sunPanel?.setPosition(sunPanelX, row1Y);
    this._hudStarIcon?.setPosition(sunPanelX - sunPanelW / 2 + 18, row1Y);
    this.pointsText?.setPosition(sunPanelX - sunPanelW / 2 + 32, row1Y - 10);
  }

  resetSpeed() {
    this._battleSpeed = 1;
    if (this.speedLabel?.active) this.speedLabel.setText("×1");
  }

  startLowHealthPulse() {
    const scene = this.scene;
    if (this._lowHealthTimer) {
      this._lowHealthTimer.remove(false);
      this._lowHealthTimer = null;
    }
    if (scene.lives <= 5 && scene.lives > 0) {
      this._lowHealthTimer = scene.time.addEvent({
        delay: 2000,
        loop: true,
        callback: () => {
          this.heartIcons.forEach((h, i) => {
            if (i < scene.lives && h.visible) {
              scene.tweens.add({
                targets: h,
                scaleX: 1.3,
                scaleY: 1.3,
                duration: 200,
                yoyo: true,
              });
            }
          });
        },
      });
    }
  }

  animateHeartLoss(index) {
    const scene = this.scene;
    const heart = this.heartIcons[index];
    if (!heart) return;

    scene.tweens.add({
      targets: heart,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 150,
      yoyo: true,
      onComplete: () => {
        scene.tweens.add({
          targets: heart,
          scaleX: 0,
          scaleY: 0,
          alpha: 0,
          duration: 300,
          ease: "Back.easeIn",
          onComplete: () => heart.setVisible(false),
        });
      },
    });
  }

  animatePointsChange(delta) {
    const scene = this.scene;
    scene.tweens.add({
      targets: this.pointsText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 100,
      yoyo: true,
      ease: "Quad.easeOut",
      onStart: () => this.pointsText.setColor("#FFFFAA"),
      onComplete: () => this.pointsText.setColor("#FFD700"),
    });

    if (delta > 0) {
      const floater = scene.add
        .text(
          this.pointsText.x + this.pointsText.width / 2,
          this.pointsText.y - 4,
          `+${delta}`,
          {
            fontFamily: "Kenney Future",
            fontSize: "16px",
            color: "#FFFF00",
            shadow: {
              offsetX: 1,
              offsetY: 1,
              color: "#000",
              blur: 2,
              fill: true,
            },
          },
        )
        .setOrigin(0.5, 1);

      scene.tweens.add({
        targets: floater,
        y: floater.y - 30,
        alpha: 0,
        duration: 800,
        ease: "Quad.easeOut",
        onComplete: () => floater.destroy(),
      });
    }
  }

  animatePointsRejected() {
    const scene = this.scene;
    scene.tweens.add({
      targets: this.pointsText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 60,
      yoyo: true,
      repeat: 2,
      ease: "Sine.easeInOut",
      onStart: () => this.pointsText.setColor("#FF6666"),
      onComplete: () => this.pointsText.setColor("#FFD700"),
    });
  }

  livesLabel() {
    const maxIcons = this.heartIcons.length;
    return this.scene.lives > maxIcons ? `×${this.scene.lives}` : `${this.scene.lives}`;
  }

  updateHearts() {
    for (let i = 0; i < this.heartIcons.length; i++) {
      const heart = this.heartIcons[i];
      heart.setVisible(i < this.scene.lives);
      heart.setScale(1);
      heart.setAlpha(1);
    }
  }

  updateWaveProgress() {
    const scene = this.scene;
    if (scene.enemiesInWave <= 0) return;
    const ratio = Math.min(scene.enemiesDefeated / scene.enemiesInWave, 1);
    this.waveBarFill.setSize(this.waveBarWidth * ratio, 8);
  }

  destroy() {
    if (this._lowHealthTimer) {
      this._lowHealthTimer.remove(false);
      this._lowHealthTimer = null;
    }
  }
}
