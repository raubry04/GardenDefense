import { GameConfig } from '../config.js';
import { TILE } from './battleConstants.js';
import { updateEnemyStatusFx, updateStatusRing } from './EnemyStatusFx.js';

export class EnemyBehavior {
  constructor(scene) {
    this.scene = scene;
  }

  _faceMovement(enemy, dx) {
    if (Math.abs(dx) < 0.5) return;
    const facingRight = dx > 0;
    if (facingRight !== enemy.lastFacingRight) {
      enemy.sprite.flipX = !facingRight;
      enemy.lastFacingRight = facingRight;
    }
  }

  updateEnemies(delta) {
    const s = this.scene;
    for (let i = s.enemies.length - 1; i >= 0; i--) {
      const enemy = s.enemies[i];
      if (!enemy.alive) {
        s.enemies.splice(i, 1);
        continue;
      }

      const prevX = enemy.x;
      const syncBars = () => {
        const dy = enemy.hpBarDy ?? TILE / 2 - 4;
        const by = enemy.y - dy;
        enemy.hpBarBg?.setPosition(enemy.x, by);
        enemy.hpBar?.setPosition(enemy.x, by);
        updateEnemyStatusFx(enemy);
        updateStatusRing(enemy);
        s.battleVfx?.updateEnemyMotionFx(enemy, delta);
      };

      if (enemy.stunTimer > 0) {
        enemy.stunTimer -= delta;
        syncBars();
        continue;
      }

      let speed = enemy.speed;
      if (enemy.slowTimer > 0) {
        speed *= (1 - enemy.slowPercent);
        enemy.slowTimer -= delta;
      }

      const crocCfg = GameConfig.enemies.CROCODILE;
      if (enemy.type === 'CROCODILE' && crocCfg?.ambushAtPathProgress != null) {
        const totalSegs = Math.max(1, s.waypoints.length - 1);
        const progress = enemy.waypointIndex / totalSegs;
        if (progress >= crocCfg.ambushAtPathProgress) {
          speed = crocCfg.ambushBurstSpeed ?? speed * 2.5;
        }
      }

      if (enemy.type === 'ELEPHANT') {
        enemy.stompTimer = (enemy.stompTimer || 0) + delta;
        if (enemy.stompTimer >= 5000) {
          enemy.stompTimer = 0;
          const cfg = GameConfig.enemies.ELEPHANT;
          const stompRange = cfg.stompRange || 100;
          let stomped = false;
          for (const tower of s.towers) {
            if (tower.hp <= 0) continue;
            if (Phaser.Math.Distance.Between(enemy.x, enemy.y, tower.x, tower.y) <= stompRange) {
              tower.fireRateMultiplier = 2;
              stomped = true;
              s.time.delayedCall(cfg.stompSlowMs || 3000, () => {
                if (tower.hp > 0) tower.fireRateMultiplier = 1;
              });
            }
          }
          if (stomped) {
            s.abilityController.showAbilityPulse({ x: enemy.x, y: enemy.y }, 0x888888, stompRange);
          }
        }
      }

      if (enemy.type === 'HIPPO') {
        enemy.surgeCooldownMs = (enemy.surgeCooldownMs || 0) + delta;
        if (enemy.surgeCooldownMs >= 4000) {
          enemy.surgeCooldownMs = 0;
          enemy.surgeActiveMs = 800;
        }
        if ((enemy.surgeActiveMs || 0) > 0) {
          enemy.surgeActiveMs -= delta;
          speed *= 1.5;
        }
      }

      if (enemy.flies) {
        const gate = s.waypoints[s.waypoints.length - 1];
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, gate.x, gate.y);
        const move = speed * (delta / 1000);
        enemy.x += Math.cos(angle) * move;
        enemy.y += Math.sin(angle) * move;
        this._faceMovement(enemy, enemy.x - prevX);
        enemy.sprite.setPosition(enemy.x, enemy.y);
        syncBars();

        if (Phaser.Math.Distance.Between(enemy.x, enemy.y, gate.x, gate.y) < TILE * 0.5) {
          this.enemyReachedGate(enemy);
          s.enemies.splice(i, 1);
        }
        continue;
      }

      if (enemy.type === 'BEAR') {
        let nearestTower = null;
        let nearestDist = TILE * 2.5;
        for (const tower of s.towers) {
          if (tower.hp <= 0) continue;
          const d = Phaser.Math.Distance.Between(enemy.x, enemy.y, tower.x, tower.y);
          if (d < nearestDist) {
            nearestDist = d;
            nearestTower = tower;
          }
        }
        if (nearestTower) {
          if (nearestDist < TILE * 0.7) {
            enemy.attackTimer = (enemy.attackTimer || 0) + delta;
            if (enemy.attackTimer >= 1000) {
              enemy.attackTimer = 0;
              this.damageTower(nearestTower, GameConfig.enemies.BEAR.towerDmg || 15);
            }
          } else {
            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, nearestTower.x, nearestTower.y);
            const mv = speed * (delta / 1000);
            enemy.x += Math.cos(angle) * mv;
            enemy.y += Math.sin(angle) * mv;
            this._faceMovement(enemy, enemy.x - prevX);
            enemy.sprite.setPosition(enemy.x, enemy.y);
            syncBars();
          }
          continue;
        }
      }

      const pigWall = s.towers.find(t =>
        t.type === 'PIG_WALL' && t.onPath && t.hp > 0 &&
        Phaser.Math.Distance.Between(enemy.x, enemy.y, t.x, t.y) < TILE
      );
      if (pigWall) {
        enemy.attackTimer = (enemy.attackTimer || 0) + delta;
        if (enemy.attackTimer >= 800) {
          enemy.attackTimer = 0;
          const wallMult = GameConfig.enemies[enemy.type]?.wallDamageMult ?? 1;
          this.damageTower(pigWall, enemy.damage * 2 * wallMult);
          if (pigWall.thorns > 0 && enemy.alive) {
            s.towerCombat.damageEnemy(enemy, pigWall.thorns);
          }
        }
        continue;
      }

      const target = s.waypoints[enemy.waypointIndex];
      if (!target) {
        this.enemyReachedGate(enemy);
        s.enemies.splice(i, 1);
        continue;
      }

      const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, target.x, target.y);
      const move = speed * (delta / 1000);
      enemy.x += Math.cos(angle) * move;
      enemy.y += Math.sin(angle) * move;
      this._faceMovement(enemy, enemy.x - prevX);
      enemy.sprite.setPosition(enemy.x, enemy.y);
      syncBars();

      const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, target.x, target.y);
      if (dist < 8) {
        enemy.waypointIndex++;
      }
    }
  }

  enemyReachedGate(enemy) {
    const s = this.scene;
    // Ignore late leaks once the battle is decided (victory queued or defeat handled),
    // so lives can't go negative and victory can't be overridden by a game-over.
    if (s._defeatHandled || s._battleEnded) {
      enemy.alive = false;
      s.battleVfx?.destroyEnemyFx(enemy);
      enemy.sprite?.destroy?.();
      enemy.hpBar?.destroy?.();
      enemy.hpBarBg?.destroy?.();
      return;
    }
    enemy.alive = false;
    s.battleVfx?.destroyEnemyFx(enemy);
    enemy.sprite.destroy();
    enemy.hpBar.destroy();
    enemy.hpBarBg.destroy();

    s.cameras.main.shake(120, 0.004);

    const last = s.waypoints[s.waypoints.length - 1];
    s.battleVfx?.burstGate(last.x, last.y);

    const cap = GameConfig.maxLifeLossPerLeak ?? Infinity;
    const lifeLoss = Math.min(enemy.damage, cap);
    s.lives -= lifeLoss;
    this._showGateLeakFeedback(last, lifeLoss);
    s.game.events.emit('lives-changed', { lives: s.lives });

    if (s.lives <= 0) {
      if (s._defeatHandled) return;
      s._defeatHandled = true;
      s.lives = 0;
      s.scene.stop('UIScene');
      s.scene.stop('GameScene');
      s.scene.start('GameOverScene', {
        waveReached: s.waveManager.getCurrentWave(),
        zone: s.zone,
        battle: s.battle,
        playerName: s.playerName,
      });
    }
  }

  _showGateLeakFeedback(gate, lifeLoss) {
    const s = this.scene;
    const label = lifeLoss > 1 ? `An animal got in! -${lifeLoss}` : 'An animal got in! -1';
    if (s.towerPlacement?.showFloatingText) {
      s.towerPlacement.showFloatingText(gate.x, gate.y - TILE * 0.9, label, '#E63946');
    }
  }

  damageTower(tower, damage) {
    const s = this.scene;
    if (tower.shielded) return;
    tower.hp -= damage;
    s.towerCombat.showFloatingDamage(tower.x, tower.y - 20, damage);

    if (tower.hp <= 0) this.destroyTower(tower);
  }

  destroyTower(tower) {
    const s = this.scene;
    const idx = s.towers.indexOf(tower);
    if (idx !== -1) s.towers.splice(idx, 1);

    s.tileGrid[tower.gridRow][tower.gridCol] = tower.onPath ? 'path' : 'grass';
    if (tower.sprite?.active) tower.sprite.destroy();
    s.towerPlacement.spawnPlacementParticles(tower.x, tower.y);
  }
}
