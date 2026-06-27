import { GameConfig } from '../config.js';
import { adjustedAbilityCooldown } from '../utils/hannahProgress.js';
import { TILE } from './battleConstants.js';

export class AbilityController {
  constructor(scene) {
    this.scene = scene;
    this._flowerBombAimGfx = null;
    this._flowerBombCleanup = null;
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
    if (s._flowerBombAiming) return false;
    return s.time.now - s.abilityLastUsed[key] >= this.abilityCooldownMs(key);
  }

  useAbility(key) {
    const s = this.scene;
    if (!this.canUseAbility(key)) {
      const ability = GameConfig.hannahAbilities[key];
      let reason = 'Ability unavailable';
      if (ability?.unlockLevel && s.hannahLevel < ability.unlockLevel) {
        reason = `Unlocks at Hannah Level ${ability.unlockLevel}`;
      } else if (s._flowerBombAiming) {
        reason = 'Finish placing Flower Bomb';
      } else {
        reason = 'On cooldown';
      }
      s.game.events.emit('ability-rejected', { key, reason });
      return false;
    }

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
        s.battleVfx?.burstAbility('SUNSHINE_BURST', s.waypoints[Math.floor(s.waypoints.length / 2)].x, s.waypoints[Math.floor(s.waypoints.length / 2)].y);
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
        this.startFlowerBombAim(ability);
        break;
      }
    }

    if (key !== 'FLOWER_BOMB') {
      s.sound.play('abilityUsed', { volume: GameConfig.audio.sfxVolume });
      s.game.events.emit('ability-fired', {
        key,
        cooldown: this.abilityCooldownMs(key),
      });
    }
    return true;
  }

  startFlowerBombAim(ability) {
    const s = this.scene;
    if (s._flowerBombAiming) return;

    s._flowerBombAiming = true;
    const rangePx = ability.range * (GameConfig.tileSize / 64);
    const pointer = s.input.activePointer;
    const startX = pointer.worldX || s.waypoints[Math.floor(s.waypoints.length / 2)].x;
    const startY = pointer.worldY || s.waypoints[Math.floor(s.waypoints.length / 2)].y;

    this._flowerBombAimGfx = s.add.circle(startX, startY, rangePx, 0xFF69B4, 0.2)
      .setStrokeStyle(2, 0xFF69B4, 0.65).setDepth(35);

    const hint = s.add.text(startX, startY - rangePx - 12, 'Tap to detonate', {
      fontFamily: 'Kenney Future',
      fontSize: '12px',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(36);

    const onMove = (ptr) => {
      this._flowerBombAimGfx.setPosition(ptr.worldX, ptr.worldY);
      hint.setPosition(ptr.worldX, ptr.worldY - rangePx - 12);
    };

    const detonateAt = (x, y) => {
      this._clearFlowerBombAim();
      for (const enemy of s.enemies) {
        if (!enemy.alive) continue;
        if (Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y) <= rangePx) {
          s.towerCombat.damageEnemy(enemy, ability.damage);
        }
      }
      s.battleVfx?.burstAbility('FLOWER_BOMB', x, y, rangePx);
      if (!s.battleVfx) {
        this.showAbilityPulse({ x, y }, 0xFF69B4, rangePx);
      }
      s.sound.play('abilityUsed', { volume: GameConfig.audio.sfxVolume });
      s.game.events.emit('ability-fired', {
        key: 'FLOWER_BOMB',
        cooldown: this.abilityCooldownMs('FLOWER_BOMB'),
      });
    };

    const onTap = (ptr) => {
      detonateAt(ptr.worldX, ptr.worldY);
    };

    this._flowerBombCleanup = () => {
      s.input.off('pointermove', onMove);
      s.input.off('pointerdown', onTap);
      hint.destroy();
    };

    s.input.on('pointermove', onMove);
    s.time.delayedCall(50, () => {
      if (s._flowerBombAiming) s.input.once('pointerdown', onTap);
    });

    s.time.delayedCall(5000, () => {
      if (!s._flowerBombAiming) return;
      const fallback = s.waypoints[Math.floor(s.waypoints.length / 2)];
      detonateAt(fallback.x, fallback.y);
    });
  }

  _clearFlowerBombAim() {
    const s = this.scene;
    s._flowerBombAiming = false;
    this._flowerBombCleanup?.();
    this._flowerBombCleanup = null;
    if (this._flowerBombAimGfx?.active) this._flowerBombAimGfx.destroy();
    this._flowerBombAimGfx = null;
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
