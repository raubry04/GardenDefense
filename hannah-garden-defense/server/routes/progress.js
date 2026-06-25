import { Router } from 'express';
import db from '../db.js';

const router = Router();

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
    const {
      player_name,
      hannah_level = 1,
      hannah_xp = 0,
      garden_level = 1,
      sunshine_points = 150,
      battle_stars = '{}'
    } = req.body;

    if (!player_name) {
      return res.status(400).json({ error: 'player_name is required' });
    }

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO player_progress
        (player_name, hannah_level, hannah_xp, garden_level, sunshine_points, battle_stars, last_played)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `);
    stmt.run(player_name, hannah_level, hannah_xp, garden_level, sunshine_points, battle_stars);

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
