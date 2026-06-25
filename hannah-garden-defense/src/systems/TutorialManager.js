const STORAGE_KEY = 'hannahGarden_tutorialDone';
const HINT_STORAGE_KEY = 'hannahGarden_hintsShown';
const HINT_DISMISS_MS = 4000;

const TUTORIAL_STEPS = [
  {
    text: "This is Hannah's garden! We have to protect it!",
    target: 'gate',
  },
  {
    text: 'These are your animal defenders! Tap one to choose it.',
    target: 'towerTray',
  },
  {
    text: 'Now tap a green spot to put your defender there!',
    target: 'validTile',
  },
  {
    text: 'The naughty animals are coming! Tap to start the wave!',
    target: 'waveButton',
  },
  {
    text: 'Amazing! You earned Sunshine Points! Use them to buy more friends!',
    target: null,
  },
];

const HINT_POOL = [
  'Rabbits slow enemies down — place them near the start!',
  'Chickens throw eggs far, but they can\'t hit flying enemies.',
  'Dogs stun enemies for a moment — great against fast ones!',
  'Tap a defender to see its range and upgrade options.',
  'Earn bonus Sunshine Points by starting waves early!',
  'Some enemies are immune to slowing — use damage towers instead!',
  'You get more Sunshine Points for finishing with full lives.',
  'Try placing towers where the path curves — they can hit twice!',
];

export class TutorialManager {
  constructor(scene) {
    this.scene = scene;
    this.active = false;
    this.currentStep = 0;
    this.overlay = null;
    this.bubble = null;
    this.hintTimer = null;
    this.hintsShown = new Set();
  }

  shouldShowTutorial() {
    try {
      return !localStorage.getItem(STORAGE_KEY);
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
    if (this.currentStep >= TUTORIAL_STEPS.length) {
      this.complete();
      return;
    }
    this._showStep();
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

    const available = HINT_POOL.filter((_, i) => !this.hintsShown.has(i));
    if (available.length === 0) return;

    const poolIndex = HINT_POOL.indexOf(available[Math.floor(Math.random() * available.length)]);
    this.hintsShown.add(poolIndex);

    this._showHintBubble(HINT_POOL[poolIndex]);
  }

  _showStep() {
    this._clearOverlay();

    const step = TUTORIAL_STEPS[this.currentStep];

    this.overlay = this.scene.add.rectangle(
      this.scene.cameras.main.centerX,
      this.scene.cameras.main.centerY,
      this.scene.cameras.main.width,
      this.scene.cameras.main.height,
      0x000000, 0.5
    ).setDepth(1000).setScrollFactor(0);

    const targetPos = this._getTargetPosition(step.target);

    this.bubble = this.scene.add.container(targetPos.x, targetPos.y - 60).setDepth(1001).setScrollFactor(0);

    const bg = this.scene.add.rectangle(0, 0, 320, 70, 0xffffff, 0.95)
      .setStrokeStyle(3, 0xFFD700)
      .setOrigin(0.5);

    const text = this.scene.add.text(0, 0, step.text, {
      fontSize: '14px',
      color: '#4A2C0A',
      wordWrap: { width: 290 },
      align: 'center',
    }).setOrigin(0.5);

    const arrow = this.scene.add.triangle(0, 40, -10, 0, 10, 0, 0, 15, 0xFFD700)
      .setOrigin(0.5);

    this.bubble.add([bg, text, arrow]);

    this.bubble.setInteractive(
      new Phaser.Geom.Rectangle(-160, -35, 320, 70),
      Phaser.Geom.Rectangle.Contains
    );
    this.bubble.on('pointerdown', () => this.advance());
    this.overlay.setInteractive();
    this.overlay.on('pointerdown', () => this.advance());
  }

  _showHintBubble(text) {
    const x = this.scene.cameras.main.centerX;
    const y = this.scene.cameras.main.height - 80;

    const container = this.scene.add.container(x, y).setDepth(900).setScrollFactor(0);

    const bg = this.scene.add.rectangle(0, 0, 340, 50, 0xFFF9E6, 0.95)
      .setStrokeStyle(2, 0xFF9F1C)
      .setOrigin(0.5);

    const label = this.scene.add.text(0, 0, text, {
      fontSize: '13px',
      color: '#4A2C0A',
      wordWrap: { width: 310 },
      align: 'center',
    }).setOrigin(0.5);

    container.add([bg, label]);

    this.scene.time.delayedCall(HINT_DISMISS_MS, () => {
      container.destroy();
    });
  }

  _getTargetPosition(target) {
    const cam = this.scene.cameras.main;
    switch (target) {
      case 'gate':
        return { x: cam.centerX, y: cam.height - 100 };
      case 'towerTray':
        return { x: cam.centerX, y: cam.height - 40 };
      case 'validTile':
        return { x: cam.centerX - 100, y: cam.centerY };
      case 'waveButton':
        return { x: cam.width - 80, y: cam.height - 40 };
      default:
        return { x: cam.centerX, y: cam.centerY };
    }
  }

  _clearOverlay() {
    if (this.overlay) {
      this.overlay.destroy();
      this.overlay = null;
    }
    if (this.bubble) {
      this.bubble.destroy();
      this.bubble = null;
    }
  }
}
