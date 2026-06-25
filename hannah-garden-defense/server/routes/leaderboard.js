import { Router } from 'express';
import db from '../db.js';

const router = Router();

/**
 * GET / — Return the top 10 leaderboard entries ordered by score descending.
 * @returns {object[]} Array of leaderboard rows
 */
router.get('/', (_req, res) => {
  try {
    const rows = db.prepare(
      'SELECT * FROM leaderboard ORDER BY score DESC LIMIT 10'
    ).all();
    res.json(rows);
  } catch (err) {
    console.error('[leaderboard] GET / error:', err.message);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

/**
 * POST / — Insert a new leaderboard entry.
 * @param {string}  req.body.player_name
 * @param {number}  req.body.score
 * @param {number}  req.body.stars_earned
 * @param {number}  req.body.zone
 * @param {number}  req.body.battle
 * @returns {object} The inserted row
 */
router.post('/', (req, res) => {
  try {
    const { player_name, score, stars_earned, zone, battle } = req.body;

    if (!player_name || score == null || stars_earned == null || zone == null || battle == null) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const stmt = db.prepare(
      `INSERT INTO leaderboard (player_name, score, stars_earned, zone, battle)
       VALUES (?, ?, ?, ?, ?)`
    );
    const info = stmt.run(player_name, score, stars_earned, zone, battle);

    const row = db.prepare('SELECT * FROM leaderboard WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(row);
  } catch (err) {
    console.error('[leaderboard] POST / error:', err.message);
    res.status(500).json({ error: 'Failed to insert score' });
  }
});

/**
 * GET /player/:name — Return all scores for a specific player, newest first.
 * @param {string} req.params.name - Player name
 * @returns {object[]} Array of leaderboard rows for the player
 */
router.get('/player/:name', (req, res) => {
  try {
    const rows = db.prepare(
      'SELECT * FROM leaderboard WHERE player_name = ? ORDER BY played_at DESC'
    ).all(req.params.name);
    res.json(rows);
  } catch (err) {
    console.error('[leaderboard] GET /player/:name error:', err.message);
    res.status(500).json({ error: 'Failed to fetch player scores' });
  }
});

export default router;
