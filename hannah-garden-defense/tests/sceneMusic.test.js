import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SceneMusicManager, transitionSceneMusic } from '../src/utils/SceneMusicManager.js';
import { GameConfig } from '../src/config.js';

function createMockTrack() {
  return {
    isPlaying: false,
    volume: 0,
    play() {
      this.isPlaying = true;
    },
    stop() {
      this.isPlaying = false;
    },
    setVolume(v) {
      this.volume = v;
    },
  };
}

function mockScene() {
  const tracks = {};
  return {
    sound: {
      context: { state: 'running', resume: vi.fn() },
      get(key) {
        return tracks[key];
      },
      play(key, opts = {}) {
        const track = tracks[key] || createMockTrack();
        track.volume = opts.volume ?? track.volume;
        track.play();
        tracks[key] = track;
        return track;
      },
    },
    input: { once: vi.fn() },
  };
}

describe('SceneMusicManager', () => {
  beforeEach(() => {
    SceneMusicManager._resetForTests();
    GameConfig.audio.musicVolume = 0.6;
  });

  it('starts menu loop on menu transition', () => {
    const scene = mockScene();
    transitionSceneMusic(scene, 'menu');
    expect(SceneMusicManager._getActiveLoop()).toBe('menu');
    expect(scene.sound.get('menu').isPlaying).toBe(true);
  });

  it('switches from menu to battle at reduced volume', () => {
    const scene = mockScene();
    transitionSceneMusic(scene, 'menu');
    transitionSceneMusic(scene, 'battle');
    expect(SceneMusicManager._getActiveLoop()).toBe('battle');
    expect(scene.sound.get('menu').isPlaying).toBe(false);
    expect(scene.sound.get('battle').volume).toBeCloseTo(0.6 * 0.45);
  });

  it('stops loops on victory transition', () => {
    const scene = mockScene();
    transitionSceneMusic(scene, 'battle');
    transitionSceneMusic(scene, 'victory');
    expect(SceneMusicManager._getActiveLoop()).toBeNull();
    expect(scene.sound.get('battle').isPlaying).toBe(false);
  });

  it('does not restore duck volume after scene has shut down', () => {
    const scene = mockScene();
    scene.sys = { isActive: () => false };
    scene.time = {
      delayedCall: (_ms, fn) => {
        fn();
        return { remove: vi.fn() };
      },
    };
    transitionSceneMusic(scene, 'battle');
    const battle = scene.sound.get('battle');
    battle.volume = 0.27;
    SceneMusicManager.duck(scene, 0.3, 100);
    expect(battle.volume).toBeCloseTo(0.27 * 0.3);
    expect(battle.volume).not.toBeCloseTo(0.27);
  });
});
