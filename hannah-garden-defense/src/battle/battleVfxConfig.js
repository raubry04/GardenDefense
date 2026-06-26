/** Pure VFX config helpers (testable without Phaser canvas). */

const PROJECTILE_MAP = {
  CHICKEN: { texture: 'particle_sparkle', tint: 0xffd700, scale: 0.5 },
  OWL: { texture: 'particle_slash', tint: 0x4a3728, scale: 0.4 },
  RABBIT: { texture: 'particle_magic', tint: 0x88ccff, scale: 0.3 },
  DOG: { texture: 'particle_spark', tint: 0xffffaa, scale: 0.28 },
  DUCK: { texture: 'particle_magic', tint: 0x66bbff, scale: 0.3 },
  PENGUIN: { texture: 'particle_star', tint: 0xaaddff, scale: 0.32 },
};

const BURST_PRESETS = {
  hit: { texture: 'particle_spark', count: 6, lifespan: 280, speed: { min: 40, max: 100 } },
  death: { texture: 'particle_smoke', count: 8, lifespan: 450, speed: { min: 30, max: 80 } },
  deathStar: { texture: 'particle_star', count: 4, lifespan: 350, speed: { min: 20, max: 60 } },
  place: { texture: 'particle_magic', count: 10, lifespan: 400, speed: { min: 35, max: 90 } },
  gate: { texture: 'particle_flame', count: 12, lifespan: 500, speed: { min: 25, max: 70 } },
  abilityStar: { texture: 'particle_star', count: 14, lifespan: 500, speed: { min: 40, max: 120 } },
  abilityFlame: { texture: 'particle_flame', count: 10, lifespan: 400, speed: { min: 30, max: 90 } },
};

export function getProjectileStyle(towerType) {
  return PROJECTILE_MAP[towerType] ?? { texture: null, tint: 0xffd700, scale: 0.3 };
}

export function getBurstPreset(name) {
  return BURST_PRESETS[name] ?? BURST_PRESETS.hit;
}

export function shouldUseVfx(config) {
  return config?.enabled !== false;
}
