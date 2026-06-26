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

const HINT_POOL = [
  'Rabbits slow enemies down — place them near the start!',
  'Chickens throw eggs far, but they cannot hit flying Parrots.',
  'Dogs stun enemies for a moment — great against fast Gorillas!',
  'Tap a defender to see its range and upgrade options.',
  'Earn bonus Sunshine Points by starting waves early!',
  'Gorillas are immune to slowing — use damage or stuns!',
  'Parrots fly over walls — bring Owls or Chickens on other targets.',
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
    this._clearOverlay();
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch { /* storage unavailable */ }
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
    const panelW = Math.min(380, GameConfig.canvas.width - 32);
    const panelH = Math.min(160, GameConfig.canvas.height * 0.22);
    const targetPos = this._getTargetPosition(step.target, ui);
    const panelX = centerX;
    const panelY = step.target
      ? Math.max(ui.pad.top + panelH / 2 + 8, targetPos.y - panelH / 2 - 50)
      : centerY;

    const objects = [];
    this._objects = objects;

    const overlay = this.scene.add.rectangle(
      centerX, centerY, GameConfig.canvas.width * 2, GameConfig.canvas.height * 2, 0x000000, 0.55,
    ).setDepth(TUTORIAL_DEPTH);
    const allowTrayInput = step.target === 'towerTray' || step.target === 'validTile';
    if (!allowTrayInput) {
      overlay.setInteractive();
    }
    objects.push(overlay);

    const bg = this.scene.add.rectangle(panelX, panelY, panelW, panelH, COLORS.uiPanel, 0.98)
      .setStrokeStyle(3, COLORS.primary)
      .setDepth(TUTORIAL_DEPTH + 1);
    objects.push(bg);

    const title = this.scene.add.text(panelX, panelY - panelH / 2 + 22, step.title || 'Tip', {
      fontFamily: 'Kenney Pixel',
      fontSize: '16px',
      color: '#3D5A1F',
      align: 'center',
    }).setOrigin(0.5).setDepth(TUTORIAL_DEPTH + 2);
    objects.push(title);

    const body = this.scene.add.text(panelX, panelY + 8, step.text, {
      fontFamily: 'Kenney Future',
      fontSize: '14px',
      color: '#4A2C0A',
      wordWrap: { width: panelW - 36 },
      align: 'center',
      lineSpacing: 3,
    }).setOrigin(0.5).setDepth(TUTORIAL_DEPTH + 2);
    objects.push(body);

    const progress = this.scene.add.text(
      panelX, panelY + panelH / 2 - 38,
      `${this.currentStep + 1} / ${this.steps.length}`,
      {
        fontFamily: 'Kenney Future',
        fontSize: '11px',
        color: '#888888',
      },
    ).setOrigin(0.5).setDepth(TUTORIAL_DEPTH + 2);
    objects.push(progress);

    const btnY = panelY + panelH / 2 - 18;
    const nextLabel = this.currentStep >= this.steps.length - 1 ? 'Got it!' : 'Next';
    const nextBtn = this.scene.add.rectangle(panelX + panelW / 2 - 58, btnY, 96, 30, COLORS.button)
      .setStrokeStyle(2, COLORS.outline)
      .setInteractive({ useHandCursor: true })
      .setDepth(TUTORIAL_DEPTH + 3);
    const nextText = this.scene.add.text(panelX + panelW / 2 - 58, btnY, nextLabel, {
      fontFamily: 'Kenney Future',
      fontSize: '14px',
      color: '#4A2C0A',
    }).setOrigin(0.5).setDepth(TUTORIAL_DEPTH + 3);
    objects.push(nextBtn, nextText);

    const skipBtn = this.scene.add.text(panelX - panelW / 2 + 16, btnY, 'Skip', {
      fontFamily: 'Kenney Future',
      fontSize: '12px',
      color: '#888888',
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true }).setDepth(TUTORIAL_DEPTH + 3);
    objects.push(skipBtn);

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
    nextBtn.on('pointerdown', advance);
    nextText.setInteractive({ useHandCursor: true }).on('pointerdown', advance);
    skipBtn.on('pointerdown', dismiss);
  }

  _showHintBubble(text) {
    const { centerX } = this._layout();
    const bubbleY = GameConfig.canvas.height - 100;

    const container = this.scene.add.container(centerX, bubbleY).setDepth(2900);

    const bg = this.scene.add.rectangle(0, 0, Math.min(360, GameConfig.canvas.width - 24), 52, COLORS.uiPanel, 0.95)
      .setStrokeStyle(2, COLORS.button)
      .setOrigin(0.5);

    const label = this.scene.add.text(0, 0, text, {
      fontFamily: 'Kenney Future',
      fontSize: '13px',
      color: '#4A2C0A',
      wordWrap: { width: 320 },
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
}
