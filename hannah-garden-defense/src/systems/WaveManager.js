import { GameConfig } from '../config.js';

const SPAWN_DELAY_MS = 800;

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
  }

  beginPrepPhase() {
    if (this.battleComplete) return;
    this.inCooldown = true;
    this.cooldownTimer = GameConfig.prepPhaseSeconds * 1000;
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
  }

  sendWaveEarly() {
    if (!this.inCooldown) return;

    this.inCooldown = false;
    this.cooldownTimer = 0;

    this.scene.sunshinePoints += GameConfig.earlyWaveBonusPoints;
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

    if (this.spawnQueue.length > 0) {
      this.spawnTimer -= delta;
      if (this.spawnTimer <= 0) {
        const enemyType = this.spawnQueue.shift();
        this.scene.events.emit('enemy-spawn', { type: enemyType });
        this.spawnTimer = SPAWN_DELAY_MS;
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

  _generateWaves(zoneIndex, battle) {
    const isEndless = zoneIndex >= GameConfig.zones.length;
    if (isEndless) return this._generateEndlessWaves();

    const zoneConfig = GameConfig.zones[zoneIndex];
    const isBoss = battle === zoneConfig.battles - 1;
    const totalWaves = this._getWaveCount(zoneIndex) + (isBoss ? (GameConfig.bossWaveBonus || 3) : 0);
    const waves = [];

    for (let w = 0; w < totalWaves; w++) {
      const wave = [];
      const baseCount = 3 + Math.floor(w * 1.2) + (battle * 2) + (isBoss ? Math.floor(w * 0.5) : 0);
      const enemyPool = zoneConfig.enemies;

      for (let i = 0; i < baseCount; i++) {
        let idx;
        if (zoneIndex === 0) {
          const maxIdx = w < 2 ? 0 : Math.min(1, enemyPool.length - 1);
          idx = Math.random() < 0.7 ? 0 : maxIdx;
        } else if (zoneIndex === 1) {
          const maxIdx = Math.min(Math.floor(1 + w / 3), enemyPool.length - 1);
          idx = Math.floor(Math.random() * (maxIdx + 1));
        } else {
          idx = Math.min(
            Math.floor(Math.random() * Math.min(enemyPool.length, 1 + Math.floor(w / 2))),
            enemyPool.length - 1
          );
        }
        wave.push(enemyPool[idx]);
      }

      if (isBoss && w >= Math.floor(totalWaves / 2) && enemyPool.length > 1) {
        wave.push(enemyPool[enemyPool.length - 1]);
      }

      waves.push(wave);
    }

    return waves;
  }

  _generateEndlessWaves() {
    const waves = [];
    const allEnemies = Object.keys(GameConfig.enemies);

    for (let w = 0; w < 999; w++) {
      const difficulty = 1 + (w * GameConfig.endlessDifficultyScale);
      const count = Math.floor(4 + 2 * difficulty);
      const wave = [];

      const maxEnemyIndex = Math.min(
        Math.floor(1 + w * 0.3),
        allEnemies.length - 1
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
    const minWaves = 5;
    const maxWaves = 15;
    const totalZones = GameConfig.zones.length;
    const step = (maxWaves - minWaves) / Math.max(totalZones - 1, 1);
    return Math.round(minWaves + step * zoneIndex);
  }
}
