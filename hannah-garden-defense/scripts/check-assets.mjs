/**
 * Verify collected runtime assets exist under assets/.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { listRuntimeAssetDestPaths } from './assetCopyManifest.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(path.resolve(__dirname, '..'), 'assets');

const missing = listRuntimeAssetDestPaths().filter(
  (rel) => !fs.existsSync(path.join(assetsDir, rel)),
);

if (missing.length) {
  console.error(`Missing ${missing.length} runtime assets (run npm run assets):`);
  missing.forEach((m) => console.error('  ', m));
  process.exit(1);
}

console.log(`All ${listRuntimeAssetDestPaths().length} runtime assets present.`);
