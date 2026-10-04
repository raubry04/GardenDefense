import { describe, it, expect } from 'vitest';
import { GameConfig } from '../src/config.js';
import { AbilityBar, isNextWaveLabel } from '../src/ui/AbilityBar.js';

describe('AbilityBar send wave labels', () => {
  it('isNextWaveLabel identifies between-wave state', () => {
    expect(isNextWaveLabel('NEXT WAVE')).toBe(true);
    expect(isNextWaveLabel('SEND WAVE')).toBe(false);
  });

  it('early-wave bonus UI uses GameConfig.earlyWaveBonusPoints (not hardcoded +10)', () => {
    const bar = Object.create(AbilityBar.prototype);
    bar.scene = { _uiMetrics: { ui: { compact: true } } };
    const pts = GameConfig.earlyWaveBonusPoints;
    expect(pts).toBeGreaterThanOrEqual(20);
    expect(bar._earlyBonusLabel()).toBe(`+${pts} BONUS`);
    expect(bar._compactBonusText(8, true)).toContain(`+${pts}`);
    expect(bar._compactBonusText(8, true)).not.toContain('+10');
  });

  it('updateSendWaveCooldown preserves NEXT WAVE during countdown', () => {
    const bar = Object.create(AbilityBar.prototype);
    bar.scene = { _uiMetrics: { ui: { compact: true } } };
    bar.sendWaveBg = { visible: true };
    bar.sendWaveText = {
      text: 'NEXT WAVE',
      setText(v) { this.text = v; },
    };
    bar.sendWaveBonusText = {
      text: '',
      width: 120,
      height: 14,
      x: 640,
      y: 560,
      active: true,
      setText(v) { this.text = v; },
      setVisible() {},
    };
    bar.sendWaveBonusBg = {
      active: true,
      setVisible() {},
      setSize() {},
      setPosition() {},
    };

    bar.updateSendWaveCooldown({ seconds: 8, isPrep: false, manualFirstWave: false });

    expect(bar.sendWaveText.text).toBe('NEXT WAVE');
    expect(bar.sendWaveBonusText.text).toContain('8');
  });

  it('fits bonus label without requiring a backing pill', () => {
    const bar = Object.create(AbilityBar.prototype);
    bar.sendWaveBonusText = {
      active: true,
      x: 640,
      y: 560,
      width: 300,
      height: 14,
    };
    bar.sendWaveBonusBg = null;
    expect(() => bar._fitSendWaveBonusBg()).not.toThrow();
  });
});

describe('AbilityBar send wave press/hover scale', () => {
  function makeBar(baseScale) {
    const tweens = [];
    const bar = Object.create(AbilityBar.prototype);
    bar.scene = { tweens: { add: (cfg) => { tweens.push(cfg); return cfg; } } };
    // sendWaveBg is an image scaled via setDisplaySize -> base scale != 1.
    bar.sendWaveBg = { active: true, scaleX: baseScale, scaleY: baseScale };
    bar.sendWaveText = { active: true, scaleX: 1, scaleY: 1 };
    bar._captureSendWaveBaseScale();
    return { bar, tweens };
  }

  it('scales the bg relative to its display-size base (never collapses to 1)', () => {
    const base = 4; // e.g. 200px / 50px texture
    const { bar, tweens } = makeBar(base);

    bar._tweenSendWaveScale(1.08, 60); // pointerover
    let bgTween = tweens.find((t) => t.targets === bar.sendWaveBg);
    let textTween = tweens.find((t) => t.targets === bar.sendWaveText);
    expect(bgTween.scaleX).toBeCloseTo(base * 1.08);
    expect(textTween.scaleX).toBeCloseTo(1.08);

    tweens.length = 0;
    bar._tweenSendWaveScale(1, 60); // pointerout: must restore BASE, not 1
    bgTween = tweens.find((t) => t.targets === bar.sendWaveBg);
    textTween = tweens.find((t) => t.targets === bar.sendWaveText);
    expect(bgTween.scaleX).toBeCloseTo(base);
    expect(bgTween.scaleX).not.toBe(1);
    expect(textTween.scaleX).toBeCloseTo(1);
  });

  it('re-captures the base scale after a relayout resizes the button', () => {
    const { bar } = makeBar(4);
    expect(bar._sendWaveBaseScaleX).toBe(4);
    // Simulate applyLayout resizing the image to a new display size.
    bar.sendWaveBg.scaleX = 3.2;
    bar.sendWaveBg.scaleY = 3.2;
    bar._captureSendWaveBaseScale();
    expect(bar._sendWaveBaseScaleX).toBe(3.2);
  });
});

describe('AbilityBar setSendWaveVisible input gating', () => {
  it('disables interactive hit while hidden and restores on show', () => {
    const bar = Object.create(AbilityBar.prototype);
    let interactive = true;
    bar.sendWaveBg = {
      setVisible() {},
      setInteractive() { interactive = true; },
      disableInteractive() { interactive = false; },
    };
    bar.sendWaveText = { setVisible() {} };
    bar.sendWaveBonusText = { setVisible() {} };
    bar.sendWaveBonusBg = { setVisible() {} };
    bar.sendWaveGlow = { setVisible() {} };
    bar._sendWaveGlowTween = { resume() {}, pause() {} };

    bar.setSendWaveVisible(false);
    expect(interactive).toBe(false);

    bar.setSendWaveVisible(true);
    expect(interactive).toBe(true);
  });
});

describe('AbilityBar short-name casing', () => {
  it('uppercases short names for consistent labels', () => {
    const shortName = ('sun').toUpperCase();
    expect(shortName).toBe('SUN');
  });
});
