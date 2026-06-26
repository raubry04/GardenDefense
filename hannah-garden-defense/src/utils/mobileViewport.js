/**
 * Resize Phaser canvas to fill the screen. Do NOT offset the container — that
 * causes the down/right shift on phones when visualViewport.offsetTop/Left != 0.
 */

let _game = null;
let _rafPending = false;

export function getSafeInsets() {
  const style = getComputedStyle(document.documentElement);
  const px = (v) => parseFloat(v) || 0;
  return {
    top: px(style.getPropertyValue('--sat')),
    left: px(style.getPropertyValue('--sal')),
    right: px(style.getPropertyValue('--sar')),
    bottom: px(style.getPropertyValue('--sab')),
  };
}

/** CSS px below the playable canvas edge (env inset + optional extra). */
export function getSafeAreaBottom(extraPx = 0) {
  return getSafeInsets().bottom + extraPx;
}

export function isMobileViewport() {
  if (window.matchMedia('(pointer: coarse)').matches) return true;
  return Math.min(window.innerWidth, window.innerHeight) < 900;
}

/**
 * Visible size in CSS px — width/height only, never position offsets.
 * Prefer #game-container client box so safe-area padding is excluded from the canvas.
 */
export function getViewportSize() {
  const container = document.getElementById('game-container');
  if (container) {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w > 0 && h > 0) {
      return { width: Math.max(1, Math.round(w)), height: Math.max(1, Math.round(h)) };
    }
  }

  const vv = window.visualViewport;
  if (vv) {
    return {
      width: Math.max(1, Math.round(vv.width)),
      height: Math.max(1, Math.round(vv.height)),
    };
  }
  return {
    width: Math.max(1, window.innerWidth),
    height: Math.max(1, window.innerHeight),
  };
}

export function applyMobileLayout() {
  const container = document.getElementById('game-container');
  if (!container || !_game?.scale) return;

  const { width, height } = getViewportSize();
  const scale = _game.scale;

  container.style.position = 'fixed';
  container.style.left = '0';
  container.style.top = '0';
  container.style.width = '100%';
  container.style.height = '100%';
  container.style.margin = '0';
  container.style.paddingLeft = '0';
  container.style.paddingRight = '0';
  container.style.paddingTop = '0';
  container.style.paddingBottom = 'max(env(safe-area-inset-bottom, 0px), 0px)';

  if (scale.width !== width || scale.height !== height) {
    scale.resize(width, height);
  }

  const canvas = scale.canvas;
  if (canvas) {
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    canvas.style.margin = '0';
  }
}

function scheduleLayout() {
  if (_rafPending) return;
  _rafPending = true;
  requestAnimationFrame(() => {
    _rafPending = false;
    applyMobileLayout();
  });
}

export function setupMobileViewport(game) {
  _game = game;

  game.scale.on('resize', () => {
    game.events.emit('viewport-relayout');
  });

  applyMobileLayout();
  scheduleLayout();

  window.addEventListener('resize', scheduleLayout);
  window.addEventListener('orientationchange', () => setTimeout(scheduleLayout, 200));
  window.addEventListener('pageshow', scheduleLayout);

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', scheduleLayout);
  }

  game.events.once('ready', scheduleLayout);
}

