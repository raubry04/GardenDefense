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
  mergeProgressRecords,
  DEFAULT_PROGRESS,
} from '../src/utils/hannahProgress.js';

describe('battleSunshineToMetaBank', () => {
  it('deposits 16% of battle earnings', () => {
    expect(battleSunshineToMetaBank(510)).toBe(81);
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
    expect(tier2.damage).toBe(26);
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

  it('serializes nested battleStars shape used in production', () => {
    const payload = progressToServerPayload({
      playerName: 'Alice',
      battleStars: { 0: { 0: 3, 1: 2 }, 1: { 0: 1 } },
    });
    expect(JSON.parse(payload.battle_stars)).toEqual({
      0: { 0: 3, 1: 2 },
      1: { 0: 1 },
    });
  });
});

describe('mergeProgressRecords', () => {
  it('keeps best stars, upgrades, and sunshine from both records', () => {
    const local = normalizeProgress({
      playerName: 'Alice',
      sunshinePoints: 200,
      unlockedZone: 1,
      battleStars: { 0: { 0: 2 } },
      towerUpgrades: { CHICKEN: 1 },
    });
    const remote = normalizeProgress({
      playerName: 'Alice',
      sunshinePoints: 150,
      unlockedZone: 2,
      battleStars: { 0: { 0: 3, 1: 1 } },
      towerUpgrades: { RABBIT: 2 },
    });
    const merged = mergeProgressRecords(local, remote);
    expect(merged.sunshinePoints).toBe(200);
    expect(merged.unlockedZone).toBe(2);
    expect(merged.battleStars[0][0]).toBe(3);
    expect(merged.towerUpgrades.CHICKEN).toBe(1);
    expect(merged.towerUpgrades.RABBIT).toBe(2);
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

  it('restores nested battleStars from server JSON', () => {
    const progress = serverRowToProgress({
      player_name: 'Bob',
      hannah_level: 2,
      hannah_xp: 0,
      garden_level: 1,
      sunshine_points: 0,
      battle_stars: JSON.stringify({ 0: { 0: 3, 1: 1 } }),
      unlocked_zone: 0,
      zone_battles: '{}',
      tower_upgrades: '{}',
    }, 'Bob');
    expect(progress.battleStars[0][0]).toBe(3);
    expect(progress.battleStars[0][1]).toBe(1);
  });
});
