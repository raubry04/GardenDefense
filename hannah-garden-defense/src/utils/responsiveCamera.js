import { GameConfig } from '../config.js';
import { craftpixGroundKey, CRAFTPIX_GRASS_TILES } from './craftpixTiles.js';
import { getSafeInsets } from './mobileViewport.js';

/**
 * Fixed design resolution. The gameplay board (enemy path + buildable grid) is
 * authored against these dimensions and stays a CONSTANT size. The camera is
 * zoomed so this board always fits the screen (never cropped); scenery and UI
 * then expand outward to the real screen edges to fill the rest.
 */
export const DESIGN = {
  width: GameConfig.canvas.width,
  height: GameConfig.canvas.height,
};

/** Top inset so HUD / headers clear mobile notches (includes safe-area). */
export function getSafeTop() {
  return 28 + getSafeInsets().top;
}

/** @deprecated use getSafeTop() — kept for imports */
export const SAFE_TOP = 28;

const GRASS_KEYS = CRAFTPIX_GRASS_TILES.map((n) => craftpixGroundKey(n));
const GRASS_BASE = 0x5A9A38;

/**
 * Tile Craftpix grass across the entire visible camera view. Rebuilt on resize.
 * Returns the created game objects (caller stores them for cleanup).
 */
export function fillGrassUnderlay(scene, view, depth = -10) {
  const tileSize = GameConfig.tileSize;
  const objs = [];
  const len = GRASS_KEYS.length;

  objs.push(
    scene.add.rectangle(
      view.centerX, view.centerY,
      view.width + tileSize * 2, view.height + tileSize * 2,
      GRASS_BASE,
    ).setDepth(depth),
  );

  const startCol = Math.floor(view.x / tileSize) - 1;
  const endCol = Math.ceil(view.right / tileSize) + 1;
  const startRow = Math.floor(view.y / tileSize) - 1;
  const endRow = Math.ceil(view.bottom / tileSize) + 1;

  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      const key = GRASS_KEYS[(((r + c) % len) + len) % len];
      objs.push(
        scene.add.image(c * tileSize + tileSize / 2, r * tileSize + tileSize / 2, key)
          .setDisplaySize(tileSize, tileSize)
          .setDepth(depth + 1),
      );
    }
  }

  return objs;
}

/**
 * Snapshot of the currently-visible world rectangle, in world coordinates.
 * Because the camera is centred on the design and zoomed to "contain" it, this
 * rectangle is always >= the design size on the non-limiting axis — that extra
 * area is the space scenes fill with scenery / anchor their UI to.
 */
function viewOf(cam) {
  const v = cam.worldView;
  return {
    x: v.x,
    y: v.y,
    right: v.right,
    bottom: v.bottom,
    width: v.width,
    height: v.height,
    centerX: v.centerX,
    centerY: v.centerY,
  };
}

/**
 * Zoom + centre the scene's main camera so the fixed design area always fits the
 * viewport (contain — nothing is ever cropped). Calls `onLayout(view)` with the
 * visible world bounds on setup and on every resize / rotation, so the scene can
 * fill scenery to the edges and anchor its UI to the real screen edges.
 */
export function setupResponsiveCamera(scene, onLayout) {
  const cam = scene.cameras.main;

  const apply = () => {
    const sw = scene.scale.width;
    const sh = scene.scale.height;
    if (!sw || !sh) return;
    const zoom = Math.min(sw / DESIGN.width, sh / DESIGN.height);
    cam.setZoom(zoom);
    cam.centerOn(DESIGN.width / 2, DESIGN.height / 2);
    if (onLayout) onLayout(viewOf(cam));
  };

  apply();

  scene.scale.on('resize', apply);
  scene.events.once('shutdown', () => scene.scale.off('resize', apply));
  scene.events.once('destroy', () => scene.scale.off('resize', apply));

  return apply;
}
