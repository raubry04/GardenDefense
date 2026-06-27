/**
 * Copy only the asset files the game actually loads into ./assets/
 * Hand-curated craftpix/ folder is preserved across runs.
 * Run: node scripts/collect-assets.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildAssetCopyList, listRuntimeAssetDestPaths } from './assetCopyManifest.mjs';
import { listCraftpixRuntimePaths } from '../src/utils/craftpixTiles.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const gardenRoot = path.resolve(projectRoot, '..');
const destRoot = path.join(projectRoot, 'assets');
const craftpixDest = path.join(destRoot, 'craftpix');

const copies = buildAssetCopyList().map(({ srcParts, destParts }) => ({
  src: path.join(gardenRoot, ...srcParts),
  dest: path.join(destRoot, ...destParts),
}));

let craftpixBackup = null;
const craftpixBackupRoot = path.join(projectRoot, '.craftpix-backup');

if (fs.existsSync(craftpixDest)) {
  if (fs.existsSync(craftpixBackupRoot)) {
    fs.rmSync(craftpixBackupRoot, { recursive: true, force: true });
  }
  fs.cpSync(craftpixDest, craftpixBackupRoot, { recursive: true });
  craftpixBackup = craftpixBackupRoot;
}

if (fs.existsSync(destRoot)) {
  fs.rmSync(destRoot, { recursive: true, force: true });
}

if (craftpixBackup) {
  fs.mkdirSync(destRoot, { recursive: true });
  fs.cpSync(craftpixBackup, craftpixDest, { recursive: true });
  fs.rmSync(craftpixBackup, { recursive: true, force: true });
}

let copied = 0;
const missing = [];

for (const { src, dest } of copies) {
  if (!fs.existsSync(src)) {
    missing.push(src);
    continue;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  copied++;
}

console.log(`Copied ${copied} used asset files to ${destRoot}`);
if (craftpixBackup || fs.existsSync(craftpixDest)) {
  console.log('Preserved hand-curated craftpix/ folder');
}

const craftpixRequired = listCraftpixRuntimePaths();
const craftpixMissing = craftpixRequired.filter(
  (rel) => !fs.existsSync(path.join(destRoot, rel)),
);
if (craftpixMissing.length) {
  console.error(
    `Craftpix folder is incomplete after collect (${craftpixMissing.length} missing props/tiles).`,
  );
  console.error('Map decorations will not appear until craftpix/ is restored from git:');
  craftpixMissing.slice(0, 8).forEach((m) => console.error('  ', m));
  if (craftpixMissing.length > 8) {
    console.error(`  ... and ${craftpixMissing.length - 8} more`);
  }
  console.error('Fix: git checkout -- assets/craftpix  (or re-copy props from the Simple Summer pack)');
  process.exit(1);
}

const manifestMissing = listRuntimeAssetDestPaths().filter(
  (rel) => !rel.startsWith('craftpix/') && !fs.existsSync(path.join(destRoot, rel)),
);
if (manifestMissing.length) {
  console.error(`Missing ${manifestMissing.length} non-craftpix runtime assets after collect:`);
  manifestMissing.forEach((m) => console.error('  ', m));
  process.exit(1);
}

if (missing.length) {
  console.error(`Missing ${missing.length} source files:`);
  missing.forEach((m) => console.error('  ', m));
  process.exit(1);
}
