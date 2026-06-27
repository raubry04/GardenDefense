import { GameConfig } from '../config.js';

/**
 * Whether the player may purchase the next meta upgrade tier (0→1 or 1→2).
 * Tier 2 is gated behind campaign progress so early wins cannot max one tower.
 */
export function canPurchaseUpgradeTier(towerType, currentTier, progress) {
  if (currentTier >= 2) return false;
  const unlock = GameConfig.towers[towerType]?.unlock;
  if (currentTier === 0) return true;
  if (unlock?.type === 'zone') {
    return (progress.unlockedZone ?? 0) >= unlock.value + 1;
  }
  if (unlock?.type === 'level') {
    return (progress.hannahLevel ?? 1) >= unlock.value + 3;
  }
  return true;
}

/**
 * All tower types available for meta upgrades, with types used in the last battle listed first.
 * @param {Array<{ type: string }>} placedTowers
 * @returns {string[]}
 */
export function getUpgradeableTowerTypes(placedTowers = []) {
  const allTypes = Object.keys(GameConfig.towers);
  const placedSet = new Set(placedTowers.map((t) => t.type));
  const placedFirst = allTypes.filter((t) => placedSet.has(t));
  const notPlaced = allTypes.filter((t) => !placedSet.has(t));
  return [...placedFirst, ...notPlaced];
}

/**
 * @param {string[]} towerTypes
 * @param {number} pageSize
 * @param {number} page
 * @returns {{ pageTypes: string[], totalPages: number, page: number }}
 */
export function paginateTowerTypes(towerTypes, pageSize, page = 0) {
  const totalPages = Math.max(1, Math.ceil(towerTypes.length / pageSize));
  const safePage = Math.min(Math.max(0, page), totalPages - 1);
  const start = safePage * pageSize;
  return {
    pageTypes: towerTypes.slice(start, start + pageSize),
    totalPages,
    page: safePage,
  };
}
