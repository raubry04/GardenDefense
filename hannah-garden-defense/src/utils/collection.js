import { GameConfig } from '../config.js';

/** Default collection blob persisted on progress. */
export const DEFAULT_COLLECTION = {
  stickers: {},
  skins: ['default'],
  equippedSkin: 'default',
  mapProps: [],
  mastery: {},
  bonusAbility: null,
  towerStickers: {},
};

/**
 * Normalize a collection blob (or missing/partial) onto defaults.
 * @param {object} [raw]
 * @returns {object}
 */
export function normalizeCollection(raw) {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_COLLECTION, stickers: {}, towerStickers: {}, mastery: {}, skins: ['default'], mapProps: [] };
  const stickers = raw.stickers && typeof raw.stickers === 'object' ? { ...raw.stickers } : {};
  const mastery = raw.mastery && typeof raw.mastery === 'object' ? { ...raw.mastery } : {};
  const towerStickers = raw.towerStickers && typeof raw.towerStickers === 'object'
    ? { ...raw.towerStickers }
    : {};
  const skinsRaw = Array.isArray(raw.skins) ? raw.skins.filter((s) => typeof s === 'string') : [];
  const skins = skinsRaw.includes('default') ? [...new Set(skinsRaw)] : ['default', ...new Set(skinsRaw)];
  const mapProps = Array.isArray(raw.mapProps)
    ? [...new Set(raw.mapProps.filter((p) => typeof p === 'string'))]
    : [];
  let equippedSkin = typeof raw.equippedSkin === 'string' ? raw.equippedSkin : 'default';
  if (!skins.includes(equippedSkin)) equippedSkin = 'default';
  const bonusAbility = typeof raw.bonusAbility === 'string' ? raw.bonusAbility : null;
  return {
    stickers,
    skins,
    equippedSkin,
    mapProps,
    mastery,
    bonusAbility,
    towerStickers,
  };
}

/**
 * Merge two collection blobs — keep best sticker stars, union unlocks.
 * @param {object} a
 * @param {object} b
 * @returns {object}
 */
export function mergeCollections(a, b) {
  const left = normalizeCollection(a);
  const right = normalizeCollection(b);
  const stickers = { ...left.stickers };
  for (const [key, stars] of Object.entries(right.stickers)) {
    stickers[key] = Math.max(stickers[key] || 0, stars || 0);
  }
  const mastery = { ...left.mastery, ...right.mastery };
  for (const [zone, claimed] of Object.entries(right.mastery)) {
    if (claimed) mastery[zone] = true;
  }
  const towerStickers = { ...left.towerStickers, ...right.towerStickers };
  for (const [key, on] of Object.entries(right.towerStickers)) {
    if (on) towerStickers[key] = true;
  }
  const skins = [...new Set([...left.skins, ...right.skins])];
  const mapProps = [...new Set([...left.mapProps, ...right.mapProps])];
  let equippedSkin = left.equippedSkin || right.equippedSkin || 'default';
  if (!skins.includes(equippedSkin)) {
    equippedSkin = right.equippedSkin && skins.includes(right.equippedSkin)
      ? right.equippedSkin
      : 'default';
  }
  // Prefer an explicitly chosen bonus ability; otherwise take whichever is set.
  const bonusAbility = left.bonusAbility || right.bonusAbility || null;
  return normalizeCollection({
    stickers,
    skins,
    equippedSkin,
    mapProps,
    mastery,
    bonusAbility,
    towerStickers,
  });
}

/**
 * True when every battle in the zone has 3★.
 * @param {object} progress
 * @param {number} zoneIndex
 * @returns {boolean}
 */
export function isZoneMastered(progress, zoneIndex) {
  const zone = GameConfig.zones?.[zoneIndex];
  if (!zone) return false;
  const battles = zone.battles ?? 0;
  const stars = progress?.battleStars?.[zoneIndex] || progress?.battleStars?.[String(zoneIndex)] || {};
  for (let b = 0; b < battles; b++) {
    const s = stars[b] ?? stars[String(b)] ?? 0;
    if (s < 3) return false;
  }
  return battles > 0;
}

/**
 * Config entry for a zone's mastery reward (costume / prop / passive).
 * @param {number} zoneIndex
 * @returns {object | null}
 */
export function masteryRewardForZone(zoneIndex) {
  return GameConfig.zoneMasteryRewards?.[zoneIndex] ?? null;
}

/**
 * Apply mastery unlock into collection when the zone is fully 3★'d.
 * Idempotent — returns { collection, newlyUnlocked } describing the change.
 * @param {object} collection
 * @param {number} zoneIndex
 * @returns {{ collection: object, newlyUnlocked: object | null }}
 */
export function claimMasteryReward(collection, zoneIndex) {
  const col = normalizeCollection(collection);
  const key = String(zoneIndex);
  if (col.mastery[key] || col.mastery[zoneIndex]) {
    return { collection: col, newlyUnlocked: null };
  }
  const reward = masteryRewardForZone(zoneIndex);
  if (!reward) {
    col.mastery[key] = true;
    return { collection: col, newlyUnlocked: null };
  }

  col.mastery[key] = true;
  if (reward.type === 'skin' && reward.id) {
    if (!col.skins.includes(reward.id)) col.skins.push(reward.id);
    // Auto-equip the new costume the first time — kids see the reward immediately.
    col.equippedSkin = reward.id;
  } else if (reward.type === 'prop' && reward.id) {
    if (!col.mapProps.includes(reward.id)) col.mapProps.push(reward.id);
  }
  // Passives are looked up from config via claimed mastery keys — no extra field.

  return { collection: normalizeCollection(col), newlyUnlocked: reward };
}

/**
 * Grant / upgrade an enemy sticker from a battle clear.
 * First clear → at least 1; 3★ → 3 (album "shiny").
 * @param {object} collection
 * @param {string[]} enemyKeys
 * @param {number} stars
 * @returns {{ collection: object, newStickers: string[] }}
 */
export function grantBattleStickers(collection, enemyKeys, stars) {
  const col = normalizeCollection(collection);
  const newStickers = [];
  const quality = stars >= 3 ? 3 : 1;
  for (const key of enemyKeys || []) {
    if (!key || typeof key !== 'string') continue;
    const prev = col.stickers[key] || 0;
    const next = Math.max(prev, quality);
    if (next > prev) {
      col.stickers[key] = next;
      if (prev === 0) newStickers.push(key);
    }
    const towerKey = GameConfig.stickerTowerLinks?.[key];
    if (towerKey && next >= 1) {
      col.towerStickers[towerKey] = true;
    }
  }
  return { collection: normalizeCollection(col), newStickers };
}

/**
 * Enemies that appear in a campaign zone (for album fill on clear).
 * @param {number} zoneIndex
 * @returns {string[]}
 */
export function zoneEnemyKeys(zoneIndex) {
  const zone = GameConfig.zones?.[zoneIndex];
  return zone?.enemies ? [...zone.enemies] : [];
}

/**
 * Kid-facing skin display info.
 * @param {string} skinId
 * @returns {{ id: string, label: string, tint: number, emoji: string }}
 */
export function skinInfo(skinId) {
  const cfg = GameConfig.chickSkins?.[skinId];
  if (cfg) return { id: skinId, ...cfg };
  return {
    id: skinId || 'default',
    label: 'Chick',
    tint: 0xffffff,
    emoji: '🐥',
  };
}

/**
 * Sum tiny mastery passives claimed so far (starting sunshine, etc.).
 * @param {object} collection
 * @returns {{ startingSunshineBonus: number, labels: string[] }}
 */
export function masteryPassiveBonuses(collection) {
  const col = normalizeCollection(collection);
  let startingSunshineBonus = 0;
  const labels = [];
  for (const [zoneKey, claimed] of Object.entries(col.mastery)) {
    if (!claimed) continue;
    const reward = masteryRewardForZone(Number(zoneKey));
    if (!reward || reward.type !== 'passive') continue;
    if (reward.startingSunshineBonus) {
      startingSunshineBonus += reward.startingSunshineBonus;
    }
    if (reward.label) labels.push(reward.label);
  }
  return { startingSunshineBonus, labels };
}

/**
 * Core abilities always shown; bonus slot is pickable once unlocked.
 * @returns {string[]}
 */
export function coreAbilityKeys() {
  return GameConfig.abilityLoadout?.core || ['SUNSHINE_BURST', 'GARDEN_RAIN', 'RAINBOW_SHIELD'];
}

/**
 * Bonus abilities that can fill the selectable slot (ordered by unlock level).
 * @returns {string[]}
 */
export function bonusAbilityKeys() {
  return GameConfig.abilityLoadout?.bonusPool || ['SEED_STORM', 'FLOWER_BOMB'];
}

/**
 * Which bonus ability keys the player has unlocked by Hannah level.
 * @param {number} hannahLevel
 * @returns {string[]}
 */
export function unlockedBonusAbilities(hannahLevel) {
  const level = hannahLevel ?? 1;
  return bonusAbilityKeys().filter((key) => {
    const cfg = GameConfig.hannahAbilities?.[key];
    if (!cfg) return false;
    if (!cfg.unlockLevel) return true;
    return level >= cfg.unlockLevel;
  });
}

/**
 * Resolve the active bonus ability for battle UI (auto-pick when only one).
 * @param {object} collection
 * @param {number} hannahLevel
 * @returns {string | null}
 */
export function resolveBonusAbility(collection, hannahLevel) {
  const unlocked = unlockedBonusAbilities(hannahLevel);
  if (unlocked.length === 0) return null;
  const col = normalizeCollection(collection);
  if (col.bonusAbility && unlocked.includes(col.bonusAbility)) {
    return col.bonusAbility;
  }
  return unlocked[0];
}

/**
 * Full ordered ability key list for the battle ability bar.
 * @param {object} collection
 * @param {number} hannahLevel
 * @returns {string[]}
 */
export function battleAbilityKeys(collection, hannahLevel) {
  const keys = [...coreAbilityKeys()];
  const bonus = resolveBonusAbility(collection, hannahLevel);
  if (bonus) keys.push(bonus);
  return keys;
}

/**
 * Set preferred bonus ability (must be unlocked).
 * @param {object} collection
 * @param {string} abilityKey
 * @param {number} hannahLevel
 * @returns {object}
 */
export function setBonusAbility(collection, abilityKey, hannahLevel) {
  const col = normalizeCollection(collection);
  const unlocked = unlockedBonusAbilities(hannahLevel);
  if (unlocked.includes(abilityKey)) {
    col.bonusAbility = abilityKey;
  }
  return normalizeCollection(col);
}

/**
 * Equip an unlocked chick skin.
 * @param {object} collection
 * @param {string} skinId
 * @returns {object}
 */
export function equipSkin(collection, skinId) {
  const col = normalizeCollection(collection);
  if (col.skins.includes(skinId)) {
    col.equippedSkin = skinId;
  }
  return normalizeCollection(col);
}

/**
 * Album entries for UI — every stickerable enemy with unlock state.
 * @param {object} collection
 * @returns {Array<{ key: string, label: string, stars: number, unlocked: boolean }>}
 */
export function albumEntries(collection) {
  const col = normalizeCollection(collection);
  const order = GameConfig.stickerAlbumOrder || Object.keys(GameConfig.enemies || {});
  return order.map((key) => {
    const stars = col.stickers[key] || 0;
    const label = GameConfig.stickerLabels?.[key] || key.charAt(0) + key.slice(1).toLowerCase();
    return { key, label, stars, unlocked: stars > 0 };
  });
}

/**
 * Count filled album slots for header UI.
 * @param {object} collection
 * @returns {{ filled: number, total: number }}
 */
export function albumProgress(collection) {
  const entries = albumEntries(collection);
  return {
    filled: entries.filter((e) => e.unlocked).length,
    total: entries.length,
  };
}
