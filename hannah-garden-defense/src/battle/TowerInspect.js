import { GameConfig } from '../config.js';
import { HUD_PANEL_ALPHA, HUD_PANEL_FILL, HUD_PANEL_STROKE, TEXT_ON_LIGHT, TEXT_GARDEN } from '../utils/textReadability.js';
import { formatTowerStats, towerDisplayName } from './towerStats.js';
import { TILE, COLORS } from './battleConstants.js';

const PANEL_W = 188;
const PANEL_H = 148;
const MARGIN = 8;

export class TowerInspect {
  constructor(scene) {
    this.scene = scene;
    this.active = false;
    this.tower = null;
    this._objects = [];
    this._rangeCircle = null;
  }

  isOpen() {
    return this.active;
  }

  _clampPanelPosition(towerX, towerY) {
    const view = this.scene.cameras.main.worldView;
    let panelX = towerX;
    let panelY = towerY - TILE - 36;

    const halfW = PANEL_W / 2;
    const halfH = PANEL_H / 2;
    if (panelY - halfH < view.y + MARGIN) {
      panelY = towerY + TILE + halfH + 12;
    }
    panelX = Phaser.Math.Clamp(panelX, view.x + halfW + MARGIN, view.right - halfW - MARGIN);
    panelY = Phaser.Math.Clamp(panelY, view.y + halfH + MARGIN, view.bottom - halfH - MARGIN);
    return { panelX, panelY };
  }

  open(tower) {
    if (!tower || tower.hp <= 0) return;
    this.close();
    const s = this.scene;
    this.tower = tower;
    this.active = true;

    this._rangeCircle = s.add.circle(tower.x, tower.y, tower.range, COLORS.primary, 0.1)
      .setStrokeStyle(2, COLORS.primary, 0.45)
      .setDepth(97);

    const { panelX, panelY } = this._clampPanelPosition(tower.x, tower.y);
    const refund = Math.floor(tower.cost * GameConfig.sellRefundPercent);
    const stats = formatTowerStats(tower.type, tower);
    const name = towerDisplayName(tower.type);
    const tierStars = tower.tier > 0 ? ' ' + '★'.repeat(Math.min(tower.tier, 3)) : '';

    const bg = s.add.rectangle(panelX, panelY, PANEL_W, PANEL_H, HUD_PANEL_FILL, HUD_PANEL_ALPHA)
      .setStrokeStyle(2, HUD_PANEL_STROKE)
      .setDepth(210);
    this._objects.push(bg);

    const title = s.add.text(panelX, panelY - 58, `${name}${tierStars}`, {
      fontFamily: 'Kenney Future',
      fontSize: '16px',
      color: TEXT_GARDEN,
      align: 'center',
      wordWrap: { width: 170 },
      shadow: { offsetX: 1, offsetY: 1, color: '#C8B890', blur: 0, fill: true },
    }).setOrigin(0.5, 0).setDepth(211);
    this._objects.push(title);

    const statText = s.add.text(panelX, panelY - 30, stats.join('\n'), {
      fontFamily: 'Kenney Future',
      fontSize: '13px',
      color: TEXT_ON_LIGHT,
      align: 'center',
      lineSpacing: 3,
      shadow: { offsetX: 1, offsetY: 1, color: '#C8B890', blur: 0, fill: true },
    }).setOrigin(0.5, 0).setDepth(211);
    this._objects.push(statText);

    const note = s.add.text(panelX, panelY + 34, 'Upgrade after battle', {
      fontFamily: 'Kenney Future',
      fontSize: '12px',
      color: TEXT_GARDEN,
      align: 'center',
    }).setOrigin(0.5, 0).setDepth(211);
    this._objects.push(note);

    const sellBtn = s.add.rectangle(panelX - 40, panelY + 56, 86, 44, COLORS.button)
      .setStrokeStyle(1, COLORS.outline)
      .setInteractive({ useHandCursor: true })
      .setDepth(211);
    const sellLabel = s.add.text(panelX - 40, panelY + 56, `SELL +${refund}`, {
      fontFamily: 'Kenney Future',
      fontSize: '13px',
      color: '#4A2C0A',
    }).setOrigin(0.5).setDepth(212);
    this._objects.push(sellBtn, sellLabel);

    const closeBtn = s.add.rectangle(panelX + 42, panelY + 56, 70, 44, 0x444444)
      .setStrokeStyle(1, COLORS.outline)
      .setInteractive({ useHandCursor: true })
      .setDepth(211);
    const closeLabel = s.add.text(panelX + 42, panelY + 56, 'CLOSE', {
      fontFamily: 'Kenney Future',
      fontSize: '13px',
      color: '#FFFFFF',
    }).setOrigin(0.5).setDepth(212);
    this._objects.push(closeBtn, closeLabel);

    sellBtn.on('pointerdown', () => {
      s.sound.play('buttonClick', { volume: GameConfig.audio.sfxVolume });
      s.towerPlacement.sellTower(tower, refund);
      this.close();
    });
    closeBtn.on('pointerdown', () => {
      s.sound.play('buttonClick', { volume: GameConfig.audio.sfxVolume * 0.6 });
      this.close();
    });

    s.game.events.emit('tower-inspect-open', { type: tower.type });
  }

  close() {
    if (!this.active) return;
    this.active = false;
    this.tower = null;
    this._objects.forEach((o) => { if (o?.active) o.destroy(); });
    this._objects = [];
    if (this._rangeCircle?.active) {
      this._rangeCircle.destroy();
      this._rangeCircle = null;
    }
    this.scene.game.events.emit('tower-inspect-close');
  }

  towerAt(col, row) {
    const s = this.scene;
    return s.towers.find((t) => t.gridRow === row && t.gridCol === col && t.hp > 0) ?? null;
  }
}
