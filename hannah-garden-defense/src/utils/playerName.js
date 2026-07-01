/**
 * Client-side player-name rules, kept in parity with the server.
 *
 * The server rejects any progress/leaderboard POST whose name fails this exact
 * regex (see server/routes/progress.js and server/routes/leaderboard.js). Without
 * matching validation on the client, punctuation/emoji names save locally but
 * every sync POST silently 400s. This is a shared pure helper so the name entry
 * UI and unit tests use one source of truth. Do NOT change the server regex here.
 */
export const PLAYER_NAME_RE = /^[a-zA-Z0-9 ]{1,32}$/;
export const MAX_PLAYER_NAME_LENGTH = 32;

/** Forgiving cleanup: collapse whitespace runs, trim, and cap at 32 chars. */
export function sanitizePlayerName(name) {
  if (typeof name !== 'string') return '';
  return name.replace(/\s+/g, ' ').trim().slice(0, MAX_PLAYER_NAME_LENGTH);
}

/** True when the name will be accepted by the server (letters, numbers, spaces). */
export function isValidPlayerName(name) {
  return typeof name === 'string' && PLAYER_NAME_RE.test(name);
}
