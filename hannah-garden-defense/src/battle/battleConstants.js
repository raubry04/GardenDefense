import { GameConfig } from '../config.js';
import { craftpixGroundKey, CRAFTPIX_GRASS_TILES } from '../utils/craftpixTiles.js';

export const TILE = GameConfig.tileSize;
export const COLORS = GameConfig.colors;
export const GRASS_TILES = CRAFTPIX_GRASS_TILES.map((n) => craftpixGroundKey(n));
export const BUSH_KEYS = ['cp_bushSmall', 'cp_bushMedium'];
export const TREE_KEYS = ['cp_treeSmall', 'cp_treeMedium'];
export const ROCK_KEYS = ['cp_rock1', 'cp_rock2', 'cp_rock3'];
