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
});

describe('pathCoordsToWaypoints', () => {
  it('centers waypoints in tile space', () => {
    const wps = pathCoordsToWaypoints([{ x: 0, z: 0 }], 64);
    expect(wps[0]).toEqual({ x: 32, y: 32 });
  });
});
