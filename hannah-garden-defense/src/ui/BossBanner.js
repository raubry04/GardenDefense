import { SceneMusicManager } from '../utils/SceneMusicManager.js';

const HUD_DEPTH = 200;

export class BossBanner {
  /** @param {import('../scenes/GameScene.js').GameScene} scene */
  constructor(scene) {
    this.scene = scene;
    this._active = null;
  }

  /** @param {string} bossType */
  show(bossType) {
    const scene = this.scene;
    if (this._active?.active) {
      this._active.destroy();
      this._active = null;
    }

    const cam = scene.cameras.main;
    const container = scene.add.container(cam.width / 2, -40)
      .setDepth(HUD_DEPTH)
      .setScrollFactor(0);

    const label = bossType.replace(/_/g, ' ');
    const bg = scene.add.rectangle(0, 0, cam.width * 0.92, 52, 0x1a0a0a, 0.92)
      .setStrokeStyle(3, 0xe63946);
    const title = scene.add.text(0, -8, 'BOSS INCOMING', {
      fontFamily: 'Kenney Pixel',
      fontSize: '22px',
      color: '#E63946',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    const sub = scene.add.text(0, 14, label.toUpperCase(), {
      fontFamily: 'Kenney Future',
      fontSize: '16px',
      color: '#FFD700',
    }).setOrigin(0.5);

    container.add([bg, title, sub]);
    this._active = container;

    SceneMusicManager.duck(scene, 0.3, 2000);

    scene.tweens.add({
      targets: container,
      y: 56,
      duration: 400,
      ease: 'Back.easeOut',
    });

    scene.time.delayedCall(1200, () => {
      if (!container.active) return;
      scene.tweens.add({
        targets: container,
        alpha: 0,
        y: 20,
        duration: 400,
        onComplete: () => {
          container.destroy();
          if (this._active === container) this._active = null;
          SceneMusicManager.restore(scene);
        },
      });
    });

    scene.cameras.main.shake(200, 0.003);
  }

  destroy() {
    if (this._active?.active) this._active.destroy();
    this._active = null;
  }
}
