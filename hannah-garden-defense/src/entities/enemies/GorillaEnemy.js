import { Enemy } from '../Enemy.js';

export class GorillaEnemy extends Enemy {
  /**
   * Fast gorilla enemy that is immune to all slow effects.
   * Immunity is handled by the base Enemy via config.immuneToSlow.
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {object} pathManager
   * @param {number} [difficulty=1]
   */
  constructor(scene, x, y, pathManager, difficulty = 1) {
    super(scene, x, y, 'GORILLA', pathManager, difficulty);
  }
}
