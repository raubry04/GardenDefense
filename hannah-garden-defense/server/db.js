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
    played_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS player_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_name TEXT UNIQUE NOT NULL,
    hannah_level INTEGER DEFAULT 1,
    hannah_xp INTEGER DEFAULT 0,
    garden_level INTEGER DEFAULT 1,
    sunshine_points INTEGER DEFAULT 150,
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

export default db;
