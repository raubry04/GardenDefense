import { GameConfig } from '../config.js';

export const STORAGE_KEY = 'hannahGarden_progress';

export const DEFAULT_PROGRESS = {
  playerName: '',
  hannahLevel: 1,
  hannahXp: 0,
  gardenLevel: 1,
  sunshinePoints: 0,
  unlockedZone: 0,
  zoneStars: {},
  zoneBattles: {},
  battleStars: {},
  towerUpgrades: {},
};

/**
 * Convert in-battle sunshine earnings into upgrade-bank deposit.
 * In-battle rewards stay at full value for tower placement; only meta bank uses this rate.
 * @param {number} amount
 * @returns {number}
 */
export function battleSunshineToMetaBank(amount) {
  const rate = GameConfig.metaSunshineBankRate ?? 0.2;
  return Math.max(0, Math.floor(amount * rate));
}

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
    unlocked_zone: data.unlockedZone ?? 0,
    zone_stars: JSON.stringify(data.zoneStars || {}),
    zone_battles: JSON.stringify(data.zoneBattles || {}),
    tower_upgrades: JSON.stringify(data.towerUpgrades || {}),
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
  let zoneStars = {};
  let zoneBattles = {};
  let towerUpgrades = {};
  try {
    battleStars = typeof row.battle_stars === 'string'
      ? JSON.parse(row.battle_stars)
      : (row.battle_stars || {});
  } catch { /* ignore */ }
  try {
    zoneStars = typeof row.zone_stars === 'string'
      ? JSON.parse(row.zone_stars)
      : (row.zone_stars || {});
  } catch { /* ignore */ }
  try {
    zoneBattles = typeof row.zone_battles === 'string'
      ? JSON.parse(row.zone_battles)
      : (row.zone_battles || {});
  } catch { /* ignore */ }
  try {
    towerUpgrades = typeof row.tower_upgrades === 'string'
      ? JSON.parse(row.tower_upgrades)
      : (row.tower_upgrades || {});
  } catch { /* ignore */ }

  return normalizeProgress({
    playerName: row.player_name || playerName || '',
    hannahLevel: row.hannah_level,
    hannahXp: row.hannah_xp,
    gardenLevel: row.garden_level,
    sunshinePoints: row.sunshine_points,
    unlockedZone: row.unlocked_zone,
    battleStars,
    zoneStars,
    zoneBattles,
    towerUpgrades,
  });
}

function mergeNestedBattleStars(a = {}, b = {}) {
  const out = { ...a };
  for (const [zone, battles] of Object.entries(b)) {
    if (!out[zone]) out[zone] = { ...battles };
    else {
      for (const [battle, stars] of Object.entries(battles || {})) {
        out[zone][battle] = Math.max(out[zone][battle] || 0, stars || 0);
      }
    }
  }
  return out;
}

function mergeNumericRecord(a = {}, b = {}) {
  const out = { ...a };
  for (const [key, value] of Object.entries(b)) {
    out[key] = Math.max(out[key] || 0, value || 0);
  }
  return out;
}

/**
 * Merge local and remote progress, keeping best progress per field.
 * @param {object} local
 * @param {object} remote
 * @returns {object}
 */
export function mergeProgressRecords(local, remote) {
  const a = normalizeProgress(local);
  const b = normalizeProgress(remote);
  const battleStars = mergeNestedBattleStars(a.battleStars, b.battleStars);
  const zoneBattles = mergeNumericRecord(a.zoneBattles, b.zoneBattles);
  const towerUpgrades = mergeNumericRecord(a.towerUpgrades, b.towerUpgrades);

  const zoneStars = mergeNumericRecord(a.zoneStars, b.zoneStars);
  for (const zone of new Set([...Object.keys(battleStars), ...Object.keys(zoneStars)])) {
    const fromBattles = sumZoneStars(battleStars[zone]);
    zoneStars[zone] = Math.max(zoneStars[zone] || 0, fromBattles);
  }

  return normalizeProgress({
    playerName: a.playerName || b.playerName,
    hannahXp: Math.max(a.hannahXp, b.hannahXp),
    hannahLevel: Math.max(a.hannahLevel, b.hannahLevel, hannahLevelFromXp(Math.max(a.hannahXp, b.hannahXp))),
    gardenLevel: Math.max(a.gardenLevel, b.gardenLevel),
    sunshinePoints: Math.max(a.sunshinePoints, b.sunshinePoints),
    unlockedZone: Math.max(a.unlockedZone ?? 0, b.unlockedZone ?? 0),
    battleStars,
    zoneBattles,
    zoneStars,
    towerUpgrades,
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
    const res = await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(progressToServerPayload(data)),
    });
    if (!res.ok) {
      console.warn('Progress sync failed:', res.status);
    }
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
    if (res.status === 404) {
      return loadLocalProgress(playerName);
    }
    if (res.ok) {
      const row = await res.json();
      const remote = serverRowToProgress(row, playerName);
      const local = loadLocalProgress(playerName);
      const merged = mergeProgressRecords(local, remote);
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
