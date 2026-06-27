import { GameConfig } from '../config.js';
import { setupResponsiveCamera, DESIGN, getSafeTop } from '../utils/responsiveCamera.js';
import { loadLocalProgress, loadProgress } from '../utils/hannahProgress.js';
import { SceneMusicManager } from '../utils/SceneMusicManager.js';

const COLORS = GameConfig.colors;
const ZONES = GameConfig.zones;

export class WorldMapScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WorldMapScene' });
  }

  init(data) {
    this.playerName = data.playerName || localStorage.getItem('hannahGarden_playerName') || '';
    this.progress = loadLocalProgress(this.playerName);
  }

  create() {
    const { width, height } = DESIGN;

    setupResponsiveCamera(this);
    this.cameras.main.fadeIn(300);
    SceneMusicManager.transition(this, 'menu');
    this.cameras.main.setBackgroundColor('#5A9A38');

    this._drawBackground(width, height);
    this._rebuildProgressUi(width, height);
    this._drawDecorativeAnimals(width, height);

    this._createButton(100, height - 50, 'BACK', () => {
      this.sound.play('buttonClick', { volume: GameConfig.audio.sfxVolume });
      this.scene.start('MainMenuScene');
    });

    loadProgress(this.playerName).then((synced) => {
      if (!this.scene.isActive('WorldMapScene')) return;
      this.progress = synced;
      this._rebuildProgressUi(width, height);
    }).catch(() => { /* local fallback already loaded */ });
  }

  _markProgressUi(fromIndex) {
    const list = this.children.list;
    for (let i = fromIndex; i < list.length; i++) {
      list[i].setData?.('progressUi', true);
    }
  }

  _clearProgressUi() {
    [...this.children.list].forEach((c) => {
      if (c.getData?.('progressUi')) c.destroy();
    });
    if (this._chickTween) {
      this._chickTween.stop();
      this._chickTween = null;
    }
    this._chickSprite = null;
  }

  _rebuildProgressUi(width, height) {
    this._clearProgressUi();
    this._drawHeader(width, this.progress);
    this._drawZones(width, height, this.progress);
    this._drawChickCompanion(width, height, this.progress);
  }

  _drawBackground(width, height) {
    const gfx = this.add.graphics();
    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const size = Phaser.Math.Between(2, 5);
      gfx.fillStyle(0x5A9A3A, 0.4);
      gfx.fillCircle(x, y, size);
    }

    for (let i = 0; i < 8; i++) {
      const x = Phaser.Math.Between(20, width - 20);
      const y = Phaser.Math.Between(80, height - 80);
      gfx.fillStyle(0x3D5A1F, 0.3);
      gfx.fillCircle(x, y, Phaser.Math.Between(20, 40));
    }
  }

  _drawHeader(width, progress) {
    const startIdx = this.children.list.length;
    const headerY = getSafeTop() + 32;
    const headerBg = this.add.rectangle(width / 2, headerY, width - 40, 52, 0x000000, 0.4)
      .setStrokeStyle(2, 0x3D5A1F);

    const avatarCircle = this.add.circle(50, headerY, 20, COLORS.primary)
      .setStrokeStyle(2, COLORS.outline);
    this.add.text(50, headerY, '👧', { fontSize: '18px' }).setOrigin(0.5);

    this.add.text(80, headerY - 14, `${this.playerName}`, {
      fontFamily: 'Kenney Future',
      fontSize: '20px',
      color: '#FFF9E6',
    });

    this.add.text(80, headerY + 8, `Lv.${progress.hannahLevel} | Garden Lv.${progress.gardenLevel}`, {
      fontFamily: 'Kenney Future',
      fontSize: '15px',
      color: '#A8DADC',
    });

    this.add.circle(width - 130, headerY, 12, COLORS.stars)
      .setStrokeStyle(2, COLORS.outline);
    this.add.text(width - 110, headerY, `${progress.sunshinePoints}`, {
      fontFamily: 'Kenney Future',
      fontSize: '22px',
      color: '#FFD700',
    }).setOrigin(0, 0.5).setName('sunshineText');
    this._markProgressUi(startIdx);
  }

  _refreshHeaderSunshine(points) {
    const text = this.children.getByName('sunshineText');
    if (text) text.setText(`${points}`);
  }

  _drawZones(width, height, progress) {
    const startIdx = this.children.list.length;
    const zoneHeight = 64;
    const startY = getSafeTop() + 88;
    const zoneWidth = width * 0.75;
    const zoneColors = [0x7EC850, 0x8BC34A, 0x66BB6A, 0xAB47BC, 0xFF7043];
    const zoneEmojis = ['🌻', '🥕', '🐔', '🫐', '🍎'];
    this._zonePositions = [];

    const pathGfx = this.add.graphics();
    for (let i = 0; i < ZONES.length; i++) {
      const py = startY + i * (zoneHeight + 10);
      this._zonePositions.push({ x: width / 2, y: py });
      if (i > 0) {
        const prevY = startY + (i - 1) * (zoneHeight + 10);
        const isUnlocked = i <= progress.unlockedZone;
        pathGfx.lineStyle(3, isUnlocked ? 0xFFD700 : 0x555555, isUnlocked ? 0.7 : 0.3);
        pathGfx.beginPath();
        pathGfx.moveTo(width / 2, prevY + zoneHeight / 2 + 3);
        pathGfx.lineTo(width / 2, py - zoneHeight / 2 - 3);
        pathGfx.strokePath();
        if (isUnlocked) {
          pathGfx.fillStyle(0xFFD700, 0.8);
          pathGfx.fillCircle(width / 2, (prevY + zoneHeight / 2 + py - zoneHeight / 2) / 2, 4);
        }
      }
    }

    for (let i = 0; i < ZONES.length; i++) {
      const y = startY + i * (zoneHeight + 10);
      const unlocked = i <= progress.unlockedZone;
      const color = unlocked ? zoneColors[i] : 0x555555;

      const shadow = this.add.rectangle(width / 2 + 3, y + 3, zoneWidth, zoneHeight, 0x000000, 0.3);

      let zoneBg;
      if (this.textures.exists('ui_buttonRect')) {
        zoneBg = this.add.image(width / 2, y, 'ui_buttonRect')
          .setDisplaySize(zoneWidth, zoneHeight)
          .setTint(color)
          .setInteractive({ useHandCursor: unlocked });
      } else {
        zoneBg = this.add.rectangle(width / 2, y, zoneWidth, zoneHeight, color)
          .setStrokeStyle(3, unlocked ? COLORS.outline : 0x444444)
          .setInteractive({ useHandCursor: unlocked });
      }

      if (unlocked) {
        this.add.text(width / 2 - zoneWidth / 2 + 50, y - 12, `${zoneEmojis[i]} Zone ${i + 1}`, {
          fontFamily: 'Kenney Pixel',
          fontSize: '22px',
          color: '#FFF9E6',
        }).setOrigin(0, 0.5);

        this.add.text(width / 2 - zoneWidth / 2 + 50, y + 14, ZONES[i].name, {
          fontFamily: 'Kenney Future',
          fontSize: '18px',
          color: '#FFF9E6',
          alpha: 0.8,
        }).setOrigin(0, 0.5);

        const stars = progress.zoneStars[i] || 0;
        const maxStars = ZONES[i].battles * 3;
        this.add.text(width / 2 + zoneWidth / 2 - 20, y, `★ ${stars}/${maxStars}`, {
          fontFamily: 'Kenney Future',
          fontSize: '20px',
          color: '#FFE135',
        }).setOrigin(1, 0.5);

        if (this.textures.exists('icon_star')) {
          this.add.image(width / 2 + zoneWidth / 2 - 52, y, 'icon_star')
            .setDisplaySize(18, 18).setTint(0xffe135);
        }

        if (stars < maxStars) {
          const remaining = maxStars - stars;
          this.add.text(width / 2 - zoneWidth / 2 + 50, y + 32,
            `${remaining} star${remaining === 1 ? '' : 's'} to perfect this zone`,
            {
              fontFamily: 'Kenney Future',
              fontSize: '12px',
              color: '#FFE135',
              alpha: 0.85,
            }).setOrigin(0, 0.5);
        } else {
          const badge = GameConfig.zoneMasteryBadges?.[i];
          if (badge) {
            this.add.text(width / 2 - zoneWidth / 2 + 50, y + 32, `🏅 ${badge}`, {
              fontFamily: 'Kenney Future',
              fontSize: '12px',
              color: '#FFD700',
            }).setOrigin(0, 0.5);
          }
        }

        zoneBg.on('pointerover', () => {
          this.tweens.add({ targets: [zoneBg, shadow], scaleX: 1.03, scaleY: 1.03, duration: 80 });
        });
        zoneBg.on('pointerout', () => {
          this.tweens.add({ targets: [zoneBg, shadow], scaleX: 1, scaleY: 1, duration: 80 });
        });
        zoneBg.on('pointerdown', () => {
          this.sound.play('buttonClick', { volume: GameConfig.audio.sfxVolume });
          this.tweens.add({
            targets: zoneBg, scaleX: 0.96, scaleY: 0.96, duration: 60, yoyo: true,
            onComplete: () => {
              this._showBattlePanel(i, this.progress, width, height);
            }
          });
        });
      } else {
        this.add.text(width / 2 - zoneWidth / 2 + 50, y, `Zone ${i + 1}: ${ZONES[i].name}`, {
          fontFamily: 'Kenney Future',
          fontSize: '20px',
          color: '#888888',
        }).setOrigin(0, 0.5);

        this.add.text(width / 2 + zoneWidth / 2 - 30, y, '🔒', {
          fontSize: '28px',
        }).setOrigin(1, 0.5);

        this.add.text(width / 2 + zoneWidth / 2 - 60, y, '⛓️', {
          fontSize: '18px',
        }).setOrigin(1, 0.5).setAlpha(0.5);
      }
    }

    const endlessY = startY + ZONES.length * (zoneHeight + 10);
    const endlessUnlocked = progress.unlockedZone >= ZONES.length - 1;

    this.add.rectangle(width / 2 + 3, endlessY + 3, zoneWidth, zoneHeight, 0x000000, 0.3);
    const endlessBg = this.add.rectangle(width / 2, endlessY, zoneWidth, zoneHeight,
      endlessUnlocked ? 0x6A1B9A : 0x555555)
      .setStrokeStyle(3, endlessUnlocked ? 0x9C27B0 : 0x444444)
      .setInteractive({ useHandCursor: endlessUnlocked });

    this.add.text(width / 2, endlessY, endlessUnlocked ? '♾️ Endless Frontier' : '♾️ Endless Frontier 🔒', {
      fontFamily: 'Kenney Pixel',
      fontSize: '22px',
      color: endlessUnlocked ? '#FFD700' : '#888888',
    }).setOrigin(0.5);

    if (endlessUnlocked) {
      endlessBg.on('pointerdown', () => {
        this.sound.play('buttonClick', { volume: GameConfig.audio.sfxVolume });
        this.scene.start('GameScene', { zone: 5, battle: 0, playerName: this.playerName });
      });
    }

    const dailyY = endlessY + zoneHeight + 10;
    const dailyBg = this.add.rectangle(width / 2, dailyY, zoneWidth, zoneHeight - 8,
      endlessUnlocked ? 0x1565C0 : 0x555555)
      .setStrokeStyle(3, endlessUnlocked ? 0x42A5F5 : 0x444444)
      .setInteractive({ useHandCursor: endlessUnlocked });

    this.add.text(width / 2, dailyY, endlessUnlocked ? '📅 Daily Challenge' : '📅 Daily Challenge 🔒', {
      fontFamily: 'Kenney Pixel',
      fontSize: '20px',
      color: endlessUnlocked ? '#FFF9E6' : '#888888',
    }).setOrigin(0.5);

    if (endlessUnlocked) {
      dailyBg.on('pointerdown', () => {
        this.sound.play('buttonClick', { volume: GameConfig.audio.sfxVolume });
        this.scene.start('GameScene', { mode: 'daily', playerName: this.playerName });
      });
    }
    this._markProgressUi(startIdx);
  }

  _drawChickCompanion(width, height, progress) {
    const startIdx = this.children.list.length;
    if (!this.textures.exists('chick')) return;
    const zonePos = this._zonePositions?.[progress.unlockedZone];
    const startX = zonePos ? zonePos.x + width * 0.75 / 2 + 30 : width - 80;
    const startY = zonePos ? zonePos.y : height - 50;

    this._chickSprite = this.add.image(startX, startY, 'chick')
      .setDisplaySize(32, 32);

    this._chickTween = this.tweens.add({
      targets: this._chickSprite,
      y: startY - 6,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this._markProgressUi(startIdx);
  }

  _showBattlePanel(zoneIndex, progress, width, height) {
    if (this._battlePanel) {
      this._battlePanel.forEach(o => o.destroy());
      this._battlePanel = null;
    }

    const objects = [];
    const zone = ZONES[zoneIndex];
    const panelW = 460;
    const panelH = 240;

    const overlay = this.add.rectangle(width / 2, height / 2, width * 2, height * 2, 0x000000, 0.6)
      .setInteractive().setDepth(300);
    objects.push(overlay);

    const panel = this.add.rectangle(width / 2, height / 2, panelW, panelH, COLORS.uiPanel)
      .setStrokeStyle(3, COLORS.outline).setDepth(301);
    objects.push(panel);

    const title = this.add.text(width / 2, height / 2 - panelH / 2 + 30, zone.name, {
      fontFamily: 'Kenney Pixel', fontSize: '26px', color: '#3D5A1F',
    }).setOrigin(0.5).setDepth(302);
    objects.push(title);

    const btnSpacing = 76;
    const btnStartX = width / 2 - ((zone.battles - 1) * btnSpacing) / 2;
    const btnY = height / 2 + 5;

    for (let b = 0; b < zone.battles; b++) {
      const bx = btnStartX + b * btnSpacing;
      const completedBattles = progress.zoneBattles[zoneIndex] || 0;
      const unlocked = b <= completedBattles;
      const stars = progress.battleStars?.[zoneIndex]?.[b] || 0;
      const isBoss = b === zone.battles - 1;

      const btnBg = this.add.rectangle(bx, btnY, 64, 74, unlocked ? COLORS.button : 0x888888)
        .setStrokeStyle(2, unlocked ? (isBoss ? 0xE63946 : COLORS.outline) : 0x666666)
        .setInteractive({ useHandCursor: unlocked }).setDepth(302);
      objects.push(btnBg);

      const label = isBoss && unlocked ? '👑' : `${b + 1}`;
      const btnLabel = this.add.text(bx, btnY - 12, label, {
        fontFamily: 'Kenney Future', fontSize: isBoss ? '20px' : '22px',
        color: unlocked ? '#4A2C0A' : '#AAAAAA',
      }).setOrigin(0.5).setDepth(303);
      objects.push(btnLabel);

      const starStr = unlocked
        ? '★'.repeat(stars) + '☆'.repeat(Math.max(0, 3 - stars))
        : '☆☆☆';
      const starText = this.add.text(bx, btnY + 20, starStr, {
        fontFamily: 'Kenney Future', fontSize: '11px',
        color: stars > 0 ? '#FFE135' : '#666666',
      }).setOrigin(0.5).setDepth(303);
      objects.push(starText);

      if (unlocked && stars > 0 && stars < 3) {
        const chaseRing = this.add.circle(bx, btnY, 38, 0xFFE135, 0)
          .setStrokeStyle(2, 0xFFE135, 0.9).setDepth(301);
        objects.push(chaseRing);
        this.tweens.add({
          targets: chaseRing,
          scaleX: 1.15,
          scaleY: 1.15,
          alpha: { from: 0.9, to: 0.3 },
          duration: 800,
          yoyo: true,
          repeat: -1,
        });
        const chaseLabel = this.add.text(bx, btnY - 38, 'Chase ★', {
          fontFamily: 'Kenney Future',
          fontSize: '9px',
          color: '#FFE135',
        }).setOrigin(0.5).setDepth(303);
        objects.push(chaseLabel);
      }

      if (unlocked) {
        btnBg.on('pointerover', () => {
          this.tweens.add({ targets: [btnBg, btnLabel, starText], scaleX: 1.12, scaleY: 1.12, duration: 60 });
        });
        btnBg.on('pointerout', () => {
          this.tweens.add({ targets: [btnBg, btnLabel, starText], scaleX: 1, scaleY: 1, duration: 60 });
        });
        btnBg.on('pointerdown', () => {
          this.sound.play('buttonClick', { volume: GameConfig.audio.sfxVolume });
          this._battlePanel.forEach(o => o.destroy());
          this._battlePanel = null;
          this.scene.start('GameScene', {
            zone: zoneIndex, battle: b, playerName: this.playerName,
          });
        });
      }
    }

    const closeBg = this.add.rectangle(width / 2, height / 2 + panelH / 2 - 32, 120, 36, 0xE63946)
      .setStrokeStyle(2, COLORS.outline).setInteractive({ useHandCursor: true }).setDepth(302);
    const closeText = this.add.text(width / 2, height / 2 + panelH / 2 - 32, 'CLOSE', {
      fontFamily: 'Kenney Future', fontSize: '16px', color: '#FFFFFF',
    }).setOrigin(0.5).setDepth(303);
    objects.push(closeBg, closeText);

    closeBg.on('pointerdown', () => {
      this.sound.play('buttonClick', { volume: GameConfig.audio.sfxVolume });
      this._battlePanel.forEach(o => o.destroy());
      this._battlePanel = null;
    });

    overlay.on('pointerdown', () => {
      this._battlePanel.forEach(o => o.destroy());
      this._battlePanel = null;
    });

    this._battlePanel = objects;

    if (this._chickSprite && this._zonePositions?.[zoneIndex]) {
      const pos = this._zonePositions[zoneIndex];
      this.tweens.killTweensOf(this._chickSprite);
      this.tweens.add({
        targets: this._chickSprite,
        x: pos.x + DESIGN.width * 0.75 / 2 + 30,
        y: pos.y,
        duration: 500, ease: 'Sine.easeInOut',
        onComplete: () => {
          this.tweens.add({
            targets: this._chickSprite, y: pos.y - 6, duration: 500,
            yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
          });
        }
      });
    }
  }

  _drawDecorativeAnimals(width, height) {
    const animals = ['cow', 'horse', 'buffalo'];
    const positions = [
      { x: 40, y: 140 }, { x: width - 40, y: 300 }, { x: 50, y: 460 },
    ];
    positions.forEach((pos, idx) => {
      const key = animals[idx % animals.length];
      if (!this.textures.exists(key)) return;
      const animal = this.add.image(pos.x, pos.y, key).setDisplaySize(26, 26).setAlpha(0.45);
      this.tweens.add({
        targets: animal, y: pos.y - 4,
        duration: Phaser.Math.Between(1500, 2500),
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        delay: Phaser.Math.Between(0, 1000),
      });
    });
  }

  _createButton(x, y, label, callback) {
    const shadow = this.add.rectangle(x + 2, y + 2, 140, 50, 0x000000, 0.3);
    const bg = this.add.rectangle(x, y, 140, 50, COLORS.button)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, COLORS.outline);

    const text = this.add.text(x, y, label, {
      fontFamily: 'Kenney Future',
      fontSize: '22px',
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
