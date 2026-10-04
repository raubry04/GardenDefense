import { describe, it, expect } from 'vitest';
import { getZoneLayout, buildCanvasMapData, pathCoordsToWaypoints } from '../src/utils/pathTile2D.js';

describe('getZoneLayout', () => {
  it('returns a layout for valid zones', () => {
    const layout = getZoneLayout(0);
    expect(layout.pathCoords.length).toBeGreaterThan(1);
    expect(layout.gridW).toBeGreaterThan(0);
  });

  it('falls back to orchard for out-of-range zones', () => {
    const fallback = getZoneLayout(99);
    expect(fallback.pathCoords.length).toBeGreaterThan(1);
    expect(fallback.gridW).toBeGreaterThan(0);
  });
});

describe('buildCanvasMapData', () => {
  it('marks path cells and playable grass', () => {
    const { grid, pathTileMap } = buildCanvasMapData(0, 20, 11, 64, { centerLayout: true });
    const pathCells = grid.flat().filter((c) => c === 'path').length;
    const grassCells = grid.flat().filter((c) => c === 'grass').length;
    expect(pathCells).toBeGreaterThan(0);
    expect(grassCells).toBeGreaterThan(0);
    expect(Object.keys(pathTileMap).length).toBe(pathCells);
  });

  it('lets you place anywhere inside the garden, not only beside the path', () => {
    const map = buildCanvasMapData(0, 20, 12, 64, { centerLayout: true });
    let interiorBlocked = 0;
    let interiorGrass = 0;
    for (let r = 0; r < map.rows; r++) {
      for (let c = 0; c < map.cols; c++) {
        const localCol = c - map.colOffset;
        const localRow = r - map.rowOffset;
        const inside = localCol >= 0 && localCol < map.layout.gridW
          && localRow >= 0 && localRow < map.layout.gridH;
        if (!inside || map.grid[r][c] === 'path') continue;
        if (map.grid[r][c] === 'blocked') interiorBlocked += 1;
        if (map.grid[r][c] === 'grass') interiorGrass += 1;
      }
    }
    expect(interiorBlocked).toBe(0);
    expect(interiorGrass).toBeGreaterThan(10);
  });

  it('bottomReserveRows lifts path waypoints above the tray band', () => {
    const cols = 20;
    const rows = 14;
    const tile = 64;
    const without = buildCanvasMapData(0, cols, rows, tile, {
      centerLayout: true,
      bottomReserveRows: 0,
    });
    const withReserve = buildCanvasMapData(0, cols, rows, tile, {
      centerLayout: true,
      bottomReserveRows: 3,
    });
    const maxY = (map) => Math.max(...map.waypoints.map((w) => w.y));
    expect(maxY(withReserve)).toBeLessThan(maxY(without));
    expect(withReserve.rowOffset).toBeLessThanOrEqual(without.rowOffset);
    // Reserved band stays clear of path cells.
    const reserveStart = rows - 3;
    for (let r = reserveStart; r < rows; r++) {
      expect(withReserve.grid[r].every((c) => c !== 'path')).toBe(true);
    }
  });

  it('bottomReserveRows clears tray band on battle-sized grids', () => {
    const cols = Math.ceil(1280 / 64);
    const rows = Math.ceil(720 / 64);
    const withReserve = buildCanvasMapData(1, cols, rows, 64, {
      centerLayout: true,
      bottomReserveRows: 3,
    });
    const maxPathRow = Math.max(
      ...[...withReserve.pathSet].map((k) => Number(k.split(',')[1])),
    );
    expect(maxPathRow).toBeLessThan(rows - 3);
    expect(Math.max(...withReserve.waypoints.map((w) => w.y))).toBeLessThan(
      (rows - 3) * 64,
    );
  });
});

describe('pathCoordsToWaypoints', () => {
  it('centers waypoints in tile space', () => {
    const wps = pathCoordsToWaypoints([{ x: 0, z: 0 }], 64);
    expect(wps[0]).toEqual({ x: 32, y: 32 });
  });
});
