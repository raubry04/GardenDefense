import { GameConfig } from '../config.js';
import { setupResponsiveCamera, DESIGN } from '../utils/responsiveCamera.js';

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
  }

  create() {
    const { width, height } = DESIGN;
    setupResponsiveCamera(this);
    this.cameras.main.fadeIn(300);

    this.cameras.main.setBackgroundColor('#2D4A1B');

    this._drawBackground(width, height);

    const sunflower = this.add.text(width / 2, 50, '🌻', { fontSize: '48px' }).setOrigin(0.5);
    this.tweens.add({
      targets: sunflower, angle: { from: -5, to: 5 },
      duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    const msg1 = "Oh no! The critters got through!";
    const typeText1 = this.add.text(width / 2, 110, '', {
      fontFamily: 'Kenney Pixel',
      fontSize: '34px',
      color: '#FFD700',
      stroke: '#2D4A1B',
      strokeThickness: 4,
    }).setOrigin(0.5);
    this._typewriterEffect(typeText1, msg1, 40);

    const msg2 = "Let's try again, Hannah!";
    const typeText2 = this.add.text(width / 2, 160, '', {
      fontFamily: 'Kenney Pixel',
      fontSize: '26px',
      color: '#FFF9E6',
    }).setOrigin(0.5);
    this._typewriterEffect(typeText2, msg2, 40, msg1.length * 40 + 400);

    this._createChickAnimation(width);

    const zoneName = this.zone < GameConfig.zones.length
      ? GameConfig.zones[this.zone].name : 'Endless Frontier';

    const infoPanel = this.add.rectangle(width / 2, 230, 320, 70, 0x000000, 0.3)
      .setStrokeStyle(2, COLORS.accent);

    this.add.text(width / 2, 215, `Wave Reached: ${this.waveReached}`, {
      fontFamily: 'Kenney Future',
      fontSize: '22px',
      color: '#A8DADC',
    }).setOrigin(0.5);

    this.add.text(width / 2, 245, `${zoneName} — Battle ${this.battle + 1}`, {
      fontFamily: 'Kenney Future',
      fontSize: '18px',
      color: '#C8A96E',
    }).setOrigin(0.5);

    this._drawHintBox(width, height);
    this._createButtons(width, height);

    this.sound.play('gameOver', { volume: GameConfig.audio.musicVolume });

    this._spawnEncouragingParticles(width, height);
  }

  _drawBackground(width, height) {
    const gfx = this.add.graphics();
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(height - 100, height);
      gfx.fillStyle(0x3D5A1F, 0.5);
      gfx.fillRoundedRect(x - 3, y, 6, Phaser.Math.Between(20, 40), 3);
    }
  }

  _drawHintBox(width, height) {
    const hint = Phaser.Math.RND.pick(GAMEPLAY_HINTS);
    const boxY = 340;

    this.add.rectangle(width / 2, boxY, width * 0.72, 90, 0x000000, 0.4)
      .setStrokeStyle(2, COLORS.stars);

    this.add.text(width / 2, boxY - 28, '💡 TIP', {
      fontFamily: 'Kenney Future',
      fontSize: '20px',
      color: '#FFE135',
    }).setOrigin(0.5);

    this.add.text(width / 2, boxY + 8, hint, {
      fontFamily: 'Kenney Future',
      fontSize: '18px',
      color: '#FFF9E6',
      wordWrap: { width: width * 0.6 },
      align: 'center',
    }).setOrigin(0.5, 0);
  }

  _spawnEncouragingParticles(width, height) {
    for (let i = 0; i < 15; i++) {
      const x = Phaser.Math.Between(50, width - 50);
      const y = Phaser.Math.Between(height + 20, height + 100);
      const dot = this.add.circle(x, y, Phaser.Math.Between(3, 6), COLORS.stars, 0.6);

      this.tweens.add({
        targets: dot,
        y: Phaser.Math.Between(-20, height * 0.3),
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
    let index = 0;
    this.time.delayedCall(startDelay || 0, () => {
      this.time.addEvent({
        delay: charDelay || 40,
        repeat: message.length - 1,
        callback: () => {
          index++;
          textObj.setText(message.substring(0, index));
        },
      });
    });
  }

  _createChickAnimation(width) {
    const chickY = 290;
    const sadChick = this.add.text(width / 2, chickY, '🐥', { fontSize: '32px' }).setOrigin(0.5);
    const tearText = this.add.text(width / 2 + 20, chickY - 12, '💧', { fontSize: '14px' })
      .setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: sadChick, y: chickY + 3, duration: 600, yoyo: true, repeat: 4, ease: 'Sine.easeInOut',
    });
    this.tweens.add({ targets: tearText, alpha: 0.8, duration: 400, delay: 300 });

    this.time.delayedCall(3000, () => {
      this.tweens.add({
        targets: tearText, alpha: 0, duration: 200, onComplete: () => tearText.destroy(),
      });
      sadChick.setText('🐣');
      this.tweens.add({
        targets: sadChick, scaleX: 1.3, scaleY: 1.3, duration: 200, yoyo: true,
        onComplete: () => {
          this.tweens.add({
            targets: sadChick, y: chickY - 5, duration: 400, yoyo: true, repeat: -1, ease: 'Sine.easeOut',
          });
        },
      });
    });
  }

  _createButtons(width, height) {
    const btnY = height - 90;

    this._createButton(width / 2 - 150, btnY, '↻ TRY AGAIN', () => {
      this.sound.play('buttonClick', { volume: GameConfig.audio.sfxVolume });
      this.scene.start('GameScene', {
        zone: this.zone,
        battle: this.battle,
        playerName: localStorage.getItem('hannahGarden_playerName') || 'Player',
      });
    });

    this._createButton(width / 2 + 150, btnY, '🗺️ BACK TO MAP', () => {
      this.sound.play('buttonClick', { volume: GameConfig.audio.sfxVolume });
      this.scene.start('WorldMapScene', {
        playerName: localStorage.getItem('hannahGarden_playerName') || 'Player',
      });
    });
  }

  _createButton(x, y, label, callback) {
    const shadow = this.add.rectangle(x + 3, y + 3, 240, 60, 0x000000, 0.3);
    const bg = this.add.rectangle(x, y, 240, 60, COLORS.button)
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
