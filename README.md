# Garden

Monorepo root for **Hannah's Garden Defense** and the source art packs used to build its runtime assets.

## Repository layout

```
Garden/
├── hannah-garden-defense/   # The game (Phaser 3 + Vite + Express)
├── Assets/                  # Craftpix & Kenney source packs (large, not in git)
├── Animal Pack Remastered/    # Animal sprites source pack (large, not in git)
└── docs/                    # Shared notes (optional)
```

The game lives in [`hannah-garden-defense/`](hannah-garden-defense/). See that folder's [README](hannah-garden-defense/README.md) for how to play and the full [documentation index](hannah-garden-defense/README.md#documentation) (player guide, gameplay, API, assets, testing, balance, development, architecture, changelog, contributing).

## Quick start

1. Install **Node.js 20+** ([nodejs.org](https://nodejs.org) or [nvm-windows](https://github.com/coreybutler/nvm-windows)).
2. Place the **Assets/** and **Animal Pack Remastered/** folders in this directory (same level as `hannah-garden-defense/`). These packs are gitignored because of size; you need them once to run `npm run assets`.
3. From `hannah-garden-defense/`:

   ```bash
   npm run setup
   start.bat
   ```

4. Open http://localhost:5050 (or your PC's LAN IP on phones/tablets).

## Git

This repo uses a single git root at `Garden/`. Typical workflow:

```bash
git status
git add hannah-garden-defense/
git commit -m "Describe your change"
```

**Tracked:** game source, collected runtime assets under `hannah-garden-defense/assets/`, config, docs.

**Ignored:** `node_modules/`, `dist/`, SQLite saves in `data/`, and the large source asset packs at repo root.

See [DEVELOPMENT.md](hannah-garden-defense/docs/DEVELOPMENT.md) for branch conventions and environment details.

## License & assets

Game code is project-owned. Sprites, tiles, audio, and fonts come from third-party packs (Craftpix, Kenney, etc.); retain their licenses if you redistribute assets.
