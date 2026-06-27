import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import leaderboardRouter, {
  validateLeaderboardStars,
  validateLeaderboardZone,
  validateLeaderboardBattle,
  validateLeaderboardMode,
} from '../server/routes/leaderboard.js';
import db from '../server/db.js';

const TEST_PLAYER = 'VitestLeaderboard';

function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/leaderboard', leaderboardRouter);
  return app;
}

describe('leaderboard validation helpers', () => {
  it('accepts valid stars, zone, battle, and mode values', () => {
    expect(validateLeaderboardStars(3)).toBe(true);
    expect(validateLeaderboardZone(5)).toBe(true);
    expect(validateLeaderboardBattle(2)).toBe(true);
    expect(validateLeaderboardMode('endless')).toBe(true);
  });

  it('rejects out-of-range values', () => {
    expect(validateLeaderboardStars(4)).toBe(false);
    expect(validateLeaderboardZone(6)).toBe(false);
    expect(validateLeaderboardBattle(10)).toBe(false);
    expect(validateLeaderboardMode('arcade')).toBe(false);
  });
});

describe('leaderboard routes', () => {
  const app = createApp();

  beforeAll(() => {
    db.prepare('DELETE FROM leaderboard WHERE player_name = ?').run(TEST_PLAYER);
  });

  afterAll(() => {
    db.prepare('DELETE FROM leaderboard WHERE player_name = ?').run(TEST_PLAYER);
  });

  it('stores endless mode separately from campaign', async () => {
    const endlessRes = await request(app).post('/api/leaderboard').send({
      player_name: TEST_PLAYER,
      score: 42,
      stars_earned: 0,
      zone: 5,
      battle: 0,
      mode: 'endless',
    });
    expect(endlessRes.status).toBe(201);
    expect(endlessRes.body.mode).toBe('endless');

    const campaignRes = await request(app).get('/api/leaderboard?mode=campaign');
    expect(campaignRes.status).toBe(200);
    expect(campaignRes.body.some((row) => row.player_name === TEST_PLAYER)).toBe(false);

    const endlessList = await request(app).get('/api/leaderboard?mode=endless');
    expect(endlessList.body.some((row) => row.player_name === TEST_PLAYER && row.score === 42)).toBe(true);
  });

  it('rejects invalid POST fields', async () => {
    const res = await request(app).post('/api/leaderboard').send({
      player_name: TEST_PLAYER,
      score: 10,
      stars_earned: 9,
      zone: 0,
      battle: 0,
    });
    expect(res.status).toBe(400);
  });
});
