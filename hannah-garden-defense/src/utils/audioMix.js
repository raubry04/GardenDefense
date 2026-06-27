import { GameConfig } from '../config.js';

/** SFX volume for a named mix slot (multiplied by global sfxVolume). */
export function sfxVol(key) {
  const mix = GameConfig.audio.sfxMix?.[key] ?? 1;
  return GameConfig.audio.sfxVolume * mix;
}
