import { describe, it, expect } from 'vitest';
import { GameConfig } from '../src/config.js';

/**
 * Mirrors the anti-frustration cap in EnemyBehavior.enemyReachedGate:
 *   lifeLoss = min(enemy.damage, maxLifeLossPerLeak)
 */
function lifeLossForLeak(enemyType) {
  const cap = GameConfig.maxLifeLossPerLeak ?? Infinity;
  return Math.min(GameConfig.enemies[enemyType].damage, cap);
}

describe('gate-leak life loss cap', () => {
  it('defines a per-leak cap', () => {
    expect(GameConfig.maxLifeLossPerLeak).toBe(5);
  });

  it('clips the Elephant so one leak never wipes half the life bar', () => {
    expect(GameConfig.enemies.ELEPHANT.damage).toBeGreaterThan(GameConfig.maxLifeLossPerLeak);
    expect(lifeLossForLeak('ELEPHANT')).toBe(5);
  });

  it('leaves smaller enemies at their full damage', () => {
    expect(lifeLossForLeak('BEAR')).toBe(GameConfig.enemies.BEAR.damage);
    expect(lifeLossForLeak('SNAKE')).toBe(GameConfig.enemies.SNAKE.damage);
  });

  it('cap never exceeds a fifth of starting lives', () => {
    expect(GameConfig.maxLifeLossPerLeak).toBeLessThanOrEqual(GameConfig.startingLives / 4);
  });
});
