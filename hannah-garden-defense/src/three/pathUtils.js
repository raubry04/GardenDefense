/**
 * Path tile rotation helpers + fixed zone layouts.
 * Grid: +X = E, -X = W, +Z = S, -Z = N.
 */

export const TILE_FILES = {
  straight: 'tile-straight.glb',
  corner: 'tile-corner-round.glb',
  spawn: 'tile-spawn-round.glb',
  end: 'tile-end-round.glb',
  grass: 'tile.glb',
};

/** Build a cardinal path between two tile coords (inclusive). */
function lineCoords(x0, z0, x1, z1) {
  const coords = [];
  if (x0 === x1) {
    const step = z0 < z1 ? 1 : -1;
    for (let z = z0; z !== z1 + step; z += step) coords.push({ x: x0, z });
  } else {
    const step = x0 < x1 ? 1 : -1;
    for (let x = x0; x !== x1 + step; x += step) coords.push({ x, z: z0 });
  }
  return coords;
}

/** Merge path segments without duplicating shared endpoints. */
function joinPaths(...segments) {
  const result = [];
  for (const seg of segments) {
    for (const c of seg) {
      const last = result[result.length - 1];
      if (!last || last.x !== c.x || last.z !== c.z) result.push(c);
    }
  }
  return result;
}

/** Zone 1 — serpentine meadow path. */
export const LAYOUT_C = {
  id: 'C',
  name: 'Sunflower Meadow',
  gridW: 18,
  gridH: 12,
  margin: 3,
  pathCoords: [
    { x: 0, z: 5 },
    { x: 1, z: 5 }, { x: 2, z: 5 }, { x: 3, z: 5 },
    { x: 3, z: 6 }, { x: 3, z: 7 }, { x: 3, z: 8 },
    { x: 4, z: 8 }, { x: 5, z: 8 }, { x: 6, z: 8 }, { x: 7, z: 8 }, { x: 8, z: 8 },
    { x: 8, z: 7 }, { x: 8, z: 6 }, { x: 8, z: 5 }, { x: 8, z: 4 }, { x: 8, z: 3 },
    { x: 9, z: 3 }, { x: 10, z: 3 }, { x: 11, z: 3 }, { x: 12, z: 3 },
    { x: 12, z: 4 }, { x: 12, z: 5 }, { x: 12, z: 6 }, { x: 12, z: 7 },
    { x: 13, z: 7 }, { x: 14, z: 7 }, { x: 15, z: 7 }, { x: 16, z: 7 }, { x: 17, z: 7 },
  ],
};

/** Zone 2 — wide S-curve through vegetable rows. */
export const LAYOUT_GARDEN = {
  id: 'garden',
  name: 'Vegetable Garden',
  gridW: 20,
  gridH: 12,
  margin: 3,
  pathCoords: joinPaths(
    lineCoords(0, 3, 9, 3),
    lineCoords(9, 3, 9, 8),
    lineCoords(9, 8, 18, 8),
    lineCoords(18, 8, 18, 10),
  ),
};

/** Zone 3 — U-turn around the coop. */
export const LAYOUT_COOP = {
  id: 'coop',
  name: 'Chicken Coop',
  gridW: 20,
  gridH: 12,
  margin: 3,
  pathCoords: joinPaths(
    lineCoords(0, 2, 10, 2),
    lineCoords(10, 2, 10, 9),
    lineCoords(10, 9, 17, 9),
    lineCoords(17, 9, 17, 2),
    lineCoords(17, 2, 19, 2),
  ),
};

/** Zone 4 — horizontal zigzag through berry rows. */
export const LAYOUT_BERRY = {
  id: 'berry',
  name: 'Berry Patch',
  gridW: 20,
  gridH: 12,
  margin: 3,
  pathCoords: joinPaths(
    lineCoords(0, 2, 18, 2),
    lineCoords(18, 2, 18, 3),
    lineCoords(18, 3, 0, 3),
    lineCoords(0, 3, 0, 4),
    lineCoords(0, 4, 18, 4),
    lineCoords(18, 4, 18, 5),
    lineCoords(18, 5, 0, 5),
    lineCoords(0, 5, 0, 6),
    lineCoords(0, 6, 18, 6),
    lineCoords(18, 6, 18, 7),
    lineCoords(18, 7, 0, 7),
    lineCoords(0, 7, 0, 8),
    lineCoords(0, 8, 18, 8),
    lineCoords(18, 8, 18, 9),
    lineCoords(18, 9, 19, 9),
  ),
};

/** Zone 5 — orchard perimeter loop ending at the barn. */
export const LAYOUT_ORCHARD = {
  id: 'orchard',
  name: 'Apple Orchard',
  gridW: 20,
  gridH: 12,
  margin: 3,
  pathCoords: joinPaths(
    lineCoords(0, 1, 17, 1),
    lineCoords(17, 1, 17, 9),
    lineCoords(17, 9, 3, 9),
    lineCoords(3, 9, 3, 4),
    lineCoords(3, 4, 14, 4),
    lineCoords(14, 4, 14, 7),
    lineCoords(14, 7, 6, 7),
    lineCoords(6, 7, 6, 6),
    lineCoords(6, 6, 19, 6),
  ),
};

/** One layout per campaign zone; endless reuses orchard. */
export const ZONE_LAYOUTS = [
  LAYOUT_C,
  LAYOUT_GARDEN,
  LAYOUT_COOP,
  LAYOUT_BERRY,
  LAYOUT_ORCHARD,
];

export function dirBetween(ax, az, bx, bz) {
  const dx = bx - ax;
  const dz = bz - az;
  if (dx === 1 && dz === 0) return 'E';
  if (dx === -1 && dz === 0) return 'W';
  if (dx === 0 && dz === 1) return 'S';
  if (dx === 0 && dz === -1) return 'N';
  return null;
}

export function dirBetweenPoints(a, b) {
  return dirBetween(a.x, a.z, b.x, b.z);
}

export function rotationForStraight(fromDir) {
  return (fromDir === 'E' || fromDir === 'W') ? Math.PI / 2 : 0;
}

export function rotationForEnd(fromDir) {
  return { N: 0, E: Math.PI / 2, S: Math.PI, W: Math.PI * 1.5 }[fromDir] ?? 0;
}

export function rotationForCorner(fromDir, toDir) {
  const key = `${fromDir},${toDir}`;
  const CORNER_ROT = {
    'N,E': 0, 'W,S': 0,
    'N,W': Math.PI / 2, 'E,S': Math.PI / 2,
    'E,N': Math.PI, 'S,W': Math.PI,
    'S,E': Math.PI * 1.5, 'W,N': Math.PI * 1.5,
  };
  return CORNER_ROT[key] ?? 0;
}

export function buildPathFromCoords(coords) {
  const segments = [];
  for (let i = 0; i < coords.length; i++) {
    const curr = coords[i];
    const prev = coords[i - 1];
    const next = coords[i + 1];

    if (i === 0) {
      const dirOut = dirBetweenPoints(curr, next);
      segments.push({
        x: curr.x, z: curr.z, model: 'spawn', file: TILE_FILES.spawn,
        rot: rotationForStraight(dirOut), dirIn: null, dirOut,
      });
    } else if (i === coords.length - 1) {
      const dirIn = dirBetweenPoints(prev, curr);
      segments.push({
        x: curr.x, z: curr.z, model: 'end', file: TILE_FILES.end,
        rot: rotationForEnd(dirIn), dirIn, dirOut: null,
      });
    } else {
      const dirIn = dirBetweenPoints(prev, curr);
      const dirOut = dirBetweenPoints(curr, next);
      if (dirIn === dirOut) {
        segments.push({
          x: curr.x, z: curr.z, model: 'straight', file: TILE_FILES.straight,
          rot: rotationForStraight(dirIn), dirIn, dirOut,
        });
      } else {
        segments.push({
          x: curr.x, z: curr.z, model: 'corner', file: TILE_FILES.corner,
          rot: rotationForCorner(dirIn, dirOut), dirIn, dirOut,
        });
      }
    }
  }
  return segments;
}

export function pathSetFromSegments(path) {
  return new Set(path.map((s) => `${s.x},${s.z}`));
}

/** Interpolate enemy position along pathCoords using wpIndex and segment t (0–1). */
export function positionOnPath(pathCoords, wpIndex, t) {
  if (wpIndex >= pathCoords.length - 1) {
    const last = pathCoords[pathCoords.length - 1];
    return { x: last.x, z: last.z };
  }
  const a = pathCoords[wpIndex];
  const b = pathCoords[wpIndex + 1];
  return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t };
}
