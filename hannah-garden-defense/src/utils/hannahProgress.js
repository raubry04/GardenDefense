import { GameConfig } from '../config.js';

export const STORAGE_KEY = 'hannahGarden_progress';
export const PLAYER_NAME_KEY = 'hannahGarden_playerName';

/**
 * Sanitize a player name into a stable localStorage suffix so each player gets an
 * isolated progress bucket on shared devices. Robust to empty/undefined names.
 * @param {string} [name]
 * @returns {string} lowercase alphanumeric slug, or 'default' when empty
 */
export function sanitizeProgressName(name) {
  const slug = String(name ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return slug || 'default';
}

/**
 * Per-player localStorage key. Always suffixed, so it never collides with the
 * legacy shared key (STORAGE_KEY).
 * @param {string} [name]
 * @returns {string}
 */
export function progressStorageKey(name) {
  return `${STORAGE_KEY}_${sanitizeProgressName(name)}`;
}

/**
 * One-time migration: if a player has no per-player bucket yet but the legacy
 * shared blob exists, adopt it for this player and remove the legacy key.
 *
 * We clear the legacy blob after copying it so the SAME shared blob can't later
 * bleed into a second player's namespace (the exact data-mixing bug this fixes).
 * The current player keeps all their data via the freshly-written per-player key.
 * @param {string} perPlayerKey
 * @returns {string | null} the migrated raw blob, or null if nothing migrated
 */
function migrateLegacyProgress(perPlayerKey) {
  try {
    if (localStorage.getItem(perPlayerKey) != null) return null;
    const legacy = localStorage.getItem(STORAGE_KEY);
    if (legacy == null) return null;
    localStorage.setItem(perPlayerKey, legacy);
    localStorage.removeItem(STORAGE_KEY);
    return legacy;
  } catch {
    return null;
  }
}

/**
 * Read the saved player name. Guarded so iOS Safari Private Mode (which can throw
 * on localStorage access) never crashes scene init.
 * @returns {string}
 */
export function loadPlayerName() {
  try {
    return localStorage.getItem(PLAYER_NAME_KEY) || '';
  } catch {
    return '';
  }
}

/**
 * Persist the player name. Guarded against localStorage throwing (private mode / quota).
 * @param {string} name
 */
export function savePlayerName(name) {
  try {
    localStorage.setItem(PLAYER_NAME_KEY, name);
  } catch {
    /* storage unavailable */
  }
}

export const DEFAULT_PROGRESS = {
  playerName: '',
  hannahLevel: 1,
  hannahXp: 0,
  gardenLevel: 1,
  // Meta "sunshine bank" is modelled as two monotonic (merge-safe via MAX) totals.
  // The spendable balance is DERIVED: available = max(0, earned - spent).
  // `sunshinePoints` is kept as that derived value for backward compatibility
  // (server column, older reads); never treat it as an independently writable balance.
  metaSunshineEarned: 0,
  metaSunshineSpent: 0,
  sunshinePoints: 0,
  unlockedZone: 0,
  zoneStars: {},
  zoneBattles: {},
  battleStars: {},
  towerUpgrades: {},
};

/**
 * Spendable meta-bank balance derived from the monotonic earned/spent totals.
 * All reads and affordability checks should go through this helper rather than
 * reading a raw balance field. Falls back to a legacy `sunshinePoints` balance
 * for records that predate the earned/spent model.
 * @param {object} progress
 * @returns {number}
 */
export function availableMetaBank(progress) {
  if (!progress || typeof progress !== 'object') return 0;
  if (progress.metaSunshineEarned != null && Number.isFinite(Number(progress.metaSunshineEarned))) {
    const earned = Math.max(0, Number(progress.metaSunshineEarned) || 0);
    const spent = Math.max(0, Number(progress.metaSunshineSpent) || 0);
    return Math.max(0, earned - spent);
  }
  const legacy = Number(progress.sunshinePoints);
  return Number.isFinite(legacy) && legacy > 0 ? legacy : 0;
}

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
  const rawXp = Number(raw.hannahXp);
  const hannahXp = Number.isFinite(rawXp) && rawXp >= 0 ? rawXp : DEFAULT_PROGRESS.hannahXp;
  // Derive level from XP and never let a stale/lower stored level win — the level
  // can't be lower than the accumulated XP warrants.
  const levelFromXp = hannahLevelFromXp(hannahXp);
  const rawLevel = Number(raw.hannahLevel);
  const storedLevel = Number.isFinite(rawLevel) ? rawLevel : levelFromXp;

  // Meta-bank migration + normalization.
  // New model: metaSunshineEarned / metaSunshineSpent (both monotonic).
  // Legacy records only carry `sunshinePoints` (current spendable balance) — seed
  // earned from it and leave spent at 0 so the available balance is unchanged.
  const rawEarned = Number(raw.metaSunshineEarned);
  const rawSpent = Number(raw.metaSunshineSpent);
  let metaSunshineEarned;
  let metaSunshineSpent;
  if (raw.metaSunshineEarned != null && Number.isFinite(rawEarned)) {
    metaSunshineEarned = Math.max(0, Math.floor(rawEarned));
    metaSunshineSpent = raw.metaSunshineSpent != null && Number.isFinite(rawSpent)
      ? Math.max(0, Math.floor(rawSpent))
      : 0;
  } else {
    const legacyBank = Number(raw.sunshinePoints);
    metaSunshineEarned = Number.isFinite(legacyBank) && legacyBank > 0 ? Math.floor(legacyBank) : 0;
    metaSunshineSpent = 0;
  }
  const sunshinePoints = Math.max(0, metaSunshineEarned - metaSunshineSpent);

  return {
    ...DEFAULT_PROGRESS,
    ...raw,
    hannahXp,
    zoneStars: raw.zoneStars || {},
    zoneBattles: raw.zoneBattles || {},
    battleStars: raw.battleStars || {},
    towerUpgrades: raw.towerUpgrades || {},
    hannahLevel: Math.max(storedLevel, levelFromXp),
    metaSunshineEarned,
    metaSunshineSpent,
    sunshinePoints,
  };
}

/**
 * Load saved progress from localStorage (sync fallback).
 * @param {string} [playerName]
 * @returns {object}
 */
export function loadLocalProgress(playerName) {
  const key = progressStorageKey(playerName);
  try {
    let raw = localStorage.getItem(key);
    if (raw == null) {
      raw = migrateLegacyProgress(key);
    }
    if (raw) {
      const progress = normalizeProgress(JSON.parse(raw));
      if (playerName) progress.playerName = playerName;
      return progress;
    }
  } catch { /* ignore */ }
  return normalizeProgress({ playerName: playerName || '' });
}

/**
 * Persist progress to localStorage, namespaced to the progress's own player name.
 * @param {object} progress
 */
export function saveLocalProgress(progress) {
  const data = normalizeProgress(progress);
  try {
    localStorage.setItem(progressStorageKey(data.playerName), JSON.stringify(data));
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
    // Derived spendable balance, retained for backward compatibility.
    sunshine_points: data.sunshinePoints,
    // Canonical monotonic meta-bank totals.
    meta_sunshine_earned: data.metaSunshineEarned,
    meta_sunshine_spent: data.metaSunshineSpent,
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
    // Legacy rows lack these columns (undefined/null) → normalizeProgress seeds
    // earned from sunshine_points so the available balance is preserved.
    metaSunshineEarned: row.meta_sunshine_earned,
    metaSunshineSpent: row.meta_sunshine_spent,
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
    // Both meta-bank totals are monotonic: MAX-merging each keeps racing writers
    // from losing progress AND lets spending persist (spent only ever grows, so a
    // later lower available balance survives instead of re-inflating). The derived
    // available balance is recomputed by normalizeProgress.
    metaSunshineEarned: Math.max(a.metaSunshineEarned, b.metaSunshineEarned),
    metaSunshineSpent: Math.max(a.metaSunshineSpent, b.metaSunshineSpent),
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
 * Friendly names for level-up unlock callouts.
 */
const UNLOCK_LABELS = {
  RABBIT: 'Rabbit Guard',
  CHICKEN: 'Chicken Cannon',
  DOG: 'Dog Patrol',
  OWL: 'Owl Sniper',
  DUCK: 'Duck Sprinkler',
  PENGUIN: 'Penguin Freezer',
  PIG_WALL: 'Pig Wall',
  SUNSHINE_BURST: 'Sunshine Burst',
  GARDEN_RAIN: 'Garden Rain',
  RAINBOW_SHIELD: 'Rainbow Shield',
  FLOWER_BOMB: 'Flower Bomb',
};

/**
 * What newly becomes available exactly at a given Hannah level.
 * Only level-gated content is returned (zone-gated towers unlock via zones, not levels).
 * @param {number} level
 * @returns {{ towers: string[], abilities: string[], passive: object | null }}
 */
export function unlocksAtLevel(level) {
  const towers = [];
  for (const [type, cfg] of Object.entries(GameConfig.towers || {})) {
    if (cfg.unlock?.type === 'level' && cfg.unlock.value === level) towers.push(type);
  }
  const abilities = [];
  for (const [key, cfg] of Object.entries(GameConfig.hannahAbilities || {})) {
    if (cfg.unlockLevel === level) abilities.push(key);
  }
  const passive = GameConfig.hannahPassives?.[level] ?? null;
  return { towers, abilities, passive };
}

/**
 * Build a short, child-friendly celebration line for a level-up, or null if nothing new.
 * @param {number} level
 * @returns {string | null}
 */
export function levelUpUnlockMessage(level) {
  const { towers, abilities, passive } = unlocksAtLevel(level);
  const first = towers[0] ?? abilities[0];
  if (first) {
    return `${UNLOCK_LABELS[first] ?? first} unlocked!`;
  }
  if (passive?.label) {
    return `New bonus: ${passive.label}!`;
  }
  return null;
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
