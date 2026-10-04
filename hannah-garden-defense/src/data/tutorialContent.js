/** Shared tutorial copy for in-game guide and How To Play. */

export const TUTORIAL_BASICS = [
  {
    title: "Welcome!",
    text: "This is Hannah's garden! Stop naughty animals before they reach the gate.",
    target: 'gate',
    imageKey: 'chick',
  },
  {
    title: 'Pick a Defender',
    text: 'Drag or tap an animal from the tray at the bottom.',
    target: 'towerTray',
    requireAction: 'select-tower',
    imageKey: 'rabbit',
  },
  {
    title: 'Place It',
    text: 'Drop or tap green grass to place your defender. Pig Walls go on the path!',
    target: 'validTile',
    requireAction: 'place-tower',
    imageKey: 'rabbit',
  },
  {
    title: 'Send the Wave',
    text: 'When ready, tap SEND WAVE to start the critters marching.',
    target: 'waveButton',
    requireAction: 'send-wave',
  },
  {
    title: 'Sunshine Points',
    text: 'Defeating enemies earns Sunshine. Spend it on more defenders!',
    target: null,
    imageKey: 'ui_sunshine',
  },
];

export const TOWER_GUIDE = [
  {
    title: 'Rabbit Guard',
    text: 'Slows every enemy in range. Place near the path start to buy time.',
    target: 'towerTray',
  },
  {
    title: 'Chicken Cannon',
    text: 'Throws eggs for steady damage. Cannot hit flying Parrots; eggs bounce off armored Elephants.',
    target: 'towerTray',
  },
  {
    title: 'Dog Patrol',
    text: 'Barks in an area — stuns enemies briefly. Great against fast runners and Gorillas (who ignore slows).',
    target: 'towerTray',
  },
  {
    title: 'Owl Sniper',
    text: 'Long-range sharpshooter — the flyer counter! Shoots Parrots and the enemy closest to your gate.',
    target: 'towerTray',
  },
  {
    title: 'Duck Sprinkler',
    text: 'Sprays water to slow nearby enemies continuously. Stronger slow than Rabbit.',
    target: 'towerTray',
  },
  {
    title: 'Penguin Freezer',
    text: 'Periodic freeze pulse stops enemies in range. Use before a tough wave.',
    target: 'towerTray',
  },
  {
    title: 'Pig Wall',
    text: 'Blocks the path — enemies must break it. Upgrades add thorns that hurt attackers.',
    target: 'towerTray',
  },
];

export const ENEMY_GUIDE = [
  {
    title: 'Snake',
    text: 'Basic pest — moderate speed and health. Any tower works.',
    target: null,
  },
  {
    title: 'Frog',
    text: 'Splits into smaller Snakes when defeated. Be ready for extras!',
    target: null,
  },
  {
    title: 'Gorilla',
    text: 'Very fast and immune to slowing. Use stuns or raw damage.',
    target: null,
  },
  {
    title: 'Parrot',
    text: 'Flies straight to the gate, ignoring paths and Pig Walls. Only Owls can shoot them!',
    target: null,
  },
  {
    title: 'Monkey',
    text: 'May steal Sunshine Points when hit. Take them out quickly!',
    target: null,
  },
  {
    title: 'Bear',
    text: 'Leaves the path to smash your towers. Protect key defenders.',
    target: null,
  },
  {
    title: 'Elephant',
    text: 'Boss! Armored vs eggs, stomps to slow towers. Owls and abilities help most.',
    target: null,
  },
  {
    title: 'Cow',
    text: 'Slow tank with lots of health. Chip away with steady damage.',
    target: null,
  },
  {
    title: 'Horse',
    text: 'Very fast runner — use slows, stuns, or Owls before it reaches the gate.',
    target: null,
  },
  {
    title: 'Buffalo',
    text: 'Mini-boss that shrugs off stuns and smashes Pig Walls extra hard.',
    target: null,
  },
  {
    title: 'Rhino',
    text: 'Armored tank that shrugs off stuns and smashes Pig Walls. Owls and Dogs help most.',
    target: null,
  },
  {
    title: 'Hippo',
    text: 'Huge health sponge — keep slows on the path and pile on steady damage.',
    target: null,
  },
  {
    title: 'Crocodile',
    text: 'Lurks slowly, then sprints near the gate. Place slows and stuns before the finish.',
    target: null,
  },
  {
    title: 'Zebra',
    text: 'Fast runners that often arrive in pairs — AoE slows and multi-target damage help.',
    target: null,
  },
];

export const ABILITY_GUIDE = [
  {
    title: 'Sunshine Burst ☀',
    text: 'Damages all ground enemies on the path. Tap the gold button on the right.',
    target: 'abilities',
  },
  {
    title: 'Garden Rain 🌧',
    text: 'Fully repairs every tower. Use after Bears smash defenders or when walls are low.',
    target: 'abilities',
  },
  {
    title: 'Rainbow Shield 🛡',
    text: 'Makes all towers invulnerable for a few seconds. Save for a rush.',
    target: 'abilities',
  },
  {
    title: 'Seed Storm 🌱',
    text: 'Slows every pest on the path (Hannah Level 4). Pick it in the Album Power tab.',
    target: 'abilities',
  },
  {
    title: 'Flower Bomb 💣',
    text: 'Huge blast on the path (Hannah Lv.6+). Tap when a cluster of enemies arrives.',
    target: 'abilities',
  },
];

/** Steps shown on first battle — short interactive path (~6 beats). */
export function getFirstBattleSteps() {
  return [
    ...TUTORIAL_BASICS,
    {
      title: "Hannah's Powers",
      text: 'Tap the round buttons on the right when things get tough!',
      target: 'abilities',
      imageKey: 'chick',
    },
  ];
}

/**
 * Kid-sized menu How To Play (~7 illustrated slides).
 * Full tower/enemy lists live in the Album / guides, not here.
 */
export function getQuickStartSteps() {
  return [
    {
      title: "Welcome!",
      text: "Protect Hannah's garden gate. Critters walk the dirt path — stop them!",
      imageKey: 'chick',
    },
    {
      title: 'Place Defenders',
      text: 'Drag or tap animals from the bottom tray onto green grass.',
      imageKey: 'rabbit',
    },
    {
      title: 'Send Waves',
      text: 'Tap SEND WAVE when ready. Early starts earn bonus Sunshine!',
      imageKey: 'ui_sunshine',
    },
    {
      title: 'Owls vs Parrots',
      text: 'Parrots fly over walls. Only Owls can shoot them!',
      imageKey: 'owl',
    },
    {
      title: 'Hearts & Stars',
      text: 'Keep hearts to earn more stars. Finish fast for 3 stars!',
      imageKey: 'heartIcon',
    },
    {
      title: 'Bears Smash Towers',
      text: 'Bears leave the path and hurt your defenders. Use Rain to repair!',
      imageKey: 'bear',
    },
    {
      title: "Hannah Helps",
      text: 'Use the round buttons on the right for Burst, Rain, and Shield.',
      imageKey: 'chick',
    },
  ];
}

/** Full reference (Album / docs) — not shown as the main menu slideshow. */
export function getFullGuideSteps() {
  return [
    ...TUTORIAL_BASICS,
    ...TOWER_GUIDE,
    ...ENEMY_GUIDE,
    ...ABILITY_GUIDE,
  ];
}
