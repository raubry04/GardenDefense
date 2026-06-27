import { describe, it, expect } from 'vitest';
import { GameConfig } from '../src/config.js';
import {
  battleTimeScaleWhenPaused,
  battleTimeScaleWhenRunning,
} from '../src/battle/battlePause.js';

describe('GameConfig battle UX', () => {
  const newEnemies = ['RHINO', 'HIPPO', 'CROCODILE', 'ZEBRA'];

  it('defines new enemy types RHINO/HIPPO/CROCODILE/ZEBRA', () => {
    for (const type of newEnemies) {
      expect(GameConfig.enemies[type]).toBeDefined();
      expect(GameConfig.enemies[type].hp).toBeGreaterThan(0);
    }
  });

  it('defines eliteVariants for replay modifiers', () => {
    expect(GameConfig.eliteVariants).toBeDefined();
    expect(Object.keys(GameConfig.eliteVariants).length).toBeGreaterThan(0);
    expect(GameConfig.eliteVariants.FROG?.hpMult).toBeGreaterThan(1);
  });

  it('defines zonePropPools per zone', () => {
    expect(GameConfig.zonePropPools).toBeDefined();
    expect(Array.isArray(GameConfig.zonePropPools[0])).toBe(true);
    expect(GameConfig.zonePropPools[0].length).toBeGreaterThan(0);
  });
});

describe('pause speed preservation', () => {
  it('freezes time when paused', () => {
    expect(battleTimeScaleWhenPaused()).toBe(0);
  });

  it('restores battle speed on resume', () => {
    expect(battleTimeScaleWhenRunning(1)).toBe(1);
    expect(battleTimeScaleWhenRunning(2)).toBe(2);
    expect(battleTimeScaleWhenRunning(undefined)).toBe(1);
  });
});
