/** Time scale while battle is paused (game time frozen). */
export function battleTimeScaleWhenPaused() {
  return 0;
}

/** Time scale when running or resuming — preserves selected battle speed. */
export function battleTimeScaleWhenRunning(battleSpeed) {
  return battleSpeed ?? 1;
}
