import { AssetRegistry } from '../utils/AssetRegistry.js';

import {

  CRAFTPIX_USED_GROUND_TILES,

  CRAFTPIX_PROPS,

  craftpixGroundPath,

  craftpixGroundKey,

  craftpixPropPath,

} from '../utils/craftpixTiles.js';



export class BootScene extends Phaser.Scene {

  constructor() {

    super({ key: 'BootScene' });

  }



  preload() {

    const { width, height } = this.cameras.main;

    const barWidth = width * 0.6;

    const barHeight = 32;

    const barX = (width - barWidth) / 2;

    const barY = (height - barHeight) / 2;



    const bgBar = this.add.rectangle(width / 2, height / 2, barWidth + 4, barHeight + 4, 0x222222);

    bgBar.setOrigin(0.5);

    const fillBar = this.add.rectangle(barX, barY, 0, barHeight, 0xFFD700);

    fillBar.setOrigin(0, 0);



    const loadingText = this.add.text(width / 2, barY - 40, 'Loading...', {

      fontFamily: 'Kenney Pixel',

      fontSize: '28px',

      color: '#FFD700',

    });

    loadingText.setOrigin(0.5);



    this.load.on('progress', (value) => {
      fillBar.width = barWidth * value;
    });

    this.load.on('loaderror', (file) => {
      loadingText.setText('Failed to load assets');
      loadingText.setColor('#E63946');
      const msg = this.add.text(width / 2, barY + 48, `${file.key}\nRefresh the page to retry.`, {
        fontFamily: 'Kenney Pixel',
        fontSize: '16px',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: barWidth },
      });
      msg.setOrigin(0.5);
      this.load.reset();
    });



    const safeImage = (key, path) => {

      if (typeof path === 'string' && path.length) this.load.image(key, path);

      else console.warn(`Skipped image with invalid path: ${key}`);

    };

    const safeAudio = (key, path) => {

      if (typeof path === 'string' && path.length) this.load.audio(key, path);

      else console.warn(`Skipped audio with invalid path: ${key}`);

    };



    for (const [key, path] of Object.entries(AssetRegistry.animals || {})) {

      safeImage(key, path);

    }



    for (const n of CRAFTPIX_USED_GROUND_TILES) {

      safeImage(craftpixGroundKey(n), craftpixGroundPath(n));

    }



    for (const [key, filename] of Object.entries(CRAFTPIX_PROPS || {})) {

      safeImage(`cp_${key}`, craftpixPropPath(filename));

    }



    for (const [key, path] of Object.entries(AssetRegistry.particles || {})) {

      safeImage(`particle_${key}`, path);

    }



    for (const [key, path] of Object.entries(AssetRegistry.icons || {})) {

      safeImage(`icon_${key}`, path);

    }



    for (const [key, path] of Object.entries(AssetRegistry.ui || {})) {

      safeImage(`ui_${key}`, path);

    }



    for (const [key, path] of Object.entries(AssetRegistry.audio?.sfx || {})) {

      safeAudio(key, path);

    }



    for (const [key, path] of Object.entries(AssetRegistry.audio?.music || {})) {

      safeAudio(key, path);

    }

  }



  create() {

    this._generateHeartTexture();

    this.cameras.main.fadeOut(400, 0, 0, 0);

    this.cameras.main.once('camerafadeoutcomplete', () => {

      this.scene.start('MainMenuScene');

    });

  }



  _generateHeartTexture() {

    const gfx = this.make.graphics({ x: 0, y: 0, add: false });

    const s = 32;

    gfx.fillStyle(0xE63946);

    gfx.fillCircle(s * 0.3, s * 0.3, s * 0.25);

    gfx.fillCircle(s * 0.7, s * 0.3, s * 0.25);

    gfx.fillTriangle(s * 0.05, s * 0.4, s * 0.95, s * 0.4, s * 0.5, s * 0.9);

    gfx.generateTexture('heartIcon', s, s);

    gfx.destroy();

  }

}


