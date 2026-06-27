import { describe, it, expect } from 'vitest';
import { AbilityBar, isNextWaveLabel } from '../src/ui/AbilityBar.js';

describe('AbilityBar send wave labels', () => {
  it('isNextWaveLabel identifies between-wave state', () => {
    expect(isNextWaveLabel('NEXT WAVE')).toBe(true);
    expect(isNextWaveLabel('SEND WAVE')).toBe(false);
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
      setText(v) { this.text = v; },
      setVisible() {},
    };
    bar.sendWaveBonusBg = { setVisible() {} };

    bar.updateSendWaveCooldown({ seconds: 8, isPrep: false, manualFirstWave: false });

    expect(bar.sendWaveText.text).toBe('NEXT WAVE');
    expect(bar.sendWaveBonusText.text).toContain('8');
  });
});
