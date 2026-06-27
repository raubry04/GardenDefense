import { describe, it, expect } from 'vitest';
import { WaveManager } from '../src/systems/WaveManager.js';
import { GameConfig } from '../src/config.js';

function mockScene() {
  const events = { handlers: {}, on(e, fn) { this.handlers[e] = fn; }, emit() {} };
  return {
    events,
    sunshinePoints: 200,
    battleSunshineEarned: 0,
    game: { events: { emit() {} } },
  };
}

describe('WaveManager', () => {
  it('generates more waves for later zones', () => {
    const wm = new WaveManager(mockScene());
    wm.initBattle(0, 0);
    const zone0Waves = wm.getTotalWaves();

    wm.initBattle(4, 0);
    const zone4Waves = wm.getTotalWaves();

    expect(zone4Waves).toBeGreaterThan(zone0Waves);
  });

  it('adds boss wave bonus on final battle', () => {
    const wm = new WaveManager(mockScene());
    wm.initBattle(0, 0);
    const normal = wm.getTotalWaves();

    const zone = GameConfig.zones[0];
    wm.initBattle(0, zone.battles - 1);
    const boss = wm.getTotalWaves();

    expect(boss).toBe(normal + (GameConfig.bossWaveBonus || 3));
  });

  it('endless init sets isEndless and getTotalWaves returns null', () => {
    const wm = new WaveManager(mockScene());
    wm.initBattle(GameConfig.zones.length, 0);
    expect(wm.isEndless).toBe(true);
    expect(wm.getTotalWaves()).toBeNull();
    expect(wm.waves.length).toBe(GameConfig.waves.endlessPreGenerate);
  });

  it('endless mode does not battleComplete when waves are exhausted', () => {
    const wm = new WaveManager(mockScene());
    wm.initBattle(GameConfig.zones.length, 0);

    wm.currentWaveIndex = wm.waves.length - 1;
    wm.waveActive = true;
    wm.onAllEnemiesDefeated();

    expect(wm.battleComplete).toBe(false);
    expect(wm.inCooldown).toBe(true);
    expect(wm.waves.length).toBeGreaterThan(GameConfig.waves.endlessPreGenerate);
  });

  it('same waveSeed produces identical wave layouts', () => {
    const seed = 'daily-2025-06-25';
    const a = new WaveManager(mockScene());
    a.initBattle(0, 0, { waveSeed: seed });
    const b = new WaveManager(mockScene());
    b.initBattle(0, 0, { waveSeed: seed });
    expect(a.waves).toEqual(b.waves);
  });

  it('sendWaveEarly returns false when not in cooldown', () => {
    const wm = new WaveManager(mockScene());
    wm.initBattle(0, 0);
    wm.inCooldown = false;
    expect(wm.sendWaveEarly()).toBe(false);
  });

  it('sendWaveEarly returns true during cooldown', () => {
    const wm = new WaveManager(mockScene());
    wm.initBattle(0, 0);
    wm.inCooldown = true;
    wm.cooldownTimer = 5000;
    expect(wm.sendWaveEarly()).toBe(true);
    expect(wm.inCooldown).toBe(false);
  });

  it('returns next wave preview during prep and cooldown', () => {
    const wm = new WaveManager(mockScene());
    wm.initBattle(0, 0);
    wm.beginPrepPhase();

    const preview = wm.getNextWavePreview();
    expect(preview).not.toBeNull();
    expect(preview.wave).toBe(1);
    expect(preview.enemies).toBeDefined();
    expect(Object.keys(preview.enemies).length).toBeGreaterThan(0);
  });

  it('hides preview while a wave is active', () => {
    const wm = new WaveManager(mockScene());
    wm.initBattle(0, 0);
    wm.startNextWave();
    expect(wm.getNextWavePreview()).toBeNull();
  });

  it('zone 0 battle 0 wave 1 is mostly snakes with gentle counts', () => {
    const wm = new WaveManager(mockScene());
    wm.initBattle(0, 0);
    const wave1 = wm.waves[0];
    expect(wave1.length).toBeLessThanOrEqual(4);
    const snakes = wave1.filter((t) => t === 'SNAKE').length;
    expect(snakes / wave1.length).toBeGreaterThanOrEqual(0.5);
    expect(wave1.every((t) => t === 'SNAKE' || t === 'FROG')).toBe(true);
  });

  it('paused manager does not decrement cooldown timer', () => {
    const wm = new WaveManager(mockScene());
    wm.initBattle(0, 0);
    wm.beginPrepPhase();
    wm.cooldownTimer = 5000;
    wm.setPaused(true);
    wm.update(0, 1000);
    expect(wm.cooldownTimer).toBe(5000);
    wm.setPaused(false);
    wm.update(0, 1000);
    expect(wm.cooldownTimer).toBe(4000);
  });

  it('manual first wave does not auto-start when timer expires', () => {
    const wm = new WaveManager(mockScene());
    wm.initBattle(0, 0);
    wm.beginPrepPhase();
    expect(wm.requiresManualFirstWave()).toBe(true);

    wm.cooldownTimer = 0;
    wm.update(0, 16);
    expect(wm.inCooldown).toBe(true);
    expect(wm.currentWaveIndex).toBe(-1);
  });

  it('zone 0 battle 0 wave 5 enemy count within capped bounds', () => {
    const wm = new WaveManager(mockScene());
    wm.initBattle(0, 0);
    const wave5 = wm.waves[4];
    expect(wave5.length).toBeGreaterThanOrEqual(4);
    expect(wave5.length).toBeLessThanOrEqual(6);
  });

  it('zone 0 battle 0 late waves include frogs', () => {
    const wm = new WaveManager(mockScene());
    wm.initBattle(0, 0);
    const wave4 = wm.waves[3];
    const wave5 = wm.waves[4];
    const frogs = [...wave4, ...wave5].filter((t) => t === 'FROG').length;
    expect(frogs).toBeGreaterThan(0);
  });

  it('tier-0 rabbit and chicken ranges match config bases', () => {
    expect(GameConfig.towers.RABBIT.range).toBe(112);
    expect(GameConfig.towers.CHICKEN.range).toBe(198);
  });

  it('zone 1 battle 0 wave counts respect battle0MaxCount caps', () => {
    const wm = new WaveManager(mockScene());
    wm.initBattle(1, 0);
    const caps = GameConfig.waves.zoneIntro[1].battle0MaxCount;
    wm.waves.forEach((wave, i) => {
      if (caps[i] != null) {
        expect(wave.length).toBeLessThanOrEqual(caps[i]);
      }
    });
  });

  it('zone 2 battle 0 excludes buffalo before battle 2', () => {
    const wm = new WaveManager(mockScene());
    wm.initBattle(2, 0);
    const allTypes = wm.waves.flat();
    expect(allTypes).not.toContain('BUFFALO');
  });

  it('boss preview includes bossType on final battles', () => {
    const wm = new WaveManager(mockScene());
    const zone = GameConfig.zones[2];
    wm.initBattle(2, zone.battles - 1);
    wm.beginPrepPhase();
    const preview = wm.getNextWavePreview();
    expect(preview.isBoss).toBe(true);
    expect(preview.bossType).toBeTruthy();
  });
});
