import { describe, it, expect } from 'vitest';
import {
  pathSideKeyFromSegment,
  pickCraftpixPathTileForSegment,
  craftpixGroundKey,
  CRAFTPIX_PATH_BY_SIDES,
} from '../src/utils/craftpixTiles.js';

describe('pathSideKeyFromSegment', () => {
  it('returns a non-empty side key string', () => {
    const key = pathSideKeyFromSegment({ dirIn: 'N', dirOut: 'E' });
    expect(typeof key).toBe('string');
    expect(key.length).toBeGreaterThan(0);
  });
});

describe('pickCraftpixPathTileForSegment', () => {
  it('returns a numeric tile id', () => {
    const seg = { dirIn: 'N', dirOut: 'E' };
    const key = pathSideKeyFromSegment(seg);
    const tile = pickCraftpixPathTileForSegment(seg, 0);
    const options = CRAFTPIX_PATH_BY_SIDES[key] ?? [14];
    expect(options).toContain(tile);
  });

  it('is deterministic for the same seed', () => {
    const seg = { dirIn: 'E', dirOut: 'W' };
    expect(pickCraftpixPathTileForSegment(seg, 2)).toBe(pickCraftpixPathTileForSegment(seg, 2));
  });
});

describe('craftpixGroundKey', () => {
  it('zero-pads tile numbers', () => {
    expect(craftpixGroundKey(5)).toBe('cp_ground_05');
    expect(craftpixGroundKey(43)).toBe('cp_ground_43');
  });
});
