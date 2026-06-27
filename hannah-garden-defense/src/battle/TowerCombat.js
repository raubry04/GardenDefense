import { GameConfig } from '../config.js';
import { sfxVol } from '../utils/audioMix.js';
import { TOWER_SPRITES, ENEMY_SPRITES } from '../utils/AssetRegistry.js';
import { hannahLevelFromXp } from '../utils/hannahProgress.js';
import { updateEnemyStatusFx } from './EnemyStatusFx.js';
import { TILE, COLORS } from './battleConstants.js';

export class TowerCombat {
  constructor(scene) {
    this.scene = scene;
    this._cellSize = TILE * 2;
    this._enemyGrid = new Map();
  }

  _rebuildEnemyGrid() {
    const grid = new Map();
    const cs = this._cellSize;
    for (const enemy of this.scene.enemies) {
      if (!enemy.alive) continue;
      const col = Math.floor(enemy.x / cs);
      const row = Math.floor(enemy.y / cs);
      const key = `${row},${col}`;
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key).push(enemy);
    }
    this._enemyGrid = grid;
  }

  _getEnemiesInRange(tower, range) {
    const cs = this._cellSize;
    const minCol = Math.floor((tower.x - range) / cs);
    const maxCol = Math.floor((tower.x + range) / cs);
    const minRow = Math.floor((tower.y - range) / cs);
    const maxRow = Math.floor((tower.y + range) / cs);
    const results = [];
    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const cell = this._enemyGrid.get(`${row},${col}`);
        if (!cell) continue;
        for (const enemy of cell) {
          if (!enemy.alive) continue;
          const dist = Phaser.Math.Distance.Between(tower.x, tower.y, enemy.x, enemy.y);
          if (dist <= range) results.push(enemy);
        }
      }
    }
    return results;
  }

  updateTowers(time, delta) {
    const s = this.scene;
    this._rebuildEnemyGrid();

    for (const tower of s.towers) {
      if (tower.hp <= 0) continue;
      if (tower.damage <= 0 && !tower.slowPercent && !tower.stunMs && !tower.freezeMs) continue;
      const rateMult = tower.fireRateMultiplier || 1;
      if (time - tower.lastFired < tower.fireRate * rateMult) continue;

      const isAoE = GameConfig.towers[tower.type]?.aoe;

      if (isAoE) {
        const targets = this._getEnemiesInRange(tower, tower.range);
        if (targets.length > 0) {
          tower.lastFired = time;
          this.fireAoETower(tower, targets);
        }
      } else {
        let target = null;
        const inRange = this._getEnemiesInRange(tower, tower.range);
        if (tower.type === 'OWL') {
          let bestProgress = -1;
          for (const enemy of inRange) {
            const progress = enemy.waypointIndex ?? 0;
            if (progress > bestProgress) {
              bestProgress = progress;
              target = enemy;
            }
          }
        } else {
          let closestDist = tower.range;
          for (const enemy of inRange) {
            if (tower.type === 'CHICKEN' && enemy.flies) continue;
            if (tower.type === 'CHICKEN' && enemy.type === 'ELEPHANT') continue;
            const dist = Phaser.Math.Distance.Between(tower.x, tower.y, enemy.x, enemy.y);
            if (dist <= closestDist) {
              closestDist = dist;
              target = enemy;
            }
          }
        }
        if (target) {
          tower.lastFired = time;
          this.fireTower(tower, target);
        }
      }
    }
  }

  fireAoETower(tower, targets) {
    const s = this.scene;
    this.towerRecoil(tower);
    this.showAoEPulse(tower);

    for (const target of targets) {
      if (tower.slowPercent > 0 && !GameConfig.enemies[target.type]?.immuneToSlow) {
        target.slowPercent = tower.slowPercent;
        target.slowTimer = 2000;
      }
      if (tower.stunMs > 0 && !GameConfig.enemies[target.type]?.immuneToStun) {
        target.stunTimer = tower.stunMs;
      }
      if (tower.freezeMs > 0 && !GameConfig.enemies[target.type]?.immuneToStun) {
        target.stunTimer = Math.max(target.stunTimer || 0, tower.freezeMs);
        target.frozen = true;
        const freeze = tower.freezeMs;
        s.time.delayedCall(freeze, () => {
          if (target.alive) target.frozen = false;
        });
      }
    }

    s.sound.play('towerFires', { volume: sfxVol('towerFires') });
  }

  showAoEPulse(tower) {
    const s = this.scene;
    if (s.battleVfx?.showAoERing) {
      s.battleVfx.showAoERing(tower.x, tower.y, tower.range);
      return;
    }
    const circle = s.add.circle(tower.x, tower.y, tower.range, COLORS.primary, 0.25)
      .setStrokeStyle(2, COLORS.primary, 0.5).setDepth(30);
    s.tweens.add({
      targets: circle, scaleX: 1.3, scaleY: 1.3, alpha: 0, duration: 300,
      onComplete: () => circle.destroy(),
    });
  }

  spawnProjectile(x, y, target, damage, pierce, source) {
    const s = this.scene;
    const angle = Phaser.Math.Angle.Between(x, y, target.x, target.y);
    const proj = s.battleVfx
      ? s.battleVfx.spawnProjectileSprite(x, y, source, angle)
      : s.add.ellipse(x, y, 10, 7, COLORS.primary).setDepth(30);

    s.projectiles.push({
      sprite: proj,
      x,
      y,
      target,
      speed: 400,
      damage,
      pierce: pierce || 0,
      source: source || '',
      hitEnemies: new Set(),
    });
  }

  fireTower(tower, target) {
    const s = this.scene;
    if (tower.damage > 0) {
      const eggs = tower.eggs || 1;
      const pierce = tower.pierce || 0;
      const source = tower.type;

      if (eggs === 1) {
        this.spawnProjectile(tower.x, tower.y, target, tower.damage, pierce, source);
      } else {
        const baseAngle = Phaser.Math.Angle.Between(tower.x, tower.y, target.x, target.y);
        for (let i = 0; i < eggs; i++) {
          const offset = (i - (eggs - 1) / 2) * 0.15;
          const sx = tower.x + Math.cos(baseAngle + offset) * 10;
          const sy = tower.y + Math.sin(baseAngle + offset) * 10;
          this.spawnProjectile(sx, sy, target, tower.damage, pierce, source);
        }
      }
      s.sound.play('towerFires', { volume: sfxVol('towerFires') * 1.25 });
    }

    this.towerRecoil(tower);

    if (tower.slowPercent > 0 && !GameConfig.enemies[target.type]?.immuneToSlow) {
      target.slowPercent = tower.slowPercent;
      target.slowTimer = 2000;
    }

    if (tower.stunMs > 0 && !GameConfig.enemies[target.type]?.immuneToStun) {
      target.stunTimer = tower.stunMs;
    }

    if (tower.freezeMs > 0 && !GameConfig.enemies[target.type]?.immuneToStun) {
      target.stunTimer = Math.max(target.stunTimer || 0, tower.freezeMs);
      target.frozen = true;
      const freeze = tower.freezeMs;
      s.time.delayedCall(freeze, () => {
        if (target.alive) target.frozen = false;
      });
    }
  }

  towerRecoil(tower) {
    const s = this.scene;
    const spr = tower.sprite;
    const baseX = (TILE - 8) / spr.width;
    const baseY = (TILE - 8) / spr.height;
    s.tweens.add({
      targets: spr,
      scaleX: baseX * 0.85,
      scaleY: baseY * 0.85,
      duration: 40,
      yoyo: true,
      ease: 'Power1',
    });
  }

  updateProjectiles(delta) {
    const s = this.scene;
    for (let i = s.projectiles.length - 1; i >= 0; i--) {
      const proj = s.projectiles[i];
      if (!proj.target || !proj.target.alive) {
        let found = null;
        for (const enemy of s.enemies) {
          if (enemy.alive && !proj.hitEnemies.has(enemy) &&
              Phaser.Math.Distance.Between(proj.x, proj.y, enemy.x, enemy.y) < 150) {
            found = enemy;
            break;
          }
        }
        proj.target = found;
        if (!found) {
          proj.sprite.destroy();
          s.projectiles.splice(i, 1);
          continue;
        }
      }

      const angle = Phaser.Math.Angle.Between(proj.x, proj.y, proj.target.x, proj.target.y);
      const moveX = Math.cos(angle) * proj.speed * (delta / 1000);
      const moveY = Math.sin(angle) * proj.speed * (delta / 1000);
      proj.x += moveX;
      proj.y += moveY;
      proj.sprite.setPosition(proj.x, proj.y);
      proj.sprite.setRotation(angle);

      const dist = Phaser.Math.Distance.Between(proj.x, proj.y, proj.target.x, proj.target.y);
      if (dist < 12) {
        if (!proj.hitEnemies.has(proj.target)) {
          proj.hitEnemies.add(proj.target);
          this.damageEnemy(proj.target, proj.damage, proj.source);
        }
        if (proj.pierce > 0) {
          proj.pierce--;
          const next = s.enemies.find(
            (e) => e.alive && !proj.hitEnemies.has(e) &&
              Phaser.Math.Distance.Between(proj.x, proj.y, e.x, e.y) < 150,
          );
          proj.target = next ?? null;
          if (!next) {
            proj.sprite.destroy();
            s.projectiles.splice(i, 1);
          }
        } else {
          proj.sprite.destroy();
          s.projectiles.splice(i, 1);
        }
      }
    }
  }

  damageEnemy(enemy, damage, source = '') {
    const s = this.scene;
    if (!enemy.alive) return;
    if (source === 'CHICKEN' && GameConfig.enemies[enemy.type]?.armored) {
      s.battleVfx?.showBlockedHit(enemy);
      return;
    }
    if (damage <= 0) return;

    if (enemy.isElite && !enemy._bossHitShake) {
      enemy._bossHitShake = true;
      s.cameras.main.shake(120, 0.004);
    }

    enemy.hp -= damage;
    s.sound.play('enemyHit', { volume: sfxVol('enemyHit') });

    const hpPercent = Math.max(0, enemy.hp / enemy.maxHp);
    enemy.hpBar.setScale(hpPercent, 1);

    this.flashEnemyRed(enemy);
    s.battleVfx?.enemyHitFlash(enemy);
    s.battleVfx?.burstHit(enemy.x, enemy.y);
    s.battleVfx?.squashSprite(enemy.sprite);
    if (s.battleVfx) {
      s.battleVfx.showFloatingDamage(enemy.x, enemy.y - TILE / 2, damage);
    } else {
      this.showFloatingDamage(enemy.x, enemy.y - TILE / 2, damage);
    }

    if (enemy.type === 'MONKEY' && enemy.alive) {
      const cfg = GameConfig.enemies.MONKEY;
      if (Math.random() < (cfg.stealChance || 0.2)) {
        const stolen = Math.min(cfg.stealAmount || 5, s.sunshinePoints);
        if (stolen > 0) {
          s.sunshinePoints -= stolen;
          s.game.events.emit('points-changed', { points: s.sunshinePoints });
          s.towerPlacement.showFloatingText(enemy.x, enemy.y - 30, `-${stolen}☀`, '#FF9F1C');
        }
      }
    }

    if (enemy.hp <= 0) {
      this.enemyDeathEffect(enemy);
    }
  }

  flashEnemyRed(enemy) {
    const s = this.scene;
    if (!enemy.alive || !enemy.sprite.active) return;
    enemy.sprite.setTintFill(0xE63946);
    s.time.delayedCall(100, () => {
      if (enemy.alive && enemy.sprite.active) {
        enemy.sprite.clearTint();
      }
    });
  }

  showFloatingDamage(x, y, damage) {
    const s = this.scene;
    const txt = s.add.text(x, y, `-${damage}`, {
      fontFamily: 'Kenney Pixel',
      fontSize: '16px',
      color: '#E63946',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(60);

    s.tweens.add({
      targets: txt,
      y: y - 28,
      alpha: 0,
      duration: 600,
      ease: 'Power2',
      onComplete: () => txt.destroy(),
    });
  }

  enemyDeathEffect(enemy) {
    const s = this.scene;
    enemy.alive = false;
    const ex = enemy.x;
    const ey = enemy.y;

    s.tweens.add({
      targets: enemy.sprite,
      scaleX: 0, scaleY: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        enemy.sprite.destroy();
      },
    });

    enemy.hpBar.destroy();
    enemy.hpBarBg.destroy();
    s.battleVfx?.destroyEnemyFx(enemy);
    s.battleVfx?.burstDeath(ex, ey);
    s.sound.play('enemyDies', { volume: sfxVol('enemyDies') });

    if (!s.battleVfx) {
      const particleCount = Phaser.Math.Between(4, 6);
      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount;
        const pKey = i % 2 === 0 ? 'particle_sparkle' : 'particle_smoke';
        const p = s.add.image(ex, ey, pKey)
          .setDisplaySize(12, 12).setTint(COLORS.enemyThreat).setAlpha(0.9).setDepth(50);
        const dist = Phaser.Math.Between(20, 45);
        s.tweens.add({
          targets: p,
          x: ex + Math.cos(angle) * dist,
          y: ey + Math.sin(angle) * dist,
          alpha: 0,
          scaleX: 0.3,
          scaleY: 0.3,
          duration: 300,
          ease: 'Power2',
          onComplete: () => p.destroy(),
        });
      }
    }

    s.sunshinePoints += enemy.reward;
    s.battleSunshineEarned += enemy.reward;
    s.hannahXp += Math.ceil(enemy.reward * 0.5);
    if (enemy.type === 'ELEPHANT') {
      s.hannahXp += GameConfig.hannahXpRewards.bossKill ?? 0;
    }
    const newLevel = hannahLevelFromXp(s.battleXpStart + s.hannahXp);
    if (newLevel > s.hannahLevel) {
      s.hannahLevel = newLevel;
      s.game.events.emit('hannah-level-changed', { level: newLevel });
    }
    s.game.events.emit('points-changed', { points: s.sunshinePoints });
    s.game.events.emit('enemy-defeated');

    if (enemy.type === 'FROG') {
      const splitCount = GameConfig.enemies.FROG.splitsInto || 2;
      for (let i = 0; i < splitCount; i++) {
        this.spawnSplitEnemy('SNAKE', enemy.x, enemy.y, enemy.waypointIndex);
      }
      s.game.events.emit('wave-enemies-added', { count: splitCount });
    }
  }

  spawnEnemy(type) {
    const s = this.scene;
    const config = GameConfig.enemies[type];
    const spriteKey = ENEMY_SPRITES[type];
    const start = s.waypoints[0];

    let hp = config.hp;
    let speed = config.speed * (config.speedBonus ?? 1);
    const wm = s.waveManager;
    const isBossType = wm?.isBossBattle && type === wm?.bossType;
    let isElite = isBossType || (wm?.isBossBattle && (type === 'ELEPHANT' || type === 'BUFFALO'));
    let eliteTint = null;

    const replayElite = s.useEliteVariants && GameConfig.eliteVariants?.[type];
    if (replayElite) {
      isElite = true;
      hp = Math.round(hp * (replayElite.hpMult ?? 1));
      speed *= replayElite.speedMult ?? 1;
      eliteTint = replayElite.tint;
    }

    if (isBossType) {
      const mods = GameConfig.bossModifiers || {};
      hp = Math.round(hp * (mods.hpMult ?? 1));
      speed *= mods.speedMult ?? 1;
    }

    const zone = s.zone;
    if (zone < GameConfig.zones.length) {
      const scale = GameConfig.campaignHpScale;
      const zoneMult = scale?.perZone?.[zone] ?? 1;
      const battleMult = 1 + (s.battle ?? 0) * (scale?.perBattleInZone ?? 0);
      hp = Math.round(hp * zoneMult * battleMult);
    }

    const sprite = s.add.image(start.x, start.y, spriteKey)
      .setDisplaySize(TILE - 12, TILE - 12)
      .setDepth(20);
    if (eliteTint != null) sprite.setTint(eliteTint);

    const enemy = {
      type,
      sprite,
      hp,
      maxHp: hp,
      speed,
      reward: config.reward,
      damage: config.damage,
      x: start.x,
      y: start.y,
      waypointIndex: 1,
      slowTimer: 0,
      slowPercent: 0,
      stunTimer: 0,
      frozen: false,
      alive: true,
      attackTimer: 0,
      flies: config.flies ?? false,
      isElite,
      bobOffset: Math.random() * Math.PI * 2,
      lastFacingRight: true,
    };

    const barW = isElite ? TILE : TILE - 16;
    const barH = isElite ? 8 : 6;
    const barY = start.y - TILE / 2 + (isElite ? 2 : 4);
    const hpBarBg = s.add.rectangle(start.x, barY, barW, barH, 0x222222).setDepth(21);
    const hpBar = s.add.rectangle(start.x, barY, barW, barH, COLORS.enemyThreat).setDepth(22);
    if (isElite) {
      hpBarBg.setStrokeStyle(1, 0xffd700, 0.8);
    }
    enemy.hpBarBg = hpBarBg;
    enemy.hpBar = hpBar;
    enemy.hpBarDy = isElite ? TILE / 2 - 2 : TILE / 2 - 4;

    s.enemies.push(enemy);

    if (enemy.flies) {
      s.battleVfx?.createFlyingShadow(enemy);
    }
    s.battleVfx?.createEliteAura(enemy);

    if (!s._seenEnemyTypes.has(type)) {
      s._seenEnemyTypes.add(type);
      const intro = GameConfig.enemyIntros?.[type];
      if (intro) {
        s.towerPlacement.showFloatingText(start.x, start.y - 36, intro, '#FFD700');
      }
    }
  }

  spawnSplitEnemy(type, x, y, waypointIndex) {
    const s = this.scene;
    const config = GameConfig.enemies[type];
    const spriteKey = ENEMY_SPRITES[type];
    const sx = x + Phaser.Math.FloatBetween(-8, 8);
    const sy = y + Phaser.Math.FloatBetween(-8, 8);

    const sprite = s.add.image(sx, sy, spriteKey)
      .setDisplaySize(TILE - 12, TILE - 12)
      .setDepth(20);

    const enemy = {
      type,
      sprite,
      hp: config.hp,
      maxHp: config.hp,
      speed: config.speed,
      reward: config.reward,
      damage: config.damage,
      x: sx,
      y: sy,
      waypointIndex: Math.max(1, waypointIndex),
      slowTimer: 0,
      slowPercent: 0,
      stunTimer: 0,
      alive: true,
      attackTimer: 0,
      flies: config.flies ?? false,
    };

    const hpBarBg = s.add.rectangle(sx, sy - TILE / 2 + 4, TILE - 16, 6, 0x222222).setDepth(21);
    const hpBar = s.add.rectangle(sx, sy - TILE / 2 + 4, TILE - 16, 6, COLORS.enemyThreat).setDepth(22);
    enemy.hpBarBg = hpBarBg;
    enemy.hpBar = hpBar;

    s.enemies.push(enemy);
  }
}
