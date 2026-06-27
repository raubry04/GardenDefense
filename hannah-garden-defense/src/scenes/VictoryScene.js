import { GameConfig } from '../config.js';
import { setupResponsiveCamera, DESIGN } from '../utils/responsiveCamera.js';
import {
  hannahLevelFromXp,
  sumZoneStars,
  loadLocalProgress,
  saveProgressWithSync,
  normalizeProgress,
  battleSunshineToMetaBank,
} from '../utils/hannahProgress.js';
import { SceneMusicManager } from '../utils/SceneMusicManager.js';

const COLORS = GameConfig.colors;

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'VictoryScene' });
  }

  init(data) {
    this.livesRemaining = data.livesRemaining ?? 0;
    this.zone = data.zone ?? 0;
    this.battle = data.battle ?? 0;
    this.pointsEarned = data.pointsEarned ?? 0;
    this.playerName = data.playerName || 'Player';
    this.towersData = data.towers || [];
    this.hannahXp = data.hannahXp ?? 0;
    this.hannahLevel = data.hannahLevel ?? 1;
    this.prevHannahLevel = this.hannahLevel;
    this.mode = data.mode ?? 'campaign';
    this.dailyDateKey = data.dailyDateKey ?? null;
    const progress = loadLocalProgress(this.playerName);
    this.prevStars = progress.battleStars?.[this.zone]?.[this.battle] ?? 0;
  }

  create() {
    const { width, height } = DESIGN;
    setupResponsiveCamera(this);
    this.cameras.main.fadeIn(300);
    SceneMusicManager.transition(this, 'victory');

    this._drawBackground(width, height);
    this._createConfetti(width, height);

    const trophy = this.textures.exists('icon_trophy')
      ? this.add.image(width / 2, 50, 'icon_trophy').setDisplaySize(56, 56).setOrigin(0.5).setScale(0)
      : this.add.text(width / 2, 50, '🏆', { fontSize: '48px' }).setOrigin(0.5).setScale(0);

    this.tweens.add({
      targets: trophy,
      scaleX: 1, scaleY: 1,
      duration: 600,
      ease: 'Back.easeOut',
    });

    const title = this.add.text(width / 2, 100, 'VICTORY!', {
      fontFamily: 'Kenney Pixel',
      fontSize: '46px',
      color: '#FFD700',
      stroke: '#2E5A1F',
      strokeThickness: 6,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: title,
      alpha: 1,
      y: 95,
      duration: 500,
      delay: 200,
    });

    const zoneName = this.mode === 'daily'
      ? 'Daily Challenge'
      : (this.zone < GameConfig.zones.length ? GameConfig.zones[this.zone].name : 'Endless');

    const battleLabel = this.mode === 'daily'
      ? (this.dailyDateKey ?? 'Today')
      : `Battle ${this.battle + 1} Complete!`;

    this.add.text(width / 2, 140, `${zoneName} — ${battleLabel}`, {
      fontFamily: 'Kenney Future',
      fontSize: '20px',
      color: '#FFF9E6',
    }).setOrigin(0.5);

    const stars = this._calculateStars();
    this._displayStars(width, 200, stars);
    this._showStarFeedback(width, 200, stars);
    this._animatePoints(width, 280, stars);
    this._saveProgress(stars);
    this._postScore(stars);
    this._createButtons(width, height);
  }

  _showStarFeedback(width, starY, stars) {
    const delta = stars - (this.prevStars ?? 0);
    if (delta > 0) {
      const bonus = this.add.text(width / 2, starY + 50, `+${delta} ★`, {
        fontFamily: 'Kenney Future',
        fontSize: '28px',
        color: '#FFE135',
        stroke: '#3D5A1F',
        strokeThickness: 3,
      }).setOrigin(0.5).setAlpha(0).setScale(0.5);

      this.tweens.add({
        targets: bonus,
        alpha: 1,
        scaleX: 1,
        scaleY: 1,
        y: starY + 44,
        duration: 500,
        delay: 1500,
        ease: 'Back.easeOut',
      });
    }

    if (stars < 3) {
      const need = GameConfig.starThresholds.three;
      const replayHint = this.add.text(width / 2, starY + (delta > 0 ? 78 : 50),
        `Replay from the map to chase 3★ (need ${need} lives left)`,
        {
          fontFamily: 'Kenney Future',
          fontSize: '14px',
          color: '#A8DADC',
          wordWrap: { width: width * 0.8 },
          align: 'center',
        }).setOrigin(0.5, 0).setAlpha(0);

      this.tweens.add({
        targets: replayHint,
        alpha: 1,
        duration: 400,
        delay: 2000,
      });
    }
  }

  _drawBackground(width, height) {
    const gfx = this.add.graphics();
    for (let i = 0; i < 12; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      gfx.fillStyle(0x4A7C30, 0.3);
      gfx.fillCircle(x, y, Phaser.Math.Between(20, 40));
    }
  }

  _calculateStars() {
    if (this.livesRemaining >= GameConfig.starThresholds.three) return 3;
    if (this.livesRemaining >= GameConfig.starThresholds.two) return 2;
    return 1;
  }

  _createConfetti(width, height) {
    const confettiColors = [0xFFD700, 0xFF9F1C, 0xE63946, 0xA8DADC, 0x7EC850, 0xFFE135, 0xFF69B4];

    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, width);
      const startY = Phaser.Math.Between(-120, -20);
      const color = Phaser.Math.RND.pick(confettiColors);
      const w = Phaser.Math.Between(6, 12);
      const h = Phaser.Math.Between(4, 8);

      const particle = this.add.rectangle(x, startY, w, h, color)
        .setAngle(Phaser.Math.Between(0, 360));

      this.tweens.add({
        targets: particle,
        y: height + 50,
        x: x + Phaser.Math.Between(-100, 100),
        angle: Phaser.Math.Between(180, 720),
        duration: Phaser.Math.Between(2500, 5000),
        delay: Phaser.Math.Between(0, 1200),
        ease: 'Sine.easeIn',
        onComplete: () => particle.destroy(),
      });
    }
  }

  _displayStars(width, y, starCount) {
    const starSpacing = 70;

    for (let i = 0; i < 3; i++) {
      const sx = width / 2 - starSpacing + i * starSpacing;
      const earned = i < starCount;

      const star = this.add.text(sx, y, '★', {
        fontSize: '54px',
        color: earned ? '#FFE135' : '#444444',
      }).setOrigin(0.5).setScale(0).setAlpha(earned ? 1 : 0.4);

      this.tweens.add({
        targets: star,
        scaleX: 1, scaleY: 1,
        duration: 400,
        delay: 600 + i * 300,
        ease: 'Back.easeOut',
        onStart: () => {
          if (earned) {
            this.sound.play('pointsEarned', { volume: GameConfig.audio.sfxVolume * 0.7 });
          }
        },
      });

      if (earned) {
        this.time.delayedCall(700 + i * 300, () => {
          for (let j = 0; j < 5; j++) {
            const sparkle = this.add.circle(
              sx + Phaser.Math.Between(-15, 15),
              y + Phaser.Math.Between(-15, 15),
              Phaser.Math.Between(2, 4), 0xFFE135
            );
            this.tweens.add({
              targets: sparkle,
              alpha: 0,
              scaleX: 2,
              scaleY: 2,
              duration: 500,
              onComplete: () => sparkle.destroy(),
            });
          }
        });
      }
    }
  }

  _starBonusPoints(stars) {
    let bonus = 0;
    if (stars >= 2) bonus += GameConfig.twoStarBonus;
    if (stars >= 3) bonus += GameConfig.threeStarBonus;
    return bonus;
  }

  _metaPointsEarned(stars) {
    if (this.mode === 'daily') return 0;
    return battleSunshineToMetaBank(this.pointsEarned + this._starBonusPoints(stars));
  }

  _dailyScore(stars) {
    return stars * 1000 + this.livesRemaining;
  }

  _animatePoints(width, y, stars) {
    const totalEarned = this._metaPointsEarned(stars);

    this.add.text(width / 2, y, 'Sunshine Points Earned:', {
      fontFamily: 'Kenney Future',
      fontSize: '20px',
      color: '#FFF9E6',
    }).setOrigin(0.5);

    const pointsValue = this.add.text(width / 2, y + 38, '0', {
      fontFamily: 'Kenney Future',
      fontSize: '34px',
      color: '#FFD700',
    }).setOrigin(0.5);

    this.tweens.addCounter({
      from: 0,
      to: totalEarned,
      duration: 1500,
      delay: 1800,
      ease: 'Power2',
      onUpdate: (tween) => {
        pointsValue.setText(`☀ ${Math.floor(tween.getValue())}`);
      },
    });
  }

  _saveProgress(stars) {
    if (this.mode === 'daily') return;
    try {
      const progress = normalizeProgress(loadLocalProgress(this.playerName));
      progress.playerName = this.playerName;

      progress.sunshinePoints = (progress.sunshinePoints || 0) + this._metaPointsEarned(stars);

      if (!progress.battleStars[this.zone]) progress.battleStars[this.zone] = {};
      progress.battleStars[this.zone][this.battle] = Math.max(
        progress.battleStars[this.zone][this.battle] || 0, stars
      );

      progress.zoneStars[this.zone] = sumZoneStars(progress.battleStars[this.zone]);

      const completedBattle = progress.zoneBattles[this.zone] || 0;
      if (this.battle >= completedBattle) {
        progress.zoneBattles[this.zone] = this.battle + 1;
      }

      if (this.zone < GameConfig.zones.length) {
        const zoneBattles = GameConfig.zones[this.zone].battles;
        if (progress.zoneBattles[this.zone] >= zoneBattles && this.zone >= (progress.unlockedZone ?? 0)) {
          progress.unlockedZone = Math.min(this.zone + 1, GameConfig.zones.length);
        }
      }

      let totalXp = this.hannahXp + GameConfig.hannahXpRewards.battleComplete;
      if (stars >= 3) totalXp += GameConfig.hannahXpRewards.threeStarBonus;
      progress.hannahXp = totalXp;
      progress.hannahLevel = hannahLevelFromXp(totalXp);
      progress.gardenLevel = Math.max(1, (progress.unlockedZone ?? 0) + 1);

      this.savedProgress = progress;
      saveProgressWithSync(progress);
    } catch (e) {
      console.warn('Failed to save progress:', e);
    }
  }

  async _postScore(stars) {
    const payload = {
      player_name: this.playerName,
      score: this.mode === 'daily' ? this._dailyScore(stars) : this._metaPointsEarned(stars),
      stars_earned: stars,
      zone: this.zone + 1,
      battle: this.battle + 1,
      mode: this.mode === 'daily' ? 'daily' : 'campaign',
    };

    try {
      await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.warn('Failed to post score:', e);
    }
  }

  _createButtons(width, height) {
    const btnY = height - 70;

    this._createButton(width / 2 - 150, btnY, '⬆️ UPGRADES', () => {
      this.sound.play('buttonClick', { volume: GameConfig.audio.sfxVolume });
      const saved = this.savedProgress || loadLocalProgress(this.playerName);
      this.scene.start('UpgradeScene', {
        towers: this.towersData,
        playerName: this.playerName,
        zone: this.zone,
        battle: this.battle,
        prevHannahLevel: this.prevHannahLevel,
        hannahLevel: saved.hannahLevel,
      });
    });

    this._createButton(width / 2 + 150, btnY, '🗺️ MAP', () => {
      this.sound.play('buttonClick', { volume: GameConfig.audio.sfxVolume });
      this.scene.start('WorldMapScene', { playerName: this.playerName });
    });
  }

  _createButton(x, y, label, callback) {
    const shadow = this.add.rectangle(x + 2, y + 2, 220, 56, 0x000000, 0.3);
    const bg = this.add.rectangle(x, y, 220, 56, COLORS.button)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(3, COLORS.outline);

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
