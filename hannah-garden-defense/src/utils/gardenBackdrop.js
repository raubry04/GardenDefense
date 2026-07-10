/**
 * Shared garden décor for non-battle menu screens.
 * Dense Craftpix prop clusters along left/right margins and bottom edge.
 * Props are culled against per-variant UI safe rects so they never cover
 * interactive controls. No flat pale/dark ground strips. No rocks.
 */
import { DESIGN } from './battleLayout.js';
import { craftpixGroundKey, CRAFTPIX_GRASS_TILES } from './craftpixTiles.js';
import { GameConfig } from '../config.js';

/** Depth behind typical menu UI (buttons/text usually ≥ 5–20). */
export const GARDEN_DECOR_DEPTH = 0;

/** Skip props smaller than this — must read on mobile. */
export const GARDEN_DECOR_MIN_PROP_SIZE = 48;

/**
 * Safe Craftpix keys for menu décor.
 * Trees/bushes for density; landmarks (well/windmill/tent/fence/flag/barrel/stump)
 * for readable variety. No rocks (grey dots on mobile).
 */
export const GARDEN_SAFE_PROP_KEYS = Object.freeze([
  'cp_treeSmall',
  'cp_treeMedium',
  'cp_treeLarge',
  'cp_bushSmall',
  'cp_bushMedium',
  'cp_bushLarge',
  'cp_treeStumpShort',
  'cp_treeStumpTall',
  'cp_well',
  'cp_windmill',
  'cp_tent',
  'cp_woodenBarrel',
  'cp_woodenCart',
  'cp_flag',
  'cp_blueBanner',
  'cp_redBanner',
  'cp_fenceHorizontal',
  'cp_campfire',
]);

const SAFE_KEY_SET = new Set(GARDEN_SAFE_PROP_KEYS);

const TILE = GameConfig.tileSize;

/** Axis-aligned rect: { x, y, w, h } with top-left origin. */
export function rectsOverlap(a, b, pad = 0) {
  return !(
    a.x + a.w + pad <= b.x
    || b.x + b.w + pad <= a.x
    || a.y + a.h + pad <= b.y
    || b.y + b.h + pad <= a.y
  );
}

/**
 * Prop bounds in design space. Placement origin is bottom-center.
 * @param {{ x: number, y: number, size: number }} prop
 */
export function getPropBounds(prop) {
  const size = prop.size;
  return {
    x: prop.x - size / 2,
    y: prop.y - size,
    w: size,
    h: size,
  };
}

/**
 * Interactive UI corridors per screen variant. Décor must not intersect these.
 * Coordinates are DESIGN-space (1280×720).
 */
export function getGardenUiSafeRects(width, height, variant = 'default') {
  const w = width;
  const h = height;
  const cx = w / 2;

  switch (variant) {
    case 'menu': {
      // Title + name panel + 4-button stack (PLAY…SETTINGS).
      const stackTop = 50;
      const stackBottom = 650;
      const stackW = 340;
      return [
        { x: cx - stackW / 2, y: stackTop, w: stackW, h: stackBottom - stackTop },
      ];
    }
    case 'map': {
      const zoneW = w * 0.75;
      const headerTop = 8;
      const headerH = 80;
      // Zone list + Endless + Daily stretch most of the column under the header.
      const listTop = headerTop + headerH;
      const listBottom = h - 20;
      const backW = 140;
      const backH = 56;
      const backX = 24;
      // Match WorldMapScene back button center: height - 44 - inset.
      const backCenterY = h - 44 - 16;
      return [
        { x: 16, y: headerTop, w: w - 32, h: headerH },
        { x: cx - zoneW / 2, y: listTop, w: zoneW, h: listBottom - listTop },
        { x: backX, y: backCenterY - backH / 2, w: backW, h: backH },
      ];
    }
    case 'upgrades': {
      const cardW = Math.min(520, w - 80);
      return [
        { x: cx - cardW / 2, y: 40, w: cardW, h: h - 120 },
        { x: cx - 200, y: h - 90, w: 400, h: 70 },
      ];
    }
    case 'result': {
      // Leaderboard / victory / game-over: title, tabs, table, BACK.
      const tableW = w * 0.88;
      return [
        { x: cx - 220, y: 8, w: 440, h: 50 },
        { x: cx - 220, y: 56, w: 440, h: 50 },
        { x: cx - tableW / 2, y: 100, w: tableW, h: h - 180 },
        { x: cx - 100, y: h - 90, w: 200, h: 70 },
      ];
    }
    default:
      return [
        { x: cx - 200, y: 80, w: 400, h: h - 160 },
      ];
  }
}

/**
 * Drop any prop whose bounds intersect a UI safe rect.
 * @param {Array<{ x: number, y: number, size: number }>} layout
 * @param {Array<{ x: number, y: number, w: number, h: number }>} uiRects
 */
export function cullPropsAgainstUi(layout, uiRects, pad = 4) {
  if (!uiRects?.length) return layout;
  return layout.filter((prop) => {
    const bounds = getPropBounds(prop);
    return !uiRects.some((rect) => rectsOverlap(bounds, rect, pad));
  });
}

/**
 * Build a dense, intentional prop layout for a screen variant.
 * Coordinates are DESIGN-space; origin is bottom-center of each prop.
 * Layouts prefer left/right columns outside the central UI width;
 * bottom bed stays below / beside interactive chrome (culling enforces).
 */
export function buildGardenDecorLayout(width, height, variant = 'default') {
  const w = width;
  const h = height;
  // Keep side columns outside the ~75% zone list / button stack.
  const L = 42;
  const R = w - 42;
  const L2 = 96;
  const R2 = w - 96;
  const bottom = h - 4;
  // Bottom props only in far corners — not under centered BACK / SETTINGS / Endless.
  const bottomL = 70;
  const bottomL2 = 130;
  const bottomR = w - 70;
  const bottomR2 = w - 130;

  const layouts = {
    // Main menu: side columns + corner bottom clusters (clear of button stack).
    menu: [
      { key: 'cp_treeLarge', x: L, y: h * 0.38, size: 128 },
      { key: 'cp_treeMedium', x: L2, y: h * 0.52, size: 100 },
      { key: 'cp_bushLarge', x: L - 4, y: h * 0.62, size: 68 },
      { key: 'cp_bushMedium', x: L2 + 6, y: h * 0.7, size: 58 },
      { key: 'cp_woodenBarrel', x: L + 12, y: h * 0.78, size: 50 },
      { key: 'cp_treeSmall', x: L, y: bottom, size: 92 },
      { key: 'cp_bushLarge', x: bottomL2, y: bottom, size: 64 },
      { key: 'cp_treeStumpShort', x: bottomL2 + 50, y: bottom, size: 50 },
      { key: 'cp_flag', x: 40, y: h * 0.18, size: 64 },

      { key: 'cp_treeLarge', x: R, y: h * 0.36, size: 132, flipX: true },
      { key: 'cp_treeMedium', x: R2, y: h * 0.5, size: 102, flipX: true },
      { key: 'cp_bushLarge', x: R + 4, y: h * 0.6, size: 68, flipX: true },
      { key: 'cp_well', x: R2 - 4, y: h * 0.72, size: 72 },
      { key: 'cp_treeSmall', x: R, y: bottom, size: 94, flipX: true },
      { key: 'cp_bushMedium', x: bottomR2, y: bottom, size: 60, flipX: true },
      { key: 'cp_woodenCart', x: bottomR, y: bottom, size: 64 },
      { key: 'cp_blueBanner', x: w - 40, y: h * 0.16, size: 62 },

      // Soft top corners only (behind settings overlay; culled if they hit title).
      { key: 'cp_bushMedium', x: 48, y: 96, size: 52, alpha: 0.9 },
      { key: 'cp_bushSmall', x: w - 48, y: 100, size: 48, alpha: 0.9, flipX: true },
      { key: 'cp_treeSmall', x: 78, y: 150, size: 66, alpha: 0.88 },
      { key: 'cp_treeSmall', x: w - 78, y: 156, size: 68, alpha: 0.88, flipX: true },
    ],

    // World map: tall side hedges; no bottom bed under BACK / Endless / Daily.
    map: [
      { key: 'cp_treeLarge', x: L, y: h * 0.2, size: 118 },
      { key: 'cp_treeMedium', x: L2 - 16, y: h * 0.34, size: 96 },
      { key: 'cp_bushLarge', x: L, y: h * 0.46, size: 68 },
      { key: 'cp_windmill', x: L - 4, y: h * 0.56, size: 88 },
      { key: 'cp_bushMedium', x: L - 2, y: h * 0.66, size: 56 },
      { key: 'cp_treeSmall', x: L + 4, y: h * 0.78, size: 82 },
      { key: 'cp_bushLarge', x: bottomL, y: bottom, size: 60 },
      { key: 'cp_redBanner', x: 36, y: h * 0.12, size: 56 },

      { key: 'cp_treeLarge', x: R, y: h * 0.22, size: 122, flipX: true },
      { key: 'cp_treeMedium', x: R2 + 16, y: h * 0.36, size: 98, flipX: true },
      { key: 'cp_bushLarge', x: R, y: h * 0.48, size: 70, flipX: true },
      { key: 'cp_tent', x: R + 4, y: h * 0.6, size: 78 },
      { key: 'cp_bushMedium', x: R + 2, y: h * 0.7, size: 58, flipX: true },
      { key: 'cp_treeSmall', x: R - 2, y: h * 0.82, size: 86, flipX: true },
      { key: 'cp_bushLarge', x: bottomR, y: bottom, size: 62, flipX: true },
      { key: 'cp_flag', x: w - 36, y: h * 0.14, size: 60 },

      // Far-corner bottom only (culling drops anything near BACK / mode bars).
      { key: 'cp_bushSmall', x: bottomL2, y: bottom, size: 48 },
      { key: 'cp_bushSmall', x: bottomR2, y: bottom, size: 48, flipX: true },
    ],

    // Upgrades: frame the card column; keep footer buttons clear.
    upgrades: [
      { key: 'cp_treeLarge', x: L, y: 150, size: 118 },
      { key: 'cp_treeMedium', x: L2, y: h * 0.32, size: 96 },
      { key: 'cp_bushLarge', x: L, y: h * 0.45, size: 66 },
      { key: 'cp_well', x: L2 - 8, y: h * 0.58, size: 70 },
      { key: 'cp_bushMedium', x: L + 4, y: h * 0.7, size: 58 },
      { key: 'cp_treeSmall', x: bottomL, y: bottom, size: 88 },
      { key: 'cp_bushLarge', x: bottomL2, y: bottom, size: 62 },
      { key: 'cp_campfire', x: bottomL2 + 48, y: bottom, size: 52 },

      { key: 'cp_treeLarge', x: R, y: 158, size: 120, flipX: true },
      { key: 'cp_treeMedium', x: R2, y: h * 0.34, size: 98, flipX: true },
      { key: 'cp_bushLarge', x: R, y: h * 0.48, size: 68, flipX: true },
      { key: 'cp_woodenCart', x: R2 + 8, y: h * 0.6, size: 70 },
      { key: 'cp_bushMedium', x: R - 2, y: h * 0.72, size: 56, flipX: true },
      { key: 'cp_treeSmall', x: bottomR, y: bottom, size: 90, flipX: true },
      { key: 'cp_bushLarge', x: bottomR2, y: bottom, size: 64, flipX: true },
      { key: 'cp_blueBanner', x: w - 40, y: 110, size: 58 },

      { key: 'cp_bushMedium', x: bottomL2 + 20, y: bottom, size: 52 },
      { key: 'cp_bushMedium', x: bottomR2 - 20, y: bottom, size: 52, flipX: true },
    ],

    // Victory / game-over / leaderboard: side frame only — no trees through the table.
    result: [
      { key: 'cp_treeLarge', x: 28, y: h * 0.28, size: 88 },
      { key: 'cp_treeMedium', x: 30, y: h * 0.48, size: 78 },
      { key: 'cp_bushLarge', x: 32, y: h * 0.62, size: 56 },
      { key: 'cp_flag', x: 34, y: h * 0.14, size: 56 },
      { key: 'cp_treeSmall', x: bottomL, y: bottom, size: 80 },
      { key: 'cp_bushLarge', x: bottomL2, y: bottom, size: 56 },
      { key: 'cp_woodenBarrel', x: bottomL2 + 44, y: bottom, size: 48 },

      { key: 'cp_treeLarge', x: w - 28, y: h * 0.3, size: 90, flipX: true },
      { key: 'cp_treeMedium', x: w - 30, y: h * 0.5, size: 80, flipX: true },
      { key: 'cp_bushLarge', x: w - 32, y: h * 0.64, size: 58, flipX: true },
      { key: 'cp_redBanner', x: w - 34, y: h * 0.14, size: 56 },
      { key: 'cp_treeSmall', x: bottomR, y: bottom, size: 82, flipX: true },
      { key: 'cp_bushLarge', x: bottomR2, y: bottom, size: 56, flipX: true },
      { key: 'cp_well', x: bottomR - 36, y: bottom, size: 64 },

      { key: 'cp_bushSmall', x: 40, y: 88, size: 48, alpha: 0.9 },
      { key: 'cp_bushSmall', x: w - 40, y: 92, size: 48, alpha: 0.9, flipX: true },
    ],

    default: [
      { key: 'cp_treeLarge', x: L, y: h * 0.4, size: 118 },
      { key: 'cp_treeMedium', x: L2, y: bottom, size: 96 },
      { key: 'cp_bushLarge', x: bottomL, y: bottom, size: 64 },
      { key: 'cp_bushMedium', x: L + 12, y: h * 0.58, size: 54 },
      { key: 'cp_treeLarge', x: R, y: h * 0.4, size: 120, flipX: true },
      { key: 'cp_treeMedium', x: R2, y: bottom, size: 98, flipX: true },
      { key: 'cp_bushLarge', x: bottomR, y: bottom, size: 66, flipX: true },
      { key: 'cp_flag', x: 40, y: h * 0.18, size: 60 },
      { key: 'cp_blueBanner', x: w - 40, y: h * 0.18, size: 60 },
      { key: 'cp_woodenBarrel', x: bottomL2, y: bottom, size: 50 },
      { key: 'cp_bushMedium', x: bottomR2, y: bottom, size: 54, flipX: true },
    ],
  };

  const raw = (layouts[variant] || layouts.default).map((p) => ({
    ...p,
    size: Math.max(GARDEN_DECOR_MIN_PROP_SIZE, p.size),
  }));

  return cullPropsAgainstUi(raw, getGardenUiSafeRects(w, h, variant));
}

/**
 * Optional textured grass row at the bottom — same Craftpix tiles as the
 * underlay, so it blends instead of reading as a pale/dark UI footer bar.
 * Returns [] when ground textures are missing.
 */
export function drawGardenGroundStrip(scene, width, height, depth = GARDEN_DECOR_DEPTH) {
  const objs = [];
  const keys = CRAFTPIX_GRASS_TILES.map((n) => craftpixGroundKey(n));
  const usable = keys.filter((k) => scene.textures?.exists?.(k));
  if (!usable.length) return objs;

  const rows = 2;
  const startY = height - rows * TILE + TILE / 2;
  for (let row = 0; row < rows; row++) {
    const y = startY + row * TILE;
    for (let x = TILE / 2; x < width + TILE; x += TILE) {
      const col = Math.round((x - TILE / 2) / TILE);
      const key = usable[((row + col) % usable.length + usable.length) % usable.length];
      objs.push(
        scene.add.image(x, y, key)
          .setDisplaySize(TILE, TILE)
          .setDepth(depth)
          .setAlpha(0.55),
      );
    }
  }
  return objs;
}

/**
 * Place intentional garden décor on a menu scene.
 * @param {Phaser.Scene} scene
 * @param {{ width?: number, height?: number, variant?: string, depth?: number, groundStrip?: boolean, uiRects?: Array }} [opts]
 * @returns {Phaser.GameObjects.GameObject[]}
 */
export function decorateGardenBackdrop(scene, opts = {}) {
  const width = opts.width ?? DESIGN.width;
  const height = opts.height ?? DESIGN.height;
  const variant = opts.variant ?? 'default';
  const depth = opts.depth ?? GARDEN_DECOR_DEPTH;
  // Default OFF — flat/pale strips looked like footer bugs. Opt-in textured tiles only.
  const groundStrip = opts.groundStrip === true;
  const objects = [];

  if (groundStrip) {
    objects.push(...drawGardenGroundStrip(scene, width, height, depth));
  }

  let layout = buildGardenDecorLayout(width, height, variant);
  // Allow scenes to pass extra / override UI rects for a second cull pass.
  if (opts.uiRects?.length) {
    layout = cullPropsAgainstUi(layout, opts.uiRects);
  }

  for (const p of layout) {
    if (!SAFE_KEY_SET.has(p.key)) continue;
    if (!scene.textures?.exists?.(p.key)) continue;

    const img = scene.add.image(p.x, p.y, p.key)
      .setDisplaySize(p.size, p.size)
      .setOrigin(0.5, 1)
      .setDepth(depth)
      .setAlpha(p.alpha ?? 0.95);
    if (p.flipX) img.setFlipX(true);
    objects.push(img);
  }

  return objects;
}
