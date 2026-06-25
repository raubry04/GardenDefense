import { Tower } from '../Tower.js';
import { Projectile } from '../Projectile.js';
import { distanceBetween, angleBetween } from '../../utils/MathHelpers.js';

const PROJECTILE_SPEED = 300;
const SPREAD_ANGLE = 0.15; // radians between each egg in a multi-shot

export class ChickenCannon extends Tower {
  /**
   * Chicken tower that fires egg projectiles at the nearest enemy.
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   */
  constructor(scene, x, y) {
    super(scene, x, y, 'CHICKEN');
  }

  /**
   * Find nearest enemy and fire one or more egg projectiles.
   * Higher tiers increase egg count and add pierce.
   * @param {number} time
   * @param {number} delta
   */
  update(time, delta) {
    const fireRate = (this.config.fireRate ?? 800) * this.fireRateMultiplier;
    if (time - this.lastFired < fireRate) return;

    const enemies = this.getEnemiesInRange();
    if (enemies.length === 0) return;

    let nearest = null;
    let nearestDist = Infinity;
    for (const enemy of enemies) {
      const dist = distanceBetween(this, enemy);
      if (dist < nearestDist) {
        nearest = enemy;
        nearestDist = dist;
      }
    }

    const eggs = this.config.eggs ?? 1;
    const pierce = this.config.pierce ?? 0;
    const { damage } = this.config;

    if (eggs === 1) {
      new Projectile(this.scene, this.x, this.y, nearest, damage, PROJECTILE_SPEED, pierce, 'CHICKEN');
    } else {
      const baseAngle = angleBetween(this, nearest);
      for (let i = 0; i < eggs; i++) {
        const offset = (i - (eggs - 1) / 2) * SPREAD_ANGLE;
        const spawnX = this.x + Math.cos(baseAngle + offset) * 10;
        const spawnY = this.y + Math.sin(baseAngle + offset) * 10;
        new Projectile(this.scene, spawnX, spawnY, nearest, damage, PROJECTILE_SPEED, pierce, 'CHICKEN');
      }
    }

    this.lastFired = time;
    this.scene.events.emit('tower-fired', this);
  }
}
