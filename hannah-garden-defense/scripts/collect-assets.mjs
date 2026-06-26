/**
 * Copy only the asset files the game actually loads into ./assets/
 * Run: node scripts/collect-assets.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildAssetCopyList } from './assetCopyManifest.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const gardenRoot = path.resolve(projectRoot, '..');
const destRoot = path.join(projectRoot, 'assets');

const copies = buildAssetCopyList().map(({ srcParts, destParts }) => ({
  src: path.join(gardenRoot, ...srcParts),
  dest: path.join(destRoot, ...destParts),
}));

if (fs.existsSync(destRoot)) {
  fs.rmSync(destRoot, { recursive: true, force: true });
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
if (missing.length) {
  console.error(`Missing ${missing.length} source files:`);
  missing.forEach((m) => console.error('  ', m));
  process.exit(1);
}
