import { Enemy } from '../Enemy.js';

export class ParrotEnemy extends Enemy {
  /**
   * Flying parrot that takes a straight-line aerial path from start to gate,
   * bypassing ground obstacles and PigWalls.
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {object} pathManager
   * @param {number} [difficulty=1]
   */
  constructor(scene, x, y, pathManager, difficulty = 1) {
    super(scene, x, y, 'PARROT', pathManager, difficulty);

    const waypoints = pathManager.getWaypoints();
    this.aerialPath = waypoints.length >= 2
      ? [{ x: waypoints[0].x, y: waypoints[0].y },
         { x: waypoints[waypoints.length - 1].x, y: waypoints[waypoints.length - 1].y }]
      : [...waypoints];
    this.aerialIndex = 0;
  }

  /**
   * Fly in a straight line from spawn to gate, ignoring the ground path.
   * @param {number} time
   * @param {number} delta
   */
  update(time, delta) {
    if (!this.alive || !this.active) return;
    this.drawHpBar();
    if (this.frozen) return;

    if (this.aerialIndex >= this.aerialPath.length) {
      this.reachGate();
      return;
    }

    const target = this.aerialPath[this.aerialIndex];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 2) {
      this.aerialIndex++;
      if (this.aerialIndex >= this.aerialPath.length) {
        this.reachGate();
      }
      return;
    }

    const angle = Math.atan2(dy, dx);
    const move = this.speed * (delta / 1000);
    this.x += Math.cos(angle) * move;
    this.y += Math.sin(angle) * move;
  }
}
