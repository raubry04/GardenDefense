import { Tower } from '../Tower.js';

export class RabbitGuard extends Tower {
  /**
   * Rabbit tower that slows all nearby enemies. Does not fire projectiles.
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   */
  constructor(scene, x, y) {
    super(scene, x, y, 'RABBIT');
    this._hopTween = null;
  }

  /**
   * Apply slow to every non-immune enemy in range. Hop when active.
   * @param {number} time
   * @param {number} delta
   */
  update(time, delta) {
    const enemies = this.getEnemiesInRange();
    let appliedSlow = false;

    for (const enemy of enemies) {
      if (!enemy.config?.immuneToSlow) {
        enemy.applySlow(this.config.slowPercent, 500);
        appliedSlow = true;
      }
    }

    if (appliedSlow && !this._hopTween) {
      const baseY = this.y;
      this._hopTween = this.scene.tweens.add({
        targets: this,
        y: baseY - 8,
        duration: 100,
        yoyo: true,
        onComplete: () => {
          this.y = baseY;
          this._hopTween = null;
        }
      });
    }
  }
}
