import { GameConfig } from '../config.js';
import { distanceBetween } from '../utils/MathHelpers.js';

const COOLDOWN_REDUCTION_PER_LEVEL = 0.05;
const MIN_COOLDOWN_FACTOR = 0.5;

export class Hannah extends Phaser.GameObjects.Sprite {
  /**
   * The player's hero character, placed on a buildable tile each battle.
   * Provides powerful abilities on cooldown timers.
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   */
  constructor(scene, x, y) {
    super(scene, x, y, 'hannah', 0);

    this.level = 1;
    this.abilities = {};
    this.lastUsed = {};

    for (const [key, cfg] of Object.entries(GameConfig.hannahAbilities)) {
      this.abilities[key] = { ...cfg };
      this.lastUsed[key] = -Infinity;
    }

    this.setTint(0xFFD700);
    scene.add.existing(this);
  }

  /**
   * Activate an ability if it is off cooldown and unlocked.
   * @param {'SUNSHINE_BURST'|'GARDEN_RAIN'|'RAINBOW_SHIELD'|'FLOWER_BOMB'} key
   * @returns {boolean} True if the ability fired
   */
  useAbility(key) {
    if (!this.canUseAbility(key)) return false;

    const ability = this.abilities[key];
    this.lastUsed[key] = this.scene.time.now;

    switch (key) {
      case 'SUNSHINE_BURST': {
        const enemies = this.scene.enemies?.getChildren() ?? [];
        for (const enemy of enemies) {
          if (enemy.alive && !enemy.flies) {
            enemy.takeDamage(ability.damage, 'HANNAH');
          }
        }
        break;
      }

      case 'GARDEN_RAIN': {
        const towers = this.scene.towers?.getChildren() ?? [];
        for (const tower of towers) {
          if (tower.active && tower.maxHp !== Infinity) {
            tower.hp = tower.maxHp;
          }
        }
        break;
      }

      case 'RAINBOW_SHIELD': {
        const towers = this.scene.towers?.getChildren() ?? [];
        for (const tower of towers) {
          if (!tower.active) continue;
          tower.shielded = true;
          this.scene.time.delayedCall(ability.duration, () => {
            if (tower.active) tower.shielded = false;
          });
        }
        break;
      }

      case 'FLOWER_BOMB': {
        const enemies = this.scene.enemies?.getChildren() ?? [];
        for (const enemy of enemies) {
          if (enemy.alive && distanceBetween(this, enemy) <= ability.range) {
            enemy.takeDamage(ability.damage, 'HANNAH');
          }
        }
        break;
      }
    }

    this.scene.events.emit('ability-used', key);
    return true;
  }

  /**
   * Check whether an ability is currently usable (unlocked and off cooldown).
   * @param {string} key
   * @returns {boolean}
   */
  canUseAbility(key) {
    const ability = this.abilities[key];
    if (!ability) return false;
    if (ability.unlockLevel && this.level < ability.unlockLevel) return false;

    const elapsed = this.scene.time.now - this.lastUsed[key];
    return elapsed >= this._adjustedCooldown(key);
  }

  /**
   * Get a 0-1 progress value representing how far through the cooldown this ability is.
   * Returns 1 when ready to use.
   * @param {string} key
   * @returns {number}
   */
  getCooldownProgress(key) {
    const ability = this.abilities[key];
    if (!ability) return 1;

    const elapsed = this.scene.time.now - this.lastUsed[key];
    return Math.min(1, elapsed / this._adjustedCooldown(key));
  }

  /**
   * Compute the cooldown for an ability after level-based reduction.
   * @param {string} key
   * @returns {number} Cooldown in ms
   * @private
   */
  _adjustedCooldown(key) {
    const base = this.abilities[key]?.cooldown ?? 30000;
    const factor = Math.max(MIN_COOLDOWN_FACTOR, 1 - (this.level - 1) * COOLDOWN_REDUCTION_PER_LEVEL);
    return base * factor;
  }
}
