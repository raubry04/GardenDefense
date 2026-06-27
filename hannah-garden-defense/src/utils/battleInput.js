/** Shared pointer checks so GameScene map input ignores HUD/touch targets. */
export function isPointerOverBattleUI(game, pointer) {
  const ui = game.scene.getScene('UIScene');
  if (!ui?.tray || !pointer) return false;
  const pt = ui.cameras.main.getWorldPoint(pointer.x, pointer.y);
  return ui.tray.isDesignPointOverBlockingUI(pt.x, pt.y);
}

/** Larger circle hit zone for mobile HUD buttons. */
export function setTouchFriendlyCircleHit(circle, extraRadius = 14) {
  const r = (circle.radius || 22) + extraRadius;
  circle.setInteractive(new Phaser.Geom.Circle(0, 0, r), Phaser.Geom.Circle.Contains);
  return circle;
}

/** Match hit-test radius used in TowerTray.isDesignPointOverBlockingUI. */
export function battleHudButtonHitRadius(baseRadius = 22, touch = false) {
  return baseRadius + (touch ? 24 : 10);
}
