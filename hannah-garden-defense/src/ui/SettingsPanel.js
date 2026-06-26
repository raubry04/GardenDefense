import { GameConfig } from '../config.js';
import { loadAudioSettings, saveAudioSettings, applyAudioSettings } from '../utils/audioSettings.js';

const COLORS = GameConfig.colors;

/**
 * @param {Phaser.Scene} scene
 * @param {{ onClose?: () => void }} [options]
 */
export function createSettingsPanel(scene, options = {}) {
  const { width, height } = scene.scale;
  const depth = 250;
  const objects = [];

  let settings = loadAudioSettings();

  const overlay = scene.add.rectangle(width / 2, height / 2, width * 2, height * 2, 0x000000, 0.75)
    .setInteractive()
    .setDepth(depth);
  objects.push(overlay);

  const panelW = Math.min(420, width - 48);
  const panelH = 300;
  const panel = scene.add.rectangle(width / 2, height / 2, panelW, panelH, COLORS.uiPanel)
    .setStrokeStyle(3, COLORS.outline)
    .setDepth(depth + 1);
  objects.push(panel);

  const title = scene.add.text(width / 2, height / 2 - panelH / 2 + 36, 'SETTINGS', {
    fontFamily: 'Kenney Pixel',
    fontSize: '28px',
    color: '#3D5A1F',
  }).setOrigin(0.5).setDepth(depth + 2);
  objects.push(title);

  const closeBtn = scene.add.text(width / 2 + panelW / 2 - 24, height / 2 - panelH / 2 + 20, '✕', {
    fontFamily: 'Kenney Future',
    fontSize: '22px',
    color: '#888888',
  }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(depth + 2);
  objects.push(closeBtn);

  const rowY = height / 2 - 30;
  const labelX = width / 2 - panelW / 2 + 36;
  const valueX = width / 2 + panelW / 2 - 36;

  const musicLabel = scene.add.text(labelX, rowY, 'Music', {
    fontFamily: 'Kenney Future', fontSize: '20px', color: '#4A2C0A',
  }).setOrigin(0, 0.5).setDepth(depth + 2);
  objects.push(musicLabel);

  const musicValue = scene.add.text(valueX, rowY, `${Math.round(settings.musicVolume * 100)}%`, {
    fontFamily: 'Kenney Future', fontSize: '18px', color: '#3D5A1F',
  }).setOrigin(1, 0.5).setDepth(depth + 2);
  objects.push(musicValue);

  const sfxLabel = scene.add.text(labelX, rowY + 70, 'Sound FX', {
    fontFamily: 'Kenney Future', fontSize: '20px', color: '#4A2C0A',
  }).setOrigin(0, 0.5).setDepth(depth + 2);
  objects.push(sfxLabel);

  const sfxValue = scene.add.text(valueX, rowY + 70, `${Math.round(settings.sfxVolume * 100)}%`, {
    fontFamily: 'Kenney Future', fontSize: '18px', color: '#3D5A1F',
  }).setOrigin(1, 0.5).setDepth(depth + 2);
  objects.push(sfxValue);

  const makeSliderRow = (y, key, valueText) => {
    const trackW = panelW - 72;
    const trackX = width / 2;
    const track = scene.add.rectangle(trackX, y + 28, trackW, 8, 0xCCCCCC)
      .setDepth(depth + 2);
    const fill = scene.add.rectangle(trackX - trackW / 2, y + 28, trackW * settings[key], 8, COLORS.button)
      .setOrigin(0, 0.5)
      .setDepth(depth + 2);
    objects.push(track, fill);

    const setVolume = (vol) => {
      settings[key] = vol;
      fill.setSize(trackW * vol, 8);
      valueText.setText(`${Math.round(vol * 100)}%`);
      saveAudioSettings(settings);
      applyAudioSettings(scene);
      if (key === 'sfxVolume') {
        scene.sound.play('buttonClick', { volume: settings.sfxVolume });
      }
    };

    const volumeFromPointer = (pointer) => {
      const localX = Phaser.Math.Clamp(pointer.x - (trackX - trackW / 2), 0, trackW);
      return localX / trackW;
    };

    track.setInteractive({ useHandCursor: true });
    track.on('pointerdown', (pointer) => setVolume(volumeFromPointer(pointer)));
    track.on('pointermove', (pointer) => {
      if (pointer.isDown) setVolume(volumeFromPointer(pointer));
    });

    const minusBtn = scene.add.rectangle(trackX - trackW / 2 - 28, y + 28, 36, 36, COLORS.button)
      .setStrokeStyle(2, COLORS.outline)
      .setInteractive({ useHandCursor: true })
      .setDepth(depth + 2);
    const minusLabel = scene.add.text(minusBtn.x, minusBtn.y, '−', {
      fontFamily: 'Kenney Future', fontSize: '24px', color: '#4A2C0A',
    }).setOrigin(0.5).setDepth(depth + 2);

    const plusBtn = scene.add.rectangle(trackX + trackW / 2 + 28, y + 28, 36, 36, COLORS.button)
      .setStrokeStyle(2, COLORS.outline)
      .setInteractive({ useHandCursor: true })
      .setDepth(depth + 2);
    const plusLabel = scene.add.text(plusBtn.x, plusBtn.y, '+', {
      fontFamily: 'Kenney Future', fontSize: '24px', color: '#4A2C0A',
    }).setOrigin(0.5).setDepth(depth + 2);

    minusBtn.on('pointerdown', () => setVolume(Math.max(0, settings[key] - 0.1)));
    plusBtn.on('pointerdown', () => setVolume(Math.min(1, settings[key] + 0.1)));

    objects.push(minusBtn, minusLabel, plusBtn, plusLabel);
  };

  makeSliderRow(rowY, 'musicVolume', musicValue);
  makeSliderRow(rowY + 70, 'sfxVolume', sfxValue);

  const destroyPanel = () => {
    objects.forEach((obj) => {
      if (obj?.active) obj.destroy();
    });
    options.onClose?.();
  };

  closeBtn.on('pointerdown', destroyPanel);
  overlay.on('pointerdown', destroyPanel);

  return { destroy: destroyPanel };
}
