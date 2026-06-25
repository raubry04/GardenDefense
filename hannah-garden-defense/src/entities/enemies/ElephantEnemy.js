import { Enemy } from '../Enemy.js';
import { distanceBetween } from '../../utils/MathHelpers.js';

const STOMP_COOLDOWN = 5000;

export class ElephantEnemy extends Enemy {
  /**
   * Boss elephant with high HP, armor vs eggs, and a periodic stomp that
   * slows tower fire rates in a radius.
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {object} pathManager
   * @param {number} [difficulty=1]
   */
  constructor(scene, x, y, pathManager, difficulty = 1) {
    super(scene, x, y, 'ELEPHANT', pathManager, difficulty);
    this.lastStomp = 0;
  }

  /**
   * Periodically stomp, doubling fire-rate intervals of nearby towers
   * for the configured duration. Then follow the normal path.
   * @param {number} time
   * @param {number} delta
   */
  update(time, delta) {
    if (!this.alive || !this.active) return;
    this.drawHpBar();
    if (this.frozen) return;

    if (time - this.lastStomp >= STOMP_COOLDOWN) {
      const stompRange = this.config.stompRange ?? 100;
      const slowMs = this.config.stompSlowMs ?? 3000;
      const towers = this.scene.towers?.getChildren() ?? [];
      let stomped = false;

      for (const tower of towers) {
        if (!tower.active) continue;
        if (distanceBetween(this, tower) <= stompRange) {
          tower.fireRateMultiplier = 2;
          stomped = true;

          this.scene.time.delayedCall(slowMs, () => {
            if (tower.active) tower.fireRateMultiplier = 1;
          });
        }
      }

      if (stomped) this.lastStomp = time;
    }

    this.moveAlongPath(time, delta);
  }
}
