import { Tower } from '../Tower.js';

const BARK_COOLDOWN = 2000;

export class DogPatrol extends Tower {
  /**
   * Dog tower that periodically barks, stunning and slowing all nearby enemies.
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   */
  constructor(scene, x, y) {
    super(scene, x, y, 'DOG');
    this.lastBark = 0;
  }

  /**
   * Bark every 2 seconds if enemies are in range: stun then slow each enemy.
   * @param {number} time
   * @param {number} delta
   */
  update(time, delta) {
    const cooldown = BARK_COOLDOWN * this.fireRateMultiplier;
    if (time - this.lastBark < cooldown) return;

    const enemies = this.getEnemiesInRange();
    if (enemies.length === 0) return;

    this.lastBark = time;

    for (const enemy of enemies) {
      enemy.applyFreeze(this.config.stunMs);
      if (!enemy.config?.immuneToSlow) {
        enemy.applySlow(this.config.slowPercent, this.config.stunMs + 1000);
      }
    }

    this.scene.tweens.add({
      targets: this,
      scaleX: this.scaleX * 1.3,
      scaleY: this.scaleY * 1.3,
      duration: 100,
      yoyo: true,
    });

    this.scene.events.emit('tower-fired', this);
  }
}
