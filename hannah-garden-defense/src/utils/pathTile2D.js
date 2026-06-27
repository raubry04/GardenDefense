/**
 * Map grid + path tile selection for Craftpix Simple Summer tileset.
 * Picks path tiles from segment travel directions (correct corner orientation).
 */

import {
  ZONE_LAYOUTS,
  LAYOUT_COOP,
  LAYOUT_BERRY,
  LAYOUT_ORCHARD,
  buildPathFromCoords,
  pathSetFromSegments,
} from '../three/pathUtils.js';
import { pickCraftpixPathTileForSegment } from './craftpixTiles.js';

const ENDLESS_LAYOUTS = [LAYOUT_COOP, LAYOUT_BERRY, LAYOUT_ORCHARD];

export function getZoneLayout(zone) {
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

/**
 * Build grass/path grid and per-cell Craftpix ground tile numbers for a zone layout.
 */
export function buildCanvasMapData(zone, cols, rows, tileSize = 64, opts = {}) {
  const layout = getZoneLayout(zone);
  const {
    centerLayout = false,
    expandPlayable = false,
    colOffset = centerLayout ? Math.floor((cols - layout.gridW) / 2) : 0,
    rowOffset = centerLayout ? Math.floor((rows - layout.gridH) / 2) : 0,
  } = opts;
  const shiftedPathCoords = translateCoords(layout.pathCoords, colOffset, rowOffset);
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
