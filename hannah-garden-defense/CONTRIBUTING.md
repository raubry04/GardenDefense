# Contributing

Thank you for helping improve Hannah's Garden Defense!

## Before you start

1. Use **Node.js 20+** (`nvm use` reads `.nvmrc`).
2. From `hannah-garden-defense/` run `npm run setup` once.
3. Read [Development Guide](docs/DEVELOPMENT.md) and [Architecture](docs/ARCHITECTURE.md).

## Branching

- Work on a feature branch from the latest main/default branch.
- Keep commits focused; one logical change per commit when possible.

## Commit style

Use clear, imperative messages:

```
Add wave preview to battle HUD
Fix tower inspect closing on empty tap
Tune zone 0 wave counts in config
```

## Quality gate

Before opening a PR or merging, run:

```bash
npm run validate
```

This runs unit tests and checks that runtime assets exist on disk.

Optional but recommended:

```bash
npm run build
```

## What to commit

- Source under `src/`, `server/`, `scripts/`, tests, and docs.
- Updated `hannah-garden-defense/assets/` when `AssetRegistry.js` or the asset manifest changes.

## Do not commit

- `node_modules/`, `dist/`, SQLite files in `data/`.
- Secrets, `.env` files, API keys, or credentials.
- Large source art packs at the Garden repo root (they stay gitignored).

## Gameplay / balance changes

- Prefer tuning via `src/config.js` rather than hardcoding in logic.
- Update [BALANCE.md](docs/BALANCE.md) and [GAMEPLAY.md](docs/GAMEPLAY.md) when behavior changes.
- Add or extend Vitest coverage when changing wave generation or pure helpers.

## Documentation

- One canonical home per topic; link from [README.md](README.md) rather than duplicating.
- Document what the code **does today**, not aspirational features.

---

*Author: Bryan Rausch · Last updated: June 25, 2026*
