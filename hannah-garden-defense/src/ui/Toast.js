import { GameConfig } from '../config.js';
import { TEXT_ON_DARK, TEXT_PILL_BG, TEXT_PILL_PAD } from '../utils/textReadability.js';

/** Brief HUD toast message (design-space coords). */
const _queue = new WeakMap();

export function showToast(scene, message, durationMs = 2000) {
  if (!scene?.sys?.isActive?.()) return null;
  const state = _queue.get(scene) ?? { active: null, pending: null };
  if (state.active?.message === message) return state.active.obj;
  if (state.active) {
    state.pending = { message, durationMs };
    _queue.set(scene, state);
    return null;
  }
  return _showToastNow(scene, message, durationMs, state);
}

/** Clear pending toasts when a scene shuts down. */
export function clearToastQueue(scene) {
  const state = _queue.get(scene);
  if (!state) return;
  state.pending = null;
  if (state.active?.obj?.active) {
    state.active.obj.destroy();
  }
  state.active = null;
  _queue.set(scene, state);
}

function _showToastNow(scene, message, durationMs, state) {
  if (!scene?.sys?.isActive?.()) return null;

  const width = GameConfig.canvas.width;
  const y = scene._uiMetrics?.toastY ?? (scene.hud?._hudRow2Y ? scene.hud._hudRow2Y + 48 : 130);

  const toast = scene.add
    .text(width / 2, y, message, {
      fontFamily: 'Kenney Future',
      fontSize: '18px',
      color: TEXT_ON_DARK,
      backgroundColor: TEXT_PILL_BG,
      padding: { x: Math.max(12, TEXT_PILL_PAD.x + 4), y: Math.max(8, TEXT_PILL_PAD.y + 2) },
      wordWrap: { width: Math.min(420, width - 48) },
      align: 'center',
      shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 2, fill: true },
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
      if (!scene?.sys?.isActive?.()) {
        toast.destroy();
        state.active = null;
        state.pending = null;
        return;
      }
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
