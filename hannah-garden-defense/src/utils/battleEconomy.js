import { GameConfig } from '../config.js';

export function towerPlacementCost(type, existingCount = 0) {
  const base = GameConfig.towers[type]?.cost ?? 0;
  const step = GameConfig.duplicateTowerCostStep ?? 0;
  return Math.ceil(base * (1 + Math.max(0, existingCount) * step));
}

/** Starting sunshine for a zone index (endless uses zone >= zones.length). */
export function startingSunshineForZone(zone) {
  const pts = GameConfig.startingSunshinePoints;
  if (zone >= GameConfig.zones.length) {
    return pts.endless ?? pts.zone5 ?? 250;
  }
  return pts[`zone${zone + 1}`] ?? 150;
}
