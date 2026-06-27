import { GameConfig } from '../config.js';
import { COLORS, TILE } from './battleConstants.js';
import { getProjectileStyle, getBurstPreset, shouldUseVfx } from './battleVfxConfig.js';

export class BattleVfx {
  constructor(scene) {
    this.scene = scene;
    this._emitters = {};
    this._textPool = [];
    this._activeBursts = 0;
    this._bobPhase = 0;
    this._aoeRingPool = [];
  }

  _cfg() {
    return GameConfig.vfx ?? {};
  }

  _canBurst() {
    const cfg = this._cfg();
    if (!shouldUseVfx(cfg)) return false;
    const max = cfg.maxBurstsPerFrame ?? 24;
    return this._activeBursts < max;
  }

  _getEmitter(key, textureKey, preset) {
    const s = this.scene;
    if (this._emitters[key]?.active) return this._emitters[key];

    const emitter = s.add.particles(0, 0, textureKey, {
      lifespan: preset.lifespan ?? 350,
      speed: preset.speed ?? { min: 30, max: 90 },
      scale: { start: 0.35, end: 0 },
      alpha: { start: 0.9, end: 0 },
      emitting: false,
      blendMode: 'ADD',
    }).setDepth(55);

    this._emitters[key] = emitter;
    return emitter;
  }

  burst(presetName, x, y, depth = 55) {
    if (!this._canBurst()) return;
    const preset = getBurstPreset(presetName);
    const emitter = this._getEmitter(`burst_${preset.texture}`, preset.texture, preset);
    emitter.setDepth(depth);
    this._activeBursts += 1;
    emitter.explode(preset.count, x, y);
    this.scene.time.delayedCall((preset.lifespan ?? 350) + 50, () => {
      this._activeBursts = Math.max(0, this._activeBursts - 1);
    });
  }

  burstHit(x, y) {
    this.burst('hit', x, y);
  }

  burstDeath(x, y) {
    this.burst('death', x, y);
    this.burst('deathStar', x, y);
  }

  burstPlace(x, y) {
    this.burst('place', x, y, 50);
  }

  burstGate(x, y) {
    this.burst('gate', x, y, 8);
  }

  _ensureAoERingPool() {
    const s = this.scene;
    while (this._aoeRingPool.length < 4) {
      const ring = s.add.circle(0, 0, 1, COLORS.primary, 0.25)
        .setStrokeStyle(2, COLORS.primary, 0.5)
        .setDepth(30)
        .setActive(false)
        .setVisible(false);
      ring.setData('inUse', false);
      this._aoeRingPool.push(ring);
    }
  }

  showAoERing(x, y, r) {
    this._ensureAoERingPool();
    let ring = this._aoeRingPool.find((c) => !c.getData('inUse'));
    if (!ring) ring = this._aoeRingPool[0];

    ring.setData('inUse', true);
    ring.setPosition(x, y);
    ring.setRadius(r);
    ring.setScale(1);
    ring.setAlpha(0.25);
    ring.setActive(true).setVisible(true);
    this.scene.tweens.killTweensOf(ring);
    this.scene.tweens.add({
      targets: ring,
      scaleX: 1.3,
      scaleY: 1.3,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        ring.setActive(false).setVisible(false).setScale(1);
        ring.setData('inUse', false);
      },
    });
  }

  enemyHitFlash(enemy) {
    if (!enemy?.sprite?.active) return;
    const spr = enemy.sprite;
    spr.setTintFill(0xffffff);
    this.scene.tweens.killTweensOf(spr);
    this.scene.time.delayedCall(80, () => {
      if (enemy.alive && spr.active) spr.clearTint();
    });
  }

  showPlacementRipple(x, y) {
    const ripple = this.scene.add.circle(x, y, 10, COLORS.primary, 0.1)
      .setStrokeStyle(1, COLORS.primary, 0.2)
      .setDepth(50);
    this.scene.tweens.add({
      targets: ripple,
      scaleX: 2.5,
      scaleY: 2.5,
      alpha: 0,
      duration: 200,
      onComplete: () => ripple.destroy(),
    });
  }

  burstAbility(key, x, y, radius = TILE * 2) {
    if (key === 'FLOWER_BOMB') {
      this.burst('abilityFlame', x, y);
    } else if (key === 'SUNSHINE_BURST') {
      this.burst('abilityStar', x, y);
    } else {
      this.burst('place', x, y);
    }
    const ring = this.scene.add.circle(x, y, radius, COLORS.primary, 0.15)
      .setStrokeStyle(2, COLORS.primary, 0.4).setDepth(35);
    this.scene.tweens.add({
      targets: ring, scaleX: 1.3, scaleY: 1.3, alpha: 0, duration: 400,
      onComplete: () => ring.destroy(),
    });
  }

  muzzleFlash() {
    // Disabled — tower fire feedback uses visible projectiles instead.
  }

  spawnProjectileSprite(x, y, towerType, angle) {
    const s = this.scene;
    const style = getProjectileStyle(towerType);
    let sprite;

    if (style.texture && s.textures.exists(style.texture)) {
      sprite = s.add.image(x, y, style.texture)
        .setDisplaySize(16 * style.scale * 4, 16 * style.scale * 4)
        .setTint(style.tint)
        .setDepth(30);
    } else {
      sprite = s.add.ellipse(x, y, 10, 7, COLORS.primary).setDepth(30);
    }
    sprite.setRotation(angle);
    return sprite;
  }

  _acquireText() {
    const pooled = this._textPool.find((t) => !t.active);
    if (pooled) {
      pooled.setActive(true).setVisible(true).setAlpha(1);
      return pooled;
    }
    const cfg = this._cfg();
    const maxPool = cfg.floatingTextPoolSize ?? 24;
    if (this._textPool.length >= maxPool) {
      return null;
    }
    const txt = this.scene.add.text(0, 0, '', {
      fontFamily: 'Kenney Pixel',
      fontSize: '16px',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(60);
    this._textPool.push(txt);
    return txt;
  }

  showFloatingDamage(x, y, damage) {
    const txt = this._acquireText();
    if (!txt) return;
    txt.setText(`-${damage}`);
    txt.setStyle({ color: '#E63946', fontStyle: 'bold', fontSize: '16px' });
    txt.setPosition(x, y);
    this.scene.tweens.killTweensOf(txt);
    this.scene.tweens.add({
      targets: txt,
      y: y - 28,
      alpha: 0,
      duration: 600,
      ease: 'Power2',
      onComplete: () => txt.setActive(false).setVisible(false),
    });
  }

  showFloatingText(x, y, message, color = '#FFD700') {
    const txt = this._acquireText();
    if (!txt) return;
    txt.setText(message);
    txt.setStyle({ color, fontStyle: 'normal', fontSize: '14px' });
    txt.setPosition(x, y);
    this.scene.tweens.killTweensOf(txt);
    this.scene.tweens.add({
      targets: txt,
      y: y - 24,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => txt.setActive(false).setVisible(false),
    });
  }

  showBlockedHit(enemy) {
    if (!enemy?.sprite?.active) return;
    const s = this.scene;
    this.showFloatingText(enemy.x, enemy.y - TILE / 2, 'blocked', '#B0C4DE');
    enemy.sprite.setTint(0x88aaff);
    s.time.delayedCall(120, () => {
      if (enemy.alive && enemy.sprite?.active) enemy.sprite.clearTint();
    });
  }

  squashSprite(sprite) {
    if (!sprite?.active) return;
    this.scene.tweens.add({
      targets: sprite,
      scaleY: sprite.scaleY * 0.75,
      duration: 60,
      yoyo: true,
      ease: 'Power1',
    });
  }

  createFlyingShadow(enemy) {
    const shadow = this.scene.add.ellipse(enemy.x, enemy.y + 8, 22, 8, 0x000000, 0.25)
      .setDepth(19);
    enemy.shadowSprite = shadow;
    return shadow;
  }

  createEliteAura(enemy) {
    if (!enemy.isElite) return null;
    const ring = this.scene.add.circle(enemy.x, enemy.y, TILE * 0.45, 0xffd700, 0)
      .setStrokeStyle(2, 0xffd700, 0.5).setDepth(19);
    enemy.eliteAura = ring;
    this.scene.tweens.add({
      targets: ring,
      alpha: { from: 0.5, to: 0.15 },
      scaleX: { from: 1, to: 1.2 },
      scaleY: { from: 1, to: 1.2 },
      duration: 900,
      yoyo: true,
      repeat: -1,
    });
    return ring;
  }

  updateEnemyMotionFx(enemy, delta) {
    this._bobPhase += delta * 0.008;
    if (enemy.sprite?.active && enemy.stunTimer <= 0) {
      const bob = Math.sin(this._bobPhase + (enemy.bobOffset ?? 0)) * 3;
      enemy.sprite.y = enemy.y + bob;
    }
    if (enemy.shadowSprite?.active) {
      enemy.shadowSprite.setPosition(enemy.x, enemy.y + 10);
    }
    if (enemy.eliteAura?.active) {
      enemy.eliteAura.setPosition(enemy.x, enemy.y);
    }
  }

  destroyEnemyFx(enemy) {
    enemy.shadowSprite?.destroy();
    enemy.eliteAura?.destroy();
    enemy.statusRing?.destroy();
  }

  destroy() {
    for (const e of Object.values(this._emitters)) {
      e?.destroy();
    }
    this._emitters = {};
    for (const t of this._textPool) t?.destroy();
    this._textPool = [];
    for (const r of this._aoeRingPool) r?.destroy();
    this._aoeRingPool = [];
  }
}
