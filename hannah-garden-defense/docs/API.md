# API Reference

*Audience: developers*

Base URL in production: `http://localhost:5050/api` (same host as the game).

Express routes are mounted in [`server/index.js`](../server/index.js).

## Progress — `/api/progress`

### `GET /api/progress/:name`

Return saved progress for a player.

**Response 200** — `player_progress` row:

| Field | Type | Description |
|-------|------|-------------|
| `player_name` | string | Unique player id |
| `hannah_level` | number | Meta level |
| `hannah_xp` | number | Total XP |
| `garden_level` | number | Garden meta level |
| `sunshine_points` | number | Banked upgrade currency |
| `battle_stars` | string (JSON) | Per-battle star map |
| `unlocked_zone` | number | Highest unlocked zone index |
| `zone_stars` | string (JSON) | Stars per zone |
| `zone_battles` | string (JSON) | Completed battles per zone |
| `tower_upgrades` | string (JSON) | Tower tier unlocks |
| `last_played` | string | ISO timestamp |

**404** — `{ "error": "Player not found" }`

### `POST /api/progress`

Upsert progress (`INSERT OR REPLACE`).

**Body (JSON):**

```json
{
  "player_name": "Hannah",
  "hannah_level": 3,
  "hannah_xp": 900,
  "garden_level": 1,
  "sunshine_points": 250,
  "battle_stars": "{}",
  "unlocked_zone": 2,
  "zone_stars": "{}",
  "zone_battles": "{}",
  "tower_upgrades": "{}"
}
```

Required: `player_name`. Other fields default as in [`server/routes/progress.js`](../server/routes/progress.js).

**Response 200** — full row after save.

### `DELETE /api/progress/:name`

Delete a player's progress.

**Response 200** — `{ "deleted": true }`  
**404** — player not found.

## Leaderboard — `/api/leaderboard`

### `GET /api/leaderboard`

Top 10 scores by `score` descending.

### `POST /api/leaderboard`

**Body:**

```json
{
  "player_name": "Hannah",
  "score": 1200,
  "stars_earned": 3,
  "zone": 1,
  "battle": 2
}
```

**Response 201** — inserted row.

### `GET /api/leaderboard/player/:name`

All entries for a player, newest first.

## Database

SQLite file: `data/hannah.db` (created on first server start). Schema in [`server/db.js`](../server/db.js).

## Static assets

- `/game-assets/*` — runtime images/audio/fonts from `assets/`
- `/assets/*` — Vite JS bundle from `dist/assets/`

---

*Author: Bryan Rausch · Last updated: June 25, 2026*
