import { GameConfig } from "../config.js";
import { syncToBattleCamera, getLayoutScreenSize } from "../utils/responsiveCamera.js";
import { computeDesignUIMetrics } from "../utils/battleLayout.js";
import { TutorialManager } from "../systems/TutorialManager.js";
import { BattleHud, formatWaveHudLabel } from "../ui/BattleHud.js";
import { TowerTray } from "../ui/TowerTray.js";
import { AbilityBar } from "../ui/AbilityBar.js";
import { WavePreview } from "../ui/WavePreview.js";
import { showToast, clearToastQueue } from "../ui/Toast.js";
import { levelUpUnlockMessage, unlocksAtLevel } from "../utils/hannahProgress.js";

export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: "UIScene" });
    this._boundHandlers = {};
  }

  init(data) {
    this.lives = data.lives ?? GameConfig.startingLives;
    this.sunshinePoints = data.sunshinePoints ?? 150;
    this.totalWaves = data.totalWaves ?? 10;
    this.currentWave = 0;
    this.zone = data.zone ?? 0;
    this.battle = data.battle ?? 0;
    this.hannahLevel = data.hannahLevel ?? 1;
    this.waveActive = false;
    this.betweenWaves = true;
    this.enemiesInWave = 0;
    this.enemiesDefeated = 0;
    this.worldWidth = data.worldWidth ?? GameConfig.canvas.width;
    this.worldHeight = data.worldHeight ?? GameConfig.canvas.height;
  }

  create() {
    const { width, height } = GameConfig.canvas;

    this.hud = new BattleHud(this);
    this.abilityBar = new AbilityBar(this);
    this.tray = new TowerTray(this, { hud: this.hud, abilityBar: this.abilityBar });

    this.hud.create(width);
    this.abilityBar.create(width, height);
    this.tray.create(width, height);
    this.wavePreview = new WavePreview(this, this.hud);
    this.wavePreview.create();

    this._setupEventListeners();
    this._setupUILayoutRelayout();
    this.tray.updateAffordability();
    syncToBattleCamera(this);
    this.scene.bringToTop();

    this.tutorial = new TutorialManager(this, { zone: this.zone, battle: this.battle });
    this.time.delayedCall(400, () => this.tutorial.start());
    this.time.delayedCall(8000, () => {
      this.tutorial.showHintIfEligible(this.zone, this.battle);
    });

    if (this.sys.game.device.input.touch) {
      this._onTouchDismiss = (pointer) => {
        const pt = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        let overAbility = false;
        for (const btn of this.abilityBar.abilityButtons || []) {
          if (!btn.circle?.active) continue;
          const r = (btn.circle.radius || 32) + 10;
          const dx = pt.x - btn.circle.x;
          const dy = pt.y - btn.circle.y;
          if (dx * dx + dy * dy <= r * r) {
            overAbility = true;
            break;
          }
        }
        if (!overAbility) this.abilityBar.dismissTouchTooltips();
      };
      this.input.on('pointerdown', this._onTouchDismiss);
    }
  }

  _setupUILayoutRelayout() {
    const { width, height } = GameConfig.canvas;
    const trayHeight = 94;
    this._uiLayoutCanonical = {
      trayCenterY: height - 80 + trayHeight / 2,
      sendWaveY: height - 140,
      abilityCenterY: height / 2,
      abilitySpacing: 80,
      abilityX: width - 50,
    };

    const apply = () => {
      const { width: sw, height: sh } = getLayoutScreenSize(this);
      const m = computeDesignUIMetrics(sw, sh);
      this._uiMetrics = m;
      this.hud.applyLayout(m);
      this.wavePreview.applyLayout(m);
      this.tray.applyLayout(m, this._uiLayoutCanonical);
      this.abilityBar.applyLayout(m, this._uiLayoutCanonical);
    };

    apply();
    this._onRelayout = () => apply();
    this.scale.on("resize", this._onRelayout);
    this.game.events.on("viewport-relayout", this._onRelayout);
    this.events.once("shutdown", () => {
      this.scale.off("resize", this._onRelayout);
      this.game.events.off("viewport-relayout", this._onRelayout);
    });
  }

  _on(event, handler) {
    this._boundHandlers[event] = handler;
    this.game.events.on(event, handler);
  }

  _celebrateLevelUp(level) {
    const unlock = levelUpUnlockMessage(level);
    const message = unlock
      ? `⭐ Level Up! ${unlock}`
      : `⭐ Level Up! Hannah is Level ${level}`;
    showToast(this, message, 2600);
    this.sound.play("pointsEarned", { volume: GameConfig.audio.sfxVolume });

    const star = this.hud?._hudStarIcon;
    if (star?.active) {
      const baseX = star.scaleX;
      const baseY = star.scaleY;
      this.tweens.add({
        targets: star,
        scaleX: baseX * 1.5,
        scaleY: baseY * 1.5,
        duration: 180,
        yoyo: true,
        repeat: 1,
        ease: "Back.easeOut",
        onComplete: () => star.setScale(baseX, baseY),
      });
    }

    // Spotlight any tower card unlocked at this level for extra positive feedback.
    const { towers } = unlocksAtLevel(level);
    towers?.forEach((type) => this.tray?.spotlightTower?.(type));
  }

  _setupEventListeners() {
    this._on("lives-changed", (data) => {
      const prevLives = this.lives;
      this.lives = data.lives;
      if (data.lives < prevLives) {
        for (
          let i = data.lives;
          i < prevLives && i < this.hud.heartIcons.length;
          i++
        ) {
          this.hud.animateHeartLoss(i);
        }
      } else {
        this.hud.updateHearts();
      }
      this.hud.livesText.setText(this.hud.livesLabel());
      this.hud.startLowHealthPulse();
    });

    this._on("points-changed", (data) => {
      const delta = data.points - this.sunshinePoints;
      this.sunshinePoints = data.points;
      this.hud.pointsText.setText(`${this.sunshinePoints}`);
      this.hud.animatePointsChange(delta);
      this.tray.updateAffordability();
    });

    this._on("hannah-level-changed", (data) => {
      const prevLevel = this.hannahLevel;
      this.hannahLevel = data.level ?? this.hannahLevel;
      this.tray.refreshUnlocks();
      this.abilityBar.refreshUnlocks();
      if (this.hannahLevel > prevLevel) {
        this._celebrateLevelUp(this.hannahLevel);
      }
    });

    this._on("wave-started", (data) => {
      this.currentWave = data.wave;
      this.waveActive = true;
      this.betweenWaves = false;
      this.enemiesInWave = data.enemyCount || 0;
      this.enemiesDefeated = 0;
      this.hud.waveText.setText(formatWaveHudLabel(data.wave, data.total));
      this.abilityBar.setSendWaveVisible(false);
      this.hud.updateWaveProgress();
      this.wavePreview.setVisible(false);
    });

    this._on("wave-ended", (data) => {
      this.waveActive = false;
      this.betweenWaves = true;
      this.hud.waveBarFill.setSize(this.hud.waveBarWidth, 8);
      if (data.total == null || data.wave < data.total) {
        this.abilityBar.setSendWaveVisible(true);
        this.abilityBar.sendWaveText.setText("NEXT WAVE");
        this.abilityBar.sendWaveBonusText.setText("+10 BONUS");
        this.abilityBar.sendWaveBonusText.setVisible(true);
        this.abilityBar.sendWaveBonusBg?.setVisible(true);
      }
    });

    this._on("wave-cooldown-changed", (data) => {
      this.abilityBar.updateSendWaveCooldown(data);
    });

    this._on("battle-speed-changed", (data) => {
      const speed = data.speed ?? 1;
      this.hud._battleSpeed = speed;
      if (this.hud.speedLabel?.active) {
        this.hud.speedLabel.setText(`×${speed}`);
      }
    });

    this._on("wave-preview-changed", (preview) => {
      this._lastWavePreview = preview;
      if (this._inspectOpen || this.waveActive) {
        this.wavePreview.setVisible(false);
        return;
      }
      this.wavePreview.update(preview);
    });

    this._on("tower-inspect-open", () => {
      this._inspectOpen = true;
      this.wavePreview.setVisible(false);
    });

    this._on("tower-inspect-close", () => {
      this._inspectOpen = false;
      if (!this.waveActive && this._lastWavePreview) {
        this.wavePreview.update(this._lastWavePreview);
      }
    });

    this._on("enemy-defeated", () => {
      this.enemiesDefeated++;
      this.hud.updateWaveProgress();
    });

    this._on("wave-enemies-added", (data) => {
      this.enemiesInWave += data?.count || 0;
      this.hud.updateWaveProgress();
    });

    this._on("battle-complete", () => {
      this.abilityBar.setSendWaveVisible(false);
    });

    this._on("tower-deselected", () => {
      this.tray.clearSelection();
    });

    this._on("placement-rejected", (data) => {
      if (data?.reason !== "afford") return;
      this.hud.animatePointsRejected();
    });

    this._on("wave-send-rejected", () => {
      showToast(this, "Wait for the wave timer!");
    });

    this._on("ability-fired", (data) => {
      this.abilityBar.onAbilityFired(data);
    });

    this._on("ability-rejected", (data) => {
      this.abilityBar.onAbilityRejected(data);
    });

    this._on("wave-hud-pulse", () => {
      this.hud.pulseWavePanel();
    });

    this._on("replay-tutorial", () => {
      this.tutorial?.replay();
    });

    this.events.on("shutdown", () => {
      if (this._onTouchDismiss) {
        this.input.off('pointerdown', this._onTouchDismiss);
        this._onTouchDismiss = null;
      }
      clearToastQueue(this);
      for (const [event, handler] of Object.entries(this._boundHandlers)) {
        this.game.events.off(event, handler);
      }
      this._boundHandlers = {};
      this.tutorial?.destroy?.();
      this.wavePreview?.destroy();
      this.tray.destroy();
      this.abilityBar.destroy();
      this.hud.destroy();
    });
  }
}
