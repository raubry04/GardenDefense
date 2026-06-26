import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import progressRouter from '../server/routes/progress.js';
import db from '../server/db.js';
import {
  progressToServerPayload,
  serverRowToProgress,
} from '../src/utils/hannahProgress.js';

const TEST_PLAYER = '__vitest_sync_player__';

function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/progress', progressRouter);
  return app;
}

describe('progress sync round-trip', () => {
  const app = createApp();

  beforeAll(() => {
    db.prepare('DELETE FROM player_progress WHERE player_name = ?').run(TEST_PLAYER);
  });

  afterAll(() => {
    db.prepare('DELETE FROM player_progress WHERE player_name = ?').run(TEST_PLAYER);
  });

  it('persists extended fields through POST and GET', async () => {
    const local = {
      playerName: TEST_PLAYER,
      hannahLevel: 3,
      hannahXp: 600,
      gardenLevel: 2,
      sunshinePoints: 420,
      unlockedZone: 2,
      zoneStars: { 0: 9, 1: 6 },
      zoneBattles: { 0: 5, 1: 2 },
      battleStars: { '0-0': 3, '1-1': 2 },
      towerUpgrades: { CHICKEN: 2, RABBIT: 1 },
    };

    const payload = progressToServerPayload(local);
    const postRes = await request(app).post('/api/progress').send(payload);
    expect(postRes.status).toBe(200);

    const getRes = await request(app).get(`/api/progress/${TEST_PLAYER}`);
    expect(getRes.status).toBe(200);

    const merged = serverRowToProgress(getRes.body, TEST_PLAYER);
    expect(merged.unlockedZone).toBe(2);
    expect(merged.zoneStars[0]).toBe(9);
    expect(merged.zoneBattles[1]).toBe(2);
    expect(merged.towerUpgrades.CHICKEN).toBe(2);
    expect(merged.battleStars['0-0']).toBe(3);
  });
});
