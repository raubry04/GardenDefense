import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  HUD_PANEL_ALPHA,
  HUD_PANEL_FILL,
  MIN_WORLD_TEXT_PANEL_ALPHA,
  TEXT_PILL_BG,
  TEXT_STROKE,
  TEXT_STROKE_THICK,
  TEXT_SOFT_SHADOW,
  FONT_HUD,
  readableHudStyle,
  readableCaptionStyle,
  crispUiStyle,
  snapText,
  addCreamTextChip,
} from '../src/utils/textReadability.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

describe('text readability tokens', () => {
  it('keeps deprecated panel tokens for interactive cards', () => {
    expect(HUD_PANEL_ALPHA).toBeGreaterThanOrEqual(MIN_WORLD_TEXT_PANEL_ALPHA);
    expect(MIN_WORLD_TEXT_PANEL_ALPHA).toBeGreaterThanOrEqual(0.9);
    expect(HUD_PANEL_FILL).toBe(0xFFF9E6);
    expect(TEXT_PILL_BG.toLowerCase().startsWith('#fff9e6')).toBe(true);
  });

  it('exports cream stroke helpers for HUD labels', () => {
    expect(TEXT_STROKE.toLowerCase()).toBe('#fff9e6');
    expect(TEXT_STROKE_THICK).toBeGreaterThanOrEqual(3);
    const hud = readableHudStyle('22px');
    expect(hud.stroke).toBe(TEXT_STROKE);
    expect(hud.strokeThickness).toBe(TEXT_STROKE_THICK);
    expect(hud).not.toHaveProperty('backgroundColor');
    const cap = readableCaptionStyle('13px');
    expect(cap.strokeThickness).toBeGreaterThanOrEqual(2);
  });

  it('crispUiStyle uses Future + resolution (not Pixel stroke halos)', () => {
    const style = crispUiStyle('24px');
    expect(style.fontFamily).toBe(FONT_HUD);
    expect(style.resolution).toBeGreaterThanOrEqual(1);
    expect(style).not.toHaveProperty('strokeThickness');
    expect(TEXT_SOFT_SHADOW.offsetY).toBeLessThanOrEqual(1);
    expect(TEXT_SOFT_SHADOW.blur).toBe(0);
  });

  it('snapText rounds coordinates', () => {
    const obj = { x: 10.6, y: 3.2, setPosition(x, y) { this.x = x; this.y = y; } };
    snapText(obj);
    expect(obj.x).toBe(11);
    expect(obj.y).toBe(3);
  });

  it('addCreamTextChip builds a tight plate behind text bounds', () => {
    const added = [];
    const scene = {
      add: {
        rectangle(cx, cy, w, h, fill, alpha) {
          const r = {
            cx, cy, w, h, fill, alpha, depth: 0,
            setStrokeStyle() { return this; },
            setDepth(d) { this.depth = d; return this; },
          };
          added.push(r);
          return r;
        },
      },
    };
    const text = {
      depth: 5,
      getBounds: () => ({ x: 100, y: 40, right: 180, bottom: 70 }),
    };
    const chip = addCreamTextChip(scene, text, { padX: 10, padY: 6 });
    expect(chip).toBeTruthy();
    expect(chip.w).toBe(100);
    expect(chip.h).toBe(42);
    expect(chip.depth).toBe(4);
    expect(chip.fill).toBe(0xFFF9E6);
  });
});

describe('mobile text contrast regressions', () => {
  it('AbilityBar uses stroke HUD styles (no cream pills)', () => {
    const src = read('src/ui/AbilityBar.js');
    expect(src).toContain('readableHudStyle');
    expect(src).toContain('readableCaptionStyle');
    expect(src).not.toContain('TEXT_PILL_BG');
    expect(src).not.toContain('HUD_PANEL_ALPHA');
    expect(src).not.toContain('#000000aa');
    expect(src).not.toMatch(/0x000000,\s*0\.65/);
    expect(src).toMatch(/readableHudStyle\('15px'/);
  });

  it('BattleHud uses stroke readability without visible cream panels', () => {
    const src = read('src/ui/BattleHud.js');
    expect(src).toContain('readableHudStyle');
    expect(src).toContain('readableCaptionStyle');
    expect(src).toContain('livesPanel');
    expect(src).not.toContain('HUD_PANEL_ALPHA');
    expect(src).not.toContain('TEXT_PILL_BG');
    expect(src).not.toMatch(/0x000000,\s*0\.45/);
    // Panels are alpha-0 layout anchors only.
    expect(src).toMatch(/rectangle\([^)]*0\)/);
  });

  it('Toast and WavePreview use stroke styles (no backgroundColor pills)', () => {
    expect(read('src/ui/Toast.js')).toContain('readableHudStyle');
    expect(read('src/ui/Toast.js')).not.toContain('TEXT_PILL_BG');
    expect(read('src/ui/Toast.js')).not.toContain('backgroundColor');
    expect(read('src/ui/WavePreview.js')).toContain('readableCaptionStyle');
    expect(read('src/ui/WavePreview.js')).not.toContain('TEXT_PILL_BG');
    expect(read('src/ui/WavePreview.js')).not.toContain('backgroundColor');
  });

  it('WorldMap header uses Future + cream chip (no crushing stroke / huge black bar)', () => {
    const src = read('src/scenes/WorldMapScene.js');
    expect(src).not.toMatch(/width - 40,\s*76,\s*0x000000,\s*0\.4/);
    expect(src).not.toContain('HUD_PANEL_FILL');
    expect(src).not.toContain('HUD_PANEL_ALPHA');
    expect(src).toContain('crispUiStyle');
    expect(src).toContain('addCreamTextChip');
    expect(src).toContain('snapText');
    // Cream TEXT_STROKE halos crush glyphs — keep strokeThickness off World Map labels.
    expect(src).not.toContain('TEXT_STROKE');
    expect(src).not.toMatch(/strokeThickness:\s*[1-9]/);
  });

  it('WorldMap Hannah Lv, Album, and zone mastery meet kid mobile floors', () => {
    const src = read('src/scenes/WorldMapScene.js');
    // Secondary labels: size floor + cream chip helper (no glyph stroke).
    expect(src).toMatch(/Hannah Lv\.\s*\$\{[^}]+\}[\s\S]{0,220}crispUiStyle\('(2[2-9]|[3-9]\d)px'/);
    expect(src).toContain('addCreamTextChip(this, [nameText, levelText]');
    expect(src).not.toMatch(/Hannah Lv\.\s*\$\{[^}]+\}[\s\S]{0,280}strokeThickness/);
    // Album chip labels ≥20–22; button enlarged for tap + glyphs.
    expect(src).toMatch(/'Album'[\s\S]{0,140}fontSize:\s*'(2[0-9]|[3-9]\d)px'/);
    expect(src).toMatch(/filled\}\/\$\{total\}`[\s\S]{0,120}fontSize:\s*'(2[0-9]|[3-9]\d)px'/);
    expect(src).toMatch(/const btnW = 1[2-9]\d|const btnW = [2-9]\d\d/);
    expect(src).toMatch(/const btnH = 5[6-9]|const btnH = [6-9]\d/);
    // Zone mastery / "stars to perfect" ≥20px, cream/gold fill + dark shadow (no stroke).
    expect(src).toMatch(/to perfect this zone[\s\S]{0,160}fontSize:\s*'(2[0-9]|[3-9]\d)px'/);
    expect(src).toMatch(/🏅 \$\{badge\}[\s\S]{0,120}fontSize:\s*'(2[0-9]|[3-9]\d)px'/);
  });

  it('StickerBook tabs, helpers, and Power descriptions meet font floors', () => {
    const src = read('src/scenes/StickerBookScene.js');
    expect(src).toMatch(/tab\.label[\s\S]{0,120}fontSize:\s*'(1[8-9]|[2-9]\d)px'/);
    expect(src).toMatch(/Pick your bonus power for battles![\s\S]{0,160}fontSize:\s*'(1[8-9]|[2-9]\d)px'/);
    expect(src).toMatch(/Burst, Rain & Shield are always ready\.[\s\S]{0,160}fontSize:\s*'(1[8-9]|[2-9]\d)px'/);
    // Ability description / unlock line under Seed Storm / Flower Bomb.
    expect(src).toMatch(/cfg\?\.description[\s\S]{0,220}fontSize:\s*'(1[8-9]|[2-9]\d)px'/);
    expect(src).toMatch(/Win a battle to get a sticker[\s\S]{0,160}fontSize:\s*'(1[8-9]|[2-9]\d)px'/);
    expect(src).toMatch(/Perfect a zone[\s\S]{0,160}fontSize:\s*'(1[8-9]|[2-9]\d)px'/);
  });

  it('Upgrade coin / level / hints use stroke (no cream panels)', () => {
    const src = read('src/scenes/UpgradeScene.js');
    expect(src).not.toMatch(/0x000000,\s*0\.4\s*\)/);
    expect(src).not.toContain('HUD_PANEL_FILL');
    expect(src).not.toContain('TEXT_PILL_BG');
    expect(src).toContain('readableHudStyle');
  });
});
