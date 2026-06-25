import Phaser from 'phaser';

const COLORS = {
  PRIMARY: 0xFFD700,
  TEXT: 0x4A2C0A,
  PANEL: 0xFFF9E6,
  STARS: 0xFFE135,
  OUTLINE: 0x3D5A1F,
};

/**
 * Animated banner that slides down from the top of the screen for level-up events.
 * Displays text with star particles and auto-dismisses after 3 seconds.
 * @extends Phaser.GameObjects.Container
 */
export class LevelUpBanner extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene - The scene this banner belongs to
   */
  constructor(scene) {
    super(scene, scene.cameras.main.centerX, -80);

    const width = 360;
    const height = 70;

    this.bg = scene.add.rectangle(0, 0, width, height, COLORS.PRIMARY)
      .setStrokeStyle(3, COLORS.OUTLINE);
    this.add(this.bg);

    this.panelBg = scene.add.rectangle(0, 0, width - 8, height - 8, COLORS.PANEL);
    this.add(this.panelBg);

    this.text = scene.add.text(0, 0, '', {
      fontFamily: 'Kenney Pixel',
      fontSize: '32px',
      color: '#4A2C0A',
      align: 'center',
    }).setOrigin(0.5);
    this.add(this.text);

    this.setVisible(false);
    this.setDepth(1000);

    this._particleEmitter = null;

    scene.add.existing(this);
  }

  /**
   * Display the banner with the given text.
   * Slides down from the top, remains for 3 seconds, then slides back up.
   * Emits star particles during display.
   * @param {string} text - Text to display (e.g. "LEVEL UP!")
   */
  show(text) {
    this.text.setText(text);
    this.setVisible(true);
    this.setY(-80);
    this.setAlpha(1);

    const targetY = 60;

    this.scene.tweens.add({
      targets: this,
      y: targetY,
      duration: 500,
      ease: 'Back.easeOut',
      onComplete: () => {
        this._emitParticles();
        this._dismissTimer = this.scene.time.delayedCall(3000, () => {
          this._slideOut();
        });
      },
    });
  }

  /** @private */
  _slideOut() {
    this.scene.tweens.add({
      targets: this,
      y: -80,
      alpha: 0,
      duration: 400,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.setVisible(false);
        if (this._particleEmitter) {
          this._particleEmitter.stop();
        }
      },
    });
  }

  /** @private */
  _emitParticles() {
    if (!this.scene.textures.exists('icon_star')) return;

    if (this._particleEmitter) {
      this._particleEmitter.stop();
    }

    this._particleEmitter = this.scene.add.particles(this.x, this.y, 'icon_star', {
      speed: { min: 60, max: 150 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.4, end: 0 },
      lifespan: 800,
      tint: COLORS.STARS,
      quantity: 2,
      frequency: 100,
      duration: 2000,
    });
  }

  destroy() {
    if (this._dismissTimer) {
      this._dismissTimer.destroy();
    }
    if (this._particleEmitter) {
      this._particleEmitter.destroy();
    }
    super.destroy();
  }
}
