import { GameConfig } from '../config.js';
import { adjustedAbilityCooldown } from '../utils/hannahProgress.js';
import { TILE } from './battleConstants.js';

export class AbilityController {
  constructor(scene) {
    this.scene = scene;
  }

  setupAbilities() {
    const s = this.scene;
    s.game.events.on('ability-used', (data) => {
      const key = typeof data === 'string' ? data : data?.key;
      if (key) this.useAbility(key);
    });
  }

  abilityCooldownMs(key) {
    const s = this.scene;
    const base = GameConfig.hannahAbilities[key]?.cooldown ?? 30000;
    return adjustedAbilityCooldown(base, s.hannahLevel);
  }

  canUseAbility(key) {
    const s = this.scene;
    const ability = GameConfig.hannahAbilities[key];
    if (!ability) return false;
    if (ability.unlockLevel && s.hannahLevel < ability.unlockLevel) return false;
    return s.time.now - s.abilityLastUsed[key] >= this.abilityCooldownMs(key);
  }

  useAbility(key) {
    const s = this.scene;
    if (!this.canUseAbility(key)) return false;

    const ability = GameConfig.hannahAbilities[key];
    s.abilityLastUsed[key] = s.time.now;

    switch (key) {
      case 'SUNSHINE_BURST': {
        for (const enemy of s.enemies) {
          if (!enemy.alive) continue;
          if (enemy.flies) continue;
          s.towerCombat.damageEnemy(enemy, ability.damage);
        }
        this.showAbilityPulse(s.waypoints[Math.floor(s.waypoints.length / 2)], 0xFFD700);
        break;
      }
      case 'GARDEN_RAIN': {
        for (const tower of s.towers) {
          if (tower.hp <= 0) continue;
          tower.hp = tower.maxHp;
          s.tweens.add({
            targets: tower.sprite,
            alpha: { from: 0.5, to: 1 },
            duration: 300,
            yoyo: true,
          });
        }
        break;
      }
      case 'RAINBOW_SHIELD': {
        for (const tower of s.towers) {
          if (tower.hp <= 0) continue;
          tower.shielded = true;
          s.time.delayedCall(ability.duration, () => {
            if (tower.hp > 0) tower.shielded = false;
          });
        }
        break;
      }
      case 'FLOWER_BOMB': {
        const center = s.waypoints[Math.floor(s.waypoints.length / 2)];
        const rangePx = ability.range * (GameConfig.tileSize / 64);
        for (const enemy of s.enemies) {
          if (!enemy.alive) continue;
          if (Phaser.Math.Distance.Between(center.x, center.y, enemy.x, enemy.y) <= rangePx) {
            s.towerCombat.damageEnemy(enemy, ability.damage);
          }
        }
        this.showAbilityPulse(center, 0xFF69B4, rangePx);
        break;
      }
    }

    s.sound.play('abilityUsed', { volume: GameConfig.audio.sfxVolume });
    s.game.events.emit('ability-fired', {
      key,
      cooldown: this.abilityCooldownMs(key),
    });
    return true;
  }

  showAbilityPulse(center, color, radius = TILE * 2) {
    const s = this.scene;
    const pulse = s.add.circle(center.x, center.y, radius, color, 0.35)
      .setStrokeStyle(2, color, 0.6).setDepth(35);
    s.tweens.add({
      targets: pulse, scaleX: 1.4, scaleY: 1.4, alpha: 0,
      duration: 450, onComplete: () => pulse.destroy(),
    });
  }
}
