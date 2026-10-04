import { describe, it, expect } from 'vitest';
import { pickOwlTarget } from '../src/battle/TowerCombat.js';

describe('Owl flyer-first targeting', () => {
  const gate = { x: 500, y: 100 };

  it('prefers Parrot (flyer) over Snake with higher waypointIndex', () => {
    const parrot = { type: 'PARROT', flies: true, waypointIndex: 1, x: 200, y: 120, alive: true };
    const snake = { type: 'SNAKE', flies: false, waypointIndex: 8, x: 450, y: 100, alive: true };
    const target = pickOwlTarget([snake, parrot], gate);
    expect(target).toBe(parrot);
  });

  it('among flyers, picks closest to gate', () => {
    const far = { type: 'PARROT', flies: true, x: 100, y: 100, alive: true };
    const near = { type: 'PARROT', flies: true, x: 480, y: 100, alive: true };
    expect(pickOwlTarget([far, near], gate)).toBe(near);
  });

  it('falls back to highest path progress when no flyers in range', () => {
    const early = { type: 'SNAKE', flies: false, waypointIndex: 2, x: 100, y: 100, alive: true };
    const late = { type: 'SNAKE', flies: false, waypointIndex: 7, x: 400, y: 100, alive: true };
    expect(pickOwlTarget([early, late], gate)).toBe(late);
  });
});
