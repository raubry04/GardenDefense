# Testing

*Audience: developers*

## Automated tests

Vitest runs pure logic tests (no browser):

```bash
npm test          # single run
npm run validate  # tests + asset manifest check
```

### Test files

| File | Covers |
|------|--------|
| `tests/hannahProgress.test.js` | Hannah XP / level helpers |
| `tests/waveManager.test.js` | Wave generation, preview API, zone 0 tuning |
| `tests/towerStats.test.js` | Tower inspect stat formatting |
| `tests/pathTile2D.test.js` | Path tile utilities |
| `tests/craftpixTiles.test.js` | Tile registry |
| `tests/progressSync.test.js` | Progress payload shape |

## Manual smoke checklist

After gameplay or UI changes:

1. **Boot** — game loads without console errors; missing assets show BootScene error UI if any.
2. **Zone 0 battle 0** — place Rabbit, send wave, wave preview visible between waves.
3. **Tower inspect** — tap placed tower → range + sell; tap grass to close.
4. **Victory** — stars, sunshine bank, progress sync (with server running).
5. **Mobile width** — tray and HUD readable; tap placement works.

## Lint

```bash
npm run lint
```

Included in CI-style workflows via `npm run validate` where configured.

## Pre-merge gate

From [CONTRIBUTING.md](../CONTRIBUTING.md):

```bash
npm run validate
npm run build   # recommended before release
```

---

*Author: Bryan Rausch · Last updated: June 25, 2026*
