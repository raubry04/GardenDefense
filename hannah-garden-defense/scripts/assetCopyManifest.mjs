/**
 * Single source of truth for asset copy rules.
 * Used by collect-assets.mjs and check-assets.mjs.
 */
import { CRAFTPIX_USED_GROUND_TILES, CRAFTPIX_PROPS } from '../src/utils/craftpixTiles.js';

const craftpixDir =
  'Assets/craftpix-net-381103-free-simple-summer-top-down-vector-tileset/PNG';

/** @returns {{ srcParts: string[], destParts: string[] }[]} */
export function buildAssetCopyList() {
  const copies = [];

  const add = (srcRelative, destRelative) => {
    copies.push({
      srcParts: srcRelative.split('/'),
      destParts: destRelative.split('/'),
    });
  };

  const animals = [
    'rabbit', 'chicken', 'dog', 'owl', 'duck', 'penguin', 'pig', 'snake', 'frog',
    'gorilla', 'parrot', 'monkey', 'bear', 'elephant', 'cow', 'chick', 'horse', 'buffalo',
  ];
  for (const a of animals) {
    add(`Animal Pack Remastered/PNG/Round/${a}.png`, `animals/${a}.png`);
  }

  for (const n of CRAFTPIX_USED_GROUND_TILES) {
    const id = String(n).padStart(2, '0');
    add(
      `${craftpixDir}/Top-Down Simple Summer_Ground ${id}.png`,
      `craftpix/ground/${id}.png`,
    );
  }

  const propFiles = {
    treeSmall: 'Prop - Tree Small.png',
    treeMedium: 'Prop - Tree Medium.png',
    bushSmall: 'Prop - Bushes Small.png',
    bushMedium: 'Prop - Bushes Medium.png',
    rock1: 'Prop - Rock 01.png',
    rock2: 'Prop - Rock 02.png',
    rock3: 'Prop - Rock 03.png',
    house: 'Prop - House.png',
  };
  for (const key of Object.keys(CRAFTPIX_PROPS)) {
    add(`${craftpixDir}/${propFiles[key]}`, `craftpix/props/${key}.png`);
  }

  const particles = { sparkle: 'star_04.png', smoke: 'smoke_03.png' };
  for (const [key, file] of Object.entries(particles)) {
    add(`Assets/2D assets/Particle Pack/PNG (Transparent)/${file}`, `kenney/particles/${key}.png`);
  }

  for (const icon of ['star', 'medal1', 'medal2', 'trophy', 'door']) {
    add(`Assets/Icons/Game Icons/PNG/White/1x/${icon}.png`, `kenney/icons/${icon}.png`);
  }

  const ui = {
    buttonRect: 'button_rectangle_depth_flat.png',
    uiStar: 'star.png',
  };
  for (const [key, file] of Object.entries(ui)) {
    add(`Assets/UI assets/UI Pack/PNG/Yellow/Default/${file}`, `kenney/ui/${key}.png`);
  }

  const sfx = {
    towerPlaced: ['Assets/Audio/Interface Sounds/Audio', 'confirmation_001.ogg'],
    towerFires: ['Assets/Audio/Interface Sounds/Audio', 'pluck_001.ogg'],
    enemyHit: ['Assets/Audio/Interface Sounds/Audio', 'drop_001.ogg'],
    enemyDies: ['Assets/Audio/Interface Sounds/Audio', 'minimize_001.ogg'],
    pointsEarned: ['Assets/Audio/Interface Sounds/Audio', 'maximize_008.ogg'],
    buttonClick: ['Assets/UI assets/UI Pack/Sounds', 'click-a.ogg'],
    invalidAction: ['Assets/Audio/Interface Sounds/Audio', 'error_004.ogg'],
    abilityUsed: ['Assets/Audio/Interface Sounds/Audio', 'switch_006.ogg'],
    levelUp: ['Assets/Audio/Interface Sounds/Audio', 'confirmation_004.ogg'],
  };
  for (const [key, [dir, file]] of Object.entries(sfx)) {
    add(`${dir}/${file}`, `audio/sfx/${key}.ogg`);
  }

  add('Assets/Audio/Music Loops/Loops/Cheerful Annoyance.ogg', 'audio/music/menu.ogg');
  add('Assets/Audio/Music Jingles/Audio (Pizzicato)/jingles-pizzicato_03.ogg', 'audio/music/victory.ogg');
  add('Assets/Audio/Music Jingles/Audio (Pizzicato)/jingles-pizzicato_11.ogg', 'audio/music/gameOver.ogg');
  add('Assets/Other/Fonts/Kenney Pixel.ttf', 'fonts/Kenney Pixel.ttf');
  add('Assets/Other/Fonts/Kenney Future.ttf', 'fonts/Kenney Future.ttf');

  return copies;
}

/** Runtime asset paths relative to assets/ folder. */
export function listRuntimeAssetDestPaths() {
  return buildAssetCopyList().map(({ destParts }) => destParts.join('/'));
}
