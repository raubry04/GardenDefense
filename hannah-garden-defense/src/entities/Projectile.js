import { distanceBetween, angleBetween } from '../utils/MathHelpers.js';

const HIT_RADIUS = 16;
const PIERCE_SCAN_RADIUS = 150;
const ORPHAN_LIFETIME_MS = 500;

export class Projectile extends Phaser.GameObjects.Sprite {
  /**
   * Create a projectile that tracks an enemy target.
   * @param {Phaser.Scene} scene
   * @param {number} x - Starting x position
   * @param {number} y - Starting y position
   * @param {Phaser.GameObjects.Sprite} target - The enemy to pursue
   * @param {number} damage - Damage dealt on contact
   * @param {number} speed - Movement speed in pixels/second
   * @param {number} [pierce=0] - Number of additional enemies to hit after the first
   * @param {string} [source=''] - Tower type key for damage-type checks
   */
  constructor(scene, x, y, target, damage, speed, pierce = 0, source = '') {
    if (!scene.textures.exists('projectile')) {
      const gfx = scene.add.graphics();
      gfx.fillStyle(0xFFF8DC, 1);
      gfx.fillCircle(4, 4, 4);
      gfx.generateTexture('projectile', 8, 8);
      gfx.destroy();
    }

    super(scene, x, y, 'projectile');

    this.target = target;
    this.damage = damage;
    this.speed = speed;
    this.pierce = pierce;
    this.source = source;
    this.alive = true;
    this.hitEnemies = new Set();

    this.velocityX = 0;
    this.velocityY = 0;
    this.orphanTimer = 0;

    scene.add.existing(this);
    if (scene.physics) scene.physics.add.existing(this);
    if (scene.projectiles) scene.projectiles.add(this);
  }

  /**
   * Move toward target, check for hits, handle pierce and orphaned flight.
   * @param {number} time
   * @param {number} delta
   */
  update(time, delta) {
    if (!this.alive || !this.active) return;

    const dt = delta / 1000;

    if (this.target && this.target.active && this.target.alive) {
      const angle = angleBetween(this, this.target);
      this.velocityX = Math.cos(angle) * this.speed;
      this.velocityY = Math.sin(angle) * this.speed;

      if (this.body) {
        this.scene.physics.moveToObject(this, this.target, this.speed);
      } else {
        this.x += this.velocityX * dt;
        this.y += this.velocityY * dt;
      }

      if (distanceBetween(this, this.target) < HIT_RADIUS) {
        this.hitEnemy(this.target);
        return;
      }
    } else {
      this.x += this.velocityX * dt;
      this.y += this.velocityY * dt;
      this.orphanTimer += delta;

      if (this.orphanTimer >= ORPHAN_LIFETIME_MS) {
        this.selfDestruct();
        return;
      }

      const enemies = this.scene.enemies?.getChildren() ?? [];
      for (const enemy of enemies) {
        if (enemy.alive && !this.hitEnemies.has(enemy) && distanceBetween(this, enemy) < HIT_RADIUS) {
          this.hitEnemy(enemy);
          return;
        }
      }
    }

    const { width, height } = this.scene.scale;
    if (this.x < -50 || this.x > width + 50 || this.y < -50 || this.y > height + 50) {
      this.selfDestruct();
    }
  }

  /**
   * Process a hit on an enemy: apply damage, handle pierce continuation.
   * @param {import('./Enemy.js').Enemy} enemy
   */
  hitEnemy(enemy) {
    if (this.hitEnemies.has(enemy)) return;
    this.hitEnemies.add(enemy);

    enemy.takeDamage(this.damage, this.source);

    if (this.pierce > 0) {
      this.pierce--;
      const enemies = this.scene.enemies?.getChildren() ?? [];
      const next = enemies.find(
        e => e.alive && e.active && !this.hitEnemies.has(e) &&
             distanceBetween(this, e) < PIERCE_SCAN_RADIUS
      );
      this.target = next ?? null;
    } else {
      this.selfDestruct();
    }
  }

  /** Remove this projectile from the scene. */
  selfDestruct() {
    this.alive = false;
    if (this.body) this.body.stop();
    this.destroy();
  }
}
