import Phaser from 'phaser';

const COLORS = {
  PANEL: 0xFFF9E6,
  TEXT: 0x4A2C0A,
  OUTLINE: 0x3D5A1F,
  ACCENT: 0xA8DADC,
};

const TIPS = [
  'Place defenders near the bends in the path!',
  'The Owl can hit enemies from really far away!',
  'Penguins can freeze enemies in their tracks!',
  'Sell towers you don\'t need for extra points!',
  'Send waves early for bonus Sunshine Points!',
  'Upgrade your towers to make them stronger!',
  'The Rabbit slows down enemies near it!',
  'Watch out for flying Parrots - they skip the path!',
];

/**
 * A speech bubble that displays gameplay hints/tips.
 * Auto-dismisses after 4 seconds or can be dismissed manually.
 * @extends Phaser.GameObjects.Container
 */
export class HintBubble extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene - The scene this bubble belongs to
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  constructor(scene, x, y) {
    super(scene, x, y);

    this._dismissTimer = null;

    const maxWidth = 260;

    this.bubble = scene.add.graphics();
    this.add(this.bubble);

    this.tipText = scene.add.text(0, -8, '', {
      fontFamily: 'Kenney Future',
      fontSize: '22px',
      color: '#4A2C0A',
      align: 'center',
      wordWrap: { width: maxWidth - 24 },
    }).setOrigin(0.5);
    this.add(this.tipText);

    this.setVisible(false);
    this.setAlpha(0);

    scene.add.existing(this);
  }

  /**
   * Draw the speech bubble background around text.
   * @private
   */
  _drawBubble(width, height) {
    this.bubble.clear();
    const x = -width / 2;
    const y = -height / 2 - 8;
    const radius = 12;
    const tailHeight = 14;

    this.bubble.fillStyle(COLORS.PANEL, 1);
    this.bubble.lineStyle(2, COLORS.OUTLINE, 1);

    this.bubble.fillRoundedRect(x, y, width, height, radius);
    this.bubble.strokeRoundedRect(x, y, width, height, radius);

    this.bubble.fillTriangle(
      -8, y + height,
      8, y + height,
      0, y + height + tailHeight
    );
    this.bubble.lineStyle(2, COLORS.OUTLINE, 1);
    this.bubble.lineBetween(-8, y + height, 0, y + height + tailHeight);
    this.bubble.lineBetween(0, y + height + tailHeight, 8, y + height);
  }

  /**
   * Display the bubble with the given text. Auto-dismisses after 4 seconds.
   * @param {string} text - The hint text to display, or omit to show a random tip
   */
  show(text) {
    const displayText = text || TIPS[Phaser.Math.Between(0, TIPS.length - 1)];
    this.tipText.setText(displayText);

    const padding = 24;
    const textBounds = this.tipText.getBounds();
    const bubbleWidth = Math.max(textBounds.width + padding, 120);
    const bubbleHeight = textBounds.height + padding;

    this._drawBubble(bubbleWidth, bubbleHeight);

    this.setVisible(true);
    this.scene.tweens.add({
      targets: this,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 250,
      ease: 'Back.easeOut',
    });

    if (this._dismissTimer) {
      this._dismissTimer.destroy();
    }
    this._dismissTimer = this.scene.time.delayedCall(4000, () => {
      this.dismiss();
    });
  }

  /**
   * Immediately dismiss and hide the bubble.
   */
  dismiss() {
    if (this._dismissTimer) {
      this._dismissTimer.destroy();
      this._dismissTimer = null;
    }

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 0.8,
      scaleY: 0.8,
      duration: 200,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.setVisible(false);
      },
    });
  }

  /**
   * Get the pool of available tips.
   * @returns {string[]} Array of tip strings
   */
  static getTips() {
    return [...TIPS];
  }

  destroy() {
    if (this._dismissTimer) {
      this._dismissTimer.destroy();
    }
    super.destroy();
  }
}
