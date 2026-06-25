import { Tower } from '../Tower.js';

export class DuckSprinkler extends Tower {
  /**
   * Duck tower that continuously slows all enemies in range. Deals no damage.
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   */
  constructor(scene, x, y) {
    super(scene, x, y, 'DUCK');

    this.scene.tweens.add({
      targets: this,
      angle: 360,
      duration: 4000,
      repeat: -1,
    });
  }

  /**
   * Apply slow debuff to every non-immune enemy within range each frame.
   * @param {number} time
   * @param {number} delta
   */
  update(time, delta) {
    const enemies = this.getEnemiesInRange();
    for (const enemy of enemies) {
      if (!enemy.config?.immuneToSlow) {
        enemy.applySlow(this.config.slowPercent, 200);
      }
    }
  }
}
