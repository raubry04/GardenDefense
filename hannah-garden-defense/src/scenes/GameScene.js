import { GameConfig } from '../config.js';
import { craftpixGroundKey } from '../utils/craftpixTiles.js';
import { WaveManager } from '../systems/WaveManager.js';
import { setupBattleCamera, refillSceneGrass } from '../utils/responsiveCamera.js';
import { applyMobileLayout } from '../utils/mobileViewport.js';
import { buildCanvasMapData } from '../utils/pathTile2D.js';
import { loadLocalProgress, hannahLevelFromXp } from '../utils/hannahProgress.js';
import { TILE, COLORS, GRASS_TILES, BUSH_KEYS, TREE_KEYS, ROCK_KEYS } from '../battle/battleConstants.js';
import { TowerCombat } from '../battle/TowerCombat.js';
import { EnemyBehavior } from '../battle/EnemyBehavior.js';
import { TowerPlacement } from '../battle/TowerPlacement.js';
import { AbilityController } from '../battle/AbilityController.js';
import { TowerInspect } from '../battle/TowerInspect.js';
import { BossBanner } from '../ui/BossBanner.js';
import { SceneMusicManager } from '../utils/SceneMusicManager.js';

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
    if (this.zone === 0 && this.battle === 0) {
      this.towerUpgrades = {};
    }
    this.abilityLastUsed = {};
    for (const key of Object.keys(GameConfig.hannahAbilities)) {
      this.abilityLastUsed[key] = -Infinity;
    }
  }

  create() {
    applyMobileLayout();
    this.cameras.main.setBackgroundColor('#5A9A38');
    this.cameras.main.fadeIn(300);
    SceneMusicManager.transition(this, 'battle');
    this.lives = GameConfig.startingLives;
    this.sunshinePoints = GameConfig.startingSunshinePoints[`zone${this.zone + 1}`] || 150;
    this.battleSunshineEarned = 0;
    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.selectedTower = null;
    this.ghostPreview = null;
    this.paused = false;
    this._battleSpeed = 1;
    this._lastCooldownSeconds = -1;
    this._lastCooldownIsPrep = false;
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

    this.towerCombat = new TowerCombat(this);
    this.enemyBehavior = new EnemyBehavior(this);
    this.towerPlacement = new TowerPlacement(this);
    this.abilityController = new AbilityController(this);
    this.towerInspect = new TowerInspect(this);
    this.bossBanner = new BossBanner(this);
    this._seenEnemyTypes = new Set();

    this.scene.launch('UIScene', {
      lives: this.lives,
      sunshinePoints: this.sunshinePoints,
      totalWaves: this.waveManager.getTotalWaves(),
      zone: this.zone,
      battle: this.battle,
      hannahLevel: this.hannahLevel,
      worldWidth: this.worldWidth,
      worldHeight: this.worldHeight,
    });

    this._setupEvents();
    this.abilityController.setupAbilities();
    this.towerPlacement.setupInput();
    this._setupPauseMenu();
    this._lastCooldownSeconds = -1;
    this._lastCooldownIsPrep = null;
    this._emitWaveCooldownIfChanged();
  }

  update(time, delta) {
    if (this.paused) return;

    this.waveManager.update(time, delta);
    this._emitWaveCooldownIfChanged();
    this.towerCombat.updateTowers(time, delta);
    this.enemyBehavior.updateEnemies(delta);
    this.towerCombat.updateProjectiles(delta);
    this._checkWaveCompletion();
    this._updateLivesWarning(delta);
    this.towerPlacement.updateHoverHighlight(time);
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
      this.towerCombat.spawnEnemy(data.type);
    });

    this.events.on('wave-start', (data) => {
      this.game.events.emit('wave-started', data);
      this._showWaveBanner(data.wave, data.total);
      const wm = this.waveManager;
      const total = data.total ?? wm.getTotalWaves();
      if (wm.isBossBattle && wm.bossType && total) {
        const bossWaveStart = Math.floor(total * 2 / 3) + 1;
        if (data.wave >= bossWaveStart) {
          this.bossBanner.show(wm.bossType);
        }
      }
    });

    this.events.on('wave-complete', (data) => {
      this.game.events.emit('wave-ended', data);
      this.sunshinePoints += GameConfig.waveCompletionBonus;
      this.battleSunshineEarned += GameConfig.waveCompletionBonus;
      this.game.events.emit('points-changed', { points: this.sunshinePoints });
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
          pointsEarned: this.battleSunshineEarned,
          playerName: this.playerName,
          towers: towerData,
          hannahXp: this.battleXpStart + (this.hannahXp || 0),
          hannahLevel: this.hannahLevel,
        });
      });
    });

    this.game.events.on('tower-selected', (towerType) => {
      this.selectedTower = towerType;
      this.towerPlacement.createGhostPreview(towerType);
    });

    this.game.events.on('tower-deselected', () => {
      this.towerPlacement.clearTowerSelection();
    });

    this.game.events.on('tower-drag-start', (towerType) => {
      this.selectedTower = towerType;
      this.towerPlacement.createGhostPreview(towerType);
    });

    this.game.events.on('tower-drag-move', (pointer) => {
      if (!this.selectedTower || !pointer) return;
      this.towerPlacement.ensureGhostPreview();
      const { col, row } = this.towerPlacement.placementTileFromPointer(pointer);
      this.towerPlacement.updateGhostAt(col, row);
    });

    this.game.events.on('tower-drag-end', (pointer) => {
      if (!this.selectedTower || !pointer) return;
      this.towerPlacement.handleTowerPlacement(pointer);
      this.towerPlacement.clearTowerSelection();
    });

    this.game.events.on('tower-drag-cancel', () => {
      this.towerPlacement.clearTowerSelection();
    });

    this.game.events.on('tower-place-request', (pointer) => {
      if (this.towerInspect?.isOpen()) return;
      if (!this.selectedTower || !pointer) return;
      const placed = this.towerPlacement.handleTowerPlacement(pointer);
      if (placed) this.towerPlacement.clearTowerSelection();
    });

    this.game.events.on('send-next-wave', () => {
      if (this.waveManager.isWaveActive()) return;
      if (this.waveManager.isBattleComplete()) return;
      this.waveManager.startNextWave();
    });

    this.game.events.on('send-wave-early', () => {
      this.waveManager.sendWaveEarly();
    });

    this.game.events.on('tutorial-state-changed', (data) => {
      this.waveManager?.setPaused(data.active);
    });

    this.game.events.on('battle-speed-changed', (data) => {
      this._battleSpeed = data.speed ?? 1;
      this.time.timeScale = this._battleSpeed;
    });
  }

  _emitWaveCooldownIfChanged() {
    const wm = this.waveManager;
    if (!wm?.isBetweenWaves()) return;

    const seconds = wm.getCooldownSecondsRemaining();
    const isPrep = wm.isPrepPhase();
    if (seconds === this._lastCooldownSeconds && isPrep === this._lastCooldownIsPrep) return;

    this._lastCooldownSeconds = seconds;
    this._lastCooldownIsPrep = isPrep;
    this.game.events.emit('wave-cooldown-changed', {
      seconds,
      isPrep,
      manualFirstWave: wm.requiresManualFirstWave(),
    });
  }

  _formatWaveBannerTotal(total) {
    return total == null ? '♾' : String(total);
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
    const totalLabel = this._formatWaveBannerTotal(total);
    const banner = this.add.text(view.x - 400, view.y + 64, `Wave ${wave} of ${totalLabel}!`, {
      fontFamily: 'Kenney Pixel',
      fontSize: '40px',
      color: '#FFFFFF',
      stroke: '#3D5A1F',
      strokeThickness: 5,
      shadow: { offsetX: 2, offsetY: 2, color: '#00000066', blur: 4, fill: true },
    }).setOrigin(0.5).setDepth(150);

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

  /* ─── Lives warning ─── */

  _createLivesWarningOverlay() {
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

    this.input.keyboard?.on('keydown-ESC', () => {
      if (this.towerInspect?.isOpen()) {
        this.towerInspect.close();
        return;
      }
      if (this.selectedTower) return;
      if (this.waveManager?.isBattleComplete()) return;
      this.game.events.emit('toggle-pause');
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
      this.time.timeScale = this._battleSpeed;
      if (this.pauseOverlay) {
        this.pauseOverlay.forEach(obj => obj.destroy());
        this.pauseOverlay = null;
      }
      return;
    }

    this.paused = true;
    this.time.timeScale = 1;
    this._battleSpeed = 1;
    this.game.events.emit('battle-speed-changed', { speed: 1 });
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
    this.towerInspect?.close();
    if (this.selectedTower) {
      this.game.events.emit('tower-deselected');
    }
    this.game.events.off('tower-selected');
    this.game.events.off('tower-deselected');
    this.game.events.off('tower-drag-start');
    this.game.events.off('tower-drag-move');
    this.game.events.off('tower-drag-end');
    this.game.events.off('tower-drag-cancel');
    this.game.events.off('tower-place-request');
    this.game.events.off('send-next-wave');
    this.game.events.off('send-wave-early');
    this.game.events.off('ability-used');
    this.game.events.off('toggle-pause');
    this.game.events.off('tutorial-state-changed');
    this.game.events.off('battle-speed-changed');
    this.time.timeScale = 1;
    this.selectedTower = null;
    this.enemies = [];
    this.towers = [];
    this.projectiles = [];
    this._warningEdges = null;
  }
}
