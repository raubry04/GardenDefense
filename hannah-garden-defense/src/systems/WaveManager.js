import { GameConfig } from '../config.js';

export class WaveManager {
  constructor(scene) {
    this.scene = scene;
    this.waves = [];
    this.currentWaveIndex = -1;
    this.waveActive = false;
    this.battleComplete = false;
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.cooldownTimer = 0;
    this.inCooldown = false;
    this.zone = null;
    this.battle = null;
    this.isBossBattle = false;
    this.bossType = null;
    this.paused = false;
    this._prepPhaseActive = false;
    this.isEndless = false;
    this._manualFirstWave = false;
  }

  initBattle(zone, battle) {
    this.zone = zone;
    this.battle = battle;
    this.currentWaveIndex = -1;
    this.waveActive = false;
    this.battleComplete = false;
    this.inCooldown = false;
    this.cooldownTimer = 0;
    this.spawnQueue = [];
    this.paused = false;
    this._prepPhaseActive = false;
    this.isEndless = zone >= GameConfig.zones.length;
    this._manualFirstWave = this._computeManualFirstWave(zone, battle);
    this.waves = this._generateWaves(zone, battle);
    this.isBossBattle = this._computeIsBoss(zone, battle);
    this.bossType = this._computeBossType(zone);
    this._emitPreview();
  }

  beginPrepPhase() {
    if (this.battleComplete) return;
    this.inCooldown = true;
    this._prepPhaseActive = true;
    this.cooldownTimer = GameConfig.prepPhaseSeconds * 1000;
    this._emitPreview();
  }

  startBattle(zone, battle) {
    this.initBattle(zone, battle);
    this.beginPrepPhase();
  }

  setPaused(paused) {
    this.paused = !!paused;
  }

  requiresManualFirstWave() {
    return this._manualFirstWave && this.currentWaveIndex < 0;
  }

  isPrepPhase() {
    return this._prepPhaseActive && this.inCooldown;
  }

  getCooldownSecondsRemaining() {
    if (!this.inCooldown) return 0;
    return Math.ceil(this.cooldownTimer / 1000);
  }

  startNextWave() {
    if (this.battleComplete || this.waveActive) return;

    this.currentWaveIndex++;

    if (this.isEndless && this.currentWaveIndex >= this.waves.length) {
      this._ensureEndlessBuffer();
    }

    if (this.currentWaveIndex >= this.waves.length) {
      if (this.isEndless) {
        this._ensureEndlessBuffer();
      }
      if (this.currentWaveIndex >= this.waves.length) {
        this.battleComplete = true;
        this.scene.events.emit('battle-complete');
        this._emitPreview();
        return;
      }
    }

    this.waveActive = true;
    this.inCooldown = false;
    this._prepPhaseActive = false;
    const waveEnemies = this.waves[this.currentWaveIndex];
    this.spawnQueue = [...waveEnemies];
    this.spawnTimer = 0;

    this.scene.events.emit('wave-start', {
      wave: this.currentWaveIndex + 1,
      total: this.getTotalWaves(),
      enemyCount: waveEnemies.length,
    });
    this._emitPreview();
  }

  sendWaveEarly() {
    if (!this.inCooldown) return;

    this.inCooldown = false;
    this.cooldownTimer = 0;
    this._prepPhaseActive = false;

    if (this.currentWaveIndex >= 0) {
      this.scene.sunshinePoints += GameConfig.earlyWaveBonusPoints;
      this.scene.battleSunshineEarned = (this.scene.battleSunshineEarned || 0) + GameConfig.earlyWaveBonusPoints;
      this.scene.game.events.emit('points-changed', {
        points: this.scene.sunshinePoints,
      });
    }

    this.startNextWave();
  }

  update(time, delta) {
    if (this.battleComplete) return;

    if (this.inCooldown) {
      if (!this.paused) {
        this.cooldownTimer -= delta;
        if (this.cooldownTimer <= 0) {
          if (this.requiresManualFirstWave()) {
            this.cooldownTimer = 0;
            return;
          }
          this.inCooldown = false;
          this.startNextWave();
        }
      }
      return;
    }

    if (!this.waveActive) return;

    const spawnDelay = GameConfig.waves?.spawnDelayMs ?? 800;
    if (this.spawnQueue.length > 0) {
      this.spawnTimer -= delta;
      if (this.spawnTimer <= 0) {
        const enemyType = this.spawnQueue.shift();
        this.scene.events.emit('enemy-spawn', { type: enemyType });
        this.spawnTimer = spawnDelay;
      }
    }
  }

  onAllEnemiesDefeated() {
    if (!this.waveActive) return;

    this.waveActive = false;
    this.scene.events.emit('wave-complete', {
      wave: this.currentWaveIndex + 1,
      total: this.getTotalWaves(),
    });

    if (!this.isEndless && this.currentWaveIndex >= this.waves.length - 1) {
      this.battleComplete = true;
      this.scene.events.emit('battle-complete');
    } else {
      this.inCooldown = true;
      this.cooldownTimer = GameConfig.waveCooldownSeconds * 1000;
      if (this.isEndless) {
        this._ensureEndlessBuffer();
      }
    }
    this._emitPreview();
  }

  getCurrentWave() {
    return this.currentWaveIndex + 1;
  }

  getTotalWaves() {
    if (this.isEndless) return null;
    return this.waves.length;
  }

  isWaveActive() {
    return this.waveActive;
  }

  isBattleComplete() {
    return this.battleComplete;
  }

  isBetweenWaves() {
    return this.inCooldown && !this.battleComplete;
  }

  getNextWavePreview() {
    if (this.battleComplete || this.waveActive) return null;
    const nextIndex = this.currentWaveIndex + 1;
    if (nextIndex >= this.waves.length) {
      if (this.isEndless) this._ensureEndlessBuffer();
      if (nextIndex >= this.waves.length) return null;
    }

    const waveList = this.waves[nextIndex];
    /** @type {Record<string, number>} */
    const enemies = {};
    for (const type of waveList) {
      enemies[type] = (enemies[type] || 0) + 1;
    }

    return {
      wave: nextIndex + 1,
      total: this.getTotalWaves(),
      enemies,
      isBoss: this.isBossBattle,
      bossType: this.bossType,
    };
  }

  _emitPreview() {
    const preview = this.getNextWavePreview();
    this.scene.game.events.emit('wave-preview-changed', preview);
  }

  _computeManualFirstWave(zoneIndex, battle) {
    if (zoneIndex === 0 && battle === 0) {
      const intro = GameConfig.waves?.zoneIntro?.[0];
      return intro?.manualFirstWave ?? GameConfig.waves?.manualFirstWave ?? false;
    }
    return false;
  }

  _ensureEndlessBuffer() {
    if (!this.isEndless) return;
    if (this.currentWaveIndex < this.waves.length - 10) return;
    const batchSize = GameConfig.waves?.endlessBufferBatch ?? 25;
    const batch = this._generateEndlessWaves(this.waves.length, batchSize);
    this.waves.push(...batch);
  }

  _computeIsBoss(zoneIndex, battle) {
    if (zoneIndex >= GameConfig.zones.length) return false;
    const zoneConfig = GameConfig.zones[zoneIndex];
    return battle === zoneConfig.battles - 1;
  }

  _computeBossType(zoneIndex) {
    if (zoneIndex >= GameConfig.zones.length) return null;
    const pool = GameConfig.zones[zoneIndex].enemies;
    return pool.length > 0 ? pool[pool.length - 1] : null;
  }

  _waveConfig() {
    return GameConfig.waves || {};
  }

  _generateWaves(zoneIndex, battle) {
    const isEndless = zoneIndex >= GameConfig.zones.length;
    if (isEndless) return this._generateEndlessWaves(0);

    const wc = this._waveConfig();
    const zoneConfig = GameConfig.zones[zoneIndex];
    const isBoss = battle === zoneConfig.battles - 1;
    const totalWaves = this._getWaveCount(zoneIndex) + (isBoss ? (GameConfig.bossWaveBonus || 3) : 0);
    const waves = [];
    const intro = wc.zoneIntro?.[zoneIndex];

    for (let w = 0; w < totalWaves; w++) {
      const wave = [];
      let baseCount = Math.floor(
        (wc.baseCount ?? 3) + w * (wc.countPerWave ?? 1.2) + battle * (wc.countPerBattle ?? 2)
          + (isBoss ? w * (wc.bossWaveExtra ?? 0.5) : 0),
      );

      if (zoneIndex === 0 && battle === 0) {
        if (w < 2) {
          baseCount = Math.max(2, baseCount - 1);
        }
        const caps = intro?.battle0MaxCount;
        if (caps && caps[w] != null) {
          baseCount = Math.min(baseCount, caps[w]);
        }
      }

      if (zoneIndex === 1 && battle === 0 && intro?.battle0MaxCount) {
        const caps = intro.battle0MaxCount;
        if (caps[w] != null) {
          baseCount = Math.min(baseCount, caps[w]);
        }
      }

      const enemyPool = zoneConfig.enemies;

      for (let i = 0; i < baseCount; i++) {
        wave.push(this._pickEnemyForWave(zoneIndex, battle, w, enemyPool, intro));
      }

      if (isBoss && w >= Math.floor(totalWaves * 2 / 3) && enemyPool.length > 1) {
        wave.push(enemyPool[enemyPool.length - 1]);
      }

      waves.push(wave);
    }

    return waves;
  }

  _pickEnemyForWave(zoneIndex, battle, waveIndex, enemyPool, intro) {
    let pool = enemyPool;
    if (intro?.buffaloFromBattle != null && battle < intro.buffaloFromBattle) {
      pool = enemyPool.filter((e) => e !== 'BUFFALO');
      if (pool.length === 0) pool = enemyPool;
    }

    if (intro && waveIndex < (intro.gentleWaves ?? 0)) {
      const maxIdx = Math.min(intro.maxEnemyIndex ?? 0, pool.length - 1);
      return Math.random() < (intro.primaryWeight ?? 0.7)
        ? pool[0]
        : pool[maxIdx];
    }

    if (zoneIndex === 0 && battle === 0 && waveIndex >= 2 && pool.length > 1) {
      const frogWeight = intro?.lateFrogWeight ?? 0.4;
      return Math.random() < frogWeight ? pool[1] : pool[0];
    }

    if (zoneIndex === 0) {
      const maxIdx = waveIndex < 2 ? 0 : Math.min(1, pool.length - 1);
      return Math.random() < 0.7 ? pool[0] : pool[maxIdx];
    }

    if (intro?.maxEnemyIndex != null) {
      const maxIdx = Math.min(
        intro.maxEnemyIndex + Math.floor(waveIndex / 3),
        pool.length - 1,
      );
      return pool[Math.floor(Math.random() * (maxIdx + 1))];
    }

    const maxIdx = Math.min(
      Math.floor(Math.random() * Math.min(pool.length, 1 + Math.floor(waveIndex / 2))),
      pool.length - 1,
    );
    return pool[maxIdx];
  }

  _generateEndlessWaves(startFrom = 0, count = null) {
    const preGen = count ?? GameConfig.waves?.endlessPreGenerate ?? 50;
    const waves = [];
    const allEnemies = Object.keys(GameConfig.enemies);

    for (let i = 0; i < preGen; i++) {
      const w = startFrom + i;
      const difficulty = 1 + (w * GameConfig.endlessDifficultyScale);
      const waveCount = Math.floor(4 + 2 * difficulty);
      const wave = [];

      const maxEnemyIndex = Math.min(
        Math.floor(1 + w * 0.3),
        allEnemies.length - 1,
      );

      for (let j = 0; j < waveCount; j++) {
        const idx = Math.floor(Math.random() * (maxEnemyIndex + 1));
        wave.push(allEnemies[idx]);
      }

      waves.push(wave);
    }

    return waves;
  }

  _getWaveCount(zoneIndex) {
    const wc = this._waveConfig();
    const minWaves = wc.minWaves ?? 5;
    const maxWaves = wc.maxWaves ?? 15;
    const totalZones = GameConfig.zones.length;
    const step = (maxWaves - minWaves) / Math.max(totalZones - 1, 1);
    return Math.round(minWaves + step * zoneIndex);
  }
}
