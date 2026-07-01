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

describe('progress route server-side merge (no last-write-wins)', () => {
  const app = createApp();
  const MERGE_PLAYER = 'VitestMergePlayer';

  beforeAll(() => {
    db.prepare('DELETE FROM player_progress WHERE player_name = ?').run(MERGE_PLAYER);
  });

  afterAll(() => {
    db.prepare('DELETE FROM player_progress WHERE player_name = ?').run(MERGE_PLAYER);
  });

  it('never regresses XP/level/zone when a stale writer posts lower values', async () => {
    await request(app).post('/api/progress').send({
      player_name: MERGE_PLAYER,
      hannah_level: 6,
      hannah_xp: 2000,
      sunshine_points: 800,
      unlocked_zone: 4,
    });

    // A racing tab with stale, lower state posts after the higher write.
    const res = await request(app).post('/api/progress').send({
      player_name: MERGE_PLAYER,
      hannah_level: 2,
      hannah_xp: 300,
      sunshine_points: 100,
      unlocked_zone: 1,
    });

    expect(res.status).toBe(200);
    expect(res.body.hannah_xp).toBe(2000);
    expect(res.body.hannah_level).toBe(6);
    expect(res.body.sunshine_points).toBe(800);
    expect(res.body.unlocked_zone).toBe(4);
  });

  it('unions per-zone battle stars from both writers', async () => {
    await request(app).post('/api/progress').send({
      player_name: MERGE_PLAYER,
      battle_stars: JSON.stringify({ 0: { 0: 3 }, 1: { 0: 2 } }),
    });

    const res = await request(app).post('/api/progress').send({
      player_name: MERGE_PLAYER,
      battle_stars: JSON.stringify({ 0: { 0: 1, 1: 3 }, 2: { 0: 2 } }),
    });

    expect(res.status).toBe(200);
    expect(JSON.parse(res.body.battle_stars)).toEqual({
      0: { 0: 3, 1: 3 },
      1: { 0: 2 },
      2: { 0: 2 },
    });
  });

  it('still rejects invalid provided numeric fields with 400', async () => {
    const res = await request(app).post('/api/progress').send({
      player_name: MERGE_PLAYER,
      hannah_xp: -5,
    });
    expect(res.status).toBe(400);
  });
});

describe('meta sunshine bank server merge (earned-vs-spent)', () => {
  const app = createApp();
  const BANK_PLAYER = 'VitestBankPlayer';

  beforeAll(() => {
    db.prepare('DELETE FROM player_progress WHERE player_name = ?').run(BANK_PLAYER);
  });

  afterAll(() => {
    db.prepare('DELETE FROM player_progress WHERE player_name = ?').run(BANK_PLAYER);
  });

  it('max-merges earned/spent and persists spending against a stale writer', async () => {
    // Earned 1000, spent 200 → available 800.
    await request(app).post('/api/progress').send({
      player_name: BANK_PLAYER,
      meta_sunshine_earned: 1000,
      meta_sunshine_spent: 200,
    });

    // A stale tab reposts the pre-spend state (spent 0). Spending must survive.
    const res = await request(app).post('/api/progress').send({
      player_name: BANK_PLAYER,
      meta_sunshine_earned: 1000,
      meta_sunshine_spent: 0,
    });

    expect(res.status).toBe(200);
    expect(res.body.meta_sunshine_earned).toBe(1000);
    expect(res.body.meta_sunshine_spent).toBe(200);
    // Derived available balance is kept in sync for backward compatibility.
    expect(res.body.sunshine_points).toBe(800);
  });

  it('grows earned when a later victory deposits more', async () => {
    const res = await request(app).post('/api/progress').send({
      player_name: BANK_PLAYER,
      meta_sunshine_earned: 1500,
      meta_sunshine_spent: 200,
    });
    expect(res.status).toBe(200);
    expect(res.body.meta_sunshine_earned).toBe(1500);
    expect(res.body.meta_sunshine_spent).toBe(200);
    expect(res.body.sunshine_points).toBe(1300);
  });
});
