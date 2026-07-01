import { describe, it, expect } from 'vitest';
import {
  isValidPlayerName,
  sanitizePlayerName,
  PLAYER_NAME_RE,
  MAX_PLAYER_NAME_LENGTH,
} from '../src/utils/playerName.js';

describe('isValidPlayerName (server parity)', () => {
  it('matches the server regex exactly', () => {
    expect(PLAYER_NAME_RE.source).toBe('^[a-zA-Z0-9 ]{1,32}$');
  });

  it('accepts letters, numbers and spaces', () => {
    expect(isValidPlayerName('Hannah')).toBe(true);
    expect(isValidPlayerName('Player 1')).toBe(true);
    expect(isValidPlayerName('abc 123 XYZ')).toBe(true);
    expect(isValidPlayerName('a'.repeat(MAX_PLAYER_NAME_LENGTH))).toBe(true);
  });

  it('rejects punctuation, emoji and empty names', () => {
    expect(isValidPlayerName('')).toBe(false);
    expect(isValidPlayerName('Hannah!')).toBe(false);
    expect(isValidPlayerName('bob@home')).toBe(false);
    expect(isValidPlayerName('name_1')).toBe(false);
    expect(isValidPlayerName('🌻')).toBe(false);
    expect(isValidPlayerName('José')).toBe(false);
  });

  it('rejects names longer than 32 chars', () => {
    expect(isValidPlayerName('a'.repeat(MAX_PLAYER_NAME_LENGTH + 1))).toBe(false);
  });

  it('rejects non-strings', () => {
    expect(isValidPlayerName(null)).toBe(false);
    expect(isValidPlayerName(undefined)).toBe(false);
    expect(isValidPlayerName(42)).toBe(false);
  });
});

describe('sanitizePlayerName', () => {
  it('trims and collapses whitespace', () => {
    expect(sanitizePlayerName('  Hannah  ')).toBe('Hannah');
    expect(sanitizePlayerName('Player   1')).toBe('Player 1');
  });

  it('caps length at 32 chars', () => {
    expect(sanitizePlayerName('a'.repeat(50)).length).toBe(MAX_PLAYER_NAME_LENGTH);
  });

  it('returns empty string for non-strings', () => {
    expect(sanitizePlayerName(null)).toBe('');
    expect(sanitizePlayerName(123)).toBe('');
  });

  it('produces a valid name from forgiving input', () => {
    expect(isValidPlayerName(sanitizePlayerName('  Hannah B  '))).toBe(true);
  });
});
