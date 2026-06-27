import express from 'express';

import cors from 'cors';

import path from 'path';

import { fileURLToPath } from 'url';

import leaderboardRoutes from './routes/leaderboard.js';

import progressRoutes from './routes/progress.js';

import assetReviewRoutes from './routes/assetReview.js';

import db from './db.js';



const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const projectRoot = path.join(__dirname, '..');



const app = express();

const PORT = 5050;



app.use(cors());

app.use(express.json());



/** Log timestamp, method, and path for every request. */

app.use((req, _res, next) => {

  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);

  next();

});



app.use('/game-assets', express.static(path.join(projectRoot, 'assets')));

app.use(express.static(path.join(projectRoot, 'dist')));



app.use('/api/leaderboard', leaderboardRoutes);

app.use('/api/progress', progressRoutes);

if (process.env.NODE_ENV !== 'production') {

  app.use('/api/asset-review', assetReviewRoutes);

  app.get('/asset-review', (_req, res) => {

    res.sendFile(path.join(projectRoot, 'asset-review.html'));

  });

}



app.get('*', (_req, res) => {

  res.sendFile(path.join(projectRoot, 'dist', 'index.html'));

});



const server = app.listen(PORT, '0.0.0.0', () => {

  console.log(`Hannah's Garden Defense server running on http://0.0.0.0:${PORT}`);

});



/** Graceful shutdown — close the DB and HTTP server on SIGINT. */

process.on('SIGINT', () => {

  console.log('\nShutting down gracefully...');

  db.close();

  server.close(() => {

    console.log('Server closed.');

    process.exit(0);

  });

});


