import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  VICTORY_FX_DEPTH,
  VICTORY_UI_DEPTH,
  CONFETTI_TINTS,
  CONFETTI_SIZE,
  planConfettiPiece,
  spawnConfettiPiece,
  burstVictoryConfetti,
  startVictoryConfetti,
} from '../src/utils/victoryConfetti.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

function makeScene({ active = true, hasIconStar = false } = {}) {
  const objs = [];
  const chain = (obj) => {
    obj.setDisplaySize = () => obj;
    obj.setTint = () => obj;
    obj.setAlpha = () => obj;
    obj.setAngle = (a) => { obj.angle = a; return obj; };
    obj.setDepth = (d) => { obj.depth = d; return obj; };
    obj.setScrollFactor = vi.fn(() => obj);
    obj.destroy = () => { obj.destroyed = true; };
    return obj;
  };
  return {
    _objs: objs,
    textures: { exists: (k) => hasIconStar && k === 'icon_star' },
    sys: { isActive: () => active },
    add: {
      rectangle: (x, y, w, h, tint) => {
        const o = chain({ type: 'rect', x, y, w, h, tint, angle: 0, depth: 0 });
        objs.push(o);
        return o;
      },
      circle: (x, y, r, tint) => {
        const o = chain({ type: 'circle', x, y, r, tint, angle: 0, depth: 0 });
        objs.push(o);
        return o;
      },
      image: (x, y, key) => {
        const o = chain({ type: 'image', x, y, key, angle: 0, depth: 0 });
        objs.push(o);
        return o;
      },
    },
    tweens: { add: vi.fn() },
    time: { delayedCall: vi.fn() },
  };
}

/** Deterministic RNG that walks a sequence (then repeats last). */
function seqRng(values) {
  let i = 0;
  return {
    random: () => {
      const v = values[Math.min(i, values.length - 1)];
      i += 1;
      return v;
    },
  };
}

describe('victoryConfetti', () => {
  it('keeps FX depth above décor and below UI buttons', () => {
    expect(VICTORY_FX_DEPTH).toBeGreaterThanOrEqual(50);
    expect(VICTORY_FX_DEPTH).toBeLessThan(VICTORY_UI_DEPTH);
    expect(VICTORY_UI_DEPTH).toBeGreaterThanOrEqual(100);
  });

  it('plans large bright pieces with known tints', () => {
    const plan = planConfettiPiece(1280, 720, { random: () => 0.42 });
    expect(plan.size).toBeGreaterThanOrEqual(CONFETTI_SIZE.min);
    expect(plan.size).toBeLessThanOrEqual(CONFETTI_SIZE.max);
    expect(CONFETTI_SIZE.min).toBeGreaterThanOrEqual(20);
    expect(CONFETTI_SIZE.max).toBeGreaterThanOrEqual(48);
    expect(CONFETTI_TINTS).toContain(plan.tint);
    expect(plan.depth).toBe(VICTORY_FX_DEPTH);
    expect(['rect', 'circle', 'star']).toContain(plan.shape);
    expect(plan.startY).toBeLessThanOrEqual(12);
    expect(plan.endY).toBeGreaterThan(720);
  });

  it('plans burst pieces across the upper two-thirds of the screen', () => {
    const plan = planConfettiPiece(1280, 720, { random: () => 0.42 }, { mode: 'burst' });
    expect(plan.startY).toBeGreaterThanOrEqual(4);
    expect(plan.startY).toBeLessThanOrEqual(Math.floor(720 * (2 / 3)));
    expect(plan.mode).toBe('burst');
  });

  it('spawns x uniformly across the full design width (no left bias)', () => {
    const xs = [];
    for (let i = 0; i < 40; i++) {
      // Call order: size, shape, startY, x, drift, tint, duration, spin
      const rng = seqRng([
        0.5, // size mid
        0.1, // rect
        0.5, // startY
        i / 39, // x across 0..1
        0.5, // drift
        0.5, // tint
        0.5, // duration
        0.5, // spin
      ]);
      xs.push(planConfettiPiece(1280, 720, rng, { mode: 'rain' }).x);
    }
    expect(Math.min(...xs)).toBeLessThan(80);
    expect(Math.max(...xs)).toBeGreaterThan(1200);
    const mid = xs.filter((x) => x > 400 && x < 880).length;
    const right = xs.filter((x) => x >= 880).length;
    expect(mid).toBeGreaterThan(5);
    expect(right).toBeGreaterThan(5);
  });

  it('spawns solid geometry at FX depth without locking scrollFactor 0', () => {
    const scene = makeScene();
    const piece = spawnConfettiPiece(scene, 1280, 720, {
      plan: {
        x: 100, startY: -50, endY: 800, driftX: 20,
        tint: 0xFFD700, size: 36, shape: 'rect', depth: VICTORY_FX_DEPTH,
        duration: 3000, spin: 360,
      },
    });
    expect(piece).toBeTruthy();
    expect(piece.type).toBe('rect');
    expect(piece.depth).toBe(VICTORY_FX_DEPTH);
    expect(piece.tint).toBe(0xFFD700);
    expect(piece.setScrollFactor).not.toHaveBeenCalled();
    expect(scene.tweens.add).toHaveBeenCalledOnce();
  });

  it('skips spawn when scene is inactive', () => {
    const scene = makeScene({ active: false });
    expect(spawnConfettiPiece(scene, 1280, 720)).toBeNull();
    expect(scene._objs).toHaveLength(0);
  });

  it('fires an immediate opening burst', () => {
    const scene = makeScene();
    burstVictoryConfetti(scene, 1280, 720, 10);
    expect(scene._objs.length).toBe(10);
    for (const o of scene._objs) {
      expect(o.depth).toBe(VICTORY_FX_DEPTH);
    }
  });

  it('starts a dense batch of looping confetti pieces', () => {
    const scene = makeScene();
    startVictoryConfetti(scene, 1280, 720, 12);
    expect(scene._objs.length).toBe(12);
    for (const o of scene._objs) {
      expect(o.depth).toBe(VICTORY_FX_DEPTH);
      expect(['rect', 'circle', 'image']).toContain(o.type);
      if (o.type === 'image') expect(o.key).toBe('icon_star');
      expect(o.setScrollFactor).not.toHaveBeenCalled();
    }
  });

  it('VictoryScene wires helper and keeps buttons above FX', () => {
    const src = read('src/scenes/VictoryScene.js');
    expect(src).toContain('burstVictoryConfetti');
    expect(src).toContain('startVictoryConfetti');
    expect(src).toContain('createFloatingSparkles');
    expect(src).toContain('burstStarSparkles');
    expect(src).not.toMatch(/particle_star|particle_sparkle|particle_magic/);
    expect(src).toContain('VICTORY_UI_DEPTH');
    expect(src).toMatch(/startVictoryConfetti\(\s*this,\s*width,\s*height,\s*72\s*\)/);
  });
});
