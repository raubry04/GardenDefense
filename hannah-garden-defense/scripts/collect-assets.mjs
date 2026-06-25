/**
 * Copy only the asset files the game actually loads into ./assets/
 * Run: node scripts/collect-assets.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const gardenRoot = path.resolve(projectRoot, '..');
const destRoot = path.join(projectRoot, 'assets');

/** @type {{ src: string, dest: string }[]} */
const copies = [];

function add(srcRelative, destRelative) {
  copies.push({
    src: path.join(gardenRoot, ...srcRelative.split('/')),
    dest: path.join(destRoot, ...destRelative.split('/')),
  });
}

const animals = [
  'rabbit', 'chicken', 'dog', 'owl', 'duck', 'penguin', 'pig', 'snake', 'frog',
  'gorilla', 'parrot', 'monkey', 'bear', 'elephant', 'cow', 'chick', 'horse', 'buffalo',
];
for (const a of animals) {
  add(`Animal Pack Remastered/PNG/Round/${a}.png`, `animals/${a}.png`);
}

const craftpixDir = 'Assets/craftpix-net-381103-free-simple-summer-top-down-vector-tileset/PNG';
const groundTiles = [
  10, 12, 14, 16, 18, 19, 21, 25, 27, 28, 30, 34, 36, 37, 38, 39, 40, 41, 42, 43,
  48, 49, 50, 51, 52, 53, 54, 55, 56,
];
for (const n of groundTiles) {
  const id = String(n).padStart(2, '0');
  add(
    `${craftpixDir}/Top-Down Simple Summer_Ground ${id}.png`,
    `craftpix/ground/${id}.png`,
  );
}

const props = {
  treeSmall: 'Prop - Tree Small.png',
  treeMedium: 'Prop - Tree Medium.png',
  bushSmall: 'Prop - Bushes Small.png',
  bushMedium: 'Prop - Bushes Medium.png',
  rock1: 'Prop - Rock 01.png',
  rock2: 'Prop - Rock 02.png',
  rock3: 'Prop - Rock 03.png',
  house: 'Prop - House.png',
};
for (const [key, file] of Object.entries(props)) {
  add(`${craftpixDir}/Top-Down Simple Summer_${file}`, `craftpix/props/${key}.png`);
}

const particles = {
  sparkle: 'star_04.png',
  smoke: 'smoke_03.png',
};
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

if (fs.existsSync(destRoot)) {
  fs.rmSync(destRoot, { recursive: true, force: true });
}

let copied = 0;
const missing = [];

for (const { src, dest } of copies) {
  if (!fs.existsSync(src)) {
    missing.push(src);
    continue;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  copied++;
}

console.log(`Copied ${copied} used asset files to ${destRoot}`);
if (missing.length) {
  console.error(`Missing ${missing.length} source files:`);
  missing.forEach((m) => console.error('  ', m));
  process.exit(1);
}
