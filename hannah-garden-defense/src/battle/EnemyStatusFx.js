const SLOW_TINT = 0x6699ff;
const STUN_TINT = 0xffffff;
const FREEZE_TINT = 0x66ccff;

/**
 * Apply readable status tints to enemy sprites (no per-frame allocations).
 * @param {object} enemy
 */
export function updateEnemyStatusFx(enemy) {
  if (!enemy?.sprite?.active) return;

  if (enemy.stunTimer > 0) {
    enemy.sprite.setTint(enemy.frozen ? FREEZE_TINT : STUN_TINT);
    enemy.sprite.setAlpha(enemy.frozen ? 0.85 : 0.75);
    return;
  }

  if (enemy.slowTimer > 0) {
    enemy.sprite.setTint(SLOW_TINT);
    enemy.sprite.setAlpha(0.9);
    return;
  }

  enemy.sprite.clearTint();
  enemy.sprite.setAlpha(1);
}

/** @param {object} enemy */
export function updateStatusRing(enemy) {
  const scene = enemy.sprite?.scene;
  if (!scene) return;

  const showSlow = enemy.slowTimer > 0 && enemy.stunTimer <= 0;
  const showStun = enemy.stunTimer > 0;

  if (!showSlow && !showStun) {
    if (enemy.statusRing?.active) {
      enemy.statusRing.destroy();
      enemy.statusRing = null;
    }
    return;
  }

  if (!enemy.statusRing?.active) {
    const color = showStun ? (enemy.frozen ? 0x66ccff : 0xffffff) : 0x6699ff;
    enemy.statusRing = scene.add.circle(enemy.x, enemy.y, 20, color, 0)
      .setStrokeStyle(2, color, 0.55).setDepth(18);
  }

  enemy.statusRing.setPosition(enemy.x, enemy.y);
  enemy.statusRing.setAlpha(showStun ? 0.7 : 0.45);
}
