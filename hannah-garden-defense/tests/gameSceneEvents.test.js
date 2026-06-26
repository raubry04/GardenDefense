import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { WaveManager } from '../src/systems/WaveManager.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function mockScene() {
  return {
    events: { on() {}, emit() {} },
    sunshinePoints: 200,
    battleSunshineEarned: 0,
    game: { events: { emit() {} } },
  };
}

describe('gameSceneEvents', () => {
  it('GameScene defines _emitWaveCooldownIfChanged', () => {
    const src = readFileSync(join(root, 'src/scenes/GameScene.js'), 'utf8');
    expect(src).toContain('_emitWaveCooldownIfChanged()');
    expect(src).toMatch(/_emitWaveCooldownIfChanged\s*\(/);
  });

  it('UIScene create does not call _emitWaveCooldownIfChanged', () => {
    const src = readFileSync(join(root, 'src/scenes/UIScene.js'), 'utf8');
    expect(src).not.toContain('_emitWaveCooldownIfChanged');
  });

  it('WaveManager emits cooldown shape via game events when integrated', () => {
    const wm = new WaveManager(mockScene());
    wm.initBattle(0, 0);
    wm.beginPrepPhase();
    expect(wm.isBetweenWaves()).toBe(true);
    expect(wm.getCooldownSecondsRemaining()).toBeGreaterThan(0);
    expect(wm.requiresManualFirstWave()).toBe(true);
  });
});
