export const GameConfig = {
  canvas: { width: 1280, height: 720 },
  tileSize: 64,

  startingLives: 20,
  // Anti-frustration cap: a single enemy reaching the gate can never remove more
  // than this many lives at once (only clips the biggest hitter, Elephant = 10).
  maxLifeLossPerLeak: 5,
  // In-battle placement budget per zone (unchanged by meta economy tuning).
  startingSunshinePoints: {
    zone1: 150, zone2: 168, zone3: 192, zone4: 216, zone5: 240, zone6: 255, endless: 250,
  },
  // Fraction of in-battle sunshine earned that deposits into the upgrade bank on victory.
  // At 16% meta rate, zone 0 battle 1 yields ~80–100 bank — steady but not instant maxing.
  metaSunshineBankRate: 0.16,
  // Each additional tower of the same type costs +12% (soft anti-spam).
  duplicateTowerCostStep: 0.12,
  // Campaign enemy HP multipliers — gentler early zones, ramps mid/late campaign.
  campaignHpScale: {
    perZone: [1, 1.08, 1.2, 1.38, 1.58, 1.72],
    perBattleInZone: 0.04,
  },
  // Trimmed downtime: waiting is a choice; Send Wave pays more.
  waveCooldownSeconds: 10,
  prepPhaseSeconds: 18,
  earlyWaveBonusPoints: 25,
  waveCompletionBonus: 25,
  twoStarBonus: 25,
  threeStarBonus: 75,

  starThresholds: { three: 15, two: 8 },
  /** 3★ also needs this kid-readable bonus (lives alone = at most 2★). */
  starBonus: {
    type: 'underTime',
    secondsBase: 90,
    secondsPerWave: 35,
    hint: 'Finish fast!',
  },

  /** Small XP / bank sunshine on Game Over so retries aren't pure loss. */
  defeatConsolation: {
    xpBase: 8,
    xpPerWave: 3,
    xpCap: 40,
    metaSunshineBase: 5,
    metaSunshinePerWave: 1,
    metaSunshineCap: 20,
  },

  hannahXpThresholds: [0, 200, 500, 900, 1400, 2000, 3000, 4500, 6500, 9000],
  hannahXpRewards: { battleComplete: 50, threeStarBonus: 25, bossKill: 30 },

  towers: {
    RABBIT: {
      cost: 50, slowPercent: 0.5, range: 112, aoe: true, unlock: { type: 'level', value: 1 },
      upgrades: [
        { slowPercent: 0.6, range: 160, cost: 120 },
        { slowPercent: 0.75, range: 192, cost: 280 }
      ]
    },
    CHICKEN: {
      cost: 75, damage: 10, range: 198, fireRate: 800, unlock: { type: 'level', value: 1 },
      upgrades: [
        { damage: 17, range: 260, fireRate: 740, eggs: 2, cost: 150 },
        { damage: 26, range: 300, fireRate: 650, eggs: 3, pierce: 1, cost: 340 }
      ]
    },
    DOG: {
      cost: 100, stunMs: 600, slowPercent: 0.35, range: 192, aoe: true, unlock: { type: 'level', value: 2 },
      upgrades: [
        { stunMs: 900, slowPercent: 0.45, range: 230, cost: 160 },
        { stunMs: 1200, slowPercent: 0.55, range: 270, cost: 320 }
      ]
    },
    OWL: {
      cost: 125, damage: 40, range: 450, fireRate: 2000, unlock: { type: 'zone', value: 2 },
      upgrades: [
        { damage: 70, range: 525, fireRate: 1800, cost: 210 },
        { damage: 110, range: 600, fireRate: 1500, cost: 440 }
      ]
    },
    DUCK: {
      cost: 150, slowPercent: 0.5, range: 220, aoe: true, unlock: { type: 'zone', value: 2 },
      upgrades: [
        { slowPercent: 0.6, range: 275, cost: 170 },
        { slowPercent: 0.75, range: 330, cost: 340 }
      ]
    },
    PENGUIN: {
      cost: 175, freezeMs: 1500, range: 200, cooldown: 8000, aoe: true, unlock: { type: 'zone', value: 3 },
      upgrades: [
        { freezeMs: 2000, range: 240, cooldown: 7000, cost: 240 },
        { freezeMs: 2500, range: 280, cooldown: 5500, cost: 420 }
      ]
    },
    PIG_WALL: {
      cost: 200, hp: 300, range: 0, unlock: { type: 'zone', value: 3 },
      upgrades: [
        { hp: 500, cost: 200 },
        { hp: 800, thorns: 5, cost: 380 }
      ]
    }
  },

  enemies: {
    SNAKE: { hp: 40, speed: 60, reward: 12, damage: 1 },
    FROG: { hp: 60, speed: 40, reward: 15, damage: 1, splitsInto: 2 },
    GORILLA: { hp: 80, speed: 130, reward: 20, damage: 1, immuneToSlow: true },
    PARROT: { hp: 80, speed: 100, reward: 25, damage: 2, flies: true },
    MONKEY: { hp: 120, speed: 80, reward: 35, damage: 3, stealChance: 0.2, stealAmount: 5 },
    BEAR: { hp: 160, speed: 70, reward: 50, damage: 4, targetsTowers: true, towerDmg: 15 },
    ELEPHANT: { hp: 500, speed: 30, reward: 150, damage: 10, armored: true, stompRange: 100, stompSlowMs: 3000 },
    COW: { hp: 120, speed: 35, reward: 12, damage: 1 },
    HORSE: { hp: 45, speed: 150, reward: 18, damage: 1, speedBonus: 1.2 },
    BUFFALO: { hp: 220, speed: 55, reward: 45, damage: 3, immuneToStun: true, wallDamageMult: 2.5 },
    RHINO: { hp: 280, speed: 28, reward: 55, damage: 5, immuneToStun: true, armored: true, wallDamageMult: 1.8 },
    HIPPO: { hp: 350, speed: 45, reward: 60, damage: 3 },
    CROCODILE: { hp: 140, speed: 35, reward: 35, damage: 2, ambushBurstSpeed: 120, ambushAtPathProgress: 0.66 },
    ZEBRA: { hp: 55, speed: 140, reward: 22, damage: 1, spawnInPairs: true },
  },

  zones: [
    { name: 'Sunflower Meadow', battles: 5, enemies: ['SNAKE', 'FROG'] },
    { name: 'Vegetable Garden', battles: 5, enemies: ['SNAKE', 'FROG', 'GORILLA', 'PARROT', 'COW'] },
    { name: 'Chicken Coop', battles: 5, enemies: ['SNAKE', 'FROG', 'GORILLA', 'PARROT', 'MONKEY', 'HORSE', 'CROCODILE'] },
    { name: 'Berry Patch', battles: 5, enemies: ['SNAKE', 'FROG', 'GORILLA', 'PARROT', 'MONKEY', 'BEAR', 'BUFFALO', 'HIPPO', 'ZEBRA'] },
    { name: 'Apple Orchard', battles: 5, enemies: ['SNAKE', 'FROG', 'GORILLA', 'PARROT', 'MONKEY', 'BEAR', 'ELEPHANT', 'BUFFALO', 'RHINO', 'CROCODILE', 'ZEBRA'] },
    // Seasonal harvest zone — post-Zone-5 runway before Endless-only grind.
    {
      name: 'Harvest Festival',
      battles: 5,
      seasonal: true,
      enemies: ['SNAKE', 'FROG', 'GORILLA', 'PARROT', 'MONKEY', 'BEAR', 'BUFFALO', 'RHINO', 'HIPPO', 'ZEBRA', 'ELEPHANT'],
    },
  ],

  hannahAbilities: {
    SUNSHINE_BURST: {
      cooldown: 30000,
      damage: 25,
      label: 'Sunshine Burst',
      description: 'Zaps all ground enemies on the path (not flying Parrots).',
    },
    GARDEN_RAIN: {
      cooldown: 45000,
      label: 'Garden Rain',
      description: 'Fully repairs every tower on the map.',
    },
    RAINBOW_SHIELD: {
      cooldown: 60000,
      duration: 8000,
      label: 'Rainbow Shield',
      description: 'Shields all towers from damage for 8 seconds.',
    },
    SEED_STORM: {
      cooldown: 50000,
      slowPercent: 0.45,
      duration: 4000,
      label: 'Seed Storm',
      unlockLevel: 4,
      description: 'Slows every pest on the path for a few seconds (Lv.4).',
    },
    FLOWER_BOMB: {
      cooldown: 90000,
      damage: 50,
      range: 120,
      label: 'Flower Bomb',
      unlockLevel: 6,
      description: 'Tap the map to drop a big explosion (Lv.6).',
    },
  },

  /**
   * Battle ability bar: three always-on powers + one selectable bonus slot
   * (Seed Storm at Lv.4, Flower Bomb at Lv.6 — pick which fills the slot).
   */
  abilityLoadout: {
    core: ['SUNSHINE_BURST', 'GARDEN_RAIN', 'RAINBOW_SHIELD'],
    bonusPool: ['SEED_STORM', 'FLOWER_BOMB'],
  },

  sellRefundPercent: 0.5,
  endlessDifficultyScale: 0.08,
  bossWaveBonus: 3,
  bossModifiers: { hpMult: 1.15, speedMult: 1.05 },
  towerDefaultHp: 200,

  /**
   * Named zone bosses (final battle). Not just “last pool enemy”.
   * uniqueRule keys are applied in TowerCombat / WaveManager.
   */
  zoneBosses: {
    0: {
      type: 'FROG',
      name: 'King Croak',
      telegraph: 'Ribbit rush — King Croak!',
      ruleLabel: 'Splits into lots of snakes!',
      uniqueRule: 'extraSplits',
      hpMult: 2.4,
      speedMult: 1.08,
      tint: 0xff88cc,
      scale: 1.4,
      extraSplits: 5,
    },
    1: {
      type: 'PARROT',
      name: 'Sky Screech',
      telegraph: 'Wings over the garden!',
      ruleLabel: 'Flies with parrot escorts!',
      uniqueRule: 'escort',
      hpMult: 2.0,
      speedMult: 1.12,
      tint: 0xffcc66,
      scale: 1.35,
      escortCount: 2,
    },
    2: {
      type: 'CROCODILE',
      name: 'Snapjaw',
      telegraph: 'Ambush at the gate!',
      ruleLabel: 'Sprints earlier and harder!',
      uniqueRule: 'ambushBoost',
      hpMult: 2.1,
      speedMult: 1.05,
      tint: 0x66aa88,
      scale: 1.3,
      ambushAtPathProgress: 0.45,
      ambushBurstSpeed: 160,
    },
    3: {
      type: 'BUFFALO',
      name: 'Ironhorn',
      telegraph: 'Walls beware — Ironhorn!',
      ruleLabel: 'Smashes Pig Walls harder!',
      uniqueRule: 'wallCrusher',
      hpMult: 1.9,
      speedMult: 1.08,
      tint: 0xb0b0c8,
      scale: 1.35,
      wallDamageMult: 4,
    },
    4: {
      type: 'ELEPHANT',
      name: 'Stomp King',
      telegraph: 'The orchard shakes!',
      ruleLabel: 'Huge stomps slow your towers!',
      uniqueRule: 'stompPlus',
      hpMult: 1.6,
      speedMult: 1.05,
      tint: 0xe8d080,
      scale: 1.45,
      stompRange: 140,
      stompSlowMs: 4500,
    },
    5: {
      type: 'RHINO',
      name: 'Harvest Horn',
      telegraph: 'Festival charge!',
      ruleLabel: 'Armored rush — shrugs off stuns!',
      uniqueRule: 'wallCrusher',
      hpMult: 1.85,
      speedMult: 1.1,
      tint: 0xffb74d,
      scale: 1.35,
      wallDamageMult: 3.5,
    },
  },

  /**
   * Intra-zone variety by battle index (0–4). Applied in GameScene / WaveManager.
   * flyersHeavy only fires when the zone pool includes a flyer.
   */
  battleModifiers: {
    byBattleIndex: {
      0: [],
      1: ['mirrorPath'],
      2: ['nightTint', 'flyersHeavy'],
      3: ['wind'],
      4: ['reversePath'],
    },
    /** Swap silhouette within a zone so battles aren't the same path. */
    pathLayoutByBattleIndex: {
      0: null,
      1: 'hairpin',
      2: null,
      3: 'diagonalS',
      4: 'wideLoop',
    },
    windSpeedMult: 1.18,
    nightTint: 0x1a2848,
    nightTintAlpha: 0.22,
    flyersHeavyFromWaveFraction: 0.4,
    flyerTypes: ['PARROT'],
  },

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
        crocodileFromBattle: 1,
        gentleWaves: 1,
        maxEnemyIndex: 3,
        primaryWeight: 0.65,
      },
      3: {
        hippoFromBattle: 2,
        zebraFromBattle: 1,
        gentleWaves: 1,
        maxEnemyIndex: 4,
        primaryWeight: 0.6,
        battle0MaxCount: [5, 6, 7, 8, 9],
      },
      4: {
        rhinoFromBattle: 2,
        elephantFromBattle: 3,
        gentleWaves: 1,
        maxEnemyIndex: 5,
        primaryWeight: 0.55,
        battle0MaxCount: [6, 7, 8, 9, 10],
      },
    },
  },

  enemyThreatTags: {
    PARROT: 'flying',
    HORSE: 'fast',
    BUFFALO: 'wallBreaker',
    ZEBRA: 'fast',
    RHINO: 'wallBreaker',
    CROCODILE: 'fast',
    GORILLA: 'immuneSlow',
    FROG: 'split',
    ELEPHANT: 'armored',
    HIPPO: 'armored',
    BEAR: 'towerHunter',
    MONKEY: 'steal',
    COW: 'tank',
  },

  /**
   * Endless Frontier + Daily Challenge unlock once unlockedZone reaches this
   * (clearing Zone 2 / Vegetable Garden sets unlockedZone to 2).
   */
  extraModesMinUnlockedZone: 2,

  enemyIntros: {
    SNAKE: 'Snakes are basic pests — any tower works!',
    FROG: 'Frogs split into Snakes when defeated!',
    GORILLA: 'Gorillas ignore slows — stun or smash them!',
    COW: 'Cows are slow but tough!',
    HORSE: 'Horses are blisteringly fast!',
    BUFFALO: 'Buffalo charge through Pig Walls!',
    PARROT: 'Parrots fly over ground towers!',
    RHINO: 'Rhinos shrug off stuns and smash Pig Walls!',
    HIPPO: 'Hippos soak up tons of damage!',
    CROCODILE: 'Crocodiles lurk, then sprint at the gate!',
    ZEBRA: 'Zebras run in pairs — double trouble!',
    BEAR: 'Bears leave the path to smash towers!',
    MONKEY: 'Monkeys may steal Sunshine when hit!',
    ELEPHANT: 'Elephant boss — armored and stompy!',
  },

  /** Per-zone map decoration prop keys (craftpixTiles CRAFTPIX_PROPS). */
  zonePropPools: {
    0: ['treeSmall', 'treeMedium', 'bushSmall', 'bushMedium', 'bushLarge', 'flag', 'fenceHorizontal', 'woodenBarrel'],
    1: ['treeMedium', 'treeLarge', 'bushMedium', 'bushLarge', 'windmill', 'woodenBarrel', 'fenceHorizontal'],
    2: ['treeLarge', 'bushLarge', 'well', 'campfire', 'tent', 'woodenCart', 'flag'],
    3: ['bushLarge', 'treeMedium', 'treasureChest', 'flag', 'blueBanner', 'fenceHorizontal', 'woodenBarrel'],
    4: ['castleRound', 'watchtowerTall', 'bridgeHorizontal', 'treeLarge', 'flag', 'redBanner', 'tent'],
    5: ['woodenCart', 'treasureChest', 'flag', 'redBanner', 'blueBanner', 'bushLarge', 'windmill', 'campfire'],
  },

  /** Replay modifier when battle has fewer than 3 stars (Chase ★). */
  eliteVariants: {
    FROG: { label: 'Armored Frog', hpMult: 1.3, tint: 0xaaccff },
    HORSE: { label: 'Swift Horse', speedMult: 1.15, tint: 0xffeeaa },
    BUFFALO: { label: 'Iron Buffalo', hpMult: 1.25, tint: 0xcccccc },
    PARROT: { label: 'Storm Parrot', hpMult: 1.25, speedMult: 1.1, tint: 0x88ddff },
    BEAR: { label: 'Grizzly Bear', hpMult: 1.35, tint: 0xcc8866 },
    MONKEY: { label: 'Trick Monkey', hpMult: 1.2, speedMult: 1.1, tint: 0xffaa88 },
    GORILLA: { label: 'Rage Gorilla', hpMult: 1.3, tint: 0xaa6688 },
    ZEBRA: { label: 'Blitz Zebra', speedMult: 1.2, tint: 0xffffff },
    RHINO: { label: 'Siege Rhino', hpMult: 1.3, tint: 0x99aacc },
    CROCODILE: { label: 'Shadow Croc', hpMult: 1.25, speedMult: 1.1, tint: 0x66aa77 },
    HIPPO: { label: 'Titan Hippo', hpMult: 1.35, tint: 0x8899aa },
    SNAKE: { label: 'Viper Snake', hpMult: 1.25, speedMult: 1.1, tint: 0x88ff88 },
  },

  /** Zone mastery: 3★ every battle in zone unlocks map badge (text) + real reward. */
  zoneMasteryBadges: {
    0: 'Meadow Keeper',
    1: 'Garden Guardian',
    2: 'Coop Captain',
    3: 'Berry Defender',
    4: 'Orchard Hero',
    5: 'Harvest Champion',
  },

  /**
   * Real mastery rewards (not text-only). Types: skin | prop | passive.
   * Claimed into progress.collection when all battles in the zone are 3★.
   */
  zoneMasteryRewards: {
    0: { type: 'skin', id: 'meadow_bow', label: 'Meadow Bow chick costume' },
    1: { type: 'prop', id: 'garden_windmill', label: 'Garden windmill map prop', craftpixKey: 'windmill' },
    2: { type: 'skin', id: 'coop_bandana', label: 'Coop Bandana chick costume' },
    3: { type: 'passive', id: 'berry_boost', label: '+8 starting Sunshine', startingSunshineBonus: 8 },
    4: { type: 'skin', id: 'orchard_crown', label: 'Orchard Crown chick costume' },
    5: { type: 'passive', id: 'harvest_boost', label: '+12 starting Sunshine', startingSunshineBonus: 12 },
  },

  /** Chick costume tints / labels for map mascot (texture stays `chick`). */
  chickSkins: {
    default: { label: 'Plain Chick', tint: 0xffffff, emoji: '🐥' },
    meadow_bow: { label: 'Meadow Bow', tint: 0xffe066, emoji: '🎀' },
    coop_bandana: { label: 'Coop Bandana', tint: 0xff8a65, emoji: '🧣' },
    orchard_crown: { label: 'Orchard Crown', tint: 0xffd54f, emoji: '👑' },
  },

  /** Animal album order (sticker book). */
  stickerAlbumOrder: [
    'SNAKE', 'FROG', 'GORILLA', 'PARROT', 'COW', 'MONKEY', 'HORSE', 'CROCODILE',
    'BEAR', 'BUFFALO', 'HIPPO', 'ZEBRA', 'RHINO', 'ELEPHANT',
  ],

  stickerLabels: {
    SNAKE: 'Snake', FROG: 'Frog', GORILLA: 'Gorilla', PARROT: 'Parrot', COW: 'Cow',
    MONKEY: 'Monkey', HORSE: 'Horse', CROCODILE: 'Crocodile', BEAR: 'Bear',
    BUFFALO: 'Buffalo', HIPPO: 'Hippo', ZEBRA: 'Zebra', RHINO: 'Rhino', ELEPHANT: 'Elephant',
  },

  /** First-clear enemy sticker also stamps a matching tower tray badge. */
  stickerTowerLinks: {
    PARROT: 'OWL',
    FROG: 'CHICKEN',
    COW: 'DUCK',
    SNAKE: 'RABBIT',
    BEAR: 'DOG',
    ELEPHANT: 'PIG_WALL',
    HIPPO: 'PENGUIN',
  },

  /** Hannah passive bonuses by level (beyond ability unlocks). */
  hannahPassives: {
    8: { towerRangeMult: 1.05, label: '+5% tower range' },
    10: { towerRangeMult: 1.1, waveBonusPoints: 5, label: '+10% range, +5 wave bonus' },
  },

  audio: {
    musicVolume: 0.6,
    sfxVolume: 0.8,
    sfxMix: {
      towerFires: 0.4,
      enemyHit: 0.3,
      enemyDies: 0.4,
      buttonClick: 1,
    },
  },

  /**
   * Daily challenge — weekday map rotation + small chest on first win of the day.
   * weekdayMaps[0]=Sunday … [6]=Saturday (local Date#getDay).
   */
  dailyChallenge: {
    zone: 2,
    battle: 1,
    weekdayMaps: [
      { zone: 0, battle: 2 },
      { zone: 1, battle: 1 },
      { zone: 2, battle: 1 },
      { zone: 2, battle: 3 },
      { zone: 3, battle: 1 },
      { zone: 3, battle: 2 },
      { zone: 4, battle: 0 },
    ],
    chestMetaSunshine: 40,
    chestXp: 25,
  },

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
    0xffe0c0, // harvest festival amber
    0xd8e8ff, // endless twilight
  ],

  colors: {
    primary: 0xFFD700,
    grass: 0x6EA843,
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
