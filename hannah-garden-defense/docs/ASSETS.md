# Assets

*Audience: developers and artists*

## Animation and motion notes

**Animal Pack Remastered** (audited June 2026): `PNG/` contains static variants only (`Round`, `Square`, outline/detail variants). **No walk/attack spritesheets** — enemy motion uses procedural bob, squash, path-facing flip, and tint-based status FX.

**Kenney Particle Pack** — combat set copied into `kenney/particles/`:

| Key | Source file | Use |
|-----|-------------|-----|
| sparkle | star_04.png | Legacy + chicken eggs |
| smoke | smoke_03.png | Death poof |
| flame | flame_03.png | Gate breach, Flower Bomb |
| magic | magic_03.png | Tower place, slow towers |
| spark | spark_04.png | Hit burst, Dog |
| muzzle | muzzle_03.png | Tower muzzle flash |
| star | star_05.png | Death sparkle, abilities |
| slash | slash_02.png | Owl projectiles |

VFX presets live in [`src/battle/battleVfxConfig.js`](../src/battle/battleVfxConfig.js); runtime pooling in [`BattleVfx.js`](../src/battle/BattleVfx.js).

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
