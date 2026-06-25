import { GameConfig } from '../config.js';
import { TOWER_SPRITES } from '../utils/AssetRegistry.js';
import { distanceBetween } from '../utils/MathHelpers.js';

export class Tower extends Phaser.GameObjects.Sprite {
  /**
   * Create a new tower.
   * @param {Phaser.Scene} scene - The scene this tower belongs to
   * @param {number} x - World x position
   * @param {number} y - World y position
   * @param {'RABBIT'|'CHICKEN'|'DOG'|'OWL'|'DUCK'|'PENGUIN'|'PIG_WALL'} type - Tower type key
   */
  constructor(scene, x, y, type) {
    super(scene, x, y, TOWER_SPRITES[type]);

    this.type = type;
    this.tier = 0;
    this.config = { ...GameConfig.towers[type] };
    this.placementCost = this.config.cost;
    this.lastFired = 0;
    this.hp = this.config.hp ?? Infinity;
    this.maxHp = this.hp;
    this.shielded = false;
    this.fireRateMultiplier = 1;

    scene.add.existing(this);
  }

  /**
   * Main update loop — override in subclasses for attack behavior.
   * @param {number} time - Current game time in ms
   * @param {number} delta - Time elapsed since last frame in ms
   */
  update(time, delta) {}

  /**
   * Find all living enemies within this tower's configured range.
   * @returns {import('./Enemy.js').Enemy[]}
   */
  getEnemiesInRange() {
    const enemies = this.scene.enemies?.getChildren() ?? [];
    const range = this.config.range ?? 0;
    return enemies.filter(e => e.alive && distanceBetween(this, e) <= range);
  }

  /**
   * Upgrade tower to the next tier, merging new stats and updating visuals.
   * @returns {boolean} True if the upgrade was applied
   */
  upgrade() {
    const upgrades = GameConfig.towers[this.type].upgrades;
    if (this.tier >= upgrades.length) return false;

    const upgradeData = upgrades[this.tier];
    this.tier++;

    for (const [key, value] of Object.entries(upgradeData)) {
      if (key !== 'cost') this.config[key] = value;
    }

    if (this.config.hp !== undefined) {
      this.maxHp = this.config.hp;
      this.hp = this.maxHp;
    }

    const tierScale = 1 + this.tier * 0.1;
    this.setScale(tierScale);
    const tierTints = [0xFFFFFF, 0xC0E0FF, 0xFFD700];
    this.setTint(tierTints[this.tier]);

    return true;
  }

  /**
   * Get the sunshine-point cost to reach the next tier.
   * @returns {number|null} Cost for next tier, or null if already at max
   */
  getUpgradeCost() {
    const upgrades = GameConfig.towers[this.type].upgrades;
    if (this.tier >= upgrades.length) return null;
    return upgrades[this.tier].cost;
  }

  /**
   * Apply damage to this tower (used by PIG_WALL enemies and bear attacks).
   * Ignored while Rainbow Shield is active.
   * @param {number} amount - Damage to apply
   */
  takeDamage(amount) {
    if (this.shielded) return;
    this.hp -= amount;

    this.setTint(0xFF0000);
    this.scene.time.delayedCall(100, () => {
      if (this.active) {
        const tierTints = [0xFFFFFF, 0xC0E0FF, 0xFFD700];
        this.setTint(tierTints[this.tier]);
      }
    });

    if (this.hp <= 0) {
      this.scene.events.emit('tower-destroyed', this);
      this.destroy();
    }
  }

  /**
   * Calculate the refund value when selling this tower.
   * @returns {number}
   */
  getSellValue() {
    return Math.floor(this.placementCost * GameConfig.sellRefundPercent);
  }

  /** Clean up any resources before removal. */
  destroy() {
    super.destroy();
  }
}
