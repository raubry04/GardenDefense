import { describe, it, expect } from 'vitest';
import { startingSunshineForZone, towerPlacementCost } from '../src/utils/battleEconomy.js';
import { canPurchaseUpgradeTier } from '../src/utils/upgradeTowers.js';
import { GameConfig } from '../src/config.js';

describe('startingSunshineForZone', () => {
  it('uses zone-specific starting sunshine for campaign zones', () => {
    expect(startingSunshineForZone(0)).toBe(GameConfig.startingSunshinePoints.zone1);
    expect(startingSunshineForZone(4)).toBe(GameConfig.startingSunshinePoints.zone5);
  });

  it('uses endless starting sunshine when zone index is beyond campaign', () => {
    const endlessZone = GameConfig.zones.length;
    expect(startingSunshineForZone(endlessZone)).toBe(GameConfig.startingSunshinePoints.endless);
    expect(startingSunshineForZone(endlessZone)).not.toBe(150);
  });
});

describe('towerPlacementCost', () => {
  it('increases cost for duplicate tower types', () => {
    expect(towerPlacementCost('CHICKEN', 0)).toBe(75);
    expect(towerPlacementCost('CHICKEN', 1)).toBeGreaterThan(75);
    expect(towerPlacementCost('CHICKEN', 3)).toBeGreaterThan(towerPlacementCost('CHICKEN', 1));
  });
});

describe('canPurchaseUpgradeTier', () => {
  it('allows tier 1 upgrades immediately', () => {
    expect(canPurchaseUpgradeTier('CHICKEN', 0, { hannahLevel: 1, unlockedZone: 0 })).toBe(true);
  });

  it('blocks tier 2 for zone towers until next zone is unlocked', () => {
    expect(canPurchaseUpgradeTier('OWL', 1, { unlockedZone: 2, hannahLevel: 5 })).toBe(false);
    expect(canPurchaseUpgradeTier('OWL', 1, { unlockedZone: 3, hannahLevel: 5 })).toBe(true);
  });
});
