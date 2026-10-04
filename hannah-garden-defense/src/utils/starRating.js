import { GameConfig } from '../config.js';

/**
 * Time budget (ms) for the under-time 3★ bonus.
 * @param {number} waveCount
 * @param {{ secondsBase?: number, secondsPerWave?: number }} [bonus]
 * @returns {number}
 */
export function starTimeBudgetMs(waveCount, bonus = GameConfig.starBonus) {
  const base = bonus?.secondsBase ?? 90;
  const perWave = bonus?.secondsPerWave ?? 35;
  const waves = Math.max(1, Number(waveCount) || 1);
  return (base + perWave * waves) * 1000;
}

/**
 * Whether the under-time bonus condition is met.
 * @param {number} elapsedMs
 * @param {number} waveCount
 * @returns {boolean}
 */
export function meetsStarTimeBonus(elapsedMs, waveCount) {
  if (elapsedMs == null || !Number.isFinite(elapsedMs)) return false;
  return elapsedMs <= starTimeBudgetMs(waveCount);
}

/**
 * Victory stars: lives thresholds + one bonus for 3★.
 * @param {{
 *   livesRemaining: number,
 *   elapsedMs?: number,
 *   waveCount?: number,
 *   wallBroken?: boolean,
 * }} opts
 * @returns {number} 1–3 (caller only invokes on victory)
 */
export function calculateStars(opts) {
  const lives = opts?.livesRemaining ?? 0;
  const thresholds = GameConfig.starThresholds || { three: 15, two: 8 };
  const bonusCfg = GameConfig.starBonus || { type: 'underTime' };

  let fromLives = 1;
  if (lives >= (thresholds.three ?? 15)) fromLives = 3;
  else if (lives >= (thresholds.two ?? 8)) fromLives = 2;

  if (fromLives < 3) return fromLives;

  const bonusOk = evaluateStarBonus(opts, bonusCfg);
  return bonusOk ? 3 : 2;
}

/**
 * @param {{ elapsedMs?: number, waveCount?: number, wallBroken?: boolean }} opts
 * @param {{ type?: string }} bonusCfg
 * @returns {boolean}
 */
export function evaluateStarBonus(opts, bonusCfg = GameConfig.starBonus) {
  const type = bonusCfg?.type || 'underTime';
  if (type === 'noWallBroken') {
    return !opts?.wallBroken;
  }
  // underTime (default)
  return meetsStarTimeBonus(opts?.elapsedMs ?? Infinity, opts?.waveCount ?? 1);
}

/**
 * Projected stars from lives only (in-battle meter; time bonus unknown yet).
 * Caps at 2 when lives would otherwise imply 3 — kid hint covers the bonus.
 * Prefer calculateStars at victory.
 */
export function projectedStarsFromLives(lives, thresholds = GameConfig.starThresholds) {
  if (lives >= (thresholds?.three ?? 15)) return 3;
  if (lives >= (thresholds?.two ?? 8)) return 2;
  if (lives > 0) return 1;
  return 0;
}

/**
 * Kid-readable star meter hint.
 * @param {number} lives
 * @param {{ three?: number, two?: number, thresholds?: object, bonusHint?: string }} [opts]
 *        Also accepts a raw thresholds object `{ three, two }` for backward compatibility.
 */
export function starMeterHint(lives, opts = {}) {
  const looksLikeThresholds = opts && Number.isFinite(opts.three);
  const thresholds = looksLikeThresholds
    ? opts
    : (opts.thresholds || GameConfig.starThresholds);
  const bonusHint = looksLikeThresholds
    ? (GameConfig.starBonus?.hint || 'Finish fast!')
    : (opts.bonusHint || GameConfig.starBonus?.hint || 'Finish fast!');
  const stars = projectedStarsFromLives(lives, thresholds);
  const need3 = thresholds?.three ?? 15;
  if (stars >= 3) return `Keep hearts & ${bonusHint.replace(/!$/, '').toLowerCase()} for 3 stars!`;
  if (stars === 2) return `Need ${need3} hearts + ${bonusHint.replace(/!$/, '').toLowerCase()} for 3 stars`;
  if (stars === 1) return `Need ${thresholds?.two ?? 8} hearts for 2 stars`;
  return 'Protect the gate!';
}
