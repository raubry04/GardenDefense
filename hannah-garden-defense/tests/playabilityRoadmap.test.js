import { describe, it, expect } from 'vitest';
import { GameConfig } from '../src/config.js';
import { getEnemyMotion, TOWER_IDLE_TYPES } from '../src/battle/battleVfxConfig.js';
import { upgradeNudge, defeatHint } from '../src/utils/progressMoments.js';
import { TEACH_COPY, firstSeenEnemyTeach, markTeachSeen, resetTeachSeen } from '../src/utils/enemyTeach.js';
import { snapPlacementTile } from '../src/battle/TowerPlacement.js';

describe('playability roadmap', () => {
  it('gives Parrot, Snake, and Horse distinct motion profiles', () => {
    expect(getEnemyMotion('PARROT').flap).toBeGreaterThan(0);
    expect(getEnemyMotion('PARROT').bob).toBeGreaterThan(getEnemyMotion('SNAKE').bob);
    expect(getEnemyMotion('HORSE').speed).toBeGreaterThan(getEnemyMotion('default').speed);
    expect(TOWER_IDLE_TYPES.has('CHICKEN')).toBe(true);
    expect(TOWER_IDLE_TYPES.has('OWL')).toBe(true);
    expect(TOWER_IDLE_TYPES.has('RABBIT')).toBe(true);
  });

  it('nudges Owl after flyer leaks and Rain after bear hits', () => {
    expect(upgradeNudge({ flyerLeaks: 1, zone: 1 })).toMatch(/Owl/i);
    expect(upgradeNudge({ bearHits: 2, zone: 3 })).toMatch(/Garden Rain/i);
    expect(defeatHint({ flyerLeaks: 1, zone: 1 }, ['generic'])).toMatch(/Owl/i);
    expect(defeatHint({ zone: 0 }, ['Save sunshine'])).toBe('Save sunshine');
  });

  it('teaches Parrot once', () => {
    resetTeachSeen();
    expect(firstSeenEnemyTeach('PARROT')?.spotlight).toBe('OWL');
    expect(firstSeenEnemyTeach('SNAKE')).toBeNull();
    expect(markTeachSeen('PARROT')).toBe(true);
    expect(markTeachSeen('PARROT')).toBe(false);
    expect(TEACH_COPY.PIG_WALL).toMatch(/dirt path/i);
    expect(GameConfig.zoneMoodAlpha?.length).toBeGreaterThan(4);
    expect(GameConfig.zoneGateTints?.length).toBeGreaterThan(4);
    resetTeachSeen();
  });

  it('snaps a missed drop onto the nearest legal tile', () => {
    const grass = new Set(['1,1', '2,1']);
    const isValid = (row, col) => grass.has(`${col},${row}`);
    expect(snapPlacementTile(1, 1, isValid)).toEqual({ col: 1, row: 1 });
    expect(snapPlacementTile(1, 2, isValid)).toEqual({ col: 1, row: 1 });
    expect(snapPlacementTile(8, 8, isValid)).toEqual({ col: 8, row: 8 });
  });
});