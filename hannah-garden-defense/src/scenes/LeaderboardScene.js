import { GameConfig } from '../config.js';
import { setupResponsiveCamera, DESIGN } from '../utils/responsiveCamera.js';
import { loadPlayerName } from '../utils/hannahProgress.js';
import { decorateGardenBackdrop } from '../utils/gardenBackdrop.js';
import { FONT_DISPLAY, titleTextStyle } from '../utils/textReadability.js';

const COLORS = GameConfig.colors;

export class LeaderboardScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LeaderboardScene' });
  }

  init(data) {
    this.playerName = data.playerName || loadPlayerName() || 'Player';
    this._leaderboardMode = data.mode ?? 'campaign';
  }

  create() {
    const { width, height } = DESIGN;
    setupResponsiveCamera(this);
    this.cameras.main.fadeIn(300);

    this._drawBackground(width, height);

    const uiDepth = 20;
    this.add.text(width / 2, 36, '🏆 Leaderboard', {
      ...titleTextStyle('40px', '#FFD700'),
      stroke: '#1A1A2E',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(uiDepth);

    this._createModeTabs(width);

    this.loadingText = this.add.text(width / 2, height / 2, 'Loading scores...', {
      fontFamily: FONT_DISPLAY,
      fontSize: '22px',
      color: '#FFF9E6',
    }).setOrigin(0.5).setDepth(uiDepth);

    this.tweens.add({
      targets: this.loadingText,
      alpha: { from: 0.4, to: 1 },
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    this._fetchLeaderboard();

    this._createButton(width / 2, height - 56, '← BACK', () => {
      this.sound.play('buttonClick', { volume: GameConfig.audio.sfxVolume });
      this.scene.start('MainMenuScene');
    });
  }

  _createModeTabs(width) {
    const modes = [
      { id: 'campaign', label: 'Campaign' },
      { id: 'endless', label: 'Endless' },
      { id: 'daily', label: 'Daily' },
    ];
    const tabW = 130;
    const tabH = 44;
    const gap = 10;
    const totalW = modes.length * tabW + (modes.length - 1) * gap;
    const startX = width / 2 - totalW / 2 + tabW / 2;
    const tabY = 78;
    const uiDepth = 20;

    modes.forEach((mode, i) => {
      const x = startX + i * (tabW + gap);
      const active = this._leaderboardMode === mode.id;
      const bg = this.add.rectangle(x, tabY, tabW, tabH, active ? COLORS.primary : 0x2A2A4E, active ? 1 : 0.92)
        .setStrokeStyle(2, active ? COLORS.outline : 0x444466)
        .setDepth(uiDepth)
        .setInteractive({ useHandCursor: true });

      const label = this.add.text(x, tabY, mode.label, {
        fontFamily: FONT_DISPLAY,
        fontSize: '16px',
        color: active ? '#4A2C0A' : '#FFF9E6',
      }).setOrigin(0.5).setDepth(uiDepth + 1);

      bg.on('pointerdown', () => {
        if (this._leaderboardMode === mode.id) return;
        this.sound.play('buttonClick', { volume: GameConfig.audio.sfxVolume });
        this.scene.restart({ playerName: this.playerName, mode: mode.id });
      });
    });
  }

  _drawBackground(width, height) {
    decorateGardenBackdrop(this, { width, height, variant: 'result' });
  }

  _canUpdateLeaderboardUi() {
    return !!(this.sys?.isActive?.() && this.loadingText?.active);
  }

  async _fetchLeaderboard() {
    const { width, height } = DESIGN;
    const mode = this._leaderboardMode;

    try {
      const response = await fetch(`/api/leaderboard?mode=${encodeURIComponent(mode)}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      // Scene may have shut down (BACK / tab switch) while the request was in flight.
      if (!this._canUpdateLeaderboardUi()) return;
      this.loadingText.destroy();
      this.loadingText = null;
      this._displayTable(data, width, height);
    } catch (e) {
      if (!this._canUpdateLeaderboardUi()) return;
      this.loadingText.setText('Could not load leaderboard.');
      console.warn('Leaderboard fetch failed:', e);
    }
  }

  _displayTable(entries, width, height) {
    const startY = 118;
    const rowHeight = 40;
    const tableWidth = width * 0.88;
    const tableX = (width - tableWidth) / 2;
    const uiDepth = 20;

    const colX = {
      rank: tableX + 10,
      name: tableX + 60,
      score: tableX + tableWidth * 0.55,
      stars: tableX + tableWidth * 0.72,
      zone: tableX + tableWidth * 0.88,
    };

    this.add.rectangle(width / 2, startY + 14, tableWidth, 32, 0x1a2e14, 0.94)
      .setDepth(uiDepth);

    const headerStyle = {
      fontFamily: FONT_DISPLAY,
      fontSize: '16px',
      color: '#FFF9E6',
    };

    this.add.text(colX.rank, startY + 14, '#', headerStyle).setOrigin(0, 0.5).setDepth(uiDepth + 1);
    this.add.text(colX.name, startY + 14, 'PLAYER', headerStyle).setOrigin(0, 0.5).setDepth(uiDepth + 1);
    this.add.text(colX.score, startY + 14, 'SCORE', headerStyle).setOrigin(0, 0.5).setDepth(uiDepth + 1);
    this.add.text(colX.stars, startY + 14, 'STARS', headerStyle).setOrigin(0, 0.5).setDepth(uiDepth + 1);
    this.add.text(colX.zone, startY + 14, 'ZONE', headerStyle).setOrigin(0, 0.5).setDepth(uiDepth + 1);

    const maxVisible = Math.min(entries.length, 10);

    for (let i = 0; i < maxVisible; i++) {
      const entry = entries[i];
      const y = startY + 44 + i * rowHeight;
      const isCurrentPlayer = entry.player_name === this.playerName;

      this.add.rectangle(width / 2, y, tableWidth, rowHeight - 2,
        i % 2 === 0 ? 0x2A2A4E : 0x1E1E3A, 0.88).setDepth(uiDepth);

      if (isCurrentPlayer) {
        this.add.rectangle(width / 2, y, tableWidth, rowHeight - 2, COLORS.primary, 0.15)
          .setStrokeStyle(1, COLORS.primary)
          .setDepth(uiDepth);
      }

      const textColor = isCurrentPlayer ? '#FFD700' : '#FFF9E6';

      const rankStyle = {
        fontFamily: FONT_DISPLAY,
        fontSize: '18px',
        color: textColor,
      };

      const medalEmojis = ['🥇', '🥈', '🥉'];
      const medalIcons = ['icon_trophy', 'icon_medal1', 'icon_medal2'];
      const medalTints = [0xFFD700, 0xC0C0C0, 0xCD7F32];

      if (i < 3 && this.textures.exists(medalIcons[i])) {
        this.add.image(colX.rank + 14, y, medalIcons[i])
          .setDisplaySize(26, 26).setTint(medalTints[i]).setDepth(uiDepth + 1);
      } else {
        const rankDisplay = i < 3 ? medalEmojis[i] : `${i + 1}`;
        this.add.text(colX.rank, y, rankDisplay, {
          fontFamily: FONT_DISPLAY,
          fontSize: i < 3 ? '22px' : '18px',
          color: textColor,
        }).setOrigin(0, 0.5).setDepth(uiDepth + 1);
      }

      const nameText = entry.player_name || 'Unknown';
      const truncatedName = nameText.length > 12 ? nameText.slice(0, 11) + '…' : nameText;
      this.add.text(colX.name, y, truncatedName, rankStyle).setOrigin(0, 0.5).setDepth(uiDepth + 1);
      this.add.text(colX.score, y, `${entry.score || 0}`, rankStyle).setOrigin(0, 0.5).setDepth(uiDepth + 1);

      const starCount = entry.stars_earned || 0;
      this.add.text(colX.stars, y, '★'.repeat(starCount) + '☆'.repeat(Math.max(0, 3 - starCount)), {
        fontFamily: FONT_DISPLAY,
        fontSize: '16px',
        color: '#FFE135',
      }).setOrigin(0, 0.5).setDepth(uiDepth + 1);

      this.add.text(colX.zone, y, `${entry.zone || '-'}`, rankStyle).setOrigin(0, 0.5).setDepth(uiDepth + 1);
    }

    if (entries.length === 0) {
      this.add.text(width / 2, height / 2, 'No scores yet — be the first!', {
        fontFamily: FONT_DISPLAY,
        fontSize: '22px',
        color: '#FFF9E6',
      }).setOrigin(0.5).setDepth(uiDepth + 1);

      this.add.text(width / 2, height / 2 + 40, 'Complete a battle to land on the board.', {
        fontFamily: FONT_DISPLAY,
        fontSize: '16px',
        color: '#A8DADC',
      }).setOrigin(0.5).setDepth(uiDepth + 1);
    }
  }

  _createButton(x, y, label, callback) {
    const depth = 20;
    const shadow = this.add.rectangle(x + 2, y + 2, 180, 56, 0x000000, 0.3).setDepth(depth);
    const bg = this.add.rectangle(x, y, 180, 56, COLORS.button)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, COLORS.outline)
      .setDepth(depth + 1);

    const text = this.add.text(x, y, label, {
      fontFamily: FONT_DISPLAY,
      fontSize: '22px',
      color: '#4A2C0A',
    }).setOrigin(0.5).setDepth(depth + 2);

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
