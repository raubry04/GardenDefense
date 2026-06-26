import { GameConfig } from "../config.js";
import { syncToBattleCamera, getLayoutScreenSize } from "../utils/responsiveCamera.js";
import { computeDesignUIMetrics } from "../utils/battleLayout.js";
import { TutorialManager } from "../systems/TutorialManager.js";
import { BattleHud, formatWaveHudLabel } from "../ui/BattleHud.js";
import { TowerTray } from "../ui/TowerTray.js";
import { AbilityBar } from "../ui/AbilityBar.js";
import { WavePreview } from "../ui/WavePreview.js";

export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: "UIScene" });
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
      this.tray.applyLayout(m, this._uiLayoutCanonical);
      this.abilityBar.applyLayout(m, this._uiLayoutCanonical);
    };

    apply();
    const onRelayout = () => apply();
    this.scale.on("resize", onRelayout);
    this.game.events.on("viewport-relayout", onRelayout);
    this.events.once("shutdown", () => {
      this.scale.off("resize", onRelayout);
      this.game.events.off("viewport-relayout", onRelayout);
    });
  }

  _setupEventListeners() {
    this.game.events.on("lives-changed", (data) => {
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

    this.game.events.on("points-changed", (data) => {
      const delta = data.points - this.sunshinePoints;
      this.sunshinePoints = data.points;
      this.hud.pointsText.setText(`${this.sunshinePoints}`);
      this.hud.animatePointsChange(delta);
      this.tray.updateAffordability();
    });

    this.game.events.on("hannah-level-changed", (data) => {
      this.hannahLevel = data.level ?? this.hannahLevel;
      this.tray.refreshUnlocks();
    });

    this.game.events.on("wave-started", (data) => {
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

    this.game.events.on("wave-ended", (data) => {
      this.waveActive = false;
      this.betweenWaves = true;
      this.hud.waveBarFill.setSize(this.hud.waveBarWidth, 8);
      if (data.total == null || data.wave < data.total) {
        this.abilityBar.setSendWaveVisible(true);
        this.abilityBar.sendWaveText.setText("NEXT WAVE");
        this.abilityBar.resetSendWaveLabels();
      }
    });

    this.game.events.on("wave-cooldown-changed", (data) => {
      this.abilityBar.updateSendWaveCooldown(data);
    });

    this.game.events.on("battle-speed-changed", (data) => {
      const speed = data.speed ?? 1;
      this.hud._battleSpeed = speed;
      if (this.hud.speedLabel?.active) {
        this.hud.speedLabel.setText(`${speed}x`);
      }
    });

    this.game.events.on("wave-preview-changed", (preview) => {
      this._lastWavePreview = preview;
      if (this._inspectOpen || this.waveActive) {
        this.wavePreview.setVisible(false);
        return;
      }
      this.wavePreview.update(preview);
    });

    this.game.events.on("tower-inspect-open", () => {
      this._inspectOpen = true;
      this.wavePreview.setVisible(false);
    });

    this.game.events.on("tower-inspect-close", () => {
      this._inspectOpen = false;
      if (!this.waveActive && this._lastWavePreview) {
        this.wavePreview.update(this._lastWavePreview);
      }
    });

    this.game.events.on("enemy-defeated", () => {
      this.enemiesDefeated++;
      this.hud.updateWaveProgress();
    });

    this.game.events.on("battle-complete", () => {
      this.abilityBar.setSendWaveVisible(false);
    });

    this.game.events.on("tower-deselected", () => {
      this.tray.clearSelection();
    });

    this.game.events.on("placement-rejected", (data) => {
      if (data?.reason !== "afford") return;
      this.hud.animatePointsRejected();
    });

    this.game.events.on("ability-fired", (data) => {
      this.abilityBar.onAbilityFired(data);
    });

    this.events.on("shutdown", () => {
      this.game.events.off("lives-changed");
      this.game.events.off("points-changed");
      this.game.events.off("wave-started");
      this.game.events.off("wave-ended");
      this.game.events.off("enemy-defeated");
      this.game.events.off("battle-complete");
      this.game.events.off("tower-deselected");
      this.game.events.off("placement-rejected");
      this.game.events.off("ability-fired");
      this.game.events.off("wave-preview-changed");
      this.game.events.off("tower-inspect-open");
      this.game.events.off("wave-cooldown-changed");
      this.game.events.off("battle-speed-changed");
      this.wavePreview?.destroy();
      this.tray.destroy();
      this.hud.destroy();
    });
  }
}
