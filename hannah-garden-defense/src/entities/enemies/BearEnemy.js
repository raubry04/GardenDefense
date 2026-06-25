import { Enemy } from '../Enemy.js';
import { distanceBetween } from '../../utils/MathHelpers.js';

const TOWER_AGGRO_RANGE = 150;
const MELEE_RANGE = 20;
const ATTACK_INTERVAL_MS = 1000;

export class BearEnemy extends Enemy {
  /**
   * Bear enemy that deviates from the path to attack nearby towers.
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {object} pathManager
   * @param {number} [difficulty=1]
   */
  constructor(scene, x, y, pathManager, difficulty = 1) {
    super(scene, x, y, 'BEAR', pathManager, difficulty);
    this.targetTower = null;
    this.lastTowerAttack = 0;
    this.attacking = false;
  }

  /**
   * Check for towers within aggro range. If found, deviate to attack.
   * Otherwise follow the normal ground path.
   * @param {number} time
   * @param {number} delta
   */
  update(time, delta) {
    if (!this.alive || !this.active) return;
    this.drawHpBar();
    if (this.frozen) return;

    const towers = this.scene.towers?.getChildren() ?? [];

    if (!this.attacking) {
      let nearest = null;
      let nearestDist = Infinity;
      for (const tower of towers) {
        if (!tower.active) continue;
        const dist = distanceBetween(this, tower);
        if (dist < TOWER_AGGRO_RANGE && dist < nearestDist) {
          nearest = tower;
          nearestDist = dist;
        }
      }
      if (nearest) {
        this.attacking = true;
        this.targetTower = nearest;
      }
    }

    if (this.attacking) {
      if (!this.targetTower || !this.targetTower.active) {
        this.attacking = false;
        this.targetTower = null;
      } else {
        const dist = distanceBetween(this, this.targetTower);

        if (dist > TOWER_AGGRO_RANGE) {
          this.attacking = false;
          this.targetTower = null;
        } else if (dist > MELEE_RANGE) {
          const angle = Math.atan2(
            this.targetTower.y - this.y,
            this.targetTower.x - this.x
          );
          const move = this.speed * (delta / 1000);
          this.x += Math.cos(angle) * move;
          this.y += Math.sin(angle) * move;
          return;
        } else {
          if (time - this.lastTowerAttack >= ATTACK_INTERVAL_MS) {
            this.targetTower.takeDamage(this.config.towerDmg ?? 15);
            this.lastTowerAttack = time;
          }
          return;
        }
      }
    }

    this.moveAlongPath(time, delta);
  }
}
