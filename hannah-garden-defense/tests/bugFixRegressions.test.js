import { describe, it, expect, vi } from 'vitest';
import { EnemyBehavior } from '../src/battle/EnemyBehavior.js';

describe('game-over guard', () => {
  it('only transitions to GameOverScene once when multiple enemies reach the gate', () => {
    const start = vi.fn();
    const stop = vi.fn();
    const scene = {
      _defeatHandled: false,
      lives: 0,
      zone: 5,
      battle: 0,
      playerName: 'Test',
      waypoints: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
      cameras: { main: { shake: vi.fn() } },
      battleVfx: { burstGate: vi.fn(), destroyEnemyFx: vi.fn() },
      waveManager: { getCurrentWave: () => 12 },
      game: { events: { emit: vi.fn() } },
      scene: { start, stop },
    };

    const behavior = new EnemyBehavior(scene);
    const enemy = {
      damage: 1,
      sprite: { destroy: vi.fn() },
      hpBar: { destroy: vi.fn() },
      hpBarBg: { destroy: vi.fn() },
    };

    behavior.enemyReachedGate(enemy);
    behavior.enemyReachedGate(enemy);

    expect(start).toHaveBeenCalledTimes(1);
    expect(start).toHaveBeenCalledWith('GameOverScene', expect.objectContaining({ zone: 5 }));
  });
});
