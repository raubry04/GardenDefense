import { describe, it, expect } from 'vitest';
import { projectedStarsFromLives, starMeterHint } from '../src/ui/BattleHud.js';
import { abilityReadyLabel } from '../src/ui/AbilityBar.js';
import { isBattleTerminal } from '../src/battle/battleTerminal.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

describe('senior review remediations', () => {
  it('projects stars from lives using thresholds', () => {
    expect(projectedStarsFromLives(20)).toBe(3);
    expect(projectedStarsFromLives(15)).toBe(3);
    expect(projectedStarsFromLives(10)).toBe(2);
    expect(projectedStarsFromLives(5)).toBe(1);
    expect(projectedStarsFromLives(0)).toBe(0);
  });

  it('star meter hint teaches heart goals', () => {
    expect(starMeterHint(20)).toMatch(/3 stars/i);
    expect(starMeterHint(10)).toMatch(/3 stars/i);
    expect(starMeterHint(5)).toMatch(/2 stars/i);
  });

  it('ability ready label shows Ready! or seconds', () => {
    expect(abilityReadyLabel(false)).toBe('Ready!');
    expect(abilityReadyLabel(true, 3.2)).toBe('4s');
    expect(abilityReadyLabel(true, 0.1)).toBe('1s');
  });

  it('currency UI prefers ui_sunshine over star icons', () => {
    expect(read('src/ui/BattleHud.js')).toMatch(/ui_sunshine/);
    expect(read('src/ui/TowerTray.js')).toMatch(/ui_sunshine/);
    expect(read('src/ui/BattleHud.js')).not.toMatch(/"ui_uiStar"/);
  });

  it('battle tray uses garden green theme', () => {
    const src = read('src/ui/TowerTray.js');
    expect(src).toMatch(/0x1a2e14/);
    expect(src).not.toMatch(/0x1a1a2e/);
  });

  it('VFX emitters use NORMAL blend on grass', () => {
    expect(read('src/battle/BattleVfx.js')).toMatch(/blendMode:\s*'NORMAL'/);
  });

  it('enemy grid reuses Map instead of allocating each frame', () => {
    const src = read('src/battle/TowerCombat.js');
    expect(src).toContain('_gridCellPool');
    expect(src).toMatch(/this\._enemyGrid\.clear\(\)/);
    expect(src).not.toMatch(/const grid = new Map\(\)/);
  });

  it('tutorial gates place/send actions', () => {
    const content = read('src/data/tutorialContent.js');
    expect(content).toMatch(/requireAction:\s*'select-tower'/);
    expect(content).toMatch(/requireAction:\s*'place-tower'/);
    expect(content).toMatch(/requireAction:\s*'send-wave'/);
    const mgr = read('src/systems/TutorialManager.js');
    expect(mgr).toContain('notifyAction');
    expect(mgr).toContain('tower-placed');
  });

  it('dog/gorilla counter copy teaches stun vs slow-immune', () => {
    const hints = read('src/systems/TutorialManager.js');
    expect(hints).toMatch(/ignore.*slow|slow-immune|ignores slow/i);
    expect(hints).not.toMatch(/great against fast Gorillas!/);
  });

  it('boot applies NEAREST filter and sunshine texture', () => {
    const src = read('src/scenes/BootScene.js');
    expect(src).toContain('applyNearestFilterToTextures');
    expect(src).toContain('generateSunshineTexture');
  });

  it('isBattleTerminal still exported for race guards', () => {
    expect(isBattleTerminal({ _defeatHandled: true })).toBe(true);
  });

  it('pause menu brings GameScene above UIScene so overlay is tappable', () => {
    const src = read('src/scenes/GameScene.js');
    expect(src).toMatch(/_togglePause/);
    expect(src).toContain('this.scene.bringToTop()');
    expect(src).toContain("bringToTop('UIScene')");
  });

  it('star meter uses opaque panel not text backgroundColor smear', () => {
    const src = read('src/ui/BattleHud.js');
    expect(src).toContain('starMeterPanel');
    expect(src).toMatch(/_starMeterHearts/);
    expect(src).not.toMatch(/starMeterText[\s\S]{0,200}backgroundColor/);
  });
});
