import Phaser from 'phaser';
import { GameConfig } from './config.js';
import { BootScene } from './scenes/BootScene.js';
import { MainMenuScene } from './scenes/MainMenuScene.js';
import { WorldMapScene } from './scenes/WorldMapScene.js';
import { GameScene } from './scenes/GameScene.js';
import { UIScene } from './scenes/UIScene.js';
import { UpgradeScene } from './scenes/UpgradeScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';
import { setupMobileViewport } from './utils/mobileViewport.js';
import { SceneMusicManager } from './utils/SceneMusicManager.js';

async function preloadKenneyFonts() {
  // Wait for CSS @font-face so Phaser text doesn't measure with a fallback
  // (Chrome "Slow network… Fallback font" intervention → wrong metrics / jump).
  if (!document.fonts?.load) return;
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load('28px "Kenney Pixel"'),
        document.fonts.load('22px "Kenney Future"'),
      ]),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch { /* proceed with fallback if fonts fail */ }
}

async function startGame() {
  await preloadKenneyFonts();
  const [{ VictoryScene }, { LeaderboardScene }] = await Promise.all([
    import('./scenes/VictoryScene.js'),
    import('./scenes/LeaderboardScene.js'),
  ]);

  const config = {
    type: Phaser.AUTO,
    width: GameConfig.canvas.width,
    height: GameConfig.canvas.height,
    parent: 'game-container',
    backgroundColor: '#6EA843',
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

  // iOS Safari suspends the WebAudio context when the app is backgrounded and does
  // not reliably resume it on return. Re-unlock/resume on foreground so battle audio
  // doesn't stay silent after switching apps or locking the screen.
  const resumeAudio = () => {
    // SceneMusicManager no-ops until a user gesture unlocked audio, so this
    // won't spam Chrome's autoplay warning on cold load / tab focus.
    try {
      const scene = game.scene?.getScenes?.(true)?.[0];
      if (scene) SceneMusicManager.resumeAudioContext(scene);
    } catch { /* ignore */ }
  };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') resumeAudio();
  });
  window.addEventListener('pageshow', resumeAudio);
}

startGame();
