import { GameConfig } from '../config.js';

/** YYYY-MM-DD seed string for the current UTC day. */
export function dailyChallengeDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
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
