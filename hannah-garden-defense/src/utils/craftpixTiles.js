/**

 * Craftpix Simple Summer top-down vector tileset (256×256 PNGs, scaled to 64px in-game).

 * Path tiles are chosen from path segment directions (which edges connect to path).

 */



const CRAFTPIX_GROUND = '/game-assets/craftpix/ground';

const CRAFTPIX_PROPS_DIR = '/game-assets/craftpix/props';



const OPPOSITE = { N: 'S', S: 'N', E: 'W', W: 'E' };



export function craftpixGroundPath(num) {

  const id = String(num).padStart(2, '0');

  return `${CRAFTPIX_GROUND}/${id}.png`;

}



export function craftpixGroundKey(num) {

  return `cp_ground_${String(num).padStart(2, '0')}`;

}



export function craftpixPropPath(propKey) {

  return `${CRAFTPIX_PROPS_DIR}/${propKey}.png`;

}



/** Full grass fill tiles — alternate for visual variety. */

export const CRAFTPIX_GRASS_TILES = [43, 52];



/** Solid path interior fallback. */

export const CRAFTPIX_PATH_FILL = 14;



/**

 * Connected path edges (N/E/S/W) → ground tile numbers.

 * Keys verified by sampling PNG edge colours against segment directions.

 */

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



/** Ground tile PNGs referenced by grass fill + path autotiling. */

export const CRAFTPIX_USED_GROUND_TILES = (() => {

  const ids = new Set([...CRAFTPIX_GRASS_TILES, CRAFTPIX_PATH_FILL]);

  for (const options of Object.values(CRAFTPIX_PATH_BY_SIDES)) {

    options.forEach((n) => ids.add(n));

  }

  return [...ids].sort((a, b) => a - b);

})();



export const CRAFTPIX_PROPS = {

  treeSmall: 'treeSmall',

  treeMedium: 'treeMedium',

  bushSmall: 'bushSmall',

  bushMedium: 'bushMedium',

  rock1: 'rock1',

  rock2: 'rock2',

  rock3: 'rock3',

  house: 'house',

};



/** Which path edges connect to this cell (from dirIn/dirOut). */

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


