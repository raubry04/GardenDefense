import Phaser from 'phaser';

const COLORS = {
  EARNED: 0xFFE135,
  UNEARNED: 0x666666,
};

/**
 * Displays a star rating (1-3 stars) for battle results.
 * Stars animate in with a scale bounce and optional SFX.
 * @extends Phaser.GameObjects.Container
 */
export class StarRating extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene - The scene this rating belongs to
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} stars - Number of earned stars
   * @param {number} [total=3] - Total number of stars to display
   */
  constructor(scene, x, y, stars, total = 3) {
    super(scene, x, y);

    this.earnedCount = stars;
    this.totalCount = total;
    this.starImages = [];

    const spacing = 50;
    const startX = -((total - 1) * spacing) / 2;

    for (let i = 0; i < total; i++) {
      const star = scene.add.image(startX + i * spacing, 0, 'icon_star');
      star.setTint(i < stars ? COLORS.EARNED : COLORS.UNEARNED);
      star.setScale(0);
      star.setAlpha(i < stars ? 1 : 0.4);
      this.starImages.push(star);
      this.add(star);
    }

    scene.add.existing(this);
  }

  /**
   * Animate stars appearing one at a time with a scale bounce.
   * Plays 'ding' SFX for each earned star.
   * @param {number} [delayBetween=300] - Milliseconds between each star animation
   */
  animateIn(delayBetween = 300) {
    this.starImages.forEach((star, i) => {
      const isEarned = i < this.earnedCount;

      this.scene.tweens.add({
        targets: star,
        scaleX: 1,
        scaleY: 1,
        duration: 400,
        delay: i * delayBetween,
        ease: 'Back.easeOut',
        onStart: () => {
          if (isEarned && this.scene.sound.get('ding')) {
            this.scene.sound.play('ding', { volume: 0.5 });
          }
        },
      });

      if (isEarned) {
        this.scene.tweens.add({
          targets: star,
          scaleX: 1.3,
          scaleY: 1.3,
          duration: 150,
          delay: i * delayBetween + 400,
          yoyo: true,
          ease: 'Quad.easeOut',
        });
      }
    });
  }

  destroy() {
    this.starImages = [];
    super.destroy();
  }
}
