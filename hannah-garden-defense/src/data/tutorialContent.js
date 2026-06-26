/** Shared tutorial copy for in-game guide and How To Play. */

export const TUTORIAL_BASICS = [
  {
    title: "Welcome!",
    text: "This is Hannah's garden! Stop naughty animals before they reach the gate.",
    target: 'gate',
  },
  {
    title: 'Pick a Defender',
    text: 'Drag an animal from the tray onto a grass tile to place it.',
    target: 'towerTray',
  },
  {
    title: 'Place It',
    text: 'Drop on green grass to place your defender. Pig Walls go on the path!',
    target: 'validTile',
  },
  {
    title: 'Send the Wave',
    text: 'When ready, tap SEND WAVE to start the critters marching.',
    target: 'waveButton',
  },
  {
    title: 'Sunshine Points',
    text: 'Defeating enemies earns Sunshine Points (☀). Spend them on more defenders!',
    target: null,
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
    text: 'Barks in an area — stuns enemies and slows them. Great against fast runners.',
    target: 'towerTray',
  },
  {
    title: 'Owl Sniper',
    text: 'Long-range sharpshooter. Targets the enemy closest to your gate for big damage.',
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
    text: 'Flies straight to the gate, ignoring paths and Pig Walls. Needs ranged damage.',
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
];

export const ABILITY_GUIDE = [
  {
    title: 'Sunshine Burst ☀',
    text: 'Damages all ground enemies on the path. Tap the gold button on the right.',
    target: 'abilities',
  },
  {
    title: 'Garden Rain 🌧',
    text: 'Fully heals every tower. Use when Bears or Elephants have chipped your line.',
    target: 'abilities',
  },
  {
    title: 'Rainbow Shield 🛡',
    text: 'Makes all towers invulnerable for a few seconds. Save for a rush.',
    target: 'abilities',
  },
  {
    title: 'Flower Bomb 💣',
    text: 'Huge blast on the path (Hannah Lv.6+). Tap when a cluster of enemies arrives.',
    target: 'abilities',
  },
];

/** Steps shown on first battle (basics + compact reference cards). */
export function getFirstBattleSteps() {
  return [
    ...TUTORIAL_BASICS,
    {
      title: 'Defenders',
      text: 'Rabbit/Duck slow • Chicken/Owl damage • Dog/Penguin control • Pig Wall blocks.',
      target: 'towerTray',
    },
    {
      title: 'Threats',
      text: 'Frog splits • Gorilla ignores slow • Parrot flies • Monkey steals • Bear smashes towers • Elephant stomps.',
      target: null,
    },
    {
      title: "Hannah's Powers",
      text: 'Use the round buttons on the right: Burst, Rain, Shield, and Flower Bomb (later).',
      target: 'abilities',
    },
  ];
}

/** Full reference for How To Play menu. */
export function getFullGuideSteps() {
  return [
    ...TUTORIAL_BASICS,
    ...TOWER_GUIDE,
    ...ENEMY_GUIDE,
    ...ABILITY_GUIDE,
  ];
}
