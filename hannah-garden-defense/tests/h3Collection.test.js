import { describe, it, expect } from 'vitest';
import { GameConfig } from '../src/config.js';
import {
  normalizeCollection,
  mergeCollections,
  isZoneMastered,
  claimMasteryReward,
  grantBattleStickers,
  masteryPassiveBonuses,
  battleAbilityKeys,
  resolveBonusAbility,
  unlockedBonusAbilities,
  setBonusAbility,
  albumEntries,
  albumProgress,
  equipSkin,
} from '../src/utils/collection.js';
import {
  normalizeProgress,
  progressToServerPayload,
  serverRowToProgress,
  mergeProgressRecords,
  unlocksAtLevel,
  levelUpUnlockMessage,
} from '../src/utils/hannahProgress.js';
import { ZONE_LAYOUTS } from '../src/three/pathUtils.js';
import { getZoneLayout } from '../src/utils/pathTile2D.js';
import { startingSunshineForZone } from '../src/utils/battleEconomy.js';

describe('H3 collection — stickers & album', () => {
  it('grants first-clear stickers and upgrades to shiny on 3★', () => {
    let col = normalizeCollection(null);
    const first = grantBattleStickers(col, ['SNAKE', 'FROG'], 1);
    expect(first.newStickers).toEqual(['SNAKE', 'FROG']);
    expect(first.collection.stickers.SNAKE).toBe(1);
    expect(first.collection.towerStickers.RABBIT).toBe(true);
    expect(first.collection.towerStickers.CHICKEN).toBe(true);

    const shiny = grantBattleStickers(first.collection, ['SNAKE'], 3);
    expect(shiny.collection.stickers.SNAKE).toBe(3);
    expect(shiny.newStickers).toEqual([]);
  });

  it('album progress counts unlocked animals', () => {
    const col = grantBattleStickers(normalizeCollection(null), ['PARROT'], 1).collection;
    const { filled, total } = albumProgress(col);
    expect(filled).toBe(1);
    expect(total).toBe(GameConfig.stickerAlbumOrder.length);
    const entries = albumEntries(col);
    expect(entries.find((e) => e.key === 'PARROT')?.unlocked).toBe(true);
    expect(entries.find((e) => e.key === 'ELEPHANT')?.unlocked).toBe(false);
  });
});

describe('H3 collection — zone mastery rewards', () => {
  it('detects full 3★ mastery', () => {
    const progress = {
      battleStars: {
        0: { 0: 3, 1: 3, 2: 3, 3: 3, 4: 3 },
      },
    };
    expect(isZoneMastered(progress, 0)).toBe(true);
    expect(isZoneMastered({ battleStars: { 0: { 0: 3, 1: 2, 2: 3, 3: 3, 4: 3 } } }, 0)).toBe(false);
  });

  it('claims a chick costume for Meadow mastery (not text-only)', () => {
    const { collection, newlyUnlocked } = claimMasteryReward(normalizeCollection(null), 0);
    expect(newlyUnlocked?.type).toBe('skin');
    expect(newlyUnlocked?.id).toBe('meadow_bow');
    expect(collection.skins).toContain('meadow_bow');
    expect(collection.equippedSkin).toBe('meadow_bow');
    expect(collection.mastery['0']).toBe(true);

    // Idempotent
    const again = claimMasteryReward(collection, 0);
    expect(again.newlyUnlocked).toBeNull();
  });

  it('claims map prop and passive mastery rewards', () => {
    const prop = claimMasteryReward(normalizeCollection(null), 1);
    expect(prop.newlyUnlocked?.type).toBe('prop');
    expect(prop.collection.mapProps).toContain('garden_windmill');

    const passive = claimMasteryReward(normalizeCollection(null), 3);
    expect(passive.newlyUnlocked?.type).toBe('passive');
    expect(passive.newlyUnlocked?.startingSunshineBonus).toBe(8);
    expect(masteryPassiveBonuses(passive.collection).startingSunshineBonus).toBe(8);
  });

  it('equips unlocked skins only', () => {
    let col = claimMasteryReward(normalizeCollection(null), 0).collection;
    col = equipSkin(col, 'orchard_crown');
    expect(col.equippedSkin).toBe('meadow_bow'); // not unlocked yet
    col = claimMasteryReward(col, 4).collection;
    col = equipSkin(col, 'orchard_crown');
    expect(col.equippedSkin).toBe('orchard_crown');
  });
});

describe('H3 ability progression — Seed Storm + loadout', () => {
  it('unlocks Seed Storm at Hannah level 4', () => {
    expect(unlocksAtLevel(4).abilities).toContain('SEED_STORM');
    expect(levelUpUnlockMessage(4)).toMatch(/Seed Storm/i);
    expect(GameConfig.hannahAbilities.SEED_STORM.unlockLevel).toBe(4);
  });

  it('shows core abilities plus selected bonus slot', () => {
    expect(unlockedBonusAbilities(3)).toEqual([]);
    expect(unlockedBonusAbilities(4)).toEqual(['SEED_STORM']);
    expect(unlockedBonusAbilities(6)).toEqual(['SEED_STORM', 'FLOWER_BOMB']);

    const at4 = battleAbilityKeys(normalizeCollection(null), 4);
    expect(at4).toEqual(['SUNSHINE_BURST', 'GARDEN_RAIN', 'RAINBOW_SHIELD', 'SEED_STORM']);

    let col = setBonusAbility(normalizeCollection(null), 'FLOWER_BOMB', 6);
    expect(resolveBonusAbility(col, 6)).toBe('FLOWER_BOMB');
    expect(battleAbilityKeys(col, 6)).toContain('FLOWER_BOMB');
    expect(battleAbilityKeys(col, 6)).not.toContain('SEED_STORM');
  });
});

describe('H3 Zone 6 — Harvest Festival', () => {
  it('adds a 6th seasonal campaign zone', () => {
    expect(GameConfig.zones).toHaveLength(6);
    expect(GameConfig.zones[5].name).toMatch(/Harvest/i);
    expect(GameConfig.zones[5].seasonal).toBe(true);
    expect(GameConfig.zones[5].battles).toBe(5);
    expect(GameConfig.zoneMasteryBadges[5]).toBeTruthy();
    expect(GameConfig.zoneMasteryRewards[5]?.type).toBe('passive');
  });

  it('has a dedicated layout and starting sunshine', () => {
    expect(ZONE_LAYOUTS).toHaveLength(6);
    expect(getZoneLayout(5).id).toBe('harvest');
    expect(startingSunshineForZone(5)).toBe(GameConfig.startingSunshinePoints.zone6);
    expect(startingSunshineForZone(6)).toBe(GameConfig.startingSunshinePoints.endless);
  });
});

describe('H3 progress persistence — collection field', () => {
  it('normalizes and merges collection on progress', () => {
    const a = normalizeProgress({
      collection: {
        stickers: { SNAKE: 1 },
        skins: ['default', 'meadow_bow'],
        equippedSkin: 'meadow_bow',
      },
    });
    expect(a.collection.stickers.SNAKE).toBe(1);
    expect(a.collection.equippedSkin).toBe('meadow_bow');

    const b = normalizeProgress({
      collection: {
        stickers: { SNAKE: 3, FROG: 1 },
        skins: ['default', 'coop_bandana'],
        mastery: { 0: true },
      },
    });
    const merged = mergeProgressRecords(a, b);
    expect(merged.collection.stickers.SNAKE).toBe(3);
    expect(merged.collection.stickers.FROG).toBe(1);
    expect(merged.collection.skins).toEqual(
      expect.arrayContaining(['default', 'meadow_bow', 'coop_bandana']),
    );
    expect(merged.collection.mastery['0']).toBe(true);
  });

  it('round-trips collection_json through server payload helpers', () => {
    const local = normalizeProgress({
      playerName: 'Kid',
      collection: {
        stickers: { BEAR: 3 },
        skins: ['default', 'orchard_crown'],
        equippedSkin: 'orchard_crown',
        bonusAbility: 'SEED_STORM',
        mapProps: ['garden_windmill'],
        mastery: { 1: true },
        towerStickers: { DOG: true },
      },
    });
    const payload = progressToServerPayload(local);
    expect(typeof payload.collection_json).toBe('string');
    const row = {
      player_name: 'Kid',
      hannah_level: 1,
      hannah_xp: 0,
      garden_level: 1,
      sunshine_points: 0,
      battle_stars: '{}',
      unlocked_zone: 0,
      zone_stars: '{}',
      zone_battles: '{}',
      tower_upgrades: '{}',
      collection_json: payload.collection_json,
    };
    const back = serverRowToProgress(row, 'Kid');
    expect(back.collection.stickers.BEAR).toBe(3);
    expect(back.collection.equippedSkin).toBe('orchard_crown');
    expect(back.collection.bonusAbility).toBe('SEED_STORM');
    expect(back.collection.mapProps).toContain('garden_windmill');
  });

  it('mergeCollections unions unlocks and maxes sticker quality', () => {
    const merged = mergeCollections(
      { stickers: { COW: 1 }, skins: ['default'] },
      { stickers: { COW: 3 }, skins: ['meadow_bow'], mapProps: ['garden_windmill'] },
    );
    expect(merged.stickers.COW).toBe(3);
    expect(merged.skins).toContain('meadow_bow');
    expect(merged.mapProps).toContain('garden_windmill');
  });
});
