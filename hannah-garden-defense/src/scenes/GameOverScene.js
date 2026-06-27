import { GameConfig } from '../config.js';
import { setupResponsiveCamera, DESIGN } from '../utils/responsiveCamera.js';
import { SceneMusicManager } from '../utils/SceneMusicManager.js';

const COLORS = GameConfig.colors;

const GAMEPLAY_HINTS = [
  "Try placing Rabbit towers near the path start to slow enemies early!",
  "Chicken towers deal great damage — pair them with slowing towers!",
  "Save some Sunshine Points for later waves when tougher enemies appear.",
  "Dog towers can stun enemies — perfect for chokepoints!",
  "Upgrade your towers between battles to keep up with stronger critters.",
  "Use Hannah's abilities during tough waves — don't forget they're there!",
  "Owl towers have huge range — place them in the center of the map.",
  "Pig Walls can block paths and give your other towers extra time!",
];

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this.waveReached = data.waveReached ?? 1;
    this.zone = data.zone ?? 0;
    this.battle = data.battle ?? 0;
    this.playerName = data.playerName
      || localStorage.getItem('hannahGarden_playerName')
      || 'Player';
  }

  create() {
    const { width, height } = DESIGN;
    setupResponsiveCamera(this);
    this.cameras.main.fadeIn(300);

    this._drawBackground(width, height);
    this._spawnEncouragingParticles(width, height);

    const icon = this.add.text(width / 2, 50, '🌻', { fontSize: '48px' })
      .setOrigin(0.5).setScale(0);

    this.tweens.add({
      targets: icon,
      scaleX: 1,
      scaleY: 1,
      duration: 600,
      ease: 'Back.easeOut',
    });

    this.tweens.add({
      targets: icon,
      angle: { from: -5, to: 5 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 600,
    });

    const title = this.add.text(width / 2, 100, 'GAME OVER', {
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

    const zoneName = this.zone < GameConfig.zones.length
      ? GameConfig.zones[this.zone].name
      : 'Endless Frontier';

    this.add.text(width / 2, 140, `${zoneName} — Battle ${this.battle + 1}`, {
      fontFamily: 'Kenney Future',
      fontSize: '20px',
      color: '#FFF9E6',
      wordWrap: { width: width * 0.8 },
      align: 'center',
    }).setOrigin(0.5);

    const subtitle = this.add.text(width / 2, 172, '', {
      fontFamily: 'Kenney Future',
      fontSize: '18px',
      color: '#A8DADC',
      wordWrap: { width: width * 0.75 },
      align: 'center',
      lineSpacing: 4,
    }).setOrigin(0.5, 0);

    this._typewriterEffect(
      subtitle,
      "Oh no! The critters got through!\nLet's try again, Hannah!",
      28,
      500,
    );

    this._createStatsPanel(width, 240);
    this._drawHintBox(width, height);
    this._createButtons(width, height);

    SceneMusicManager.transition(this, 'gameOver');

    if (this.zone >= GameConfig.zones.length) {
      this._postEndlessScore();
    }

    this.events.once('shutdown', () => this._clearTypewriter());
  }

  async _postEndlessScore() {
    const payload = {
      player_name: this.playerName,
      score: this.waveReached,
      stars_earned: 0,
      zone: GameConfig.zones.length + 1,
      battle: this.battle + 1,
      mode: 'endless',
    };

    try {
      await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.warn('Failed to post endless score:', e);
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

  _createStatsPanel(width, panelY) {
    const panelW = Math.min(480, width * 0.82);
    const panelH = 108;

    const shadow = this.add.rectangle(width / 2 + 2, panelY + 2, panelW, panelH, 0x000000, 0.2);
    const panel = this.add.rectangle(width / 2, panelY, panelW, panelH, COLORS.uiPanel, 0.95)
      .setStrokeStyle(2, COLORS.outline);
    this.add.rectangle(width / 2, panelY - panelH / 2 + 4, panelW - 8, 3, COLORS.accent, 0.4);

    const waveLabel = this.add.text(width / 2, panelY - 28, `Wave Reached: ${this.waveReached}`, {
      fontFamily: 'Kenney Future',
      fontSize: '26px',
      color: '#A8DADC',
    }).setOrigin(0.5).setAlpha(0);

    const encourage = this.add.text(width / 2, panelY + 14, '🐥 Keep going — you\'ve got this!', {
      fontFamily: 'Kenney Future',
      fontSize: '16px',
      color: '#3D5A1F',
      wordWrap: { width: panelW - 40 },
      align: 'center',
      lineSpacing: 3,
    }).setOrigin(0.5, 0).setAlpha(0);

    this.tweens.add({
      targets: [shadow, panel, waveLabel],
      alpha: { from: 0, to: 1 },
      duration: 400,
      delay: 700,
    });
    this.tweens.add({
      targets: encourage,
      alpha: 1,
      duration: 400,
      delay: 900,
    });
  }

  _drawHintBox(width, height) {
    const hint = Phaser.Math.RND.pick(GAMEPLAY_HINTS);
    const boxW = Math.min(520, width * 0.85);
    const boxH = 96;
    const boxY = height - 200;

    this.add.rectangle(width / 2 + 2, boxY + 2, boxW, boxH, 0x000000, 0.2);
    this.add.rectangle(width / 2, boxY, boxW, boxH, COLORS.uiPanel, 0.92)
      .setStrokeStyle(2, COLORS.stars);

    this.add.text(width / 2, boxY - boxH / 2 + 18, '💡 TIP', {
      fontFamily: 'Kenney Future',
      fontSize: '16px',
      color: '#FFE135',
    }).setOrigin(0.5);

    this.add.text(width / 2, boxY - boxH / 2 + 38, hint, {
      fontFamily: 'Kenney Future',
      fontSize: '14px',
      color: '#3D5A1F',
      wordWrap: { width: boxW - 48 },
      align: 'center',
      lineSpacing: 4,
    }).setOrigin(0.5, 0);
  }

  _spawnEncouragingParticles(width, height) {
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(50, width - 50);
      const y = Phaser.Math.Between(height + 20, height + 100);
      const dot = this.add.circle(x, y, Phaser.Math.Between(3, 6), COLORS.stars, 0.6);

      this.tweens.add({
        targets: dot,
        y: Phaser.Math.Between(-20, height * 0.35),
        x: x + Phaser.Math.Between(-40, 40),
        alpha: 0,
        duration: Phaser.Math.Between(3000, 6000),
        delay: Phaser.Math.Between(0, 2000),
        ease: 'Sine.easeOut',
        onComplete: () => dot.destroy(),
      });
    }
  }

  _typewriterEffect(textObj, message, charDelay, startDelay) {
    this._clearTypewriter();
    let index = 0;
    this._typewriterStartTimer = this.time.delayedCall(startDelay || 0, () => {
      this._typewriterStartTimer = null;
      this._typewriterEvent = this.time.addEvent({
        delay: charDelay || 40,
        repeat: message.length - 1,
        callback: () => {
          index++;
          if (textObj?.active) textObj.setText(message.substring(0, index));
        },
      });
    });
  }

  _clearTypewriter() {
    if (this._typewriterStartTimer?.remove) {
      this._typewriterStartTimer.remove(false);
      this._typewriterStartTimer = null;
    }
    if (this._typewriterEvent?.remove) {
      this._typewriterEvent.remove(false);
      this._typewriterEvent = null;
    }
  }

  _createButtons(width, height) {
    const btnY = height - 70;

    this._createButton(width / 2 - 150, btnY, '↻ TRY AGAIN', () => {
      this.sound.play('buttonClick', { volume: GameConfig.audio.sfxVolume });
      this.scene.start('GameScene', {
        zone: this.zone,
        battle: this.battle,
        playerName: this.playerName,
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
        targets: [bg, text],
        scaleX: 0.94,
        scaleY: 0.94,
        duration: 50,
        yoyo: true,
        onComplete: callback,
      });
    });
  }
}
