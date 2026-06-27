/**
 * Proposed hybrid-assets catalog for the review page.
 * Preview paths point at copied files under assets/ (served as /game-assets/).
 */
export const ASSET_REVIEW_CATALOG = [
  // Craftpix village TD
  {
    id: 'village-placeTower1',
    category: 'Craftpix Village',
    label: 'Tower placement marker (default)',
    preview: '/game-assets/craftpix/village/placeTower1.png',
    purpose: 'Ghost tile overlay while placing towers',
  },
  {
    id: 'village-placeTower2',
    category: 'Craftpix Village',
    label: 'Tower placement marker (valid)',
    preview: '/game-assets/craftpix/village/placeTower2.png',
    purpose: 'Green/valid placement ghost overlay',
  },
  {
    id: 'village-stone1',
    category: 'Craftpix Village',
    label: 'Path edge stone 1',
    preview: '/game-assets/craftpix/village/stone1.png',
    purpose: 'Decorative stones along path borders',
  },
  {
    id: 'village-stone2',
    category: 'Craftpix Village',
    label: 'Path edge stone 2',
    preview: '/game-assets/craftpix/village/stone2.png',
    purpose: 'Decorative stones along path borders',
  },
  {
    id: 'village-decor1',
    category: 'Craftpix Village',
    label: 'Map decor 1',
    preview: '/game-assets/craftpix/village/decor1.png',
    purpose: 'Scattered village props on grass tiles',
  },
  {
    id: 'village-decor3',
    category: 'Craftpix Village',
    label: 'Map decor 3',
    preview: '/game-assets/craftpix/village/decor3.png',
    purpose: 'Scattered village props on grass tiles',
  },
  {
    id: 'village-grassTuft1',
    category: 'Craftpix Village',
    label: 'Grass tuft',
    preview: '/game-assets/craftpix/village/grassTuft1.png',
    purpose: 'Small grass detail near paths',
  },
  {
    id: 'village-tent1',
    category: 'Craftpix Village',
    label: 'Tent',
    preview: '/game-assets/craftpix/village/tent1.png',
    purpose: 'Camp/tent map decoration',
  },
  {
    id: 'village-villageHouse',
    category: 'Craftpix Village',
    label: 'Village house (gate)',
    preview: '/game-assets/craftpix/village/villageHouse.png',
    purpose: 'Alternate garden gate / house at path end',
  },

  // Kenney TD tiles
  {
    id: 'td-pathEdge1',
    category: 'Kenney Tower Defense',
    label: 'Path edge tile 1',
    preview: '/game-assets/kenney/td/pathEdge1.png',
    purpose: '64×64 path border decal',
  },
  {
    id: 'td-pathEdge2',
    category: 'Kenney Tower Defense',
    label: 'Path edge tile 2',
    preview: '/game-assets/kenney/td/pathEdge2.png',
    purpose: '64×64 path border decal',
  },
  {
    id: 'td-fence',
    category: 'Kenney Tower Defense',
    label: 'Fence segment',
    preview: '/game-assets/kenney/td/fence.png',
    purpose: 'Occasional fence accent on path edges',
  },

  // Particles / VFX
  {
    id: 'particle-explosion',
    category: 'Combat VFX',
    label: 'Death explosion frame',
    preview: '/game-assets/kenney/particles/explosion.png',
    purpose: 'Enemy death pop (Explosion Pack)',
  },
  {
    id: 'particle-smokePuff',
    category: 'Combat VFX',
    label: 'Smoke puff',
    preview: '/game-assets/kenney/particles/smokePuff.png',
    purpose: 'Softer death poof',
  },
  {
    id: 'particle-light',
    category: 'Combat VFX',
    label: 'Light spark',
    preview: '/game-assets/kenney/particles/light.png',
    purpose: 'Alternate hit burst texture',
  },

  // Icons
  {
    id: 'icon-target',
    category: 'HUD Icons',
    label: 'Target (flying threat)',
    preview: '/game-assets/kenney/icons/target.png',
    purpose: 'Wave preview badge for flying enemies',
  },
  {
    id: 'icon-warning',
    category: 'HUD Icons',
    label: 'Warning (fast threat)',
    preview: '/game-assets/kenney/icons/warning.png',
    purpose: 'Wave preview badge for fast enemies',
  },
  {
    id: 'icon-exclamation',
    category: 'HUD Icons',
    label: 'Exclamation (wall breaker)',
    preview: '/game-assets/kenney/icons/exclamation.png',
    purpose: 'Wave preview badge for wall breakers',
  },
  {
    id: 'icon-gear',
    category: 'HUD Icons',
    label: 'Gear (armored)',
    preview: '/game-assets/kenney/icons/gear.png',
    purpose: 'Wave preview badge for armored enemies',
  },
  {
    id: 'icon-pause',
    category: 'HUD Icons',
    label: 'Pause',
    preview: '/game-assets/kenney/icons/pause.png',
    purpose: 'Pause menu / HUD',
  },

  // UI
  {
    id: 'ui-adventureBanner',
    category: 'UI Panels',
    label: 'Adventure hanging banner',
    preview: '/game-assets/kenney/ui/adventureBanner.png',
    purpose: 'Victory and Upgrade screen header frame',
  },

  // SFX
  {
    id: 'sfx-towerPlaced',
    category: 'Sound Effects',
    label: 'Tower placed (Foley setDown)',
    preview: '/game-assets/audio/sfx/towerPlaced-proposed.ogg',
    type: 'audio',
    purpose: 'Replace Interface Sounds placement click',
  },
  {
    id: 'sfx-towerFires',
    category: 'Sound Effects',
    label: 'Tower fires (Digital pepSound)',
    preview: '/game-assets/audio/sfx/towerFires-proposed.ogg',
    type: 'audio',
    purpose: 'Replace pluck fire sound',
  },
  {
    id: 'sfx-enemyHit',
    category: 'Sound Effects',
    label: 'Enemy hit (RPG metalClick)',
    preview: '/game-assets/audio/sfx/enemyHit-proposed.ogg',
    type: 'audio',
    purpose: 'Sharper hit feedback',
  },
  {
    id: 'sfx-enemyDies',
    category: 'Sound Effects',
    label: 'Enemy dies (Sci-Fi explosionCrunch)',
    preview: '/game-assets/audio/sfx/enemyDies-proposed.ogg',
    type: 'audio',
    purpose: 'Death burst sound',
  },

  // Music
  {
    id: 'music-battle',
    category: 'Music',
    label: 'Battle loop (Farm Frolics)',
    preview: '/game-assets/audio/music/battle.ogg',
    type: 'audio',
    purpose: 'Dedicated battle music instead of reusing menu track',
  },

  // New enemies
  {
    id: 'animal-rhino',
    category: 'New Enemies',
    label: 'Rhino',
    preview: '/game-assets/animals/rhino.png',
    purpose: 'Late-zone armored enemy',
  },
  {
    id: 'animal-hippo',
    category: 'New Enemies',
    label: 'Hippo',
    preview: '/game-assets/animals/hippo.png',
    purpose: 'Late-zone bulky enemy',
  },
  {
    id: 'animal-crocodile',
    category: 'New Enemies',
    label: 'Crocodile',
    preview: '/game-assets/animals/crocodile.png',
    purpose: 'Mid/late-zone creep enemy',
  },
  {
    id: 'animal-zebra',
    category: 'New Enemies',
    label: 'Zebra',
    preview: '/game-assets/animals/zebra.png',
    purpose: 'Fast late-zone enemy',
  },
];

export const REVIEW_STORAGE_KEY = 'hannah-garden-asset-review-v1';
