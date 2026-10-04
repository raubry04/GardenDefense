/**
 * Shared mobile text-readability tokens + kid-friendly font helpers.
 *
 * Battle HUD: cream stroke on Kenney Future (no backing boxes on the board).
 * Menu / World Map / grass labels: Kenney Future + optional tight cream chip —
 * Kenney Pixel at fractional camera zoom reads muddy on phones.
 *
 * Typography: Kenney Pixel (large titles only) + Kenney Future (HUD / body).
 */

/** Cream outline behind glyphs so text stays readable on grass. */
export const TEXT_STROKE = '#FFF9E6';

/** Stroke thickness for HUD / floating labels. */
export const TEXT_STROKE_THICK = 4;

/** Soft stroke for smaller captions. */
export const TEXT_STROKE_THIN = 3;

/** Warm brown for primary HUD labels. */
export const TEXT_ON_LIGHT = '#4A2C0A';

/** Soft garden green for titles / wave labels. */
export const TEXT_GARDEN = '#3D5A1F';

/** Amber accent (sunshine digits, stars). */
export const TEXT_GOLD = '#C47F00';

/**
 * Cream fill kept for rare interactive cards (inspect/sell), not HUD labels.
 * @deprecated Prefer stroke styles for overlaid text.
 */
export const TEXT_ON_DARK = '#FFF9E6';

/** @deprecated Panels removed from HUD — kept for test/compat imports. */
export const HUD_PANEL_FILL = 0xFFF9E6;
/** @deprecated */
export const HUD_PANEL_ALPHA = 0.94;
/** @deprecated */
export const HUD_PANEL_STROKE = 0x4A2C0A;
/** @deprecated Do not use backgroundColor pills on battle HUD. */
export const TEXT_PILL_BG = '#FFF9E6f0';
/** @deprecated */
export const TEXT_PILL_PAD = { x: 6, y: 3 };
/** @deprecated */
export const MIN_WORLD_TEXT_PANEL_ALPHA = 0.9;

/** Tight cream plate behind menu/map header text (not a huge panel). */
export const TEXT_CHIP_FILL = 0xFFF9E6;
export const TEXT_CHIP_ALPHA = 0.92;
export const TEXT_CHIP_STROKE = 0x4A2C0A;

export const FONT_DISPLAY = 'Kenney Pixel';
export const FONT_HUD = 'Kenney Future';

/** 1px hard shadow only — multi-px / blur smears Pixel & Future under zoom. */
export const TEXT_SOFT_SHADOW = Object.freeze({
  offsetX: 1,
  offsetY: 1,
  color: '#2A4010',
  blur: 0,
  fill: true,
});

function uiTextResolution() {
  if (typeof window === 'undefined') return 1;
  const dpr = window.devicePixelRatio || 1;
  return Math.min(2, Math.max(1, dpr));
}

/** Kid-readable HUD label: dark fill + cream outline (no backing box). */
export function readableHudStyle(fontSize = '22px', color = TEXT_ON_LIGHT) {
  return {
    fontFamily: FONT_HUD,
    fontSize,
    color,
    stroke: TEXT_STROKE,
    strokeThickness: TEXT_STROKE_THICK,
    resolution: uiTextResolution(),
  };
}

/** Smaller caption style (Pause, Speed, Next:, modifiers). */
export function readableCaptionStyle(fontSize = '13px', color = TEXT_GARDEN) {
  return {
    fontFamily: FONT_HUD,
    fontSize,
    color,
    stroke: TEXT_STROKE,
    strokeThickness: TEXT_STROKE_THIN,
    resolution: uiTextResolution(),
  };
}

export function titleTextStyle(fontSize = '36px', color = TEXT_GARDEN) {
  return {
    fontFamily: FONT_DISPLAY,
    fontSize,
    color,
    shadow: { ...TEXT_SOFT_SHADOW },
    resolution: uiTextResolution(),
  };
}

/** Body / map header labels — Future stays clearer than Pixel at fractional zoom. */
export function bodyTextStyle(fontSize = '22px', color = TEXT_ON_LIGHT) {
  return {
    fontFamily: FONT_HUD,
    fontSize,
    color,
    resolution: uiTextResolution(),
  };
}

/** Alias for menus / World Map / Sticker Book grass labels. */
export function crispUiStyle(fontSize = '22px', color = TEXT_ON_LIGHT) {
  return bodyTextStyle(fontSize, color);
}

export function buttonTextStyle(fontSize = '26px') {
  return {
    fontFamily: FONT_DISPLAY,
    fontSize,
    color: TEXT_ON_LIGHT,
    shadow: { offsetX: 1, offsetY: 1, color: '#C47F00', blur: 0, fill: true },
    resolution: uiTextResolution(),
  };
}

/** Round text (or any GO) to integer design coords — avoids subpixel smear. */
export function snapText(obj) {
  if (!obj || typeof obj.setPosition !== 'function') return obj;
  obj.setPosition(Math.round(obj.x), Math.round(obj.y));
  return obj;
}

/**
 * Tight cream chip behind one or more text objects on busy grass.
 * Call after text content/truncation is final. No thick glyph stroke.
 *
 * @param {Phaser.Scene} scene
 * @param {Phaser.GameObjects.Text|Phaser.GameObjects.Text[]} texts
 * @param {{ padX?: number, padY?: number, depth?: number, alpha?: number }} [opts]
 * @returns {Phaser.GameObjects.Rectangle|null}
 */
export function addCreamTextChip(scene, texts, opts = {}) {
  const list = (Array.isArray(texts) ? texts : [texts]).filter(Boolean);
  if (!list.length || !scene?.add?.rectangle) return null;

  const padX = opts.padX ?? 10;
  const padY = opts.padY ?? 6;
  const alpha = opts.alpha ?? TEXT_CHIP_ALPHA;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const t of list) {
    const b = t.getBounds?.() ?? { x: t.x, y: t.y, right: t.x, bottom: t.y };
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.right ?? b.x);
    maxY = Math.max(maxY, b.bottom ?? b.y);
  }

  const w = Math.max(8, Math.ceil(maxX - minX + padX * 2));
  const h = Math.max(8, Math.ceil(maxY - minY + padY * 2));
  const cx = Math.round(minX - padX + w / 2);
  const cy = Math.round(minY - padY + h / 2);
  const depths = list.map((t) => t.depth ?? 0);
  const chipDepth = opts.depth ?? Math.min(...depths) - 1;

  return scene.add.rectangle(cx, cy, w, h, TEXT_CHIP_FILL, alpha)
    .setStrokeStyle(1, TEXT_CHIP_STROKE, 0.28)
    .setDepth(chipDepth);
}
