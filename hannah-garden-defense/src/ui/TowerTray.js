import { GameConfig } from '../config.js';
import { sfxVol } from '../utils/audioMix.js';
import { battleHudButtonHitRadius } from '../utils/battleInput.js';
import { showToast } from './Toast.js';
import { towerPlacementCost } from '../utils/battleEconomy.js';
import { TOWER_SPRITES } from "../utils/AssetRegistry.js";
import { loadLocalProgress, loadPlayerName } from '../utils/hannahProgress.js';
import { normalizeCollection } from '../utils/collection.js';

const COLORS = GameConfig.colors;
const TRAY_DEPTH = 150;
const CARD_W = 84;
const CARD_H = 84;
const SPRITE_BASE = 46;
const COIN_BASE = 14;
const DRAG_MOVE_PX = 10;

// Card-relative layout offsets (design units, from card centre). Applied in both
// create() and applyLayout() so parts keep their arrangement at any card scale.
const OFF = {
  sprite: { x: 0, y: -13 },
  name: { x: 0, y: 12 },
  costBadge: { x: 0, y: 28 },
  coin: { x: -12, y: 28 },
  cost: { x: 0, y: 28 },
};

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

    // Track a card part with its card-relative offset so applyLayout can place it
    // at (cardX + offX*scale, cardY + offY*scale) — keeping the per-card
    // arrangement (icon on top, cost chip at the bottom) instead of stacking all
    // parts at the card centre.
    this._cardScale = this._cardScale ?? 1;
    const trackPart = (obj, cardY, off) => {
      obj.setData("offX", off.x);
      obj.setData("offY", off.y);
      return trackY(obj, cardY + off.y);
    };

    this.trayBgOuter = trackY(
      scene.add
        .rectangle(
          width / 2,
          trayCenterY,
          width - 40,
          trayHeight,
          0x1a2e14,
          0.92,
        )
        .setStrokeStyle(3, 0xc9a227)
        .setDepth(TRAY_DEPTH),
      trayCenterY,
    );

    this.trayBgInner = trackY(
      scene.add.rectangle(
        width / 2,
        trayCenterY,
        width - 48,
        trayHeight - 8,
        0x243a1c,
        0.55,
      ).setStrokeStyle(1, 0xe8d5a3).setDepth(TRAY_DEPTH),
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

      const sprite = trackPart(
        scene.add
          .image(x, y + OFF.sprite.y, spriteKey)
          .setDisplaySize(SPRITE_BASE, SPRITE_BASE)
          .setDepth(TRAY_DEPTH + 1),
        y,
        OFF.sprite,
      );

      // Collection tray sticker — tiny star when the matching animal album entry is earned.
      let stickerBadge = null;
      const collection = normalizeCollection(
        loadLocalProgress(scene.playerName || loadPlayerName() || '').collection,
      );
      if (collection.towerStickers?.[type]) {
        stickerBadge = trackPart(
          scene.add
            .text(x + CARD_W / 2 - 12, y - CARD_H / 2 + 10, '★', {
              fontFamily: 'Kenney Future',
              fontSize: '12px',
              color: '#FFE135',
            })
            .setOrigin(0.5)
            .setDepth(TRAY_DEPTH + 4),
          y,
          { x: CARD_W / 2 - 12, y: -CARD_H / 2 + 10 },
        );
      }

      const towerName = type.replace("_", " ");
      const displayName =
        towerName.length > 7 ? towerName.substring(0, 6) + "…" : towerName;
      const nameText = trackPart(
        scene.add
          .text(x, y + OFF.name.y, displayName, {
            fontFamily: "Kenney Future",
            fontSize: "14px",
            // Locked: light grey (readable) — dark-on-dark was near-invisible.
            color: unlocked ? (affordable ? "#FFFFFF" : "#C8C8C8") : "#D0D0D0",
          })
          .setOrigin(0.5)
          .setShadow(0, 1, "#000000", 3)
          .setDepth(TRAY_DEPTH + 1),
        y,
        OFF.name,
      );

      // Dark chip at the bottom of the card so the gold cost reads clearly
      // over the animal sprite (near-opaque — sparse Kenney glyphs need it).
      const costBadge = trackPart(
        scene.add
          .rectangle(x, y + OFF.costBadge.y, 56, 22, 0x1a1a1a, 0.92)
          .setStrokeStyle(1.5, 0xffd700, 0.75)
          .setDepth(TRAY_DEPTH + 1),
        y,
        OFF.costBadge,
      );

      const coinIcon = trackPart(
        scene.add
          .image(x + OFF.coin.x, y + OFF.coin.y, "ui_sunshine")
          .setDisplaySize(COIN_BASE, COIN_BASE)
          .setDepth(TRAY_DEPTH + 2),
        y,
        OFF.coin,
      );
      const costText = trackPart(
        scene.add
          .text(x + OFF.cost.x, y + OFF.cost.y, `${config.cost}`, {
            fontFamily: "Kenney Future",
            fontSize: "18px",
            color: unlocked ? (affordable ? "#FFD700" : "#C8C8C8") : "#D0D0D0",
          })
          .setOrigin(0, 0.5)
          .setShadow(0, 2, "#000000", 3)
          .setDepth(TRAY_DEPTH + 2),
        y,
        OFF.cost,
      );

      const greyOverlay = trackY(
        scene.add.rectangle(
          x,
          y,
          CARD_W,
          CARD_H,
          0x000000,
          unlocked && affordable ? 0 : 0.4,
        ).setDepth(TRAY_DEPTH + 2),
        y,
      );

      const lockText = unlocked
        ? null
        : trackY(
            scene.add
              .text(x, y, 'LOCK', {
                fontFamily: 'Kenney Future',
                fontSize: '14px',
                color: '#FFD700',
                stroke: '#000000',
                strokeThickness: 3,
              })
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
        costBadge,
        coinIcon,
        greyOverlay,
        selectionGlow,
        lockText,
        stickerBadge,
        unlocked,
      };

      // Images sized with setDisplaySize (sprite, coinIcon) must NOT be scale-
      // tweened — absolute scale 1.08 would blow up a 14px star to native texture
      // size. Only tween objects whose base scale is the card scale.
      const hoverTargets = [cardBg, nameText, costText, costBadge, greyOverlay];
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

      // Hover/press pop must be RELATIVE to the current card scale (cards are
      // scaled up in portrait/landscape via applyLayout); absolute 1.08→1 would
      // collapse the card to native size after a tap on phones.
      hitZone.on("pointerover", () => {
        if (!this._canUseTowerCard(config, type)) return;
        const s = this._cardScale ?? 1;
        scene.tweens.add({
          targets: hoverTargets,
          scaleX: s * 1.08,
          scaleY: s * 1.08,
          duration: 60,
        });
        sprite.setDisplaySize(SPRITE_BASE * s * 1.09, SPRITE_BASE * s * 1.09);
        coinIcon.setDisplaySize(COIN_BASE * s * 1.09, COIN_BASE * s * 1.09);
      });
      hitZone.on("pointerout", () => {
        const s = this._cardScale ?? 1;
        scene.tweens.add({
          targets: hoverTargets,
          scaleX: s,
          scaleY: s,
          duration: 60,
        });
        if (this.selectedTowerType !== type) {
          sprite.setDisplaySize(SPRITE_BASE * s, SPRITE_BASE * s);
          coinIcon.setDisplaySize(COIN_BASE * s, COIN_BASE * s);
        }
      });
      hitZone.on("pointerdown", onCardDown);

      this.towerCards.push(card);
    });

    scene.input.on("pointerdown", this._onBoardTap);
  }

  _resetTowerCard(card) {
    const scene = this.scene;
    const s = this._cardScale ?? 1;
    const parts = [
      card.cardBg,
      card.nameText,
      card.costText,
      card.costBadge,
      card.greyOverlay,
      card.selectionGlow,
    ].filter(Boolean);
    scene.tweens.killTweensOf([...parts, card.sprite, card.coinIcon]);
    // Reset to the current card scale (not 1) so cards keep their portrait/
    // landscape sizing after a selection is cleared.
    parts.forEach((obj) => obj.setScale(s));
    card.sprite.setScale(1);
    card.coinIcon.setScale(1);
    card.sprite.setDisplaySize(SPRITE_BASE * s, SPRITE_BASE * s);
    card.coinIcon.setDisplaySize(COIN_BASE * s, COIN_BASE * s);
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
      card.nameText.setColor(unlocked ? (affordable ? "#FFFFFF" : "#C8C8C8") : "#D0D0D0");
      card.costText.setColor(unlocked ? (affordable ? "#FFD700" : "#C8C8C8") : "#D0D0D0");
      card.costBadge?.setStrokeStyle(1.5, 0xffd700, unlocked && affordable ? 0.65 : 0.35);
      // Lighter dim for locked so name/cost stay readable under the lock badge.
      card.greyOverlay.setFillStyle(0x000000, unlocked && affordable ? 0 : unlocked ? 0.35 : 0.22);
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

    // Exclude sprite/coinIcon — they use setDisplaySize; relative scale tweens
    // compound into a giant star over the cost chip.
    const pulseTargets = [card.cardBg, card.nameText, card.costText, card.costBadge, card.greyOverlay].filter(Boolean);
    scene.tweens.killTweensOf([...pulseTargets, card.sprite, card.coinIcon].filter(Boolean));
    const s = this._cardScale ?? 1;
    card._spotlightPulse = scene.tweens.add({
      targets: pulseTargets,
      scaleX: '*=1.15',
      scaleY: '*=1.15',
      duration: 220,
      yoyo: true,
      repeat: 2,
      ease: 'Sine.easeInOut',
    });
    scene.tweens.add({
      targets: { t: 0 },
      t: 1,
      duration: 220,
      yoyo: true,
      repeat: 2,
      ease: 'Sine.easeInOut',
      onUpdate: (tw) => {
        const k = 1 + 0.15 * tw.getValue();
        card.sprite?.setDisplaySize(SPRITE_BASE * s * k, SPRITE_BASE * s * k);
        card.coinIcon?.setDisplaySize(COIN_BASE * s * k, COIN_BASE * s * k);
      },
      onComplete: () => {
        card.sprite?.setDisplaySize(SPRITE_BASE * s, SPRITE_BASE * s);
        card.coinIcon?.setDisplaySize(COIN_BASE * s, COIN_BASE * s);
      },
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
    const s = this._cardScale ?? 1;
    card.sprite.setDisplaySize(SPRITE_BASE * s * 1.09, SPRITE_BASE * s * 1.09);
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
    this._cardScale = scale;
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
        const cx = startX + idx * step + (CARD_W * scale) / 2;
        const parts = [card.cardBg, card.hitZone, card.sprite, card.nameText, card.costText, card.costBadge, card.coinIcon, card.greyOverlay, card.selectionGlow, card.lockText].filter(Boolean);
        parts.forEach((p) => {
          const offX = p.getData("offX") ?? 0;
          const offY = p.getData("offY") ?? 0;
          p.setPosition(cx + offX * scale, rowY + offY * scale);
          // Don't setScale on display-sized images — it fights setDisplaySize
          // and can leave the cost star massively oversized after hover tweens.
          if (p !== card.sprite && p !== card.coinIcon) {
            p.setScale(scale);
          }
        });
        card.sprite.setScale(1);
        card.coinIcon.setScale(1);
        card.sprite.setDisplaySize(SPRITE_BASE * scale, SPRITE_BASE * scale);
        card.coinIcon.setDisplaySize(COIN_BASE * scale, COIN_BASE * scale);
      });
    };

    if (twoRows) {
      layoutRow(towers.slice(0, row0Count), 0, row0Count);
      layoutRow(towers.slice(row0Count), 1, row1Count);
    } else {
      layoutRow(towers, 0, towers.length);
    }

    if (ui.trayHeight && this.trayBgOuter?.active) {
      // Wrap the background around the actual cards instead of spanning the full
      // board width — otherwise the tray shows a large empty panel beside the
      // (centered) cards, especially in landscape. Cards are centered at width/2
      // by layoutRow, so the centered bg stays aligned.
      const rowCount = twoRows ? row0Count : towers.length;
      const contentW = (rowCount - 1) * step + CARD_W * scale;
      const bgW = Math.min(width - 40, contentW + 24);
      this.trayBgOuter.setSize(bgW, ui.trayHeight);
      this.trayBgInner?.setSize(bgW - 8, ui.trayHeight - 8);
    }
  }

  showLockedToast(config) {
    const unlock = config.unlock;
    let msg = 'Tower locked';
    if (unlock?.type === 'level') msg = `Unlocks at Hannah Level ${unlock.value}`;
    else if (unlock?.type === 'zone') msg = `Unlocks in Zone ${unlock.value}`;
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
