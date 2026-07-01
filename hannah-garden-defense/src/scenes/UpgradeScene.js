import { GameConfig } from '../config.js';
import { TOWER_SPRITES } from '../utils/AssetRegistry.js';
import { setupResponsiveCamera, DESIGN } from '../utils/responsiveCamera.js';
import {
  loadLocalProgress,
  saveProgressWithSync,
  hannahLevelFromXp,
  availableMetaBank,
} from '../utils/hannahProgress.js';
import { LevelUpBanner } from '../ui/LevelUpBanner.js';
import { getUpgradeableTowerTypes, paginateTowerTypes, canPurchaseUpgradeTier } from '../utils/upgradeTowers.js';
import { SceneMusicManager } from '../utils/SceneMusicManager.js';

const COLORS = GameConfig.colors;

export class UpgradeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UpgradeScene' });
  }

  init(data) {
    this.placedTowers = data.towers || [];
    this.playerName = data.playerName || 'Player';
    this.zone = data.zone ?? 0;
    this.battle = data.battle ?? 0;
    this.prevHannahLevel = data.prevHannahLevel ?? data.hannahLevel ?? 1;
    this._upgradePage = data.upgradePage ?? 0;
    // Reset the double-spend guard on every (re)entry, including scene.restart.
    this._upgrading = false;

    const progress = loadLocalProgress(this.playerName);
    // Spendable balance is derived from earned/spent. Track `spent` so purchases
    // increment it (never write a raw lower balance); `sunshinePoints` is the
    // local display/affordability mirror of the available bank.
    this.metaSunshineSpent = progress.metaSunshineSpent ?? 0;
    this.sunshinePoints = availableMetaBank(progress);
    this.hannahXp = progress.hannahXp ?? 0;
    this.hannahLevel = progress.hannahLevel ?? hannahLevelFromXp(this.hannahXp);
    this.unlockedZone = progress.unlockedZone ?? 0;
    this.towerUpgrades = { ...(progress.towerUpgrades || {}) };

    for (const tower of this.placedTowers) {
      const savedTier = this.towerUpgrades[tower.type] ?? tower.tier ?? 0;
      tower.tier = savedTier;
    }
  }

  create() {
    const { width, height } = DESIGN;
    setupResponsiveCamera(this);
    this.cameras.main.fadeIn(300);
    SceneMusicManager.transition(this, 'menu');

    this._upgradePage = this._upgradePage ?? 0;
    this._drawBackground(width, height);
    this._drawHeader(width);
    this._createHannahXPBar(width);
    this._createTowerUpgradeList(width, height);
    this._createButtons(width, height);

    if (this.hannahLevel > this.prevHannahLevel) {
      this.levelUpBanner = new LevelUpBanner(this);
      this.levelUpBanner.show(`HANNAH LEVEL ${this.hannahLevel}!`);
    }
  }

  _persistProgress() {
    const progress = loadLocalProgress(this.playerName);
    progress.playerName = this.playerName;
    // Persist spending as a monotonic total (never regress) so it survives merges
    // across tabs/devices. The derived available balance is recomputed on save.
    progress.metaSunshineSpent = Math.max(progress.metaSunshineSpent ?? 0, this.metaSunshineSpent);
    progress.hannahXp = this.hannahXp;
    progress.hannahLevel = this.hannahLevel;
    progress.towerUpgrades = { ...this.towerUpgrades };
    saveProgressWithSync(progress);
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
    const nextZoneUnlocks = [];
    for (const [name, cfg] of Object.entries(GameConfig.towers)) {
      if (cfg.unlock?.type === 'level' && cfg.unlock.value === this.hannahLevel + 1) {
        nextUnlocks.push(name.replace(/_/g, ' '));
      }
      if (cfg.unlock?.type === 'zone' && cfg.unlock.value === this.unlockedZone + 2) {
        nextZoneUnlocks.push(name.replace(/_/g, ' '));
      }
    }
    for (const [, cfg] of Object.entries(GameConfig.hannahAbilities)) {
      if (cfg.unlockLevel === this.hannahLevel + 1) nextUnlocks.push(cfg.label);
    }
    let hintY = barY + barHeight + 28;
    if (nextUnlocks.length > 0) {
      this.add.text(width / 2, hintY, `Lv.${this.hannahLevel + 1} unlocks: ${nextUnlocks.join(', ')}`, {
        fontFamily: 'Kenney Future',
        fontSize: '13px',
        color: '#FFD700',
        wordWrap: { width: width * 0.85 },
        align: 'center',
      }).setOrigin(0.5, 0);
      hintY += 18;
    }
    if (nextZoneUnlocks.length > 0) {
      const zoneName = GameConfig.zones[this.unlockedZone + 1]?.name || `Zone ${this.unlockedZone + 2}`;
      this.add.text(width / 2, hintY, `${zoneName} unlocks: ${nextZoneUnlocks.join(', ')}`, {
        fontFamily: 'Kenney Future',
        fontSize: '13px',
        color: '#A8DADC',
        wordWrap: { width: width * 0.85 },
        align: 'center',
      }).setOrigin(0.5, 0);
    }
  }

  _buildUpgradeStatLines(upgrade, currentStats) {
    const lines = [];
    if (upgrade.damage !== undefined) lines.push(`+${upgrade.damage - (currentStats.damage || 0)} dmg`);
    if (upgrade.range !== undefined) lines.push(`+${upgrade.range - (currentStats.range || 0)} range`);
    if (upgrade.slowPercent !== undefined) {
      lines.push(`+${Math.round((upgrade.slowPercent - (currentStats.slowPercent || 0)) * 100)}% slow`);
    }
    if (upgrade.hp !== undefined) lines.push(`+${upgrade.hp - (currentStats.hp || 0)} hp`);
    if (upgrade.stunMs !== undefined) lines.push(`+${upgrade.stunMs - (currentStats.stunMs || 0)}ms stun`);
    if (upgrade.fireRate !== undefined && currentStats.fireRate) {
      lines.push(`-${currentStats.fireRate - upgrade.fireRate}ms rate`);
    }
    if (upgrade.eggs !== undefined && upgrade.eggs !== currentStats.eggs) {
      lines.push(`+${upgrade.eggs - (currentStats.eggs || 0)} eggs`);
    }
    return lines;
  }

  _createTowerUpgradeList(width, height) {
    const placedSet = new Set(this.placedTowers.map((t) => t.type));
    const towerTypes = getUpgradeableTowerTypes(this.placedTowers);
    const startY = 140;
    const cardHeight = 104;
    const spacing = 8;
    const listBottom = height - 100;
    const pageSize = Math.max(1, Math.floor((listBottom - startY + spacing) / (cardHeight + spacing)));
    const { pageTypes, totalPages, page } = paginateTowerTypes(towerTypes, pageSize, this._upgradePage);
    this._upgradePage = page;

    if (totalPages > 1) {
      const pageY = listBottom + 8;
      const prevBtn = this.add.text(width / 2 - 80, pageY, '◀', {
        fontFamily: 'Kenney Future', fontSize: '20px', color: page > 0 ? '#FFD700' : '#666666',
      }).setOrigin(0.5).setInteractive({ useHandCursor: page > 0 });
      this.add.text(width / 2, pageY, `${page + 1} / ${totalPages}`, {
        fontFamily: 'Kenney Future', fontSize: '14px', color: '#A8DADC',
      }).setOrigin(0.5);
      const nextBtn = this.add.text(width / 2 + 80, pageY, '▶', {
        fontFamily: 'Kenney Future', fontSize: '20px', color: page < totalPages - 1 ? '#FFD700' : '#666666',
      }).setOrigin(0.5).setInteractive({ useHandCursor: page < totalPages - 1 });

      if (page > 0) {
        prevBtn.on('pointerdown', () => {
          this._upgradePage = page - 1;
          this.scene.restart({
            towers: this.placedTowers,
            playerName: this.playerName,
            zone: this.zone,
            battle: this.battle,
            prevHannahLevel: this.hannahLevel,
            hannahLevel: this.hannahLevel,
            upgradePage: page - 1,
          });
        });
      }
      if (page < totalPages - 1) {
        nextBtn.on('pointerdown', () => {
          this._upgradePage = page + 1;
          this.scene.restart({
            towers: this.placedTowers,
            playerName: this.playerName,
            zone: this.zone,
            battle: this.battle,
            prevHannahLevel: this.hannahLevel,
            hannahLevel: this.hannahLevel,
            upgradePage: page + 1,
          });
        });
      }
    }

    for (let idx = 0; idx < pageTypes.length; idx++) {
      const type = pageTypes[idx];
      const y = startY + idx * (cardHeight + spacing);
      const config = GameConfig.towers[type];
      const tower = this.placedTowers.find(t => t.type === type);
      const tier = this.towerUpgrades[type] ?? tower?.tier ?? 0;
      const spriteKey = TOWER_SPRITES[type];
      const cardW = width * 0.8;

      this.add.rectangle(width / 2 + 2, y + cardHeight / 2 + 2, cardW, cardHeight, 0x000000, 0.2);

      if (this.textures.exists('ui_panelBorder')) {
        this.add.image(width / 2, y + cardHeight / 2, 'ui_panelBorder')
          .setDisplaySize(cardW, cardHeight)
          .setAlpha(0.9);
      } else {
        this.add.rectangle(width / 2, y + cardHeight / 2, cardW, cardHeight, COLORS.uiPanel, 0.95)
          .setStrokeStyle(2, COLORS.outline);
      }
      this.add.rectangle(width / 2, y + 4, cardW - 8, 3, COLORS.primary, 0.4);

      if (this.textures.exists(spriteKey)) {
        this.add.image(width / 2 - cardW / 2 + 40, y + cardHeight / 2, spriteKey)
          .setDisplaySize(44, 44);
      } else {
        this.add.circle(width / 2 - cardW / 2 + 40, y + cardHeight / 2, 20, 0x888888);
      }

      const textLeft = width / 2 - cardW / 2 + 76;
      const btnAreaW = 118;
      const textMaxW = cardW - 76 - btnAreaW;

      const displayName = type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      this.add.text(textLeft, y + 10, displayName, {
        fontFamily: 'Kenney Future',
        fontSize: '15px',
        color: '#3D5A1F',
        wordWrap: { width: textMaxW },
      }).setOrigin(0, 0);

      const tierStars = '★'.repeat(tier + 1) + '☆'.repeat(2 - tier);
      this.add.text(textLeft, y + 28, `Tier ${tier + 1}/3  ${tierStars}`, {
        fontFamily: 'Kenney Future',
        fontSize: '13px',
        color: '#888888',
      }).setOrigin(0, 0);

      if (!placedSet.has(type)) {
        this.add.text(textLeft, y + 42, 'Not used last battle', {
          fontFamily: 'Kenney Future',
          fontSize: '10px',
          color: '#A8A8A8',
        }).setOrigin(0, 0);
      }

      if (tier < 2 && config && config.upgrades && config.upgrades[tier]) {
        const upgrade = config.upgrades[tier];
        const upgCost = upgrade.cost;
        const tierAllowed = canPurchaseUpgradeTier(type, tier, {
          unlockedZone: this.unlockedZone,
          hannahLevel: this.hannahLevel,
        });
        const canAfford = tierAllowed && this.sunshinePoints >= upgCost;
        const btnColor = canAfford ? COLORS.button : 0x888888;

        if (!tierAllowed) {
          const gateHint = tier === 1 && config.unlock?.type === 'zone'
            ? `Beat zone ${config.unlock.value + 1} for max tier`
            : 'Reach higher Hannah level for max tier';
          this.add.text(textLeft, y + cardHeight / 2 - 8, gateHint, {
            fontFamily: 'Kenney Future',
            fontSize: '10px',
            color: '#A8AADC',
            wordWrap: { width: textMaxW },
          }).setOrigin(0, 0.5);
        } else {

        const upgBtnX = width / 2 + cardW / 2 - btnAreaW / 2;
        const upgBtnY = y + cardHeight / 2;

        const upgradeBtn = this.add.rectangle(upgBtnX, upgBtnY, 100, 44, btnColor)
          .setStrokeStyle(2, canAfford ? COLORS.outline : 0x666666)
          .setInteractive({ useHandCursor: canAfford });

        const btnText = this.add.text(upgBtnX, upgBtnY, `⬆ ${upgCost}☀`, {
          fontFamily: 'Kenney Future',
          fontSize: '15px',
          color: canAfford ? '#4A2C0A' : '#CCCCCC',
        }).setOrigin(0.5);

        const currentStats = tier === 0 ? config : config.upgrades[tier - 1];
        const statLines = this._buildUpgradeStatLines(upgrade, currentStats);
        if (statLines.length > 0) {
          this.add.text(textLeft, y + 46, statLines.join('\n'), {
            fontFamily: 'Kenney Future',
            fontSize: '10px',
            color: '#4CAF50',
            wordWrap: { width: textMaxW },
            lineSpacing: 2,
          }).setOrigin(0, 0);
        }

        if (canAfford) {
          upgradeBtn.on('pointerover', () => {
            this.tweens.add({ targets: [upgradeBtn, btnText], scaleX: 1.08, scaleY: 1.08, duration: 60 });
          });
          upgradeBtn.on('pointerout', () => {
            this.tweens.add({ targets: [upgradeBtn, btnText], scaleX: 1, scaleY: 1, duration: 60 });
          });
          upgradeBtn.on('pointerdown', () => {
            // Guard against a rapid double-tap spending twice before the ~400ms
            // restart. First tap latches; the button stops accepting input.
            if (this._upgrading) return;
            this._upgrading = true;
            upgradeBtn.disableInteractive();
            this.sound.play('buttonClick', { volume: GameConfig.audio.sfxVolume });
            this.metaSunshineSpent += upgCost;
            this.sunshinePoints -= upgCost;
            const newTier = tier + 1;
            this.towerUpgrades[type] = newTier;
            if (tower) tower.tier = newTier;
            this._persistProgress();
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
                playerName: this.playerName,
                zone: this.zone,
                battle: this.battle,
                prevHannahLevel: this.hannahLevel,
                hannahLevel: this.hannahLevel,
                upgradePage: this._upgradePage,
              });
            });
          });
        }
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
      this._persistProgress();
      this.scene.start('GameScene', {
        zone: this.zone,
        battle: this.battle + 1,
        playerName: this.playerName,
      });
    });

    this._createButton(width / 2 + 150, btnY, '🗺️ BACK TO MAP', () => {
      this.sound.play('buttonClick', { volume: GameConfig.audio.sfxVolume });
      this._persistProgress();
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
