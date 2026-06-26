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

  it('generates endless waves for zone index >= zone count', () => {
    const wm = new WaveManager(mockScene());
    wm.initBattle(GameConfig.zones.length, 0);
    expect(wm.getTotalWaves()).toBe(GameConfig.waves.endlessPreGenerate);
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
});
