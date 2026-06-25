import Phaser from 'phaser';

const COLORS = {
  PRIMARY: 0xFFD700,
  BUTTON: 0xFF9F1C,
  BUTTON_TEXT: 0x4A2C0A,
  PANEL: 0xFFF9E6,
  OUTLINE: 0x3D5A1F,
  ACCENT: 0xA8DADC,
  LOCKED: 0x666666,
  UNAFFORDABLE: 0x999999,
};

/**
 * A clickable tower card for the tower selection tray.
 * Displays an animal sprite thumbnail, tower name, cost, and lock state.
 * Emits 'tower-selected' on the scene when tapped.
 * @extends Phaser.GameObjects.Container
 */
export class TowerCard extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene - The scene this card belongs to
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {string} towerType - Identifier for the tower type
   * @param {string} spriteKey - Texture key for the animal thumbnail
   * @param {number} cost - Cost in Sunshine Points
   * @param {boolean} unlocked - Whether this tower is available to the player
   * @param {boolean} affordable - Whether the player can currently afford this tower
   */
  constructor(scene, x, y, towerType, spriteKey, cost, unlocked, affordable) {
    super(scene, x, y);

    this.towerType = towerType;
    this.cost = cost;
    this._unlocked = unlocked;
    this._affordable = affordable;
    this._selected = false;

    const cardWidth = 88;
    const cardHeight = 100;

    this.bg = scene.add.rectangle(0, 0, cardWidth, cardHeight, COLORS.PANEL)
      .setStrokeStyle(3, COLORS.OUTLINE);
    this.add(this.bg);

    this.sprite = scene.add.image(0, -12, spriteKey)
      .setDisplaySize(48, 48);
    this.add(this.sprite);

    this.nameText = scene.add.text(0, 24, towerType, {
      fontFamily: 'Kenney Future',
      fontSize: '22px',
      color: '#4A2C0A',
      align: 'center',
    }).setOrigin(0.5);
    this.add(this.nameText);

    this.costText = scene.add.text(0, 42, `☀ ${cost}`, {
      fontFamily: 'Kenney Future',
      fontSize: '22px',
      color: '#FF9F1C',
      align: 'center',
    }).setOrigin(0.5);
    this.add(this.costText);

    this.lockOverlay = scene.add.rectangle(0, 0, cardWidth, cardHeight, 0x000000, 0.6)
      .setVisible(!unlocked);
    this.add(this.lockOverlay);

    this.lockIcon = scene.add.text(0, 0, '🔒', {
      fontSize: '32px',
    }).setOrigin(0.5).setVisible(!unlocked);
    this.add(this.lockIcon);

    this.selectionBorder = scene.add.rectangle(0, 0, cardWidth + 6, cardHeight + 6)
      .setStrokeStyle(4, COLORS.PRIMARY)
      .setFillStyle(0x000000, 0)
      .setVisible(false);
    this.add(this.selectionBorder);

    this.setSize(Math.max(cardWidth, 80), Math.max(cardHeight, 80));
    this.setInteractive({ useHandCursor: true });

    this.on('pointerover', this._onHover, this);
    this.on('pointerout', this._onOut, this);
    this.on('pointerdown', this._onPress, this);
    this.on('pointerup', this._onRelease, this);

    this.setAffordable(affordable);

    scene.add.existing(this);
  }

  /** @private */
  _onHover() {
    if (!this._unlocked || !this._affordable) return;
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 100,
      ease: 'Back.easeOut',
    });
    this.sprite.setDisplaySize(52, 52);
  }

  /** @private */
  _onOut() {
    this.scene.tweens.add({
      targets: this,
      scaleX: 1,
      scaleY: 1,
      duration: 100,
      ease: 'Back.easeOut',
    });
    if (!this._selected) {
      this.sprite.setDisplaySize(48, 48);
    }
  }

  /** @private */
  _onPress() {
    if (!this._unlocked || !this._affordable) return;
    this.scene.tweens.add({
      targets: this,
      scaleX: 0.94,
      scaleY: 0.94,
      duration: 60,
    });
  }

  /** @private */
  _onRelease() {
    if (!this._unlocked || !this._affordable) return;
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 80,
      ease: 'Back.easeOut',
    });
    this.sprite.setDisplaySize(52, 52);
    this.scene.events.emit('tower-selected', this.towerType);
  }

  /**
   * Toggle the affordability state of this card.
   * Greyed-out cards cannot be interacted with.
   * @param {boolean} canAfford - Whether the player can afford this tower
   */
  setAffordable(canAfford) {
    this._affordable = canAfford;
    const alpha = canAfford ? 1 : 0.5;
    this.sprite.setAlpha(alpha);
    this.nameText.setAlpha(alpha);
    this.costText.setAlpha(alpha);
    if (!canAfford && this._unlocked) {
      this.bg.setFillStyle(COLORS.UNAFFORDABLE, 0.3);
    } else if (this._unlocked) {
      this.bg.setFillStyle(COLORS.PANEL);
    }
  }

  /**
   * Toggle the selection highlight border.
   * @param {boolean} selected - Whether this card is currently selected
   */
  setSelected(selected) {
    this._selected = selected;
    this.selectionBorder.setVisible(selected);
    if (!selected) {
      this.sprite.setDisplaySize(48, 48);
    }
  }

  destroy() {
    this.off('pointerover', this._onHover, this);
    this.off('pointerout', this._onOut, this);
    this.off('pointerdown', this._onPress, this);
    this.off('pointerup', this._onRelease, this);
    super.destroy();
  }
}
