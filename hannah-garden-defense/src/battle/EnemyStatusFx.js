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
