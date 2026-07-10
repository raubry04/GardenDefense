import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { computeDesignUIMetrics, computeVisibleDesignBounds, DESIGN } from '../src/utils/battleLayout.js';

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

  it('insets portrait ability circles so left name pills clear the board edge', () => {
    const m = computeDesignUIMetrics(390, 844);
    // Circles sit left of the old width-58 default so BOMB/SHIELD pills fit.
    expect(m.abilityX).toBeLessThan(DESIGN.width - 58);
    // Still on-screen with room for a ~72px-radius hit + label.
    expect(m.abilityX).toBeGreaterThan(DESIGN.width - 220);
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

describe('tray clears the board/path and sits at the screen bottom (portrait)', () => {
  const realGetComputedStyle = globalThis.getComputedStyle;

  afterEach(() => {
    globalThis.getComputedStyle = realGetComputedStyle;
  });

  function mockSafeBottom(px) {
    globalThis.getComputedStyle = () => ({
      getPropertyValue: (prop) => (prop === '--sab' ? `${px}px` : ''),
    });
  }

  // On a tall portrait phone the 1280×720 board only fills a thin band in the
  // vertical centre. The tray must be anchored to the visible viewport bottom so
  // it sits below the board (world y ≥ 720) instead of floating over the path.
  it('anchors the whole tray below the design board on a tall portrait phone', () => {
    mockSafeBottom(34);
    const sw = 390;
    const sh = 844;

    const m = computeDesignUIMetrics(sw, sh);
    const { bottom } = computeVisibleDesignBounds(sw, sh);

    // Entire tray sits below the board bottom (clears the enemy path region).
    expect(m.trayTop).toBeGreaterThanOrEqual(DESIGN.height);
    // Tray stays inside the visible viewport, reserving the safe inset above the edge.
    expect(m.trayBottom).toBeLessThan(bottom);
  });

  it('leaves only the safe inset between the tray bottom and the viewport edge (portrait)', () => {
    const N = 34;
    mockSafeBottom(N);
    const sw = 390;
    const sh = 844;

    const m = computeDesignUIMetrics(sw, sh);
    const { bottom, zoom } = computeVisibleDesignBounds(sw, sh);

    // Screen-space gap below the tray == designBottomInset in screen px.
    const screenGap = (bottom - m.trayBottom) * zoom;
    expect(screenGap).toBeGreaterThan(0);
    expect(screenGap).toBeLessThanOrEqual(N + 16 + 1);
  });

  it('keeps the tray near the bottom (not floating over mid-board) in landscape phone', () => {
    const N = 21;
    mockSafeBottom(N);
    const sw = 896;
    const sh = 414;

    const m = computeDesignUIMetrics(sw, sh);
    const { bottom, zoom } = computeVisibleDesignBounds(sw, sh);

    expect(m.trayBottom).toBeLessThanOrEqual(bottom);
    const screenGap = (bottom - m.trayBottom) * zoom;
    expect(screenGap).toBeGreaterThan(0);
    expect(screenGap).toBeLessThanOrEqual(N + 16 + 1);
  });
});

describe('tower card sizing (design space vs screen space)', () => {
  const CARD_BASE = 84; // TowerTray CARD_W / CARD_H

  beforeAll(() => {
    globalThis.document = { documentElement: {} };
    globalThis.getComputedStyle = () => ({ getPropertyValue: () => '' });
    globalThis.window = {
      innerWidth: 1280,
      innerHeight: 720,
      matchMedia: () => ({ matches: false }),
    };
  });

  it('renders readable, non-overlapping cards on a portrait phone', () => {
    const sw = 390;
    const sh = 844;
    const m = computeDesignUIMetrics(sw, sh);
    const { scale, step, height } = {
      scale: m.ui.cardScale,
      step: m.ui.cardStep,
      height: m.ui.trayHeight,
    };

    // On-screen dimensions (design px × contain-fit zoom).
    const cardScreen = CARD_BASE * scale * m.zoom;
    const stepScreen = step * m.zoom;

    // Cards are a tappable size on screen (was ~20px & overlapping before the fix).
    expect(cardScreen).toBeGreaterThanOrEqual(36);
    expect(cardScreen).toBeLessThanOrEqual(58);
    // Step leaves a gap (no overlap): each slot is wider than a card.
    expect(stepScreen).toBeGreaterThan(cardScreen);
    // The tray background is tall enough to wrap the (taller) cards.
    expect(height).toBeGreaterThanOrEqual(CARD_BASE * scale);
  });

  it('spans most of the screen width with 7 cards in portrait', () => {
    const sw = 390;
    const sh = 844;
    const m = computeDesignUIMetrics(sw, sh);
    const cardCount = 7;
    // Total card row width on screen should fill a healthy fraction of the width.
    const totalWidthDesign = cardCount * m.ui.cardStep - (m.ui.cardStep - CARD_BASE * m.ui.cardScale);
    const totalScreen = totalWidthDesign * m.zoom;
    expect(totalScreen).toBeGreaterThan(sw * 0.7);
    expect(totalScreen).toBeLessThanOrEqual(sw);
  });

  it('uses larger, non-overlapping cards on a landscape phone', () => {
    const cardCount = 7;
    const m = computeDesignUIMetrics(896, 414);
    const { cardScale: scale, cardStep: step } = m.ui;

    // Bigger than the old locked 0.85 for kid readability.
    expect(scale).toBeGreaterThan(0.85);
    // No overlap: each slot is wider than a card.
    expect(step).toBeGreaterThan(CARD_BASE * scale);
    // On-screen card is a tappable size.
    const cardScreen = CARD_BASE * scale * m.zoom;
    expect(cardScreen).toBeGreaterThanOrEqual(44);
    // Tray wraps the taller cards.
    expect(m.ui.trayHeight).toBeGreaterThanOrEqual(CARD_BASE * scale);
    // All 7 cards still fit within the tray-bg max width (design 1240).
    const totalWidthDesign = cardCount * step - (step - CARD_BASE * scale);
    expect(totalWidthDesign).toBeLessThanOrEqual(1240);
  });

  it('never overlaps landscape cards on a small phone', () => {
    // Small landscape phone (e.g. iPhone SE): scale must stay <= step so cards
    // never overlap even where the per-card slot is tight.
    const m = computeDesignUIMetrics(667, 375);
    expect(m.ui.cardStep).toBeGreaterThanOrEqual(CARD_BASE * m.ui.cardScale - 0.001);
  });

  it('uses larger cards on desktop/tablet landscape', () => {
    const m = computeDesignUIMetrics(1280, 720);
    // Desktop cards were locked at scale 1; bumped for readability.
    expect(m.ui.cardScale).toBeGreaterThan(1);
    const cardCount = 7;
    const total = cardCount * m.ui.cardStep - (m.ui.cardStep - CARD_BASE * m.ui.cardScale);
    expect(total).toBeLessThanOrEqual(1240);
  });
});
