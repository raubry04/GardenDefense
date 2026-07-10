import { GameConfig } from '../config.js';

const BATTLE_VOLUME_MULT = 0.45;

/** @type {'menu'|'battle'|'victory'|'gameOver'|null} */
let activeLoop = null;
let globalUnlockBound = false;
/** True after a user gesture successfully (or intentionally) unlocked audio. */
let audioUnlocked = false;
/** Phaser sound.unlock() may only be called once — repeats spam AudioContext warnings. */
let unlockCalled = false;
/** Coalesce concurrent ctx.resume() attempts into one quiet call. */
let resumeInFlight = false;
/** @type {{ mode: 'menu'|'battle'|'victory'|'gameOver', scene: import('phaser').Scene } | null} */
let pendingTransition = null;
let duckSavedVolume = null;
let duckTimer = null;

/**
 * Resume the WebAudio context if suspended.
 * Before the first user gesture, browsers reject resume() and spam the console —
 * skip those attempts unless `force` (gesture handler) is set.
 * After unlock, only one resume() is in flight at a time (no burst on PLAY).
 * @param {import('phaser').Scene} scene
 * @param {{ force?: boolean }} [opts]
 */
export function resumeAudioContext(scene, opts = {}) {
  if (!audioUnlocked && !opts.force) return;

  if (opts.force) {
    audioUnlocked = true;
    // Single-shot Phaser unlock — calling this on every tap floods the console.
    if (!unlockCalled) {
      unlockCalled = true;
      try {
        scene?.sound?.unlock?.();
      } catch { /* ignore */ }
    }
  }

  const ctx = scene?.sound?.context;
  if (!ctx) return;

  if (ctx.state === 'running') {
    flushPendingTransition();
    return;
  }
  if (ctx.state !== 'suspended') return;
  if (resumeInFlight) return;

  resumeInFlight = true;
  const p = ctx.resume?.();
  if (p?.then) {
    p.then(() => {
      resumeInFlight = false;
      flushPendingTransition();
    }).catch(() => {
      resumeInFlight = false;
    });
  } else {
    resumeInFlight = false;
  }
}

function stopLoop(scene, key) {
  const track = scene?.sound?.get?.(key);
  if (track?.isPlaying) {
    track.stop();
  }
}

function stopAllLoops(scene) {
  stopLoop(scene, 'menu');
  stopLoop(scene, 'battle');
  // Also stop one-shot stingers so they don't overlap the next track when a
  // transition happens before they finish (e.g. Victory -> Map).
  stopLoop(scene, 'victory');
  stopLoop(scene, 'gameOver');
  activeLoop = null;
}

/** True when it is safe to call sound.play without Chrome autoplay spam. */
function canPlayAudio(scene) {
  if (!audioUnlocked) return false;
  const ctx = scene?.sound?.context;
  // No context (HTML5 Audio / tests) — allow play after unlock flag.
  if (!ctx) return true;
  return ctx.state === 'running';
}

function playLoop(scene, key, volume) {
  if (!scene?.sound) return;
  if (activeLoop === key) {
    const existing = scene.sound.get(key);
    if (existing?.isPlaying) {
      existing.setVolume(volume);
      return;
    }
  }

  stopAllLoops(scene);
  activeLoop = key;

  if (!canPlayAudio(scene)) {
    // Remember intent; flushPendingTransition starts playback once context runs.
    return;
  }

  const track = scene.sound.get(key);
  if (track) {
    track.setVolume(volume);
    if (!track.isPlaying) track.play({ loop: true });
  } else {
    scene.sound.play(key, { loop: true, volume });
  }
}

function playStinger(scene, key, volume) {
  if (!scene?.sound) return;
  stopAllLoops(scene);
  activeLoop = null;
  if (!canPlayAudio(scene)) return;
  scene.sound.play(key, { volume });
}

function applyTransition(scene, mode) {
  const vol = GameConfig.audio.musicVolume;

  switch (mode) {
    case 'menu':
      playLoop(scene, 'menu', vol);
      break;
    case 'battle':
      playLoop(scene, 'battle', vol * BATTLE_VOLUME_MULT);
      break;
    case 'victory':
      playStinger(scene, 'victory', vol);
      break;
    case 'gameOver':
      playStinger(scene, 'gameOver', vol);
      break;
    default:
      break;
  }
}

function flushPendingTransition() {
  if (!pendingTransition) return;
  const { mode, scene } = pendingTransition;
  if (!canPlayAudio(scene)) return;
  pendingTransition = null;
  applyTransition(scene, mode);
}

export function ensureGlobalAudioUnlock(scene) {
  if (globalUnlockBound || !scene?.input) return;
  globalUnlockBound = true;
  scene.input.once('pointerdown', () => {
    resumeAudioContext(scene, { force: true });
  });
}

/**
 * @param {import('phaser').Scene} scene
 * @param {'menu'|'battle'|'victory'|'gameOver'} mode
 */
export function transitionSceneMusic(scene, mode) {
  ensureGlobalAudioUnlock(scene);
  // Only resume after unlock — avoids Chrome "AudioContext was not allowed" spam
  // on every scene create before the first tap.
  resumeAudioContext(scene);

  if (!canPlayAudio(scene)) {
    // Queue the latest requested mode; do not call sound.play while suspended.
    pendingTransition = { mode, scene };
    // Still record loop intent for menu/battle so callers/tests can read activeLoop
    // after unlock flush — for locked state, set activeLoop when we would loop.
    if (mode === 'menu' || mode === 'battle') {
      activeLoop = mode;
    } else {
      activeLoop = null;
    }
    return;
  }

  pendingTransition = null;
  applyTransition(scene, mode);
}

/**
 * Play a one-shot SFX only after audio is unlocked and the context is running.
 * Prevents buttonClick + music + unlock from bursting AudioContext warnings on PLAY.
 * @param {import('phaser').Scene} scene
 * @param {string} key
 * @param {Phaser.Types.Sound.SoundConfig} [config]
 */
export function playSfxSafe(scene, key, config) {
  if (!canPlayAudio(scene)) return;
  try {
    scene?.sound?.play?.(key, config);
  } catch { /* ignore */ }
}

/** @deprecated Use transitionSceneMusic — kept as SceneMusicManager.transition for call sites */
export const SceneMusicManager = {
  transition: transitionSceneMusic,
  resumeAudioContext,
  ensureGlobalAudioUnlock,
  playSfxSafe,
  duck: duckSceneMusic,
  restore: restoreSceneMusic,
  /** Visible for tests */
  _resetForTests() {
    activeLoop = null;
    globalUnlockBound = false;
    audioUnlocked = false;
    unlockCalled = false;
    resumeInFlight = false;
    pendingTransition = null;
    duckSavedVolume = null;
    duckTimer = null;
  },
  _getActiveLoop() {
    return activeLoop;
  },
  _isAudioUnlocked() {
    return audioUnlocked;
  },
  _getPendingTransition() {
    return pendingTransition;
  },
};

export function applyMusicVolumeToActiveTracks(scene, musicVolume) {
  if (!scene?.sound) return;
  const menu = scene.sound.get('menu');
  const battle = scene.sound.get('battle');
  if (menu?.isPlaying) menu.setVolume(musicVolume);
  if (battle?.isPlaying) battle.setVolume(musicVolume * BATTLE_VOLUME_MULT);
}

/** Briefly lower battle music volume (e.g. boss banner). */
export function duckSceneMusic(scene, volumeMult = 0.3, ms = 2000) {
  if (!scene?.sound) return;
  const battle = scene.sound.get('battle');
  if (!battle?.isPlaying) return;
  if (duckSavedVolume == null) duckSavedVolume = battle.volume;
  battle.setVolume(duckSavedVolume * volumeMult);
  if (duckTimer?.remove) duckTimer.remove(false);
  duckTimer = scene.time?.delayedCall(ms, () => {
    duckTimer = null;
    if (scene?.sys?.isActive?.()) {
      restoreSceneMusic(scene);
    } else {
      duckSavedVolume = null;
    }
  });
}

export function restoreSceneMusic(scene) {
  if (duckTimer?.remove) {
    duckTimer.remove(false);
    duckTimer = null;
  }
  const battle = scene?.sound?.get('battle');
  if (battle?.isPlaying && duckSavedVolume != null) {
    battle.setVolume(duckSavedVolume);
  }
  duckSavedVolume = null;
}
