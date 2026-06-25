import { GameConfig } from '../config.js';
import { AssetRegistry } from '../utils/AssetRegistry.js';

const MUSIC_KEYS = {
  MENU: 'menu',
  GAMEPLAY: 'gameplay',
  VICTORY: 'victory',
  GAME_OVER: 'gameOver',
};

const SFX_KEYS = {
  TOWER_PLACED: 'towerPlaced',
  TOWER_FIRES: 'towerFires',
  ENEMY_HIT: 'enemyHit',
  ENEMY_DIES: 'enemyDies',
  POINTS_EARNED: 'pointsEarned',
  WAVE_START: 'waveStart',
  BUTTON_CLICK: 'buttonClick',
  INVALID_ACTION: 'invalidAction',
  ABILITY_USED: 'abilityUsed',
  LEVEL_UP: 'levelUp',
};

const STORAGE_KEY = 'hannahGarden_audio';

let instance = null;

export class AudioManager {
  constructor(scene) {
    if (instance) return instance;
    instance = this;

    this.scene = scene;
    this.currentMusic = null;
    this.currentMusicKey = null;
    this.contextResumed = false;

    const saved = this._loadSettings();
    this.musicVolume = saved.musicVolume ?? GameConfig.audio.musicVolume;
    this.sfxVolume = saved.sfxVolume ?? GameConfig.audio.sfxVolume;
    this.muted = saved.muted ?? false;

    this._setupContextResume();
  }

  _loadSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  _saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        musicVolume: this.musicVolume,
        sfxVolume: this.sfxVolume,
        muted: this.muted,
      }));
    } catch { /* storage unavailable */ }
  }

  _setupContextResume() {
    if (this.contextResumed) return;

    const resume = () => {
      if (this.scene.sound.context && this.scene.sound.context.state === 'suspended') {
        this.scene.sound.context.resume();
      }
      this.contextResumed = true;
      document.removeEventListener('pointerdown', resume);
      document.removeEventListener('keydown', resume);
    };

    document.addEventListener('pointerdown', resume, { once: true });
    document.addEventListener('keydown', resume, { once: true });
  }

  playMusic(key) {
    const assetKey = MUSIC_KEYS[key];
    if (!assetKey) return;

    if (this.currentMusicKey === assetKey && this.currentMusic?.isPlaying) return;

    this.stopMusic();

    const loop = key !== 'VICTORY' && key !== 'GAME_OVER';
    this.currentMusic = this.scene.sound.add(assetKey, {
      volume: this.muted ? 0 : this.musicVolume,
      loop,
    });
    this.currentMusic.play();
    this.currentMusicKey = assetKey;
  }

  stopMusic() {
    if (this.currentMusic) {
      this.currentMusic.stop();
      this.currentMusic.destroy();
      this.currentMusic = null;
      this.currentMusicKey = null;
    }
  }

  playSFX(key) {
    const assetKey = SFX_KEYS[key];
    if (!assetKey) return;

    this.scene.sound.play(assetKey, {
      volume: this.muted ? 0 : this.sfxVolume,
    });
  }

  setMusicVolume(vol) {
    this.musicVolume = Phaser.Math.Clamp(vol, 0, 1);
    if (this.currentMusic && !this.muted) {
      this.currentMusic.setVolume(this.musicVolume);
    }
    this._saveSettings();
  }

  setSFXVolume(vol) {
    this.sfxVolume = Phaser.Math.Clamp(vol, 0, 1);
    this._saveSettings();
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.currentMusic) {
      this.currentMusic.setVolume(this.muted ? 0 : this.musicVolume);
    }
    this._saveSettings();
    return this.muted;
  }

  static reset() {
    instance = null;
  }
}
