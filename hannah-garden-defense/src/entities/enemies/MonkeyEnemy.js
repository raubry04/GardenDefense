import { Enemy } from '../Enemy.js';

export class MonkeyEnemy extends Enemy {
  /**
   * Monkey enemy that has a chance to steal Sunshine Points when hit.
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {object} pathManager
   * @param {number} [difficulty=1]
   */
  constructor(scene, x, y, pathManager, difficulty = 1) {
    super(scene, x, y, 'MONKEY', pathManager, difficulty);
  }

  /**
   * On taking damage, roll for a point-steal and emit event if triggered.
   * @param {number} amount
   * @param {string} [source]
   */
  takeDamage(amount, source) {
    super.takeDamage(amount, source);

    if (this.alive && amount > 0 && Math.random() < (this.config.stealChance ?? 0.2)) {
      this.scene.events.emit('points-stolen', this.config.stealAmount ?? 5);
    }
  }
}
