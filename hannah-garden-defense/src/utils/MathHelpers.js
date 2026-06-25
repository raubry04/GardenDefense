/**
 * Utility functions for distance calculations and geometry.
 */

export function distanceBetween(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function angleBetween(a, b) {
  return Math.atan2(b.y - a.y, b.x - a.x);
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}
