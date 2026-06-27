import { Router } from 'express';
import db from '../db.js';

const router = Router();

const PLAYER_NAME_RE = /^[a-zA-Z0-9 ]{1,32}$/;

export function validateLeaderboardName(name) {
  return typeof name === 'string' && PLAYER_NAME_RE.test(name);
}

export function validateLeaderboardScore(score) {
  const n = Number(score);
  return Number.isFinite(n) && Number.isInteger(n) && n >= 0;
}

export function validateLeaderboardMode(mode) {
  return mode == null || mode === 'campaign' || mode === 'daily' || mode === 'endless';
}

export function validateLeaderboardStars(stars) {
  const n = Number(stars);
  return Number.isFinite(n) && Number.isInteger(n) && n >= 0 && n <= 3;
}

export function validateLeaderboardZone(zone) {
  const n = Number(zone);
  return Number.isFinite(n) && Number.isInteger(n) && n >= 0 && n <= 5;
}

export function validateLeaderboardBattle(battle) {
  const n = Number(battle);
  return Number.isFinite(n) && Number.isInteger(n) && n >= 0 && n <= 9;
}

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
const rateLimitByIp = new Map();

export function checkRateLimit(ip, now = Date.now()) {
  let entry = rateLimitByIp.get(ip);
  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
    rateLimitByIp.set(ip, entry);
  }
  entry.count += 1;
  return entry.count <= RATE_LIMIT_MAX;
}

export function rateLimitMiddleware(req, res, next) {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many requests — limit 10 per minute' });
  }
  next();
}

export function pruneOldDailyRows() {
  db.prepare(
    `DELETE FROM leaderboard WHERE mode = 'daily' AND played_at < datetime('now', '-30 days')`,
  ).run();
}

/**
 * GET / — Return the top 10 leaderboard entries ordered by score descending.
 * Optional query: ?mode=daily|campaign|endless
 */
router.get('/', (req, res) => {
  try {
    const mode = req.query.mode;
    if (mode != null && !validateLeaderboardMode(mode)) {
      return res.status(400).json({ error: 'Invalid mode' });
    }

    const rows = mode
      ? db.prepare(
        'SELECT * FROM leaderboard WHERE mode = ? ORDER BY score DESC LIMIT 10',
      ).all(mode)
      : db.prepare(
        'SELECT * FROM leaderboard ORDER BY score DESC LIMIT 10',
      ).all();
    res.json(rows);
  } catch (err) {
    console.error('[leaderboard] GET / error:', err.message);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

/**
 * POST / — Insert a new leaderboard entry.
 */
router.post('/', rateLimitMiddleware, (req, res) => {
  try {
    const { player_name, score, stars_earned, zone, battle, mode } = req.body;

    if (!player_name || score == null || stars_earned == null || zone == null || battle == null) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!validateLeaderboardName(player_name)) {
      return res.status(400).json({
        error: 'player_name must be 1–32 alphanumeric characters or spaces',
      });
    }

    if (!validateLeaderboardScore(score)) {
      return res.status(400).json({ error: 'score must be a non-negative integer' });
    }

    if (!validateLeaderboardStars(stars_earned)) {
      return res.status(400).json({ error: 'stars_earned must be an integer from 0 to 3' });
    }

    if (!validateLeaderboardZone(zone)) {
      return res.status(400).json({ error: 'zone must be an integer from 0 to 5' });
    }

    if (!validateLeaderboardBattle(battle)) {
      return res.status(400).json({ error: 'battle must be an integer from 0 to 9' });
    }

    const entryMode = mode ?? 'campaign';
    if (!validateLeaderboardMode(entryMode)) {
      return res.status(400).json({ error: 'Invalid mode' });
    }

    pruneOldDailyRows();

    const stmt = db.prepare(
      `INSERT INTO leaderboard (player_name, score, stars_earned, zone, battle, mode)
       VALUES (?, ?, ?, ?, ?, ?)`,
    );
    const info = stmt.run(player_name, score, stars_earned, zone, battle, entryMode);

    const row = db.prepare('SELECT * FROM leaderboard WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(row);
  } catch (err) {
    console.error('[leaderboard] POST / error:', err.message);
    res.status(500).json({ error: 'Failed to insert score' });
  }
});

router.get('/player/:name', (req, res) => {
  try {
    const rows = db.prepare(
      'SELECT * FROM leaderboard WHERE player_name = ? ORDER BY played_at DESC',
    ).all(req.params.name);
    res.json(rows);
  } catch (err) {
    console.error('[leaderboard] GET /player/:name error:', err.message);
    res.status(500).json({ error: 'Failed to fetch player scores' });
  }
});

export default router;
