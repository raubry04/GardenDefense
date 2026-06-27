import { GameConfig } from '../config.js';

/** Brief HUD toast message (design-space coords). */
const _queue = new WeakMap();

export function showToast(scene, message, durationMs = 2000) {
  const state = _queue.get(scene) ?? { active: null, pending: null };
  if (state.active?.message === message) return state.active.obj;
  if (state.active) {
    state.pending = { message, durationMs };
    _queue.set(scene, state);
    return null;
  }
  return _showToastNow(scene, message, durationMs, state);
}

function _showToastNow(scene, message, durationMs, state) {
  const width = GameConfig.canvas.width;
  const y = scene._uiMetrics?.toastY ?? (scene.hud?._hudRow2Y ? scene.hud._hudRow2Y + 48 : 130);

  const toast = scene.add
    .text(width / 2, y, message, {
      fontFamily: 'Kenney Future',
      fontSize: '14px',
      color: '#FFF9E6',
      backgroundColor: '#000000cc',
      padding: { x: 10, y: 6 },
    })
    .setOrigin(0.5, 0)
    .setDepth(250);

  state.active = { message, obj: toast };
  _queue.set(scene, state);

  scene.tweens.add({
    targets: toast,
    alpha: 0,
    y: y - 12,
    delay: durationMs - 400,
    duration: 400,
    onComplete: () => {
      toast.destroy();
      state.active = null;
      if (state.pending) {
        const next = state.pending;
        state.pending = null;
        _showToastNow(scene, next.message, next.durationMs, state);
      }
    },
  });
  return toast;
}
