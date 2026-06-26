# Assets

*Audience: developers and artists*

## Source packs (repo root, gitignored)

Place these **one folder above** `hannah-garden-defense/`:

| Folder | Contents |
|--------|----------|
| `Assets/` | Craftpix tiles, Kenney UI/audio |
| `Animal Pack Remastered/` | Round animal PNGs |

## Runtime assets

Collected copies live in `hannah-garden-defense/assets/` and are served at `/game-assets/`.

Generate or refresh:

```bash
npm run assets
```

The file list is driven by:

- [`src/utils/AssetRegistry.js`](../src/utils/AssetRegistry.js) — sprite keys and filenames
- [`scripts/assetCopyManifest.mjs`](../scripts/assetCopyManifest.mjs) — explicit copy map

Validation (`npm run validate`) runs [`scripts/check-assets.mjs`](../scripts/check-assets.mjs) to ensure every registered file exists.

## Build pipeline

1. `npm run assets` — copy into `assets/`
2. `npm run build` — Vite bundle to `dist/assets/`; [`scripts/copy-assets-to-dist.mjs`](../scripts/copy-assets-to-dist.mjs) copies media to `dist/game-assets/`
3. `npm run start` — Express serves `dist/` + `assets/` as `/game-assets/`

**Do not** put game media in `dist/assets/` — that path is reserved for JavaScript.

## Adding a new sprite

1. Add PNG to source pack (or `assets/` if hand-authored).
2. Register in `AssetRegistry.js` (`ENEMY_SPRITES`, `TOWER_SPRITES`, etc.).
3. Add manifest entry if using `assetCopyManifest.mjs`.
4. Run `npm run assets` and `npm run validate`.

## Credits

See [AUTHORS.md](../AUTHORS.md) for pack attributions.

---

*Author: Bryan Rausch · Last updated: June 25, 2026*
