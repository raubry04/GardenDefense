# Changelog

All notable changes to Hannah's Garden Defense are documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- **Upgrade all towers** — Upgrade screen lists every tower type (paginated); towers not used in the last battle show a subtle label.
- **Star replay loop** — Victory shows star improvement delta and replay hint; world map highlights battles with 1–2★ (`Chase ★` ring).
- **Boss banner** — Boss battles show a “BOSS INCOMING” banner in the final third of waves.
- **Elite HP bars** — Boss-type enemies get gold-trimmed HP bars; first hit triggers camera shake.
- **Threat telegraphs** — Wave preview badges for flying, fast, and wall-breaker enemies.
- **Battle music** — Looping battle BGM (menu track alias at lower volume) via `SceneMusicManager`.
- **Flower Bomb aim** — Tap to place the blast; auto-detonates at path center after 5s.
- **Enemy status tints** — Slow (blue), stun (white), and freeze (cyan) visual feedback.
- **Zone 1–2 balance** — `waves.zoneIntro` tuning for Berry Patch and Chicken Coop; boss HP/speed modifiers.
- **Root npm scripts** — `npm start` and `npm validate` from the Garden monorepo root.

### Added — Visual and effects pass

- **BattleVfx** — Pooled particle bursts, floating damage text, tower-specific projectiles, muzzle flashes.
- **Kenney combat particles** — flame, magic, spark, muzzle, star, slash textures wired into combat.
- **Enemy motion** — Walk bob, path-facing flip, flying shadows, elite aura rings, status rings.
- **Map ambience** — Zone mood tints, path-edge decals, swaying trees/bushes, gate sparkle bursts.
- **UI polish** — Kenney panel chrome on HUD/upgrade cards; trophy sprite on victory; textured zone map buttons.

### Fixed

- **Battle crash** — Removed invalid `_emitWaveCooldownIfChanged()` call from `UIScene.create()` (cooldown emit stays on `GameScene` only).

## [2026-06-25] — Player experience round 3

### Added

- **Settings menu** — Music and SFX volume sliders on the main menu; saved in localStorage.
- **Battle speed toggle** — 1x / 2x button next to pause (session-only; resets on pause).
- **Escape pause** — Desktop keyboard shortcut toggles pause (closes tower inspect first).
- **Wave cooldown HUD** — Prep and between-wave countdown on the Send Wave control instead of map overlay text.
- **Endless wave buffer** — Endless mode generates more waves on demand instead of ending at wave 50.
- **Endless leaderboard post** — Game over in Endless Frontier submits wave reached as score.

### Changed

- **Zone 0 battle 1 tutorial** — Wave timer pauses during the tutorial overlay; first wave requires tapping **Send Wave** (no auto-start).
- **Zone 0 balance** — Starting sunshine 150 (was 200); Rabbit range 112 / Chicken range 210 at tier 0; gentler wave 5 cap with more Frogs in late waves.
- **Tutorial battle tier override** — Zone 0 battle 1 ignores saved meta tower tiers so inspect rings match base stats.
- **Gate hit feedback** — Subtle camera shake when an enemy reaches the garden gate.

### Fixed

- Endless mode incorrectly triggering victory after pre-generated waves were exhausted.

## [2026-06-25] — Gameplay improvement round

### Added

- **Tower inspect panel** — Tap a placed defender to see range, stats, tier, and sell (mobile-friendly).
- **Wave preview** — Between waves, the HUD shows icons and counts for the next wave's enemies.
- **Config-driven waves** — Wave count and spawn tuning live in `GameConfig.waves` (`config.js`).
- **New enemies** — Cow (slow tank), Horse (fast runner), Buffalo (stun-immune wall breaker) in later zones.
- **First-seen enemy toasts** — Short callout when a new enemy type appears in a battle.
- Documentation set: Player Guide, Gameplay Reference, Balance Guide, API, Assets, Testing, Contributing, Authors.

### Changed

- Zone enemy pools updated to introduce Cow, Horse, and Buffalo progressively.
- Tutorial hints and enemy guide reflect inspect/sell and wave preview.
- Endless mode pre-generates 50 waves ahead (was 999).

## [2026-06-25] — Tech health milestone

### Added

- Vitest unit tests, ESLint, `npm run validate`, `npm run dev:all`.
- Battle modules under `src/battle/` and HUD widgets under `src/ui/`.
- Extended progress sync fields (`unlocked_zone`, `zone_stars`, `zone_battles`, `tower_upgrades`).
- Asset copy manifest (`scripts/assetCopyManifest.mjs`), Vite Phaser chunk split, lazy Victory/Leaderboard scenes.

### Removed

- Unused `src/entities/`, dead managers (`PathManager`, `EconomyManager`, `ProgressManager`, `AudioManager`).

### Fixed

- BootScene load-error UI; UIScene input and tower tray card reference bugs.

---

*Author: Bryan Rausch · Last updated: June 25, 2026*
