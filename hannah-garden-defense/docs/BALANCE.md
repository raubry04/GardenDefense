# Balance tuning guide

All combat, economy, and progression numbers are centralized in [`src/config.js`](../src/config.js). Change values there, run `npm test`, then play-test zone 0 battle 1 and one late-zone boss.

## Workflow

1. Edit `GameConfig` in `config.js`.
2. Run `npm run validate`.
3. Manual smoke: prep phase, one full battle, victory bank deposit.
4. Document significant changes in [CHANGELOG.md](../CHANGELOG.md).

Avoid scattering magic numbers in scene files; battle modules read from `GameConfig`.

## Economy

| Key | Default | Effect |
|-----|---------|--------|
| `startingSunshinePoints` | zone1: 150 … zone5: 250 | In-battle placement budget at battle start |
| `metaSunshineBankRate` | `0.2` | Fraction of `(battle earnings + star bonuses)` deposited on victory |
| `earlyWaveBonusPoints` | `10` | Reward for Send Wave early |
| `waveCompletionBonus` | `25` | Per-wave completion (in-battle) |
| `twoStarBonus` / `threeStarBonus` | `25` / `75` | Added to earnings before meta bank rate |
| `sellRefundPercent` | `0.5` | Sell tower refund |

**Design note:** At 20% meta rate, zone 0 battle 1 yields roughly 102–132 bank points from a typical run — enough for one tier-1 upgrade, not instant max power.

## Lives and stars

| Key | Default |
|-----|---------|
| `startingLives` | `20` |
| `starThresholds.three` | `15` lives remaining |
| `starThresholds.two` | `8` lives remaining |

Lowering thresholds makes 3★ easier; raising `startingLives` affects both difficulty and star distribution.

## Hannah progression

| Key | Purpose |
|-----|---------|
| `hannahXpThresholds` | Cumulative XP per level (10 levels) |
| `hannahXpRewards.battleComplete` | +50 XP on victory |
| `hannahXpRewards.threeStarBonus` | +25 XP at 3★ |

Ability cooldown scaling is in `hannahProgress.js` (`adjustedAbilityCooldown`), not `config.js`.

Tower unlocks use `towers.*.unlock`: `{ type: 'level', value: N }` or `{ type: 'zone', value: N }` (zone is 1-based in config, compared to `scene.zone + 1` in UI).

## Towers

Each tower entry supports:

- Base stats: `cost`, `damage`, `range`, `fireRate`, `slowPercent`, `stunMs`, `freezeMs`, `hp`, `aoe`, etc.
- `upgrades[]`: tier deltas with `cost` for Upgrade screen

`applyTowerTierStats()` merges tiers cumulatively. Test tier math in `hannahProgress.test.js` when changing upgrade blocks.

**Combat interactions** (code, not config):

- `immuneToSlow` on Gorilla
- `immuneToStun` on Buffalo
- `armored` on Elephant (Chicken skips)
- `flies` on Parrot
- `wallDamageMult` on Buffalo vs Pig Wall

## Enemies

Per-enemy: `hp`, `speed`, `reward`, `damage`, plus optional flags (`splitsInto`, `stealChance`, `towerDmg`, `stompRange`, `speedBonus`, etc.).

Zone pools in `zones[].enemies` control which types `WaveManager` can spawn. Adding an enemy requires:

1. `enemies.TYPE` stats
2. Zone pool membership
3. `AssetRegistry` + manifest + BootScene load
4. Optional `enemyIntros.TYPE` toast string

## Waves — `GameConfig.waves`

| Key | Default | Effect |
|-----|---------|--------|
| `minWaves` / `maxWaves` | 5 / 15 | Zone 0 vs last campaign zone wave count |
| `baseCount` | 3 | Enemies in wave 0 before scaling |
| `countPerWave` | 1.2 | Added per wave index |
| `countPerBattle` | 2 | Added per battle index within zone |
| `bossWaveExtra` | 0.5 | Boss battle extra per wave |
| `spawnDelayMs` | 800 | Ms between spawns |
| `zoneIntro` | zone 0 gentle curve | Limits enemy variety early; battle 0 caps and manual first wave |

Zone 0 battle 1 (tutorial) tuning:

| Setting | Value | Notes |
|---------|-------|-------|
| `startingSunshinePoints.zone1` | 150 | Rabbit (50) + one Chicken (75); second Chicken needs early kills |
| Rabbit / Chicken tier-0 range | 112 / 210 px | ~1.75 / ~3.25 tiles; upgrade tiers unchanged relative to new bases |
| `zoneIntro[0].manualFirstWave` | true | Wave 1 only starts when player taps Send Wave |
| `zoneIntro[0].battle0MaxCount` | `[3,3,4,5,6]` | Per-wave enemy caps for battle 1 |
| `zoneIntro[0].lateFrogWeight` | 0.4 | Frogs from wave 3 onward in battle 1 |
| Tutorial tier override | `towerUpgrades = {}` | GameScene forces tier 0 on zone 0 battle 1 regardless of save file |

Wave timer pauses while `TutorialManager` overlay is active (`tutorial-state-changed`).

Also top-level:

| Key | Default |
|-----|---------|
| `prepPhaseSeconds` | 30 |
| `waveCooldownSeconds` | 15 |
| `bossWaveBonus` | +3 waves on final battle |
| `endlessDifficultyScale` | 0.08 per endless wave |

After changing wave keys, run `tests/waveManager.test.js`.

## Abilities — `hannahAbilities`

Adjust `cooldown`, `damage`, `duration`, `range`, and `unlockLevel` (Flower Bomb = 6).

## Suggested play-test matrix

| Scenario | What to watch |
|----------|----------------|
| Zone 0 battle 1 | Tutorial pacing, rabbit + chicken affordance |
| Zone 1 + Cow | Intro toast, wave preview accuracy |
| Zone 3 boss | Buffalo vs Pig Wall, wave count |
| Endless wave 10+ | Difficulty slope, performance |

## Related docs

- Player-facing summary: [GAMEPLAY.md](GAMEPLAY.md)
- Test gate: [TESTING.md](TESTING.md)
