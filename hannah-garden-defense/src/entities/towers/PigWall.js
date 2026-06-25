import { Tower } from '../Tower.js';

const HP_BAR_WIDTH = 40;
const HP_BAR_HEIGHT = 5;

export class PigWall extends Tower {
  /**
   * Pig wall placed on the path to block enemies. Has HP and does not fire.
   * Enemies must destroy it to pass.
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   */
  constructor(scene, x, y) {
    super(scene, x, y, 'PIG_WALL');
    this.hp = this.config.hp;
    this.maxHp = this.config.hp;

    this.hpBar = scene.add.graphics();
    this.hpBar.setDepth(10);
    this.drawHpBar();
  }

  /**
   * Redraw the HP bar each frame to track position.
   * @param {number} time
   * @param {number} delta
   */
  update(time, delta) {
    this.drawHpBar();
  }

  /** Render a colored HP bar above the pig wall. */
  drawHpBar() {
    this.hpBar.clear();
    const xOff = this.x - HP_BAR_WIDTH / 2;
    const yOff = this.y - this.displayHeight / 2 - 10;

    this.hpBar.fillStyle(0x000000, 0.6);
    this.hpBar.fillRect(xOff, yOff, HP_BAR_WIDTH, HP_BAR_HEIGHT);

    const hpRatio = Math.max(0, this.hp / this.maxHp);
    const color = hpRatio > 0.5 ? 0x00CC00 : hpRatio > 0.25 ? 0xCCCC00 : 0xCC0000;
    this.hpBar.fillStyle(color, 1);
    this.hpBar.fillRect(xOff, yOff, HP_BAR_WIDTH * hpRatio, HP_BAR_HEIGHT);
  }

  /**
   * Apply damage and refresh the HP bar.
   * @param {number} amount
   */
  takeDamage(amount) {
    super.takeDamage(amount);
    if (this.active) this.drawHpBar();
  }

  /** Clean up the HP bar graphic before destruction. */
  destroy() {
    if (this.hpBar) this.hpBar.destroy();
    super.destroy();
  }
}
