import { GameConfig } from '../config.js';

/** Default matches H1: unlock after Zone 2 clear (unlockedZone >= 2). */
export const EXTRA_MODES_MIN_UNLOCKED_ZONE = 2;

/**
 * Whether Endless Frontier and Daily Challenge are playable.
 * @param {number|null|undefined} unlockedZone
 * @returns {boolean}
 */
export function isExtraModesUnlocked(unlockedZone) {
  const min = GameConfig.extraModesMinUnlockedZone ?? EXTRA_MODES_MIN_UNLOCKED_ZONE;
  return (unlockedZone ?? 0) >= min;
}

/** Kid-facing toast / label when Endless or Daily is tapped while locked. */
export function extraModesLockMessage() {
  const zoneNum = GameConfig.extraModesMinUnlockedZone ?? EXTRA_MODES_MIN_UNLOCKED_ZONE;
  const zoneName = GameConfig.zones[zoneNum - 1]?.name;
  if (zoneName) {
    return `Beat Zone ${zoneNum} (${zoneName}) to unlock!`;
  }
  return `Beat Zone ${zoneNum} to unlock!`;
}
