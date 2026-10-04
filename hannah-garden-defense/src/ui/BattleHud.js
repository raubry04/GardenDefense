import { GameConfig } from "../config.js";
import { setTouchFriendlyCircleHit } from "../utils/battleInput.js";
import {
  TEXT_ON_LIGHT,
  TEXT_GARDEN,
  TEXT_GOLD,
  readableHudStyle,
  readableCaptionStyle,
} from "../utils/textReadability.js";
import {
  projectedStarsFromLives,
  starMeterHint,
} from "../utils/starRating.js";
import {
  resolveBattleModifiers,
  battleModifierLabel,
} from "../utils/battleModifiers.js";

const COLORS = GameConfig.colors;
const HUD_DEPTH = 200;
/** On-screen heart icon size (heartIcon texture is 32×32; display via setDisplaySize). */
const HEART_DISPLAY = 22;

export function formatWaveHudLabel(wave, total) {
  if (total == null) return `Wave: ${wave} ♾`;
  return `Wave: ${wave} / ${total}`;
}

export { projectedStarsFromLives, starMeterHint };

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
    const livesPadX = 8;
    const livesGap = 6;

    for (let i = 0; i < maxIcons; i++) {
      const heart = scene.add
        .image(startX + i * heartSpacing, row1Y, "heartIcon")
        .setDisplaySize(HEART_DISPLAY, HEART_DISPLAY)
        .setDepth(hudDepth);
      heart.setData('layoutY', row1Y);
      // Capture display-size base so pulse/loss tweens stay relative (absolute
      // scale 1 would restore the native 32px texture after a life update).
      heart.setData('baseScaleX', heart.scaleX);
      heart.setData('baseScaleY', heart.scaleY);
      this.heartIcons.push(heart);
    }

    this.livesText = scene.add
      .text(0, row1Y - 10, this.livesLabel(), {
        ...readableHudStyle('24px', TEXT_ON_LIGHT),
      })
      .setDepth(hudDepth);
    this._livesPadX = livesPadX;
    this._livesGap = livesGap;
    this._livesStartX = startX;
    this._livesHeartSpacing = heartSpacing;
    // Invisible layout/hit anchor — no cream backing box.
    this.livesPanel = scene.add
      .rectangle(startX, row1Y, 40, 36, 0x000000, 0)
      .setDepth(hudDepth - 1);
    this.resizeLivesPanelToContent();

    this._starMeterHearts = [];
    const meterY = row1Y + 28;
    const meterHeartSize = 14;
    const meterHeartGap = 15;
    const meterPadX = 8;
    const meterText = starMeterHint(scene.lives);
    this.starMeterText = scene.add
      .text(0, meterY, meterText, {
        ...readableCaptionStyle('13px', TEXT_GARDEN),
      })
      .setOrigin(0, 0.5)
      .setDepth(hudDepth);
    const starsShown = Math.min(3, Math.max(0, projectedStarsFromLives(scene.lives)));
    for (let i = 0; i < 3; i++) {
      const hx = startX + meterPadX + meterHeartSize / 2 + i * meterHeartGap;
      const heart = scene.add
        .image(hx, meterY, "heartIcon")
        .setDisplaySize(meterHeartSize, meterHeartSize)
        .setDepth(hudDepth)
        .setAlpha(i < starsShown ? 1 : 0.28);
      heart.setData("layoutY", meterY);
      this._starMeterHearts.push(heart);
    }
    const heartsW = 3 * meterHeartGap;
    const textX = startX + meterPadX + heartsW + 4;
    this.starMeterText.setPosition(textX, meterY);
    const meterW = Math.ceil(
      meterPadX + heartsW + 4 + this.starMeterText.width + meterPadX,
    );
    // Invisible layout anchor only.
    this.starMeterPanel = scene.add
      .rectangle(startX + meterW / 2, meterY, meterW, 22, 0x000000, 0)
      .setDepth(hudDepth - 1);
    this._starMeterPadX = meterPadX;
    this._starMeterHeartGap = meterHeartGap;
    this._starMeterStartX = startX;

    this.startLowHealthPulse();

    const wavePanelX = width / 2;
    this._waveCenterX = wavePanelX;
    // Invisible layout anchor — wave text uses cream stroke for readability.
    this.wavePanel = scene.add
      .rectangle(wavePanelX, row2Y, 248, 48, 0x000000, 0)
      .setDepth(hudDepth);
    this.wavePanel.setOrigin(0.5);

    this.waveText = scene.add
      .text(wavePanelX, row2Y - 18, formatWaveHudLabel(0, scene.totalWaves), {
        ...readableHudStyle('26px', TEXT_GARDEN),
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

    const mods = resolveBattleModifiers(scene.zone ?? 0, scene.battle ?? 0);
    const modLabel = battleModifierLabel(mods);
    if (modLabel) {
      this.modifierText = scene.add
        .text(wavePanelX, row2Y + 28, modLabel, {
          ...readableCaptionStyle('13px', TEXT_GARDEN),
        })
        .setOrigin(0.5, 0)
        .setDepth(hudDepth);
      this._trackHudY(this.modifierText, row2Y + 28);
    }

    this._createTopRightControls(width, row1Y, hudDepth);
    this._canonicalRow1Y = row1Y;
    this._canonicalRow2Y = row2Y;
    this._trackHudY(this.livesPanel, row1Y);
    this._trackHudY(this.livesText, row1Y - 10);
    if (this.starMeterPanel) this._trackHudY(this.starMeterPanel, row1Y + 28);
    if (this.starMeterText) this._trackHudY(this.starMeterText, row1Y + 28);
    this._starMeterHearts?.forEach((h) => this._trackHudY(h, row1Y + 28));
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
    this._trackHudY(this.waveText, row2Y - 18);
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
    this._starMeterHearts?.forEach((h) => {
      if (h?.active && h.getData('layoutY') != null) {
        h.setY(h.getData('layoutY') + row1Delta);
      }
    });
    if (this.livesPanel?.active) this.livesPanel.setY(this.livesPanel.getData('layoutY') + row1Delta);
    if (this.livesText?.active) this.livesText.setY(this.livesText.getData('layoutY') + row1Delta);
    if (this.starMeterPanel?.active && this.starMeterPanel.getData('layoutY') != null) {
      this.starMeterPanel.setY(this.starMeterPanel.getData('layoutY') + row1Delta);
    }
    if (this.starMeterText?.active && this.starMeterText.getData('layoutY') != null) {
      this.starMeterText.setY(this.starMeterText.getData('layoutY') + row1Delta);
    }
    if (this.wavePanel?.active) this.wavePanel.setY(this.wavePanel.getData('layoutY') + row2Delta);
    if (this.waveText?.active) this.waveText.setY(this.waveText.getData('layoutY') + row2Delta);
    if (this.waveBarBg?.active) this.waveBarBg.setY(this.waveBarBg.getData('layoutY') + row2Delta);
    if (this.waveBarFill?.active) this.waveBarFill.setY(this.waveBarFill.getData('layoutY') + row2Delta);
    if (this.modifierText?.active && this.modifierText.getData('layoutY') != null) {
      this.modifierText.setY(this.modifierText.getData('layoutY') + row2Delta);
    }

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
    const target = this.waveText?.active ? this.waveText : this.wavePanel;
    if (!target?.active) return;
    scene.tweens.add({
      targets: target,
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
      .image(pauseX, row1Y, "icon_pause")
      .setDisplaySize(18, 18)
      .setTint(0x4a2c0a)
      .setDepth(hudDepth + 1);
    // Icon must not steal taps — keep hit target on the circle (larger touch radius).
    this.pauseLabel.disableInteractive?.();
    this.pauseHint = scene.add
      .text(pauseX, row1Y + btnR + 2, "Pause", {
        ...readableCaptionStyle('12px', TEXT_ON_LIGHT),
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
        fontSize: "16px",
        color: "#4A2C0A",
      })
      .setOrigin(0.5)
      .setDepth(hudDepth);
    this.speedHint = scene.add
      .text(speedX, row1Y + btnR + 2, "Speed", {
        ...readableCaptionStyle('12px', TEXT_ON_LIGHT),
      })
      .setOrigin(0.5, 0)
      .setDepth(hudDepth);
    this._battleSpeed = 1;

    const sunPanelRight = speedX - btnR - 12;
    this.pointsText = scene.add
      .text(0, row1Y - 10, `${scene.sunshinePoints}`, {
        ...readableHudStyle('24px', TEXT_GOLD),
      })
      .setDepth(hudDepth);
    const sunPadX = 10;
    const sunIconSlot = 26;
    const sunGap = 6;
    const sunPanelW = Math.ceil(
      sunPadX + sunIconSlot + sunGap + this.pointsText.width + sunPadX,
    );
    const sunPanelX = sunPanelRight - sunPanelW / 2;
    // Invisible hit/layout rect for sunshine cluster.
    this.sunPanel = scene.add
      .rectangle(sunPanelX, row1Y, sunPanelW, 36, 0x000000, 0)
      .setDepth(hudDepth - 1);

    this._hudStarIcon = scene.add
      .image(sunPanelX - sunPanelW / 2 + sunPadX + sunIconSlot / 2, row1Y, "ui_sunshine")
      .setDisplaySize(22, 22)
      .setDepth(hudDepth);
    this.pointsText.setPosition(
      sunPanelX - sunPanelW / 2 + sunPadX + sunIconSlot + sunGap,
      row1Y - 10,
    );
    this._sunPadX = sunPadX;
    this._sunIconSlot = sunIconSlot;
    this._sunGap = sunGap;

    const speedTooltip = scene.add
      .text(speedX, row1Y - btnR - 6, "Toggle 1× / 2× speed", {
        ...readableCaptionStyle('13px', TEXT_ON_LIGHT),
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
    // Hint labels sit near the circles — wire them so taps still toggle.
    // Pause icon itself is non-interactive so it cannot swallow the circle hit area.
    for (const label of [this.pauseHint, this.speedLabel, this.speedHint]) {
      label.setInteractive({ useHandCursor: true });
      label.on("pointerdown", label === this.speedLabel || label === this.speedHint ? toggleSpeed : togglePause);
    }

    this._canonicalPauseX = pauseX;
    this._canonicalSpeedX = speedX;
    this._canonicalSunPanelX = sunPanelX;
    this._sunPanelW = sunPanelW;
    this._speedTooltip = speedTooltip;
  }

  _repositionTopRight(row1Y, pauseX, speedX, _sunPanelX) {
    const sunPanelW = this._sunPanelW ?? 108;
    const sunPadX = this._sunPadX ?? 10;
    const sunIconSlot = this._sunIconSlot ?? 26;
    const sunGap = this._sunGap ?? 6;
    // Derive center from speed control (not a fixed half-width of 54).
    const sunPanelRight = speedX - 22 - 12;
    const sunPanelX = sunPanelRight - sunPanelW / 2;
    this.pauseBtn?.setPosition(pauseX, row1Y);
    this.pauseLabel?.setPosition(pauseX, row1Y);
    this.pauseHint?.setPosition(pauseX, row1Y + 24);
    this.speedBtn?.setPosition(speedX, row1Y);
    this.speedLabel?.setPosition(speedX, row1Y);
    this.speedHint?.setPosition(speedX, row1Y + 24);
    this._speedTooltip?.setPosition(speedX, row1Y - 28);
    this.sunPanel?.setPosition(sunPanelX, row1Y);
    this.sunPanel?.setSize(sunPanelW, 36);
    this._hudStarIcon?.setPosition(
      sunPanelX - sunPanelW / 2 + sunPadX + sunIconSlot / 2,
      row1Y,
    );
    this.pointsText?.setPosition(
      sunPanelX - sunPanelW / 2 + sunPadX + sunIconSlot + sunGap,
      row1Y - 10,
    );
  }

  /** Keep sunshine cluster width tight when the point total gains/loses digits. */
  resizeSunPanelToContent() {
    if (!this.pointsText?.active) return;
    const sunPadX = this._sunPadX ?? 10;
    const sunIconSlot = this._sunIconSlot ?? 26;
    const sunGap = this._sunGap ?? 6;
    const sunPanelW = Math.ceil(
      sunPadX + sunIconSlot + sunGap + this.pointsText.width + sunPadX,
    );
    // Anchor to the panel's current right edge so it stays flush with speed/pause.
    const anchor = this.sunPanel?.active ? this.sunPanel : null;
    const panelRight = anchor
      ? anchor.x + (this._sunPanelW ?? anchor.width) / 2
      : (this.pointsText.x + this.pointsText.width);
    const sunPanelX = panelRight - sunPanelW / 2;
    this._sunPanelW = sunPanelW;
    const row1Y = anchor?.y ?? this._hudRow1Y ?? 42;
    if (anchor) {
      anchor.setSize(sunPanelW, 36);
      anchor.setPosition(sunPanelX, row1Y);
    }
    this._hudStarIcon?.setPosition(
      sunPanelX - sunPanelW / 2 + sunPadX + sunIconSlot / 2,
      row1Y,
    );
    this.pointsText.setPosition(
      sunPanelX - sunPanelW / 2 + sunPadX + sunIconSlot + sunGap,
      row1Y - 10,
    );
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
              const bx = h.getData('baseScaleX') ?? 1;
              const by = h.getData('baseScaleY') ?? 1;
              scene.tweens.add({
                targets: h,
                scaleX: bx * 1.3,
                scaleY: by * 1.3,
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
    const bx = heart.getData('baseScaleX') ?? 1;
    const by = heart.getData('baseScaleY') ?? 1;

    scene.tweens.add({
      targets: heart,
      scaleX: bx * 1.5,
      scaleY: by * 1.5,
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
      onComplete: () => this.pointsText.setColor(TEXT_GOLD),
    });

    if (delta > 0) {
      const floater = scene.add
        .text(
          this.pointsText.x + this.pointsText.width / 2,
          this.pointsText.y - 4,
          `+${delta}`,
          {
            ...readableHudStyle('16px', '#FFFF00'),
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
      onComplete: () => this.pointsText.setColor(TEXT_GOLD),
    });
  }

  livesLabel() {
    const maxIcons = this.heartIcons.length;
    return this.scene.lives > maxIcons ? `×${this.scene.lives}` : `${this.scene.lives}`;
  }

  /** Keep lives icons + digit cluster tight when the digit count changes. */
  resizeLivesPanelToContent() {
    if (!this.livesText?.active) return;
    const livesPadX = this._livesPadX ?? 8;
    const livesGap = this._livesGap ?? 6;
    const startX = this._livesStartX ?? 20;
    const heartSpacing = this._livesHeartSpacing ?? 22;
    const visibleHearts = Math.min(
      this.scene?.lives ?? this.heartIcons.length,
      this.heartIcons.length,
    );
    const lastHeartRight = visibleHearts > 0
      ? startX + (visibleHearts - 1) * heartSpacing + HEART_DISPLAY / 2
      : startX;
    const panelW = visibleHearts > 0
      ? Math.ceil((lastHeartRight - startX) + livesGap + this.livesText.width + livesPadX * 2)
      : Math.ceil(this.livesText.width + livesPadX * 2);
    const livesPanelX = startX - livesPadX + panelW / 2;
    this._livesPanelW = panelW;
    if (this.livesPanel?.active) {
      this.livesPanel.setSize(panelW, 36);
      this.livesPanel.setPosition(livesPanelX, this.livesPanel.y);
    }
    const livesTextX = visibleHearts > 0
      ? lastHeartRight + livesGap
      : livesPanelX - this.livesText.width / 2;
    this.livesText.setPosition(livesTextX, this.livesText.y);
  }

  updateHearts() {
    for (let i = 0; i < this.heartIcons.length; i++) {
      const heart = this.heartIcons[i];
      heart.setVisible(i < this.scene.lives);
      // Restore display-size base (not absolute 1 — that would jump to 32px).
      const bx = heart.getData('baseScaleX');
      const by = heart.getData('baseScaleY');
      if (bx != null && by != null) heart.setScale(bx, by);
      else heart.setDisplaySize(HEART_DISPLAY, HEART_DISPLAY);
      heart.setAlpha(1);
    }
    this.resizeLivesPanelToContent();
    this.updateStarMeter();
  }

  updateStarMeter() {
    if (!this.starMeterText?.active) return;
    this.starMeterText.setText(starMeterHint(this.scene.lives));
    const stars = projectedStarsFromLives(this.scene.lives);
    this._starMeterHearts?.forEach((h, i) => {
      if (h?.active) h.setAlpha(i < stars ? 1 : 0.28);
    });
    // Keep layout width tight when the hint string changes length.
    const startX = this._starMeterStartX ?? 20;
    const meterPadX = this._starMeterPadX ?? 8;
    const meterHeartGap = this._starMeterHeartGap ?? 15;
    const heartsW = 3 * meterHeartGap;
    const textX = startX + meterPadX + heartsW + 4;
    this.starMeterText.setX(textX);
    if (this.starMeterPanel?.active) {
      const meterW = Math.ceil(
        meterPadX + heartsW + 4 + this.starMeterText.width + meterPadX,
      );
      this.starMeterPanel.setSize(meterW, 22);
      this.starMeterPanel.setPosition(startX + meterW / 2, this.starMeterPanel.y);
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
