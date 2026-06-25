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

/** Layout C — Kingdom Rush style (Zone 1 default). */
export const LAYOUT_C = {
  id: 'C',
  name: 'Kingdom Rush Style',
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
