/**

 * Battle UI chrome + camera fit for phones and iPads.

 * Pattern: reserve HUD bands, fit the 1280×720 board into the middle (contain, never crop).

 */

import { getSafeInsets } from './mobileViewport.js';

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



  let top = 0;

  let bottom = 0;

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


