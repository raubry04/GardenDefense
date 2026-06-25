/**

 * Central registry of game asset paths under /game-assets/.
 * Only includes files referenced by the running game.
 */

const A = '/game-assets';



export const AssetRegistry = {

  animals: {

    rabbit: `${A}/animals/rabbit.png`,

    chicken: `${A}/animals/chicken.png`,

    dog: `${A}/animals/dog.png`,

    owl: `${A}/animals/owl.png`,

    duck: `${A}/animals/duck.png`,

    penguin: `${A}/animals/penguin.png`,

    pig: `${A}/animals/pig.png`,

    snake: `${A}/animals/snake.png`,

    frog: `${A}/animals/frog.png`,

    gorilla: `${A}/animals/gorilla.png`,

    parrot: `${A}/animals/parrot.png`,

    monkey: `${A}/animals/monkey.png`,

    bear: `${A}/animals/bear.png`,

    elephant: `${A}/animals/elephant.png`,

    cow: `${A}/animals/cow.png`,

    chick: `${A}/animals/chick.png`,

    horse: `${A}/animals/horse.png`,

    buffalo: `${A}/animals/buffalo.png`,

  },



  particles: {

    sparkle: `${A}/kenney/particles/sparkle.png`,

    smoke: `${A}/kenney/particles/smoke.png`,

  },



  icons: {

    star: `${A}/kenney/icons/star.png`,

    medal1: `${A}/kenney/icons/medal1.png`,

    medal2: `${A}/kenney/icons/medal2.png`,

    trophy: `${A}/kenney/icons/trophy.png`,

    door: `${A}/kenney/icons/door.png`,

  },



  ui: {

    buttonRect: `${A}/kenney/ui/buttonRect.png`,

    uiStar: `${A}/kenney/ui/uiStar.png`,

  },



  audio: {

    sfx: {

      towerPlaced: `${A}/audio/sfx/towerPlaced.ogg`,

      towerFires: `${A}/audio/sfx/towerFires.ogg`,

      enemyHit: `${A}/audio/sfx/enemyHit.ogg`,

      enemyDies: `${A}/audio/sfx/enemyDies.ogg`,

      pointsEarned: `${A}/audio/sfx/pointsEarned.ogg`,

      buttonClick: `${A}/audio/sfx/buttonClick.ogg`,

      invalidAction: `${A}/audio/sfx/invalidAction.ogg`,

      abilityUsed: `${A}/audio/sfx/abilityUsed.ogg`,

      levelUp: `${A}/audio/sfx/levelUp.ogg`,

    },

    music: {

      menu: `${A}/audio/music/menu.ogg`,

      victory: `${A}/audio/music/victory.ogg`,

      gameOver: `${A}/audio/music/gameOver.ogg`,

    },

  },



  fonts: {

    pixel: `${A}/fonts/Kenney Pixel.ttf`,

    future: `${A}/fonts/Kenney Future.ttf`,

  },

};



export const TOWER_SPRITES = {

  RABBIT: 'rabbit',

  CHICKEN: 'chicken',

  DOG: 'dog',

  OWL: 'owl',

  DUCK: 'duck',

  PENGUIN: 'penguin',

  PIG_WALL: 'pig',

};



export const TOWER_SPRITE_FILES = {

  RABBIT: 'rabbit.png',

  CHICKEN: 'chicken.png',

  DOG: 'dog.png',

  OWL: 'owl.png',

  DUCK: 'duck.png',

  PENGUIN: 'penguin.png',

  PIG_WALL: 'pig.png',

};



export const ENEMY_SPRITES = {

  SNAKE: 'snake',

  FROG: 'frog',

  GORILLA: 'gorilla',

  PARROT: 'parrot',

  MONKEY: 'monkey',

  BEAR: 'bear',

  ELEPHANT: 'elephant',

};



export const ENEMY_SPRITE_FILES = {

  SNAKE: 'snake.png',

  FROG: 'frog.png',

  GORILLA: 'gorilla.png',

  PARROT: 'parrot.png',

  MONKEY: 'monkey.png',

  BEAR: 'bear.png',

  ELEPHANT: 'elephant.png',

};


