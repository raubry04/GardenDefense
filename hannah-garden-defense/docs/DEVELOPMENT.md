# Development guide

## Environment (Node.js)

This project is **JavaScript/Node.js**, not Python. There is no Python virtual environment.

Isolation works like this:

| Concept | Python | This project |
|---------|--------|--------------|
| Runtime version | `python3.11` | Node 20+ (see `.nvmrc`) |
| Isolated dependencies | `venv/` + `pip install` | `node_modules/` + `npm install` |
| Lock file | `requirements.txt` | `package-lock.json` |

### First-time setup

```bash
cd hannah-garden-defense

# Optional: pin Node version (nvm, fnm, or nvm-windows)
nvm use          # reads .nvmrc → 20

npm run setup    # install deps, collect assets, build
npm run start    # or: start.bat
```

`.npmrc` sets `engine-strict=true`, so npm warns if Node is below the version in `package.json` `engines`.

### Day-to-day

```bash
npm run dev:all  # Vite HMR + API on one command
npm run dev      # hot reload on :5173 (run server separately for API)
npm run build    # refresh dist/ after code changes
npm run start    # serve dist/ on :5050
npm test         # unit tests
npm run validate # tests + asset check
```

### Dev vs production

- **Dev:** `vite` serves source with HMR; `/game-assets` middleware reads from `assets/`.
- **Prod:** `vite build` writes JS to `dist/assets/`; game media is copied to `dist/game-assets/`. Express serves both.

## Source asset packs

Large packs live at the **Garden repo root** (gitignored):

- `Assets/` — Craftpix tiles, Kenney UI/audio
- `Animal Pack Remastered/` — round animal PNGs

`npm run assets` copies only the **78 files** the game loads into `hannah-garden-defense/assets/`. Commit those collected files so clones can run without the full packs; re-run `assets` after changing `AssetRegistry.js` or `collect-assets.mjs`.

## Git workflow

Git root is **`Garden/`** (parent of this folder).

### What to commit

- `src/`, `server/`, `scripts/`, config files, docs
- `hannah-garden-defense/assets/` (collected runtime assets)
- `package.json`, `package-lock.json`

### What stays ignored

- `node_modules/`
- `dist/` (rebuild with `npm run build`)
- `data/` and `*.db` (player saves)
- Root `Assets/` and `Animal Pack Remastered/` source packs

### Suggested first commit (from repo root)

```bash
cd c:\Scripts\Garden
git add .gitignore .gitattributes .editorconfig README.md hannah-garden-defense/
git status   # review before committing
git commit -m "Add Hannah's Garden Defense with docs and git setup"
```

### Branching

- `main` — playable builds
- Feature branches — `feature/wave-balance`, `fix/mobile-hud`, etc.

## VS Code / Cursor

Recommended extensions (optional):

- ESLint (if added later)
- EditorConfig (`.editorconfig` in repo root)

Workspace spell-check word list: `.vscode/settings.json` at repo root.

## Common tasks

### Add a new loaded asset

1. Add path in `src/utils/AssetRegistry.js` (use `/game-assets/...`).
2. Add copy rule in `scripts/collect-assets.mjs`.
3. Load in `src/scenes/BootScene.js` if needed.
4. Run `npm run assets` and verify in browser.

### Change server port

Edit `PORT` in `server/index.js` (default `5050`).

### Reset player progress

Delete `hannah-garden-defense/data/hannah.db` while the server is stopped.

## Troubleshooting

**`npm install` fails on `better-sqlite3`**

- Install [Windows Build Tools](https://github.com/nodejs/node-gyp#on-windows) or use Node LTS with prebuilt binaries.

**Assets 404 in browser**

- Confirm URL is `/game-assets/...`, not `/assets/...` (except the JS bundle).
- Run `npm run assets` and restart the server.

**Stale bundle on phone**

- Rebuild, restart server, hard-refresh Safari (or add to home screen again).
