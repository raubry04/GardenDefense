import { GameConfig } from '../config.js';
import { sfxVol } from '../utils/audioMix.js';
import { battleHudButtonHitRadius } from '../utils/battleInput.js';
import { showToast } from './Toast.js';
import { towerPlacementCost } from '../utils/battleEconomy.js';
import { TOWER_SPRITES } from "../utils/AssetRegistry.js";

const COLORS = GameConfig.colors;
const TRAY_DEPTH = 150;
const CARD_W = 84;
const CARD_H = 84;
const DRAG_MOVE_PX = 10;

export class TowerTray {
  /**
   * @param {import("../scenes/UIScene.js").UIScene} scene
   * @param {{ hud: import("./BattleHud.js").BattleHud, abilityBar: import("./AbilityBar.js").AbilityBar }} refs
   */
  constructor(scene, refs) {
    this.scene = scene;
    this.hud = refs.hud;
    this.abilityBar = refs.abilityBar;
    this.towerCards = [];
    this._trayObjects = [];
    this.selectedTowerType = null;
    this._towerDrag = null;
    this._towerTapMode = false;
    this._onBoardTap = this.onBoardTap.bind(this);
  }

  create(width, height) {
    const scene = this.scene;
    const trayY = height - 80;
    const trayHeight = 94;
    const trayCenterY = trayY + trayHeight / 2;
    this._trayObjects = [];

    const trackY = (obj, y) => {
      obj.setData("layoutY", y);
      this._trayObjects.push(obj);
      return obj;
    };

    this.trayBgOuter = trackY(
      scene.add
        .rectangle(
          width / 2,
          trayCenterY,
          width - 40,
          trayHeight,
          0x1a1a2e,
          0.75,
        )
        .setStrokeStyle(3, 0x4a4e69)
        .setDepth(TRAY_DEPTH),
      trayCenterY,
    );

    this.trayBgInner = trackY(
      scene.add.rectangle(
        width / 2,
        trayCenterY,
        width - 48,
        trayHeight - 8,
        0x000000,
        0,
      ).setStrokeStyle(1, 0x6c6f85).setDepth(TRAY_DEPTH),
      trayCenterY,
    );

    const towers = Object.entries(GameConfig.towers);
    const cardSpacing = 12;
    const totalWidth = towers.length * (CARD_W + cardSpacing) - cardSpacing;
    const startX = (width - totalWidth) / 2;

    this.towerCards = [];

    towers.forEach(([type, config], idx) => {
      const x = startX + idx * (CARD_W + cardSpacing) + CARD_W / 2;
      const y = trayY + trayHeight / 2;
      const spriteKey = TOWER_SPRITES[type];

      const unlocked = this._isTowerUnlocked(config);
      const affordable = unlocked && scene.sunshinePoints >= config.cost;

      const cardBg = trackY(
        scene.add
          .rectangle(x, y, CARD_W, CARD_H, 0x2d2d44, 0.9)
          .setStrokeStyle(2, affordable ? 0x6c6f85 : 0x444444)
          .setDepth(TRAY_DEPTH),
        y,
      );

      const sprite = trackY(
        scene.add
          .image(x, y - 16, spriteKey)
          .setDisplaySize(44, 44)
          .setDepth(TRAY_DEPTH + 1),
        y - 16,
      );

      const towerName = type.replace("_", " ");
      const displayName =
        towerName.length > 7 ? towerName.substring(0, 6) + "…" : towerName;
      const nameText = trackY(
        scene.add
          .text(x, y + 14, displayName, {
            fontFamily: "Kenney Future",
            fontSize: "10px",
            color: affordable ? "#CCCCCC" : "#666666",
          })
          .setOrigin(0.5)
          .setDepth(TRAY_DEPTH + 1),
        y + 14,
      );

      const coinIcon = trackY(
        scene.add
          .image(x - 14, y + 30, "ui_uiStar")
          .setDisplaySize(12, 12)
          .setTint(COLORS.stars)
          .setDepth(TRAY_DEPTH + 1),
        y + 30,
      );
      const costText = trackY(
        scene.add
          .text(x - 6, y + 24, `${config.cost}`, {
            fontFamily: "Kenney Future",
            fontSize: "14px",
            color: affordable ? "#FFD700" : "#666666",
          })
          .setOrigin(0, 0.5)
          .setDepth(TRAY_DEPTH + 1),
        y + 24,
      );

      const greyOverlay = trackY(
        scene.add.rectangle(
          x,
          y,
          CARD_W,
          CARD_H,
          0x000000,
          unlocked && affordable ? 0 : 0.4,
        ).setDepth(TRAY_DEPTH + 1),
        y,
      );

      const lockText = unlocked
        ? null
        : trackY(
            scene.add
              .text(x, y, '🔒', { fontSize: '18px' })
              .setOrigin(0.5)
              .setDepth(TRAY_DEPTH + 2),
            y,
          );

      const selectionGlow = trackY(
        scene.add
          .rectangle(x, y, CARD_W + 6, CARD_H + 6, 0xffd700, 0)
          .setStrokeStyle(3, 0xffd700)
          .setDepth(TRAY_DEPTH),
        y,
      );
      selectionGlow.setVisible(false);

      const hitZone = trackY(
        scene.add
          .rectangle(x, y, CARD_W, CARD_H, 0x000000, 0)
          .setDepth(TRAY_DEPTH + 3),
        y,
      );

      const card = {
        type,
        config,
        cardBg,
        hitZone,
        sprite,
        nameText,
        costText,
        coinIcon,
        greyOverlay,
        selectionGlow,
        lockText,
        unlocked,
      };

      const hoverTargets = [cardBg, nameText, costText, greyOverlay];
      const onCardDown = (pointer) => {
        const liveUnlocked = this._isTowerUnlocked(config);
        const liveCost = this._placementCost(type);
        const liveAffordable = liveUnlocked && this.scene.sunshinePoints >= liveCost;
        if (!liveUnlocked) {
          this.showLockedToast(config);
          return;
        }
        if (!liveAffordable) {
          showToast(this.scene, 'Not enough sunshine!');
          return;
        }
        this._startTowerDrag(type, card, pointer);
      };

      hitZone.on("pointerover", () => {
        if (!this._canUseTowerCard(config, type)) return;
        scene.tweens.add({
          targets: hoverTargets,
          scaleX: 1.08,
          scaleY: 1.08,
          duration: 60,
        });
        sprite.setDisplaySize(48, 48);
      });
      hitZone.on("pointerout", () => {
        scene.tweens.add({
          targets: hoverTargets,
          scaleX: 1,
          scaleY: 1,
          duration: 60,
        });
        if (this.selectedTowerType !== type) {
          sprite.setDisplaySize(44, 44);
        }
      });
      hitZone.on("pointerdown", onCardDown);

      this.towerCards.push(card);
    });

    scene.input.on("pointerdown", this._onBoardTap);
  }

  _resetTowerCard(card) {
    const scene = this.scene;
    const parts = [
      card.cardBg,
      card.nameText,
      card.costText,
      card.greyOverlay,
      card.selectionGlow,
    ];
    scene.tweens.killTweensOf([...parts, card.sprite, card.coinIcon]);
    parts.forEach((obj) => obj.setScale(1));
    card.sprite.setDisplaySize(44, 44);
    card.coinIcon.setDisplaySize(12, 12);
  }

  clearSelection() {
    this.selectedTowerType = null;
    this._towerTapMode = false;
    this._updateTowerSelection();
    this.towerCards?.forEach((card) => this._resetTowerCard(card));
  }

  _placementCost(type) {
    const game = this.scene.game.scene.getScene('GameScene');
    if (game?.towerPlacement) return game.towerPlacement.placementCostFor(type);
    const count = game?.towers?.filter((t) => t.type === type && t.hp > 0).length ?? 0;
    return towerPlacementCost(type, count);
  }

  _isTowerUnlocked(config) {
    const scene = this.scene;
    const unlock = config.unlock;
    if (!unlock) return true;
    if (unlock.type === 'level') return scene.hannahLevel >= unlock.value;
    if (unlock.type === 'zone') return scene.zone + 1 >= unlock.value;
    return true;
  }

  _updateTowerSelection() {
    const scene = this.scene;
    this.towerCards.forEach((card) => {
      const isSelected = card.type === this.selectedTowerType;
      card.selectionGlow.setVisible(isSelected);
      if (isSelected) {
        if (!card._glowTween) {
          card._glowTween = scene.tweens.add({
            targets: card.selectionGlow,
            alpha: { from: 0.5, to: 1 },
            duration: 600,
            yoyo: true,
            repeat: -1,
          });
        }
      } else if (card._glowTween) {
        card._glowTween.stop();
        card._glowTween = null;
        card.selectionGlow.setAlpha(1);
      }
    });
  }

  _canUseTowerCard(config, type) {
    const cost = this._placementCost(type);
    return this._isTowerUnlocked(config) && this.scene.sunshinePoints >= cost;
  }

  _setTowerCardInteractive(card, unlocked, affordable) {
    const zone = card.hitZone;
    if (!zone) return;
    zone.setInteractive({ useHandCursor: true });
  }

  updateAffordability() {
    const scene = this.scene;
    this.towerCards.forEach((card) => {
      const unlocked = this._isTowerUnlocked(card.config);
      card.unlocked = unlocked;
      const cost = this._placementCost(card.type);
      card.costText.setText(`${cost}`);
      const affordable = unlocked && scene.sunshinePoints >= cost;
      card.cardBg.setStrokeStyle(2, affordable ? 0x6c6f85 : 0x444444);
      card.nameText.setColor(unlocked && affordable ? "#CCCCCC" : "#666666");
      card.costText.setColor(unlocked && affordable ? "#FFD700" : "#666666");
      card.greyOverlay.setFillStyle(0x000000, unlocked && affordable ? 0 : 0.4);
      if (card.lockText) card.lockText.setVisible(!unlocked);
      this._setTowerCardInteractive(card, unlocked, affordable);
    });
  }

  refreshUnlocks() {
    this.updateAffordability();
  }

  /**
   * Briefly spotlight a newly-unlocked tower's tray card (scale pulse + glow
   * flash) as positive reinforcement on level-up. No-op for missing/locked cards.
   * @param {string} type
   */
  spotlightTower(type) {
    const card = this.towerCards?.find((c) => c.type === type);
    if (!card || !card.unlocked) return;
    const scene = this.scene;

    const pulseTargets = [card.cardBg, card.sprite, card.nameText, card.costText, card.greyOverlay];
    scene.tweens.killTweensOf(pulseTargets);
    card._spotlightPulse = scene.tweens.add({
      targets: pulseTargets,
      scaleX: '*=1.15',
      scaleY: '*=1.15',
      duration: 220,
      yoyo: true,
      repeat: 2,
      ease: 'Sine.easeInOut',
    });

    // Reuse the selection glow as a gold flash — but only when this card isn't
    // the actively-selected one (that has its own persistent glow tween).
    const glow = card.selectionGlow;
    if (glow?.active && card.type !== this.selectedTowerType) {
      glow.setVisible(true).setAlpha(0);
      card._spotlightGlow = scene.tweens.add({
        targets: glow,
        alpha: { from: 0, to: 1 },
        duration: 300,
        yoyo: true,
        repeat: 2,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          if (card.type !== this.selectedTowerType) {
            glow.setVisible(false);
            glow.setAlpha(1);
          }
          card._spotlightGlow = null;
        },
      });
    }
  }

  _startTowerDrag(type, card, pointer) {
    const scene = this.scene;
    if (this._towerDrag) this.cancelDrag(false);

    scene.sound.play("buttonClick", { volume: sfxVol('buttonClick') });
    this.towerCards.forEach((c) => this._resetTowerCard(c));
    this.selectedTowerType = type;
    this._towerTapMode = false;
    card.sprite.setDisplaySize(48, 48);
    this._updateTowerSelection();

    const start = this._designPointFromPointer(pointer);
    this._towerDrag = {
      type,
      card,
      pointerId: pointer.id,
      startX: start.x,
      startY: start.y,
      moved: false,
      lastWorld: start,
    };
    scene.game.events.emit("tower-drag-start", type);
    scene.game.events.emit("tower-drag-move", pointer);

    this._bindTowerDragInput();
  }

  _bindTowerDragInput() {
    const scene = this.scene;
    this._unbindTowerDragInput();
    scene.input.on("pointermove", this._onTowerDragMove, this);
    scene.input.on("pointerup", this._onTowerDragEnd, this);
    scene.input.on("pointerupoutside", this._onTowerDragEnd, this);
    // iOS Safari fires pointercancel (not pointerup) when a system gesture
    // interrupts the touch — abort the drag so board input can't get stuck.
    scene.input.on("pointercancel", this._onTowerDragCancel, this);
  }

  _unbindTowerDragInput() {
    const scene = this.scene;
    scene.input.off("pointermove", this._onTowerDragMove, this);
    scene.input.off("pointerup", this._onTowerDragEnd, this);
    scene.input.off("pointerupoutside", this._onTowerDragEnd, this);
    scene.input.off("pointercancel", this._onTowerDragCancel, this);
  }

  _onTowerDragCancel(pointer) {
    if (!this._towerDrag) return;
    if (pointer && pointer.id !== this._towerDrag.pointerId) return;
    this.cancelDrag(true);
  }

  _onTowerDragMove(pointer) {
    if (!this._towerDrag) return;
    if (pointer.id !== this._towerDrag.pointerId) return;

    const world = this._designPointFromPointer(pointer);
    this._towerDrag.lastWorld = world;
    const dx = world.x - this._towerDrag.startX;
    const dy = world.y - this._towerDrag.startY;
    if (dx * dx + dy * dy >= DRAG_MOVE_PX * DRAG_MOVE_PX) {
      this._towerDrag.moved = true;
    }
    this.scene.game.events.emit("tower-drag-move", pointer);
  }

  _onTowerDragEnd(pointer) {
    if (!this._towerDrag) return;
    if (pointer.id !== this._towerDrag.pointerId) return;

    this._unbindTowerDragInput();
    const drag = this._towerDrag;
    this._towerDrag = null;

    if (!drag.moved) {
      this._towerTapMode = true;
      this.scene.game.events.emit("tower-selected", drag.type);
      return;
    }

    const dropPoint = drag.lastWorld ?? this._designPointFromPointer(pointer);
    if (this.isDesignPointOverBlockingUI(dropPoint.x, dropPoint.y)) {
      this.scene.game.events.emit("tower-drag-cancel");
      this.clearSelection();
      return;
    }

    this.scene.game.events.emit("tower-drag-end", pointer);
    this.clearSelection();
  }

  onBoardTap(pointer) {
    if (this._towerDrag || !this.selectedTowerType || !this._towerTapMode) return;
    if (this.isPointerOverBlockingUI(pointer)) return;

    const gameScene = this.scene.game.scene.getScene('GameScene');
    if (gameScene?.towerPlacement && gameScene.towerInspect) {
      const { col, row } = gameScene.towerPlacement.placementTileFromPointer(pointer);
      const tower = gameScene.towerInspect.towerAt(col, row);
      if (tower) {
        if (gameScene.towerInspect.isOpen() && gameScene.towerInspect.tower === tower) {
          gameScene.towerInspect.close();
        } else {
          gameScene.towerInspect.open(tower);
        }
        this.clearSelection();
        return;
      }
    }

    this.scene.game.events.emit("tower-place-request", pointer);
    this.clearSelection();
  }

  cancelDrag(emitEvent = true) {
    this._unbindTowerDragInput();
    this._towerDrag = null;
    if (emitEvent) {
      this.scene.game.events.emit("tower-drag-cancel");
    }
    this.clearSelection();
  }

  /** Map canvas pointer to design-space coords (matches HUD/tray layout). */
  _designPointFromPointer(pointer) {
    return this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
  }

  /** UI hit-test using live widget positions (stays correct after layout relayout). */
  isDesignPointOverBlockingUI(x, y) {
    const touch = Boolean(this.scene?.sys?.game?.device?.input?.touch);
    const hudBottom = (this.hud.waveBarBg?.y ?? this.hud._hudRow2Y) + 20;
    if (y <= hudBottom) return true;

    for (const btnKey of ['pauseBtn', 'speedBtn']) {
      const btn = this.hud[btnKey];
      if (!btn?.active) continue;
      const r = battleHudButtonHitRadius(btn.radius || 22, touch);
      const dx = x - btn.x;
      const dy = y - btn.y;
      if (dx * dx + dy * dy <= r * r) return true;
    }

    const sunPanel = this.hud.sunPanel;
    if (sunPanel?.active) {
      const halfW = (this.hud._sunPanelW || sunPanel.width || 108) / 2 + 8;
      const halfH = (sunPanel.height || 34) / 2 + 8;
      if (Math.abs(x - sunPanel.x) <= halfW && Math.abs(y - sunPanel.y) <= halfH) {
        return true;
      }
    }

    if (this.trayBgOuter?.active) {
      const trayTop = this.trayBgOuter.y - this.trayBgOuter.height / 2 - 6;
      if (y >= trayTop) return true;
    }

    const sendWaveBg = this.abilityBar.sendWaveBg;
    if (sendWaveBg?.visible && sendWaveBg.active) {
      const halfH = (sendWaveBg.displayHeight || 50) / 2 + 36;
      const halfW = Math.max(sendWaveBg.displayWidth || 200, 280) / 2 + 24;
      if (
        Math.abs(x - sendWaveBg.x) <= halfW
        && Math.abs(y - sendWaveBg.y) <= halfH
      ) {
        return true;
      }
    }

    for (const btn of this.abilityBar.abilityButtons || []) {
      if (!btn.circle?.active) continue;
      const r = (btn.circle.radius || 32) + (touch ? 26 : 10);
      const dx = x - btn.circle.x;
      const dy = y - btn.circle.y;
      if (dx * dx + dy * dy <= r * r) return true;
    }

    return false;
  }

  isPointerOverBlockingUI(pointer) {
    const { x, y } = this._designPointFromPointer(pointer);
    return this.isDesignPointOverBlockingUI(x, y);
  }

  applyLayout(m, canonical) {
    const trayDelta = m.trayCenterY - canonical.trayCenterY;
    this._trayObjects?.forEach((obj) => {
      if (obj?.active) obj.setY(obj.getData("layoutY") + trayDelta);
    });

    const ui = m.ui;
    if (!ui?.cardScale || !this.towerCards?.length) return;
    const scale = ui.cardScale;
    const step = ui.cardStep ?? CARD_W + 12;
    const towers = this.towerCards;
    const width = GameConfig.canvas.width;
    const twoRows = ui.trayRows === 2;
    const row0Count = twoRows ? 4 : towers.length;
    const row1Count = twoRows ? towers.length - row0Count : 0;
    const rowGap = twoRows ? (ui.trayHeight / 2 - CARD_H * scale * 0.55) : 0;
    const baseCenterY = m.trayCenterY;

    const layoutRow = (cards, rowIdx, count) => {
      const totalWidth = count * step - (step - CARD_W * scale);
      const startX = (width - totalWidth) / 2;
      const rowY = twoRows
        ? baseCenterY - rowGap / 2 + rowIdx * rowGap
        : baseCenterY;
      cards.forEach((card, idx) => {
        const x = startX + idx * step + (CARD_W * scale) / 2;
        const parts = [card.cardBg, card.hitZone, card.sprite, card.nameText, card.costText, card.coinIcon, card.greyOverlay, card.selectionGlow, card.lockText].filter(Boolean);
        parts.forEach((p) => {
          p.setPosition(x, rowY);
          p.setScale(scale);
        });
        card.sprite.setDisplaySize(44 * scale, 44 * scale);
        card.coinIcon.setDisplaySize(12 * scale, 12 * scale);
      });
    };

    if (twoRows) {
      layoutRow(towers.slice(0, row0Count), 0, row0Count);
      layoutRow(towers.slice(row0Count), 1, row1Count);
    } else {
      layoutRow(towers, 0, towers.length);
    }

    if (ui.trayHeight && this.trayBgOuter?.active) {
      this.trayBgOuter.setSize(width - 40, ui.trayHeight);
      this.trayBgInner?.setSize(width - 48, ui.trayHeight - 8);
    }
  }

  showLockedToast(config) {
    const unlock = config.unlock;
    let msg = 'Tower locked';
    if (unlock?.type === 'level') msg = `Unlocks at Hannah Level ${unlock.value}`;
    else if (unlock?.type === 'zone') msg = `Unlocks in Garden Level ${unlock.value}`;
    showToast(this.scene, msg);
  }

  destroy() {
    this.scene.input.off("pointerdown", this._onBoardTap);
    this.towerCards?.forEach((card) => {
      card._spotlightPulse?.remove();
      card._spotlightGlow?.remove();
      card._spotlightPulse = null;
      card._spotlightGlow = null;
    });
    this.cancelDrag(false);
  }
}
