import { GameConfig } from '../config.js';

const BATTLE_VOLUME_MULT = 0.45;

/** @type {'menu'|'battle'|'victory'|'gameOver'|null} */
let activeLoop = null;
let globalUnlockBound = false;

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
  /** Visible for tests */
  _resetForTests() {
    activeLoop = null;
    globalUnlockBound = false;
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
