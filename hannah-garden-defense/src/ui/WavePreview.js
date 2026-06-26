import { ENEMY_SPRITES } from '../utils/AssetRegistry.js';
import { GameConfig } from '../config.js';

const THREAT_BADGE = {
  flying: '✈',
  fast: '⚡',
  wallBreaker: '🧱',
};

const HUD_DEPTH = 199;

export class WavePreview {
  /** @param {import("../scenes/UIScene.js").UIScene} scene */
  constructor(scene, hud) {
    this.scene = scene;
    this.hud = hud;
    this._icons = [];
    this._label = null;
    this._visible = false;
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

  /** @param {{ wave: number, enemies: Record<string, number>, isBoss?: boolean, bossType?: string } | null} preview */
  update(preview) {
    this.clearIcons();
    if (!preview || !Object.keys(preview.enemies).length) {
      this._visible = false;
      this._label?.setVisible(false);
      return;
    }

    this._visible = true;
    this._label?.setVisible(true);
    const entries = Object.entries(preview.enemies);
    const startX = this.hud.wavePanel.x - (entries.length * 22) / 2;
    const y = this.hud._hudRow2Y - 14;

    entries.forEach(([type, count], i) => {
      const x = startX + i * 22 + 10;
      const key = ENEMY_SPRITES[type];
      if (!this.scene.textures.exists(key)) return;
      const icon = this.scene.add.image(x, y, key)
        .setDisplaySize(18, 18)
        .setDepth(HUD_DEPTH);
      if (preview.isBoss && type === preview.bossType) {
        icon.setTint(0xff6666);
      }
      const threat = GameConfig.enemyThreatTags?.[type];
      if (threat && THREAT_BADGE[threat]) {
        const badge = this.scene.add.text(x + 8, y - 10, THREAT_BADGE[threat], {
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
    });
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
