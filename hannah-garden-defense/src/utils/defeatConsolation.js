import { GameConfig } from '../config.js';
import {
  normalizeProgress,
  loadLocalProgress,
  saveProgressWithSync,
  hannahLevelFromXp,
} from './hannahProgress.js';

/**
 * Compute small XP + meta sunshine for a defeat.
 * @param {number} waveReached
 * @returns {{ xp: number, metaSunshine: number }}
 */
export function computeDefeatConsolation(waveReached) {
  const cfg = GameConfig.defeatConsolation || {};
  const wave = Math.max(1, Math.floor(Number(waveReached) || 1));
  const xp = Math.min(
    cfg.xpCap ?? 40,
    (cfg.xpBase ?? 8) + (wave - 1) * (cfg.xpPerWave ?? 3),
  );
  const metaSunshine = Math.min(
    cfg.metaSunshineCap ?? 20,
    (cfg.metaSunshineBase ?? 5) + (wave - 1) * (cfg.metaSunshinePerWave ?? 1),
  );
  return { xp, metaSunshine };
}

/**
 * Persist defeat consolation into local progress (and sync).
 * @param {string} playerName
 * @param {number} waveReached
 * @returns {{ xp: number, metaSunshine: number, progress: object }}
 */
export function grantDefeatConsolation(playerName, waveReached) {
  const reward = computeDefeatConsolation(waveReached);
  const progress = normalizeProgress(loadLocalProgress(playerName));
  progress.playerName = playerName || progress.playerName || 'Player';
  progress.hannahXp = (progress.hannahXp || 0) + reward.xp;
  progress.hannahLevel = hannahLevelFromXp(progress.hannahXp);
  progress.metaSunshineEarned = (progress.metaSunshineEarned || 0) + reward.metaSunshine;
  saveProgressWithSync(progress);
  return { ...reward, progress };
}
