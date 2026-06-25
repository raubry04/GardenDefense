import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.resolve(__dirname, 'assets');
const GAME_ASSETS_URL = '/game-assets';

function serveLocalAssets() {
  return {
    name: 'serve-local-assets',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith(`${GAME_ASSETS_URL}/`)) return next();
        const decoded = decodeURIComponent(req.url.split('?')[0]);
        const filePath = path.join(assetsDir, decoded.replace(new RegExp(`^${GAME_ASSETS_URL}/`), ''));
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          res.setHeader('Access-Control-Allow-Origin', '*');
          const stream = fs.createReadStream(filePath);
          const ext = path.extname(filePath).toLowerCase();
          const mimeTypes = {
            '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
            '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg', '.wav': 'audio/wav',
            '.ttf': 'font/ttf', '.json': 'application/json',
          };
          if (mimeTypes[ext]) res.setHeader('Content-Type', mimeTypes[ext]);
          stream.pipe(res);
        } else {
          next();
        }
      });
    },
  };
}

export default defineConfig({
  root: '.',
  publicDir: false,
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: { input: path.resolve(__dirname, 'index.html') },
  },
  plugins: [
    serveLocalAssets(),
    {
      name: 'copy-assets-to-dist',
      closeBundle() {
        const src = path.resolve(__dirname, 'assets');
        const dest = path.resolve(__dirname, 'dist', 'game-assets');
        if (!fs.existsSync(src)) return;
        fs.rmSync(dest, { recursive: true, force: true });
        fs.cpSync(src, dest, { recursive: true });
      },
    },
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: { '/api': 'http://localhost:5050' },
  },
});
