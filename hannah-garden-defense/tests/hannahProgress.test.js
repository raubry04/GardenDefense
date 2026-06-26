import { describe, it, expect } from 'vitest';
import {
  battleSunshineToMetaBank,
  hannahLevelFromXp,
  adjustedAbilityCooldown,
  normalizeProgress,
  applyTowerTierStats,
  sumZoneStars,
  progressToServerPayload,
  serverRowToProgress,
  DEFAULT_PROGRESS,
} from '../src/utils/hannahProgress.js';

describe('battleSunshineToMetaBank', () => {
  it('deposits 20% of battle earnings', () => {
    expect(battleSunshineToMetaBank(510)).toBe(102);
    expect(battleSunshineToMetaBank(0)).toBe(0);
  });
});

describe('hannahLevelFromXp', () => {
  it('returns level 1 at zero XP', () => {
    expect(hannahLevelFromXp(0)).toBe(1);
  });

  it('advances at configured thresholds', () => {
    expect(hannahLevelFromXp(200)).toBe(2);
    expect(hannahLevelFromXp(500)).toBe(3);
    expect(hannahLevelFromXp(9000)).toBe(10);
  });
});

describe('adjustedAbilityCooldown', () => {
  it('reduces cooldown as Hannah levels up', () => {
    expect(adjustedAbilityCooldown(10000, 1)).toBe(10000);
    expect(adjustedAbilityCooldown(10000, 5)).toBe(8000);
  });
});

describe('normalizeProgress', () => {
  it('merges partial data onto defaults', () => {
    const p = normalizeProgress({ playerName: 'Test', hannahXp: 250 });
    expect(p.playerName).toBe('Test');
    expect(p.hannahLevel).toBe(2);
    expect(p.towerUpgrades).toEqual({});
  });
});

describe('applyTowerTierStats', () => {
  it('applies tier upgrades cumulatively', () => {
    const tier0 = applyTowerTierStats('CHICKEN', 0);
    expect(tier0.damage).toBe(10);

    const tier2 = applyTowerTierStats('CHICKEN', 2);
    expect(tier2.damage).toBe(30);
    expect(tier2.eggs).toBe(3);
    expect(tier2.pierce).toBe(1);
  });
});

describe('sumZoneStars', () => {
  it('sums battle star values', () => {
    expect(sumZoneStars({ 0: 3, 1: 2, 2: 1 })).toBe(6);
    expect(sumZoneStars(null)).toBe(0);
  });
});

describe('progressToServerPayload', () => {
  it('includes extended sync fields', () => {
    const payload = progressToServerPayload({
      playerName: 'Alice',
      hannahLevel: 3,
      unlockedZone: 2,
      towerUpgrades: { CHICKEN: 1 },
      zoneBattles: { 0: 5 },
    });
    expect(payload.player_name).toBe('Alice');
    expect(payload.unlocked_zone).toBe(2);
    expect(JSON.parse(payload.tower_upgrades)).toEqual({ CHICKEN: 1 });
  });
});

describe('serverRowToProgress', () => {
  it('merges server row with extended fields', () => {
    const progress = serverRowToProgress({
      player_name: 'Bob',
      hannah_level: 4,
      hannah_xp: 600,
      garden_level: 2,
      sunshine_points: 300,
      battle_stars: '{"0-0":3}',
      unlocked_zone: 1,
      zone_battles: '{"0":3}',
      tower_upgrades: '{"RABBIT":2}',
    }, 'Bob');
    expect(progress.hannahLevel).toBe(4);
    expect(progress.unlockedZone).toBe(1);
    expect(progress.towerUpgrades.RABBIT).toBe(2);
    expect(progress.battleStars['0-0']).toBe(3);
  });
});
