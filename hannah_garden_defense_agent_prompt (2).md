# 🌻 AGENT BUILD PROMPT — "Hannah's Garden Defense"
### A Complete Tower Defense Web Game for a 7-Year-Old
**Prepared for:** Senior Full-Stack Software Engineer (Children's Web Games Specialist)
**Prepared by:** Senior Software Engineer / Architect
**Target Platform:** Local Network Web App — `0.0.0.0:5050` (Windows Host)
**Asset Source:** Kenney.nl — Full 2D, 3D & Sound Asset Packs (pre-purchased, locally available)
**Revision:** v1.2 — Confirmed-Assets-Only Edition

---

## ⚠️ AGENT INSTRUCTIONS — READ FIRST

Build this game **completely from start to finish**. No placeholders, no TODO comments, no scaffolding. Every feature listed here must be fully working before the build is considered complete.

All characters, sprites, and audio in this document were chosen exclusively from Kenney packs whose contents were **verified by name** before inclusion. You must not invent or assume any asset path. Every reference in `AssetRegistry.js` must point to a file that you have confirmed exists on disk before writing it.

---

## ⚡ STEP 0 — LOCATE FILENAMES (MANDATORY BEFORE ANY CODE)

The confirmed Kenney packs and their **animals / contents** are listed in this document. What is NOT known in advance is the exact filename convention Kenney uses inside each zip (e.g. `rabbit.png` vs `animal_rabbit.png` vs `animalPack_rabbit.png`). Before writing any code, run this scan and record what you find:

```bash
# Run from the project root after all Kenney packs are extracted to ./assets/kenney/
find ./assets/kenney -type f -iname "*.png" | sort > ./assets/kenney/png_files.txt
find ./assets/kenney -type f \( -iname "*.ogg" -o -iname "*.mp3" \) | sort > ./assets/kenney/audio_files.txt
```

Then open `png_files.txt` and search for each animal name listed in Section 4 of this document. Record the exact matching path for each. Use those exact paths — and only those paths — in `AssetRegistry.js`. If a file is not found in the scan, it does not get used.

---

## 1. PROJECT OVERVIEW

### 1.1 Game Name
**"Hannah's Garden Defense"**

### 1.2 Player Profile
- **Primary player:** Hannah, age 7
- **Loves:** Yellow, flowers, and animals
- **Enjoys:** Games that are easy to pick up but keep her entertained for hours through progressive challenges and variety

### 1.3 Game Concept
Hannah's Garden Defense is a **2D top-down tower defense** web game. Hannah and her team of lovable animal friends defend her magical yellow flower garden and farm against waves of mischievous animal invaders. The invaders are also animals — naughty ones who want to eat her crops and trample her flowers.

As Hannah wins battles she earns **Sunshine Points** to place and upgrade animal defenders. Hannah herself levels up, unlocking new defenders and abilities. The garden also levels up, expanding the playable world. The game is endlessly progressive — there is no final screen, just a bigger, richer garden with harder waves.

### 1.4 Design Principles
- **Child-first UX:** Large tap targets, minimal reading, no punishing failure states
- **Yellow everywhere:** Dominant yellow palette, cheerful and warm
- **Low frustration:** Lives are generous, hints are active, Hannah wins more than she loses
- **High replayability:** Randomised wave compositions, multiple map layouts per zone
- **Family-friendly leaderboard:** Family members enter their name and compete on a shared scoreboard

---

## 2. TECHNOLOGY STACK

| Layer | Technology |
|---|---|
| Game Engine | Phaser 3 (latest stable, installed via npm) |
| Rendering | WebGL with Canvas fallback |
| Frontend | Vanilla HTML5 + CSS3 + ES Modules |
| Backend | Node.js + Express.js |
| Database | SQLite via `better-sqlite3` (synchronous) |
| Build Tool | Vite |
| Package Manager | npm |
| Host OS | Windows 10 / 11 |
| Server | `0.0.0.0:5050` — LAN only, no public internet |

### npm Dependencies
```
phaser
express
better-sqlite3
cors
vite
```

---

## 3. PROJECT STRUCTURE

```
hannah-garden-defense/
├── server/
│   ├── index.js
│   ├── db.js
│   └── routes/
│       ├── leaderboard.js
│       └── progress.js
├── src/
│   ├── main.js
│   ├── config.js
│   ├── scenes/
│   │   ├── BootScene.js
│   │   ├── MainMenuScene.js
│   │   ├── WorldMapScene.js
│   │   ├── GameScene.js
│   │   ├── UIScene.js
│   │   ├── UpgradeScene.js
│   │   ├── VictoryScene.js
│   │   ├── GameOverScene.js
│   │   └── LeaderboardScene.js
│   ├── entities/
│   │   ├── Tower.js
│   │   ├── towers/
│   │   │   ├── RabbitGuard.js
│   │   │   ├── ChickenCannon.js
│   │   │   ├── DogPatrol.js
│   │   │   ├── OwlSniper.js
│   │   │   ├── DuckSprinkler.js
│   │   │   ├── PenguinFreezer.js
│   │   │   └── PigWall.js
│   │   ├── Enemy.js
│   │   ├── enemies/
│   │   │   ├── SnakeEnemy.js
│   │   │   ├── FrogEnemy.js
│   │   │   ├── GorillaEnemy.js
│   │   │   ├── ParrotEnemy.js
│   │   │   ├── MonkeyEnemy.js
│   │   │   ├── BearEnemy.js
│   │   │   └── ElephantBoss.js
│   │   ├── Projectile.js
│   │   └── Hannah.js
│   ├── systems/
│   │   ├── WaveManager.js
│   │   ├── PathManager.js
│   │   ├── EconomyManager.js
│   │   ├── ProgressManager.js
│   │   ├── AudioManager.js
│   │   └── TutorialManager.js
│   ├── ui/
│   │   ├── TowerCard.js
│   │   ├── StarRating.js
│   │   ├── LevelUpBanner.js
│   │   ├── WaveCounter.js
│   │   └── HintBubble.js
│   └── utils/
│       ├── AssetRegistry.js
│       └── MathHelpers.js
├── assets/
│   └── kenney/
│       ├── png_files.txt       ← generated in Step 0
│       ├── audio_files.txt     ← generated in Step 0
│       └── [extracted pack folders]
├── public/
│   └── index.html
├── data/
│   └── hannah.db
├── vite.config.js
├── package.json
└── start.bat
```

---

## 4. CONFIRMED ASSETS — THE ONLY ASSETS PERMITTED IN THIS BUILD

This section lists every asset source used in the game. **Nothing outside this list may be referenced.** All entries were verified against official Kenney pack descriptions published on kenney.nl.

---

### 4.1 Animal Pack Redux — ALL 30 ANIMALS CONFIRMED BY NAME

**Pack:** `Animal Pack Redux` | **Verified asset count:** 240 | **Style:** Each animal in 8 variants (square/round body, with/without outline, with/without detail shading)

The following 30 animals are confirmed to exist. The game uses only the animals listed below in the roles assigned:

#### DEFENDERS — 7 towers, all from Animal Pack Redux

| Animal | Confirmed | Tower Name | Mechanic |
|---|---|---|---|
| **Rabbit** | ✅ | Rabbit Guard | Hops to adjacent tiles; slows all enemies it touches — no damage |
| **Chicken** | ✅ | Chicken Cannon | Fires eggs in a straight line; single target; fast fire rate |
| **Dog** | ✅ | Dog Patrol | Short-range area bark; briefly stuns nearby enemies + applies slow |
| **Owl** | ✅ | Owl Sniper | Long range, high single-target damage, slow fire rate |
| **Duck** | ✅ | Duck Sprinkler | Constant area-of-effect slow in a medium radius; no damage |
| **Penguin** | ✅ | Penguin Freezer | Periodic freeze pulse; freezes all enemies in range for 1.5 seconds |
| **Pig** | ✅ | Pig Wall | Placed on path tile; acts as a blocker with high HP; enemies must destroy it to pass |

#### ENEMIES — 7 enemy types, all from Animal Pack Redux

| Animal | Confirmed | Enemy Name | Behaviour |
|---|---|---|---|
| **Snake** | ✅ | Sneaky Snake | Basic slow enemy; slithers along path; low HP |
| **Frog** | ✅ | Leaping Frog | Medium HP; on death splits into 2 Snakes; hops (not walks) |
| **Gorilla** | ✅ | Charging Gorilla | Fast enemy; high HP; barrels through the path |
| **Parrot** | ✅ | Rogue Parrot | Flying enemy; ignores ground path entirely; flies in a straight arc to the gate |
| **Monkey** | ✅ | Cheeky Monkey | Medium speed; 20% chance on hit to steal 5 Sunshine Points from the player |
| **Bear** | ✅ | Grumpy Bear | Deviates from path to attack the nearest tower; high HP |
| **Elephant** | ✅ | Stampede Elephant | Zone boss; armored (immune to Chicken Cannon eggs); extremely high HP; area stomp attack |

#### BACKGROUND / DECORATION — confirmed animals used as passive farm decorations (not interactive)

| Animal | Confirmed | Use |
|---|---|---|
| **Cow** | ✅ | Grazes in farm background; Garden Level 2+ |
| **Chick** | ✅ | Hannah's companion; follows her sprite tile |
| **Pig** (2nd instance) | ✅ | Background farm pen decoration (different placement from Pig Wall tower) |
| **Horse** | ✅ | Background stable decoration; Garden Level 3+ |
| **Sheep / Buffalo** | ✅ | Background meadow decoration |

#### Remaining confirmed animals (reserved for future use / cosmetic unlocks)
Bear, buffalo, crocodile, elephant, giraffe, goat, gorilla, hippo, horse, moose, narwhal, panda, penguin, rhino, sloth, snake, walrus, whale, zebra — all confirmed present in pack; available for future expansion levels or cosmetic rewards.

---

### 4.2 Hannah Hero Sprite — Roguelike Characters Pack

**Pack:** `Roguelike Characters` | **Verified asset count:** 450 | **Style:** Modular RPG/roguelike characters

This pack contains modular characters with selectable bases, clothing, hair, and accessories. Use it to construct Hannah's sprite:
- Select a **female base body** (smaller frame)
- Apply a **yellow or floral outfit** (closest available clothing asset)
- Apply appropriate **hair** (long, warm-toned)
- Hannah is displayed as a single composed PNG tile; if the pack provides a spritesheet, extract the walking/idle frames

If the pack does not contain a clearly female character base, use any child-sized human character and tint yellow using Phaser's `setTint(0xFFD700)`.

---

### 4.3 Tile and Map Assets

#### Tower Defense (Top-Down)
**Pack:** `Tower Defense (Top-Down)` | **Verified asset count:** 300 | **Tags:** top-down, defense, tower, weapon

Use for:
- **Path tiles** (dirt/stone trail enemies walk along)
- **Tower base tiles** (the platform each tower sits on)
- **Grass/soil ground tiles** flanking the path
- **Enemy sprite alternatives** — if this pack contains enemy sprites, cross-reference with Section 4.1; animal pack takes priority

#### Nature Kit
**Pack:** `Nature Kit` | **Verified asset count:** 330

Use for:
- Trees, rocks, and large environmental props
- Ground texture variation between zones
- Zone-specific background decoration (meadow vs orchard vs berry patch)

#### Foliage Sprites
**Pack:** `Foliage Sprites` | **Verified asset count:** 50

Use for:
- Flower and plant decorations flanking the path
- Garden gate area dressing
- Level-up celebration (flowers bloom across the screen)
- These are **decoration only** — not character sprites

#### Pixel Platformer Farm Expansion
**Pack:** `Pixel Platformer Farm Expansion` | **Verified asset count:** 110 | **Tile size:** 18×18px

Use for:
- Farm-specific decorative tiles (hay bales, fences, barn walls)
- Note: 18×18px tiles — scale up with `setScale()` in Phaser to match the 64px grid, or use as UI decoration only

---

### 4.4 UI and HUD Assets

#### Game Icons
**Pack:** `Game Icons` | **Verified asset count:** 1,280+

Use for:
- ❤️ Heart icon → lives counter
- ⭐ Star icon → battle rating
- 🪙 Coin/gem icon → Sunshine Points counter
- 🔒 Padlock icon → locked zones
- ▶️ Play / pause icons
- Any other HUD symbol (speed, range, damage indicators)

#### UI Pack (Kenney)
Use for:
- Button backgrounds and panel frames
- Scroll panels for leaderboard and upgrade screens
- Progress bar for loading screen and XP bars
- Tooltip/speech bubble backgrounds

---

### 4.5 Typography

**Pack:** `Kenney Fonts`

| Font | Use |
|---|---|
| `kenney_pixel` | Game title, major headings, wave banners |
| `kenney_future` | HUD labels, button text, score display |

Both fonts confirmed to be in the Kenney Fonts pack. Load as bitmap fonts in Phaser using `this.load.bitmapFont()`.

Minimum rendered size: **22px** for HUD text. Never render readable text below 18px.

---

### 4.6 Audio

#### Interface Sounds (Kenney)
Use for all in-game sound effects:

| Game Event | SFX Type to locate in pack |
|---|---|
| Tower placed | Short positive "pop" or "click" tone |
| Tower fires | Soft "whoosh" or "pew" |
| Enemy hit | Light impact "thud" |
| Enemy dies | Brief "poof" or "squeak" |
| Sunshine Points earned | Bright "ding" or "coin" chime |
| Wave starting | "Bell" or brief fanfare |
| Button pressed | Soft "tick" or "click" |
| Invalid placement | Low "buzz" or "no" tone |
| Ability activated | "Swoosh" with ascending tone |

#### Kenney Music / Music Jingles
Use for background music:

| Scene | Music Type |
|---|---|
| Main Menu | Upbeat, cheerful loop |
| Gameplay | Calm, happy loop; tempo increases during boss waves |
| Victory | Short celebratory fanfare |
| Game Over | Gentle, hopeful short piece (not sad) |

#### Particle Pack (Kenney)
Use for all visual effects:
- Tower fire trail particles
- Enemy death "poof" clouds
- Sunshine Points earned burst
- Level-up star burst
- Victory confetti
- Flower bloom celebration

---

## 5. GAME DESIGN SPECIFICATION

### 5.1 Core Loop

```
1. WORLD MAP     → Player selects a battle zone
2. PREP PHASE    → 30 seconds to place towers (Sunshine Points spent)
3. WAVE PHASE    → Enemies advance; towers auto-fire
4. BETWEEN WAVES → 15-second pause; earn points; place more towers
5. BATTLE END    → Star rating shown; points banked
6. UPGRADE SCREEN→ Spend points; level up Hannah / Garden
7. WORLD MAP     → Next battle unlocks if stars earned
```

### 5.2 Zone and Level Structure

| Zone | Name | Battles | New Enemy Introduced |
|---|---|---|---|
| 1 | Sunflower Meadow | 5 | Snake, Frog |
| 2 | Vegetable Garden | 5 | Gorilla, Parrot |
| 3 | Chicken Coop | 5 | Monkey |
| 4 | Berry Patch | 5 | Bear |
| 5 | Apple Orchard | 5 | Elephant (Boss) |
| 6+ | Endless Frontier | ∞ | All enemies, scaling difficulty |

Zone unlocks when the previous zone is 100% complete (at least 1 star on every battle). Zones 1–5 are hand-designed. Zone 6+ is procedurally generated using a wave difficulty multiplier: `difficulty = 1 + (waveNumber × 0.12)`.

### 5.3 Map Design

- Grid-based top-down tilemap; tile size **64×64px**
- Enemies follow a winding **waypoint path** (dirt/stone trail from Tower Defense Top-Down pack)
- **Buildable tiles** = grass/soil tiles flanking the path; marked `buildable: true` in tile properties
- **Non-buildable tiles** = path tiles, decoration tiles; marked `buildable: false`
- Each zone has **2–3 unique map layouts** (JSON tilemaps, Tiled-compatible) rotated randomly between replays
- Maps stored in `assets/kenney/tilemaps/`

### 5.4 Tower System

#### Placement
- Player taps/clicks a tower card → taps/clicks a valid tile → tower placed
- Valid tiles highlight **yellow** on hover; invalid tiles flash **red**
- Ghost preview sprite follows cursor/finger during selection
- Placement confirmed with "pop" SFX + flower burst particle
- Touch and mouse both supported

#### Tower Definitions (all characters from Section 4.1)

| Tower | Sprite Source | Cost | Damage | Range | Fire Rate | Unlock |
|---|---|---|---|---|---|---|
| Rabbit Guard | Animal Pack Redux — rabbit | 50 | None | 1 tile adjacent | Passive | Start |
| Chicken Cannon | Animal Pack Redux — chicken | 75 | 10 | 150px | 800ms | Start |
| Dog Patrol | Animal Pack Redux — dog | 100 | None | 100px | Passive | Hannah Lvl 2 |
| Owl Sniper | Animal Pack Redux — owl | 125 | 40 | 300px | 2000ms | Zone 2 |
| Duck Sprinkler | Animal Pack Redux — duck | 150 | None (50% slow) | 120px | Constant | Zone 2 |
| Penguin Freezer | Animal Pack Redux — penguin | 175 | None (freeze 1.5s) | 100px | 8000ms | Zone 3 |
| Pig Wall | Animal Pack Redux — pig | 200 | None (blocker) | 1 tile | Passive | Zone 3 |

#### Tower Upgrades — 3 Tiers Each
Each tower has 3 tiers. Upgrades are permanent (persist to next battle). Each tier must produce a **visible sprite change** (larger, different colour tint, or added particle aura) and a stat improvement.

Example — Chicken Cannon:
- Tier 1 (base): 1 egg, 150px range, 800ms fire rate
- Tier 2 (cost 100pts): 2 eggs fired simultaneously, 180px range, 700ms fire rate
- Tier 3 (cost 200pts): 3 eggs, eggs pierce 1 additional enemy, 200px range, 600ms fire rate

All 7 towers must have fully defined and implemented Tier 2 and Tier 3 stat blocks in `config.js`.

#### Tower Sell
Player can sell any tower for 50% of its original placement cost. Upgrade costs are not refunded.

### 5.5 Enemy System (all characters from Section 4.1)

| Enemy | Sprite Source | HP | Speed | Reward | Special Behaviour |
|---|---|---|---|---|---|
| Snake | Animal Pack Redux — snake | 40 | 60px/s | 10pts | None; basic tutorial target |
| Frog | Animal Pack Redux — frog | 60 | 40px/s | 15pts | On death: spawns 2 Snakes |
| Gorilla | Animal Pack Redux — gorilla | 80 | 130px/s | 20pts | Charges at full speed; cannot be slowed by Rabbit Guard |
| Parrot | Animal Pack Redux — parrot | 80 | 100px/s | 25pts | Flies; ignores path; moves in straight arc to gate; unaffected by Pig Walls |
| Monkey | Animal Pack Redux — monkey | 120 | 80px/s | 35pts | 20% chance per hit to steal 5 Sunshine Points from player |
| Bear | Animal Pack Redux — bear | 160 | 70px/s | 50pts | Deviates from path to attack nearest tower; tower takes 15 HP damage per hit |
| Elephant | Animal Pack Redux — elephant | 500 | 30px/s | 150pts | Armored (Chicken Cannon deals 0 damage); stomps cause AoE slow to all towers in 100px radius for 3s |

#### Lives and Star Rating
- Each battle starts with **20 lives** (heart icons in HUD)
- 1 life lost each time an enemy reaches the garden gate
- 0 lives → Game Over (encouraging message)
- Star rating based on lives remaining at battle end:
  - ⭐⭐⭐ 3 Stars: 15–20 lives remaining
  - ⭐⭐ 2 Stars: 8–14 lives remaining
  - ⭐ 1 Star: 1–7 lives remaining

#### Wave System
- Managed by `WaveManager.js`
- Each battle: minimum 5 waves, maximum 15 (scales with zone number)
- Between waves: **15-second countdown timer**
- "Send Next Wave Early" button available between waves: skips countdown, awards +10 Sunshine Points
- Wave compositions defined as JSON in `config.js`; later waves mix enemy types
- Zone 6+ waves are procedurally composed using difficulty scaling

### 5.6 Hannah Hero Unit

One Hannah per map; placed by the player at battle start on any buildable tile:
- Sprite: Roguelike Characters pack (see Section 4.2)
- Level badge displayed on her tile
- Three special abilities on cooldown (shown as large circular buttons in HUD):

| Ability | Cooldown | Effect |
|---|---|---|
| 🌟 Sunshine Burst | 30s | Deals 25 HP to all ground enemies currently on screen |
| 💧 Garden Rain | 45s | Restores all placed towers to full HP |
| 🌈 Rainbow Shield | 60s | All towers immune to damage for 8 seconds |

Abilities have a visible cooldown fill animation on their HUD buttons. Cooldown timers reduce as Hannah levels up.

### 5.7 Hannah's Level Progression (10 Levels)

| Level | XP Required | Unlock / Bonus |
|---|---|---|
| 1 | 0 | Rabbit Guard, Chicken Cannon; all 3 base abilities |
| 2 | 200 | Dog Patrol; Sunshine Burst range +25% |
| 3 | 500 | Owl Sniper; Garden Rain also repairs Pig Walls |
| 4 | 900 | Duck Sprinkler; Rainbow Shield duration +4s |
| 5 | 1,400 | Penguin Freezer; all ability cooldowns −10s |
| 6 | 2,000 | Pig Wall; 4th ability unlocked — Flower Bomb (AoE damage, 90s cooldown) |
| 7 | 3,000 | All towers +15% fire rate |
| 8 | 4,500 | Sunshine Burst fires twice per activation |
| 9 | 6,500 | Hannah can be placed on path-edge tiles |
| 10 | 9,000 | All towers begin each battle at Tier 2 automatically |

XP earned: Battle completion +50, 3-star bonus +25, boss kill +30.

### 5.8 Garden / Farm Level (6+ Levels)

| Garden Level | Unlock Condition | What Changes |
|---|---|---|
| 1 | Start | Zone 1 open; 3 tower build slots |
| 2 | Zone 1 complete | Zone 2 open; +2 build slots; Cow and Chick appear in background |
| 3 | Zone 2 complete | Zone 3 open; Horse and farm decorations appear |
| 4 | Zone 3 complete | Zone 4 open; 5 build slots; new path layouts available |
| 5 | Zone 4 complete | Zone 5 open; Elephant boss mode enabled |
| 6+ | Every 5 Endless battles | Cosmetic rewards: new foliage decorations, fence styles, flower colours |

Garden level-up animation: flowers bloom across full screen, banner drops from top, jingle plays.

### 5.9 Economy — Sunshine Points

| Source | Amount |
|---|---|
| Starting points per battle | 150 (Zone 1–2), 200 (Zone 3–4), 250 (Zone 5+) |
| Enemy kill reward | Per enemy table above |
| Wave completion bonus | +25 per wave |
| Early wave send bonus | +10 |
| 2-star battle completion | +25 |
| 3-star battle completion | +75 |

Points are persistent across battles. Balance is always visible in the HUD as a large yellow coin counter using the confirmed Game Icons coin sprite.

---

## 6. SCENE SPECIFICATIONS

### 6.1 BootScene.js
- Yellow background (`#FFD700`)
- Loading bar fills as Kenney assets load (all from AssetRegistry, built from confirmed paths)
- No audio before first user gesture
- Transitions to MainMenuScene at 100%

### 6.2 MainMenuScene.js
- 3-layer parallax scrolling garden background (using Foliage Sprites + Nature Kit tiles)
- Title "Hannah's Garden Defense" in `kenney_pixel` font, yellow with dark green outline
- Animated foliage decorations at screen bottom
- Name entry field (max 12 characters); saved to `localStorage`; pre-filled on return
- Buttons: **PLAY**, **LEADERBOARD**, **HOW TO PLAY**
- Background music starts here (first user gesture unlocks Web Audio)

### 6.3 WorldMapScene.js
- Overhead illustrated map of all zones
- Zone areas: large clickable regions, clearly labelled
- Locked zones: grey tint, Game Icons padlock overlay
- Unlocked zones: show star tally (e.g. ★★☆)
- Hannah's chick companion icon hops to selected zone
- Displays: Hannah Level badge, Garden Level, Sunshine Points balance

### 6.4 GameScene.js — Core Gameplay

#### Tilemap
- `this.make.tilemap()` loading zone JSON
- Layer 0: Ground tiles (Tower Defense Top-Down pack)
- Layer 1: Decorations (Foliage Sprites, Nature Kit — non-interactive)
- Layer 2: Tower placement grid overlay (yellow / red highlight per hover state)

#### Tower Placement Mode
- Tap tower card → ghost preview follows cursor/touch
- Valid = yellow highlight; invalid = red flash + rejection SFX
- Confirm: "pop" SFX + Particle Pack flower burst

#### Combat Loop (in `update()`)
- WaveManager spawns enemies on timer using Phaser's time events
- Enemies follow waypoints via a custom `PathManager` (waypoint array per map layout)
- Parrot enemy uses a separate aerial waypoint path (straight line, ignores ground layer)
- Towers scan for nearest enemy in range each update tick using `Phaser.Geom.Circle.Contains`
- Towers fire `Projectile` objects; projectiles use Phaser Arcade physics + `moveToObject()`
- On hit: enemy HP reduced, red tint flash, floating damage number tween
- On enemy death: Particle Pack "poof" animation, reward particle (+pts number floats up), enemy destroyed

#### Pause Menu
- Triggered by Escape key OR pause button tap
- Semi-transparent overlay with: Resume, Restart Battle, Back to Map, Toggle Music
- Pauses all game timers and physics

### 6.5 UIScene.js
- Launched in parallel with GameScene via `scene.launch('UIScene')`
- Renders all HUD: lives hearts, wave counter, Sunshine Points, Hannah ability buttons, tower tray
- Communicates with GameScene exclusively via `this.game.events` (Phaser global EventEmitter)
- Never accesses GameScene references directly

### 6.6 UpgradeScene.js
- Displayed after any Victory
- Lists all towers currently placed with upgrade cost and Tier description
- Hannah XP progress bar with level-up animation if threshold crossed
- Sunshine Points balance prominently displayed
- "NEXT BATTLE" and "BACK TO MAP" buttons

### 6.7 VictoryScene.js
- Confetti (Particle Pack) rains down; Foliage Sprites flowers bloom at screen edges
- Star rating: each star drops in with "ding" SFX, one at a time
- Sunshine Points earned shown with animated coin counter
- Hannah sprite plays idle/happy animation (if spritesheet frames available; otherwise gentle scale pulse)
- Score and stars posted to `/api/leaderboard` via `fetch()`
- Buttons: "UPGRADE & CONTINUE", "BACK TO MAP"

### 6.8 GameOverScene.js
**Tone: warm, encouraging, never frightening or discouraging.**
- Text: `"Oh no! The critters got through! Let's try again, Hannah! 🌻"`
- Shows wave number reached
- One friendly gameplay hint (randomised from a pool of 8)
- Gentle, hopeful background music
- Buttons: "TRY AGAIN", "BACK TO MAP"

### 6.9 LeaderboardScene.js
- Table: Rank | Name | Best Score | Battles Won | Total Stars
- Top 10 entries, ordered by total score
- 🥇🥈🥉 icons (from Game Icons pack) for positions 1–3
- Current player's row highlighted yellow
- Fetched from `/api/leaderboard` on scene entry
- "BACK" button

---

## 7. BACKEND API

### 7.1 server/index.js Requirements
- Serve `./dist` (Vite production build) as static files
- Mount all API routes under `/api/`
- Bind to `0.0.0.0:5050`
- CORS enabled for all LAN origins
- Log: timestamp, method, path for every request
- Graceful shutdown on `SIGINT`

### 7.2 Endpoints

| Method | Route | Body / Params | Response |
|---|---|---|---|
| GET | `/api/leaderboard` | — | Array of top 10 scores |
| POST | `/api/leaderboard` | `{ name, score, stars, zone, battle }` | Inserted row |
| GET | `/api/leaderboard/player/:name` | — | All scores for player |
| GET | `/api/progress/:name` | — | Full player save object |
| POST | `/api/progress` | `{ name, hannah_level, hannah_xp, garden_level, sunshine_points, battle_stars }` | Saved row |
| DELETE | `/api/progress/:name` | — | Deleted confirmation |

### 7.3 Database Schema

```sql
CREATE TABLE IF NOT EXISTS leaderboard (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  player_name TEXT    NOT NULL,
  score       INTEGER NOT NULL,
  stars_earned INTEGER NOT NULL,
  zone        INTEGER NOT NULL,
  battle      INTEGER NOT NULL,
  played_at   TEXT    DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS player_progress (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  player_name     TEXT    UNIQUE NOT NULL,
  hannah_level    INTEGER DEFAULT 1,
  hannah_xp       INTEGER DEFAULT 0,
  garden_level    INTEGER DEFAULT 1,
  sunshine_points INTEGER DEFAULT 150,
  battle_stars    TEXT    DEFAULT '{}',
  last_played     TEXT    DEFAULT (datetime('now'))
);
```

---

## 8. VISUAL DESIGN

### 8.1 Colour Palette

| Role | Name | Hex |
|---|---|---|
| Primary | Hannah Yellow | `#FFD700` |
| Background Grass | Soft Green | `#7EC850` |
| Path / Soil | Warm Tan | `#C8A96E` |
| UI Panel | Cream White | `#FFF9E6` |
| Button | Sunflower Orange | `#FF9F1C` |
| Button Text | Deep Brown | `#4A2C0A` |
| Enemy Threat | Soft Red | `#E63946` |
| Stars / Success | Bright Yellow | `#FFE135` |
| Accent | Sky Blue | `#A8DADC` |
| Outline / Shadow | Dark Olive | `#3D5A1F` |

### 8.2 Typography
- `kenney_pixel` for titles, banners, and wave announcements
- `kenney_future` for HUD, buttons, and scores
- All game text: white or yellow fill with dark outline stroke
- Minimum size: 18px rendered; HUD minimum 22px

### 8.3 Component Rules
- Buttons: rounded corners ≥16px radius, minimum tap target 80×80px
- Hover: `setScale(1.08)` ease-out over 60ms
- Press: `setScale(0.94)` instant
- Every button press plays the Interface Sounds "click" SFX
- Panels: cream background, 4px yellow border, soft shadow

### 8.4 Required Animations

| Trigger | Animation |
|---|---|
| Tower placed | Particle Pack flower burst; tower sprite bounces in with scale tween |
| Enemy hit | Red tint flash; floating damage number rises and fades |
| Enemy death | Particle Pack "poof" cloud; sprite shrinks and disappears |
| Wave start | Banner slides down from top: "Wave 3 of 8!" in `kenney_pixel` |
| Hannah levels up | Yellow star burst particles; "LEVEL UP!" ribbon tweens in |
| Garden levels up | Foliage Sprites flowers bloom left-to-right across screen; jingle plays |
| 3-star victory | Particle Pack confetti; each star drops in with "ding" |
| Ability activated | Screen-edge glow pulse matching ability colour |
| Lives ≤5 | Heart icons pulse red; warning tone from Interface Sounds |

### 8.5 Responsive and Touch Design
- Canvas: 1280×720 base resolution
- Phaser Scale mode: `Phaser.Scale.FIT` with `autoCenter: Phaser.Scale.CENTER_BOTH`
- Tower tray: bottom dock in landscape; right-side dock in portrait (detect via `window.innerHeight > window.innerWidth`)
- All interactable objects must respond to both `pointer` and `touch` events
- `<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">` required

---

## 9. AUDIO

### 9.1 Music (Kenney Music / Music Jingles)
- Default volume: 60%
- Menu: upbeat cheerful loop
- Gameplay: calm garden loop; speed increases 15% during boss waves
- Victory: short fanfare jingle (plays once, does not loop)
- Game Over: short gentle hopeful piece (plays once)

### 9.2 SFX (Kenney Interface Sounds)
Map the following events to the closest matching file found in the Interface Sounds pack via the Step 0 audio scan:

| Event | Target SFX Character |
|---|---|
| Tower placed | Positive short "pop" |
| Tower fires | Soft "pew" or "whoosh" |
| Enemy hit | Light "thud" |
| Enemy dies | Brief "poof" |
| Points earned | Bright "ding" or "coin" |
| Wave start | "Bell" or short fanfare |
| Button click | "Tick" or "click" |
| Invalid action | Low "buzz" |
| Ability used | "Swoosh" + ascending tone |
| Level up | "Power up" multi-tone |

### 9.3 AudioManager.js API
```javascript
AudioManager.playMusic('MENU')       // starts looping music
AudioManager.stopMusic()             // stops current music
AudioManager.playSFX('TOWER_PLACED') // plays one-shot SFX
AudioManager.setMusicVolume(0.6)
AudioManager.setSFXVolume(0.8)
AudioManager.toggleMute()            // persisted to localStorage
```

Web Audio context must be resumed on first user gesture. Handle Phaser's built-in audio unlock mechanism correctly.

---

## 10. TUTORIAL

### First-Time Tutorial (TutorialManager.js)
Runs once only; gated by `localStorage.getItem('tutorialComplete')`.

Five sequential steps with speech bubble overlays (UI Pack speech bubble background):
1. Arrow points to garden gate → "This is Hannah's garden! We have to protect it!"
2. Arrow points to tower tray → "These are your animal defenders! Tap one to choose it."
3. Highlights a valid green tile → "Now tap a green spot to put your defender there!"
4. Arrow points to wave button → "The naughty animals are coming! Tap to start the wave!"
5. Victory mini-moment → "Amazing! You earned Sunshine Points! Use them to buy more friends!"

On Step 5 completion: `localStorage.setItem('tutorialComplete', 'true')`. Tutorial never repeats.

### Hint Bubbles (HintBubble.js)
Active during Zone 1, Battles 1–3 only. A speech bubble appears from the Chick companion:
- Randomised from a pool of 8 tips (e.g. "Place defenders near the bends in the path!")
- Auto-dismisses after 4 seconds or on tap
- Never overlaps with wave action — only appears between waves

---

## 11. CONFIG.JS — SINGLE SOURCE OF TRUTH

All numeric game values live here. No magic numbers anywhere else in the codebase.

```javascript
export const GameConfig = {
  canvas:   { width: 1280, height: 720 },
  tileSize: 64,

  startingLives: 20,
  startingSunshinePoints: { zone1: 150, zone2: 150, zone3: 200, zone4: 200, zone5: 250, endless: 250 },
  waveCooldownSeconds: 15,
  earlyWaveBonusPoints: 10,

  starThresholds: { three: 15, two: 8 }, // lives remaining

  hannahXpThresholds: [0, 200, 500, 900, 1400, 2000, 3000, 4500, 6500, 9000],

  towers: {
    RABBIT:   { cost: 50,  slowPercent: 0.5, range: 64  },
    CHICKEN:  { cost: 75,  damage: 10, range: 150, fireRate: 800,  upgrades: [
      { damage: 20, range: 180, fireRate: 700, eggs: 2 },
      { damage: 30, range: 200, fireRate: 600, eggs: 3, pierce: 1 }
    ]},
    DOG:      { cost: 100, stunMs: 600, slowPercent: 0.35, range: 100 },
    OWL:      { cost: 125, damage: 40, range: 300, fireRate: 2000, upgrades: [
      { damage: 70,  range: 350, fireRate: 1800 },
      { damage: 110, range: 400, fireRate: 1500 }
    ]},
    DUCK:     { cost: 150, slowPercent: 0.5, range: 120 },
    PENGUIN:  { cost: 175, freezeMs: 1500, range: 100, cooldown: 8000 },
    PIG_WALL: { cost: 200, hp: 300, upgrades: [{ hp: 500 }, { hp: 800, thorns: 5 }] }
  },

  enemies: {
    SNAKE:    { hp: 40,  speed: 60,  reward: 10, damage: 1 },
    FROG:     { hp: 60,  speed: 40,  reward: 15, damage: 1, splitsInto: 2 },
    GORILLA:  { hp: 80,  speed: 130, reward: 20, damage: 1, immuneToSlow: true },
    PARROT:   { hp: 80,  speed: 100, reward: 25, damage: 2, flies: true },
    MONKEY:   { hp: 120, speed: 80,  reward: 35, damage: 3, stealChance: 0.2, stealAmount: 5 },
    BEAR:     { hp: 160, speed: 70,  reward: 50, damage: 4, targetsTowers: true, towerDmg: 15 },
    ELEPHANT: { hp: 500, speed: 30,  reward: 150, damage: 10, armored: true, stompRange: 100, stompSlowMs: 3000 }
  },

  audio: { musicVolume: 0.6, sfxVolume: 0.8 }
};
```

---

## 12. DEPLOYMENT — WINDOWS

### package.json
```json
{
  "name": "hannah-garden-defense",
  "version": "1.0.0",
  "scripts": {
    "dev":        "vite",
    "build":      "vite build",
    "start":      "node server/index.js",
    "setup":      "npm install && npm run build",
    "full-start": "npm run build && npm run start"
  }
}
```

### start.bat
```bat
@echo off
echo ===================================
echo   Hannah's Garden Defense
echo   Starting local game server...
echo ===================================
cd /d "%~dp0"
call npm run full-start
pause
```

### vite.config.js
```javascript
import { defineConfig } from 'vite';
export default defineConfig({
  root: 'public',
  publicDir: '../assets',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: { input: '../public/index.html' }
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: { '/api': 'http://localhost:5050' }
  }
});
```

### public/index.html
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
  <title>Hannah's Garden Defense 🌻</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #FFD700;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      overflow: hidden;
    }
    canvas { display: block; }
  </style>
</head>
<body>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

### README.md — Family Setup Steps
1. Install Node.js v18+ from nodejs.org
2. Copy project to `C:\Games\hannah-garden-defense\`
3. Extract all Kenney packs into `.\assets\kenney\` (each pack in its own subfolder)
4. Open Command Prompt in the project folder
5. Run: `npm run setup`
6. Run: `start.bat`
7. On the host machine: open `http://localhost:5050`
8. On any device on the same WiFi: open `http://<HOST-IP>:5050`

---

## 13. CODE QUALITY STANDARDS

- **No placeholder code.** Every function fully implemented.
- **No TODO comments** anywhere in production code.
- **ES Modules throughout** — `import` / `export` only; no `require()` in frontend.
- **Naming:** camelCase variables, PascalCase classes, SCREAMING_SNAKE_CASE constants.
- **JSDoc** on every class and every public method.
- **Error handling:** all `fetch()` calls and DB operations wrapped in `try/catch`.
- **No magic numbers.** Every tunable value lives in `config.js`.
- **Event-driven scene communication** via Phaser's EventEmitter — no direct scene references.
- **Mobile-first input** — never use mouse-only events; always pair with touch equivalents.
- **Audio context unlocked** on first user gesture only; no audio calls before that.
- **`better-sqlite3`** on the server (synchronous API) — do not use the async `sqlite3` package.

---

## 14. CHILD SAFETY AND ACCESSIBILITY

- **No violent imagery.** All enemy deaths produce Particle Pack cartoon "poof" clouds only.
- **Encouraging language.** Game Over is warm and friendly. Never use words like "fail," "lose," or "dead."
- **Large text.** Minimum 18px for any readable label; 22px minimum on HUD.
- **Colorblind-safe stars.** Use both colour (yellow vs grey) AND fill (solid vs outline) to convey star count.
- **No dark patterns.** No fake timers, no manipulative language, no "spend more to win."
- **Zero external requests** at runtime. All data goes to the local SQLite database only.
- **Audio defaults ON.** Mute toggle available in the pause menu and saved to localStorage.

---

## 15. DELIVERABLES CHECKLIST

### Step 0
- [ ] `png_files.txt` generated from disk scan
- [ ] `audio_files.txt` generated from disk scan
- [ ] `AssetRegistry.js` references only paths confirmed present in scan

### Core Game
- [ ] All 7 confirmed-animal tower types placed, firing, and upgradeable through 3 tiers
- [ ] All 7 confirmed-animal enemy types with correct special behaviours
- [ ] Parrot flies on aerial path (ignores ground tiles and Pig Walls)
- [ ] Frog correctly spawns 2 Snakes on death
- [ ] Gorilla immune to Rabbit Guard slow
- [ ] Monkey correctly steals Sunshine Points
- [ ] Bear correctly deviates to attack towers
- [ ] Elephant armored (Chicken Cannon does 0 damage) + stomp AoE
- [ ] Wave system across all 5 zones + Endless mode
- [ ] Hannah hero placed per battle, 3 abilities on cooldown
- [ ] Hannah level-up system: 10 levels, XP gating, all unlocks functional
- [ ] Garden level-up system: 6 levels, zone unlocks, cosmetic changes

### Economy
- [ ] Sunshine Points earn, spend, persist across battles
- [ ] Tower sell returns 50% of placement cost
- [ ] Points balance always visible in HUD

### Persistence
- [ ] SQLite DB auto-created on first run
- [ ] Player progress saves and loads correctly
- [ ] Battle star ratings persist per player per battle
- [ ] Family leaderboard shows top 10

### UI / UX
- [ ] All 9 scenes implemented and fully navigable
- [ ] Tutorial runs exactly once per player
- [ ] Hint bubbles active in Zone 1, Battles 1–3 only
- [ ] All animations from Section 8.4 implemented
- [ ] All interactions work on touch and mouse
- [ ] Canvas scales correctly to any viewport
- [ ] Pause menu works via Escape and tap

### Audio
- [ ] Music plays in correct scenes, loops properly
- [ ] All SFX events wired to confirmed Interface Sounds files
- [ ] Volume toggleable; mute state persists to localStorage
- [ ] No audio errors in browser console on any browser

### Deployment
- [ ] `npm run setup` completes without errors on Windows
- [ ] `start.bat` launches game at `0.0.0.0:5050`
- [ ] Game accessible from other LAN devices
- [ ] README includes family-friendly setup steps

---

## 16. FINAL NOTES

- **Step 0 is not optional.** Never write a path that was not found by the file scan.
- **Every character in this game is a confirmed Kenney animal.** There are no invented sprites, no assumed filenames, no placeholder paths.
- **Build in this order:** Boot → MainMenu → WorldMap → GameScene core loop → Enemies → Towers → UIScene → WaveManager → Economy → Hannah abilities → Upgrades → Victory/GameOver → Leaderboard → Tutorial → Polish.
- **Enemies and defenders are both animals because Hannah loves animals.** Even the bad guys are cute. They are naughty, not scary.
- **Hannah should win more than she loses.** Tune difficulty to make her feel like a champion every session.
- **When you have a free visual choice — use yellow.**

---

*End of Agent Prompt — Hannah's Garden Defense v1.2 (Confirmed Assets Only)*
*Every character, every sprite, every sound in this document was verified.*
*Build this with care. A little girl named Hannah is going to play it.* 🌻
