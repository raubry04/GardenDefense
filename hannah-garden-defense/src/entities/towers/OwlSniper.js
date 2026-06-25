import { Tower } from '../Tower.js';
import { Projectile } from '../Projectile.js';

const PROJECTILE_SPEED = 400;

export class OwlSniper extends Tower {
  /**
   * Owl tower with long range and high damage. Targets the farthest-progressed enemy.
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   */
  constructor(scene, x, y) {
    super(scene, x, y, 'OWL');
  }

  /**
   * Fire a high-damage projectile at the enemy closest to the gate.
   * @param {number} time
   * @param {number} delta
   */
  update(time, delta) {
    const fireRate = (this.config.fireRate ?? 2000) * this.fireRateMultiplier;
    if (time - this.lastFired < fireRate) return;

    const enemies = this.getEnemiesInRange();
    if (enemies.length === 0) return;

    let target = enemies[0];
    for (let i = 1; i < enemies.length; i++) {
      if ((enemies[i].currentWaypointIndex ?? 0) > (target.currentWaypointIndex ?? 0)) {
        target = enemies[i];
      }
    }

    new Projectile(this.scene, this.x, this.y, target, this.config.damage, PROJECTILE_SPEED, 0, 'OWL');

    this.lastFired = time;
    this.scene.events.emit('tower-fired', this);
  }
}
