import { GameConfig } from "../config.js";
import { TOWER_SPRITES } from "../utils/AssetRegistry.js";
import { syncToBattleCamera } from "../utils/responsiveCamera.js";

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

export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: "UIScene" });
  }

  init(data) {
    this.lives = data.lives ?? GameConfig.startingLives;
    this.sunshinePoints = data.sunshinePoints ?? 150;
    this.totalWaves = data.totalWaves ?? 10;
    this.currentWave = 0;
    this.zone = data.zone ?? 0;
    this.hannahLevel = data.hannahLevel ?? 1;
    this.waveActive = false;
    this.betweenWaves = true;
    this.selectedTowerType = null;
    this.enemiesInWave = 0;
    this.enemiesDefeated = 0;
    this.worldWidth = data.worldWidth ?? GameConfig.canvas.width;
    this.worldHeight = data.worldHeight ?? GameConfig.canvas.height;
  }

  create() {
    const { width, height } = GameConfig.canvas;
    this._createHUD(width);
    this._createTowerTray(width, height);
    this._createAbilityButtons(width, height);
    this._createSendWaveButton(width, height);
    this._setupEventListeners();
    syncToBattleCamera(this);
  }

  update() {
    this._syncBattleCam?.();
  }

  /* ─── HEARTS & POINTS HUD ─── */

  _createHUD(width) {
    const hudDepth = 200;
    this._hudRow1Y = 42;
    this._hudRow2Y = 74;
    const row1Y = this._hudRow1Y;
    const row2Y = this._hudRow2Y;

    this.heartIcons = [];
    const maxIcons = Math.min(this.lives, 8);
    const heartSpacing = 22;
    const startX = 20;

    for (let i = 0; i < maxIcons; i++) {
      const heart = this.add
        .image(startX + i * heartSpacing, row1Y, "heartIcon")
        .setDisplaySize(22, 22)
        .setDepth(hudDepth);
      this.heartIcons.push(heart);
    }

    const livesX = startX + maxIcons * heartSpacing + (maxIcons > 0 ? 8 : 0);
    this.livesText = this.add
      .text(livesX, row1Y - 10, this._livesLabel(), {
        fontFamily: "Kenney Future",
        fontSize: "20px",
        color: "#FFF9E6",
        shadow: { offsetX: 1, offsetY: 1, color: "#000", blur: 2, fill: true },
      })
      .setDepth(hudDepth);

    this._startLowHealthPulse();

    const wavePanelX = width / 2;
    this.wavePanel = this.add
      .rectangle(wavePanelX, row2Y, 240, 44, 0x000000, 0.45)
      .setStrokeStyle(2, COLORS.outline)
      .setDepth(hudDepth);
    this.wavePanel.setOrigin(0.5);

    this.waveText = this.add
      .text(wavePanelX, row2Y - 16, `Wave: 0 / ${this.totalWaves}`, {
        fontFamily: "Kenney Future",
        fontSize: "22px",
        color: "#FFD700",
        shadow: { offsetX: 1, offsetY: 1, color: "#000", blur: 3, fill: true },
      })
      .setOrigin(0.5, 0)
      .setDepth(hudDepth);

    const barWidth = 180;
    const barY = row2Y + 12;
    this.waveBarBg = this.add
      .rectangle(wavePanelX, barY, barWidth, 8, 0x333333, 0.7)
      .setOrigin(0.5)
      .setDepth(hudDepth);
    this.waveBarFill = this.add
      .rectangle(wavePanelX - barWidth / 2, barY, 0, 8, 0x4caf50, 1)
      .setOrigin(0, 0.5)
      .setDepth(hudDepth);
    this.waveBarWidth = barWidth;

    this._hudStarIcon = this.add
      .image(width - 116, row1Y, "ui_uiStar")
      .setDisplaySize(24, 24)
      .setTint(0xffd700)
      .setDepth(hudDepth);
    this.pointsText = this.add
      .text(width - 98, row1Y - 10, `${this.sunshinePoints}`, {
        fontFamily: "Kenney Future",
        fontSize: "22px",
        color: "#FFD700",
        shadow: { offsetX: 1, offsetY: 1, color: "#000", blur: 2, fill: true },
      })
      .setDepth(hudDepth);

    const pauseX = width - 28;
    this.pauseBtn = this.add
      .circle(pauseX, row1Y, 18, COLORS.button)
      .setStrokeStyle(2, COLORS.outline)
      .setInteractive({ useHandCursor: true })
      .setDepth(hudDepth);
    this.pauseLabel = this.add
      .text(pauseX, row1Y, "⏸", {
        fontFamily: "Kenney Future",
        fontSize: "16px",
        color: "#4A2C0A",
      })
      .setOrigin(0.5)
      .setDepth(hudDepth);
    this.pauseBtn.on("pointerdown", () => {
      this.game.events.emit("toggle-pause");
    });
  }

  _startLowHealthPulse() {
    if (this._lowHealthTimer) {
      this._lowHealthTimer.remove(false);
      this._lowHealthTimer = null;
    }
    if (this.lives <= 5 && this.lives > 0) {
      this._lowHealthTimer = this.time.addEvent({
        delay: 2000,
        loop: true,
        callback: () => {
          this.heartIcons.forEach((h, i) => {
            if (i < this.lives && h.visible) {
              this.tweens.add({
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

  _animateHeartLoss(index) {
    const heart = this.heartIcons[index];
    if (!heart) return;

    this.tweens.add({
      targets: heart,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 150,
      yoyo: true,
      onComplete: () => {
        this.tweens.add({
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

  _animatePointsChange(delta) {
    this.tweens.add({
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
      const floater = this.add
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

      this.tweens.add({
        targets: floater,
        y: floater.y - 30,
        alpha: 0,
        duration: 800,
        ease: "Quad.easeOut",
        onComplete: () => floater.destroy(),
      });
    }
  }

  /* ─── TOWER TRAY ─── */

  _resetTowerCard(card) {
    const parts = [
      card.cardBg,
      card.nameText,
      card.costText,
      card.greyOverlay,
      card.selectionGlow,
    ];
    this.tweens.killTweensOf([...parts, card.sprite, card.coinIcon]);
    parts.forEach((obj) => obj.setScale(1));
    card.sprite.setDisplaySize(44, 44);
    card.coinIcon.setDisplaySize(12, 12);
  }

  _clearTowerSelection() {
    this.selectedTowerType = null;
    this._updateTowerSelection();
    this.towerCards?.forEach((card) => this._resetTowerCard(card));
  }

  _isTowerUnlocked(config) {
    const unlock = config.unlock;
    if (!unlock) return true;
    if (unlock.type === 'level') return this.hannahLevel >= unlock.value;
    if (unlock.type === 'zone') return this.zone + 1 >= unlock.value;
    return true;
  }

  _isAbilityUnlocked(config) {
    if (!config.unlockLevel) return true;
    return this.hannahLevel >= config.unlockLevel;
  }

  _createTowerTray(width, height) {
    const trayY = height - 80;
    const trayHeight = 94;
    const trayCenterY = trayY + trayHeight / 2;
    this._trayObjects = [];

    const trackY = (obj, y) => {
      obj.setData("layoutY", y);
      this._trayObjects.push(obj);
      return obj;
    };

    this.trayBgOuter = trackY(
      this.add
        .rectangle(
          width / 2,
          trayCenterY,
          width - 40,
          trayHeight,
          0x1a1a2e,
          0.75,
        )
        .setStrokeStyle(3, 0x4a4e69),
      trayCenterY,
    );

    this.trayBgInner = trackY(
      this.add.rectangle(
        width / 2,
        trayCenterY,
        width - 48,
        trayHeight - 8,
        0x000000,
        0,
      ).setStrokeStyle(1, 0x6c6f85),
      trayCenterY,
    );

    const towers = Object.entries(GameConfig.towers);
    const cardWidth = 84;
    const cardSpacing = 12;
    const totalWidth = towers.length * (cardWidth + cardSpacing) - cardSpacing;
    const startX = (width - totalWidth) / 2;

    this.towerCards = [];

    towers.forEach(([type, config], idx) => {
      const x = startX + idx * (cardWidth + cardSpacing) + cardWidth / 2;
      const y = trayY + trayHeight / 2;
      const spriteKey = TOWER_SPRITES[type];

      const unlocked = this._isTowerUnlocked(config);
      const affordable = unlocked && this.sunshinePoints >= config.cost;

      const cardBg = trackY(
        this.add
          .rectangle(x, y, cardWidth, 84, 0x2d2d44, 0.9)
          .setStrokeStyle(2, affordable ? 0x6c6f85 : 0x444444),
        y,
      );

      const sprite = trackY(
        this.add
          .image(x, y - 16, spriteKey)
          .setDisplaySize(44, 44),
        y - 16,
      );

      const towerName = type.replace("_", " ");
      const displayName =
        towerName.length > 7 ? towerName.substring(0, 6) + "…" : towerName;
      const nameText = trackY(
        this.add
          .text(x, y + 14, displayName, {
            fontFamily: "Kenney Future",
            fontSize: "10px",
            color: affordable ? "#CCCCCC" : "#666666",
          })
          .setOrigin(0.5),
        y + 14,
      );

      const coinIcon = trackY(
        this.add
          .image(x - 14, y + 30, "ui_uiStar")
          .setDisplaySize(12, 12)
          .setTint(COLORS.stars),
        y + 30,
      );
      const costText = trackY(
        this.add
          .text(x - 6, y + 24, `${config.cost}`, {
            fontFamily: "Kenney Future",
            fontSize: "14px",
            color: affordable ? "#FFD700" : "#666666",
          })
          .setOrigin(0, 0.5),
        y + 24,
      );

      const greyOverlay = trackY(
        this.add.rectangle(
          x,
          y,
          cardWidth,
          84,
          0x000000,
          unlocked && affordable ? 0 : 0.4,
        ),
        y,
      );

      const lockText = unlocked
        ? null
        : trackY(
            this.add
              .text(x, y, '🔒', { fontSize: '18px' })
              .setOrigin(0.5),
            y,
          );

      const selectionGlow = trackY(
        this.add
          .rectangle(x, y, cardWidth + 6, 84 + 6, 0xffd700, 0)
          .setStrokeStyle(3, 0xffd700),
        y,
      );
      selectionGlow.setVisible(false);

      cardBg.setInteractive({ useHandCursor: unlocked });

      const hoverTargets = [cardBg, nameText, costText, greyOverlay];

      cardBg.on("pointerover", () => {
        if (unlocked && this.sunshinePoints >= config.cost) {
          this.tweens.add({
            targets: hoverTargets,
            scaleX: 1.08,
            scaleY: 1.08,
            duration: 60,
          });
          sprite.setDisplaySize(48, 48);
        }
      });
      cardBg.on("pointerout", () => {
        this.tweens.add({
          targets: hoverTargets,
          scaleX: 1,
          scaleY: 1,
          duration: 60,
        });
        if (this.selectedTowerType !== type) {
          sprite.setDisplaySize(44, 44);
        }
      });
      cardBg.on("pointerdown", () => {
        if (!unlocked || this.sunshinePoints < config.cost) return;
        this.sound.play("buttonClick", { volume: GameConfig.audio.sfxVolume });

        if (this.selectedTowerType === type) {
          this.game.events.emit("tower-deselected");
          return;
        }

        this.towerCards.forEach((c) => this._resetTowerCard(c));
        this.tweens.add({
          targets: [cardBg],
          scaleX: 0.94,
          scaleY: 0.94,
          duration: 50,
          yoyo: true,
        });
        this.selectedTowerType = type;
        sprite.setDisplaySize(48, 48);
        this._updateTowerSelection();
        this.game.events.emit("tower-selected", type);
      });

      this.towerCards.push({
        type,
        config,
        cardBg,
        sprite,
        nameText,
        costText,
        coinIcon,
        greyOverlay,
        selectionGlow,
        lockText,
        unlocked,
      });
    });
  }

  _updateTowerSelection() {
    this.towerCards.forEach((card) => {
      const isSelected = card.type === this.selectedTowerType;
      card.selectionGlow.setVisible(isSelected);
      if (isSelected) {
        if (!card._glowTween) {
          card._glowTween = this.tweens.add({
            targets: card.selectionGlow,
            alpha: { from: 0.5, to: 1 },
            duration: 600,
            yoyo: true,
            repeat: -1,
          });
        }
      } else if (card._glowTween) {
        card._glowTween.stop();
        card._glowTween = null;
        card.selectionGlow.setAlpha(1);
      }
    });
  }

  _updateTowerAffordability() {
    this.towerCards.forEach((card) => {
      const unlocked = card.unlocked ?? this._isTowerUnlocked(card.config);
      const affordable = unlocked && this.sunshinePoints >= card.config.cost;
      card.cardBg.setStrokeStyle(2, affordable ? 0x6c6f85 : 0x444444);
      card.nameText.setColor(unlocked && affordable ? "#CCCCCC" : "#666666");
      card.costText.setColor(unlocked && affordable ? "#FFD700" : "#666666");
      card.greyOverlay.setFillStyle(0x000000, unlocked && affordable ? 0 : 0.4);
    });
  }

  _startAbilityCooldown(btn, duration) {
    if (btn.cooldownTween) btn.cooldownTween.stop();

    btn.onCooldown = true;
    btn.cooldownGfx.setVisible(true);

    btn.cooldownTween = this.tweens.add({
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

  _requestAbility(key, config, btn) {
    if (!this._isAbilityUnlocked(config) || btn.onCooldown) return;

    this.tweens.add({
      targets: [btn.circle, btn.label],
      scaleX: 0.9,
      scaleY: 0.9,
      duration: 50,
      yoyo: true,
    });

    this.game.events.emit("ability-used", { key, config });
    btn.pending = true;
    this.time.delayedCall(50, () => {
      if (btn.pending) btn.pending = false;
    });
  }

  /* ─── ABILITY BUTTONS ─── */

  _createAbilityButtons(width, height) {
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
        this.add
          .circle(x, y, btnRadius, abilityColor)
          .setStrokeStyle(3, COLORS.outline)
          .setInteractive({ useHandCursor: unlocked }),
        y,
      );

      const icon = ABILITY_ICONS[key] || config.label.charAt(0);
      const label = trackY(
        this.add
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
        this.add
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

      const cooldownGfx = this.add.graphics();
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
          this.tweens.add({
            targets: [circle, label],
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 60,
          });
        }
      });
      circle.on("pointerout", () => {
        tooltip.setVisible(false);
        this.tweens.add({
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

  /* ─── SEND WAVE BUTTON ─── */

  _createSendWaveButton(width, height) {
    const x = width / 2;
    const y = height - 140;
    this._sendWaveObjects = [];

    const trackY = (obj, layoutY) => {
      obj.setData("layoutY", layoutY);
      this._sendWaveObjects.push(obj);
      return obj;
    };

    this.sendWaveGlow = trackY(
      this.add
        .circle(x, y, 110, 0xffd700, 0)
        .setStrokeStyle(4, 0xffd700)
        .setAlpha(0)
        .setDepth(9),
      y,
    );

    this.sendWaveBg = trackY(
      this.add
        .image(x, y, "ui_buttonRect")
        .setDisplaySize(200, 50)
        .setInteractive({ useHandCursor: true })
        .setDepth(10),
      y,
    );

    this.sendWaveText = trackY(
      this.add
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
      this.add
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

    this._sendWaveGlowTween = this.tweens.add({
      targets: this.sendWaveGlow,
      alpha: { from: 0.6, to: 0 },
      duration: 1200,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.sendWaveBg.on("pointerover", () => {
      this.tweens.add({
        targets: [this.sendWaveBg, this.sendWaveText, this.sendWaveBonusText],
        scaleX: 1.08,
        scaleY: 1.08,
        duration: 60,
      });
    });
    this.sendWaveBg.on("pointerout", () => {
      this.tweens.add({
        targets: [this.sendWaveBg, this.sendWaveText, this.sendWaveBonusText],
        scaleX: 1,
        scaleY: 1,
        duration: 60,
      });
    });
    this.sendWaveBg.on("pointerdown", () => {
      this.sound.play("buttonClick", { volume: GameConfig.audio.sfxVolume });
      this.tweens.add({
        targets: [this.sendWaveBg, this.sendWaveText, this.sendWaveBonusText],
        scaleX: 0.94,
        scaleY: 0.94,
        duration: 50,
        yoyo: true,
      });
      this.game.events.emit("send-wave-early");
    });
  }

  _setSendWaveVisible(visible) {
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

  /* ─── EVENT LISTENERS ─── */

  _setupEventListeners() {
    this.game.events.on("lives-changed", (data) => {
      const prevLives = this.lives;
      this.lives = data.lives;
      if (data.lives < prevLives) {
        for (
          let i = data.lives;
          i < prevLives && i < this.heartIcons.length;
          i++
        ) {
          this._animateHeartLoss(i);
        }
      } else {
        this._updateHearts();
      }
      this.livesText.setText(this._livesLabel());
      this._startLowHealthPulse();
    });

    this.game.events.on("points-changed", (data) => {
      const delta = data.points - this.sunshinePoints;
      this.sunshinePoints = data.points;
      this.pointsText.setText(`${this.sunshinePoints}`);
      this._animatePointsChange(delta);
      this._updateTowerAffordability();
    });

    this.game.events.on("wave-started", (data) => {
      this.currentWave = data.wave;
      this.waveActive = true;
      this.betweenWaves = false;
      this.enemiesInWave = data.enemyCount || 0;
      this.enemiesDefeated = 0;
      this.waveText.setText(`Wave: ${data.wave} / ${data.total}`);
      this._setSendWaveVisible(false);
      this._updateWaveProgress();
    });

    this.game.events.on("wave-ended", (data) => {
      this.waveActive = false;
      this.betweenWaves = true;
      this.waveBarFill.setSize(this.waveBarWidth, 8);
      if (data.wave < data.total) {
        this._setSendWaveVisible(true);
        this.sendWaveText.setText("NEXT WAVE");
      }
    });

    this.game.events.on("enemy-defeated", () => {
      this.enemiesDefeated++;
      this._updateWaveProgress();
    });

    this.game.events.on("battle-complete", () => {
      this._setSendWaveVisible(false);
    });

    this.game.events.on("tower-deselected", () => {
      this._clearTowerSelection();
    });

    this.game.events.on("ability-fired", (data) => {
      const btn = this.abilityButtons.find((b) => b.key === data.key);
      if (!btn) return;
      btn.pending = false;
      this._startAbilityCooldown(btn, data.cooldown);
    });

    this.events.on("shutdown", () => {
      this.game.events.off("lives-changed");
      this.game.events.off("points-changed");
      this.game.events.off("wave-started");
      this.game.events.off("wave-ended");
      this.game.events.off("enemy-defeated");
      this.game.events.off("battle-complete");
      this.game.events.off("tower-deselected");
      this.game.events.off("ability-fired");
      if (this._lowHealthTimer) {
        this._lowHealthTimer.remove(false);
      }
    });
  }

  _livesLabel() {
    const maxIcons = this.heartIcons.length;
    return this.lives > maxIcons ? `×${this.lives}` : `${this.lives}`;
  }

  _updateHearts() {
    for (let i = 0; i < this.heartIcons.length; i++) {
      const heart = this.heartIcons[i];
      heart.setVisible(i < this.lives);
      heart.setScale(1);
      heart.setAlpha(1);
    }
  }

  _updateWaveProgress() {
    if (this.enemiesInWave <= 0) return;
    const ratio = Math.min(this.enemiesDefeated / this.enemiesInWave, 1);
    this.waveBarFill.setSize(this.waveBarWidth * ratio, 8);
  }
}
