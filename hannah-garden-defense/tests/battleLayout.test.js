import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { computeDesignUIMetrics, DESIGN } from '../src/utils/battleLayout.js';

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

describe('bottom safe-area inset is applied exactly once', () => {
  const realGetComputedStyle = globalThis.getComputedStyle;

  afterEach(() => {
    globalThis.getComputedStyle = realGetComputedStyle;
  });

  function mockSafeBottom(px) {
    globalThis.getComputedStyle = () => ({
      getPropertyValue: (prop) => (prop === '--sab' ? `${px}px` : ''),
    });
  }

  // With a home-indicator inset of N screen px, the design-space bottom inset
  // (converted back to screen px) must reserve the safe area plus at most one
  // ~16px touch margin — never a doubled/tripled inset. This locks the
  // single-owner invariant for notched iPhones (see index.html / mobileViewport).
  it('reserves at most safe.bottom + one touch margin (phone portrait)', () => {
    const N = 34; // iPhone home-indicator inset in CSS px
    mockSafeBottom(N);

    const sw = 390;
    const sh = 844;
    const m = computeDesignUIMetrics(sw, sh);
    const zoom = Math.min(sw / DESIGN.width, sh / DESIGN.height);
    const screenInset = m.designBottomInset * zoom;

    expect(screenInset).toBeGreaterThan(0);
    // Applied once: never doubled.
    expect(screenInset).toBeLessThan(2 * N);
    // At most the inset + a single touch margin (16px), with 1px rounding slack.
    expect(screenInset).toBeLessThanOrEqual(N + 16 + 1);
  });

  it('scales with the inset without doubling it (larger inset)', () => {
    const N = 44;
    mockSafeBottom(N);

    const sw = 430;
    const sh = 932;
    const m = computeDesignUIMetrics(sw, sh);
    const zoom = Math.min(sw / DESIGN.width, sh / DESIGN.height);
    const screenInset = m.designBottomInset * zoom;

    expect(screenInset).toBeLessThan(2 * N);
    expect(screenInset).toBeLessThanOrEqual(N + 16 + 1);
  });
});
