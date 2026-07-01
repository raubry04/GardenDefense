import { GameConfig } from '../config.js';
import { setupResponsiveCamera, DESIGN } from '../utils/responsiveCamera.js';
import { loadPlayerName } from '../utils/hannahProgress.js';

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

    this.add.text(width / 2, 36, '🏆 LEADERBOARD', {
      fontFamily: 'Kenney Pixel',
      fontSize: '38px',
      color: '#FFD700',
      stroke: '#1A1A2E',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this._createModeTabs(width);

    this.loadingText = this.add.text(width / 2, height / 2, 'Loading scores...', {
      fontFamily: 'Kenney Future',
      fontSize: '22px',
      color: '#FFF9E6',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: this.loadingText,
      alpha: { from: 0.4, to: 1 },
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    this._fetchLeaderboard();

    this._createButton(width / 2, height - 50, '← BACK', () => {
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
    const tabW = 120;
    const gap = 8;
    const totalW = modes.length * tabW + (modes.length - 1) * gap;
    const startX = width / 2 - totalW / 2 + tabW / 2;
    const tabY = 72;

    modes.forEach((mode, i) => {
      const x = startX + i * (tabW + gap);
      const active = this._leaderboardMode === mode.id;
      const bg = this.add.rectangle(x, tabY, tabW, 32, active ? COLORS.primary : 0x2A2A4E, active ? 1 : 0.7)
        .setStrokeStyle(2, active ? COLORS.outline : 0x444466)
        .setInteractive({ useHandCursor: true });

      const label = this.add.text(x, tabY, mode.label, {
        fontFamily: 'Kenney Future',
        fontSize: '14px',
        color: active ? '#4A2C0A' : '#FFF9E6',
      }).setOrigin(0.5);

      bg.on('pointerdown', () => {
        if (this._leaderboardMode === mode.id) return;
        this.sound.play('buttonClick', { volume: GameConfig.audio.sfxVolume });
        this.scene.restart({ playerName: this.playerName, mode: mode.id });
      });
    });
  }

  _drawBackground(width, height) {
    const gfx = this.add.graphics();
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      gfx.fillStyle(0x2A2A4E, 0.4);
      gfx.fillCircle(x, y, Phaser.Math.Between(10, 30));
    }

    for (let i = 0; i < 6; i++) {
      const x = Phaser.Math.Between(20, width - 20);
      const y = Phaser.Math.Between(60, height - 60);
      const star = this.add.text(x, y, '✦', {
        fontSize: `${Phaser.Math.Between(10, 18)}px`,
        color: '#FFD700',
      }).setAlpha(0.15);

      this.tweens.add({
        targets: star,
        alpha: { from: 0.1, to: 0.3 },
        duration: Phaser.Math.Between(1500, 3000),
        yoyo: true,
        repeat: -1,
      });
    }
  }

  async _fetchLeaderboard() {
    const { width, height } = DESIGN;

    try {
      const response = await fetch(`/api/leaderboard?mode=${encodeURIComponent(this._leaderboardMode)}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      this.loadingText.destroy();
      this._displayTable(data, width, height);
    } catch (e) {
      this.loadingText.setText('Could not load leaderboard.');
      console.warn('Leaderboard fetch failed:', e);
    }
  }

  _displayTable(entries, width, height) {
    const startY = 108;
    const rowHeight = 38;
    const tableWidth = width * 0.88;
    const tableX = (width - tableWidth) / 2;

    const colX = {
      rank: tableX + 10,
      name: tableX + 60,
      score: tableX + tableWidth * 0.55,
      stars: tableX + tableWidth * 0.72,
      zone: tableX + tableWidth * 0.88,
    };

    this.add.rectangle(width / 2, startY + 14, tableWidth, 30, 0x000000, 0.4);

    const headerStyle = {
      fontFamily: 'Kenney Future',
      fontSize: '16px',
      color: '#A8DADC',
    };

    this.add.text(colX.rank, startY + 14, '#', headerStyle).setOrigin(0, 0.5);
    this.add.text(colX.name, startY + 14, 'PLAYER', headerStyle).setOrigin(0, 0.5);
    this.add.text(colX.score, startY + 14, 'SCORE', headerStyle).setOrigin(0, 0.5);
    this.add.text(colX.stars, startY + 14, 'STARS', headerStyle).setOrigin(0, 0.5);
    this.add.text(colX.zone, startY + 14, 'ZONE', headerStyle).setOrigin(0, 0.5);

    const maxVisible = Math.min(entries.length, 10);

    for (let i = 0; i < maxVisible; i++) {
      const entry = entries[i];
      const y = startY + 44 + i * rowHeight;
      const isCurrentPlayer = entry.player_name === this.playerName;

      this.add.rectangle(width / 2, y, tableWidth, rowHeight - 2,
        i % 2 === 0 ? 0x2A2A4E : 0x1E1E3A, 0.5);

      if (isCurrentPlayer) {
        this.add.rectangle(width / 2, y, tableWidth, rowHeight - 2, COLORS.primary, 0.15)
          .setStrokeStyle(1, COLORS.primary);
      }

      const textColor = isCurrentPlayer ? '#FFD700' : '#FFF9E6';

      const rankStyle = {
        fontFamily: 'Kenney Future',
        fontSize: '18px',
        color: textColor,
      };

      const medalEmojis = ['🥇', '🥈', '🥉'];
      const medalIcons = ['icon_trophy', 'icon_medal1', 'icon_medal2'];
      const medalTints = [0xFFD700, 0xC0C0C0, 0xCD7F32];

      if (i < 3 && this.textures.exists(medalIcons[i])) {
        this.add.image(colX.rank + 14, y, medalIcons[i])
          .setDisplaySize(26, 26).setTint(medalTints[i]);
      } else {
        const rankDisplay = i < 3 ? medalEmojis[i] : `${i + 1}`;
        this.add.text(colX.rank, y, rankDisplay, {
          fontFamily: 'Kenney Future',
          fontSize: i < 3 ? '22px' : '18px',
          color: textColor,
        }).setOrigin(0, 0.5);
      }

      const nameText = entry.player_name || 'Unknown';
      const truncatedName = nameText.length > 12 ? nameText.slice(0, 11) + '…' : nameText;
      this.add.text(colX.name, y, truncatedName, rankStyle).setOrigin(0, 0.5);
      this.add.text(colX.score, y, `${entry.score || 0}`, rankStyle).setOrigin(0, 0.5);

      const starCount = entry.stars_earned || 0;
      this.add.text(colX.stars, y, '★'.repeat(starCount) + '☆'.repeat(Math.max(0, 3 - starCount)), {
        fontFamily: 'Kenney Future',
        fontSize: '16px',
        color: '#FFE135',
      }).setOrigin(0, 0.5);

      this.add.text(colX.zone, y, `${entry.zone || '-'}`, rankStyle).setOrigin(0, 0.5);
    }

    if (entries.length === 0) {
      this.add.text(width / 2, height / 2, 'No scores yet — be the first!', {
        fontFamily: 'Kenney Future',
        fontSize: '22px',
        color: '#FFF9E6',
      }).setOrigin(0.5);

      this.add.text(width / 2, height / 2 + 40, 'Complete a battle to land on the board.', {
        fontFamily: 'Kenney Future',
        fontSize: '16px',
        color: '#A8DADC',
      }).setOrigin(0.5);
    }
  }

  _createButton(x, y, label, callback) {
    const shadow = this.add.rectangle(x + 2, y + 2, 160, 50, 0x000000, 0.3);
    const bg = this.add.rectangle(x, y, 160, 50, COLORS.button)
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
