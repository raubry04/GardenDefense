import { GameConfig } from '../config.js';
import { TOWER_SPRITES } from '../utils/AssetRegistry.js';
import { applyTowerTierStats } from '../utils/hannahProgress.js';
import { TILE, COLORS } from './battleConstants.js';

export class TowerPlacement {
  constructor(scene) {
    this.scene = scene;
  }

  placementTileFromPointer(pointer) {
    const s = this.scene;
    const world = s.cameras.main.getWorldPoint(pointer.x, pointer.y);
    return {
      col: Math.floor(world.x / TILE),
      row: Math.floor(world.y / TILE),
    };
  }

  canAffordSelectedTower() {
    const s = this.scene;
    if (!s.selectedTower) return false;
    const towerConfig = GameConfig.towers[s.selectedTower];
    return towerConfig && s.sunshinePoints >= towerConfig.cost;
  }

  updateGhostAt(col, row) {
    const s = this.scene;
    if (!s.ghostPreview || !s.selectedTower) return;
    s.ghostPreview.setPosition(col * TILE + TILE / 2, row * TILE + TILE / 2);
    const validTile = this.isValidPlacement(row, col);
    const affordable = this.canAffordSelectedTower();
    const ok = validTile && affordable;
    s.ghostPreview.setAlpha(ok ? 0.7 : 0.3);
    s.ghostPreview.setTint(ok ? 0xFFD700 : 0xE63946);
    this.updateHoverTile(col, row, ok);
  }

  clearTowerSelection() {
    const s = this.scene;
    s.selectedTower = null;
    if (s.ghostPreview) {
      s.ghostPreview.destroy();
      s.ghostPreview = null;
    }
    this.clearHoverHighlight();
  }

  ensureGhostPreview() {
    const s = this.scene;
    if (!s.selectedTower) return;
    if (!s.ghostPreview || !s.ghostPreview.active) {
      this.createGhostPreview(s.selectedTower);
    }
  }

  handleTowerPlacement(pointer) {
    const s = this.scene;
    const { col, row } = this.placementTileFromPointer(pointer);

    this.ensureGhostPreview();
    this.updateGhostAt(col, row);

    if (!this.isValidPlacement(row, col)) {
      s.sound.play('invalidAction', { volume: GameConfig.audio.sfxVolume });
      this.flashInvalidTile(col, row);
      return false;
    }

    const towerConfig = GameConfig.towers[s.selectedTower];
    if (s.sunshinePoints < towerConfig.cost) {
      s.sound.play('invalidAction', { volume: GameConfig.audio.sfxVolume });
      s.game.events.emit('placement-rejected', { reason: 'afford' });
      return false;
    }

    s.sunshinePoints -= towerConfig.cost;
    s.game.events.emit('points-changed', { points: s.sunshinePoints });

    this.placeTower(s.selectedTower, row, col);
    s.sound.play('towerPlaced', { volume: GameConfig.audio.sfxVolume });
    return true;
  }

  setupInput() {
    const s = this.scene;
    s.input.on('pointermove', (pointer) => {
      if (!s.selectedTower) return;
      this.ensureGhostPreview();
      const { col, row } = this.placementTileFromPointer(pointer);
      this.updateGhostAt(col, row);
    });

    s.input.on('pointerdown', (pointer) => {
      const { col, row } = this.placementTileFromPointer(pointer);

      if (pointer.rightButtonDown()) {
        const tower = s.towers.find(t => t.gridRow === row && t.gridCol === col);
        if (tower && tower.hp > 0) this.showSellUI(tower);
        return;
      }

      if (s.selectedTower) return;

      const tower = s.towerInspect?.towerAt(col, row);
      if (tower) {
        if (s.towerInspect.isOpen() && s.towerInspect.tower === tower) {
          s.towerInspect.close();
        } else {
          s.towerInspect.open(tower);
        }
        return;
      }

      if (s.towerInspect?.isOpen()) {
        s.towerInspect.close();
      }
    });

    s.input.mouse.disableContextMenu();
  }

  isValidPlacement(row, col) {
    const s = this.scene;
    if (row < 0 || row >= s.tileGrid.length) return false;
    if (col < 0 || col >= s.tileGrid[0].length) return false;
    const tile = s.tileGrid[row][col];
    if (tile === 'blocked') return false;
    if (tile === 'tower' || tile === 'pigwall') return false;
    if (tile === 'path' && s.selectedTower !== 'PIG_WALL') return false;
    if (tile !== 'grass' && tile !== 'path') return false;
    const occupied = s.towers.some(t => t.gridRow === row && t.gridCol === col);
    return !occupied;
  }

  updateHoverTile(col, row, valid) {
    const s = this.scene;
    const cx = col * TILE + TILE / 2;
    const cy = row * TILE + TILE / 2;

    if (!s.hoverHighlight) {
      s.hoverHighlight = s.add.rectangle(cx, cy, TILE - 2, TILE - 2)
        .setStrokeStyle(2, 0x00FF00).setFillStyle(0x00FF00, 0.15).setDepth(99);
      s._hoverPulseAlpha = 0;
    }

    s.hoverHighlight.setPosition(cx, cy);
    s.hoverHighlight.setVisible(true);

    if (valid) {
      s.hoverHighlight.setStrokeStyle(2, 0x88FF44);
      s.hoverHighlight.setFillStyle(0x88FF44, 0.15);
    } else {
      s.hoverHighlight.setStrokeStyle(2, 0xE63946);
      s.hoverHighlight.setFillStyle(0xE63946, 0.15);
    }

    if (valid && s.selectedTower) {
      const range = GameConfig.towers[s.selectedTower].range;
      if (!s.hoverRangeCircle) {
        s.hoverRangeCircle = s.add.circle(cx, cy, range, COLORS.primary, 0.08)
          .setStrokeStyle(1, COLORS.primary, 0.25).setDepth(98);
      }
      s.hoverRangeCircle.setPosition(cx, cy);
      s.hoverRangeCircle.setRadius(range);
      s.hoverRangeCircle.setVisible(true);
    } else if (s.hoverRangeCircle) {
      s.hoverRangeCircle.setVisible(false);
    }
  }

  updateHoverHighlight(time) {
    const s = this.scene;
    if (!s.hoverHighlight || !s.hoverHighlight.visible) return;
    const pulse = 0.1 + Math.abs(Math.sin(time * 0.004)) * 0.2;
    s.hoverHighlight.setAlpha(pulse + 0.4);
  }

  clearHoverHighlight() {
    const s = this.scene;
    if (s.hoverHighlight) { s.hoverHighlight.setVisible(false); }
    if (s.hoverRangeCircle) { s.hoverRangeCircle.setVisible(false); }
  }

  flashInvalidTile(col, row) {
    const s = this.scene;
    const cx = col * TILE + TILE / 2;
    const cy = row * TILE + TILE / 2;
    const flash = s.add.rectangle(cx, cy, TILE, TILE, 0xE63946, 0.45).setDepth(99);
    s.tweens.add({
      targets: flash, alpha: 0, duration: 250, ease: 'Power2',
      onComplete: () => flash.destroy(),
    });
  }

  createGhostPreview(towerType) {
    const s = this.scene;
    if (s.ghostPreview) s.ghostPreview.destroy();
    const spriteKey = TOWER_SPRITES[towerType];
    s.ghostPreview = s.add.image(0, 0, spriteKey)
      .setDisplaySize(TILE - 8, TILE - 8)
      .setAlpha(0.6)
      .setDepth(100);
  }

  placeTower(type, row, col) {
    const s = this.scene;
    const spriteKey = TOWER_SPRITES[type];
    const x = col * TILE + TILE / 2;
    const y = row * TILE + TILE / 2;
    const baseConfig = GameConfig.towers[type];
    const tier = s.towerUpgrades[type] ?? 0;
    const config = applyTowerTierStats(type, tier);
    const isPigWall = type === 'PIG_WALL';
    const towerHp = config.hp || baseConfig.hp || GameConfig.towerDefaultHp || 200;

    const sprite = s.add.image(x, y, spriteKey)
      .setDisplaySize(TILE - 8, TILE - 8)
      .setDepth(10);

    if (tier > 0) {
      const tierTints = [0xFFFFFF, 0xC0E0FF, 0xFFD700];
      sprite.setTint(tierTints[Math.min(tier, tierTints.length - 1)]);
    }

    const tower = {
      type,
      sprite,
      gridRow: row,
      gridCol: col,
      x, y,
      range: config.range ?? baseConfig.range,
      damage: config.damage || 0,
      fireRate: config.fireRate || (config.cooldown || baseConfig.fireRate || baseConfig.cooldown || 1000),
      slowPercent: config.slowPercent || 0,
      stunMs: config.stunMs || 0,
      freezeMs: config.freezeMs || 0,
      lastFired: 0,
      tier,
      hp: towerHp,
      maxHp: towerHp,
      shielded: false,
      cost: baseConfig.cost,
      onPath: s.tileGrid[row][col] === 'path',
      eggs: config.eggs || 1,
      pierce: config.pierce || 0,
      thorns: config.thorns || 0,
      fireRateMultiplier: 1,
    };

    s.towers.push(tower);
    s.tileGrid[row][col] = isPigWall && tower.onPath ? 'pigwall' : 'tower';

    sprite.setScale(0);
    s.tweens.add({
      targets: sprite,
      scaleX: (TILE - 8) / sprite.width,
      scaleY: (TILE - 8) / sprite.height,
      duration: 200,
      ease: 'Back.easeOut',
    });

    this.spawnPlacementParticles(x, y);
    this.showRangeCircle(x, y, tower.range);
  }

  spawnPlacementParticles(x, y) {
    const s = this.scene;
    if (s.battleVfx) {
      s.battleVfx.burstPlace(x, y);
      return;
    }
    const count = Phaser.Math.Between(4, 6);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const p = s.add.image(x, y, 'particle_sparkle')
        .setDisplaySize(10, 10).setTint(COLORS.primary).setDepth(50);
      const dist = Phaser.Math.Between(30, 55);
      s.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scaleX: 2.5,
        scaleY: 2.5,
        duration: 350,
        ease: 'Power2',
        onComplete: () => p.destroy(),
      });
    }
  }

  showRangeCircle(x, y, range) {
    const s = this.scene;
    const circle = s.add.circle(x, y, range, COLORS.primary, 0.12)
      .setStrokeStyle(1, COLORS.primary, 0.3).setDepth(9);
    s.tweens.add({
      targets: circle, alpha: 0, duration: 1200, delay: 600, ease: 'Power2',
      onComplete: () => circle.destroy(),
    });
  }

  showSellUI(tower) {
    const s = this.scene;
    if (s._sellUI) {
      s._sellUI.forEach(o => o.destroy());
      s._sellUI = null;
    }

    const refund = Math.floor(tower.cost * GameConfig.sellRefundPercent);
    const objects = [];

    const bg = s.add.rectangle(tower.x, tower.y - 30, 100, 36, 0x000000, 0.85)
      .setStrokeStyle(2, COLORS.stars).setDepth(200).setInteractive({ useHandCursor: true });
    objects.push(bg);

    const text = s.add.text(tower.x, tower.y - 30, `SELL +${refund}☀`, {
      fontFamily: 'Kenney Future', fontSize: '14px', color: '#FFD700',
    }).setOrigin(0.5).setDepth(201);
    objects.push(text);

    bg.on('pointerdown', () => {
      this.sellTower(tower, refund);
      if (s._sellUI) {
        s._sellUI.forEach(o => { if (o.active) o.destroy(); });
        s._sellUI = null;
      }
    });

    s.time.delayedCall(3000, () => {
      if (s._sellUI) {
        s._sellUI.forEach(o => { if (o.active) o.destroy(); });
        s._sellUI = null;
      }
    });

    s._sellUI = objects;
  }

  sellTower(tower, refund) {
    const s = this.scene;
    s.sunshinePoints += refund;
    s.game.events.emit('points-changed', { points: s.sunshinePoints });
    this.showFloatingText(tower.x, tower.y - 20, `+${refund}☀`, '#4CAF50');
    s.enemyBehavior.destroyTower(tower);
    s.sound.play('pointsEarned', { volume: GameConfig.audio.sfxVolume });
  }

  showFloatingText(x, y, message, color) {
    const s = this.scene;
    if (s.battleVfx) {
      s.battleVfx.showFloatingText(x, y, message, color);
      return;
    }
    const txt = s.add.text(x, y, message, {
      fontFamily: 'Kenney Pixel', fontSize: '16px', color,
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(60);

    s.tweens.add({
      targets: txt, y: y - 28, alpha: 0, duration: 600, ease: 'Power2',
      onComplete: () => txt.destroy(),
    });
  }
}
