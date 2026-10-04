import { GameConfig } from '../config.js';
import { setupResponsiveCamera, DESIGN, getSafeTop } from '../utils/responsiveCamera.js';
import { getSafeInsets } from '../utils/mobileViewport.js';
import {
  loadLocalProgress,
  loadProgress,
  loadPlayerName,
  saveProgressWithSync,
  normalizeProgress,
} from '../utils/hannahProgress.js';
import {
  albumEntries,
  albumProgress,
  skinInfo,
  equipSkin,
  setBonusAbility,
  unlockedBonusAbilities,
  resolveBonusAbility,
  normalizeCollection,
} from '../utils/collection.js';
import { SceneMusicManager } from '../utils/SceneMusicManager.js';
import { decorateGardenBackdrop } from '../utils/gardenBackdrop.js';
import { FONT_DISPLAY, FONT_HUD, TEXT_ON_DARK, TEXT_SOFT_SHADOW } from '../utils/textReadability.js';
import { showToast } from '../ui/Toast.js';

const COLORS = GameConfig.colors;

/**
 * Kid-readable sticker album + chick skins + bonus ability pick.
 * One scene keeps WorldMap uncluttered.
 */
export class StickerBookScene extends Phaser.Scene {
  constructor() {
    super({ key: 'StickerBookScene' });
  }

  init(data) {
    this.playerName = data.playerName || loadPlayerName() || '';
    this.progress = normalizeProgress(loadLocalProgress(this.playerName));
    this._tab = data.tab || 'stickers'; // stickers | skins | power
  }

  create() {
    const { width, height } = DESIGN;
    setupResponsiveCamera(this);
    this.cameras.main.fadeIn(250);
    SceneMusicManager.transition(this, 'menu');
    this.cameras.main.setBackgroundColor('#6EA843');
    decorateGardenBackdrop(this, { width, height, variant: 'map' });

    loadProgress(this.playerName).then((synced) => {
      if (!this.scene.isActive('StickerBookScene')) return;
      this.progress = normalizeProgress(synced);
      this._rebuild(width, height);
    }).catch(() => { /* local ok */ });

    this._rebuild(width, height);
  }

  _rebuild(width, height) {
    this.children.removeAll(true);
    decorateGardenBackdrop(this, { width, height, variant: 'map' });

    const top = getSafeTop() + 8;
    const insets = getSafeInsets();

    this.add.rectangle(width / 2, top + 28, width - 40, 56, 0x1a2e14, 0.96)
      .setStrokeStyle(3, 0x4C9A2A)
      .setDepth(10);

    const { filled, total } = albumProgress(this.progress.collection);
    this.add.text(width / 2, top + 18, 'Sticker Book', {
      fontFamily: FONT_DISPLAY,
      fontSize: '26px',
      color: '#FFD700',
      shadow: { ...TEXT_SOFT_SHADOW, color: '#000' },
    }).setOrigin(0.5).setDepth(11);

    this.add.text(width / 2, top + 42, `${filled} / ${total} animals`, {
      fontFamily: FONT_HUD,
      fontSize: '16px',
      color: '#A8DADC',
    }).setOrigin(0.5).setDepth(11);

    this._drawTabs(width, top + 72);
    if (this._tab === 'stickers') this._drawStickers(width, height, top + 110);
    else if (this._tab === 'skins') this._drawSkins(width, height, top + 110);
    else this._drawPower(width, height, top + 110);

    const backY = height - 44 - Math.max(12, insets.bottom);
    this._makeButton(80, backY, 'BACK', () => {
      this.sound.play('buttonClick', { volume: GameConfig.audio.sfxVolume });
      this.scene.start('WorldMapScene', { playerName: this.playerName });
    }, 120);
  }

  _drawTabs(width, y) {
    const tabs = [
      { id: 'stickers', label: 'Animals' },
      { id: 'skins', label: 'Chick' },
      { id: 'power', label: 'Power' },
    ];
    const gap = 130;
    const startX = width / 2 - gap;
    tabs.forEach((tab, i) => {
      const x = startX + i * gap;
      const on = this._tab === tab.id;
      const bg = this.add.rectangle(x, y, 118, 36, on ? COLORS.button : 0x3d5a1f, on ? 1 : 0.85)
        .setStrokeStyle(2, on ? 0xffd700 : COLORS.outline)
        .setInteractive({ useHandCursor: true })
        .setDepth(12);
      this.add.text(x, y, tab.label, {
        fontFamily: FONT_DISPLAY,
        fontSize: '16px',
        color: on ? '#4A2C0A' : TEXT_ON_DARK,
      }).setOrigin(0.5).setDepth(13);
      bg.on('pointerdown', () => {
        this.sound.play('buttonClick', { volume: GameConfig.audio.sfxVolume });
        this._tab = tab.id;
        this._rebuild(DESIGN.width, DESIGN.height);
      });
    });
  }

  _drawStickers(width, height, startY) {
    const entries = albumEntries(this.progress.collection);
    const cols = 5;
    const cellW = Math.min(110, (width - 80) / cols);
    const cellH = 88;
    const gridW = cols * cellW;
    const originX = width / 2 - gridW / 2 + cellW / 2;

    this.add.text(width / 2, startY, 'Win a battle to get a sticker. Get 3★ to make it shiny!', {
      fontFamily: FONT_DISPLAY,
      fontSize: '15px',
      color: '#FFF9E6',
      wordWrap: { width: width * 0.85 },
      align: 'center',
    }).setOrigin(0.5).setDepth(10);

    entries.forEach((entry, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = originX + col * cellW;
      const y = startY + 48 + row * cellH;
      const bg = this.add.rectangle(x, y, cellW - 8, cellH - 10,
        entry.unlocked ? 0xfff9e6 : 0x4a3a2a, entry.unlocked ? 0.95 : 0.7)
        .setStrokeStyle(2, entry.stars >= 3 ? 0xffd700 : COLORS.outline)
        .setDepth(10);

      const texKey = entry.key.toLowerCase();
      if (entry.unlocked && this.textures.exists(texKey)) {
        this.add.image(x, y - 10, texKey)
          .setDisplaySize(40, 40)
          .setDepth(11);
      } else {
        this.add.text(x, y - 10, entry.unlocked ? '✓' : '?', {
          fontFamily: FONT_DISPLAY,
          fontSize: '28px',
          color: entry.unlocked ? '#4C9A2A' : '#888888',
        }).setOrigin(0.5).setDepth(11);
      }

      this.add.text(x, y + 28, entry.unlocked ? entry.label : '???', {
        fontFamily: FONT_DISPLAY,
        fontSize: '12px',
        color: entry.unlocked ? '#3D5A1F' : '#CCCCCC',
      }).setOrigin(0.5).setDepth(11);

      if (entry.stars >= 3) {
        this.add.text(x + cellW / 2 - 18, y - cellH / 2 + 14, '★', {
          fontFamily: FONT_DISPLAY,
          fontSize: '14px',
          color: '#FFE135',
        }).setOrigin(0.5).setDepth(12);
      }

      bg.setInteractive({ useHandCursor: entry.unlocked });
      if (entry.unlocked) {
        bg.on('pointerdown', () => {
          showToast(this, entry.stars >= 3
            ? `Shiny ${entry.label} sticker!`
            : `${entry.label} sticker — chase 3★ to shine it!`, 2200);
        });
      }
    });
  }

  _drawSkins(width, height, startY) {
    const col = normalizeCollection(this.progress.collection);
    this.add.text(width / 2, startY, 'Perfect a zone (3★ all battles) to unlock costumes!', {
      fontFamily: FONT_DISPLAY,
      fontSize: '15px',
      color: '#FFF9E6',
      wordWrap: { width: width * 0.85 },
      align: 'center',
    }).setOrigin(0.5).setDepth(10);

    const skins = Object.keys(GameConfig.chickSkins || { default: {} });
    skins.forEach((id, i) => {
      const info = skinInfo(id);
      const unlocked = col.skins.includes(id);
      const equipped = col.equippedSkin === id;
      const y = startY + 60 + i * 72;
      const bg = this.add.rectangle(width / 2, y, Math.min(420, width - 60), 60,
        equipped ? 0x4C9A2A : (unlocked ? COLORS.uiPanel : 0x4a3a2a), 0.95)
        .setStrokeStyle(3, equipped ? 0xffd700 : COLORS.outline)
        .setDepth(10);

      if (this.textures.exists('chick')) {
        const chick = this.add.image(width / 2 - 150, y, 'chick')
          .setDisplaySize(44, 44)
          .setDepth(11);
        if (unlocked) chick.setTint(info.tint);
        else chick.setTint(0x555555);
      }

      this.add.text(width / 2 - 100, y, `${info.emoji} ${info.label}`, {
        fontFamily: FONT_DISPLAY,
        fontSize: '18px',
        color: unlocked ? (equipped ? '#FFF9E6' : '#3D5A1F') : '#AAAAAA',
      }).setOrigin(0, 0.5).setDepth(11);

      this.add.text(width / 2 + 150, y, unlocked ? (equipped ? 'ON' : 'TAP') : 'LOCK', {
        fontFamily: FONT_DISPLAY,
        fontSize: '16px',
        color: unlocked ? '#FFD700' : '#888888',
      }).setOrigin(0.5).setDepth(11);

      if (unlocked) {
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerdown', () => {
          this.sound.play('buttonClick', { volume: GameConfig.audio.sfxVolume });
          this.progress.collection = equipSkin(this.progress.collection, id);
          saveProgressWithSync(this.progress);
          showToast(this, `Wearing ${info.label}!`, 1800);
          this._rebuild(DESIGN.width, DESIGN.height);
        });
      }
    });

    if (col.mapProps.length) {
      const propY = startY + 60 + skins.length * 72 + 20;
      this.add.text(width / 2, propY, `Map props unlocked: ${col.mapProps.length}`, {
        fontFamily: FONT_DISPLAY,
        fontSize: '16px',
        color: '#A8DADC',
      }).setOrigin(0.5).setDepth(10);
    }
  }

  _drawPower(width, height, startY) {
    const level = this.progress.hannahLevel ?? 1;
    const unlocked = unlockedBonusAbilities(level);
    const selected = resolveBonusAbility(this.progress.collection, level);

    this.add.text(width / 2, startY, 'Pick your bonus power for battles!', {
      fontFamily: FONT_DISPLAY,
      fontSize: '16px',
      color: '#FFF9E6',
      wordWrap: { width: width * 0.85 },
      align: 'center',
    }).setOrigin(0.5).setDepth(10);

    this.add.text(width / 2, startY + 28, 'Burst, Rain & Shield are always ready.', {
      fontFamily: FONT_DISPLAY,
      fontSize: '14px',
      color: '#A8DADC',
    }).setOrigin(0.5).setDepth(10);

    const pool = GameConfig.abilityLoadout?.bonusPool || ['SEED_STORM', 'FLOWER_BOMB'];
    pool.forEach((key, i) => {
      const cfg = GameConfig.hannahAbilities[key];
      const isUnlocked = unlocked.includes(key);
      const isOn = selected === key;
      const y = startY + 80 + i * 100;
      const bg = this.add.rectangle(width / 2, y, Math.min(460, width - 50), 84,
        isOn ? 0x4C9A2A : (isUnlocked ? COLORS.uiPanel : 0x4a3a2a), 0.95)
        .setStrokeStyle(3, isOn ? 0xffd700 : COLORS.outline)
        .setDepth(10);

      this.add.text(width / 2, y - 18, cfg?.label || key, {
        fontFamily: FONT_DISPLAY,
        fontSize: '22px',
        color: isUnlocked ? (isOn ? '#FFF9E6' : '#3D5A1F') : '#AAAAAA',
      }).setOrigin(0.5).setDepth(11);

      this.add.text(width / 2, y + 12, isUnlocked
        ? (cfg?.description || '')
        : `Unlocks at Hannah Level ${cfg?.unlockLevel ?? '?'}`, {
        fontFamily: FONT_DISPLAY,
        fontSize: '14px',
        color: isUnlocked ? (isOn ? '#A8DADC' : '#5A6A4A') : '#888888',
        wordWrap: { width: Math.min(420, width - 80) },
        align: 'center',
      }).setOrigin(0.5).setDepth(11);

      if (isUnlocked) {
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerdown', () => {
          this.sound.play('buttonClick', { volume: GameConfig.audio.sfxVolume });
          this.progress.collection = setBonusAbility(this.progress.collection, key, level);
          saveProgressWithSync(this.progress);
          showToast(this, `${cfg.label} ready for battle!`, 1800);
          this._rebuild(DESIGN.width, DESIGN.height);
        });
      }
    });
  }

  _makeButton(x, y, label, callback, bw = 140) {
    const bh = 44;
    const bg = this.add.rectangle(x, y, bw, bh, COLORS.button)
      .setStrokeStyle(2, COLORS.outline)
      .setInteractive({ useHandCursor: true })
      .setDepth(20);
    this.add.text(x, y, label, {
      fontFamily: FONT_DISPLAY,
      fontSize: '20px',
      color: '#4A2C0A',
    }).setOrigin(0.5).setDepth(21);
    bg.on('pointerdown', callback);
  }
}
