/** Copy assets/ into dist/game-assets/ after each production build. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const src = path.join(projectRoot, 'assets');
const dest = path.join(projectRoot, 'dist', 'game-assets');

if (!fs.existsSync(src)) {
  console.error('Missing assets folder — run: npm run assets');
  process.exit(1);
}

fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });
console.log(`Copied assets to ${dest}`);
