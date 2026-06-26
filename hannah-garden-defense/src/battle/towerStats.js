import { GameConfig } from '../config.js';

const TOWER_LABELS = {
  RABBIT: 'Rabbit Guard',
  CHICKEN: 'Chicken Cannon',
  DOG: 'Dog Patrol',
  OWL: 'Owl Sniper',
  DUCK: 'Duck Sprinkler',
  PENGUIN: 'Penguin Freezer',
  PIG_WALL: 'Pig Wall',
};

/** @param {string} type */
export function towerDisplayName(type) {
  return TOWER_LABELS[type] || type.replace(/_/g, ' ');
}

/**
 * @param {string} type
 * @param {object} tower - placed tower instance
 * @returns {string[]}
 */
export function formatTowerStats(type, tower) {
  const lines = [];
  const tier = tower.tier ?? 0;
  if (tier > 0) lines.push(`Tier ${tier}`);

  if (tower.damage > 0) lines.push(`Damage: ${tower.damage}`);
  if (tower.slowPercent > 0) lines.push(`Slow: ${Math.round(tower.slowPercent * 100)}%`);
  if (tower.stunMs > 0) lines.push(`Stun: ${(tower.stunMs / 1000).toFixed(1)}s`);
  if (tower.freezeMs > 0) lines.push(`Freeze: ${(tower.freezeMs / 1000).toFixed(1)}s`);
  if (tower.maxHp > 0 && type === 'PIG_WALL') {
    lines.push(`HP: ${Math.max(0, Math.ceil(tower.hp))}/${tower.maxHp}`);
  }
  if (tower.range) lines.push(`Range: ${tower.range}`);
  if (tower.eggs > 1) lines.push(`Eggs: ${tower.eggs}`);
  if (tower.pierce > 0) lines.push(`Pierce: ${tower.pierce}`);
  if (tower.thorns > 0) lines.push(`Thorns: ${tower.thorns}`);

  const base = GameConfig.towers[type];
  if (base?.aoe && !lines.some((l) => l.startsWith('Slow') || l.startsWith('Stun') || l.startsWith('Freeze'))) {
    lines.push('Area effect');
  }

  return lines.length ? lines : ['Support defender'];
}
