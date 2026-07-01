import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

describe('mobile/iOS bug-hunt regressions', () => {
  it('BossBanner defines HUD_DEPTH (no ReferenceError on boss waves)', () => {
    const src = read('src/ui/BossBanner.js');
    expect(src).toMatch(/const\s+HUD_DEPTH\s*=/);
    expect(src).toContain('setDepth(HUD_DEPTH)');
  });

  it('GameScene guards battle-complete against double victory + late leaks', () => {
    const src = read('src/scenes/GameScene.js');
    // Guard flag initialised and used to gate the victory transition + update loop.
    expect(src).toContain('_battleEnded');
    expect(src).toMatch(/battle-complete'[\s\S]{0,80}if \(this\._battleEnded\) return;/);
    // Delayed VictoryScene start is guarded against a torn-down scene.
    expect(src).toMatch(/if \(!this\.sys\?\.isActive\?\.\(\)\) return;/);
  });

  it('GameScene removes scene-local event listeners on shutdown', () => {
    const src = read('src/scenes/GameScene.js');
    expect(src).toContain("this.events.off('enemy-spawn')");
    expect(src).toContain("this.events.off('battle-complete')");
  });

  it('EnemyBehavior ignores gate leaks once the battle is decided', () => {
    const src = read('src/battle/EnemyBehavior.js');
    expect(src).toMatch(/if \(s\._defeatHandled \|\| s\._battleEnded\)/);
  });

  it('TowerTray aborts tower drag on pointercancel (iOS gesture interrupt)', () => {
    const src = read('src/ui/TowerTray.js');
    expect(src).toContain('pointercancel');
    expect(src).toContain('_onTowerDragCancel');
  });

  it('AbilityBar guards against touch double-fire', () => {
    const src = read('src/ui/AbilityBar.js');
    expect(src).toMatch(/if \(btn\.pending\) return;/);
  });

  it('player-name storage helpers are guarded and reused by scenes', () => {
    const progress = read('src/utils/hannahProgress.js');
    expect(progress).toContain('export function loadPlayerName');
    expect(progress).toContain('export function savePlayerName');
    for (const scene of [
      'src/scenes/MainMenuScene.js',
      'src/scenes/WorldMapScene.js',
      'src/scenes/GameOverScene.js',
      'src/scenes/LeaderboardScene.js',
    ]) {
      const src = read(scene);
      expect(src).not.toContain("localStorage.getItem('hannahGarden_playerName')");
      expect(src).not.toContain("localStorage.setItem('hannahGarden_playerName'");
    }
  });

  it('main.js re-resumes audio on foreground (iOS backgrounding)', () => {
    const src = read('src/main.js');
    expect(src).toContain('visibilitychange');
    expect(src).toMatch(/game\.sound\?\.unlock\?\.\(\)/);
  });
});
