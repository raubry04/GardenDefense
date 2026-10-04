/**
 * Map grid + path tile selection for Craftpix Simple Summer tileset.
 * Picks path tiles from segment travel directions (correct corner orientation).
 */

import {
  ZONE_LAYOUTS,
  LAYOUT_BY_ID,
  LAYOUT_COOP,
  LAYOUT_BERRY,
  LAYOUT_ORCHARD,
  buildPathFromCoords,
  pathSetFromSegments,
} from '../three/pathUtils.js';
import { pickCraftpixPathTileForSegment } from './craftpixTiles.js';

const ENDLESS_LAYOUTS = [LAYOUT_COOP, LAYOUT_BERRY, LAYOUT_ORCHARD];

export function getZoneLayout(zone, layoutId = null) {
  if (layoutId && LAYOUT_BY_ID[layoutId]) return LAYOUT_BY_ID[layoutId];
  if (zone >= 0 && zone < ZONE_LAYOUTS.length) return ZONE_LAYOUTS[zone];
  const weekIndex = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  return ENDLESS_LAYOUTS[weekIndex % ENDLESS_LAYOUTS.length];
}

export function pathCoordsToWaypoints(coords, tileSize) {
  return coords.map((c) => ({
    x: c.x * tileSize + tileSize / 2,
    y: c.z * tileSize + tileSize / 2,
  }));
}

function translateCoords(coords, colOffset, rowOffset) {
  return coords.map((c) => ({ x: c.x + colOffset, z: c.z + rowOffset }));
}

function mirrorPathCoords(coords, gridW) {
  return coords.map((c) => ({ x: gridW - 1 - c.x, z: c.z }));
}

function reversePathCoords(coords) {
  return [...coords].reverse();
}

/**
 * Build grass/path grid and per-cell Craftpix ground tile numbers for a zone layout.
 * @param {number} zone
 * @param {number} cols
 * @param {number} rows
 * @param {number} [tileSize]
 * @param {{
 *   centerLayout?: boolean,
 *   expandPlayable?: boolean,
 *   bottomReserveRows?: number,
 *   colOffset?: number,
 *   rowOffset?: number,
 *   reversePath?: boolean,
 *   mirrorPath?: boolean,
 *   layoutId?: string|null,
 * }} [opts]
 */
export function buildCanvasMapData(zone, cols, rows, tileSize = 64, opts = {}) {
  const layout = getZoneLayout(zone, opts.layoutId ?? null);
  const {
    centerLayout = false,
    expandPlayable = false,
    bottomReserveRows = 0,
    reversePath = false,
    mirrorPath = false,
  } = opts;

  const colOffset = opts.colOffset ?? (centerLayout
    ? Math.floor((cols - layout.gridW) / 2)
    : 0);
  let rowOffset = opts.rowOffset ?? (centerLayout
    ? Math.max(0, Math.floor((rows - bottomReserveRows - layout.gridH) / 2))
    : 0);

  // When the layout is as tall as the canvas, the formula above yields 0 and
  // high-z paths still sit under the tower tray — nudge up so path clears reserve.
  if (centerLayout && bottomReserveRows > 0 && opts.rowOffset == null && layout.pathCoords.length) {
    const maxZ = Math.max(...layout.pathCoords.map((c) => c.z));
    const pathBottom = rowOffset + maxZ;
    const lastPlayable = rows - bottomReserveRows - 1;
    if (pathBottom > lastPlayable) {
      rowOffset -= pathBottom - lastPlayable;
    }
  }

  let pathCoords = layout.pathCoords;
  if (mirrorPath) pathCoords = mirrorPathCoords(pathCoords, layout.gridW);
  if (reversePath) pathCoords = reversePathCoords(pathCoords);

  const shiftedPathCoords = translateCoords(pathCoords, colOffset, rowOffset);
  const pathSegs = buildPathFromCoords(shiftedPathCoords);
  const pathSet = pathSetFromSegments(pathSegs);

  const grid = [];
  for (let r = 0; r < rows; r++) {
    grid[r] = [];
    for (let c = 0; c < cols; c++) {
      const key = `${c},${r}`;
      if (pathSet.has(key)) {
        grid[r][c] = 'path';
      } else {
        const localCol = c - colOffset;
        const localRow = r - rowOffset;
        const insideBaseLayout =
          localCol >= 0 &&
          localCol < layout.gridW &&
          localRow >= 0 &&
          localRow < layout.gridH;

        if (!insideBaseLayout && expandPlayable) {
          grid[r][c] = 'grass';
          continue;
        }

        let nearPath = false;
        for (const coord of shiftedPathCoords) {
          const dist = Math.abs(coord.x - c) + Math.abs(coord.z - r);
          if (dist >= 1 && dist <= 2) {
            nearPath = true;
            break;
          }
        }
        grid[r][c] = nearPath ? 'grass' : 'blocked';
      }
    }
  }

  const pathTileMap = {};
  pathSegs.forEach((seg) => {
    const seed = seg.x * 17 + seg.z * 31;
    pathTileMap[`${seg.x},${seg.z}`] = pickCraftpixPathTileForSegment(seg, seed);
  });

  return {
    layout,
    cols,
    rows,
    colOffset,
    rowOffset,
    coreBounds: {
      left: colOffset * tileSize,
      top: rowOffset * tileSize,
      right: (colOffset + layout.gridW) * tileSize,
      bottom: (rowOffset + layout.gridH) * tileSize,
    },
    pathSegs,
    pathSet,
    grid,
    pathTileMap,
    waypoints: pathCoordsToWaypoints(shiftedPathCoords, tileSize),
  };
}
