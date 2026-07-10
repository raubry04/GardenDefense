/**
 * Shared mobile text-readability tokens + kid-friendly font helpers.
 * Kenney Future/Pixel glyphs are sparse — translucent panels let grass/props
 * bleed through letter holes. Prefer near-opaque dark panels + light text.
 *
 * Typography: only Kenney Pixel + Kenney Future ship in-repo. Prefer Pixel for
 * titles/buttons (chunkier, softer) and Future for compact HUD digits. Soften
 * with cream colors, shadows, and title-case where ALL-CAPS feels harsh.
 */

/** Dark green HUD panel fill (matches BattleHud wave/sun panels). */
export const HUD_PANEL_FILL = 0x1a2e14;

/** Near-opaque alpha for panels that sit over the live game world. */
export const HUD_PANEL_ALPHA = 0.96;

/** Minimum acceptable panel alpha over busy scenery (tests / audits). */
export const MIN_WORLD_TEXT_PANEL_ALPHA = 0.9;

/**
 * CSS background for Phaser Text objects (ability labels, toasts, tooltips).
 * ~95% opaque dark green — intentional pill, not a translucent smear.
 */
export const TEXT_PILL_BG = '#1a2e14f2';

/** Cream / yellow text on dark panels. */
export const TEXT_ON_DARK = '#FFF9E6';
export const TEXT_GOLD = '#FFD700';

/** Warm brown for text on cream/orange buttons. */
export const TEXT_ON_LIGHT = '#4A2C0A';

/** Soft garden green for labels on cream panels. */
export const TEXT_GARDEN = '#3D5A1F';

/** Default padding inside text pills. */
export const TEXT_PILL_PAD = { x: 8, y: 5 };

/** Primary display font — chunkier Pixel reads warmer than angular Future. */
export const FONT_DISPLAY = 'Kenney Pixel';

/** Compact UI / HUD digits — Future stays legible at small sizes. */
export const FONT_HUD = 'Kenney Future';

/** Soft drop shadow for titles and menu labels. */
export const TEXT_SOFT_SHADOW = Object.freeze({
  offsetX: 1,
  offsetY: 2,
  color: '#2A4010',
  blur: 0,
  fill: true,
});

/**
 * Shared style for kid-friendly menu titles.
 * @param {string} [fontSize='36px']
 * @param {string} [color=TEXT_GARDEN]
 */
export function titleTextStyle(fontSize = '36px', color = TEXT_GARDEN) {
  return {
    fontFamily: FONT_DISPLAY,
    fontSize,
    color,
    shadow: { ...TEXT_SOFT_SHADOW },
  };
}

/**
 * Shared style for cream-panel body labels.
 * @param {string} [fontSize='22px']
 * @param {string} [color=TEXT_ON_LIGHT]
 */
export function bodyTextStyle(fontSize = '22px', color = TEXT_ON_LIGHT) {
  return {
    fontFamily: FONT_DISPLAY,
    fontSize,
    color,
  };
}

/**
 * Shared style for orange menu buttons.
 * @param {string} [fontSize='26px']
 */
export function buttonTextStyle(fontSize = '26px') {
  return {
    fontFamily: FONT_DISPLAY,
    fontSize,
    color: TEXT_ON_LIGHT,
    shadow: { offsetX: 1, offsetY: 1, color: '#C47F00', blur: 0, fill: true },
  };
}
