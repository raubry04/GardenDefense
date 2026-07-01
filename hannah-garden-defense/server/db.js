import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'hannah.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS leaderboard (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_name TEXT NOT NULL,
    score INTEGER NOT NULL,
    stars_earned INTEGER NOT NULL,
    zone INTEGER NOT NULL,
    battle INTEGER NOT NULL,
    mode TEXT DEFAULT 'campaign',
    played_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS player_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_name TEXT UNIQUE NOT NULL,
    hannah_level INTEGER DEFAULT 1,
    hannah_xp INTEGER DEFAULT 0,
    garden_level INTEGER DEFAULT 1,
    sunshine_points INTEGER DEFAULT 150,
    meta_sunshine_earned INTEGER DEFAULT 0,
    meta_sunshine_spent INTEGER DEFAULT 0,
    battle_stars TEXT DEFAULT '{}',
    unlocked_zone INTEGER DEFAULT 0,
    zone_stars TEXT DEFAULT '{}',
    zone_battles TEXT DEFAULT '{}',
    tower_upgrades TEXT DEFAULT '{}',
    last_played TEXT DEFAULT (datetime('now'))
  );
`);

const progressColumns = [
  ['unlocked_zone', 'INTEGER DEFAULT 0'],
  ['zone_stars', "TEXT DEFAULT '{}'"],
  ['zone_battles', "TEXT DEFAULT '{}'"],
  ['tower_upgrades', "TEXT DEFAULT '{}'"],
];
for (const [name, definition] of progressColumns) {
  const exists = db.prepare(
    `SELECT 1 FROM pragma_table_info('player_progress') WHERE name = ?`,
  ).get(name);
  if (!exists) {
    db.exec(`ALTER TABLE player_progress ADD COLUMN ${name} ${definition}`);
  }
}

// Meta-bank earned/spent columns (earned-vs-spent model). The available balance
// is derived as max(0, earned - spent); `sunshine_points` is kept as that derived
// value for backward compatibility.
const earnedExists = db.prepare(
  `SELECT 1 FROM pragma_table_info('player_progress') WHERE name = 'meta_sunshine_earned'`,
).get();
if (!earnedExists) {
  db.exec(`ALTER TABLE player_progress ADD COLUMN meta_sunshine_earned INTEGER DEFAULT 0`);
  // Backfill: existing players' current spendable balance becomes their earned
  // total (spent stays 0), so available = earned - 0 exactly preserves the bank.
  db.exec(`UPDATE player_progress SET meta_sunshine_earned = sunshine_points`);
}

const spentExists = db.prepare(
  `SELECT 1 FROM pragma_table_info('player_progress') WHERE name = 'meta_sunshine_spent'`,
).get();
if (!spentExists) {
  db.exec(`ALTER TABLE player_progress ADD COLUMN meta_sunshine_spent INTEGER DEFAULT 0`);
}

const leaderboardModeCol = db.prepare(
  `SELECT 1 FROM pragma_table_info('leaderboard') WHERE name = 'mode'`,
).get();
if (!leaderboardModeCol) {
  db.exec(`ALTER TABLE leaderboard ADD COLUMN mode TEXT DEFAULT 'campaign'`);
}

export default db;
