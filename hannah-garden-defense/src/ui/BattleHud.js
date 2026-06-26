import { GameConfig } from "../config.js";

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

    this._hudStarIcon = scene.add
      .image(width - 116, row1Y, "ui_uiStar")
      .setDisplaySize(24, 24)
      .setTint(0xffd700)
      .setDepth(hudDepth);
    this.pointsText = scene.add
      .text(width - 98, row1Y - 10, `${scene.sunshinePoints}`, {
        fontFamily: "Kenney Future",
        fontSize: "22px",
        color: "#FFD700",
        shadow: { offsetX: 1, offsetY: 1, color: "#000", blur: 2, fill: true },
      })
      .setDepth(hudDepth);

    const pauseX = width - 28;
    this.speedBtn = scene.add
      .circle(pauseX - 44, row1Y, 18, COLORS.button)
      .setStrokeStyle(2, COLORS.outline)
      .setInteractive({ useHandCursor: true })
      .setDepth(hudDepth);
    this.speedLabel = scene.add
      .text(pauseX - 44, row1Y, "1x", {
        fontFamily: "Kenney Future",
        fontSize: "13px",
        color: "#4A2C0A",
      })
      .setOrigin(0.5)
      .setDepth(hudDepth);
    this._battleSpeed = 1;
    this.speedBtn.on("pointerdown", () => {
      this._battleSpeed = this._battleSpeed === 1 ? 2 : 1;
      this.speedLabel.setText(`${this._battleSpeed}x`);
      scene.game.events.emit("battle-speed-changed", { speed: this._battleSpeed });
      scene.sound.play("buttonClick", { volume: GameConfig.audio.sfxVolume });
    });

    this.pauseBtn = scene.add
      .circle(pauseX, row1Y, 18, COLORS.button)
      .setStrokeStyle(2, COLORS.outline)
      .setInteractive({ useHandCursor: true })
      .setDepth(hudDepth);
    this.pauseLabel = scene.add
      .text(pauseX, row1Y, "⏸", {
        fontFamily: "Kenney Future",
        fontSize: "16px",
        color: "#4A2C0A",
      })
      .setOrigin(0.5)
      .setDepth(hudDepth);
    this.pauseBtn.on("pointerdown", () => {
      scene.game.events.emit("toggle-pause");
    });
  }

  resetSpeed() {
    this._battleSpeed = 1;
    if (this.speedLabel?.active) this.speedLabel.setText("1x");
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
