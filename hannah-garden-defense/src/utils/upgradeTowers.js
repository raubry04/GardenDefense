import { GameConfig } from '../config.js';

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
