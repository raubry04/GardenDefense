import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  GARDEN_DECOR_DEPTH,
  GARDEN_DECOR_MIN_PROP_SIZE,
  GARDEN_SAFE_PROP_KEYS,
  buildGardenDecorLayout,
  cullPropsAgainstUi,
  decorateGardenBackdrop,
  getGardenUiSafeRects,
  getPropBounds,
  rectsOverlap,
} from '../src/utils/gardenBackdrop.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

describe('gardenBackdrop helper', () => {
  it('exports safe prop keys without rocks', () => {
    expect(GARDEN_SAFE_PROP_KEYS.length).toBeGreaterThanOrEqual(10);
    for (const key of GARDEN_SAFE_PROP_KEYS) {
      expect(key.startsWith('cp_')).toBe(true);
      expect(key.toLowerCase()).not.toContain('rock');
    }
    expect(GARDEN_DECOR_DEPTH).toBeLessThan(5);
    expect(GARDEN_DECOR_MIN_PROP_SIZE).toBeGreaterThanOrEqual(48);
  });

  it('builds dense layouts with readable prop sizes and known keys', () => {
    for (const variant of ['menu', 'map', 'upgrades', 'result', 'default']) {
      const layout = buildGardenDecorLayout(1280, 720, variant);
      expect(layout.length).toBeGreaterThanOrEqual(8);
      for (const p of layout) {
        expect(GARDEN_SAFE_PROP_KEYS).toContain(p.key);
        expect(p.size).toBeGreaterThanOrEqual(GARDEN_DECOR_MIN_PROP_SIZE);
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThanOrEqual(1280);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeLessThanOrEqual(720);
      }
    }
  });

  it('defines UI safe rects and culls overlapping props', () => {
    for (const variant of ['menu', 'map', 'upgrades', 'result']) {
      const rects = getGardenUiSafeRects(1280, 720, variant);
      expect(rects.length).toBeGreaterThanOrEqual(1);
      for (const r of rects) {
        expect(r.w).toBeGreaterThan(0);
        expect(r.h).toBeGreaterThan(0);
      }

      const layout = buildGardenDecorLayout(1280, 720, variant);
      for (const prop of layout) {
        const bounds = getPropBounds(prop);
        for (const rect of rects) {
          expect(rectsOverlap(bounds, rect, 4)).toBe(false);
        }
      }
    }

    const blocker = [{ x: 100, y: 100, w: 200, h: 200 }];
    const culled = cullPropsAgainstUi(
      [{ key: 'cp_bushSmall', x: 150, y: 200, size: 60 }],
      blocker,
    );
    expect(culled).toEqual([]);

    const kept = cullPropsAgainstUi(
      [{ key: 'cp_bushSmall', x: 40, y: 700, size: 50 }],
      blocker,
    );
    expect(kept).toHaveLength(1);
  });

  it('skips missing textures and never uses fillCircle speckles or flat pale strips', () => {
    const added = [];
    const scene = {
      textures: { exists: () => false },
      add: {
        rectangle: (...args) => {
          const obj = { type: 'rect', args, setDepth() { return this; } };
          added.push(obj);
          return obj;
        },
        image: () => {
          throw new Error('should not add images when textures missing');
        },
      },
    };
    // Ground strip is opt-in and needs textures; with none loaded, décor is empty.
    const objs = decorateGardenBackdrop(scene, { width: 1280, height: 720, variant: 'menu' });
    expect(objs).toEqual([]);
    expect(added).toEqual([]);

    const src = read('src/utils/gardenBackdrop.js');
    expect(src).not.toMatch(/\.fillCircle\s*\(/);
    expect(src).not.toMatch(/add\.circle\s*\(/);
    expect(src).not.toMatch(/add\.rectangle\s*\(/);
    expect(src).toContain('decorateGardenBackdrop');
    expect(src).toContain('cullPropsAgainstUi');
    expect(src).toMatch(/groundStrip === true/);
  });

  it('letterbox / CSS grass color matches Craftpix tile average', () => {
    const cam = read('src/utils/responsiveCamera.js');
    expect(cam).toContain("GRASS_BG = '#6EA843'");
    expect(cam).toContain('clipToDesign: true');
    const html = read('index.html');
    expect(html).toContain('#6EA843');
    expect(html).not.toContain('#5A9A38');
    const main = read('src/main.js');
    expect(main).toContain("backgroundColor: '#6EA843'");
  });
});

describe('menu scenes use shared garden décor', () => {
  const scenes = [
    ['src/scenes/MainMenuScene.js', 'menu'],
    ['src/scenes/WorldMapScene.js', 'map'],
    ['src/scenes/UpgradeScene.js', 'upgrades'],
    ['src/scenes/VictoryScene.js', 'result'],
    ['src/scenes/GameOverScene.js', 'result'],
    ['src/scenes/LeaderboardScene.js', 'result'],
  ];

  it.each(scenes)('%s calls decorateGardenBackdrop', (rel) => {
    const src = read(rel);
    expect(src).toContain("from '../utils/gardenBackdrop.js'");
    expect(src).toContain('decorateGardenBackdrop');
  });
});

describe('world map header spacing', () => {
  it('derives Zone 1 from header bottom instead of a large fixed offset', () => {
    const src = read('src/scenes/WorldMapScene.js');
    expect(src).toContain('headerBottom + 16');
    expect(src).not.toMatch(/getSafeTop\(\)\s*\+\s*168/);
    expect(src).toContain('_headerBottom');
  });
});
