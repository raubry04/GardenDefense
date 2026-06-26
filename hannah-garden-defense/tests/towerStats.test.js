import { describe, it, expect } from 'vitest';
import { formatTowerStats, towerDisplayName } from '../src/battle/towerStats.js';

describe('towerDisplayName', () => {
  it('returns friendly names', () => {
    expect(towerDisplayName('CHICKEN')).toBe('Chicken Cannon');
    expect(towerDisplayName('PIG_WALL')).toBe('Pig Wall');
  });
});

describe('formatTowerStats', () => {
  it('includes combat stats', () => {
    const lines = formatTowerStats('CHICKEN', {
      tier: 1,
      damage: 20,
      range: 300,
      fireRate: 700,
      eggs: 2,
      pierce: 0,
      slowPercent: 0,
      stunMs: 0,
      freezeMs: 0,
      maxHp: 200,
      hp: 200,
      thorns: 0,
    });
    expect(lines.some((l) => l.includes('Damage: 20'))).toBe(true);
    expect(lines.some((l) => l.includes('Tier 1'))).toBe(true);
    expect(lines.some((l) => l.includes('Eggs: 2'))).toBe(true);
  });

  it('shows pig wall HP', () => {
    const lines = formatTowerStats('PIG_WALL', {
      tier: 0,
      damage: 0,
      range: 0,
      maxHp: 500,
      hp: 320,
      slowPercent: 0,
      stunMs: 0,
      freezeMs: 0,
      thorns: 0,
    });
    expect(lines.some((l) => l.includes('HP: 320/500'))).toBe(true);
  });
});
