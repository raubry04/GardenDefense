import { GameConfig } from '../config.js';

/** Local calendar date YYYY-MM-DD (matches player-facing "today"). */
export function dailyChallengeDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Clamp a zone/battle pair so kids never enter locked campaign zones.
 * @param {{ zone: number, battle: number }} map
 * @param {number} [maxUnlockedZone]
 * @returns {{ zone: number, battle: number }}
 */
export function clampDailyMapToUnlocked(map, maxUnlockedZone) {
  let zone = map?.zone ?? 0;
  let battle = map?.battle ?? 0;
  if (Number.isFinite(maxUnlockedZone) && maxUnlockedZone >= 0 && zone > maxUnlockedZone) {
    zone = maxUnlockedZone;
  }
  const battles = GameConfig.zones?.[zone]?.battles ?? 1;
  const maxBattle = Math.max(0, battles - 1);
  if (!Number.isFinite(battle) || battle < 0) battle = 0;
  if (battle > maxBattle) battle = maxBattle;
  return { zone, battle };
}

/**
 * Zone/battle for the daily map — rotates by local weekday.
 * Pass `maxUnlockedZone` (from progress) so Berry/Orchard stay locked until earned.
 * @param {Date} [date]
 * @param {{ maxUnlockedZone?: number }} [opts]
 * @returns {{ zone: number, battle: number }}
 */
export function dailyChallengeMap(date = new Date(), opts = {}) {
  const dc = GameConfig.dailyChallenge || {};
  const maps = dc.weekdayMaps;
  let raw;
  if (Array.isArray(maps) && maps.length > 0) {
    const entry = maps[date.getDay() % maps.length];
    if (entry && Number.isFinite(entry.zone) && Number.isFinite(entry.battle)) {
      raw = { zone: entry.zone, battle: entry.battle };
    }
  }
  if (!raw) {
    raw = { zone: dc.zone ?? 2, battle: dc.battle ?? 1 };
  }
  return clampDailyMapToUnlocked(raw, opts.maxUnlockedZone);
}

/** Stable numeric seed from the calendar date (used by WaveManager RNG). */
export function dailyChallengeSeed(date = new Date(), opts = {}) {
  const key = dailyChallengeDateKey(date);
  const map = dailyChallengeMap(date, opts);
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
  }
  return `daily-${key}-${map.zone}-${map.battle}-${hash}`;
}

export function dailyChallengeParams(date = new Date(), opts = {}) {
  const map = dailyChallengeMap(date, opts);
  return {
    zone: map.zone,
    battle: map.battle,
    seed: dailyChallengeSeed(date, opts),
    dateKey: dailyChallengeDateKey(date),
  };
}

/**
 * Daily win chest amounts (meta sunshine + XP).
 * @returns {{ metaSunshine: number, xp: number }}
 */
export function dailyChestReward() {
  const dc = GameConfig.dailyChallenge || {};
  return {
    metaSunshine: dc.chestMetaSunshine ?? 40,
    xp: dc.chestXp ?? 25,
  };
}

/**
 * True if this calendar day already claimed the daily chest.
 * @param {object} progress
 * @param {string} dateKey
 */
export function hasClaimedDailyChest(progress, dateKey) {
  return !!(progress?.lastDailyChestDate && progress.lastDailyChestDate === dateKey);
}
