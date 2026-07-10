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
import { decorateGardenBackdrop } from '../utils/gardenBackdrop.js';
import { FONT_DISPLAY } from '../utils/textReadability.js';
import {
  VICTORY_UI_DEPTH,
  burstVictoryConfetti,
  startVictoryConfetti,
  createFloatingSparkles,
  burstStarSparkles,
} from '../utils/victoryConfetti.js';

const COLORS = GameConfig.colors;
const UI_DEPTH = VICTORY_UI_DEPTH;

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
    this._createFloatingSparkles(width, height);

    // Trophy image is sized via setDisplaySize (scale != 1). Pop-in must tween
    // back to that display base — absolute scale 1 would leave it at native
    // texture size (50px) instead of the intended 56px.
    const trophy = this.textures.exists('icon_trophy')
      ? this.add.image(width / 2, 44, 'icon_trophy').setDisplaySize(56, 56).setOrigin(0.5)
      : this.add.text(width / 2, 44, '🏆', { fontSize: '48px' }).setOrigin(0.5);
    trophy.setDepth(UI_DEPTH);
    const trophyBaseSX = trophy.scaleX;
    const trophyBaseSY = trophy.scaleY;
    trophy.setScale(0);

    this.tweens.add({
      targets: trophy,
      scaleX: trophyBaseSX, scaleY: trophyBaseSY,
      duration: 600,
      ease: 'Back.easeOut',
    });

    const title = this.add.text(width / 2, 94, 'VICTORY!', {
      fontFamily: FONT_DISPLAY,
      fontSize: '52px',
      color: '#FFD700',
      stroke: '#2E5A1F',
      strokeThickness: 6,
    }).setOrigin(0.5).setAlpha(0).setDepth(UI_DEPTH);

    this.tweens.add({
      targets: title,
      alpha: 1,
      y: 88,
      duration: 500,
      delay: 200,
    });

    const zoneName = this.mode === 'daily'
      ? 'Daily Challenge'
      : (this.zone < GameConfig.zones.length ? GameConfig.zones[this.zone].name : 'Endless');

    const battleLabel = this.mode === 'daily'
      ? (this.dailyDateKey ?? 'Today')
      : `Battle ${this.battle + 1} Complete!`;

    this.add.text(width / 2, 132, `${zoneName} — ${battleLabel}`, {
      fontFamily: FONT_DISPLAY,
      fontSize: '22px',
      color: '#FFF9E6',
      wordWrap: { width: width * 0.85 },
      align: 'center',
    }).setOrigin(0.5).setDepth(UI_DEPTH);

    const stars = this._calculateStars();
    this._displayStars(width, 188, stars);
    this._showStarFeedback(width, 188, stars);
    this._animatePoints(width, 300, stars);
    this._saveProgress(stars);
    this._postScore(stars);
    this._createButtons(width, height);
  }

  _showStarFeedback(width, starY, stars) {
    const delta = stars - (this.prevStars ?? 0);
    if (delta > 0) {
      const bonus = this.add.text(width / 2, starY + 48, `+${delta} ★`, {
        fontFamily: FONT_DISPLAY,
        fontSize: '28px',
        color: '#FFE135',
        stroke: '#3D5A1F',
        strokeThickness: 3,
      }).setOrigin(0.5).setAlpha(0).setScale(0.5).setDepth(UI_DEPTH);

      this.tweens.add({
        targets: bonus,
        alpha: 1,
        scaleX: 1,
        scaleY: 1,
        y: starY + 42,
        duration: 500,
        delay: 1500,
        ease: 'Back.easeOut',
      });
    }

    if (stars < 3 && this.mode !== 'daily') {
      const need = GameConfig.starThresholds.three;
      const replayHint = this.add.text(width / 2, starY + (delta > 0 ? 74 : 48),
        `Replay from the map to chase 3★ (need ${need} lives left)`,
        {
          fontFamily: FONT_DISPLAY,
          fontSize: '18px',
          color: '#A8DADC',
          wordWrap: { width: width * 0.8 },
          align: 'center',
        }).setOrigin(0.5, 0).setAlpha(0).setDepth(UI_DEPTH);

      this.tweens.add({
        targets: replayHint,
        alpha: 1,
        duration: 400,
        delay: 2000,
      });
    }
  }

  _drawBackground(width, height) {
    decorateGardenBackdrop(this, { width, height, variant: 'result' });
  }

  _calculateStars() {
    if (this.livesRemaining >= GameConfig.starThresholds.three) return 3;
    if (this.livesRemaining >= GameConfig.starThresholds.two) return 2;
    return 1;
  }

  /**
   * Kid-friendly falling celebration. Solid rectangles/circles/icon_star —
   * not soft Kenney particle_* glows (those vanish on grass with NORMAL blend).
   * Opening burst is on-screen immediately; rain keeps respawning the whole time.
   */
  _createConfetti(width, height) {
    // Dense full-viewport rain in DESIGN space (see victoryConfetti.js).
    burstVictoryConfetti(this, width, height, 52);
    startVictoryConfetti(this, width, height, 72);
  }

  /** Mid-band sparkles so the gap between points and buttons feels alive. */
  _createFloatingSparkles(width, height) {
    createFloatingSparkles(this, width, height);
  }

  _displayStars(width, y, starCount) {
    const starSpacing = 70;

    for (let i = 0; i < 3; i++) {
      const sx = width / 2 - starSpacing + i * starSpacing;
      const earned = i < starCount;

      const star = this.add.text(sx, y, '★', {
        fontSize: '54px',
        color: earned ? '#FFE135' : '#444444',
      }).setOrigin(0.5).setScale(0).setAlpha(earned ? 1 : 0.4).setDepth(UI_DEPTH);

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
          if (!this.sys?.isActive()) return;
          this._burstStarSparkles(sx, y);
        });
      }
    }
  }

  _burstStarSparkles(sx, y) {
    burstStarSparkles(this, sx, y);
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
      fontFamily: FONT_DISPLAY,
      fontSize: '20px',
      color: '#FFF9E6',
    }).setOrigin(0.5).setDepth(UI_DEPTH);

    const pointsValue = this.add.text(width / 2, y + 36, '0', {
      fontFamily: FONT_DISPLAY,
      fontSize: '34px',
      color: '#FFD700',
    }).setOrigin(0.5).setDepth(UI_DEPTH);

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

      // Deposit into the meta bank by growing the monotonic earned total; the
      // spendable balance (progress.sunshinePoints) is derived on save/normalize.
      progress.metaSunshineEarned = (progress.metaSunshineEarned || 0) + this._metaPointsEarned(stars);

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
      // Never regress XP below what's already stored (e.g. a concurrent save).
      progress.hannahXp = Math.max(progress.hannahXp || 0, totalXp);
      progress.hannahLevel = hannahLevelFromXp(progress.hannahXp);
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
    // Pull buttons up to shrink the dead mid gap while keeping 60px touch targets.
    const btnY = height - 118;
    const gap = 24;
    const btnW = 240;

    this._createButton(width / 2 - btnW / 2 - gap / 2, btnY, 'UPGRADES', () => {
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
    }, btnW);

    this._createButton(width / 2 + btnW / 2 + gap / 2, btnY, 'MAP', () => {
      this.sound.play('buttonClick', { volume: GameConfig.audio.sfxVolume });
      this.scene.start('WorldMapScene', { playerName: this.playerName });
    }, btnW);
  }

  _createButton(x, y, label, callback, btnW = 220) {
    const btnH = 60;
    const shadow = this.add.rectangle(x + 2, y + 2, btnW, btnH, 0x000000, 0.3)
      .setDepth(UI_DEPTH);
    const bg = this.add.rectangle(x, y, btnW, btnH, COLORS.button)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(3, COLORS.outline)
      .setDepth(UI_DEPTH);

    const text = this.add.text(x, y, label, {
      fontFamily: FONT_DISPLAY,
      fontSize: '22px',
      color: '#4A2C0A',
    }).setOrigin(0.5).setDepth(UI_DEPTH + 1);

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
