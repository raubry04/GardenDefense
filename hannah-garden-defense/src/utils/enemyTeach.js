/**
 * One-time kid teaching beats (Parrot / Bear smash / Pig Wall).
 * Persisted so intros do not repeat every battle.
 */

const STORAGE_KEY = 'hannahGarden_seenTeaches';

/** @type {Set<string>|null} */
let memorySeen = null;

function readSeen() {
  if (memorySeen) return memorySeen;
  memorySeen = new Set();
  try {
    if (typeof localStorage === 'undefined') return memorySeen;
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    if (Array.isArray(list)) {
      for (const id of list) memorySeen.add(id);
    }
  } catch {
    /* ignore corrupt storage */
  }
  return memorySeen;
}

function writeSeen(set) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    /* private mode */
  }
}

/** @param {string} id */
export function hasSeenTeach(id) {
  return readSeen().has(id);
}

/**
 * Mark a teach id seen. Returns true only the first time.
 * @param {string} id
 */
export function markTeachSeen(id) {
  const set = readSeen();
  if (set.has(id)) return false;
  set.add(id);
  writeSeen(set);
  return true;
}

/** Test helper — reset in-memory + storage. */
export function resetTeachSeen() {
  memorySeen = new Set();
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export const TEACH_COPY = {
  PARROT: 'Parrots fly — place an Owl!',
  BEAR_SMASH: 'Bears smash towers — tap Garden Rain!',
  PIG_WALL: 'Pig Walls go on the dirt path.',
  NEEDS_OWL: 'Needs Owl!',
};

/**
 * First-seen enemy payload for UI toast / spotlight.
 * Bear smash is a separate beat (not the spawn intro).
 * @param {string} type
 * @returns {{ id: string, message: string, spotlight?: string, ability?: string }|null}
 */
export function firstSeenEnemyTeach(type) {
  if (type === 'PARROT') {
    return { id: 'PARROT', message: TEACH_COPY.PARROT, spotlight: 'OWL' };
  }
  return null;
}
