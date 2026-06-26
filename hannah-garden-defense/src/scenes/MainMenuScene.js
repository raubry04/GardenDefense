import { GameConfig } from '../config.js';
import { setupResponsiveCamera, DESIGN } from '../utils/responsiveCamera.js';
import { getFullGuideSteps } from '../data/tutorialContent.js';
import { applyAudioSettings } from '../utils/audioSettings.js';
import { createSettingsPanel } from '../ui/SettingsPanel.js';
import { SceneMusicManager } from '../utils/SceneMusicManager.js';

const COLORS = GameConfig.colors;

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
    this.musicStarted = false;
  }

  create() {
    const { width, height } = DESIGN;
    this.cameras.main.fadeIn(300);
    this.cameras.main.setBackgroundColor('#5A9A38');
    setupResponsiveCamera(this);
    applyAudioSettings(this);

    this._createForegroundDecor(width, height);
    this._createDecorativeAnimals(width, height);
    this._createTitle(width);
    this._createNameEntry(width);

    const buttonY = 350;
    const buttonSpacing = 95;

    this._createButton(width / 2, buttonY, 'PLAY', () => {
      this._ensureMusic();
      this._playSFX();
      if (!this.playerName?.trim()) {
        this._promptName(() => {
          if (this.playerName?.trim()) {
            this.scene.start('WorldMapScene', { playerName: this.playerName.trim() });
          }
        }, { required: true });
        return;
      }
      this.scene.start('WorldMapScene', { playerName: this.playerName.trim() });
    });

    this._createButton(width / 2, buttonY + buttonSpacing, 'LEADERBOARD', () => {
      this._ensureMusic();
      this._playSFX();
      if (!this.playerName?.trim()) {
        this._promptName(() => {
          if (this.playerName?.trim()) {
            this.scene.start('LeaderboardScene', { playerName: this.playerName.trim() });
          }
        }, { required: true });
        return;
      }
      this.scene.start('LeaderboardScene', { playerName: this.playerName.trim() });
    });

    this._createButton(width / 2, buttonY + buttonSpacing * 2, 'HOW TO PLAY', () => {
      this._ensureMusic();
      this._playSFX();
      this._showInstructions();
    });

    this._createButton(width / 2, buttonY + buttonSpacing * 3, 'SETTINGS', () => {
      this._ensureMusic();
      this._playSFX();
      if (this._settingsPanel) return;
      this._settingsPanel = createSettingsPanel(this, {
        onClose: () => { this._settingsPanel = null; },
      });
    });
  }

  _createForegroundDecor(width, height) {
    const props = [
      { key: 'cp_treeSmall', x: 80, y: height - 40, size: 72 },
      { key: 'cp_treeMedium', x: width - 90, y: height - 35, size: 88 },
      { key: 'cp_bushMedium', x: width * 0.25, y: height - 28, size: 48 },
      { key: 'cp_bushSmall', x: width * 0.72, y: height - 32, size: 40 },
      { key: 'cp_rock1', x: 140, y: height - 18, size: 28 },
      { key: 'cp_rock2', x: width - 160, y: height - 16, size: 24 },
      { key: 'cp_rock3', x: width * 0.5, y: height - 14, size: 22 },
    ];

    props.forEach((p) => {
      this.add.image(p.x, p.y, p.key)
        .setDisplaySize(p.size, p.size)
        .setOrigin(0.5, 1)
        .setDepth(2)
        .setAlpha(0.92);
    });
  }

  /* ── Title ───────────────────────────────────────────── */

  _createTitle(width) {
    const titleY = 90;

    const burstGfx = this.add.graphics().setDepth(4);
    burstGfx.setPosition(width / 2, titleY);
    const rays = 12;
    for (let i = 0; i < rays; i++) {
      const angle = (i / rays) * Math.PI * 2;
      const outerR = 80;
      const halfSpread = Math.PI / rays * 0.55;
      burstGfx.fillStyle(0xFFD700, 0.18);
      burstGfx.beginPath();
      burstGfx.moveTo(0, 0);
      burstGfx.lineTo(
        Math.cos(angle - halfSpread) * outerR,
        Math.sin(angle - halfSpread) * outerR
      );
      burstGfx.lineTo(
        Math.cos(angle) * (outerR + 15),
        Math.sin(angle) * (outerR + 15)
      );
      burstGfx.lineTo(
        Math.cos(angle + halfSpread) * outerR,
        Math.sin(angle + halfSpread) * outerR
      );
      burstGfx.closePath();
      burstGfx.fillPath();
    }

    this.tweens.add({
      targets: burstGfx,
      angle: 360,
      duration: 60000,
      repeat: -1,
      ease: 'Linear',
    });

    this.add.circle(width / 2, titleY, 34, 0xFFD700, 0.3).setDepth(5);

    this.add.text(width / 2, titleY, "Hannah's Garden Defense", {
      fontFamily: 'Kenney Pixel',
      fontSize: '48px',
      color: '#FFD700',
      stroke: '#3D5A1F',
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(5);
  }

  /* ── Name entry ──────────────────────────────────────── */

  _createNameEntry(width) {
    const savedName = localStorage.getItem('hannahGarden_playerName') || '';
    this.playerName = savedName;

    const panelY = 210;
    const panelW = 340;
    const panelH = 80;
    const uiDepth = 20;

    this.add.rectangle(width / 2 + 3, panelY + 3, panelW, panelH, 0x2A4010, 0.3)
      .setOrigin(0.5).setDepth(uiDepth);

    const panelBg = this.add.rectangle(width / 2, panelY, panelW, panelH, 0xFFF9E6)
      .setStrokeStyle(3, COLORS.outline)
      .setOrigin(0.5).setDepth(uiDepth);

    this.add.text(width / 2, panelY - 22, 'Your Name:', {
      fontFamily: 'Kenney Future',
      fontSize: '22px',
      color: '#3D5A1F',
    }).setOrigin(0.5).setDepth(uiDepth + 1);

    this.nameDisplay = this.add.text(width / 2 + 10, panelY + 10, savedName || 'Tap to enter name', {
      fontFamily: 'Kenney Future',
      fontSize: '24px',
      color: savedName ? '#4A2C0A' : '#888888',
    }).setOrigin(0.5).setDepth(uiDepth + 1).setInteractive({ useHandCursor: true });

    const pencilGfx = this.add.graphics();
    const pencilX = this.nameDisplay.x + this.nameDisplay.width / 2 + 18;
    const pencilY = panelY + 10;
    pencilGfx.fillStyle(0xFF9F1C);
    pencilGfx.fillRect(pencilX - 3, pencilY - 10, 6, 16);
    pencilGfx.fillStyle(0xFFD700);
    pencilGfx.fillTriangle(pencilX - 3, pencilY + 6, pencilX + 3, pencilY + 6, pencilX, pencilY + 12);
    pencilGfx.fillStyle(0x4A2C0A);
    pencilGfx.fillRect(pencilX - 4, pencilY - 12, 8, 4);

    const openNamePrompt = () => {
      this._resumeAudio();
      this._promptName();
    };
    this.nameDisplay.on('pointerdown', openNamePrompt);
    panelBg.setInteractive({ useHandCursor: true });
    panelBg.on('pointerdown', openNamePrompt);
  }

  /* ── Decorative animals ──────────────────────────────── */

  _createDecorativeAnimals(width, height) {
    if (this.textures.exists('chick')) {
      const chick = this.add.image(-40, height - 55, 'chick')
        .setScale(0.4)
        .setAlpha(0.9)
        .setDepth(3);
      this._animateChickHop(chick, width, height);
    }

    if (this.textures.exists('rabbit')) {
      const rabbit = this.add.image(width + 30, height - 70, 'rabbit')
        .setScale(0.45)
        .setAlpha(0)
        .setDepth(3);
      this._animateRabbitPeek(rabbit, width, height);
    }
  }

  _animateChickHop(chick, width, height) {
    const hopDuration = 500;
    const restDuration = 800;
    const hopDistance = 55;
    const totalHops = Math.ceil((width + 80) / hopDistance);
    let hopIndex = 0;

    const doHop = () => {
      if (!chick.active) return;

      this.tweens.add({
        targets: chick,
        x: chick.x + hopDistance,
        duration: hopDuration,
        ease: 'Sine.easeInOut',
      });

      this.tweens.add({
        targets: chick,
        y: height - 55 - 18,
        duration: hopDuration / 2,
        yoyo: true,
        ease: 'Sine.easeOut',
      });

      hopIndex++;
      if (hopIndex < totalHops) {
        this.time.delayedCall(hopDuration + restDuration, doHop);
      } else {
        this.time.delayedCall(4000, () => {
          if (!chick.active) return;
          chick.setPosition(-40, height - 55);
          hopIndex = 0;
          doHop();
        });
      }
    };

    this.time.delayedCall(1500, doHop);
  }

  _animateRabbitPeek(rabbit, width, height) {
    const peekX = width - 45;
    const hideX = width + 30;

    const doPeek = () => {
      if (!rabbit.active) return;

      this.tweens.add({
        targets: rabbit,
        x: peekX,
        alpha: 0.9,
        duration: 600,
        ease: 'Sine.easeOut',
        hold: Phaser.Math.Between(2000, 4000),
        onComplete: () => {
          if (!rabbit.active) return;
          this.tweens.add({
            targets: rabbit,
            x: hideX,
            alpha: 0,
            duration: 400,
            ease: 'Sine.easeIn',
            onComplete: () => {
              this.time.delayedCall(Phaser.Math.Between(3000, 6000), doPeek);
            },
          });
        },
      });
    };

    this.time.delayedCall(3000, doPeek);
  }

  /* ── Buttons (steady — hover feedback only) ─────────── */

  _createButton(x, y, label, callback) {
    const bw = 300;
    const bh = 70;
    const depth = 20;
    const isTouch = this.sys.game.device.input.touch;

    const shadow = this.add.rectangle(x + 4, y + 4, bw, bh, 0xC47F00, 0.5)
      .setOrigin(0.5)
      .setDepth(depth);

    const bg = this.add.rectangle(x, y, bw, bh, COLORS.button)
      .setOrigin(0.5)
      .setDepth(depth)
      .setStrokeStyle(3, COLORS.outline)
      .setInteractive({ useHandCursor: true });

    const text = this.add.text(x, y, label, {
      fontFamily: 'Kenney Future',
      fontSize: '28px',
      color: '#4A2C0A',
    }).setOrigin(0.5).setDepth(depth + 1);

    const parts = [bg, text, shadow];

    if (!isTouch) {
      bg.on('pointerover', () => {
        this.tweens.killTweensOf(parts);
        this.tweens.add({ targets: parts, scaleX: 1.04, scaleY: 1.04, duration: 60 });
      });
      bg.on('pointerout', () => {
        this.tweens.killTweensOf(parts);
        this.tweens.add({ targets: parts, scaleX: 1, scaleY: 1, duration: 60 });
      });
    }

    bg.on('pointerdown', () => {
      if (bg.getData('busy')) return;
      bg.setData('busy', true);
      this._resumeAudio();
      this.tweens.killTweensOf(parts);
      this.tweens.add({
        targets: parts,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 80,
        yoyo: true,
        onComplete: () => {
          bg.setData('busy', false);
          callback();
        },
      });
    });

    return { bg, shadow, text };
  }

  _resumeAudio() {
    SceneMusicManager.resumeAudioContext(this);
  }

  /* ── Name prompt ─────────────────────────────────────── */

  _promptName(onComplete, options = {}) {
    if (this._namePromptOpen) return;
    this._namePromptOpen = true;

    const { width, height } = DESIGN;
    const required = options.required ?? false;
    const objects = [];
    const depth = 200;

    const overlay = this.add.rectangle(width / 2, height / 2, width * 2, height * 2, 0x000000, 0.75)
      .setInteractive()
      .setDepth(depth);
    objects.push(overlay);

    const panel = this.add.rectangle(width / 2, height / 2, 520, 300, COLORS.uiPanel)
      .setStrokeStyle(3, COLORS.outline)
      .setDepth(depth + 1);
    objects.push(panel);

    const title = this.add.text(width / 2, height / 2 - 100, 'Enter Your Name', {
      fontFamily: 'Kenney Pixel',
      fontSize: '32px',
      color: '#3D5A1F',
    }).setOrigin(0.5).setDepth(depth + 2);
    objects.push(title);

    const hint = this.add.text(width / 2, height / 2 - 62, 'Max 12 characters', {
      fontFamily: 'Kenney Future',
      fontSize: '16px',
      color: '#888888',
    }).setOrigin(0.5).setDepth(depth + 2);
    objects.push(hint);

    const inputBg = this.add.rectangle(width / 2, height / 2 - 10, 380, 52, 0xFFFFFF)
      .setStrokeStyle(2, COLORS.outline)
      .setDepth(depth + 2);
    objects.push(inputBg);

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.maxLength = 12;
    nameInput.value = this.playerName || '';
    nameInput.placeholder = 'Your name';
    nameInput.style.cssText = [
      'position:absolute',
      'left:50%',
      'top:50%',
      'transform:translate(-50%, -50%)',
      'width:360px',
      'height:40px',
      'border:none',
      'outline:none',
      'background:transparent',
      'font-family:Kenney Future, sans-serif',
      'font-size:22px',
      'color:#4A2C0A',
      'text-align:center',
      'z-index:1000',
    ].join(';');

    const container = document.getElementById('game-container') || document.body;
    container.appendChild(nameInput);

    const syncInputPosition = () => {
      const canvas = this.game.canvas;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = rect.width / width;
      const scaleY = rect.height / height;
      nameInput.style.left = `${rect.left + (width / 2) * scaleX}px`;
      nameInput.style.top = `${rect.top + (height / 2 - 10) * scaleY}px`;
      nameInput.style.transform = 'translate(-50%, -50%)';
      nameInput.style.width = `${380 * scaleX}px`;
      nameInput.style.height = `${40 * scaleY}px`;
      nameInput.style.fontSize = `${Math.max(16, 22 * scaleY)}px`;
    };
    syncInputPosition();
    const onResize = () => syncInputPosition();
    window.addEventListener('resize', onResize);

    nameInput.focus();
    nameInput.select();

    const errorText = this.add.text(width / 2, height / 2 + 36, '', {
      fontFamily: 'Kenney Future',
      fontSize: '16px',
      color: '#E63946',
    }).setOrigin(0.5).setDepth(depth + 2);
    objects.push(errorText);

    const closePrompt = (saved) => {
      window.removeEventListener('resize', onResize);
      if (nameInput.parentNode) nameInput.parentNode.removeChild(nameInput);
      objects.forEach((obj) => obj.destroy());
      this._namePromptOpen = false;
      if (onComplete) onComplete(saved);
    };

    const saveName = () => {
      const trimmed = (nameInput.value || '').substring(0, 12).trim();
      if (!trimmed) {
        errorText.setText(required ? 'Please enter a name to continue.' : 'Name cannot be empty.');
        this.tweens.add({
          targets: inputBg,
          x: width / 2 - 6,
          duration: 40,
          yoyo: true,
          repeat: 3,
          onComplete: () => inputBg.setX(width / 2),
        });
        return;
      }
      this.playerName = trimmed;
      localStorage.setItem('hannahGarden_playerName', this.playerName);
      if (this.nameDisplay) {
        this.nameDisplay.setText(this.playerName);
        this.nameDisplay.setColor('#4A2C0A');
      }
      closePrompt(true);
    };

    const cancelBtn = this.add.rectangle(width / 2 - 90, height / 2 + 90, 140, 48, 0x888888)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, COLORS.outline)
      .setDepth(depth + 2);
    const cancelText = this.add.text(width / 2 - 90, height / 2 + 90, 'CANCEL', {
      fontFamily: 'Kenney Future',
      fontSize: '20px',
      color: '#FFFFFF',
    }).setOrigin(0.5).setDepth(depth + 3);
    objects.push(cancelBtn, cancelText);

    const okBtn = this.add.rectangle(width / 2 + 90, height / 2 + 90, 140, 48, COLORS.button)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, COLORS.outline)
      .setDepth(depth + 2);
    const okText = this.add.text(width / 2 + 90, height / 2 + 90, 'OK', {
      fontFamily: 'Kenney Future',
      fontSize: '20px',
      color: '#4A2C0A',
    }).setOrigin(0.5).setDepth(depth + 3);
    objects.push(okBtn, okText);

    cancelBtn.on('pointerdown', () => {
      this._playSFX();
      closePrompt(false);
    });
    okBtn.on('pointerdown', () => {
      this._playSFX();
      saveName();
    });
    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveName();
      if (e.key === 'Escape') closePrompt(false);
    });
  }

  _ensureMusic() {
    if (this.musicStarted) return;
    this.musicStarted = true;
    SceneMusicManager.transition(this, 'menu');
  }

  _playSFX() {
    this.sound.play('buttonClick', { volume: GameConfig.audio.sfxVolume });
  }

  _showInstructions() {
    const { width, height } = DESIGN;
    const steps = getFullGuideSteps();
    let stepIndex = 0;
    const panelW = Math.min(620, width - 48);
    const panelH = Math.min(400, height - 120);
    const objects = [];

    const overlay = this.add.rectangle(width / 2, height / 2, width * 2, height * 2, 0x000000, 0.82)
      .setDepth(100);
    objects.push(overlay);

    const panel = this.add.rectangle(width / 2, height / 2, panelW, panelH, COLORS.uiPanel)
      .setStrokeStyle(3, COLORS.outline)
      .setDepth(101);
    objects.push(panel);

    const titleText = this.add.text(width / 2, height / 2 - panelH / 2 + 28, '', {
      fontFamily: 'Kenney Pixel',
      fontSize: '22px',
      color: '#3D5A1F',
      align: 'center',
    }).setOrigin(0.5).setDepth(102);
    objects.push(titleText);

    const bodyText = this.add.text(width / 2, height / 2 - 10, '', {
      fontFamily: 'Kenney Future',
      fontSize: '17px',
      color: '#4A2C0A',
      align: 'center',
      wordWrap: { width: panelW - 48 },
      lineSpacing: 6,
    }).setOrigin(0.5).setDepth(102);
    objects.push(bodyText);

    const progressText = this.add.text(width / 2, height / 2 + panelH / 2 - 72, '', {
      fontFamily: 'Kenney Future',
      fontSize: '13px',
      color: '#888888',
    }).setOrigin(0.5).setDepth(102);
    objects.push(progressText);

    const renderStep = () => {
      const step = steps[stepIndex];
      titleText.setText(step.title || 'How To Play');
      bodyText.setText(step.text);
      progressText.setText(`${stepIndex + 1} / ${steps.length}`);
    };

    const closeAll = () => {
      this._playSFX();
      objects.forEach((o) => { if (o?.active) o.destroy(); });
    };

    const prevBtn = this.add.rectangle(width / 2 - 110, height / 2 + panelH / 2 - 28, 100, 44, COLORS.button)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, COLORS.outline)
      .setDepth(102);
    const prevLabel = this.add.text(width / 2 - 110, height / 2 + panelH / 2 - 28, 'Back', {
      fontFamily: 'Kenney Future', fontSize: '18px', color: '#4A2C0A',
    }).setOrigin(0.5).setDepth(102);
    objects.push(prevBtn, prevLabel);

    const nextBtn = this.add.rectangle(width / 2 + 110, height / 2 + panelH / 2 - 28, 100, 44, COLORS.button)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, COLORS.outline)
      .setDepth(102);
    const nextLabel = this.add.text(width / 2 + 110, height / 2 + panelH / 2 - 28, 'Next', {
      fontFamily: 'Kenney Future', fontSize: '18px', color: '#4A2C0A',
    }).setOrigin(0.5).setDepth(102);
    objects.push(nextBtn, nextLabel);

    const closeBtn = this.add.rectangle(width / 2, height / 2 + panelH / 2 + 36, 140, 44, COLORS.accent)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, COLORS.outline)
      .setDepth(102);
    const closeLabel = this.add.text(width / 2, height / 2 + panelH / 2 + 36, 'CLOSE', {
      fontFamily: 'Kenney Future', fontSize: '18px', color: '#4A2C0A',
    }).setOrigin(0.5).setDepth(102);
    objects.push(closeBtn, closeLabel);

    prevBtn.on('pointerdown', () => {
      if (stepIndex > 0) {
        this._playSFX();
        stepIndex--;
        renderStep();
      }
    });
    nextBtn.on('pointerdown', () => {
      if (stepIndex < steps.length - 1) {
        this._playSFX();
        stepIndex++;
        renderStep();
      } else {
        closeAll();
      }
    });
    closeBtn.on('pointerdown', closeAll);

    renderStep();
  }
}
