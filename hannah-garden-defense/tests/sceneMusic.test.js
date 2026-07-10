import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SceneMusicManager, transitionSceneMusic, playSfxSafe } from '../src/utils/SceneMusicManager.js';
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

function mockScene(contextState = 'running') {
  const tracks = {};
  const ctx = {
    state: contextState,
    resume: vi.fn(() => {
      ctx.state = 'running';
      return Promise.resolve();
    }),
  };
  return {
    sound: {
      context: ctx,
      unlock: vi.fn(),
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
    sys: { isActive: () => true },
  };
}

describe('SceneMusicManager', () => {
  beforeEach(() => {
    SceneMusicManager._resetForTests();
    GameConfig.audio.musicVolume = 0.6;
  });

  it('does not call resume() or play() before a user gesture (avoids autoplay spam)', () => {
    const scene = mockScene('suspended');
    transitionSceneMusic(scene, 'menu');
    expect(scene.sound.context.resume).not.toHaveBeenCalled();
    expect(scene.sound.play).toBeDefined();
    expect(scene.sound.get('menu')).toBeUndefined();
    expect(SceneMusicManager._isAudioUnlocked()).toBe(false);
    expect(SceneMusicManager._getActiveLoop()).toBe('menu');
    expect(SceneMusicManager._getPendingTransition()).toEqual({ mode: 'menu', scene });
  });

  it('force-resumes audio on first gesture and unlocks only once', () => {
    const scene = mockScene('suspended');
    SceneMusicManager.resumeAudioContext(scene, { force: true });
    expect(scene.sound.unlock).toHaveBeenCalledTimes(1);
    expect(scene.sound.context.resume).toHaveBeenCalledTimes(1);
    expect(SceneMusicManager._isAudioUnlocked()).toBe(true);

    SceneMusicManager.resumeAudioContext(scene, { force: true });
    expect(scene.sound.unlock).toHaveBeenCalledTimes(1);
  });

  it('defers play until context is running after unlock', async () => {
    const scene = mockScene('suspended');
    transitionSceneMusic(scene, 'menu');
    expect(scene.sound.get('menu')).toBeUndefined();

    SceneMusicManager.resumeAudioContext(scene, { force: true });
    await Promise.resolve();
    await Promise.resolve();

    expect(SceneMusicManager._getActiveLoop()).toBe('menu');
    expect(scene.sound.get('menu').isPlaying).toBe(true);
    expect(SceneMusicManager._getPendingTransition()).toBeNull();
  });

  it('starts menu loop on menu transition once unlocked', () => {
    const scene = mockScene('running');
    SceneMusicManager.resumeAudioContext(scene, { force: true });
    transitionSceneMusic(scene, 'menu');
    expect(SceneMusicManager._getActiveLoop()).toBe('menu');
    expect(scene.sound.get('menu').isPlaying).toBe(true);
  });

  it('switches from menu to battle at reduced volume', () => {
    const scene = mockScene('running');
    SceneMusicManager.resumeAudioContext(scene, { force: true });
    transitionSceneMusic(scene, 'menu');
    transitionSceneMusic(scene, 'battle');
    expect(SceneMusicManager._getActiveLoop()).toBe('battle');
    expect(scene.sound.get('menu').isPlaying).toBe(false);
    expect(scene.sound.get('battle').volume).toBeCloseTo(0.6 * 0.45);
  });

  it('stops loops on victory transition', () => {
    const scene = mockScene('running');
    SceneMusicManager.resumeAudioContext(scene, { force: true });
    transitionSceneMusic(scene, 'battle');
    transitionSceneMusic(scene, 'victory');
    expect(SceneMusicManager._getActiveLoop()).toBeNull();
    expect(scene.sound.get('battle').isPlaying).toBe(false);
  });

  it('playSfxSafe no-ops before unlock', () => {
    const scene = mockScene('running');
    const playSpy = vi.spyOn(scene.sound, 'play');
    playSfxSafe(scene, 'buttonClick', { volume: 0.5 });
    expect(playSpy).not.toHaveBeenCalled();
  });

  it('does not restore duck volume after scene has shut down', () => {
    const scene = mockScene('running');
    SceneMusicManager.resumeAudioContext(scene, { force: true });
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
