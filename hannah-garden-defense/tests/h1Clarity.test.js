import { describe, it, expect } from 'vitest';
import { GameConfig } from '../src/config.js';
import { ENEMY_GUIDE, TOWER_GUIDE } from '../src/data/tutorialContent.js';
import { HINT_POOL } from '../src/systems/TutorialManager.js';
import { THREAT_BADGE, threatBadgeForTag } from '../src/ui/WavePreview.js';
import {
  EXTRA_MODES_MIN_UNLOCKED_ZONE,
  isExtraModesUnlocked,
  extraModesLockMessage,
} from '../src/utils/modesUnlock.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

describe('H1 clarity — flyer counter teaching', () => {
  it('HINT_POOL never teaches Chicken as a Parrot/flyer counter', () => {
    const parrotHints = HINT_POOL.filter((h) => /parrot|fly/i.test(h));
    expect(parrotHints.length).toBeGreaterThan(0);
    for (const hint of parrotHints) {
      // Chickens-cannot-hit is fine; Chicken-as-counter is not.
      if (/cannot hit|can'?t hit/i.test(hint)) continue;
      expect(hint).not.toMatch(/bring Owls or Chickens/i);
      expect(hint).toMatch(/Owl/i);
    }
  });

  it('Parrot guide and Owl guide align with TowerCombat (Owl hits flyers)', () => {
    const parrot = ENEMY_GUIDE.find((e) => e.title === 'Parrot');
    const owl = TOWER_GUIDE.find((t) => t.title === 'Owl Sniper');
    const chicken = TOWER_GUIDE.find((t) => t.title === 'Chicken Cannon');
    expect(parrot?.text).toMatch(/Owl/i);
    expect(parrot?.text).toMatch(/only Owls can shoot/i);
    expect(owl?.text).toMatch(/flyer|Parrot/i);
    expect(chicken?.text).toMatch(/Cannot hit flying Parrots/i);
  });
});

describe('H1 clarity — enemy encyclopedia & threat tags', () => {
  const requiredGuideEnemies = ['Rhino', 'Hippo', 'Crocodile', 'Zebra'];

  it('ENEMY_GUIDE includes Rhino, Hippo, Crocodile, and Zebra', () => {
    const titles = new Set(ENEMY_GUIDE.map((e) => e.title));
    for (const name of requiredGuideEnemies) {
      expect(titles.has(name), `missing ENEMY_GUIDE entry: ${name}`).toBe(true);
    }
  });

  it('tags Bear, Monkey, and Cow for wave-preview badges', () => {
    expect(GameConfig.enemyThreatTags.BEAR).toBe('towerHunter');
    expect(GameConfig.enemyThreatTags.MONKEY).toBe('steal');
    expect(GameConfig.enemyThreatTags.COW).toBe('tank');
  });

  it('maps every enemyThreatTags value to a WavePreview badge', () => {
    const tags = new Set(Object.values(GameConfig.enemyThreatTags || {}));
    for (const tag of tags) {
      expect(threatBadgeForTag(tag), `missing badge for tag "${tag}"`).toBeTruthy();
      expect(THREAT_BADGE[tag]).toBeTruthy();
    }
  });
});

describe('H1 clarity — Endless/Daily unlock after Zone 2', () => {
  it('uses unlockedZone >= 2 (Zone 2 clear)', () => {
    expect(GameConfig.extraModesMinUnlockedZone).toBe(2);
    expect(EXTRA_MODES_MIN_UNLOCKED_ZONE).toBe(2);
    expect(isExtraModesUnlocked(0)).toBe(false);
    expect(isExtraModesUnlocked(1)).toBe(false);
    expect(isExtraModesUnlocked(2)).toBe(true);
    expect(isExtraModesUnlocked(4)).toBe(true);
  });

  it('lock message names Zone 2 for kids', () => {
    expect(extraModesLockMessage()).toMatch(/Zone 2/i);
    expect(extraModesLockMessage()).toMatch(/Vegetable Garden/);
  });

  it('WorldMapScene wires unlock helper and locked tap toast', () => {
    const src = read('src/scenes/WorldMapScene.js');
    expect(src).toContain('isExtraModesUnlocked');
    expect(src).toContain('extraModesLockMessage');
    expect(src).toContain('showToast');
    expect(src).not.toMatch(/unlockedZone\s*>=\s*ZONES\.length\s*-\s*1/);
  });
});

describe('H1 clarity — win-screen deposit & map level label', () => {
  it('VictoryScene deposit copy separates stars rating from sunshine bank', () => {
    const src = read('src/scenes/VictoryScene.js');
    expect(src).toContain('Sunshine banked for upgrades!');
    expect(src).toMatch(/Stars = rating/);
    expect(src).toContain('ui_sunshine');
  });

  it('world map shows Hannah Level only (no Garden Level clutter)', () => {
    const src = read('src/scenes/WorldMapScene.js');
    expect(src).toContain('Hannah Lv.');
    expect(src).not.toMatch(/Garden \$\{progress\.gardenLevel\}/);
  });
});
