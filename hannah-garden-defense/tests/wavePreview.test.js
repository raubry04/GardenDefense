import { describe, it, expect } from 'vitest';
import { THREAT_BADGE, threatBadgeForTag, wavePlanTip } from '../src/ui/WavePreview.js';
import { GameConfig } from '../src/config.js';

describe('WavePreview threat badges', () => {
  it('maps every configured enemy threat tag to a badge glyph', () => {
    const tags = new Set(Object.values(GameConfig.enemyThreatTags || {}));
    for (const tag of tags) {
      expect(threatBadgeForTag(tag), `missing badge for tag "${tag}"`).toBeTruthy();
    }
  });

  it('covers the newly-added armored, split, immuneSlow, and H1 threat badges', () => {
    expect(threatBadgeForTag('armored')).toBe(THREAT_BADGE.armored);
    expect(threatBadgeForTag('split')).toBe(THREAT_BADGE.split);
    expect(threatBadgeForTag('immuneSlow')).toBe(THREAT_BADGE.immuneSlow);
    expect(threatBadgeForTag('towerHunter')).toBe(THREAT_BADGE.towerHunter);
    expect(threatBadgeForTag('steal')).toBe(THREAT_BADGE.steal);
    expect(threatBadgeForTag('tank')).toBe(THREAT_BADGE.tank);
  });

  it('resolves the raw enemy-config prop spellings as aliases', () => {
    expect(threatBadgeForTag('splitsInto')).toBe(THREAT_BADGE.split);
    expect(threatBadgeForTag('immuneToSlow')).toBe(THREAT_BADGE.immuneSlow);
  });

  it('tells kids to use Owls when the next wave has flyers', () => {
    expect(wavePlanTip({ PARROT: 2, SNAKE: 1 })).toBe('Owls this wave!');
    expect(wavePlanTip({ SNAKE: 3 })).toBeNull();
  });

  it('returns null for unknown or missing tags', () => {
    expect(threatBadgeForTag('nope')).toBeNull();
    expect(threatBadgeForTag(undefined)).toBeNull();
    expect(threatBadgeForTag('')).toBeNull();
  });
});
