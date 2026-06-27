import { GameConfig } from '../config.js';
import { craftpixGroundKey, CRAFTPIX_GRASS_TILES } from '../utils/craftpixTiles.js';

export const TILE = GameConfig.tileSize;
export const COLORS = GameConfig.colors;
export const GRASS_TILES = CRAFTPIX_GRASS_TILES.map((n) => craftpixGroundKey(n));

export const TREE_KEYS = [
  'cp_treeSmall', 'cp_treeMedium', 'cp_treeLarge',
  'cp_treeStumpShort', 'cp_treeStumpTall',
];
export const BUSH_KEYS = ['cp_bushSmall', 'cp_bushMedium', 'cp_bushLarge'];
export const ROCK_KEYS = ['cp_rock1', 'cp_rock2', 'cp_rock3', 'cp_rock4', 'cp_rock5'];
export const DECOR_KEYS = [
  'cp_well', 'cp_windmill', 'cp_campfire', 'cp_tent',
  'cp_woodenBarrel', 'cp_woodenCart', 'cp_treasureChest',
  'cp_flag', 'cp_fenceHorizontal', 'cp_fenceVertical',
];
