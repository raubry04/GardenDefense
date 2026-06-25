import { Tower } from '../Tower.js';

export class PenguinFreezer extends Tower {
  /**
   * Penguin tower that periodically emits a freeze pulse, stopping all enemies in range.
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   */
  constructor(scene, x, y) {
    super(scene, x, y, 'PENGUIN');
    this.lastFreeze = 0;
  }

  /**
   * When cooldown expires, freeze every enemy in range for freezeMs.
   * @param {number} time
   * @param {number} delta
   */
  update(time, delta) {
    const cooldown = (this.config.cooldown ?? 8000) * this.fireRateMultiplier;
    if (time - this.lastFreeze < cooldown) return;

    const enemies = this.getEnemiesInRange();
    if (enemies.length === 0) return;

    this.lastFreeze = time;

    for (const enemy of enemies) {
      enemy.applyFreeze(this.config.freezeMs);
    }

    const savedTier = this.tier;
    this.setTint(0x4488FF);
    this.scene.tweens.add({
      targets: this,
      alpha: 0.6,
      duration: 200,
      yoyo: true,
      onComplete: () => {
        if (!this.active) return;
        this.setAlpha(1);
        const tierTints = [0xFFFFFF, 0xC0E0FF, 0xFFD700];
        this.setTint(tierTints[savedTier]);
      }
    });

    this.scene.events.emit('tower-fired', this);
  }
}
