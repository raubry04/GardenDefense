/**
 * Victory-screen celebration FX.
 *
 * Kenney particle_* textures are soft 512×512 ADD-blend glows. Used as normal
 * Images on bright grass they read as nearly invisible — and because
 * textures.exists() is true, the old solid-rectangle fallback never ran.
 * This helper uses opaque rectangles / circles (and solid icon_star) instead.
 *
 * IMPORTANT: spawn in DESIGN space with default scrollFactor (1). Do NOT use
 * scrollFactor 0 with design coords — when the camera is centerOn()'d for
 * letterboxing, SF0 treats x=0 as the viewport left edge, shifting the whole
 * rain left and leaving the right side of the design empty.
 */

/** Above garden décor (0), below interactive UI (≥100). */
export const VICTORY_FX_DEPTH = 50;
export const VICTORY_UI_DEPTH = 100;

export const CONFETTI_TINTS = Object.freeze([
  0xFFD700, // gold
  0xFF1493, // hot pink
  0x00E5FF, // cyan
  0xFFFFFF, // white
  0xFF9F1C, // orange
  0xFFE135, // bright yellow
  0xFF69B4, // pink
  0xFF4500, // orange-red
]);

export const CONFETTI_SIZE = Object.freeze({ min: 20, max: 48 });
export const SPARKLE_SIZE = Object.freeze({ min: 12, max: 22 });

/** Keep falling pieces readable over UPGRADES/MAP (buttons sit ~height-118). */
const BUTTON_BAND = 150;

/** Pure piece plan — testable without Phaser. */
export function planConfettiPiece(width, height, rng = Math, opts = {}) {
  const between = (lo, hi) => Math.floor(lo + rng.random() * (hi - lo + 1));
  const pick = (arr) => arr[Math.floor(rng.random() * arr.length)];
  const size = between(CONFETTI_SIZE.min, CONFETTI_SIZE.max);
  // Mix of strips, dots, and stars — kids' party, not one shape.
  const roll = rng.random();
  const shape = roll < 0.45 ? 'rect' : (roll < 0.75 ? 'circle' : 'star');

  // burst: scatter across upper 2/3 so frame 0 fills the screen
  // rain: enter from above the top edge, fall through, exit past bottom
  const mode = opts.mode === 'burst' || opts.nearTop === true ? 'burst' : 'rain';
  const upperBand = Math.max(120, Math.floor(height * (2 / 3)));
  const startY = mode === 'burst'
    ? between(4, upperBand)
    : between(-80, 12);

  // Uniform across the full design width (tiny inset so pieces aren't clipped).
  const maxX = Math.max(8, width - 8);
  return {
    x: between(8, maxX),
    startY,
    endY: height + 120,
    // Mild drift — keep most of the path inside the design frame.
    driftX: between(-120, 120),
    tint: pick(CONFETTI_TINTS),
    size,
    shape,
    depth: VICTORY_FX_DEPTH,
    duration: mode === 'burst' ? between(2800, 5200) : between(3000, 5600),
    spin: between(220, 900),
    mode,
  };
}

/**
 * Spawn one falling confetti piece. Uses solid geometry so it pops on grass.
 * Positions are DESIGN-space (scrollFactor 1) so coverage matches the UI.
 * @returns {Phaser.GameObjects.GameObject|null}
 */
export function spawnConfettiPiece(scene, width, height, opts = {}) {
  if (!scene?.sys?.isActive?.()) return null;

  const plan = opts.plan || planConfettiPiece(width, height, opts.rng || Math, {
    nearTop: opts.nearTop === true,
    mode: opts.mode,
  });
  const stagger = opts.stagger ?? 0;
  const onRespawn = opts.onRespawn;

  let particle;
  if (plan.shape === 'star' && scene.textures?.exists?.('icon_star')) {
    particle = scene.add.image(plan.x, plan.startY, 'icon_star')
      .setDisplaySize(plan.size, plan.size)
      .setTint(plan.tint)
      .setAlpha(1)
      .setAngle(Math.floor(Math.random() * 360))
      .setDepth(plan.depth);
  } else if (plan.shape === 'circle') {
    particle = scene.add.circle(plan.x, plan.startY, plan.size * 0.5, plan.tint, 1)
      .setDepth(plan.depth);
  } else {
    // Classic confetti strip — tall thin rectangle reads clearly in motion.
    const w = Math.max(12, Math.round(plan.size * 0.55));
    const h = Math.max(18, plan.size);
    particle = scene.add.rectangle(plan.x, plan.startY, w, h, plan.tint, 1)
      .setAngle(Math.floor(Math.random() * 360))
      .setDepth(plan.depth);
  }

  scene.tweens.add({
    targets: particle,
    y: plan.endY,
    x: plan.x + plan.driftX,
    angle: (particle.angle || 0) + plan.spin,
    duration: plan.duration,
    delay: stagger,
    ease: 'Sine.easeIn',
    onComplete: () => {
      particle.destroy();
      if (scene.sys?.isActive?.() && typeof onRespawn === 'function') {
        scene.time.delayedCall(30 + Math.floor(Math.random() * 160), onRespawn);
      }
    },
  });

  return particle;
}

/**
 * One-shot opening burst — pieces already scattered across the upper 2/3
 * and full design width so the first visible frame is packed.
 */
export function burstVictoryConfetti(scene, width, height, count = 48) {
  for (let i = 0; i < count; i++) {
    spawnConfettiPiece(scene, width, height, {
      mode: 'burst',
      stagger: 0,
    });
  }
}

/** Continuous top-down rain across the full design width while the scene is active. */
export function startVictoryConfetti(scene, width, height, count = 72) {
  const touch = scene?.sys?.game?.device?.input?.touch;
  const scaled = touch ? Math.min(count, 40) : count;
  const spawn = (stagger = 0, mode = 'rain') => {
    spawnConfettiPiece(scene, width, height, {
      mode,
      stagger,
      onRespawn: () => spawn(0, 'rain'),
    });
  };
  // First wave: on-screen burst so the rain never looks empty at t=0.
  const immediate = Math.min(scaled, touch ? 20 : 36);
  for (let i = 0; i < immediate; i++) {
    spawn(0, 'burst');
  }
  // Rest trickle in from the top edge across the full width.
  for (let i = immediate; i < scaled; i++) {
    spawn(40 + Math.floor(Math.random() * 700), 'rain');
  }
}

/** Soft mid-band sparkles (solid dots — not soft particle glows). */
export function createFloatingSparkles(scene, width, height) {
  const midTop = Math.floor(height * 0.28);
  const midBottom = Math.max(midTop + 40, height - BUTTON_BAND);
  const tints = [0xFFE135, 0xFFD700, 0xFFFFFF, 0x00E5FF, 0xFF1493];

  for (let i = 0; i < 22; i++) {
    // Full design width — same space as the UI, not a 70% center band.
    const x = 16 + Math.random() * Math.max(1, width - 32);
    const y = midTop + Math.random() * Math.max(20, midBottom - midTop);
    const r = SPARKLE_SIZE.min + Math.random() * (SPARKLE_SIZE.max - SPARKLE_SIZE.min);
    const tint = tints[Math.floor(Math.random() * tints.length)];

    const sparkle = scene.textures?.exists?.('icon_star')
      ? scene.add.image(x, y, 'icon_star')
        .setDisplaySize(r * 1.8, r * 1.8)
        .setTint(tint)
        .setAlpha(0)
        .setDepth(VICTORY_FX_DEPTH)
      : scene.add.circle(x, y, r * 0.6, tint, 1)
        .setAlpha(0)
        .setDepth(VICTORY_FX_DEPTH);

    scene.tweens.add({
      targets: sparkle,
      alpha: { from: 0, to: 1 },
      y: y - (18 + Math.random() * 28),
      duration: 1400 + Math.random() * 900,
      delay: Math.random() * 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}

/** Star-earn burst — solid dots radiating out. */
export function burstStarSparkles(scene, sx, sy) {
  for (let j = 0; j < 12; j++) {
    const angle = (Math.PI * 2 * j) / 12;
    const dist = 28 + Math.random() * 36;
    const r = 8 + Math.random() * 8;
    const sparkle = scene.add.circle(sx, sy, r, 0xFFE135, 1)
      .setDepth(VICTORY_FX_DEPTH);

    scene.tweens.add({
      targets: sparkle,
      x: sx + Math.cos(angle) * dist,
      y: sy + Math.sin(angle) * dist,
      alpha: 0,
      scaleX: 0.25,
      scaleY: 0.25,
      duration: 520,
      ease: 'Cubic.easeOut',
      onComplete: () => sparkle.destroy(),
    });
  }
}
