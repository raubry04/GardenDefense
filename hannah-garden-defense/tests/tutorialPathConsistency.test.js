import { describe, it, expect, vi } from 'vitest';
import { TutorialManager } from '../src/systems/TutorialManager.js';
import {
  getFirstBattleSteps,
  getQuickStartSteps,
} from '../src/data/tutorialContent.js';
import { resolveBattleModifiers, battleModifierLabel } from '../src/utils/battleModifiers.js';
import { buildCanvasMapData } from '../src/utils/pathTile2D.js';
import { GameConfig } from '../src/config.js';
import { formatTowerStats } from '../src/battle/towerStats.js';

function mockScene() {
  const handlers = {};
  return {
    add: {
      rectangle: () => ({ setDepth: vi.fn().mockReturnThis(), setStrokeStyle: vi.fn().mockReturnThis(), setInteractive: vi.fn().mockReturnThis(), setOrigin: vi.fn().mockReturnThis(), on: vi.fn(), destroy: vi.fn(), active: true }),
      text: () => ({ setOrigin: vi.fn().mockReturnThis(), setDepth: vi.fn().mockReturnThis(), setInteractive: vi.fn().mockReturnThis(), on: vi.fn(), destroy: vi.fn(), active: true }),
      triangle: () => ({ setOrigin: vi.fn().mockReturnThis(), setDepth: vi.fn().mockReturnThis(), destroy: vi.fn(), active: true }),
    },
    game: {
      events: {
        on: (evt, fn) => { handlers[evt] = handlers[evt] || []; handlers[evt].push(fn); },
        off: vi.fn(),
        emit: (evt, ...args) => { (handlers[evt] || []).forEach((fn) => fn(...args)); },
      },
    },
    cameras: { main: { width: 1280, height: 720 } },
    scale: { width: 1280, height: 720 },
  };
}

describe('tutorial Try-it gating', () => {
  it('advances select-tower on tower-drag-start', () => {
    const scene = mockScene();
    const tm = new TutorialManager(scene, {
      zone: 0,
      battle: 0,
      steps: getFirstBattleSteps(),
    });
    tm.active = true;
    tm.currentStep = 1; // Pick a Defender
    tm._showStep = vi.fn();
    tm._clearOverlay = vi.fn();
    tm._bindActionListeners();
    expect(tm.steps[1].requireAction).toBe('select-tower');
    scene.game.events.emit('tower-drag-start', 'RABBIT');
    expect(tm.currentStep).toBe(2);
  });

  it('place-tower during select-tower advances through both gated steps', () => {
    const scene = mockScene();
    const tm = new TutorialManager(scene, {
      zone: 0,
      battle: 0,
      steps: getFirstBattleSteps(),
    });
    tm.active = true;
    tm.currentStep = 1;
    tm._showStep = vi.fn();
    tm._clearOverlay = vi.fn();
    tm._bindActionListeners();
    scene.game.events.emit('tower-placed', { type: 'RABBIT' });
    expect(tm.currentStep).toBe(3); // past select + place → Send Wave
  });
});

describe('quick-start How To Play', () => {
  it('is short and illustrated for kids', () => {
    const steps = getQuickStartSteps();
    expect(steps.length).toBeGreaterThanOrEqual(5);
    expect(steps.length).toBeLessThanOrEqual(8);
    expect(steps.every((s) => s.text && s.title)).toBe(true);
    expect(steps.filter((s) => s.imageKey).length).toBeGreaterThanOrEqual(4);
  });

  it('first battle steps stay compact', () => {
    const steps = getFirstBattleSteps();
    expect(steps.length).toBeLessThanOrEqual(7);
    expect(steps.some((s) => s.requireAction === 'select-tower')).toBe(true);
  });
});

describe('path layout variety', () => {
  it('uses different path layouts across battles in a zone', () => {
    const maps = [0, 1, 3, 4].map((battle) => {
      const mods = resolveBattleModifiers(0, battle);
      return buildCanvasMapData(0, 24, 14, 64, {
        centerLayout: true,
        layoutId: mods.layoutId,
        mirrorPath: mods.mirrorPath,
        reversePath: mods.reversePath,
      });
    });
    const signatures = maps.map((m) => JSON.stringify(m.waypoints));
    expect(new Set(signatures).size).toBe(signatures.length);
  });

  it('labels include path vibe when layoutId set', () => {
    const mods = resolveBattleModifiers(0, 1);
    expect(mods.layoutId).toBe('hairpin');
    const label = battleModifierLabel(mods);
    expect(label).toMatch(/Hairpin/i);
  });
});

describe('tower damage consistency', () => {
  it('Rhino has wallDamageMult matching wall-breaker badge', () => {
    expect(GameConfig.enemies.RHINO.wallDamageMult).toBeGreaterThan(1);
  });

  it('shows HP for non-pig towers in inspect stats', () => {
    const lines = formatTowerStats('RABBIT', {
      tier: 0,
      damage: 0,
      range: 150,
      maxHp: 200,
      hp: 150,
      slowPercent: 0.2,
      stunMs: 0,
      freezeMs: 0,
      thorns: 0,
    });
    expect(lines.some((l) => l.includes('HP: 150/200'))).toBe(true);
  });
});
