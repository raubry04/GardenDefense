import { describe, it, expect } from 'vitest';
import { TowerTray } from '../src/ui/TowerTray.js';

function makeTray(overrides = {}) {
  const tray = Object.create(TowerTray.prototype);
  tray.hud = {
    waveBarBg: { y: 80 },
    _hudRow2Y: 80,
    ...overrides.hud,
  };
  tray.abilityBar = {
    sendWaveBg: {
      visible: true,
      active: true,
      x: 640,
      y: 520,
      displayWidth: 200,
      displayHeight: 50,
    },
    abilityButtons: [
      { circle: { active: true, x: 1200, y: 360, radius: 36 } },
    ],
    ...overrides.abilityBar,
  };
  tray.trayBgOuter = {
    active: true,
    y: 640,
    height: 94,
    ...overrides.trayBgOuter,
  };
  return tray;
}

describe('TowerTray.isDesignPointOverBlockingUI', () => {
  it('blocks points in the top HUD band', () => {
    const tray = makeTray();
    expect(tray.isDesignPointOverBlockingUI(640, 50)).toBe(true);
    expect(tray.isDesignPointOverBlockingUI(640, 200)).toBe(false);
  });

  it('blocks points over the tower tray', () => {
    const tray = makeTray();
    expect(tray.isDesignPointOverBlockingUI(640, 620)).toBe(true);
  });

  it('blocks points over send wave button', () => {
    const tray = makeTray();
    expect(tray.isDesignPointOverBlockingUI(640, 520)).toBe(true);
  });

  it('blocks points over ability buttons', () => {
    const tray = makeTray();
    expect(tray.isDesignPointOverBlockingUI(1200, 360)).toBe(true);
  });

  it('allows board taps away from HUD, tray, send wave, and abilities', () => {
    const tray = makeTray();
    expect(tray.isDesignPointOverBlockingUI(400, 400)).toBe(false);
  });
});
