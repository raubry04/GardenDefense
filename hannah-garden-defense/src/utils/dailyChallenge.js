import { GameConfig } from '../config.js';

/** Local calendar date YYYY-MM-DD (matches player-facing "today"). */
export function dailyChallengeDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Zone/battle for the daily map — rotates by local weekday.
 * @param {Date} [date]
 * @returns {{ zone: number, battle: number }}
 */
export function dailyChallengeMap(date = new Date()) {
  const dc = GameConfig.dailyChallenge || {};
  const maps = dc.weekdayMaps;
  if (Array.isArray(maps) && maps.length > 0) {
    const entry = maps[date.getDay() % maps.length];
    if (entry && Number.isFinite(entry.zone) && Number.isFinite(entry.battle)) {
      return { zone: entry.zone, battle: entry.battle };
    }
  }
  return { zone: dc.zone ?? 2, battle: dc.battle ?? 1 };
}

/** Stable numeric seed from the calendar date (used by WaveManager RNG). */
export function dailyChallengeSeed(date = new Date()) {
  const key = dailyChallengeDateKey(date);
  const map = dailyChallengeMap(date);
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
  }
  return `daily-${key}-${map.zone}-${map.battle}-${hash}`;
}

export function dailyChallengeParams(date = new Date()) {
  const map = dailyChallengeMap(date);
  return {
    zone: map.zone,
    battle: map.battle,
    seed: dailyChallengeSeed(date),
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
