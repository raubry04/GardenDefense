import { ENEMY_SPRITES } from '../utils/AssetRegistry.js';
import { GameConfig } from '../config.js';

/**
 * Colour-blind-safe symbol badges for enemy threat tags. Keys match
 * GameConfig.enemyThreatTags values; aliases cover the raw enemy-config prop
 * spellings (splitsInto / immuneToSlow) so either naming resolves to a glyph.
 */
export const THREAT_BADGE = {
  flying: '✈',
  fast: '⚡',
  wallBreaker: '🧱',
  armored: '🛡',
  split: '✂',
  splitsInto: '✂',
  immuneSlow: '💨',
  immuneToSlow: '💨',
};

/**
 * Pure tag→badge lookup for a single threat tag.
 * @param {string} [tag]
 * @returns {string | null} the badge glyph, or null when unmapped/missing
 */
export function threatBadgeForTag(tag) {
  if (!tag) return null;
  return THREAT_BADGE[tag] ?? null;
}

const HUD_DEPTH = 199;
const MAX_ICONS = 6;
const ICON_STEP = 22;

export class WavePreview {
  /** @param {import("../scenes/UIScene.js").UIScene} scene */
  constructor(scene, hud) {
    this.scene = scene;
    this.hud = hud;
    this._icons = [];
    this._label = null;
    this._visible = false;
    this._lastPreview = null;
  }

  create() {
    const scene = this.scene;
    const y = this.hud._hudRow2Y - 28;
    this._label = scene.add.text(this.hud.wavePanel.x, y, 'Next:', {
      fontFamily: 'Kenney Future',
      fontSize: '11px',
      color: '#A8DADC',
    }).setOrigin(0.5, 1).setDepth(HUD_DEPTH).setVisible(false);
  }

  applyLayout(m) {
    if (m.hudRow2Y == null || !this._label?.active) return;
    const y = m.hudRow2Y - 28;
    this._label.setY(y);
    this._previewY = m.hudRow2Y - 14;
    if (this._lastPreview) this.update(this._lastPreview);
  }

  /** @param {{ wave: number, enemies: Record<string, number>, isBoss?: boolean, bossType?: string } | null} preview */
  update(preview) {
    this.clearIcons();
    this._lastPreview = preview;
    if (!preview || !Object.keys(preview.enemies).length) {
      this._visible = false;
      this._label?.setVisible(false);
      return;
    }

    this._visible = true;
    this._label?.setVisible(true);
    const entries = Object.entries(preview.enemies);
    const overflow = entries.length > MAX_ICONS ? entries.length - MAX_ICONS : 0;
    const shown = overflow > 0 ? entries.slice(0, MAX_ICONS) : entries;
    const iconCount = shown.length + (overflow > 0 ? 1 : 0);
    const startX = this.hud.wavePanel.x - (iconCount * ICON_STEP) / 2;
    const y = this._previewY ?? this.hud._hudRow2Y - 14;

    shown.forEach(([type, count], i) => {
      this._spawnIcon(type, count, startX + i * ICON_STEP + 10, y, preview);
    });

    if (overflow > 0) {
      const x = startX + shown.length * ICON_STEP + 10;
      const overflowLabel = this.scene.add.text(x, y, `+${overflow}`, {
        fontFamily: 'Kenney Future',
        fontSize: '11px',
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5).setDepth(HUD_DEPTH);
      this._icons.push(overflowLabel);
    }
  }

  _spawnIcon(type, count, x, y, preview) {
    const key = ENEMY_SPRITES[type];
    if (!this.scene.textures.exists(key)) return;
    const icon = this.scene.add.image(x, y, key)
      .setDisplaySize(18, 18)
      .setDepth(HUD_DEPTH);
    if (preview.isBoss && type === preview.bossType) {
      icon.setTint(0xff6666);
    }
    const threat = GameConfig.enemyThreatTags?.[type];
    const badgeGlyph = threatBadgeForTag(threat);
    if (badgeGlyph) {
      const badge = this.scene.add.text(x + 8, y - 10, badgeGlyph, {
        fontFamily: 'Kenney Future',
        fontSize: '8px',
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5).setDepth(HUD_DEPTH + 1);
      this._icons.push(badge);
    }
    const countText = this.scene.add.text(x + 10, y + 6, `×${count}`, {
      fontFamily: 'Kenney Future',
      fontSize: '9px',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0, 0.5).setDepth(HUD_DEPTH);
    this._icons.push(icon, countText);
  }

  setVisible(visible) {
    if (!visible) {
      this.clearIcons();
      this._label?.setVisible(false);
      this._visible = false;
      return;
    }
    if (this._icons.length) this._label?.setVisible(true);
  }

  clearIcons() {
    this._icons.forEach((o) => { if (o?.active) o.destroy(); });
    this._icons = [];
  }

  destroy() {
    this.clearIcons();
    this._label?.destroy();
  }
}
