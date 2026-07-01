import { Router } from 'express';
import db from '../db.js';
import {
  serverRowToProgress,
  mergeProgressRecords,
  progressToServerPayload,
} from '../../src/utils/hannahProgress.js';

const router = Router();

const PLAYER_NAME_RE = /^[a-zA-Z0-9 ]{1,32}$/;

export function validatePlayerName(name) {
  return typeof name === 'string' && PLAYER_NAME_RE.test(name);
}

export function validateNonNegativeInt(value) {
  const n = Number(value);
  return Number.isFinite(n) && Number.isInteger(n) && n >= 0;
}

/**
 * GET /:name — Return the player_progress row for the given player name.
 * @param {string} req.params.name - Player name
 * @returns {object} Player progress row or 404
 */
router.get('/:name', (req, res) => {
  try {
    const row = db.prepare(
      'SELECT * FROM player_progress WHERE player_name = ?'
    ).get(req.params.name);

    if (!row) {
      return res.status(404).json({ error: 'Player not found' });
    }
    res.json(row);
  } catch (err) {
    console.error('[progress] GET /:name error:', err.message);
    res.status(500).json({ error: 'Failed to fetch player progress' });
  }
});

/**
 * POST / — Upsert player progress (INSERT OR REPLACE).
 * @param {string}  req.body.player_name
 * @param {number}  req.body.hannah_level
 * @param {number}  req.body.hannah_xp
 * @param {number}  req.body.garden_level
 * @param {number}  req.body.sunshine_points
 * @param {string}  req.body.battle_stars - JSON string of star data
 * @returns {object} The upserted row
 */
router.post('/', (req, res) => {
  try {
    const { player_name } = req.body;

    if (!player_name) {
      return res.status(400).json({ error: 'player_name is required' });
    }

    if (!validatePlayerName(player_name)) {
      return res.status(400).json({
        error: 'player_name must be 1–32 alphanumeric characters or spaces',
      });
    }

    // Validate any numeric fields the client actually provided so bad input still
    // returns 400. Omitted fields are fine — the merge falls back to stored data.
    const numericFields = [
      'hannah_level', 'hannah_xp', 'garden_level', 'sunshine_points', 'unlocked_zone',
      'meta_sunshine_earned', 'meta_sunshine_spent',
    ];
    for (const field of numericFields) {
      if (req.body[field] !== undefined && !validateNonNegativeInt(req.body[field])) {
        return res.status(400).json({ error: `${field} must be a non-negative integer` });
      }
    }

    const maxZone = 5;
    if (req.body.unlocked_zone !== undefined && Number(req.body.unlocked_zone) > maxZone) {
      return res.status(400).json({ error: `unlocked_zone must be at most ${maxZone}` });
    }

    const existing = db.prepare(
      'SELECT * FROM player_progress WHERE player_name = ?',
    ).get(player_name);

    // Merge incoming payload with the stored row using the SAME semantics as the
    // client (max XP/level, union/max of stars, union of upgrades, and MAX of the
    // monotonic meta-bank earned/spent totals). This replaces the old
    // last-write-wins INSERT OR REPLACE so racing tabs/devices can no longer
    // clobber each other's progress, and spending persists because `spent` only grows.
    const incoming = serverRowToProgress(req.body, player_name);
    const mergedProgress = existing
      ? mergeProgressRecords(serverRowToProgress(existing, player_name), incoming)
      : incoming;
    const merged = progressToServerPayload({ ...mergedProgress, playerName: player_name });

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO player_progress
        (player_name, hannah_level, hannah_xp, garden_level, sunshine_points,
         meta_sunshine_earned, meta_sunshine_spent,
         battle_stars, unlocked_zone, zone_stars, zone_battles, tower_upgrades, last_played)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);
    stmt.run(
      player_name,
      merged.hannah_level,
      merged.hannah_xp,
      merged.garden_level,
      merged.sunshine_points,
      merged.meta_sunshine_earned,
      merged.meta_sunshine_spent,
      merged.battle_stars,
      merged.unlocked_zone,
      merged.zone_stars,
      merged.zone_battles,
      merged.tower_upgrades,
    );

    const row = db.prepare(
      'SELECT * FROM player_progress WHERE player_name = ?'
    ).get(player_name);
    res.json(row);
  } catch (err) {
    console.error('[progress] POST / error:', err.message);
    res.status(500).json({ error: 'Failed to save player progress' });
  }
});

/**
 * DELETE /:name — Delete progress for a player.
 * @param {string} req.params.name - Player name
 * @returns {object} { deleted: true }
 */
router.delete('/:name', (req, res) => {
  if (process.env.ALLOW_PROGRESS_DELETE !== 'true') {
    return res.status(403).json({ error: 'Progress DELETE is disabled' });
  }
  try {
    const info = db.prepare(
      'DELETE FROM player_progress WHERE player_name = ?'
    ).run(req.params.name);

    if (info.changes === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }
    res.json({ deleted: true });
  } catch (err) {
    console.error('[progress] DELETE /:name error:', err.message);
    res.status(500).json({ error: 'Failed to delete player progress' });
  }
});

export default router;
