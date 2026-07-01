import { describe, it, expect } from 'vitest';
import { THREAT_BADGE, threatBadgeForTag } from '../src/ui/WavePreview.js';
import { GameConfig } from '../src/config.js';

describe('WavePreview threat badges', () => {
  it('maps every configured enemy threat tag to a badge glyph', () => {
    const tags = new Set(Object.values(GameConfig.enemyThreatTags || {}));
    for (const tag of tags) {
      expect(threatBadgeForTag(tag), `missing badge for tag "${tag}"`).toBeTruthy();
    }
  });

  it('covers the newly-added armored, split, and immuneSlow threats', () => {
    expect(threatBadgeForTag('armored')).toBe(THREAT_BADGE.armored);
    expect(threatBadgeForTag('split')).toBe(THREAT_BADGE.split);
    expect(threatBadgeForTag('immuneSlow')).toBe(THREAT_BADGE.immuneSlow);
  });

  it('resolves the raw enemy-config prop spellings as aliases', () => {
    expect(threatBadgeForTag('splitsInto')).toBe(THREAT_BADGE.split);
    expect(threatBadgeForTag('immuneToSlow')).toBe(THREAT_BADGE.immuneSlow);
  });

  it('returns null for unknown or missing tags', () => {
    expect(threatBadgeForTag('nope')).toBeNull();
    expect(threatBadgeForTag(undefined)).toBeNull();
    expect(threatBadgeForTag('')).toBeNull();
  });
});
