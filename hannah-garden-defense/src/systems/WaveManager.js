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
    this.waves = this._generateWaves(zone, battle);
    this.isBossBattle = this._computeIsBoss(zone, battle);
    this.bossType = this._computeBossType(zone);
    this._emitPreview();
  }

  beginPrepPhase() {
    if (this.battleComplete) return;
    this.inCooldown = true;
    this.cooldownTimer = GameConfig.prepPhaseSeconds * 1000;
    this._emitPreview();
  }

  startBattle(zone, battle) {
    this.initBattle(zone, battle);
    this.beginPrepPhase();
  }

  startNextWave() {
    if (this.battleComplete || this.waveActive) return;

    this.currentWaveIndex++;
    if (this.currentWaveIndex >= this.waves.length) {
      this.battleComplete = true;
      this.scene.events.emit('battle-complete');
      this._emitPreview();
      return;
    }

    this.waveActive = true;
    this.inCooldown = false;
    const waveEnemies = this.waves[this.currentWaveIndex];
    this.spawnQueue = [...waveEnemies];
    this.spawnTimer = 0;

    this.scene.events.emit('wave-start', {
      wave: this.currentWaveIndex + 1,
      total: this.waves.length,
      enemyCount: waveEnemies.length,
    });
    this._emitPreview();
  }

  sendWaveEarly() {
    if (!this.inCooldown) return;

    this.inCooldown = false;
    this.cooldownTimer = 0;

    this.scene.sunshinePoints += GameConfig.earlyWaveBonusPoints;
    this.scene.battleSunshineEarned = (this.scene.battleSunshineEarned || 0) + GameConfig.earlyWaveBonusPoints;
    this.scene.game.events.emit('points-changed', {
      points: this.scene.sunshinePoints,
    });

    this.startNextWave();
  }

  update(time, delta) {
    if (this.battleComplete) return;

    if (this.inCooldown) {
      this.cooldownTimer -= delta;
      if (this.cooldownTimer <= 0) {
        this.inCooldown = false;
        this.startNextWave();
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
      total: this.waves.length,
    });

    if (this.currentWaveIndex >= this.waves.length - 1) {
      this.battleComplete = true;
      this.scene.events.emit('battle-complete');
    } else {
      this.inCooldown = true;
      this.cooldownTimer = GameConfig.waveCooldownSeconds * 1000;
    }
    this._emitPreview();
  }

  getCurrentWave() {
    return this.currentWaveIndex + 1;
  }

  getTotalWaves() {
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
    if (nextIndex >= this.waves.length) return null;

    const waveList = this.waves[nextIndex];
    /** @type {Record<string, number>} */
    const enemies = {};
    for (const type of waveList) {
      enemies[type] = (enemies[type] || 0) + 1;
    }

    return {
      wave: nextIndex + 1,
      total: this.waves.length,
      enemies,
      isBoss: this.isBossBattle,
      bossType: this.bossType,
    };
  }

  _emitPreview() {
    const preview = this.getNextWavePreview();
    this.scene.game.events.emit('wave-preview-changed', preview);
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
    if (isEndless) return this._generateEndlessWaves();

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

      if (zoneIndex === 0 && battle === 0 && w < 2) {
        baseCount = Math.max(2, baseCount - 1);
      }

      const enemyPool = zoneConfig.enemies;

      for (let i = 0; i < baseCount; i++) {
        wave.push(this._pickEnemyForWave(zoneIndex, w, enemyPool, intro));
      }

      if (isBoss && w >= Math.floor(totalWaves * 2 / 3) && enemyPool.length > 1) {
        wave.push(enemyPool[enemyPool.length - 1]);
      }

      waves.push(wave);
    }

    return waves;
  }

  _pickEnemyForWave(zoneIndex, waveIndex, enemyPool, intro) {
    if (intro && waveIndex < (intro.gentleWaves ?? 0)) {
      const maxIdx = Math.min(intro.maxEnemyIndex ?? 0, enemyPool.length - 1);
      return Math.random() < (intro.primaryWeight ?? 0.7)
        ? enemyPool[0]
        : enemyPool[maxIdx];
    }

    if (zoneIndex === 0) {
      const maxIdx = waveIndex < 2 ? 0 : Math.min(1, enemyPool.length - 1);
      return Math.random() < 0.7 ? enemyPool[0] : enemyPool[maxIdx];
    }

    if (zoneIndex === 1) {
      const maxIdx = Math.min(Math.floor(1 + waveIndex / 3), enemyPool.length - 1);
      return enemyPool[Math.floor(Math.random() * (maxIdx + 1))];
    }

    const maxIdx = Math.min(
      Math.floor(Math.random() * Math.min(enemyPool.length, 1 + Math.floor(waveIndex / 2))),
      enemyPool.length - 1,
    );
    return enemyPool[maxIdx];
  }

  _generateEndlessWaves() {
    const preGen = GameConfig.waves?.endlessPreGenerate ?? 50;
    const waves = [];
    const allEnemies = Object.keys(GameConfig.enemies);

    for (let w = 0; w < preGen; w++) {
      const difficulty = 1 + (w * GameConfig.endlessDifficultyScale);
      const count = Math.floor(4 + 2 * difficulty);
      const wave = [];

      const maxEnemyIndex = Math.min(
        Math.floor(1 + w * 0.3),
        allEnemies.length - 1,
      );

      for (let i = 0; i < count; i++) {
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
