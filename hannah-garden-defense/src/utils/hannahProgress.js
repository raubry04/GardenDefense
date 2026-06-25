import { GameConfig } from '../config.js';

export const STORAGE_KEY = 'hannahGarden_progress';

export const DEFAULT_PROGRESS = {
  playerName: '',
  hannahLevel: 1,
  hannahXp: 0,
  gardenLevel: 1,
  sunshinePoints: GameConfig.startingSunshinePoints.zone1,
  unlockedZone: 0,
  zoneStars: {},
  zoneBattles: {},
  battleStars: {},
  towerUpgrades: {},
};

/**
 * Derive Hannah's level from cumulative XP using config thresholds.
 * @param {number} xp
 * @returns {number}
 */
export function hannahLevelFromXp(xp) {
  const thresholds = GameConfig.hannahXpThresholds;
  let level = 1;
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (xp >= thresholds[i]) {
      level = i + 1;
      break;
    }
  }
  return Math.min(level, thresholds.length);
}

/**
 * Cooldown in ms after Hannah level reduction.
 * @param {number} baseCooldown
 * @param {number} hannahLevel
 * @returns {number}
 */
export function adjustedAbilityCooldown(baseCooldown, hannahLevel) {
  const factor = Math.max(0.5, 1 - (hannahLevel - 1) * 0.05);
  return baseCooldown * factor;
}

/**
 * Merge partial progress onto defaults.
 * @param {object} [raw]
 * @returns {object}
 */
export function normalizeProgress(raw) {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_PROGRESS };
  return {
    ...DEFAULT_PROGRESS,
    ...raw,
    zoneStars: raw.zoneStars || {},
    zoneBattles: raw.zoneBattles || {},
    battleStars: raw.battleStars || {},
    towerUpgrades: raw.towerUpgrades || {},
    hannahLevel: raw.hannahLevel ?? hannahLevelFromXp(raw.hannahXp ?? 0),
  };
}

/**
 * Load saved progress from localStorage (sync fallback).
 * @param {string} [playerName]
 * @returns {object}
 */
export function loadLocalProgress(playerName) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const progress = normalizeProgress(JSON.parse(raw));
      if (playerName) progress.playerName = playerName;
      return progress;
    }
  } catch { /* ignore */ }
  return normalizeProgress({ playerName: playerName || '' });
}

/**
 * Persist progress to localStorage.
 * @param {object} progress
 */
export function saveLocalProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeProgress(progress)));
  } catch (e) {
    console.warn('Failed to save progress locally:', e);
  }
}

/**
 * Map local progress to server API payload.
 * @param {object} progress
 * @returns {object}
 */
export function progressToServerPayload(progress) {
  const data = normalizeProgress(progress);
  return {
    player_name: data.playerName || 'Player',
    hannah_level: data.hannahLevel,
    hannah_xp: data.hannahXp,
    garden_level: data.gardenLevel,
    sunshine_points: data.sunshinePoints,
    battle_stars: JSON.stringify(data.battleStars || {}),
  };
}

/**
 * Map server row to local progress shape.
 * @param {object} row
 * @param {string} [playerName]
 * @returns {object}
 */
export function serverRowToProgress(row, playerName) {
  if (!row) return loadLocalProgress(playerName);
  let battleStars = {};
  try {
    battleStars = typeof row.battle_stars === 'string'
      ? JSON.parse(row.battle_stars)
      : (row.battle_stars || {});
  } catch { /* ignore */ }

  const local = loadLocalProgress(playerName);
  return normalizeProgress({
    ...local,
    playerName: row.player_name || playerName || local.playerName,
    hannahLevel: row.hannah_level ?? local.hannahLevel,
    hannahXp: row.hannah_xp ?? local.hannahXp,
    gardenLevel: row.garden_level ?? local.gardenLevel,
    sunshinePoints: row.sunshine_points ?? local.sunshinePoints,
    battleStars,
  });
}

/**
 * Save locally and attempt server sync.
 * @param {object} progress
 * @returns {Promise<object>}
 */
export async function saveProgressWithSync(progress) {
  const data = normalizeProgress(progress);
  saveLocalProgress(data);

  try {
    await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(progressToServerPayload(data)),
    });
  } catch { /* offline – local save is sufficient */ }

  return data;
}

/**
 * Load from server when available, otherwise localStorage.
 * @param {string} playerName
 * @returns {Promise<object>}
 */
export async function loadProgress(playerName) {
  try {
    const res = await fetch(`/api/progress/${encodeURIComponent(playerName)}`);
    if (res.ok) {
      const row = await res.json();
      const merged = serverRowToProgress(row, playerName);
      saveLocalProgress(merged);
      return merged;
    }
  } catch { /* network unavailable */ }

  return loadLocalProgress(playerName);
}

/**
 * Apply purchased upgrade tiers to tower base stats.
 * @param {string} type
 * @param {number} tier
 * @returns {object}
 */
export function applyTowerTierStats(type, tier) {
  const base = GameConfig.towers[type];
  if (!base) return {};
  const stats = { ...base };
  for (let i = 0; i < tier; i++) {
    const upgrade = base.upgrades?.[i];
    if (!upgrade) continue;
    for (const [key, value] of Object.entries(upgrade)) {
      if (key !== 'cost') stats[key] = value;
    }
  }
  return stats;
}

/**
 * Sum per-battle stars for a zone.
 * @param {Record<number, number>} zoneBattleStars
 * @returns {number}
 */
export function sumZoneStars(zoneBattleStars) {
  if (!zoneBattleStars) return 0;
  return Object.values(zoneBattleStars).reduce((sum, s) => sum + (s || 0), 0);
}
