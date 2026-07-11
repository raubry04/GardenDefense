import { describe, it, expect, vi } from 'vitest';
import { EnemyBehavior } from '../src/battle/EnemyBehavior.js';
import { isBattleTerminal } from '../src/battle/battleTerminal.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

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

describe('defeat vs victory race', () => {
  it('isBattleTerminal is true for defeat or victory', () => {
    expect(isBattleTerminal({ _defeatHandled: false, _battleEnded: false })).toBe(false);
    expect(isBattleTerminal({ _defeatHandled: true, _battleEnded: false })).toBe(true);
    expect(isBattleTerminal({ _defeatHandled: false, _battleEnded: true })).toBe(true);
    expect(isBattleTerminal({ _defeatHandled: true, _battleEnded: true })).toBe(true);
  });

  it('GameScene gates update, wave completion, and battle-complete on isBattleTerminal', () => {
    const src = readFileSync(join(root, 'src/scenes/GameScene.js'), 'utf8');
    expect(src).toContain("import { isBattleTerminal } from '../battle/battleTerminal.js'");
    expect(src).toMatch(/if\s*\(\s*isBattleTerminal\(this\)\s*\)\s*return/);
    const matches = src.match(/isBattleTerminal\(this\)/g) || [];
    expect(matches.length).toBeGreaterThanOrEqual(3);
  });

  it('does not queue victory after defeat via battle-complete guard', () => {
    const scene = { _defeatHandled: true, _battleEnded: false };
    let victoryQueued = false;
    if (!isBattleTerminal(scene)) {
      scene._battleEnded = true;
      victoryQueued = true;
    }
    expect(victoryQueued).toBe(false);
    expect(scene._battleEnded).toBe(false);
  });

  it('wave completion does not run after defeat', () => {
    const onAllEnemiesDefeated = vi.fn();
    const scene = {
      _defeatHandled: true,
      _battleEnded: false,
      enemies: [],
      waveManager: {
        isWaveActive: () => true,
        spawnQueue: [],
        onAllEnemiesDefeated,
      },
    };
    if (!isBattleTerminal(scene)) {
      if (scene.waveManager.isWaveActive() && scene.waveManager.spawnQueue.length === 0) {
        let anyAlive = false;
        for (const e of scene.enemies) {
          if (e.alive) { anyAlive = true; break; }
        }
        if (!anyAlive) scene.waveManager.onAllEnemiesDefeated();
      }
    }
    expect(onAllEnemiesDefeated).not.toHaveBeenCalled();
  });
});

describe('lifecycle cleanup regressions', () => {
  it('UIScene uses a single shutdown cleanup path', () => {
    const src = readFileSync(join(root, 'src/scenes/UIScene.js'), 'utf8');
    expect(src).toContain('_cleanupOnShutdown');
    expect(src).toContain('this.events.once("shutdown", this._onShutdown)');
    const onceShutdown = (src.match(/events\.once\(\s*["']shutdown["']/g) || []).length;
    const onShutdown = (src.match(/events\.on\(\s*["']shutdown["']/g) || []).length;
    expect(onceShutdown).toBe(1);
    expect(onShutdown).toBe(0);
  });

  it('GameScene removes ESC and toggle-pause handlers in shutdown', () => {
    const src = readFileSync(join(root, 'src/scenes/GameScene.js'), 'utf8');
    expect(src).toContain("this.input.keyboard?.off('keydown-ESC', this._onEscKey)");
    expect(src).toContain("this.game.events.off('toggle-pause', this._onTogglePause)");
  });

  it('AbilityController cancels flower bomb arm timer on clear', () => {
    const src = readFileSync(join(root, 'src/battle/AbilityController.js'), 'utf8');
    expect(src).toContain('_flowerBombArmTimer');
    expect(src).toMatch(/_flowerBombArmTimer\.remove/);
  });

  it('pause settings import guards scene activity', () => {
    const src = readFileSync(join(root, 'src/scenes/GameScene.js'), 'utf8');
    expect(src).toMatch(/_openPauseSettings[\s\S]*?sys\?\.isActive/);
  });
});
