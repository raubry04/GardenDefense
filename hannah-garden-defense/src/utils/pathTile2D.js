/**
 * Map grid + path tile selection for Craftpix Simple Summer tileset.
 * Picks path tiles from segment travel directions (correct corner orientation).
 */

import {
  LAYOUT_C,
  buildPathFromCoords,
  pathSetFromSegments,
} from '../three/pathUtils.js';
import { pickCraftpixPathTileForSegment } from './craftpixTiles.js';

export function getZoneLayout(zone) {
  return zone === 0 ? LAYOUT_C : LAYOUT_C;
}

export function pathCoordsToWaypoints(coords, tileSize) {
  return coords.map((c) => ({
    x: c.x * tileSize + tileSize / 2,
    y: c.z * tileSize + tileSize / 2,
  }));
}

/**
 * Build grass/path grid and per-cell Craftpix ground tile numbers for a zone layout.
 */
export function buildCanvasMapData(zone, cols, rows, tileSize = 64) {
  const layout = getZoneLayout(zone);
  const pathSegs = buildPathFromCoords(layout.pathCoords);
  const pathSet = pathSetFromSegments(pathSegs);

  const grid = [];
  for (let r = 0; r < rows; r++) {
    grid[r] = [];
    for (let c = 0; c < cols; c++) {
      const key = `${c},${r}`;
      if (pathSet.has(key)) {
        grid[r][c] = 'path';
      } else {
        let nearPath = false;
        for (const coord of layout.pathCoords) {
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
    pathSegs,
    pathSet,
    grid,
    pathTileMap,
    waypoints: pathCoordsToWaypoints(layout.pathCoords, tileSize),
  };
}
