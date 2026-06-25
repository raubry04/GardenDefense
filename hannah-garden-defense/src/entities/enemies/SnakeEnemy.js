import { Enemy } from '../Enemy.js';

export class SnakeEnemy extends Enemy {
  /**
   * Basic snake enemy with no special abilities.
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {object} pathManager - Waypoint provider
   * @param {number} [difficulty=1]
   */
  constructor(scene, x, y, pathManager, difficulty = 1) {
    super(scene, x, y, 'SNAKE', pathManager, difficulty);
  }
}
