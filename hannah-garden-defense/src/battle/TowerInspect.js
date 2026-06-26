import { GameConfig } from '../config.js';
import { formatTowerStats, towerDisplayName } from './towerStats.js';
import { TILE, COLORS } from './battleConstants.js';

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

  open(tower) {
    if (!tower || tower.hp <= 0) return;
    this.close();
    const s = this.scene;
    this.tower = tower;
    this.active = true;

    this._rangeCircle = s.add.circle(tower.x, tower.y, tower.range, COLORS.primary, 0.1)
      .setStrokeStyle(2, COLORS.primary, 0.45)
      .setDepth(97);

    const panelY = tower.y - TILE - 36;
    const refund = Math.floor(tower.cost * GameConfig.sellRefundPercent);
    const stats = formatTowerStats(tower.type, tower);
    const name = towerDisplayName(tower.type);
    const tierStars = tower.tier > 0 ? ' ' + '★'.repeat(Math.min(tower.tier, 3)) : '';

    const bg = s.add.rectangle(tower.x, panelY, 168, 118, 0x000000, 0.88)
      .setStrokeStyle(2, COLORS.stars)
      .setDepth(210);
    this._objects.push(bg);

    const title = s.add.text(tower.x, panelY - 44, `${name}${tierStars}`, {
      fontFamily: 'Kenney Future',
      fontSize: '13px',
      color: '#FFD700',
      align: 'center',
      wordWrap: { width: 150 },
    }).setOrigin(0.5, 0).setDepth(211);
    this._objects.push(title);

    const statText = s.add.text(tower.x, panelY - 22, stats.join('\n'), {
      fontFamily: 'Kenney Future',
      fontSize: '10px',
      color: '#FFF9E6',
      align: 'center',
      lineSpacing: 2,
    }).setOrigin(0.5, 0).setDepth(211);
    this._objects.push(statText);

    const note = s.add.text(tower.x, panelY + 28, 'Upgrade after battle', {
      fontFamily: 'Kenney Future',
      fontSize: '8px',
      color: '#A8DADC',
      align: 'center',
    }).setOrigin(0.5, 0).setDepth(211);
    this._objects.push(note);

    const sellBtn = s.add.rectangle(tower.x - 38, panelY + 48, 72, 26, COLORS.button)
      .setStrokeStyle(1, COLORS.outline)
      .setInteractive({ useHandCursor: true })
      .setDepth(211);
    const sellLabel = s.add.text(tower.x - 38, panelY + 48, `SELL +${refund}☀`, {
      fontFamily: 'Kenney Future',
      fontSize: '11px',
      color: '#4A2C0A',
    }).setOrigin(0.5).setDepth(212);
    this._objects.push(sellBtn, sellLabel);

    const closeBtn = s.add.rectangle(tower.x + 38, panelY + 48, 56, 26, 0x444444)
      .setStrokeStyle(1, COLORS.outline)
      .setInteractive({ useHandCursor: true })
      .setDepth(211);
    const closeLabel = s.add.text(tower.x + 38, panelY + 48, 'CLOSE', {
      fontFamily: 'Kenney Future',
      fontSize: '11px',
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
