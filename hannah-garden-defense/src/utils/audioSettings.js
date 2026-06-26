import { GameConfig } from '../config.js';
import { applyMusicVolumeToActiveTracks } from './SceneMusicManager.js';

const STORAGE_KEY = 'hannahGarden_audioSettings';

function clampVolume(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(1, Math.max(0, n));
}

export function loadAudioSettings() {
  const defaults = {
    musicVolume: GameConfig.audio.musicVolume,
    sfxVolume: GameConfig.audio.sfxVolume,
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaults };

    const parsed = JSON.parse(raw);
    return {
      musicVolume: clampVolume(parsed.musicVolume, defaults.musicVolume),
      sfxVolume: clampVolume(parsed.sfxVolume, defaults.sfxVolume),
    };
  } catch {
    return { ...defaults };
  }
}

export function saveAudioSettings({ musicVolume, sfxVolume }) {
  const settings = {
    musicVolume: clampVolume(musicVolume, GameConfig.audio.musicVolume),
    sfxVolume: clampVolume(sfxVolume, GameConfig.audio.sfxVolume),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* storage unavailable */
  }

  return settings;
}

export function applyAudioSettings(scene) {
  const settings = loadAudioSettings();
  GameConfig.audio.musicVolume = settings.musicVolume;
  GameConfig.audio.sfxVolume = settings.sfxVolume;

  applyMusicVolumeToActiveTracks(scene, settings.musicVolume);

  return settings;
}
