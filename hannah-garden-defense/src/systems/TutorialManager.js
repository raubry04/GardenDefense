import { GameConfig } from '../config.js';
import { computeBattleUI } from '../utils/battleLayout.js';
import { getLayoutScreenSize } from '../utils/responsiveCamera.js';
import { getFirstBattleSteps } from '../data/tutorialContent.js';

const STORAGE_KEY = 'hannahGarden_tutorialSeen';
const LEGACY_STORAGE_KEY = 'hannahGarden_tutorialDone';
const HINT_STORAGE_KEY = 'hannahGarden_hintsShown';
const HINT_DISMISS_MS = 4000;
const COLORS = GameConfig.colors;
const TUTORIAL_DEPTH = 3000;

/** Exported for H1 clarity tests — must stay aligned with TowerCombat flyer rules. */
export const HINT_POOL = [
  'Rabbits slow enemies down — place them near the start!',
  'Chickens throw eggs far, but they cannot hit flying Parrots.',
  'Dogs stun enemies — great against fast runners and Gorillas (who ignore slows)!',
  'Tap a placed defender to see its range and sell it.',
  'Check the wave preview above Send Wave to plan your next defenders.',
  'Earn bonus Sunshine Points by starting waves early!',
  'Gorillas ignore slowing — use Dog stuns or raw damage!',
  'Parrots fly over walls — bring Owls to shoot them!',
  'Tap Hannah\'s ability buttons on the right when things get tough!',
];

export class TutorialManager {
  /**
   * @param {Phaser.Scene} scene - UIScene (fixed UI camera)
   * @param {{ zone?: number, battle?: number, steps?: object[] }} [options]
   */
  constructor(scene, options = {}) {
    this.scene = scene;
    this.zone = options.zone ?? 0;
    this.battle = options.battle ?? 0;
    this.steps = options.steps ?? getFirstBattleSteps();
    this.active = false;
    this.currentStep = 0;
    this._objects = [];
    this._actionListenersBound = false;
  }

  _bindActionListeners() {
    if (this._actionListenersBound) return;
    this._actionListenersBound = true;
    const g = this.scene.game.events;
    // Tap select OR drag-start both count as "pick a defender".
    this._onSelectTower = () => this.notifyAction('select-tower');
    this._onDragStart = () => this.notifyAction('select-tower');
    this._onPlaceTower = () => this.notifyAction('place-tower');
    this._onSendWave = () => this.notifyAction('send-wave');
    g.on('tower-selected', this._onSelectTower);
    g.on('tower-drag-start', this._onDragStart);
    g.on('tower-placed', this._onPlaceTower);
    g.on('wave-started', this._onSendWave);
    g.on('send-wave-early', this._onSendWave);
  }

  _unbindActionListeners() {
    if (!this._actionListenersBound) return;
    this._actionListenersBound = false;
    const g = this.scene.game.events;
    if (this._onSelectTower) g.off('tower-selected', this._onSelectTower);
    if (this._onDragStart) g.off('tower-drag-start', this._onDragStart);
    if (this._onPlaceTower) g.off('tower-placed', this._onPlaceTower);
    if (this._onSendWave) {
      g.off('wave-started', this._onSendWave);
      g.off('send-wave-early', this._onSendWave);
    }
    this._onSelectTower = null;
    this._onDragStart = null;
    this._onPlaceTower = null;
    this._onSendWave = null;
  }

  /** Advance gated steps when the player does the required action. */
  notifyAction(action) {
    if (!this.active) return;
    const step = this.steps[this.currentStep];
    if (!step?.requireAction) return;

    // One-motion drag-place: placement implies they already picked a defender.
    if (
      action === 'place-tower'
      && step.requireAction === 'select-tower'
    ) {
      this.advance();
      // If the next step is place-tower, consume this placement too.
      const next = this.steps[this.currentStep];
      if (next?.requireAction === 'place-tower') {
        this.advance();
      }
      return;
    }

    if (step.requireAction !== action) return;
    this.advance();
  }

  shouldShowTutorial() {
    if (this.zone !== 0 || this.battle !== 0) return false;
    try {
      if (localStorage.getItem(STORAGE_KEY)) return false;
      if (localStorage.getItem(LEGACY_STORAGE_KEY)) return false;
      return true;
    } catch {
      return true;
    }
  }

  start() {
    if (!this.shouldShowTutorial()) return;
    this.active = true;
    this.currentStep = 0;
    this._bindActionListeners();
    this._emitTutorialState(true);
    this._showStep();
  }

  advance() {
    if (!this.active) return;
    this.currentStep++;
    if (this.currentStep >= this.steps.length) {
      this.complete();
      return;
    }
    this._showStep();
  }

  skip() {
    this.complete();
  }

  complete() {
    this.active = false;
    this._unbindActionListeners();
    this._emitTutorialState(false);
    this._clearOverlay();
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch { /* storage unavailable */ }
  }

  _emitTutorialState(active) {
    this.scene.game.events.emit('tutorial-state-changed', { active });
  }

  isActive() {
    return this.active;
  }

  showHintIfEligible(zone, battle) {
    if (zone !== 0 || battle > 2) return;
    if (this.active) return;

    const hintsShown = this._loadHintsShown();
    const available = HINT_POOL.filter((_, i) => !hintsShown.has(i));
    if (available.length === 0) return;

    const poolIndex = HINT_POOL.indexOf(available[Math.floor(Math.random() * available.length)]);
    hintsShown.add(poolIndex);
    try {
      localStorage.setItem(HINT_STORAGE_KEY, JSON.stringify([...hintsShown]));
    } catch { /* ignore */ }

    this._showHintBubble(HINT_POOL[poolIndex]);
  }

  _loadHintsShown() {
    const hintsShown = new Set();
    try {
      const stored = JSON.parse(localStorage.getItem(HINT_STORAGE_KEY) || '[]');
      if (Array.isArray(stored)) stored.forEach((i) => hintsShown.add(i));
    } catch { /* ignore */ }
    return hintsShown;
  }

  _layout() {
    const { width: sw, height: sh } = getLayoutScreenSize(this.scene);
    const ui = computeBattleUI(sw, sh);
    const centerX = GameConfig.canvas.width / 2;
    const centerY = GameConfig.canvas.height / 2;
    return { sw, sh, ui, centerX, centerY };
  }

  _showStep() {
    this._clearOverlay();

    const step = this.steps[this.currentStep];
    const { ui, centerX, centerY } = this._layout();
    const panelW = Math.min(420, GameConfig.canvas.width - 28);
    const panelH = Math.min(210, GameConfig.canvas.height * 0.3);
    const targetPos = this._getTargetPosition(step.target, ui);
    const panelX = centerX;
    const panelY = step.target
      ? Math.max(ui.pad.top + panelH / 2 + 8, targetPos.y - panelH / 2 - 50)
      : centerY;

    const objects = [];
    this._objects = objects;

    const overlay = this.scene.add.rectangle(
      centerX, centerY, GameConfig.canvas.width * 2, GameConfig.canvas.height * 2, 0x000000, 0.62,
    ).setDepth(TUTORIAL_DEPTH);
    const allowPlayInput = step.target === 'towerTray'
      || step.target === 'validTile'
      || step.target === 'waveButton'
      || step.target === 'abilities';
    if (!allowPlayInput) {
      overlay.setInteractive();
    }
    objects.push(overlay);

    const bg = this.scene.add.rectangle(panelX, panelY, panelW, panelH, COLORS.uiPanel, 1)
      .setStrokeStyle(3, COLORS.primary)
      .setDepth(TUTORIAL_DEPTH + 1);
    objects.push(bg);

    const title = this.scene.add.text(panelX, panelY - panelH / 2 + 28, step.title || 'Tip', {
      fontFamily: 'Kenney Pixel',
      fontSize: '22px',
      color: '#3D5A1F',
      align: 'center',
    }).setOrigin(0.5).setDepth(TUTORIAL_DEPTH + 2);
    objects.push(title);

    const body = this.scene.add.text(panelX, panelY + 4, step.text, {
      fontFamily: 'Kenney Future',
      fontSize: '18px',
      color: '#4A2C0A',
      wordWrap: { width: panelW - 40 },
      align: 'center',
      lineSpacing: 4,
    }).setOrigin(0.5).setDepth(TUTORIAL_DEPTH + 2);
    objects.push(body);

    const progress = this.scene.add.text(
      panelX, panelY + panelH / 2 - 42,
      `${this.currentStep + 1} / ${this.steps.length}`,
      {
        fontFamily: 'Kenney Future',
        fontSize: '14px',
        color: '#666666',
      },
    ).setOrigin(0.5).setDepth(TUTORIAL_DEPTH + 2);
    objects.push(progress);

    const btnY = panelY + panelH / 2 - 24;
    const gated = !!step.requireAction;
    const nextLabel = this.currentStep >= this.steps.length - 1
      ? 'Got it!'
      : (gated ? 'Try it!' : 'Next');
    const nextBtn = this.scene.add.rectangle(panelX + panelW / 2 - 70, btnY, 120, 44, gated ? 0xA8DADC : COLORS.button)
      .setStrokeStyle(2, COLORS.outline)
      .setInteractive({ useHandCursor: !gated })
      .setDepth(TUTORIAL_DEPTH + 3);
    const nextText = this.scene.add.text(panelX + panelW / 2 - 70, btnY, nextLabel, {
      fontFamily: 'Kenney Future',
      fontSize: '18px',
      color: '#4A2C0A',
    }).setOrigin(0.5).setDepth(TUTORIAL_DEPTH + 3);
    objects.push(nextBtn, nextText);

    // Dark text on cream pill + orange stroke — readable vs grey-on-white.
    const skipX = panelX - panelW / 2 + 52;
    const skipBg = this.scene.add.rectangle(skipX, btnY, 88, 40, 0xFFF9E6)
      .setStrokeStyle(2, COLORS.button)
      .setInteractive({ useHandCursor: true })
      .setDepth(TUTORIAL_DEPTH + 3);
    const skipBtn = this.scene.add.text(skipX, btnY, 'Skip', {
      fontFamily: 'Kenney Future',
      fontSize: '18px',
      color: '#4A2C0A',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(TUTORIAL_DEPTH + 3);
    objects.push(skipBg, skipBtn);

    if (step.target) {
      const arrow = this.scene.add.triangle(
        targetPos.x, targetPos.y - 28,
        -8, 0, 8, 0, 0, 12,
        COLORS.primary,
      ).setOrigin(0.5).setDepth(TUTORIAL_DEPTH + 1);
      objects.push(arrow);
    }

    const dismiss = () => this.skip();
    const advance = () => this.advance();
    if (!gated) {
      nextBtn.on('pointerdown', advance);
      nextText.setInteractive({ useHandCursor: true }).on('pointerdown', advance);
    }
    skipBg.on('pointerdown', dismiss);
    skipBtn.on('pointerdown', dismiss);
  }

  _showHintBubble(text) {
    const { centerX } = this._layout();
    const bubbleY = GameConfig.canvas.height - 100;

    const container = this.scene.add.container(centerX, bubbleY).setDepth(2900);

    const bg = this.scene.add.rectangle(0, 0, Math.min(400, GameConfig.canvas.width - 20), 68, COLORS.uiPanel, 1)
      .setStrokeStyle(2, COLORS.button)
      .setOrigin(0.5);

    const label = this.scene.add.text(0, 0, text, {
      fontFamily: 'Kenney Future',
      fontSize: '16px',
      color: '#4A2C0A',
      wordWrap: { width: 360 },
      align: 'center',
    }).setOrigin(0.5);

    container.add([bg, label]);

    this.scene.time.delayedCall(HINT_DISMISS_MS, () => {
      if (container.active) container.destroy();
    });
  }

  _getTargetPosition(target, ui) {
    const sw = GameConfig.canvas.width;
    const sh = GameConfig.canvas.height;
    switch (target) {
      case 'gate':
        return { x: sw / 2, y: ui.pad.top + (sh - ui.pad.top - ui.pad.bottom) * 0.35 };
      case 'towerTray':
        return { x: sw / 2, y: sh - ui.pad.bottom + 20 };
      case 'validTile':
        return { x: sw / 2 - 80, y: ui.pad.top + (sh - ui.pad.top - ui.pad.bottom) * 0.45 };
      case 'waveButton':
        return { x: sw / 2, y: sh - ui.pad.bottom - 60 };
      case 'abilities':
        return {
          x: sw - ui.pad.right - (ui.abilityStep || 56),
          y: sh / 2,
        };
      default:
        return { x: sw / 2, y: sh / 2 };
    }
  }

  _clearOverlay() {
    this._objects.forEach((obj) => {
      if (obj?.active) obj.destroy();
    });
    this._objects = [];
  }

  replay() {
    this._clearOverlay();
    this.active = true;
    this.currentStep = 0;
    this._bindActionListeners();
    // Pause-menu HOW TO PLAY must unpause so place/drag still works.
    this.scene.game.events.emit('tutorial-replay-request');
    this._emitTutorialState(true);
    this._showStep();
  }

  destroy() {
    this._unbindActionListeners();
    this._clearOverlay();
    this.active = false;
  }
}
