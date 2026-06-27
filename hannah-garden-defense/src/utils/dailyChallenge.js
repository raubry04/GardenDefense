import { GameConfig } from '../config.js';

/** Local calendar date YYYY-MM-DD (matches player-facing "today"). */
export function dailyChallengeDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Stable numeric seed from the calendar date (used by WaveManager RNG). */
export function dailyChallengeSeed(date = new Date()) {
  const key = dailyChallengeDateKey(date);
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
  }
  return `daily-${key}-${GameConfig.dailyChallenge.zone}-${GameConfig.dailyChallenge.battle}-${hash}`;
}

export function dailyChallengeParams(date = new Date()) {
  const dc = GameConfig.dailyChallenge;
  return {
    zone: dc.zone,
    battle: dc.battle,
    seed: dailyChallengeSeed(date),
    dateKey: dailyChallengeDateKey(date),
  };
}
