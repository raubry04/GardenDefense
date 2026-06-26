import { describe, it, expect } from 'vitest';
import { getProjectileStyle, getBurstPreset, shouldUseVfx } from '../src/battle/battleVfxConfig.js';
import { GameConfig } from '../src/config.js';

describe('battleVfxConfig', () => {
  it('maps tower types to distinct projectile textures', () => {
    expect(getProjectileStyle('CHICKEN').texture).toBe('particle_sparkle');
    expect(getProjectileStyle('OWL').texture).toBe('particle_slash');
    expect(getProjectileStyle('UNKNOWN').texture).toBeNull();
  });

  it('returns burst presets with counts', () => {
    const hit = getBurstPreset('hit');
    expect(hit.count).toBeGreaterThan(0);
    expect(hit.texture).toBe('particle_spark');
  });

  it('respects vfx enabled flag', () => {
    expect(shouldUseVfx({ enabled: true })).toBe(true);
    expect(shouldUseVfx({ enabled: false })).toBe(false);
    expect(shouldUseVfx(GameConfig.vfx)).toBe(true);
  });
});
