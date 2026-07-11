/**
 * True once victory is queued or defeat has started Game Over.
 * Both flags must block further combat / wave-complete / victory transitions.
 */
export function isBattleTerminal(scene) {
  return !!(scene?._defeatHandled || scene?._battleEnded);
}
