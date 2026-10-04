import { GameConfig } from '../config.js';

/**
 * Resolve intra-zone battle modifiers for a campaign battle.
 * @param {number} zone
 * @param {number} battle
 * @returns {{
 *   ids: string[],
 *   reversePath: boolean,
 *   mirrorPath: boolean,
 *   nightTint: boolean,
 *   wind: boolean,
 *   flyersHeavy: boolean,
 *   windSpeedMult: number,
 *   nightTintColor: number,
 *   nightTintAlpha: number,
 *   flyersHeavyFromWaveFraction: number,
 *   flyerTypes: string[],
 * }}
 */
export function resolveBattleModifiers(zone, battle) {
  const cfg = GameConfig.battleModifiers || {};
  const byIndex = cfg.byBattleIndex || {};
  const raw = Array.isArray(byIndex[battle]) ? byIndex[battle] : [];
  const zoneEnemies = GameConfig.zones?.[zone]?.enemies || [];
  const flyerTypes = cfg.flyerTypes || ['PARROT'];
  const zoneHasFlyer = flyerTypes.some((t) => zoneEnemies.includes(t));
  const pathLayouts = cfg.pathLayoutByBattleIndex || {};
  const layoutId = pathLayouts[battle] ?? null;

  const ids = raw.filter((id) => {
    if (id === 'flyersHeavy' && !zoneHasFlyer) return false;
    return true;
  });

  return {
    ids,
    layoutId,
    reversePath: ids.includes('reversePath'),
    mirrorPath: ids.includes('mirrorPath'),
    nightTint: ids.includes('nightTint'),
    wind: ids.includes('wind'),
    flyersHeavy: ids.includes('flyersHeavy'),
    windSpeedMult: cfg.windSpeedMult ?? 1.15,
    nightTintColor: cfg.nightTint ?? 0x1a2848,
    nightTintAlpha: cfg.nightTintAlpha ?? 0.2,
    flyersHeavyFromWaveFraction: cfg.flyersHeavyFromWaveFraction ?? 0.4,
    flyerTypes,
  };
}

/**
 * Kid-facing label for active modifiers (HUD / preview).
 * @param {{ ids?: string[], layoutId?: string|null }} mods
 * @returns {string|null}
 */
export function battleModifierLabel(mods) {
  const parts = [];
  const layoutNames = {
    hairpin: 'Hairpin trail',
    diagonalS: 'Diagonal path',
    wideLoop: 'Wide loop',
  };
  if (mods?.layoutId && layoutNames[mods.layoutId]) {
    parts.push(layoutNames[mods.layoutId]);
  }
  const ids = mods?.ids || [];
  const labels = {
    reversePath: 'Reverse path',
    mirrorPath: 'Mirrored path',
    nightTint: 'Night garden',
    wind: 'Windy!',
    flyersHeavy: 'Sky swarm',
  };
  for (const id of ids) {
    if (labels[id]) parts.push(labels[id]);
  }
  return parts.length ? parts.join(' · ') : null;
}
