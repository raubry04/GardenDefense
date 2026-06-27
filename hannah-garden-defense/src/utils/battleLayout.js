/**

 * Battle UI chrome + camera fit for phones and iPads.

 * Pattern: reserve HUD bands, fit the 1280×720 board into the middle (contain, never crop).

 */

import { getSafeInsets, isMobileViewport } from './mobileViewport.js';

import { GameConfig } from '../config.js';



export const DESIGN = {

  width: GameConfig.canvas.width,

  height: GameConfig.canvas.height,

};



/** Phone if shortest edge under 600 logical px (iPhone); iPad mini is 744+. */

export function isPhoneScreen(sw, sh) {

  return Math.min(sw, sh) < 600;

}



/** Reserved screen bands — gameplay camera fits in the region between these. */

export function computeBattleChrome(sw, sh) {

  const safe = getSafeInsets();

  const isPortrait = sh > sw;

  const isPhone = isPhoneScreen(sw, sh);

  const compact = isPhone;



  let top;
  let bottom;
  let right = 0;



  if (isPhone && isPortrait) {

    top = 72 + safe.top;

    bottom = 188 + safe.bottom;

  } else if (isPhone && !isPortrait) {

    top = 54 + safe.top;

    bottom = 86 + safe.bottom;

    right = 96 + safe.right;

  } else if (isPortrait) {

    top = 76 + safe.top;

    bottom = 228 + safe.bottom;

  } else {

    top = 68 + safe.top;

    bottom = 102 + safe.bottom;

    right = 118 + safe.right;

  }



  return { top, bottom, right, isPortrait, isPhone, compact, safe };

}



/** UI sizing derived from the same chrome model. */

export function computeBattleUI(sw, sh) {

  const chrome = computeBattleChrome(sw, sh);

  const pad = {

    left: 12 + chrome.safe.left,

    right: 12 + chrome.safe.right,

    top: chrome.top,

    bottom: chrome.bottom,

  };



  const playableW = sw - (chrome.isPortrait ? 0 : chrome.right);

  const playableCenterX = playableW / 2;

  const cardCount = 7;

  const availW = playableW - pad.left - pad.right;



  if (chrome.compact && chrome.isPortrait) {

    const trayHeight = 76;

    const cardStep = Math.min(72, Math.floor(availW / cardCount));

    const cardScale = cardStep < 68 ? 0.78 : 0.88;

    return {

      ...chrome,

      pad,

      playableW,

      playableCenterX,

      trayHeight,

      trayRows: 1,

      cardStep,

      cardScale,

      abilityStep: Math.min(56, Math.floor((sw - pad.left - pad.right) / 4)),

      abilityYAboveTray: 40,

      sendWaveAboveTray: 82,

      sendWaveWidth: Math.min(168, sw - 48),

      hudRow2Offset: 28,

    };

  }



  if (chrome.compact && !chrome.isPortrait) {

    const trayHeight = 78;

    const cardStep = Math.min(80, Math.floor((availW - 16) / cardCount));

    return {

      ...chrome,

      pad,

      playableW,

      playableCenterX,

      trayHeight,

      trayRows: 1,

      cardStep,

      cardScale: 0.85,

      abilityStep: 64,

      abilityX: sw - pad.right - 48,

      sendWaveAboveTray: 52,

      sendWaveWidth: 160,

      hudRow2Offset: 26,

    };

  }



  if (chrome.isPortrait) {

    return {

      ...chrome,

      pad,

      playableW,

      playableCenterX,

      trayHeight: 176,

      trayRows: 2,

      cardStep: 96,

      cardScale: 1,

      abilityStep: 72,

      abilityYAboveTray: 52,

      sendWaveAboveTray: 108,

      sendWaveWidth: 182,

      hudRow2Offset: 32,

    };

  }



  return {

    ...chrome,

    pad,

    playableW,

    playableCenterX,

    trayHeight: 94,

    trayRows: 1,

    cardStep: 96,

    cardScale: 1,

    abilityStep: 72,

    abilityX: sw - pad.right - 54,

    sendWaveAboveTray: 58,

    sendWaveWidth: 176,

    hudRow2Offset: 32,

  };

}



/**
 * Convert screen pixels to design-space distance (1280×720 coords).
 * Used to lift bottom HUD above OS gesture zones on phones.
 */
export function screenPxToDesign(sw, sh, px) {
  const zoom = Math.max(0.0001, Math.min(sw / DESIGN.width, sh / DESIGN.height));
  return px / zoom;
}

/**
 * Design-space HUD anchors for UIScene (tray, send wave, abilities).
 *
 * Recommended safe padding (screen px):
 * - iOS home indicator: env(safe-area-inset-bottom) ≈ 34px (handled via CSS + getSafeInsets)
 * - Android gesture bar fallback when env is 0: 48px portrait / 32px landscape
 * - Touch clearance above gesture zone: 16px
 * - Design equivalent at phone zoom (~0.3): ~40–80px for touch margin alone,
 *   ~120–160px total when CSS safe-area is unavailable
 */
export function computeDesignUIMetrics(sw, sh) {
  const ui = computeBattleUI(sw, sh);
  const safe = getSafeInsets();
  const mobile = ui.isPhone || isMobileViewport();
  const zoom = Math.max(0.0001, Math.min(sw / DESIGN.width, sh / DESIGN.height));

  const TOUCH_MARGIN_PX = 16;
  const GESTURE_FALLBACK_PX = ui.isPortrait ? 48 : 32;
  let screenBottomPad = 0;

  if (mobile) {
    const envInset = safe.bottom;
    const gesturePad = envInset > 8 ? envInset + TOUCH_MARGIN_PX : GESTURE_FALLBACK_PX + TOUCH_MARGIN_PX;
    screenBottomPad = Math.max(gesturePad, TOUCH_MARGIN_PX);
  }

  let designBottomInset = mobile ? screenPxToDesign(sw, sh, screenBottomPad) : 0;
  if (mobile) {
    designBottomInset = Math.min(designBottomInset, DESIGN.height * 0.22);
    designBottomInset = Math.max(designBottomInset, screenPxToDesign(sw, sh, 24));
  }

  const trayHeight = ui.trayHeight;
  const trayBottom = DESIGN.height - designBottomInset;
  const trayCenterY = trayBottom - trayHeight / 2;
  const trayTop = trayBottom - trayHeight;

  const sendWaveY = trayTop - screenPxToDesign(sw, sh, ui.sendWaveAboveTray);

  const abilityStep = mobile && ui.compact
    ? screenPxToDesign(sw, sh, ui.abilityStep)
    : 80;
  const abilityX = DESIGN.width - (mobile && ui.compact && !ui.isPortrait
    ? screenPxToDesign(sw, sh, ui.pad.right) + 32
    : 50);

  const abilityCount = 4;
  let abilityCenterY = DESIGN.height / 2;
  if (mobile && ui.isPortrait) {
    const stackH = (abilityCount - 1) * abilityStep;
    const aboveTray = screenPxToDesign(sw, sh, ui.abilityYAboveTray);
    abilityCenterY = trayTop - aboveTray - stackH / 2 - 32;
    abilityCenterY = Math.max(ui.pad.top / zoom + 80, abilityCenterY);
  }

  const hudTopInset = screenPxToDesign(sw, sh, ui.pad.top);
  const hudRow1Y = Math.round(36 + hudTopInset * 0.35);
  const hudRow2Y = hudRow1Y + (ui.hudRow2Offset ?? 32);

  const controlsInset = screenPxToDesign(sw, sh, ui.compact && !ui.isPortrait ? ui.pad.right + 88 : ui.pad.right);
  const hudPauseX = DESIGN.width - controlsInset - 22 - 16;
  const hudSpeedX = hudPauseX - 44 - 8;
  const hudSunPanelX = hudSpeedX - 22 - 12 - 54;

  return {
    ui,
    zoom,
    designBottomInset,
    screenBottomPad,
    trayHeight,
    trayCenterY,
    trayTop,
    trayBottom,
    sendWaveY,
    abilityX,
    abilityStep,
    abilityCenterY,
    mobile,
    hudRow1Y,
    hudRow2Y,
    hudTopInset,
    hudPauseX,
    hudSpeedX,
    hudSunPanelX,
    toastY: trayTop - 48,
  };
}



const WORLD_PAD = 4096;



/**

 * Fit the design board into a screen rectangle (contain — full board always visible).

 * Camera scroll places design center at rect center; bounds are expanded so margin

 * grass can render outside the 1280×720 board without clamping/cropping.

 */

export function fitDesignInScreenRect(cam, sw, sh, rect) {
  const rw = Math.max(1, rect.w);
  const rh = Math.max(1, rect.h);
  const zoom = Math.max(0.0001, Math.min(rw / DESIGN.width, rh / DESIGN.height));

  cam.setBounds(-WORLD_PAD, -WORLD_PAD, DESIGN.width + WORLD_PAD * 2, DESIGN.height + WORLD_PAD * 2);
  cam.setZoom(zoom);
  cam.centerOn(DESIGN.width / 2, DESIGN.height / 2);

  return { zoom, scrollX: cam.scrollX, scrollY: cam.scrollY, playW: rw, playH: rh };
}

/** Shift the board away from bottom/right chrome bands without changing zoom. */
export function nudgeBattleCameraForChrome(cam, sw, sh, zoom) {
  const chrome = computeBattleChrome(sw, sh);
  const nudgePx = chrome.isPortrait ? chrome.bottom * 0.2 : Math.max(chrome.bottom, chrome.right) * 0.12;
  if (nudgePx > 0 && zoom > 0) {
    cam.scrollY += nudgePx / zoom;
  }
}



/** Fit board into the playable band between UI chrome. */

export function applyBattleCamera(cam, sw, sh, chrome) {

  const playW = Math.max(120, sw - chrome.right);

  const playH = Math.max(120, sh - chrome.top - chrome.bottom);

  return fitDesignInScreenRect(cam, sw, sh, {

    x: 0,

    y: chrome.top,

    w: playW,

    h: playH,

  });

}


