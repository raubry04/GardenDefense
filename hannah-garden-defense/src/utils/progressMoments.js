import { GameConfig } from '../config.js';
import { skinInfo, normalizeCollection } from './collection.js';
import { isExtraModesUnlocked } from './modesUnlock.js';

const SNAP_KEY = 'hannahGarden_unlockSnapshot';

function readSnap() {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(SNAP_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeSnap(snap) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(SNAP_KEY, JSON.stringify(snap));
  } catch {
    /* ignore */
  }
}

function snapshotOf(progress) {
  const col = normalizeCollection(progress?.collection);
  const unlockedTowers = [];
  const level = progress?.hannahLevel ?? 1;
  const zone = progress?.unlockedZone ?? 0;
  for (const [name, cfg] of Object.entries(GameConfig.towers || {})) {
    const u = cfg.unlock;
    if (!u) {
      unlockedTowers.push(name);
      continue;
    }
    if (u.type === 'level' && level >= u.value) unlockedTowers.push(name);
    if (u.type === 'zone' && zone + 1 >= u.value) unlockedTowers.push(name);
  }
  return {
    zone,
    level,
    modes: isExtraModesUnlocked(zone),
    towers: unlockedTowers.sort(),
    skins: [...col.skins].sort(),
  };
}

/**
 * One kid-facing "what's new" line, or null. Updates the stored snapshot.
 * First visit stores the snapshot and stays quiet.
 * @param {object} progress
 * @returns {string|null}
 */
export function consumeWhatsNew(progress) {
  const next = snapshotOf(progress);
  const prev = readSnap();
  writeSnap(next);
  if (!prev) return null;

  const newSkins = next.skins.filter((id) => id !== 'default' && !prev.skins?.includes(id));
  if (newSkins.length) {
    const info = skinInfo(newSkins[0]);
    return `New costume: ${info.label}!`;
  }

  const newTowers = next.towers.filter((t) => !prev.towers?.includes(t));
  if (newTowers.length) {
    const label = newTowers[0].replace(/_/g, ' ');
    return `New friend: ${label}!`;
  }

  if (next.zone > (prev.zone ?? 0)) {
    const name = GameConfig.zones?.[next.zone]?.name;
    if (name) return `New garden: ${name}!`;
  }

  if (next.modes && !prev.modes) return 'Endless and Daily are open!';
  return null;
}

/**
 * One upgrade suggestion from the fight that just ended.
 * @param {{ flyerLeaks?: number, bearHits?: number, zone?: number }} notes
 * @returns {string}
 */
export function upgradeNudge(notes = {}) {
  const zone = notes.zone ?? 0;
  const enemies = GameConfig.zones?.[zone]?.enemies || [];
  if ((notes.flyerLeaks ?? 0) > 0 || enemies.includes('PARROT') && (notes.flyerLeaks ?? 0) > 0) {
    return 'Try upgrading Owl — flyers got through.';
  }
  if ((notes.bearHits ?? 0) > 0) {
    return 'Bears hit your towers — upgrade health, and use Garden Rain.';
  }
  if (enemies.includes('ELEPHANT') || enemies.includes('RHINO')) {
    return 'Armor shrugs off Chickens — upgrade Owl.';
  }
  if ((notes.flyerLeaks ?? 0) === 0 && enemies.includes('PARROT')) {
    return 'Keep an Owl ready for Parrots.';
  }
  return 'Upgrade Chicken for bigger hits next battle.';
}

/**
 * Defeat tip. Prefers a fight-specific line over a random generic hint.
 * @param {{ flyerLeaks?: number, bearHits?: number, zone?: number }} notes
 * @param {string[]} fallbacks
 */
export function defeatHint(notes, fallbacks) {
  if ((notes?.flyerLeaks ?? 0) > 0) return 'Parrots flew in — place an Owl next try!';
  if ((notes?.bearHits ?? 0) > 0) return 'Bears smashed towers — tap Garden Rain to fix them!';
  const enemies = GameConfig.zones?.[notes?.zone]?.enemies || [];
  if (enemies.includes('PARROT')) return 'If Parrots show up, only Owls can shoot them.';
  if (Array.isArray(fallbacks) && fallbacks.length) {
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
  return 'Try again — you can do it!';
}
