import { GameConfig } from '../config.js';
import { DESIGN } from '../utils/responsiveCamera.js';
import { loadAudioSettings, saveAudioSettings, applyAudioSettings } from '../utils/audioSettings.js';
import {
  FONT_DISPLAY,
  TEXT_GARDEN,
  TEXT_ON_LIGHT,
  TEXT_SOFT_SHADOW,
  titleTextStyle,
  bodyTextStyle,
} from '../utils/textReadability.js';

const COLORS = GameConfig.colors;

/**
 * Kid-friendly settings card — cream panel, green frame, roomy slider rows.
 * Always layout in design space (1280×720). scene.scale is the *screen*
 * size under Phaser.Scale.RESIZE — using it places the panel off-camera on phones.
 *
 * @param {Phaser.Scene} scene
 * @param {{ onClose?: () => void, depth?: number }} [options]
 */
export function createSettingsPanel(scene, options = {}) {
  const { width, height } = DESIGN;
  const depth = options.depth ?? 250;
  const objects = [];

  let settings = loadAudioSettings();

  const overlay = scene.add.rectangle(width / 2, height / 2, width * 2, height * 2, 0x1a2e14, 0.55)
    .setInteractive()
    .setDepth(depth);
  objects.push(overlay);

  // Compact card — less empty band under title / above footer.
  const panelW = Math.min(480, width - 64);
  const panelH = Math.min(300, height - 120);
  const cx = width / 2;
  const cy = height / 2;

  // Soft outer shadow
  const shadow = scene.add.rectangle(cx + 4, cy + 6, panelW, panelH, 0x2A4010, 0.35)
    .setDepth(depth + 1);
  objects.push(shadow);

  // Outer green frame (garden border)
  const frame = scene.add.rectangle(cx, cy, panelW + 16, panelH + 16, 0x4C9A2A)
    .setStrokeStyle(4, 0x2A4010)
    .setDepth(depth + 1);
  objects.push(frame);

  // Inner cream card
  const panel = scene.add.rectangle(cx, cy, panelW, panelH, COLORS.uiPanel)
    .setStrokeStyle(3, 0xB8D080)
    .setDepth(depth + 2);
  objects.push(panel);

  // Top accent strip
  const accent = scene.add.rectangle(cx, cy - panelH / 2 + 8, panelW - 12, 10, 0xFFD700, 0.55)
    .setDepth(depth + 3);
  objects.push(accent);

  const title = scene.add.text(cx, cy - panelH / 2 + 36, 'Settings', {
    ...titleTextStyle('32px', TEXT_GARDEN),
  }).setOrigin(0.5).setDepth(depth + 4);
  objects.push(title);

  // Big tappable close chip (top-right)
  const closeX = cx + panelW / 2 - 36;
  const closeY = cy - panelH / 2 + 34;
  const closeBg = scene.add.rectangle(closeX, closeY, 48, 48, 0xE63946)
    .setStrokeStyle(3, 0x2A4010)
    .setInteractive({ useHandCursor: true })
    .setDepth(depth + 4);
  const closeLabel = scene.add.text(closeX, closeY, 'X', {
    fontFamily: FONT_DISPLAY,
    fontSize: '26px',
    color: '#FFF9E6',
    shadow: { ...TEXT_SOFT_SHADOW, color: '#000000' },
  }).setOrigin(0.5).setDepth(depth + 5);
  objects.push(closeBg, closeLabel);

  // Row: label left, % right on one line; ± + track on the line below (≥44px targets).
  const rowGap = 96;
  const firstRowY = cy - 58;

  const makeSliderRow = (y, label, key) => {
    const labelX = cx - panelW / 2 + 28;
    const valueX = cx + panelW / 2 - 28;
    const labelY = y;
    const controlsY = y + 40;

    const rowLabel = scene.add.text(labelX, labelY, label, {
      ...bodyTextStyle('22px', TEXT_ON_LIGHT),
    }).setOrigin(0, 0.5).setDepth(depth + 4);

    const valueText = scene.add.text(valueX, labelY, `${Math.round(settings[key] * 100)}%`, {
      fontFamily: FONT_DISPLAY,
      fontSize: '20px',
      color: TEXT_GARDEN,
    }).setOrigin(1, 0.5).setDepth(depth + 4);

    objects.push(rowLabel, valueText);

    const btnSize = 44;
    const trackH = 16;
    const sidePad = 28 + btnSize + 14;
    const trackW = panelW - sidePad * 2;
    const trackX = cx;
    const trackY = controlsY;

    const track = scene.add.rectangle(trackX, trackY, trackW, trackH, 0xDDE8C8)
      .setStrokeStyle(2, 0xB8D080)
      .setDepth(depth + 4);
    const fill = scene.add.rectangle(trackX - trackW / 2, trackY, Math.max(4, trackW * settings[key]), trackH - 4, COLORS.button)
      .setOrigin(0, 0.5)
      .setDepth(depth + 5);
    const knob = scene.add.circle(
      trackX - trackW / 2 + trackW * settings[key],
      trackY,
      13,
      0xFFD700,
    ).setStrokeStyle(3, COLORS.outline).setDepth(depth + 6);
    objects.push(track, fill, knob);

    const setVolume = (vol) => {
      const v = Phaser.Math.Clamp(vol, 0, 1);
      settings[key] = v;
      fill.setSize(Math.max(4, trackW * v), trackH - 4);
      knob.setPosition(trackX - trackW / 2 + trackW * v, trackY);
      valueText.setText(`${Math.round(v * 100)}%`);
      saveAudioSettings(settings);
      applyAudioSettings(scene);
      if (key === 'sfxVolume') {
        scene.sound.play('buttonClick', { volume: settings.sfxVolume });
      }
    };

    const volumeFromPointer = (pointer) => {
      const localX = Phaser.Math.Clamp(pointer.worldX - (trackX - trackW / 2), 0, trackW);
      return localX / trackW;
    };

    track.setInteractive({ useHandCursor: true });
    track.on('pointerdown', (pointer) => setVolume(volumeFromPointer(pointer)));
    track.on('pointermove', (pointer) => {
      if (pointer.isDown) setVolume(volumeFromPointer(pointer));
    });
    knob.setInteractive({ useHandCursor: true });
    knob.on('pointerdown', (pointer) => setVolume(volumeFromPointer(pointer)));
    knob.on('pointermove', (pointer) => {
      if (pointer.isDown) setVolume(volumeFromPointer(pointer));
    });

    const minusBtn = scene.add.rectangle(trackX - trackW / 2 - 34, trackY, btnSize, btnSize, COLORS.button)
      .setStrokeStyle(3, COLORS.outline)
      .setInteractive({ useHandCursor: true })
      .setDepth(depth + 4);
    const minusLabel = scene.add.text(minusBtn.x, minusBtn.y, '−', {
      fontFamily: FONT_DISPLAY, fontSize: '30px', color: TEXT_ON_LIGHT,
    }).setOrigin(0.5).setDepth(depth + 5);

    const plusBtn = scene.add.rectangle(trackX + trackW / 2 + 34, trackY, btnSize, btnSize, COLORS.button)
      .setStrokeStyle(3, COLORS.outline)
      .setInteractive({ useHandCursor: true })
      .setDepth(depth + 4);
    const plusLabel = scene.add.text(plusBtn.x, plusBtn.y, '+', {
      fontFamily: FONT_DISPLAY, fontSize: '30px', color: TEXT_ON_LIGHT,
    }).setOrigin(0.5).setDepth(depth + 5);

    minusBtn.on('pointerdown', () => setVolume(settings[key] - 0.1));
    plusBtn.on('pointerdown', () => setVolume(settings[key] + 0.1));

    objects.push(minusBtn, minusLabel, plusBtn, plusLabel);
  };

  makeSliderRow(firstRowY, 'Music', 'musicVolume');
  makeSliderRow(firstRowY + rowGap, 'Sound FX', 'sfxVolume');

  const hint = scene.add.text(cx, cy + panelH / 2 - 22, 'Tap outside or X to close', {
    fontFamily: FONT_DISPLAY,
    fontSize: '15px',
    color: '#7A8F5A',
  }).setOrigin(0.5).setDepth(depth + 4);
  objects.push(hint);

  const destroyPanel = () => {
    objects.forEach((obj) => {
      if (obj?.active) obj.destroy();
    });
    options.onClose?.();
  };

  closeBg.on('pointerdown', destroyPanel);
  closeLabel.setInteractive({ useHandCursor: true });
  closeLabel.on('pointerdown', destroyPanel);
  overlay.on('pointerdown', destroyPanel);

  return { destroy: destroyPanel };
}
