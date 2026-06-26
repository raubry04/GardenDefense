import { describe, it, expect } from 'vitest';
import { getUpgradeableTowerTypes, paginateTowerTypes } from '../src/utils/upgradeTowers.js';
import { GameConfig } from '../src/config.js';

describe('upgradeTowers', () => {
  it('returns all tower types with placed towers first', () => {
    const types = getUpgradeableTowerTypes([{ type: 'OWL' }, { type: 'RABBIT' }]);
    expect(types).toContain('RABBIT');
    expect(types).toContain('OWL');
    expect(types.indexOf('RABBIT')).toBeLessThan(types.indexOf('CHICKEN'));
    expect(types.length).toBe(Object.keys(GameConfig.towers).length);
  });

  it('paginates tower list', () => {
    const all = getUpgradeableTowerTypes([]);
    const { pageTypes, totalPages, page } = paginateTowerTypes(all, 3, 0);
    expect(pageTypes).toHaveLength(3);
    expect(totalPages).toBe(Math.ceil(all.length / 3));
    expect(page).toBe(0);
  });

  it('clamps page index', () => {
    const all = getUpgradeableTowerTypes([]);
    const { page } = paginateTowerTypes(all, 3, 99);
    expect(page).toBe(Math.ceil(all.length / 3) - 1);
  });
});
