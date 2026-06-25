import Phaser from 'phaser';

import { GameConfig } from './config.js';

import { BootScene } from './scenes/BootScene.js';

import { MainMenuScene } from './scenes/MainMenuScene.js';

import { WorldMapScene } from './scenes/WorldMapScene.js';

import { GameScene } from './scenes/GameScene.js';

import { UIScene } from './scenes/UIScene.js';

import { UpgradeScene } from './scenes/UpgradeScene.js';

import { VictoryScene } from './scenes/VictoryScene.js';

import { GameOverScene } from './scenes/GameOverScene.js';

import { LeaderboardScene } from './scenes/LeaderboardScene.js';

import { setupMobileViewport } from './utils/mobileViewport.js';



const config = {

  type: Phaser.AUTO,

  width: GameConfig.canvas.width,

  height: GameConfig.canvas.height,

  parent: 'game-container',

  backgroundColor: '#5A9A38',

  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.NO_CENTER,
    width: GameConfig.canvas.width,
    height: GameConfig.canvas.height,
    fullscreenTarget: 'game-container',
  },

  input: {

    activePointers: 3,

    touch: { capture: true },

  },

  physics: {

    default: 'arcade',

    arcade: { debug: false },

  },

  scene: [

    BootScene,

    MainMenuScene,

    WorldMapScene,

    GameScene,

    UIScene,

    UpgradeScene,

    VictoryScene,

    GameOverScene,

    LeaderboardScene,

  ],

};



const game = new Phaser.Game(config);

setupMobileViewport(game);

