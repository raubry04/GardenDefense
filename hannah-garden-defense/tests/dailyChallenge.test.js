import { describe, it, expect } from 'vitest';
import { dailyChallengeDateKey, dailyChallengeSeed } from '../src/utils/dailyChallenge.js';

describe('dailyChallenge', () => {
  it('uses YYYY-MM-DD date key', () => {
    const key = dailyChallengeDateKey(new Date('2026-06-25T12:00:00.000Z'));
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
});
