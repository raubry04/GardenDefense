/**
 * Craftpix Simple Summer top-down vector tileset (256×256 PNGs, scaled to 64px in-game).
 * Hand-curated under assets/craftpix/ground/ and assets/craftpix/props/.
 * Tile index N (autotiling) maps to `Top-Down Simple Summer_Ground {NN}.png`.
 */

const CRAFTPIX_GROUND_TILE_DIR = '/game-assets/craftpix/ground';
const CRAFTPIX_PROPS_DIR = '/game-assets/craftpix/props';

const PATH_FILENAME = (id) => `Top-Down Simple Summer_Ground ${id}.png`;

const OPPOSITE = { N: 'S', S: 'N', E: 'W', W: 'E' };

function assetUrl(base, filename) {
  const segment = filename.split('/').map(encodeURIComponent).join('/');
  return `${base}/${segment}`;
}

export function craftpixGroundPath(num) {
  const id = String(num).padStart(2, '0');
  return assetUrl(CRAFTPIX_GROUND_TILE_DIR, PATH_FILENAME(id));
}

export function craftpixGroundKey(num) {
  return `cp_ground_${String(num).padStart(2, '0')}`;
}

export function craftpixPropPath(filename) {
  return assetUrl(CRAFTPIX_PROPS_DIR, filename);
}

/** Logical key → filename in assets/craftpix/props/ */
export const CRAFTPIX_PROPS = {
  treeSmall: 'Top-Down Simple Summer_Prop - Tree Small.png',
  treeMedium: 'Top-Down Simple Summer_Prop - Tree Medium.png',
  treeLarge: 'Top-Down Simple Summer_prop - Tree Large.png',
  treeStumpShort: 'Top-Down Simple Summer_Prop - Tree Stump Short.png',
  treeStumpTall: 'Top-Down Simple Summer_Prop - Tree Stump Tall.png',
  bushSmall: 'Top-Down Simple Summer_Prop - Bushes Small.png',
  bushMedium: 'Top-Down Simple Summer_Prop - Bushes Medium.png',
  bushLarge: 'Top-Down Simple Summer_Prop - Bushes Large.png',
  rock1: 'Top-Down Simple Summer_Prop - Rock 01.png',
  rock2: 'Top-Down Simple Summer_Prop - Rock 02.png',
  rock3: 'Top-Down Simple Summer_Prop - Rock 03.png',
  rock4: 'Top-Down Simple Summer_Prop - Rock 04.png',
  rock5: 'Top-Down Simple Summer_Prop - Rock 05.png',
  house: 'Top-Down Simple Summer_Prop - House.png',
  tent: 'Top-Down Simple Summer_Prop - Tent.png',
  campfire: 'Top-Down Simple Summer_Prop - Campfire.png',
  well: 'Top-Down Simple Summer_Prop - Well.png',
  windmill: 'Top-Down Simple Summer_Prop - Windmill.png',
  woodenBarrel: 'Top-Down Simple Summer_Prop - Wooden Barrel.png',
  woodenCart: 'Top-Down Simple Summer_Prop - Wooden Cart.png',
  treasureChest: 'Top-Down Simple Summer_Prop - Treasure Chest.png',
  flag: 'Top-Down Simple Summer_Prop - Flag.png',
  blueBanner: 'Top-Down Simple Summer_Prop - Blue Banner.png',
  redBanner: 'Top-Down Simple Summer_Prop - Red Banner.png',
  castleRound: 'Top-Down Simple Summer_Prop - Castle Round.png',
  castleSquare: 'Top-Down Simple Summer_Prop - Castle Square.png',
  magicStoneTower: 'Top-Down Simple Summer_Prop - Magic Stone Tower.png',
  watchtowerShort: 'Top-Down Simple Summer_Prop - Watchtower Short.png',
  watchtowerTall: 'Top-Down Simple Summer_Prop - Watchtower Tall.png',
  bridgeHorizontal: 'Top-Down Simple Summer_Prop - Wooden Bridge Horizontal.png',
  bridgeVertical: 'Top-Down Simple Summer_Prop - Wooden Bridge Vertical.png',
  fenceHorizontal: 'Top-Down Simple Summer_Prop - Wooden Fence Horizontal.png',
  fenceVertical: 'Top-Down Simple Summer_Prop - Wooden Fence Vertical.png',
};

export const CRAFTPIX_GRASS_TILES = [43, 52];
export const CRAFTPIX_PATH_FILL = 14;

export const CRAFTPIX_PATH_BY_SIDES = {
  EW: [41, 49, 55],
  NS: [38, 51, 53],
  EN: [16, 25, 34, 54],
  ES: [19, 28, 48, 10],
  SW: [12, 21, 30, 50],
  NW: [36, 18, 27, 56],
  E: [40],
  W: [42],
  N: [39],
  S: [37],
};

export const CRAFTPIX_USED_GROUND_TILES = (() => {
  const ids = new Set([...CRAFTPIX_GRASS_TILES, CRAFTPIX_PATH_FILL]);
  for (const options of Object.values(CRAFTPIX_PATH_BY_SIDES)) {
    options.forEach((n) => ids.add(n));
  }
  return [...ids].sort((a, b) => a - b);
})();

/** Runtime paths relative to assets/ for validation. */
export function listCraftpixRuntimePaths() {
  const paths = CRAFTPIX_USED_GROUND_TILES.map((n) => {
    const id = String(n).padStart(2, '0');
    return `craftpix/ground/${PATH_FILENAME(id)}`;
  });
  for (const file of Object.values(CRAFTPIX_PROPS)) {
    paths.push(`craftpix/props/${file}`);
  }
  return paths;
}

export function pathSideKeyFromSegment(seg) {
  const sides = new Set();
  if (seg.dirIn) sides.add(OPPOSITE[seg.dirIn]);
  if (seg.dirOut) sides.add(seg.dirOut);
  return [...sides].sort().join('');
}

export function pickCraftpixPathTileForSegment(seg, seed = 0) {
  const key = pathSideKeyFromSegment(seg);
  const options = CRAFTPIX_PATH_BY_SIDES[key] ?? [CRAFTPIX_PATH_FILL];
  return options[Math.abs(seed) % options.length];
}

export function craftpixPathKeyForSegment(seg, seed = 0) {
  return craftpixGroundKey(pickCraftpixPathTileForSegment(seg, seed));
}
