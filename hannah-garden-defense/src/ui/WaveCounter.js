import Phaser from 'phaser';

const COLORS = {
  PRIMARY: 0xFFD700,
  TEXT: 0x4A2C0A,
  PANEL: 0xFFF9E6,
  OUTLINE: 0x3D5A1F,
  ACCENT: 0xA8DADC,
};

/**
 * Displays the current wave number and total waves.
 * Can show an animated banner when a new wave begins.
 * @extends Phaser.GameObjects.Container
 */
export class WaveCounter extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene - The scene this counter belongs to
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  constructor(scene, x, y) {
    super(scene, x, y);

    this.currentWave = 0;
    this.totalWaves = 0;

    this.bg = scene.add.rectangle(0, 0, 160, 40, COLORS.PANEL, 0.9)
      .setStrokeStyle(2, COLORS.OUTLINE);
    this.add(this.bg);

    this.label = scene.add.text(0, 0, 'Wave 0 of 0', {
      fontFamily: 'Kenney Future',
      fontSize: '22px',
      color: '#4A2C0A',
      align: 'center',
    }).setOrigin(0.5);
    this.add(this.label);

    this.banner = this._createBanner(scene);
    this.add(this.banner);

    scene.add.existing(this);
  }

  /** @private */
  _createBanner(scene) {
    const container = scene.add.container(0, -60);
    container.setVisible(false);

    const bannerBg = scene.add.rectangle(0, 0, 280, 56, COLORS.PRIMARY)
      .setStrokeStyle(3, COLORS.OUTLINE);
    container.add(bannerBg);

    const bannerPanel = scene.add.rectangle(0, 0, 272, 48, COLORS.PANEL);
    container.add(bannerPanel);

    const bannerText = scene.add.text(0, 0, '', {
      fontFamily: 'Kenney Pixel',
      fontSize: '28px',
      color: '#4A2C0A',
      align: 'center',
    }).setOrigin(0.5);
    container.add(bannerText);

    container._bannerText = bannerText;
    return container;
  }

  /**
   * Update the displayed wave count.
   * @param {number} currentWave - The current wave number
   * @param {number} totalWaves - The total number of waves
   */
  update(currentWave, totalWaves) {
    this.currentWave = currentWave;
    this.totalWaves = totalWaves;
    this.label.setText(`Wave ${currentWave} of ${totalWaves}`);
  }

  /**
   * Show an animated banner that slides down announcing the new wave.
   * @param {number} waveNum - The wave number to display
   * @param {number} total - Total number of waves
   */
  showBanner(waveNum, total) {
    this.banner._bannerText.setText(`Wave ${waveNum} of ${total}!`);
    this.banner.setVisible(true);
    this.banner.setAlpha(0);
    this.banner.setY(-80);

    this.scene.tweens.add({
      targets: this.banner,
      y: -60,
      alpha: 1,
      duration: 400,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.time.delayedCall(2000, () => {
          this.scene.tweens.add({
            targets: this.banner,
            y: -80,
            alpha: 0,
            duration: 300,
            ease: 'Quad.easeIn',
            onComplete: () => {
              this.banner.setVisible(false);
            },
          });
        });
      },
    });

    this.update(waveNum, total);
  }

  destroy() {
    super.destroy();
  }
}
