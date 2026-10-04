import { describe, it, expect } from 'vitest';
import {
  dailyChallengeDateKey,
  dailyChallengeSeed,
  dailyChallengeMap,
  clampDailyMapToUnlocked,
} from '../src/utils/dailyChallenge.js';

describe('dailyChallenge', () => {
  it('uses local YYYY-MM-DD date key', () => {
    const key = dailyChallengeDateKey(new Date(2026, 5, 25, 12, 0, 0));
    expect(key).toBe('2026-06-25');
  });

  it('produces stable seed for the same date', () => {
    const date = new Date('2026-06-25T08:00:00.000Z');
    expect(dailyChallengeSeed(date)).toBe(dailyChallengeSeed(date));
  });

  it('produces different seeds for different dates', () => {
    const a = dailyChallengeSeed(new Date('2026-06-25T00:00:00.000Z'));
    const b = dailyChallengeSeed(new Date('2026-06-26T00:00:00.000Z'));
    expect(a).not.toBe(b);
  });

  it('weekday map differs across adjacent weekdays', () => {
    const a = dailyChallengeMap(new Date(2026, 6, 5));
    const b = dailyChallengeMap(new Date(2026, 6, 6));
    expect(`${a.zone}-${a.battle}`).not.toBe(`${b.zone}-${b.battle}`);
  });

  it('clamps daily maps to unlocked zones (no Berry/Orchard early)', () => {
    expect(clampDailyMapToUnlocked({ zone: 4, battle: 0 }, 2)).toEqual({ zone: 2, battle: 0 });
    expect(clampDailyMapToUnlocked({ zone: 3, battle: 2 }, 2).zone).toBe(2);
    expect(dailyChallengeMap(new Date(2026, 6, 4), { maxUnlockedZone: 2 }).zone).toBeLessThanOrEqual(2);
  });
});
