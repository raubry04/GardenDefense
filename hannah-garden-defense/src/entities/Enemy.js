import { GameConfig } from '../config.js';
import { ENEMY_SPRITES } from '../utils/AssetRegistry.js';
import { distanceBetween } from '../utils/MathHelpers.js';

export class Enemy extends Phaser.GameObjects.Sprite {
  /**
   * Create a new enemy that follows a waypoint path.
   * @param {Phaser.Scene} scene - The scene this enemy belongs to
   * @param {number} x - Spawn x position
   * @param {number} y - Spawn y position
   * @param {'SNAKE'|'FROG'|'GORILLA'|'PARROT'|'MONKEY'|'BEAR'|'ELEPHANT'} type
   * @param {object} pathManager - Provides waypoints via getWaypoints()
   * @param {number} [difficulty=1] - Multiplier applied to HP
   */
  constructor(scene, x, y, type, pathManager, difficulty = 1) {
    super(scene, x, y, ENEMY_SPRITES[type]);

    this.type = type;
    this.pathManager = pathManager;
    this.config = { ...GameConfig.enemies[type] };

    this.maxHp = Math.round(this.config.hp * difficulty);
    this.hp = this.maxHp;
    this.baseSpeed = this.config.speed;
    this.speed = this.baseSpeed;
    this.reward = this.config.reward;
    this.alive = true;
    this.flies = this.config.flies ?? false;

    this.currentWaypointIndex = 0;
    this.slowed = false;
    this.frozen = false;
    this.slowTimer = null;
    this.freezeTimer = null;
    this.attackingWall = null;
    this.lastWallAttack = 0;

    if (!scene.textures.exists('particle')) {
      const gfx = scene.add.graphics();
      gfx.fillStyle(0xFFFFFF, 1);
      gfx.fillCircle(3, 3, 3);
      gfx.generateTexture('particle', 6, 6);
      gfx.destroy();
    }

    this.hpBar = scene.add.graphics();
    this.hpBar.setDepth(10);

    scene.add.existing(this);
    if (scene.physics) scene.physics.add.existing(this);
  }

  /**
   * Per-frame update: draw HP bar, handle freeze, follow path.
   * @param {number} time - Current game time in ms
   * @param {number} delta - Frame delta in ms
   */
  update(time, delta) {
    if (!this.alive || !this.active) return;
    this.drawHpBar();
    if (this.frozen) return;
    this.moveAlongPath(time, delta);
  }

  /**
   * Move toward the next waypoint, stopping to attack any PigWall in the way.
   * @param {number} time
   * @param {number} delta
   */
  moveAlongPath(time, delta) {
    if (!this.flies) {
      if (this.attackingWall) {
        if (!this.attackingWall.active || this.attackingWall.hp <= 0) {
          this.attackingWall = null;
        } else {
          if (time - this.lastWallAttack >= 1000) {
            this.attackingWall.takeDamage(this.config.damage * 5);
            this.lastWallAttack = time;
          }
          return;
        }
      }

      const walls = this.scene.towers?.getChildren().filter(
        t => t.type === 'PIG_WALL' && t.active && t.hp > 0
      ) ?? [];
      for (const wall of walls) {
        if (distanceBetween(this, wall) < 32) {
          this.attackingWall = wall;
          this.lastWallAttack = time;
          return;
        }
      }
    }

    const waypoints = this.pathManager.getWaypoints();
    if (this.currentWaypointIndex >= waypoints.length) {
      this.reachGate();
      return;
    }

    const target = waypoints[this.currentWaypointIndex];
    const dist = distanceBetween(this, target);

    if (dist < 2) {
      this.currentWaypointIndex++;
      if (this.currentWaypointIndex >= waypoints.length) {
        this.reachGate();
      }
      return;
    }

    const angle = Math.atan2(target.y - this.y, target.x - this.x);
    const moveAmount = this.speed * (delta / 1000);
    this.x += Math.cos(angle) * moveAmount;
    this.y += Math.sin(angle) * moveAmount;
  }

  /** Render a colored HP bar above the sprite. */
  drawHpBar() {
    this.hpBar.clear();
    const barWidth = 32;
    const barHeight = 4;
    const xOff = this.x - barWidth / 2;
    const yOff = this.y - this.displayHeight / 2 - 8;

    this.hpBar.fillStyle(0x000000, 0.6);
    this.hpBar.fillRect(xOff, yOff, barWidth, barHeight);

    const hpRatio = Math.max(0, this.hp / this.maxHp);
    const color = hpRatio > 0.5 ? 0x00FF00 : hpRatio > 0.25 ? 0xFFFF00 : 0xFF0000;
    this.hpBar.fillStyle(color, 1);
    this.hpBar.fillRect(xOff, yOff, barWidth * hpRatio, barHeight);
  }

  /**
   * Deal damage to this enemy. Elephants ignore chicken-sourced damage.
   * @param {number} amount - Raw damage value
   * @param {string} [source] - Tower type that dealt the damage (e.g. 'CHICKEN')
   */
  takeDamage(amount, source) {
    if (!this.alive) return;

    if (source === 'CHICKEN' && this.config.armored) {
      amount = 0;
    }

    this.hp -= amount;

    this.setTint(0xFF0000);
    this.scene.time.delayedCall(120, () => {
      if (this.active && !this.frozen) this.clearTint();
    });

    if (amount > 0) {
      const dmgText = this.scene.add.text(this.x, this.y - 20, `-${amount}`, {
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#FF4444',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);

      this.scene.tweens.add({
        targets: dmgText,
        y: dmgText.y - 30,
        alpha: 0,
        duration: 600,
        onComplete: () => dmgText.destroy()
      });
    }

    if (this.hp <= 0) this.die();
  }

  /**
   * Reduce movement speed for a duration. Ignored if immuneToSlow.
   * @param {number} percent - Slow strength (0.5 = 50% speed reduction)
   * @param {number} duration - Effect duration in ms
   */
  applySlow(percent, duration) {
    if (this.config.immuneToSlow) return;

    this.slowed = true;
    this.speed = this.baseSpeed * (1 - percent);

    if (this.slowTimer) this.slowTimer.remove();
    this.slowTimer = this.scene.time.delayedCall(duration, () => {
      this.slowed = false;
      this.speed = this.baseSpeed;
      this.slowTimer = null;
    });
  }

  /**
   * Completely stop movement for a duration.
   * @param {number} duration - Freeze duration in ms
   */
  applyFreeze(duration) {
    this.frozen = true;
    this.setTint(0x88CCFF);

    if (this.freezeTimer) this.freezeTimer.remove();
    this.freezeTimer = this.scene.time.delayedCall(duration, () => {
      this.frozen = false;
      if (this.active) this.clearTint();
      this.freezeTimer = null;
    });
  }

  /**
   * Handle death: burst particles, emit reward event, clean up.
   * Override in subclasses for special on-death behavior (call super.die() last).
   */
  die() {
    if (!this.alive) return;
    this.alive = false;

    const emitter = this.scene.add.particles(this.x, this.y, 'particle', {
      speed: { min: 30, max: 80 },
      scale: { start: 0.5, end: 0 },
      lifespan: 400,
      quantity: 8,
      emitting: false
    });
    emitter.explode(8);
    this.scene.time.delayedCall(500, () => {
      if (emitter.active) emitter.destroy();
    });

    this.scene.events.emit('enemy-killed', this);
    this.cleanup();
  }

  /** Handle reaching the end of the path. */
  reachGate() {
    if (!this.alive) return;
    this.alive = false;
    this.scene.events.emit('enemy-reached-gate', this);
    this.cleanup();
  }

  /** Remove timers, HP bar, and the sprite itself. */
  cleanup() {
    if (this.slowTimer) this.slowTimer.remove();
    if (this.freezeTimer) this.freezeTimer.remove();
    if (this.hpBar) this.hpBar.destroy();
    this.destroy();
  }
}
