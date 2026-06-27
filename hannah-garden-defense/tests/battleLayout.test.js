import { describe, it, expect, beforeAll } from 'vitest';
import { computeDesignUIMetrics } from '../src/utils/battleLayout.js';

describe('computeDesignUIMetrics', () => {
  beforeAll(() => {
    globalThis.document = {
      documentElement: {},
    };
    globalThis.getComputedStyle = () => ({
      getPropertyValue: () => '',
    });
    globalThis.window = {
      innerWidth: 1280,
      innerHeight: 720,
      matchMedia: () => ({ matches: false }),
    };
  });

  it('returns hudRow1Y and hudRow2Y for phone portrait (390x844)', () => {
    const m = computeDesignUIMetrics(390, 844);
    expect(typeof m.hudRow1Y).toBe('number');
    expect(typeof m.hudRow2Y).toBe('number');
    expect(m.hudRow1Y).toBeGreaterThan(0);
    expect(m.hudRow2Y).toBeGreaterThan(m.hudRow1Y);
  });

  it('returns hudRow1Y and hudRow2Y for desktop (1280x720)', () => {
    const m = computeDesignUIMetrics(1280, 720);
    expect(typeof m.hudRow1Y).toBe('number');
    expect(typeof m.hudRow2Y).toBe('number');
    expect(m.hudRow1Y).toBeGreaterThan(0);
    expect(m.hudRow2Y).toBeGreaterThan(m.hudRow1Y);
  });
});
