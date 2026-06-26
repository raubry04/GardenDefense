export const GameConfig = {
  canvas: { width: 1280, height: 720 },
  tileSize: 64,

  startingLives: 20,
  // In-battle placement budget per zone (unchanged by meta economy tuning).
  startingSunshinePoints: { zone1: 150, zone2: 175, zone3: 200, zone4: 225, zone5: 250, endless: 250 },
  // Fraction of in-battle sunshine earned that deposits into the upgrade bank on victory.
  // Zone 0 battle 1 (5 waves, ~510 gross + up to 100 star bonus):
  //   before: 200 seed + 100% deposit ≈ 810–860 bank ("god mode")
  //   after:  0 seed + 20% deposit ≈ 102–132 bank (one tier-1 upgrade)
  metaSunshineBankRate: 0.2,
  waveCooldownSeconds: 15,
  prepPhaseSeconds: 30,
  earlyWaveBonusPoints: 10,
  waveCompletionBonus: 25,
  twoStarBonus: 25,
  threeStarBonus: 75,

  starThresholds: { three: 15, two: 8 },

  hannahXpThresholds: [0, 200, 500, 900, 1400, 2000, 3000, 4500, 6500, 9000],
  hannahXpRewards: { battleComplete: 50, threeStarBonus: 25, bossKill: 30 },

  towers: {
    RABBIT: {
      cost: 50, slowPercent: 0.5, range: 112, aoe: true, unlock: { type: 'level', value: 1 },
      upgrades: [
        { slowPercent: 0.6, range: 160, cost: 75 },
        { slowPercent: 0.75, range: 192, cost: 150 }
      ]
    },
    CHICKEN: {
      cost: 75, damage: 10, range: 210, fireRate: 800, unlock: { type: 'level', value: 1 },
      upgrades: [
        { damage: 20, range: 300, fireRate: 700, eggs: 2, cost: 100 },
        { damage: 30, range: 340, fireRate: 600, eggs: 3, pierce: 1, cost: 200 }
      ]
    },
    DOG: {
      cost: 100, stunMs: 600, slowPercent: 0.35, range: 192, aoe: true, unlock: { type: 'level', value: 2 },
      upgrades: [
        { stunMs: 900, slowPercent: 0.45, range: 230, cost: 125 },
        { stunMs: 1200, slowPercent: 0.55, range: 270, cost: 200 }
      ]
    },
    OWL: {
      cost: 125, damage: 40, range: 450, fireRate: 2000, unlock: { type: 'zone', value: 2 },
      upgrades: [
        { damage: 70, range: 525, fireRate: 1800, cost: 150 },
        { damage: 110, range: 600, fireRate: 1500, cost: 250 }
      ]
    },
    DUCK: {
      cost: 150, slowPercent: 0.5, range: 220, aoe: true, unlock: { type: 'zone', value: 2 },
      upgrades: [
        { slowPercent: 0.6, range: 275, cost: 125 },
        { slowPercent: 0.75, range: 330, cost: 200 }
      ]
    },
    PENGUIN: {
      cost: 175, freezeMs: 1500, range: 200, cooldown: 8000, aoe: true, unlock: { type: 'zone', value: 3 },
      upgrades: [
        { freezeMs: 2000, range: 240, cooldown: 7000, cost: 175 },
        { freezeMs: 2500, range: 280, cooldown: 5500, cost: 275 }
      ]
    },
    PIG_WALL: {
      cost: 200, hp: 300, unlock: { type: 'zone', value: 3 },
      upgrades: [
        { hp: 500, cost: 150 },
        { hp: 800, thorns: 5, cost: 250 }
      ]
    }
  },

  enemies: {
    SNAKE: { hp: 40, speed: 60, reward: 10, damage: 1 },
    FROG: { hp: 60, speed: 40, reward: 15, damage: 1, splitsInto: 2 },
    GORILLA: { hp: 80, speed: 130, reward: 20, damage: 1, immuneToSlow: true },
    PARROT: { hp: 80, speed: 100, reward: 25, damage: 2, flies: true },
    MONKEY: { hp: 120, speed: 80, reward: 35, damage: 3, stealChance: 0.2, stealAmount: 5 },
    BEAR: { hp: 160, speed: 70, reward: 50, damage: 4, targetsTowers: true, towerDmg: 15 },
    ELEPHANT: { hp: 500, speed: 30, reward: 150, damage: 10, armored: true, stompRange: 100, stompSlowMs: 3000 },
    COW: { hp: 120, speed: 35, reward: 12, damage: 1 },
    HORSE: { hp: 45, speed: 150, reward: 18, damage: 1, speedBonus: 1.2 },
    BUFFALO: { hp: 220, speed: 55, reward: 45, damage: 3, immuneToStun: true, wallDamageMult: 2.5 },
  },

  zones: [
    { name: 'Sunflower Meadow', battles: 5, enemies: ['SNAKE', 'FROG'] },
    { name: 'Vegetable Garden', battles: 5, enemies: ['SNAKE', 'FROG', 'GORILLA', 'PARROT', 'COW'] },
    { name: 'Chicken Coop', battles: 5, enemies: ['SNAKE', 'FROG', 'GORILLA', 'PARROT', 'MONKEY', 'HORSE'] },
    { name: 'Berry Patch', battles: 5, enemies: ['SNAKE', 'FROG', 'GORILLA', 'PARROT', 'MONKEY', 'BEAR', 'BUFFALO'] },
    { name: 'Apple Orchard', battles: 5, enemies: ['SNAKE', 'FROG', 'GORILLA', 'PARROT', 'MONKEY', 'BEAR', 'ELEPHANT', 'BUFFALO'] }
  ],

  hannahAbilities: {
    SUNSHINE_BURST: { cooldown: 30000, damage: 25, label: 'Sunshine Burst' },
    GARDEN_RAIN: { cooldown: 45000, label: 'Garden Rain' },
    RAINBOW_SHIELD: { cooldown: 60000, duration: 8000, label: 'Rainbow Shield' },
    FLOWER_BOMB: { cooldown: 90000, damage: 50, range: 120, label: 'Flower Bomb', unlockLevel: 6 }
  },

  sellRefundPercent: 0.5,
  endlessDifficultyScale: 0.08,
  bossWaveBonus: 3,
  bossModifiers: { hpMult: 1.15, speedMult: 1.05 },
  towerDefaultHp: 200,

  waves: {
    minWaves: 5,
    maxWaves: 15,
    baseCount: 3,
    countPerWave: 1.2,
    countPerBattle: 2,
    bossWaveExtra: 0.5,
    spawnDelayMs: 800,
    endlessPreGenerate: 50,
    endlessBufferBatch: 25,
    manualFirstWave: true,
    zoneIntro: {
      0: {
        gentleWaves: 2,
        maxEnemyIndex: 0,
        primaryWeight: 0.85,
        manualFirstWave: true,
        lateFrogWeight: 0.4,
        battle0MaxCount: [3, 3, 4, 5, 6],
      },
      1: {
        gentleWaves: 1,
        maxEnemyIndex: 2,
        primaryWeight: 0.7,
        battle0MaxCount: [4, 5, 6, 7, 8],
      },
      2: {
        buffaloFromBattle: 2,
        gentleWaves: 1,
        maxEnemyIndex: 3,
        primaryWeight: 0.65,
      },
    },
  },

  enemyThreatTags: {
    PARROT: 'flying',
    HORSE: 'fast',
    BUFFALO: 'wallBreaker',
  },

  enemyIntros: {
    COW: 'Cows are slow but tough!',
    HORSE: 'Horses are blisteringly fast!',
    BUFFALO: 'Buffalo charge through Pig Walls!',
    PARROT: 'Parrots fly over ground towers!',
  },

  audio: { musicVolume: 0.6, sfxVolume: 0.8 },

  vfx: {
    enabled: true,
    maxBurstsPerFrame: 24,
    floatingTextPoolSize: 24,
  },

  zoneMoodTints: [
    0xfff8e0, // meadow warm
    0xe8f5e0, // vegetable fresh
    0xfff0d0, // coop golden
    0xe8e0ff, // berry cool
    0xffe8d8, // orchard sunset
    0xd8e8ff, // endless twilight
  ],

  colors: {
    primary: 0xFFD700,
    grass: 0x7EC850,
    path: 0xC8A96E,
    uiPanel: 0xFFF9E6,
    button: 0xFF9F1C,
    buttonText: 0x4A2C0A,
    enemyThreat: 0xE63946,
    stars: 0xFFE135,
    accent: 0xA8DADC,
    outline: 0x3D5A1F
  }
};
