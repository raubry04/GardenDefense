import { GameConfig } from '../config.js';
import { TOWER_SPRITES, ENEMY_SPRITES } from '../utils/AssetRegistry.js';
import { WaveManager } from '../systems/WaveManager.js';
import { setupBattleCamera, refillSceneGrass } from '../utils/responsiveCamera.js';
import { applyMobileLayout } from '../utils/mobileViewport.js';
import { buildCanvasMapData } from '../utils/pathTile2D.js';
import { craftpixGroundKey, CRAFTPIX_GRASS_TILES } from '../utils/craftpixTiles.js';
import { loadLocalProgress, adjustedAbilityCooldown, applyTowerTierStats, hannahLevelFromXp } from '../utils/hannahProgress.js';

const COLORS = GameConfig.colors;
const TILE = GameConfig.tileSize;

const GRASS_TILES = CRAFTPIX_GRASS_TILES.map((n) => craftpixGroundKey(n));
const BUSH_KEYS = ['cp_bushSmall', 'cp_bushMedium'];
const TREE_KEYS = ['cp_treeSmall', 'cp_treeMedium'];
const ROCK_KEYS = ['cp_rock1', 'cp_rock2', 'cp_rock3'];

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data) {
    this.zone = data.zone ?? 0;
    this.battle = data.battle ?? 0;
    this.playerName = data.playerName || 'Player';

    const progress = loadLocalProgress(this.playerName);
    this.hannahLevel = progress.hannahLevel ?? hannahLevelFromXp(progress.hannahXp ?? 0);
    this.hannahXp = 0;
    this.battleXpStart = progress.hannahXp ?? 0;
    this.towerUpgrades = { ...(progress.towerUpgrades || {}) };
    this.abilityLastUsed = {};
    for (const key of Object.keys(GameConfig.hannahAbilities)) {
      this.abilityLastUsed[key] = -Infinity;
    }
  }

  create() {
    applyMobileLayout();
    this.cameras.main.setBackgroundColor('#5A9A38');
    this.cameras.main.fadeIn(300);
    this.lives = GameConfig.startingLives;
    this.sunshinePoints = GameConfig.startingSunshinePoints[`zone${this.zone + 1}`] || 150;
    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.selectedTower = null;
    this.ghostPreview = null;
    this.paused = false;
    this.hoverHighlight = null;
    this.hoverRangeCircle = null;
    this._livesWarningTimer = 0;
    this._warningEdges = null;

    const mapData = this._buildMapData();
    this.waypoints = mapData.waypoints;
    this.tileGrid = mapData.grid;
    this.pathTileMap = mapData.pathTileMap;
    this._mapCoreBounds = mapData.coreBounds;
    this.worldWidth = mapData.cols * TILE;
    this.worldHeight = mapData.rows * TILE;

    const applyCamera = setupBattleCamera(this, (view) => {
      this._fillScenery(view);
      this._layoutLivesWarningEdges();
    }, { immediate: false });

    this._drawTileMap();
    this._drawGardenGate();
    this._createLivesWarningOverlay();
    applyCamera();

    this.waveManager = new WaveManager(this);
    this.waveManager.startBattle(this.zone, this.battle);

    this.scene.launch('UIScene', {
      lives: this.lives,
      sunshinePoints: this.sunshinePoints,
      totalWaves: this.waveManager.getTotalWaves(),
      zone: this.zone,
      hannahLevel: this.hannahLevel,
      worldWidth: this.worldWidth,
      worldHeight: this.worldHeight,
    });

    this._setupEvents();
    this._setupAbilities();
    this._setupInput();
    this._setupPauseMenu();
  }

  update(time, delta) {
    if (this.paused) return;

    this.waveManager.update(time, delta);
    this._updateTowers(time, delta);
    this._updateEnemies(delta);
    this._updateProjectiles(delta);
    this._checkWaveCompletion();
    this._updateLivesWarning(delta);
    this._updateHoverHighlight(time);
  }

  /* ─── Waypoints & grid ─── */

  _buildMapData() {
    const cols = Math.ceil(GameConfig.canvas.width / TILE);
    const rows = Math.ceil(GameConfig.canvas.height / TILE);
    return buildCanvasMapData(this.zone, cols, rows, TILE, {
      centerLayout: true,
      expandPlayable: false,
    });
  }

  _view() {
    return this.cameras.main.worldView;
  }

  /* ─── Tilemap drawing ─── */

  _drawTileMap() {
    const rows = this.tileGrid.length;
    const cols = this.tileGrid[0].length;
    const rng = new Phaser.Math.RandomDataGenerator([`tilemap-${this.zone}-${this.battle}`]);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = c * TILE + TILE / 2;
        const cy = r * TILE + TILE / 2;
        const type = this.tileGrid[r][c];

        if (type === 'path') {
          const tileNum = this.pathTileMap?.[`${c},${r}`] ?? 14;
          this.add.image(cx, cy, craftpixGroundKey(tileNum))
            .setDisplaySize(TILE, TILE).setDepth(0);
          continue;
        }

        const grassKey = GRASS_TILES[((r + c) % GRASS_TILES.length + GRASS_TILES.length) % GRASS_TILES.length];
        this.add.image(cx, cy, grassKey)
          .setDisplaySize(TILE, TILE).setDepth(0);

        // Decorate buildable grass only (not 'blocked' filler around the map).
        if (type !== 'grass') continue;

        const roll = rng.frac();
        if (roll < 0.16) {
          this._drawTreeDecoration(cx, cy, rng);
        } else if (roll < 0.34) {
          this._drawBushDecoration(cx, cy, rng);
        } else if (roll < 0.46) {
          this._drawRockDecoration(cx, cy, rng);
        }
      }
    }
  }

  _fillScenery(view) {
    refillSceneGrass(this, view, -10);
  }

  _drawTreeDecoration(cx, cy, rng) {
    const key = TREE_KEYS[rng.between(0, TREE_KEYS.length - 1)];
    const size = rng.between(48, 72);
    return this.add.image(cx + rng.between(-4, 4), cy + rng.between(-8, 4), key)
      .setDisplaySize(size, size)
      .setDepth(2);
  }

  _drawBushDecoration(cx, cy, rng) {
    const key = BUSH_KEYS[rng.between(0, BUSH_KEYS.length - 1)];
    const size = rng.between(28, 44);
    return this.add.image(cx + rng.between(-6, 6), cy + rng.between(-4, 6), key)
      .setDisplaySize(size, size)
      .setDepth(2);
  }

  _drawRockDecoration(cx, cy, rng) {
    const key = ROCK_KEYS[rng.between(0, ROCK_KEYS.length - 1)];
    const size = rng.between(20, 32);
    return this.add.image(cx + rng.between(-8, 8), cy + rng.between(-4, 8), key)
      .setDisplaySize(size, size)
      .setDepth(2);
  }

  /* ─── Garden gate ─── */

  _drawGardenGate() {
    const last = this.waypoints[this.waypoints.length - 1];
    const gx = last.x;
    const gy = last.y;

    this.add.image(gx, gy - 8, 'cp_house')
      .setDisplaySize(TILE * 1.4, TILE * 1.4)
      .setDepth(5);

    this.add.image(gx, gy - TILE / 2 - 6, 'icon_door')
      .setDisplaySize(20, 20)
      .setTint(0xFFD700)
      .setDepth(7);

    const glow = this.add.circle(gx, gy, TILE * 0.6, 0xFFD700, 0.1)
      .setDepth(4);
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.1, to: 0.25 },
      scaleX: { from: 1, to: 1.15 },
      scaleY: { from: 1, to: 1.15 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /* ─── Events ─── */

  _setupEvents() {
    this.events.on('enemy-spawn', (data) => {
      this._spawnEnemy(data.type);
    });

    this.events.on('wave-start', (data) => {
      this.game.events.emit('wave-started', data);
      this._showWaveBanner(data.wave, data.total);
    });

    this.events.on('wave-complete', (data) => {
      this.game.events.emit('wave-ended', data);
      this.sunshinePoints += GameConfig.waveCompletionBonus;
      this.game.events.emit('points-changed', { points: this.sunshinePoints });
      this._showCooldownTimer();
    });

    this.events.on('battle-complete', () => {
      this.game.events.emit('battle-complete');
      this.time.delayedCall(1500, () => {
        this.scene.stop('UIScene');
        const towerData = this.towers.map(t => ({ type: t.type, tier: t.tier || 0 }));
        this.scene.start('VictoryScene', {
          livesRemaining: this.lives,
          zone: this.zone,
          battle: this.battle,
          pointsEarned: this.sunshinePoints,
          playerName: this.playerName,
          towers: towerData,
          hannahXp: this.battleXpStart + (this.hannahXp || 0),
          hannahLevel: this.hannahLevel,
        });
      });
    });

    this.game.events.on('tower-selected', (towerType) => {
      this.selectedTower = towerType;
      this._createGhostPreview(towerType);
    });

    this.game.events.on('tower-deselected', () => {
      this.selectedTower = null;
      if (this.ghostPreview) {
        this.ghostPreview.destroy();
        this.ghostPreview = null;
      }
      this._clearHoverHighlight();
    });

    this.game.events.on('send-next-wave', () => {
      if (this.waveManager.isWaveActive()) return;
      if (this.waveManager.isBattleComplete()) return;
      this.waveManager.startNextWave();
    });

    this.game.events.on('send-wave-early', () => {
      this.waveManager.sendWaveEarly();
    });
  }

  _setupAbilities() {
    this.game.events.on('ability-used', (data) => {
      const key = typeof data === 'string' ? data : data?.key;
      if (key) this._useAbility(key);
    });
  }

  _abilityCooldownMs(key) {
    const base = GameConfig.hannahAbilities[key]?.cooldown ?? 30000;
    return adjustedAbilityCooldown(base, this.hannahLevel);
  }

  _canUseAbility(key) {
    const ability = GameConfig.hannahAbilities[key];
    if (!ability) return false;
    if (ability.unlockLevel && this.hannahLevel < ability.unlockLevel) return false;
    return this.time.now - this.abilityLastUsed[key] >= this._abilityCooldownMs(key);
  }

  _useAbility(key) {
    if (!this._canUseAbility(key)) return false;

    const ability = GameConfig.hannahAbilities[key];
    this.abilityLastUsed[key] = this.time.now;

    switch (key) {
      case 'SUNSHINE_BURST': {
        for (const enemy of this.enemies) {
          if (!enemy.alive) continue;
          if (enemy.flies) continue;
          this._damageEnemy(enemy, ability.damage);
        }
        this._showAbilityPulse(this.waypoints[Math.floor(this.waypoints.length / 2)], 0xFFD700);
        break;
      }
      case 'GARDEN_RAIN': {
        for (const tower of this.towers) {
          if (tower.hp <= 0) continue;
          tower.hp = tower.maxHp;
        }
        break;
      }
      case 'RAINBOW_SHIELD': {
        for (const tower of this.towers) {
          if (tower.hp <= 0) continue;
          tower.shielded = true;
          this.time.delayedCall(ability.duration, () => {
            if (tower.hp > 0) tower.shielded = false;
          });
        }
        break;
      }
      case 'FLOWER_BOMB': {
        const center = this.waypoints[Math.floor(this.waypoints.length / 2)];
        const rangePx = ability.range * (GameConfig.tileSize / 64);
        for (const enemy of this.enemies) {
          if (!enemy.alive) continue;
          if (Phaser.Math.Distance.Between(center.x, center.y, enemy.x, enemy.y) <= rangePx) {
            this._damageEnemy(enemy, ability.damage);
          }
        }
        this._showAbilityPulse(center, 0xFF69B4, rangePx);
        break;
      }
    }

    this.sound.play('abilityUsed', { volume: GameConfig.audio.sfxVolume });
    this.game.events.emit('ability-fired', {
      key,
      cooldown: this._abilityCooldownMs(key),
    });
    return true;
  }

  _showAbilityPulse(center, color, radius = GameConfig.tileSize * 2) {
    const pulse = this.add.circle(center.x, center.y, radius, color, 0.35)
      .setStrokeStyle(2, color, 0.6).setDepth(35);
    this.tweens.add({
      targets: pulse, scaleX: 1.4, scaleY: 1.4, alpha: 0,
      duration: 450, onComplete: () => pulse.destroy(),
    });
  }

  /* ─── Input ─── */

  _updateGhostAt(col, row) {
    if (!this.ghostPreview || !this.selectedTower) return;
    this.ghostPreview.setPosition(col * TILE + TILE / 2, row * TILE + TILE / 2);
    const valid = this._isValidPlacement(row, col);
    this.ghostPreview.setAlpha(valid ? 0.7 : 0.3);
    this.ghostPreview.setTint(valid ? 0xFFD700 : 0xE63946);
    this._updateHoverTile(col, row, valid);
  }

  _setupInput() {
    this.input.on('pointermove', (pointer) => {
      if (!this.ghostPreview || !this.selectedTower) return;
      const col = Math.floor(pointer.worldX / TILE);
      const row = Math.floor(pointer.worldY / TILE);
      this._updateGhostAt(col, row);
    });

    this.input.on('pointerdown', (pointer) => {
      const col = Math.floor(pointer.worldX / TILE);
      const row = Math.floor(pointer.worldY / TILE);

      if (pointer.rightButtonDown()) {
        const tower = this.towers.find(t => t.gridRow === row && t.gridCol === col);
        if (tower && tower.hp > 0) this._showSellUI(tower);
        return;
      }
      if (!this.selectedTower) return;

      this._updateGhostAt(col, row);

      if (!this._isValidPlacement(row, col)) {
        this.sound.play('invalidAction', { volume: GameConfig.audio.sfxVolume });
        this._flashInvalidTile(col, row);
        return;
      }

      const towerConfig = GameConfig.towers[this.selectedTower];
      if (this.sunshinePoints < towerConfig.cost) {
        this.sound.play('invalidAction', { volume: GameConfig.audio.sfxVolume });
        return;
      }

      this.sunshinePoints -= towerConfig.cost;
      this.game.events.emit('points-changed', { points: this.sunshinePoints });

      this._placeTower(this.selectedTower, row, col);
      this.sound.play('towerPlaced', { volume: GameConfig.audio.sfxVolume });
    });

    this.input.mouse.disableContextMenu();
  }

  _isValidPlacement(row, col) {
    if (row < 0 || row >= this.tileGrid.length) return false;
    if (col < 0 || col >= this.tileGrid[0].length) return false;
    const tile = this.tileGrid[row][col];
    if (tile === 'blocked') return false;
    if (tile === 'tower' || tile === 'pigwall') return false;
    if (tile === 'path' && this.selectedTower !== 'PIG_WALL') return false;
    if (tile !== 'grass' && tile !== 'path') return false;
    const occupied = this.towers.some(t => t.gridRow === row && t.gridCol === col);
    return !occupied;
  }

  /* ─── Hover highlight ─── */

  _updateHoverTile(col, row, valid) {
    const cx = col * TILE + TILE / 2;
    const cy = row * TILE + TILE / 2;

    if (!this.hoverHighlight) {
      this.hoverHighlight = this.add.rectangle(cx, cy, TILE - 2, TILE - 2)
        .setStrokeStyle(2, 0x00FF00).setFillStyle(0x00FF00, 0.15).setDepth(99);
      this._hoverPulseAlpha = 0;
    }

    this.hoverHighlight.setPosition(cx, cy);
    this.hoverHighlight.setVisible(true);

    if (valid) {
      this.hoverHighlight.setStrokeStyle(2, 0x88FF44);
      this.hoverHighlight.setFillStyle(0x88FF44, 0.15);
    } else {
      this.hoverHighlight.setStrokeStyle(2, 0xE63946);
      this.hoverHighlight.setFillStyle(0xE63946, 0.15);
    }

    if (valid && this.selectedTower) {
      const range = GameConfig.towers[this.selectedTower].range;
      if (!this.hoverRangeCircle) {
        this.hoverRangeCircle = this.add.circle(cx, cy, range, COLORS.primary, 0.08)
          .setStrokeStyle(1, COLORS.primary, 0.25).setDepth(98);
      }
      this.hoverRangeCircle.setPosition(cx, cy);
      this.hoverRangeCircle.setRadius(range);
      this.hoverRangeCircle.setVisible(true);
    } else if (this.hoverRangeCircle) {
      this.hoverRangeCircle.setVisible(false);
    }
  }

  _updateHoverHighlight(time) {
    if (!this.hoverHighlight || !this.hoverHighlight.visible) return;
    const pulse = 0.1 + Math.abs(Math.sin(time * 0.004)) * 0.2;
    this.hoverHighlight.setAlpha(pulse + 0.4);
  }

  _clearHoverHighlight() {
    if (this.hoverHighlight) { this.hoverHighlight.setVisible(false); }
    if (this.hoverRangeCircle) { this.hoverRangeCircle.setVisible(false); }
  }

  _flashInvalidTile(col, row) {
    const cx = col * TILE + TILE / 2;
    const cy = row * TILE + TILE / 2;
    const flash = this.add.rectangle(cx, cy, TILE, TILE, 0xE63946, 0.45).setDepth(99);
    this.tweens.add({
      targets: flash, alpha: 0, duration: 250, ease: 'Power2',
      onComplete: () => flash.destroy(),
    });
  }

  /* ─── Tower placement ─── */

  _createGhostPreview(towerType) {
    if (this.ghostPreview) this.ghostPreview.destroy();
    const spriteKey = TOWER_SPRITES[towerType];
    this.ghostPreview = this.add.image(0, 0, spriteKey)
      .setDisplaySize(TILE - 8, TILE - 8)
      .setAlpha(0.6)
      .setDepth(100);
  }

  _placeTower(type, row, col) {
    const spriteKey = TOWER_SPRITES[type];
    const x = col * TILE + TILE / 2;
    const y = row * TILE + TILE / 2;
    const baseConfig = GameConfig.towers[type];
    const tier = this.towerUpgrades[type] ?? 0;
    const config = applyTowerTierStats(type, tier);
    const isPigWall = type === 'PIG_WALL';
    const towerHp = config.hp || baseConfig.hp || GameConfig.towerDefaultHp || 200;

    const sprite = this.add.image(x, y, spriteKey)
      .setDisplaySize(TILE - 8, TILE - 8)
      .setDepth(10);

    if (tier > 0) {
      const tierTints = [0xFFFFFF, 0xC0E0FF, 0xFFD700];
      sprite.setTint(tierTints[Math.min(tier, tierTints.length - 1)]);
    }

    const tower = {
      type,
      sprite,
      gridRow: row,
      gridCol: col,
      x, y,
      range: config.range ?? baseConfig.range,
      damage: config.damage || 0,
      fireRate: config.fireRate || (config.cooldown || baseConfig.fireRate || baseConfig.cooldown || 1000),
      slowPercent: config.slowPercent || 0,
      stunMs: config.stunMs || 0,
      freezeMs: config.freezeMs || 0,
      lastFired: 0,
      tier,
      hp: towerHp,
      maxHp: towerHp,
      shielded: false,
      cost: baseConfig.cost,
      onPath: this.tileGrid[row][col] === 'path',
    };

    this.towers.push(tower);
    this.tileGrid[row][col] = isPigWall && tower.onPath ? 'pigwall' : 'tower';

    sprite.setScale(0);
    this.tweens.add({
      targets: sprite,
      scaleX: (TILE - 8) / sprite.width,
      scaleY: (TILE - 8) / sprite.height,
      duration: 200,
      ease: 'Back.easeOut',
    });

    this._spawnPlacementParticles(x, y);
    this._showRangeCircle(x, y, tower.range);
  }

  _spawnPlacementParticles(x, y) {
    const count = Phaser.Math.Between(4, 6);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const p = this.add.image(x, y, 'particle_sparkle')
        .setDisplaySize(10, 10).setTint(COLORS.primary).setDepth(50);
      const dist = Phaser.Math.Between(30, 55);
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scaleX: 2.5,
        scaleY: 2.5,
        duration: 350,
        ease: 'Power2',
        onComplete: () => p.destroy(),
      });
    }
  }

  _showRangeCircle(x, y, range) {
    const circle = this.add.circle(x, y, range, COLORS.primary, 0.12)
      .setStrokeStyle(1, COLORS.primary, 0.3).setDepth(9);
    this.tweens.add({
      targets: circle, alpha: 0, duration: 1200, delay: 600, ease: 'Power2',
      onComplete: () => circle.destroy(),
    });
  }

  /* ─── Enemy spawning ─── */

  _spawnEnemy(type) {
    const config = GameConfig.enemies[type];
    const spriteKey = ENEMY_SPRITES[type];
    const start = this.waypoints[0];

    const sprite = this.add.image(start.x, start.y, spriteKey)
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
      x: start.x,
      y: start.y,
      waypointIndex: 1,
      slowTimer: 0,
      slowPercent: 0,
      stunTimer: 0,
      alive: true,
      attackTimer: 0,
      flies: config.flies ?? false,
    };

    const hpBarBg = this.add.rectangle(start.x, start.y - TILE / 2 + 4, TILE - 16, 6, 0x222222).setDepth(21);
    const hpBar = this.add.rectangle(start.x, start.y - TILE / 2 + 4, TILE - 16, 6, COLORS.enemyThreat).setDepth(22);
    enemy.hpBarBg = hpBarBg;
    enemy.hpBar = hpBar;

    this.enemies.push(enemy);
  }

  /* ─── Tower update & firing ─── */

  _updateTowers(time, delta) {
    for (const tower of this.towers) {
      if (tower.hp <= 0) continue;
      if (tower.damage <= 0 && !tower.slowPercent && !tower.stunMs && !tower.freezeMs) continue;
      if (time - tower.lastFired < tower.fireRate) continue;

      const isAoE = GameConfig.towers[tower.type]?.aoe;

      if (isAoE) {
        const targets = [];
        for (const enemy of this.enemies) {
          if (!enemy.alive) continue;
          const dist = Phaser.Math.Distance.Between(tower.x, tower.y, enemy.x, enemy.y);
          if (dist <= tower.range) targets.push(enemy);
        }
        if (targets.length > 0) {
          tower.lastFired = time;
          this._fireAoETower(tower, targets);
        }
      } else {
        let target = null;
        let closestDist = tower.range;
        for (const enemy of this.enemies) {
          if (!enemy.alive) continue;
          if (tower.type === 'CHICKEN' && enemy.type === 'ELEPHANT') continue;
          const dist = Phaser.Math.Distance.Between(tower.x, tower.y, enemy.x, enemy.y);
          if (dist <= closestDist) {
            closestDist = dist;
            target = enemy;
          }
        }
        if (target) {
          tower.lastFired = time;
          this._fireTower(tower, target);
        }
      }
    }
  }

  _fireAoETower(tower, targets) {
    this._towerRecoil(tower);
    this._showAoEPulse(tower);

    for (const target of targets) {
      if (tower.slowPercent > 0 && !GameConfig.enemies[target.type]?.immuneToSlow) {
        target.slowPercent = tower.slowPercent;
        target.slowTimer = 2000;
      }
      if (tower.stunMs > 0) {
        target.stunTimer = tower.stunMs;
      }
      if (tower.freezeMs > 0) {
        target.stunTimer = Math.max(target.stunTimer || 0, tower.freezeMs);
        if (target.sprite?.active) target.sprite.setTint(0x88CCFF);
        const freeze = tower.freezeMs;
        this.time.delayedCall(freeze, () => {
          if (target.alive && target.sprite?.active) target.sprite.clearTint();
        });
      }
    }

    this.sound.play('towerFires', { volume: GameConfig.audio.sfxVolume * 0.4 });
  }

  _showAoEPulse(tower) {
    const circle = this.add.circle(tower.x, tower.y, tower.range, COLORS.primary, 0.25)
      .setStrokeStyle(2, COLORS.primary, 0.5).setDepth(30);
    this.tweens.add({
      targets: circle, scaleX: 1.3, scaleY: 1.3, alpha: 0, duration: 300,
      onComplete: () => circle.destroy(),
    });
  }

  _fireTower(tower, target) {
    if (tower.damage > 0) {
      const proj = this.add.ellipse(tower.x, tower.y, 10, 7, COLORS.primary).setDepth(30);
      const angle = Phaser.Math.Angle.Between(tower.x, tower.y, target.x, target.y);
      proj.setRotation(angle);

      this.projectiles.push({
        sprite: proj,
        x: tower.x,
        y: tower.y,
        target,
        speed: 400,
        damage: tower.damage,
      });
      this.sound.play('towerFires', { volume: GameConfig.audio.sfxVolume * 0.5 });
    }

    this._towerRecoil(tower);

    if (tower.slowPercent > 0) {
      target.slowPercent = tower.slowPercent;
      target.slowTimer = 2000;
    }

    if (tower.stunMs > 0) {
      target.stunTimer = tower.stunMs;
    }

    if (tower.freezeMs > 0) {
      target.stunTimer = Math.max(target.stunTimer || 0, tower.freezeMs);
      if (target.sprite?.active) target.sprite.setTint(0x88CCFF);
      const freeze = tower.freezeMs;
      this.time.delayedCall(freeze, () => {
        if (target.alive && target.sprite?.active) target.sprite.clearTint();
      });
    }
  }

  _towerRecoil(tower) {
    const s = tower.sprite;
    const baseX = (TILE - 8) / s.width;
    const baseY = (TILE - 8) / s.height;
    this.tweens.add({
      targets: s,
      scaleX: baseX * 0.85,
      scaleY: baseY * 0.85,
      duration: 40,
      yoyo: true,
      ease: 'Power1',
    });
  }

  /* ─── Projectile update ─── */

  _updateProjectiles(delta) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      if (!proj.target.alive) {
        proj.sprite.destroy();
        this.projectiles.splice(i, 1);
        continue;
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
        this._damageEnemy(proj.target, proj.damage);
        proj.sprite.destroy();
        this.projectiles.splice(i, 1);
      }
    }
  }

  /* ─── Damage & enemy hit effects ─── */

  _damageEnemy(enemy, damage) {
    enemy.hp -= damage;
    this.sound.play('enemyHit', { volume: GameConfig.audio.sfxVolume * 0.3 });

    const hpPercent = Math.max(0, enemy.hp / enemy.maxHp);
    enemy.hpBar.setScale(hpPercent, 1);

    this._flashEnemyRed(enemy);
    this._showFloatingDamage(enemy.x, enemy.y - TILE / 2, damage);

    if (enemy.type === 'MONKEY' && enemy.alive) {
      const cfg = GameConfig.enemies.MONKEY;
      if (Math.random() < (cfg.stealChance || 0.2)) {
        const stolen = Math.min(cfg.stealAmount || 5, this.sunshinePoints);
        if (stolen > 0) {
          this.sunshinePoints -= stolen;
          this.game.events.emit('points-changed', { points: this.sunshinePoints });
          this._showFloatingText(enemy.x, enemy.y - 30, `-${stolen}☀`, '#FF9F1C');
        }
      }
    }

    if (enemy.hp <= 0) {
      this._enemyDeathEffect(enemy);
    }
  }

  _flashEnemyRed(enemy) {
    if (!enemy.alive || !enemy.sprite.active) return;
    enemy.sprite.setTintFill(0xE63946);
    this.time.delayedCall(100, () => {
      if (enemy.alive && enemy.sprite.active) {
        enemy.sprite.clearTint();
      }
    });
  }

  _showFloatingDamage(x, y, damage) {
    const txt = this.add.text(x, y, `-${damage}`, {
      fontFamily: 'Kenney Pixel',
      fontSize: '16px',
      color: '#E63946',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(60);

    this.tweens.add({
      targets: txt,
      y: y - 28,
      alpha: 0,
      duration: 600,
      ease: 'Power2',
      onComplete: () => txt.destroy(),
    });
  }

  _enemyDeathEffect(enemy) {
    enemy.alive = false;
    const ex = enemy.x;
    const ey = enemy.y;

    this.tweens.add({
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
    this.sound.play('enemyDies', { volume: GameConfig.audio.sfxVolume });

    const particleCount = Phaser.Math.Between(4, 6);
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const pKey = i % 2 === 0 ? 'particle_sparkle' : 'particle_smoke';
      const p = this.add.image(ex, ey, pKey)
        .setDisplaySize(12, 12).setTint(COLORS.enemyThreat).setAlpha(0.9).setDepth(50);
      const dist = Phaser.Math.Between(20, 45);
      this.tweens.add({
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

    this.sunshinePoints += enemy.reward;
    this.hannahXp += Math.ceil(enemy.reward * 0.5);
    if (enemy.type === 'ELEPHANT') {
      this.hannahXp += GameConfig.hannahXpRewards.bossKill ?? 0;
    }
    this.game.events.emit('points-changed', { points: this.sunshinePoints });
    this.game.events.emit('enemy-defeated');

    if (enemy.type === 'FROG') {
      const splitCount = GameConfig.enemies.FROG.splitsInto || 2;
      for (let s = 0; s < splitCount; s++) {
        this._spawnSplitEnemy('SNAKE', enemy.x, enemy.y, enemy.waypointIndex);
      }
    }
  }

  /* ─── Enemy movement ─── */

  _updateEnemies(delta) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (!enemy.alive) {
        this.enemies.splice(i, 1);
        continue;
      }

      if (enemy.stunTimer > 0) {
        enemy.stunTimer -= delta;
        continue;
      }

      let speed = enemy.speed;
      if (enemy.slowTimer > 0) {
        speed *= (1 - enemy.slowPercent);
        enemy.slowTimer -= delta;
      }

      if (enemy.type === 'BEAR') {
        let nearestTower = null;
        let nearestDist = TILE * 2.5;
        for (const tower of this.towers) {
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
              this._damageTower(nearestTower, GameConfig.enemies.BEAR.towerDmg || 15);
            }
          } else {
            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, nearestTower.x, nearestTower.y);
            const mv = speed * (delta / 1000);
            enemy.x += Math.cos(angle) * mv;
            enemy.y += Math.sin(angle) * mv;
            enemy.sprite.setPosition(enemy.x, enemy.y);
            enemy.hpBarBg.setPosition(enemy.x, enemy.y - TILE / 2 + 4);
            enemy.hpBar.setPosition(enemy.x, enemy.y - TILE / 2 + 4);
          }
          continue;
        }
      }

      const pigWall = this.towers.find(t =>
        t.type === 'PIG_WALL' && t.onPath && t.hp > 0 &&
        Phaser.Math.Distance.Between(enemy.x, enemy.y, t.x, t.y) < TILE
      );
      if (pigWall) {
        enemy.attackTimer = (enemy.attackTimer || 0) + delta;
        if (enemy.attackTimer >= 800) {
          enemy.attackTimer = 0;
          this._damageTower(pigWall, enemy.damage * 2);
        }
        continue;
      }

      const target = this.waypoints[enemy.waypointIndex];
      if (!target) {
        this._enemyReachedGate(enemy);
        this.enemies.splice(i, 1);
        continue;
      }

      const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, target.x, target.y);
      const move = speed * (delta / 1000);
      enemy.x += Math.cos(angle) * move;
      enemy.y += Math.sin(angle) * move;
      enemy.sprite.setPosition(enemy.x, enemy.y);
      enemy.hpBarBg.setPosition(enemy.x, enemy.y - TILE / 2 + 4);
      enemy.hpBar.setPosition(enemy.x, enemy.y - TILE / 2 + 4);

      const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, target.x, target.y);
      if (dist < 8) {
        enemy.waypointIndex++;
      }
    }
  }

  /* ─── Split enemy spawning ─── */

  _spawnSplitEnemy(type, x, y, waypointIndex) {
    const config = GameConfig.enemies[type];
    const spriteKey = ENEMY_SPRITES[type];
    const sx = x + Phaser.Math.FloatBetween(-8, 8);
    const sy = y + Phaser.Math.FloatBetween(-8, 8);

    const sprite = this.add.image(sx, sy, spriteKey)
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

    const hpBarBg = this.add.rectangle(sx, sy - TILE / 2 + 4, TILE - 16, 6, 0x222222).setDepth(21);
    const hpBar = this.add.rectangle(sx, sy - TILE / 2 + 4, TILE - 16, 6, COLORS.enemyThreat).setDepth(22);
    enemy.hpBarBg = hpBarBg;
    enemy.hpBar = hpBar;

    this.enemies.push(enemy);
  }

  /* ─── Tower damage & destruction ─── */

  _damageTower(tower, damage) {
    if (tower.shielded) return;
    tower.hp -= damage;
    this._showFloatingDamage(tower.x, tower.y - 20, damage);

    if (tower.hp <= 0) this._destroyTower(tower);
  }

  _destroyTower(tower) {
    const idx = this.towers.indexOf(tower);
    if (idx !== -1) this.towers.splice(idx, 1);

    this.tileGrid[tower.gridRow][tower.gridCol] = tower.onPath ? 'path' : 'grass';
    if (tower.sprite?.active) tower.sprite.destroy();
    this._spawnPlacementParticles(tower.x, tower.y);
  }

  /* ─── Tower selling ─── */

  _showSellUI(tower) {
    if (this._sellUI) {
      this._sellUI.forEach(o => o.destroy());
      this._sellUI = null;
    }

    const refund = Math.floor(tower.cost * GameConfig.sellRefundPercent);
    const objects = [];

    const bg = this.add.rectangle(tower.x, tower.y - 30, 100, 36, 0x000000, 0.85)
      .setStrokeStyle(2, COLORS.stars).setDepth(200).setInteractive({ useHandCursor: true });
    objects.push(bg);

    const text = this.add.text(tower.x, tower.y - 30, `SELL +${refund}☀`, {
      fontFamily: 'Kenney Future', fontSize: '14px', color: '#FFD700',
    }).setOrigin(0.5).setDepth(201);
    objects.push(text);

    bg.on('pointerdown', () => {
      this._sellTower(tower, refund);
      if (this._sellUI) {
        this._sellUI.forEach(o => { if (o.active) o.destroy(); });
        this._sellUI = null;
      }
    });

    this.time.delayedCall(3000, () => {
      if (this._sellUI) {
        this._sellUI.forEach(o => { if (o.active) o.destroy(); });
        this._sellUI = null;
      }
    });

    this._sellUI = objects;
  }

  _sellTower(tower, refund) {
    this.sunshinePoints += refund;
    this.game.events.emit('points-changed', { points: this.sunshinePoints });
    this._showFloatingText(tower.x, tower.y - 20, `+${refund}☀`, '#4CAF50');
    this._destroyTower(tower);
    this.sound.play('pointsEarned', { volume: GameConfig.audio.sfxVolume });
  }

  _showFloatingText(x, y, message, color) {
    const txt = this.add.text(x, y, message, {
      fontFamily: 'Kenney Pixel', fontSize: '16px', color,
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(60);

    this.tweens.add({
      targets: txt, y: y - 28, alpha: 0, duration: 600, ease: 'Power2',
      onComplete: () => txt.destroy(),
    });
  }

  _enemyReachedGate(enemy) {
    enemy.alive = false;
    enemy.sprite.destroy();
    enemy.hpBar.destroy();
    enemy.hpBarBg.destroy();

    const last = this.waypoints[this.waypoints.length - 1];
    const gateFlash = this.add.rectangle(last.x, last.y, TILE, TILE, 0xE63946, 0.5).setDepth(8);
    this.tweens.add({
      targets: gateFlash, alpha: 0, duration: 400,
      onComplete: () => gateFlash.destroy(),
    });

    this.lives -= enemy.damage;
    this.game.events.emit('lives-changed', { lives: this.lives });

    if (this.lives <= 0) {
      this.lives = 0;
      this.scene.stop('UIScene');
      this.scene.start('GameOverScene', {
        waveReached: this.waveManager.getCurrentWave(),
        zone: this.zone,
        battle: this.battle,
        playerName: this.playerName,
      });
    }
  }

  /* ─── Wave completion ─── */

  _checkWaveCompletion() {
    if (!this.waveManager.isWaveActive()) return;
    if (this.waveManager.spawnQueue.length > 0) return;

    const aliveEnemies = this.enemies.filter(e => e.alive);
    if (aliveEnemies.length === 0) {
      this.waveManager.onAllEnemiesDefeated();
    }
  }

  /* ─── Wave banner & countdown ─── */

  _showWaveBanner(wave, total) {
    const view = this._view();
    const banner = this.add.text(view.x - 400, view.y + 64, `Wave ${wave} of ${total}!`, {
      fontFamily: 'Kenney Pixel',
      fontSize: '40px',
      color: '#FFFFFF',
      stroke: '#3D5A1F',
      strokeThickness: 5,
      shadow: { offsetX: 2, offsetY: 2, color: '#00000066', blur: 4, fill: true },
    }).setOrigin(0.5).setDepth(150);

    if (this._cooldownText) {
      this._cooldownText.destroy();
      this._cooldownText = null;
    }
    if (this._cooldownEvent) {
      this._cooldownEvent.remove(false);
      this._cooldownEvent = null;
    }

    this.tweens.add({
      targets: banner,
      x: view.centerX,
      duration: 400,
      ease: 'Back.easeOut',
      hold: 1200,
      yoyo: true,
      onYoyo: () => {
        this.tweens.add({
          targets: banner, x: view.right + 400, duration: 350, ease: 'Power2',
          onComplete: () => banner.destroy(),
        });
      },
    });
  }

  _showCooldownTimer() {
    const view = this._view();
    let seconds = GameConfig.waveCooldownSeconds;

    if (this._cooldownText) this._cooldownText.destroy();

    this._cooldownText = this.add.text(view.centerX, view.centerY, `Next wave in ${seconds}s`, {
      fontFamily: 'Kenney Pixel',
      fontSize: '28px',
      color: '#FFFFFF',
      stroke: '#3D5A1F',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(150).setAlpha(0.85);

    this._cooldownEvent = this.time.addEvent({
      delay: 1000,
      repeat: seconds - 1,
      callback: () => {
        seconds--;
        if (this._cooldownText && this._cooldownText.active) {
          if (seconds > 0) {
            this._cooldownText.setText(`Next wave in ${seconds}s`);
          } else {
            this._cooldownText.destroy();
            this._cooldownText = null;
          }
        }
      },
    });
  }

  /* ─── Lives warning ─── */

  _createLivesWarningOverlay() {
    const thickness = 12;

    this._warningEdges = [
      this.add.rectangle(0, 0, 1, 1, 0xE63946).setDepth(180),
      this.add.rectangle(0, 0, 1, 1, 0xE63946).setDepth(180),
      this.add.rectangle(0, 0, 1, 1, 0xE63946).setDepth(180),
      this.add.rectangle(0, 0, 1, 1, 0xE63946).setDepth(180),
    ];
    this._warningEdges.forEach(e => e.setAlpha(0));
    this._layoutLivesWarningEdges();
    this._livesWarningTimer = 0;
  }

  _layoutLivesWarningEdges() {
    const edges = this._warningEdges;
    if (!edges?.length || !edges[0]?.active) return;
    const view = this._view();
    const thickness = 12;

    edges[0]
      .setPosition(view.centerX, view.y + thickness / 2)
      .setSize(view.width, thickness);
    edges[1]
      .setPosition(view.centerX, view.bottom - thickness / 2)
      .setSize(view.width, thickness);
    edges[2]
      .setPosition(view.x + thickness / 2, view.centerY)
      .setSize(thickness, view.height);
    edges[3]
      .setPosition(view.right - thickness / 2, view.centerY)
      .setSize(thickness, view.height);
  }

  _updateLivesWarning(delta) {
    if (this.lives > 5 || !this._warningEdges?.[0]?.active) return;

    this._livesWarningTimer += delta;
    if (this._livesWarningTimer >= 3000) {
      this._livesWarningTimer = 0;
      this._warningEdges.forEach(e => {
        this.tweens.add({
          targets: e,
          alpha: 0.6,
          duration: 200,
          yoyo: true,
          repeat: 1,
          ease: 'Power2',
        });
      });
    }
  }

  /* ─── Pause ─── */

  _setupPauseMenu() {
    this.game.events.on('toggle-pause', () => {
      this._togglePause();
    });
  }

  _togglePause() {
    const view = this._view();
    const width = view.width;
    const height = view.height;
    const centerX = view.centerX;
    const centerY = view.centerY;

    if (this.paused) {
      this.paused = false;
      if (this.pauseOverlay) {
        this.pauseOverlay.forEach(obj => obj.destroy());
        this.pauseOverlay = null;
      }
      return;
    }

    this.paused = true;
    const objects = [];

    const overlay = this.add.rectangle(centerX, centerY, width * 2, height * 2, 0x000000, 0.7)
      .setDepth(200).setInteractive();
    objects.push(overlay);

    const panel = this.add.rectangle(centerX, centerY, 320, 340, COLORS.uiPanel)
      .setStrokeStyle(3, COLORS.outline).setDepth(201);
    objects.push(panel);

    const title = this.add.text(centerX, centerY - 130, 'PAUSED', {
      fontFamily: 'Kenney Pixel',
      fontSize: '36px',
      color: '#3D5A1F',
    }).setOrigin(0.5).setDepth(202);
    objects.push(title);

    const buttons = [
      { label: 'RESUME', action: () => this._togglePause() },
      { label: 'RESTART', action: () => { this.scene.stop('UIScene'); this.scene.restart(); } },
      { label: 'BACK TO MAP', action: () => { this.scene.stop('UIScene'); this.scene.start('WorldMapScene', { playerName: this.playerName }); } },
    ];

    buttons.forEach((btn, idx) => {
      const by = centerY - 50 + idx * 70;
      const bg = this.add.rectangle(centerX, by, 220, 50, COLORS.button)
        .setInteractive({ useHandCursor: true }).setStrokeStyle(2, COLORS.outline).setDepth(202);
      const text = this.add.text(centerX, by, btn.label, {
        fontFamily: 'Kenney Future', fontSize: '22px', color: '#4A2C0A',
      }).setOrigin(0.5).setDepth(203);

      bg.on('pointerover', () => this.tweens.add({ targets: [bg, text], scaleX: 1.08, scaleY: 1.08, duration: 60 }));
      bg.on('pointerout', () => this.tweens.add({ targets: [bg, text], scaleX: 1, scaleY: 1, duration: 60 }));
      bg.on('pointerdown', () => {
        this.sound.play('buttonClick', { volume: GameConfig.audio.sfxVolume });
        btn.action();
      });
      objects.push(bg, text);
    });

    this.pauseOverlay = objects;
  }

  /* ─── Cleanup ─── */

  shutdown() {
    this.game.events.off('tower-selected');
    this.game.events.off('tower-deselected');
    this.game.events.off('send-next-wave');
    this.game.events.off('send-wave-early');
    this.game.events.off('ability-used');
    this.game.events.off('toggle-pause');
    this.selectedTower = null;
    this.enemies = [];
    this.towers = [];
    this.projectiles = [];
    this._warningEdges = null;
  }
}
