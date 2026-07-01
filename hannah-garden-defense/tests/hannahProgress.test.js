import { describe, it, expect, beforeEach } from 'vitest';
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
  unlocksAtLevel,
  levelUpUnlockMessage,
  DEFAULT_PROGRESS,
  STORAGE_KEY,
  sanitizeProgressName,
  progressStorageKey,
  loadLocalProgress,
  saveLocalProgress,
  availableMetaBank,
} from '../src/utils/hannahProgress.js';

function mockLocalStorage() {
  const store = {};
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
    _store: store,
  };
}

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

  it('never lets a stale/lower stored level win over XP', () => {
    // 900 XP warrants level 4, but a stale record still claims level 1.
    const p = normalizeProgress({ hannahXp: 900, hannahLevel: 1 });
    expect(p.hannahLevel).toBe(4);
  });

  it('keeps a stored level that is already at or above the XP level', () => {
    const p = normalizeProgress({ hannahXp: 200, hannahLevel: 5 });
    expect(p.hannahLevel).toBe(5);
  });

  it('sanitizes an invalid XP value to the default', () => {
    const p = normalizeProgress({ hannahXp: 'oops' });
    expect(p.hannahXp).toBe(0);
    expect(p.hannahLevel).toBe(1);
  });
});

describe('per-player local storage', () => {
  beforeEach(() => {
    globalThis.localStorage = mockLocalStorage();
  });

  it('sanitizes names into safe, stable buckets', () => {
    expect(sanitizeProgressName('Hannah')).toBe('hannah');
    expect(sanitizeProgressName('  Emma Rose  ')).toBe('emma_rose');
    expect(sanitizeProgressName('')).toBe('default');
    expect(sanitizeProgressName(undefined)).toBe('default');
    expect(progressStorageKey('Hannah')).toBe(`${STORAGE_KEY}_hannah`);
  });

  it('isolates progress between two players on a shared device', () => {
    saveLocalProgress({ playerName: 'Hannah', sunshinePoints: 500, unlockedZone: 3 });
    saveLocalProgress({ playerName: 'Emma', sunshinePoints: 20, unlockedZone: 0 });

    const hannah = loadLocalProgress('Hannah');
    const emma = loadLocalProgress('Emma');
    expect(hannah.sunshinePoints).toBe(500);
    expect(hannah.unlockedZone).toBe(3);
    expect(emma.sunshinePoints).toBe(20);
    expect(emma.unlockedZone).toBe(0);
  });

  it('does not collide the per-player key with the legacy shared key', () => {
    saveLocalProgress({ playerName: 'Hannah', sunshinePoints: 1 });
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(`${STORAGE_KEY}_hannah`)).not.toBeNull();
  });

  it('migrates a legacy shared blob to the first player and clears legacy', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ sunshinePoints: 777, unlockedZone: 2 }));

    const hannah = loadLocalProgress('Hannah');
    expect(hannah.sunshinePoints).toBe(777);
    expect(hannah.unlockedZone).toBe(2);
    // Legacy blob is cleared so it cannot bleed into a second player.
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(`${STORAGE_KEY}_hannah`)).not.toBeNull();

    // A second player who arrives after migration starts fresh.
    const emma = loadLocalProgress('Emma');
    expect(emma.sunshinePoints).toBe(0);
  });

  it('does not overwrite an existing per-player bucket during migration', () => {
    saveLocalProgress({ playerName: 'Hannah', sunshinePoints: 500 });
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ sunshinePoints: 999 }));

    const hannah = loadLocalProgress('Hannah');
    expect(hannah.sunshinePoints).toBe(500);
    // Legacy blob left untouched because Hannah already had a bucket.
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
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

describe('meta sunshine bank (earned-vs-spent)', () => {
  it('derives available balance from earned minus spent', () => {
    expect(availableMetaBank({ metaSunshineEarned: 1000, metaSunshineSpent: 400 })).toBe(600);
    expect(availableMetaBank({ metaSunshineEarned: 300, metaSunshineSpent: 500 })).toBe(0);
    expect(availableMetaBank(null)).toBe(0);
  });

  it('falls back to a legacy sunshinePoints balance when totals are absent', () => {
    expect(availableMetaBank({ sunshinePoints: 250 })).toBe(250);
  });

  it('migrates a legacy record: earned seeds from sunshinePoints, spent 0', () => {
    const p = normalizeProgress({ sunshinePoints: 500 });
    expect(p.metaSunshineEarned).toBe(500);
    expect(p.metaSunshineSpent).toBe(0);
    expect(p.sunshinePoints).toBe(500);
    expect(availableMetaBank(p)).toBe(500);
  });

  it('re-normalizing a migrated record does not re-inflate or lose the bank', () => {
    const once = normalizeProgress({ sunshinePoints: 500 });
    const twice = normalizeProgress(once);
    expect(twice.metaSunshineEarned).toBe(500);
    expect(twice.metaSunshineSpent).toBe(0);
    expect(twice.sunshinePoints).toBe(500);
  });

  it('derives available from explicit totals over any stale sunshinePoints value', () => {
    // A record that carries both an inconsistent balance and real totals: totals win.
    const p = normalizeProgress({ sunshinePoints: 999, metaSunshineEarned: 800, metaSunshineSpent: 300 });
    expect(p.sunshinePoints).toBe(500);
    expect(availableMetaBank(p)).toBe(500);
  });

  it('max-merges earned and spent so racing writers never lose progress', () => {
    const local = normalizeProgress({ metaSunshineEarned: 1000, metaSunshineSpent: 600 });
    const remote = normalizeProgress({ metaSunshineEarned: 800, metaSunshineSpent: 200 });
    const merged = mergeProgressRecords(local, remote);
    expect(merged.metaSunshineEarned).toBe(1000);
    expect(merged.metaSunshineSpent).toBe(600);
    expect(merged.sunshinePoints).toBe(400);
  });

  it('persists spending across a merge with a stale, higher-balance record', () => {
    // Spent 200 out of 1000 earned locally (available 800). A stale tab still
    // believes the balance is 1000 (spent 0). The old max-on-balance model would
    // re-inflate to 1000; the earned/spent model keeps the spend.
    const afterSpend = normalizeProgress({ metaSunshineEarned: 1000, metaSunshineSpent: 200 });
    const staleTab = normalizeProgress({ metaSunshineEarned: 1000, metaSunshineSpent: 0 });
    const merged = mergeProgressRecords(afterSpend, staleTab);
    expect(merged.sunshinePoints).toBe(800);
    expect(merged.metaSunshineSpent).toBe(200);
  });

  it('preserves the available balance when merging a legacy record with a new-model record', () => {
    // Legacy device only knows the current balance (500). New-model device tracked
    // earned 700 / spent 200 (also 500 available). Merge must stay 500, not inflate.
    const legacy = normalizeProgress({ sunshinePoints: 500 });
    const modern = normalizeProgress({ metaSunshineEarned: 700, metaSunshineSpent: 200 });
    const merged = mergeProgressRecords(legacy, modern);
    expect(merged.metaSunshineEarned).toBe(700);
    expect(merged.metaSunshineSpent).toBe(200);
    expect(merged.sunshinePoints).toBe(500);
  });

  it('round-trips the totals through the server payload and derives sunshine_points', () => {
    const payload = progressToServerPayload({ metaSunshineEarned: 900, metaSunshineSpent: 250 });
    expect(payload.meta_sunshine_earned).toBe(900);
    expect(payload.meta_sunshine_spent).toBe(250);
    expect(payload.sunshine_points).toBe(650);
  });

  it('seeds totals from a legacy server row lacking the new columns', () => {
    const progress = serverRowToProgress({
      player_name: 'Bob',
      sunshine_points: 420,
    }, 'Bob');
    expect(progress.metaSunshineEarned).toBe(420);
    expect(progress.metaSunshineSpent).toBe(0);
    expect(availableMetaBank(progress)).toBe(420);
  });

  it('reads explicit totals from a new-model server row', () => {
    const progress = serverRowToProgress({
      player_name: 'Bob',
      sunshine_points: 650,
      meta_sunshine_earned: 900,
      meta_sunshine_spent: 250,
    }, 'Bob');
    expect(progress.metaSunshineEarned).toBe(900);
    expect(progress.metaSunshineSpent).toBe(250);
    expect(availableMetaBank(progress)).toBe(650);
  });
});

describe('unlocksAtLevel', () => {
  it('reports the Dog unlocking at level 2', () => {
    expect(unlocksAtLevel(2).towers).toContain('DOG');
  });

  it('reports Flower Bomb unlocking at level 6', () => {
    expect(unlocksAtLevel(6).abilities).toContain('FLOWER_BOMB');
  });

  it('reports a passive bonus at level 8', () => {
    expect(unlocksAtLevel(8).passive).toBeTruthy();
  });

  it('reports nothing new at a filler level', () => {
    const u = unlocksAtLevel(3);
    expect(u.towers).toHaveLength(0);
    expect(u.abilities).toHaveLength(0);
    expect(u.passive).toBeNull();
  });
});

describe('levelUpUnlockMessage', () => {
  it('names a newly unlocked tower', () => {
    expect(levelUpUnlockMessage(2)).toBe('Dog Patrol unlocked!');
  });

  it('names a newly unlocked ability', () => {
    expect(levelUpUnlockMessage(6)).toBe('Flower Bomb unlocked!');
  });

  it('describes a passive-only level', () => {
    expect(levelUpUnlockMessage(8)).toMatch(/New bonus/);
  });

  it('returns null when nothing unlocks', () => {
    expect(levelUpUnlockMessage(3)).toBeNull();
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
