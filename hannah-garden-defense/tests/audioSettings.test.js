import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadAudioSettings, saveAudioSettings, applyAudioSettings } from '../src/utils/audioSettings.js';
import { GameConfig } from '../src/config.js';

function mockLocalStorage() {
  const store = {};
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  };
}

describe('audioSettings', () => {
  beforeEach(() => {
    globalThis.localStorage = mockLocalStorage();
    GameConfig.audio.musicVolume = 0.6;
    GameConfig.audio.sfxVolume = 0.8;
  });

  it('returns config defaults when nothing stored', () => {
    const settings = loadAudioSettings();
    expect(settings.musicVolume).toBe(0.6);
    expect(settings.sfxVolume).toBe(0.8);
  });

  it('clamps volumes to 0–1 on load and save', () => {
    saveAudioSettings({ musicVolume: 1.5, sfxVolume: -0.2 });
    const loaded = loadAudioSettings();
    expect(loaded.musicVolume).toBe(1);
    expect(loaded.sfxVolume).toBe(0);
  });

  it('round-trips save and load', () => {
    saveAudioSettings({ musicVolume: 0.25, sfxVolume: 0.5 });
    const loaded = loadAudioSettings();
    expect(loaded.musicVolume).toBe(0.25);
    expect(loaded.sfxVolume).toBe(0.5);
  });

  it('applyAudioSettings writes into GameConfig and updates menu music', () => {
    saveAudioSettings({ musicVolume: 0.3, sfxVolume: 0.4 });
    const menuMusic = { isPlaying: true, setVolume: vi.fn() };
    const scene = { sound: { get: (key) => (key === 'menu' ? menuMusic : null) } };

    const applied = applyAudioSettings(scene);
    expect(applied.musicVolume).toBe(0.3);
    expect(GameConfig.audio.sfxVolume).toBe(0.4);
    expect(menuMusic.setVolume).toHaveBeenCalledWith(0.3);
  });
});
