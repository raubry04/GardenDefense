import { GameConfig } from '../config.js';
import { craftpixGroundKey, CRAFTPIX_GRASS_TILES } from './craftpixTiles.js';
import { getSafeInsets } from './mobileViewport.js';
import { fitDesignInScreenRect, nudgeBattleCameraForChrome, DESIGN } from './battleLayout.js';
import { isMobileViewport } from './mobileViewport.js';

export { DESIGN };

const GRASS_KEYS = CRAFTPIX_GRASS_TILES.map((n) => craftpixGroundKey(n));
export const GRASS_BG = '#5A9A38';

export function getSafeTop() {
  return 28 + getSafeInsets().top;
}

export const SAFE_TOP = 28;

function viewOf(cam) {
  const v = cam.worldView;
  return {
    x: v.x, y: v.y, right: v.right, bottom: v.bottom,
    width: v.width, height: v.height, centerX: v.centerX, centerY: v.centerY,
  };
}

export function getLayoutScreenSize(scene) {
  return {
    width: Math.max(1, Math.round(scene.scale.width)),
    height: Math.max(1, Math.round(scene.scale.height)),
  };
}

/**
 * Tile grass across the full camera view, snapped to the world tile grid so
 * margin tiles align with map tiles at (0,0) — no visible corner box.
 */
export function fillGrassUnderlay(scene, view, depth = -10, opts = {}) {
  const tileSize = GameConfig.tileSize;
  const objs = [];
  const len = GRASS_KEYS.length;

  let startX = Math.floor(view.x / tileSize) * tileSize;
  let startY = Math.floor(view.y / tileSize) * tileSize;
  let endX = Math.ceil(view.right / tileSize) * tileSize;
  let endY = Math.ceil(view.bottom / tileSize) * tileSize;

  if (opts.clipToDesign) {
    startX = Math.max(startX, 0);
    startY = Math.max(startY, 0);
    endX = Math.min(endX, DESIGN.width);
    endY = Math.min(endY, DESIGN.height);
  }

  for (let y = startY; y < endY; y += tileSize) {
    for (let x = startX; x < endX; x += tileSize) {
      const col = Math.round(x / tileSize);
      const row = Math.round(y / tileSize);
      const key = GRASS_KEYS[(((row + col) % len) + len) % len];
      objs.push(
        scene.add.image(x + tileSize / 2, y + tileSize / 2, key)
          .setDisplaySize(tileSize, tileSize)
          .setDepth(depth),
      );
    }
  }
  return objs;
}

export function refillSceneGrass(scene, view, depth = -10, opts = {}) {
  if (scene._grassObjs) scene._grassObjs.forEach((o) => o.destroy());
  scene._grassObjs = fillGrassUnderlay(scene, view, depth, opts);
}

function bindRelayout(scene, apply) {
  const onResize = () => apply();
  const onRelayout = () => apply();
  scene.scale.on('resize', onResize);
  scene.game?.events?.on('viewport-relayout', onRelayout);
  scene.events.once('shutdown', () => {
    scene.scale.off('resize', onResize);
    scene.game?.events?.off('viewport-relayout', onRelayout);
  });
  scene.events.once('destroy', () => {
    scene.scale.off('resize', onResize);
    scene.game?.events?.off('viewport-relayout', onRelayout);
  });
}

export function setupBattleCamera(scene, onLayout, opts = {}) {
  const cam = scene.cameras.main;
  const immediate = opts.immediate !== false;

  const apply = () => {
    const { width: sw, height: sh } = getLayoutScreenSize(scene);
    if (!sw || !sh) return;
    cam.setBackgroundColor(GRASS_BG);
    // Full-viewport contain fit — UI chrome is overlaid in design space (UIScene syncs this camera).
    // Do not shrink zoom to the chrome band; that desyncs HUD/tray metrics and makes mobile tiny.
    const fit = fitDesignInScreenRect(cam, sw, sh, { x: 0, y: 0, w: sw, h: sh });
    if (isMobileViewport()) {
      nudgeBattleCameraForChrome(cam, sw, sh, fit.zoom);
    }
    const view = viewOf(cam);
    if (onLayout) onLayout(view);
    scene.game?.events?.emit('battle-camera-updated');
  };

  if (immediate) apply();
  bindRelayout(scene, apply);
  return apply;
}

/** Menu / overlay scenes: contain-fit + grass underlay on every resize. */
export function setupResponsiveCamera(scene, onLayout, opts = {}) {
  const cam = scene.cameras.main;
  const withGrass = opts.grass !== false;

  const apply = () => {
    const { width: sw, height: sh } = getLayoutScreenSize(scene);
    if (!sw || !sh) return;
    cam.setBackgroundColor(GRASS_BG);
    fitDesignInScreenRect(cam, sw, sh, { x: 0, y: 0, w: sw, h: sh });
    const view = viewOf(cam);
    if (withGrass) refillSceneGrass(scene, view, -10);
    if (onLayout) onLayout(view);
  };

  apply();
  bindRelayout(scene, apply);
  return apply;
}

export function syncToBattleCamera(uiScene) {
  const apply = () => {
    const game = uiScene.game.scene.getScene('GameScene');
    const src = game?.cameras?.main;
    const dst = uiScene.cameras.main;
    if (!src || !dst) return;
    dst.setZoom(src.zoom);
    dst.setScroll(src.scrollX, src.scrollY);
    const b = src.getBounds();
    if (b) dst.setBounds(b.x, b.y, b.width, b.height);
  };

  uiScene._syncBattleCam = apply;
  apply();
  uiScene.game.events.on('battle-camera-updated', apply);
  uiScene.events.once('shutdown', () => {
    uiScene.game.events.off('battle-camera-updated', apply);
    uiScene._syncBattleCam = null;
  });
}

