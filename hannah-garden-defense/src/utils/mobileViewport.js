/**
 * iOS / iPad Safari viewport sizing. Uses visualViewport so the canvas fills
 * the actual visible screen (not window.innerHeight with chrome gaps).
 */

let _game = null;
let _rafPending = false;

/** Read safe-area insets exposed via CSS custom properties on :root. */
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

/** Visible viewport size in CSS pixels (visualViewport when available). */
export function getViewportSize() {
  const vv = window.visualViewport;
  if (vv) {
    return {
      width: Math.max(1, Math.round(vv.width)),
      height: Math.max(1, Math.round(vv.height)),
      offsetLeft: Math.round(vv.offsetLeft),
      offsetTop: Math.round(vv.offsetTop),
    };
  }
  return {
    width: Math.max(1, window.innerWidth),
    height: Math.max(1, window.innerHeight),
    offsetLeft: 0,
    offsetTop: 0,
  };
}

/**
 * Pin #game-container to the visible viewport and resize the Phaser game to match.
 */
export function applyMobileLayout() {
  const container = document.getElementById('game-container');
  if (!container) return;

  const { width, height, offsetLeft, offsetTop } = getViewportSize();

  container.style.position = 'fixed';
  container.style.left = `${offsetLeft}px`;
  container.style.top = `${offsetTop}px`;
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;
  container.style.margin = '0';
  container.style.padding = '0';
  container.style.border = 'none';
  container.style.transform = 'none';

  if (_game?.scale) {
    _game.scale.resize(width, height);
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

/**
 * Wire resize / orientation / iOS visualViewport listeners once at boot.
 */
export function setupMobileViewport(game) {
  _game = game;

  applyMobileLayout();

  window.addEventListener('resize', scheduleLayout);
  window.addEventListener('orientationchange', () => {
    setTimeout(scheduleLayout, 100);
    setTimeout(scheduleLayout, 350);
  });
  window.addEventListener('pageshow', scheduleLayout);

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', scheduleLayout);
    window.visualViewport.addEventListener('scroll', scheduleLayout);
  }

  game.events.once('ready', scheduleLayout);
  game.scale.on('enterfullscreen', scheduleLayout);
  game.scale.on('leavefullscreen', scheduleLayout);
}
