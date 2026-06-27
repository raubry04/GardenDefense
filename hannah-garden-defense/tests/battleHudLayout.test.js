import { describe, it, expect, beforeAll } from 'vitest';
import { BattleHud } from '../src/ui/BattleHud.js';
import { computeDesignUIMetrics } from '../src/utils/battleLayout.js';

describe('BattleHud.applyLayout idempotency', () => {
  beforeAll(() => {
    globalThis.document = { documentElement: {} };
    globalThis.getComputedStyle = () => ({ getPropertyValue: () => '' });
    globalThis.window = {
      innerWidth: 390,
      innerHeight: 844,
      matchMedia: () => ({ matches: false }),
    };
  });

  function makeHud() {
    const hud = Object.create(BattleHud.prototype);
    hud._canonicalRow1Y = 36;
    hud._canonicalRow2Y = 68;
    hud.heartIcons = [{ active: true, getData: () => 20, setY: function (y) { this.y = y; }, y: 20 }];
    hud.livesText = { active: true, getData: () => 26, setY(v) { this.y = v; }, y: 26 };
    hud.wavePanel = { active: true, getData: () => 80, setY(v) { this.y = v; }, y: 80 };
    hud.waveText = { active: true, getData: () => 64, setY(v) { this.y = v; }, y: 64 };
    hud.waveBarBg = { active: true, getData: () => 96, setY(v) { this.y = v; }, y: 96 };
    hud.waveBarFill = { active: true, getData: () => 96, setY(v) { this.y = v; }, y: 96 };
    hud.pauseBtn = { active: true, getData: () => 36, setY(v) { this.y = v; }, y: 36 };
    hud._repositionTopRight = () => {};
    return hud;
  }

  it('applies the same Y positions when layout metrics are unchanged', () => {
    const hud = makeHud();
    const m = computeDesignUIMetrics(390, 844);
    hud.applyLayout(m);
    const firstPauseY = hud.pauseBtn.y;
    const firstWaveY = hud.wavePanel.y;

    hud.applyLayout(m);
    hud.applyLayout(m);

    expect(hud.pauseBtn.y).toBe(firstPauseY);
    expect(hud.wavePanel.y).toBe(firstWaveY);
  });
});
