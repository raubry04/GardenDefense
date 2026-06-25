import { Enemy } from '../Enemy.js';
import { SnakeEnemy } from './SnakeEnemy.js';

export class FrogEnemy extends Enemy {
  /**
   * Frog enemy that splits into snakes on death.
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {object} pathManager
   * @param {number} [difficulty=1]
   */
  constructor(scene, x, y, pathManager, difficulty = 1) {
    super(scene, x, y, 'FROG', pathManager, difficulty);
  }

  /**
   * On death, spawn child snakes at the same position and path progress
   * before running the standard death sequence.
   */
  die() {
    if (!this.alive) return;

    const count = this.config.splitsInto ?? 2;
    for (let i = 0; i < count; i++) {
      const offsetX = (i - (count - 1) / 2) * 10;
      const snake = new SnakeEnemy(this.scene, this.x + offsetX, this.y, this.pathManager);
      snake.currentWaypointIndex = this.currentWaypointIndex;
      if (this.scene.enemies) this.scene.enemies.add(snake);
    }

    super.die();
  }
}
