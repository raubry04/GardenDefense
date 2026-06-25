import { GameConfig } from '../config.js';
import { TOWER_SPRITES } from '../utils/AssetRegistry.js';
import { setupResponsiveCamera, DESIGN } from '../utils/responsiveCamera.js';

const COLORS = GameConfig.colors;

export class UpgradeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UpgradeScene' });
  }

  init(data) {
    this.placedTowers = data.towers || [];
    this.sunshinePoints = data.sunshinePoints ?? 0;
    this.hannahXp = data.hannahXp ?? 0;
    this.hannahLevel = data.hannahLevel ?? 1;
    this.playerName = data.playerName || 'Player';
    this.zone = data.zone ?? 0;
    this.battle = data.battle ?? 0;
  }

  create() {
    const { width, height } = DESIGN;
    setupResponsiveCamera(this);
    this.cameras.main.fadeIn(300);

    this.cameras.main.setBackgroundColor('#3D5A1F');

    this._drawBackground(width, height);
    this._drawHeader(width);
    this._createHannahXPBar(width);
    this._createTowerUpgradeList(width, height);
    this._createButtons(width, height);
  }

  _drawBackground(width, height) {
    const gfx = this.add.graphics();
    for (let i = 0; i < 15; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      gfx.fillStyle(0x4A7C30, 0.3);
      gfx.fillCircle(x, y, Phaser.Math.Between(15, 30));
    }
  }

  _drawHeader(width) {
    this.add.text(width / 2, 30, '⬆️ UPGRADES', {
      fontFamily: 'Kenney Pixel',
      fontSize: '38px',
      color: '#FFD700',
      stroke: '#3D5A1F',
      strokeThickness: 4,
    }).setOrigin(0.5);

    const coinBg = this.add.rectangle(width - 90, 30, 140, 34, 0x000000, 0.4)
      .setStrokeStyle(1, COLORS.stars);

    this.pointsDisplay = this.add.text(width - 90, 30, `☀️ ${this.sunshinePoints}`, {
      fontFamily: 'Kenney Future',
      fontSize: '22px',
      color: '#FFD700',
    }).setOrigin(0.5);
  }

  _createHannahXPBar(width) {
    const barY = 75;
    const barWidth = Math.min(400, width * 0.6);
    const barHeight = 22;

    this.add.text(width / 2, barY - 2, `Hannah Level ${this.hannahLevel}`, {
      fontFamily: 'Kenney Future',
      fontSize: '20px',
      color: '#FFF9E6',
    }).setOrigin(0.5, 1);

    const thresholds = GameConfig.hannahXpThresholds;
    const currentThreshold = thresholds[this.hannahLevel] || thresholds[thresholds.length - 1];
    const prevThreshold = thresholds[this.hannahLevel - 1] || 0;
    const xpInLevel = this.hannahXp - prevThreshold;
    const xpNeeded = currentThreshold - prevThreshold;
    const progress = Math.min(1, xpInLevel / xpNeeded);

    this.add.rectangle(width / 2, barY + barHeight / 2, barWidth + 4, barHeight + 4, 0x222222)
      .setStrokeStyle(1, 0x444444);

    if (progress > 0) {
      const fill = this.add.rectangle(
        width / 2 - barWidth / 2, barY + barHeight / 2,
        1, barHeight, COLORS.accent
      ).setOrigin(0, 0.5);

      this.tweens.add({
        targets: fill, width: barWidth * progress,
        duration: 800, ease: 'Power2', delay: 300,
        onComplete: () => {
          if (progress >= 1) {
            this.tweens.add({
              targets: fill, alpha: { from: 1, to: 0.5 },
              duration: 300, yoyo: true, repeat: 2,
            });
          }
        },
      });
    }

    this.add.text(width / 2, barY + barHeight + 10, `${xpInLevel} / ${xpNeeded} XP`, {
      fontFamily: 'Kenney Future',
      fontSize: '16px',
      color: '#A8DADC',
    }).setOrigin(0.5, 0);

    const nextUnlocks = [];
    for (const [name, cfg] of Object.entries(GameConfig.towers)) {
      if (cfg.unlock?.type === 'level' && cfg.unlock.value === this.hannahLevel + 1) {
        nextUnlocks.push(name.replace(/_/g, ' '));
      }
    }
    for (const [, cfg] of Object.entries(GameConfig.hannahAbilities)) {
      if (cfg.unlockLevel === this.hannahLevel + 1) nextUnlocks.push(cfg.label);
    }
    if (nextUnlocks.length > 0) {
      this.add.text(width / 2, barY + barHeight + 28, `Lv.${this.hannahLevel + 1} unlocks: ${nextUnlocks.join(', ')}`, {
        fontFamily: 'Kenney Future', fontSize: '13px', color: '#FFD700',
      }).setOrigin(0.5, 0);
    }
  }

  _createTowerUpgradeList(width, height) {
    const towerTypes = [...new Set(this.placedTowers.map(t => t.type))];
    const startY = 140;
    const cardHeight = 74;
    const spacing = 10;
    const maxCards = Math.min(towerTypes.length, 5);

    if (towerTypes.length === 0) {
      this.add.text(width / 2, height / 2 - 20, 'No towers placed yet!', {
        fontFamily: 'Kenney Future',
        fontSize: '24px',
        color: '#FFF9E6',
      }).setOrigin(0.5);
      this.add.text(width / 2, height / 2 + 20, 'Place towers in the next battle to unlock upgrades.', {
        fontFamily: 'Kenney Future',
        fontSize: '16px',
        color: '#A8DADC',
        wordWrap: { width: width * 0.7 },
        align: 'center',
      }).setOrigin(0.5);
      return;
    }

    for (let idx = 0; idx < maxCards; idx++) {
      const type = towerTypes[idx];
      const y = startY + idx * (cardHeight + spacing);
      const config = GameConfig.towers[type];
      const tower = this.placedTowers.find(t => t.type === type);
      const tier = tower.tier || 0;
      const spriteKey = TOWER_SPRITES[type];
      const cardW = width * 0.8;

      this.add.rectangle(width / 2 + 2, y + cardHeight / 2 + 2, cardW, cardHeight, 0x000000, 0.2);

      this.add.rectangle(width / 2, y + cardHeight / 2, cardW, cardHeight, COLORS.uiPanel, 0.95)
        .setStrokeStyle(2, COLORS.outline);
      this.add.rectangle(width / 2, y + 4, cardW - 8, 3, COLORS.primary, 0.4);

      if (this.textures.exists(spriteKey)) {
        this.add.image(width / 2 - cardW / 2 + 40, y + cardHeight / 2, spriteKey)
          .setDisplaySize(44, 44);
      } else {
        this.add.circle(width / 2 - cardW / 2 + 40, y + cardHeight / 2, 20, 0x888888);
      }

      const displayName = type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      this.add.text(width / 2 - cardW / 2 + 76, y + 14, displayName, {
        fontFamily: 'Kenney Future',
        fontSize: '18px',
        color: '#3D5A1F',
      });

      const tierStars = '★'.repeat(tier + 1) + '☆'.repeat(2 - tier);
      this.add.text(width / 2 - cardW / 2 + 76, y + 38, `Tier ${tier + 1}/3  ${tierStars}`, {
        fontFamily: 'Kenney Future',
        fontSize: '16px',
        color: '#888888',
      });

      if (tier < 2 && config && config.upgrades && config.upgrades[tier]) {
        const upgrade = config.upgrades[tier];
        const upgCost = upgrade.cost;
        const canAfford = this.sunshinePoints >= upgCost;
        const btnColor = canAfford ? COLORS.button : 0x888888;

        const upgBtnX = width / 2 + cardW / 2 - 70;
        const upgBtnY = y + cardHeight / 2;

        const upgradeBtn = this.add.rectangle(upgBtnX, upgBtnY, 110, 40, btnColor)
          .setStrokeStyle(2, canAfford ? COLORS.outline : 0x666666)
          .setInteractive({ useHandCursor: canAfford });

        const btnText = this.add.text(upgBtnX, upgBtnY - 6, `⬆ ${upgCost}☀`, {
          fontFamily: 'Kenney Future',
          fontSize: '16px',
          color: canAfford ? '#4A2C0A' : '#CCCCCC',
        }).setOrigin(0.5);

        const currentStats = tier === 0 ? config : config.upgrades[tier - 1];
        const statParts = [];
        if (upgrade.damage !== undefined) statParts.push(`+${upgrade.damage - (currentStats.damage || 0)} dmg`);
        if (upgrade.range !== undefined) statParts.push(`+${upgrade.range - (currentStats.range || 0)}px`);
        if (upgrade.slowPercent !== undefined) statParts.push(`+${Math.round((upgrade.slowPercent - (currentStats.slowPercent || 0)) * 100)}% slow`);
        if (upgrade.hp !== undefined) statParts.push(`+${upgrade.hp - (currentStats.hp || 0)} hp`);
        if (upgrade.stunMs !== undefined) statParts.push(`+${upgrade.stunMs - (currentStats.stunMs || 0)}ms stun`);
        if (statParts.length > 0) {
          this.add.text(upgBtnX, upgBtnY + 14, statParts.join(', '), {
            fontFamily: 'Kenney Future', fontSize: '10px', color: '#4CAF50',
          }).setOrigin(0.5);
        }

        if (canAfford) {
          upgradeBtn.on('pointerover', () => {
            this.tweens.add({ targets: [upgradeBtn, btnText], scaleX: 1.08, scaleY: 1.08, duration: 60 });
          });
          upgradeBtn.on('pointerout', () => {
            this.tweens.add({ targets: [upgradeBtn, btnText], scaleX: 1, scaleY: 1, duration: 60 });
          });
          upgradeBtn.on('pointerdown', () => {
            this.sound.play('buttonClick', { volume: GameConfig.audio.sfxVolume });
            this.sunshinePoints -= upgCost;
            tower.tier = tier + 1;
            this.pointsDisplay.setText(`☀️ ${this.sunshinePoints}`);
            this.sound.play('levelUp', { volume: GameConfig.audio.sfxVolume });

            const sparkle = this.add.text(upgBtnX, upgBtnY - 20, '✨', { fontSize: '24px' })
              .setOrigin(0.5);
            this.tweens.add({
              targets: sparkle, y: upgBtnY - 50, alpha: 0, duration: 600,
              onComplete: () => sparkle.destroy(),
            });

            this.time.delayedCall(400, () => {
              this.scene.restart({
                towers: this.placedTowers,
                sunshinePoints: this.sunshinePoints,
                hannahXp: this.hannahXp,
                hannahLevel: this.hannahLevel,
                playerName: this.playerName,
                zone: this.zone,
                battle: this.battle,
              });
            });
          });
        }
      } else {
        const maxX = width / 2 + cardW / 2 - 70;
        this.add.text(maxX, y + cardHeight / 2, '⭐ MAX', {
          fontFamily: 'Kenney Future',
          fontSize: '16px',
          color: '#FFD700',
        }).setOrigin(0.5);
      }
    }
  }

  _createButtons(width, height) {
    const btnY = height - 55;

    this._createButton(width / 2 - 150, btnY, '⚔️ NEXT BATTLE', () => {
      this.sound.play('buttonClick', { volume: GameConfig.audio.sfxVolume });
      this.scene.start('GameScene', {
        zone: this.zone,
        battle: this.battle + 1,
        playerName: this.playerName,
      });
    });

    this._createButton(width / 2 + 150, btnY, '🗺️ BACK TO MAP', () => {
      this.sound.play('buttonClick', { volume: GameConfig.audio.sfxVolume });
      this.scene.start('WorldMapScene', { playerName: this.playerName });
    });
  }

  _createButton(x, y, label, callback) {
    const shadow = this.add.rectangle(x + 2, y + 2, 230, 52, 0x000000, 0.3);
    const bg = this.add.rectangle(x, y, 230, 52, COLORS.button)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, COLORS.outline);

    const text = this.add.text(x, y, label, {
      fontFamily: 'Kenney Future',
      fontSize: '20px',
      color: '#4A2C0A',
    }).setOrigin(0.5);

    bg.on('pointerover', () => {
      this.tweens.add({ targets: [bg, text, shadow], scaleX: 1.08, scaleY: 1.08, duration: 60 });
    });
    bg.on('pointerout', () => {
      this.tweens.add({ targets: [bg, text, shadow], scaleX: 1, scaleY: 1, duration: 60 });
    });
    bg.on('pointerdown', () => {
      this.tweens.add({
        targets: [bg, text], scaleX: 0.94, scaleY: 0.94, duration: 50, yoyo: true,
        onComplete: callback,
      });
    });
  }
}
