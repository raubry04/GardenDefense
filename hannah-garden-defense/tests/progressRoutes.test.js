import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import progressRouter from '../server/routes/progress.js';
import db from '../server/db.js';

const TEST_PLAYER = 'VitestProgressGuard';

function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/progress', progressRouter);
  return app;
}

describe('progress route guards', () => {
  const app = createApp();
  const prevDeleteFlag = process.env.ALLOW_PROGRESS_DELETE;

  beforeAll(() => {
    db.prepare('DELETE FROM player_progress WHERE player_name = ?').run(TEST_PLAYER);
    process.env.ALLOW_PROGRESS_DELETE = 'false';
  });

  afterAll(() => {
    db.prepare('DELETE FROM player_progress WHERE player_name = ?').run(TEST_PLAYER);
    if (prevDeleteFlag === undefined) delete process.env.ALLOW_PROGRESS_DELETE;
    else process.env.ALLOW_PROGRESS_DELETE = prevDeleteFlag;
  });

  it('blocks DELETE unless ALLOW_PROGRESS_DELETE is true', async () => {
    await request(app).post('/api/progress').send({
      player_name: TEST_PLAYER,
      hannah_level: 2,
      sunshine_points: 100,
    });

    const res = await request(app).delete(`/api/progress/${TEST_PLAYER}`);
    expect(res.status).toBe(403);

    const stillThere = await request(app).get(`/api/progress/${TEST_PLAYER}`);
    expect(stillThere.status).toBe(200);
  });

  it('merges partial POST with existing row instead of wiping fields', async () => {
    await request(app).post('/api/progress').send({
      player_name: TEST_PLAYER,
      hannah_level: 4,
      hannah_xp: 900,
      sunshine_points: 500,
      unlocked_zone: 3,
      battle_stars: JSON.stringify({ 0: { 0: 3 } }),
    });

    const patchRes = await request(app).post('/api/progress').send({
      player_name: TEST_PLAYER,
      sunshine_points: 550,
    });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.hannah_level).toBe(4);
    expect(patchRes.body.unlocked_zone).toBe(3);
    expect(patchRes.body.sunshine_points).toBe(550);
    expect(JSON.parse(patchRes.body.battle_stars)).toEqual({ 0: { 0: 3 } });
  });
});
