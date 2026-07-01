import { GameConfig } from '../config.js';

const BATTLE_VOLUME_MULT = 0.45;

/** @type {'menu'|'battle'|'victory'|'gameOver'|null} */
let activeLoop = null;
let globalUnlockBound = false;
let duckSavedVolume = null;
let duckTimer = null;

export function resumeAudioContext(scene) {
  const ctx = scene?.sound?.context;
  if (ctx?.state === 'suspended') {
    ctx.resume();
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

  const track = scene.sound.get(key);
  if (track) {
    track.setVolume(volume);
    if (!track.isPlaying) track.play({ loop: true });
  } else {
    scene.sound.play(key, { loop: true, volume });
  }
}

export function ensureGlobalAudioUnlock(scene) {
  if (globalUnlockBound || !scene?.input) return;
  globalUnlockBound = true;
  scene.input.once('pointerdown', () => {
    resumeAudioContext(scene);
  });
}

/**
 * @param {import('phaser').Scene} scene
 * @param {'menu'|'battle'|'victory'|'gameOver'} mode
 */
export function transitionSceneMusic(scene, mode) {
  ensureGlobalAudioUnlock(scene);
  resumeAudioContext(scene);

  const vol = GameConfig.audio.musicVolume;

  switch (mode) {
    case 'menu':
      playLoop(scene, 'menu', vol);
      break;
    case 'battle':
      playLoop(scene, 'battle', vol * BATTLE_VOLUME_MULT);
      break;
    case 'victory':
      stopAllLoops(scene);
      scene.sound.play('victory', { volume: vol });
      activeLoop = null;
      break;
    case 'gameOver':
      stopAllLoops(scene);
      scene.sound.play('gameOver', { volume: vol });
      activeLoop = null;
      break;
    default:
      break;
  }
}

/** @deprecated Use transitionSceneMusic — kept as SceneMusicManager.transition for call sites */
export const SceneMusicManager = {
  transition: transitionSceneMusic,
  resumeAudioContext,
  ensureGlobalAudioUnlock,
  duck: duckSceneMusic,
  restore: restoreSceneMusic,
  /** Visible for tests */
  _resetForTests() {
    activeLoop = null;
    globalUnlockBound = false;
    duckSavedVolume = null;
    duckTimer = null;
  },
  _getActiveLoop() {
    return activeLoop;
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
