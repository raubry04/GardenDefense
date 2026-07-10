import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  HUD_PANEL_ALPHA,
  MIN_WORLD_TEXT_PANEL_ALPHA,
  TEXT_PILL_BG,
} from '../src/utils/textReadability.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

describe('text readability tokens', () => {
  it('keeps world-overlaid panels near-opaque', () => {
    expect(HUD_PANEL_ALPHA).toBeGreaterThanOrEqual(MIN_WORLD_TEXT_PANEL_ALPHA);
    expect(MIN_WORLD_TEXT_PANEL_ALPHA).toBeGreaterThanOrEqual(0.9);
  });

  it('uses an opaque-enough CSS pill background (alpha channel >= ~0.9)', () => {
    // #RRGGBBAA — last two hex digits are alpha
    expect(TEXT_PILL_BG).toMatch(/^#[0-9a-fA-F]{8}$/);
    const aa = parseInt(TEXT_PILL_BG.slice(7, 9), 16);
    expect(aa / 255).toBeGreaterThanOrEqual(0.9);
  });
});

describe('mobile text contrast regressions', () => {
  it('AbilityBar uses shared opaque pills (not translucent black aa)', () => {
    const src = read('src/ui/AbilityBar.js');
    expect(src).toContain('TEXT_PILL_BG');
    expect(src).toContain('HUD_PANEL_ALPHA');
    expect(src).not.toContain('#000000aa');
    expect(src).not.toMatch(/0x000000,\s*0\.65/);
    expect(src).toMatch(/fontSize:\s*"15px"/); // short ability names
  });

  it('BattleHud wave/sun/lives panels stay near-opaque', () => {
    const src = read('src/ui/BattleHud.js');
    expect(src).toContain('HUD_PANEL_ALPHA');
    expect(src).toContain('TEXT_PILL_BG');
    expect(src).toContain('livesPanel');
    expect(src).not.toMatch(/0x000000,\s*0\.45/);
  });

  it('Toast and WavePreview use opaque text pills', () => {
    expect(read('src/ui/Toast.js')).toContain('TEXT_PILL_BG');
    expect(read('src/ui/WavePreview.js')).toContain('TEXT_PILL_BG');
  });

  it('WorldMap header is near-opaque (not 0.4 black)', () => {
    const src = read('src/scenes/WorldMapScene.js');
    expect(src).not.toMatch(/width - 40,\s*76,\s*0x000000,\s*0\.4/);
    expect(src).toMatch(/0x1a2e14,\s*0\.9[0-9]/);
  });

  it('Upgrade coin chip is near-opaque', () => {
    const src = read('src/scenes/UpgradeScene.js');
    expect(src).not.toMatch(/0x000000,\s*0\.4\s*\)/);
    expect(src).toMatch(/0x1a2e14,\s*0\.9[0-9]/);
  });
});
