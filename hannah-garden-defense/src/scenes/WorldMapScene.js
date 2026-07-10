import { GameConfig } from '../config.js';
import { setupResponsiveCamera, DESIGN, getSafeTop } from '../utils/responsiveCamera.js';
import { getSafeInsets } from '../utils/mobileViewport.js';
import { loadLocalProgress, loadProgress, loadPlayerName, availableMetaBank } from '../utils/hannahProgress.js';
import { SceneMusicManager } from '../utils/SceneMusicManager.js';
import { TEXT_ON_DARK, FONT_DISPLAY, FONT_HUD, TEXT_SOFT_SHADOW } from '../utils/textReadability.js';
import { decorateGardenBackdrop } from '../utils/gardenBackdrop.js';

const COLORS = GameConfig.colors;
const ZONES = GameConfig.zones;
/** Locked zone / mode labels — cream on dark bars (not mid-grey). */
const LOCKED_LABEL = TEXT_ON_DARK;

export class WorldMapScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WorldMapScene' });
  }

  init(data) {
    this.playerName = data.playerName || loadPlayerName() || '';
    this.progress = loadLocalProgress(this.playerName);
  }

  create() {
    const { width, height } = DESIGN;

    setupResponsiveCamera(this);
    this.cameras.main.fadeIn(300);
    SceneMusicManager.transition(this, 'menu');
    this.cameras.main.setBackgroundColor('#6EA843');

    this._drawBackground(width, height);
    this._rebuildProgressUi(width, height);

    // BACK is created after progress UI and re-asserted after rebuilds so zone
    // bars never paint over it (children added later sit on top by default).
    this._placeBackButton(width, height);

    loadProgress(this.playerName).then((synced) => {
      if (!this.scene.isActive('WorldMapScene')) return;
      this.progress = synced;
      this._rebuildProgressUi(width, height);
      this._placeBackButton(width, height);
    }).catch(() => { /* local fallback already loaded */ });
  }

  _placeBackButton(width, height) {
    this._backButtonObjs?.forEach((o) => o.destroy());
    this._backButtonObjs = null;

    const insets = getSafeInsets();
    const backW = 120;
    const zoneLeft = width / 2 - (width * 0.75) / 2;
    const minX = backW / 2 + Math.max(24, insets.left);
    const maxX = zoneLeft - backW / 2 - 16;
    // Prefer clearing the zone list; fall back to a safe left inset if space is tight.
    const backX = maxX >= minX ? Math.min(maxX, minX + (maxX - minX) * 0.35) : minX;
    const backY = height - 44 - Math.max(16, insets.bottom);
    this._backButtonObjs = this._createButton(backX, backY, 'BACK', () => {
      this.sound.play('buttonClick', { volume: GameConfig.audio.sfxVolume });
      this.scene.start('MainMenuScene');
    }, { depth: 50, width: backW, height: 44 });
  }

  _markProgressUi(fromIndex) {
    const list = this.children.list;
    for (let i = fromIndex; i < list.length; i++) {
      list[i].setData?.('progressUi', true);
    }
  }

  _clearProgressUi() {
    [...this.children.list].forEach((c) => {
      if (c.getData?.('progressUi')) c.destroy();
    });
    if (this._chickTween) {
      this._chickTween.stop();
      this._chickTween = null;
    }
    this._chickSprite = null;
  }

  _rebuildProgressUi(width, height) {
    this._clearProgressUi();
    this._drawHeader(width, this.progress);
    this._drawZones(width, height, this.progress);
    this._drawMapMascot(width, height);
  }

  _drawBackground(width, height) {
    // Intentional Craftpix garden frame — no fillCircle speckles.
    decorateGardenBackdrop(this, { width, height, variant: 'map' });
  }

  _drawHeader(width, progress) {
    const startIdx = this.children.list.length;
    // Tight top margin — header sits just under the safe inset (not dropped).
    const headerH = 72;
    const headerTop = getSafeTop() + 6;
    const headerY = headerTop + headerH / 2;
    const uiDepth = 20;

    this.add.rectangle(width / 2, headerY, width - 32, headerH, 0x1a2e14, 0.96)
      .setStrokeStyle(3, 0x4C9A2A)
      .setDepth(uiDepth);

    this.add.circle(52, headerY, 22, COLORS.primary)
      .setStrokeStyle(2, COLORS.outline)
      .setDepth(uiDepth + 1);
    this.add.text(52, headerY, '👧', { fontSize: '20px' })
      .setOrigin(0.5)
      .setDepth(uiDepth + 2);

    // Single-line name + level — no wordWrap (it was clipping mid-name under décor).
    const nameMaxW = Math.max(120, width - 300);
    const rawName = `${this.playerName || ''}`;
    const nameText = this.add.text(84, headerY - 14, rawName, {
      fontFamily: FONT_DISPLAY,
      fontSize: '26px',
      color: '#FFF9E6',
      shadow: { ...TEXT_SOFT_SHADOW, color: '#000' },
    }).setOrigin(0, 0.5).setDepth(uiDepth + 2);
    if (nameText.width > nameMaxW) {
      let truncated = rawName;
      while (truncated.length > 1 && nameText.width > nameMaxW) {
        truncated = truncated.slice(0, -1);
        nameText.setText(`${truncated}…`);
      }
    }

    this.add.text(84, headerY + 16, `Lv.${progress.hannahLevel} · Garden ${progress.gardenLevel}`, {
      fontFamily: FONT_DISPLAY,
      fontSize: '18px',
      color: '#A8DADC',
      shadow: { ...TEXT_SOFT_SHADOW, color: '#000' },
    }).setOrigin(0, 0.5).setDepth(uiDepth + 2);

    this.add.circle(width - 130, headerY, 12, COLORS.stars)
      .setStrokeStyle(2, COLORS.outline)
      .setDepth(uiDepth + 1);
    this.add.text(width - 110, headerY, `${availableMetaBank(progress)}`, {
      fontFamily: FONT_HUD,
      fontSize: '26px',
      color: '#FFD700',
      shadow: { ...TEXT_SOFT_SHADOW, color: '#000' },
    }).setOrigin(0, 0.5).setName('sunshineText').setDepth(uiDepth + 2);
    this._headerBottom = headerTop + headerH;
    this._markProgressUi(startIdx);
  }

  _refreshHeaderSunshine(points) {
    const text = this.children.getByName('sunshineText');
    if (text) text.setText(`${points}`);
  }

  _drawZones(width, height, progress) {
    const startIdx = this.children.list.length;
    // Slightly tighter bars so pulling the list up still clears BACK / bottom inset.
    const zoneHeight = 78;
    const zoneGap = 8;
    // Pull Zone 1 up under the header — ~16px gap, not a huge empty band.
    const headerBottom = this._headerBottom ?? (getSafeTop() + 6 + 72);
    const startY = headerBottom + 16 + zoneHeight / 2;
    const zoneWidth = width * 0.75;
    const uiDepth = 20;
    const zoneColors = [0x7EC850, 0x8BC34A, 0x66BB6A, 0xAB47BC, 0xFF7043];
    const zoneEmojis = ['🌻', '🥕', '🐔', '🫐', '🍎'];
    this._zonePositions = [];

    const pathGfx = this.add.graphics().setDepth(uiDepth);
    for (let i = 0; i < ZONES.length; i++) {
      const py = startY + i * (zoneHeight + zoneGap);
      this._zonePositions.push({ x: width / 2, y: py });
      if (i > 0) {
        const prevY = startY + (i - 1) * (zoneHeight + zoneGap);
        const isUnlocked = i <= progress.unlockedZone;
        pathGfx.lineStyle(3, isUnlocked ? 0xFFD700 : 0x555555, isUnlocked ? 0.7 : 0.3);
        pathGfx.beginPath();
        pathGfx.moveTo(width / 2, prevY + zoneHeight / 2 + 3);
        pathGfx.lineTo(width / 2, py - zoneHeight / 2 - 3);
        pathGfx.strokePath();
        if (isUnlocked) {
          pathGfx.fillStyle(0xFFD700, 0.8);
          pathGfx.fillCircle(width / 2, (prevY + zoneHeight / 2 + py - zoneHeight / 2) / 2, 4);
        }
      }
    }

    for (let i = 0; i < ZONES.length; i++) {
      const y = startY + i * (zoneHeight + zoneGap);
      const unlocked = i <= progress.unlockedZone;
      const isCurrent = unlocked && i === progress.unlockedZone;
      // The current (newest-unlocked) zone gets a deeper, more saturated green so
      // its bar clearly reads as a themed GREEN level bar against the grassy
      // background — plus a bright highlight border to mark it as "current".
      // Locked bars: warm brown (not near-black) so cream labels stay readable.
      const color = unlocked ? (isCurrent ? 0x4C9A2A : zoneColors[i]) : 0x5A4A3A;

      const shadow = this.add.rectangle(width / 2 + 3, y + 3, zoneWidth, zoneHeight, 0x000000, 0.3)
        .setDepth(uiDepth);

      let zoneBg;
      if (this.textures.exists('ui_buttonRect')) {
        zoneBg = this.add.image(width / 2, y, 'ui_buttonRect')
          .setDisplaySize(zoneWidth, zoneHeight)
          .setTint(color)
          .setDepth(uiDepth + 1)
          .setInteractive({ useHandCursor: unlocked });
      } else {
        zoneBg = this.add.rectangle(width / 2, y, zoneWidth, zoneHeight, color)
          .setStrokeStyle(3, unlocked ? COLORS.outline : 0x444444)
          .setDepth(uiDepth + 1)
          .setInteractive({ useHandCursor: unlocked });
      }

      if (isCurrent) {
        this.add.rectangle(width / 2, y, zoneWidth + 8, zoneHeight + 8, 0xffffff, 0)
          .setStrokeStyle(4, 0xfff3b0)
          .setDepth(uiDepth + 1);
      }

      if (unlocked) {
        this.add.text(width / 2 - zoneWidth / 2 + 50, y - 20, `${zoneEmojis[i]} Zone ${i + 1}`, {
          fontFamily: FONT_DISPLAY,
          fontSize: '24px',
          color: '#FFF9E6',
        }).setOrigin(0, 0.5).setShadow(0, 2, '#1c3a0e', 3).setDepth(uiDepth + 2);

        this.add.text(width / 2 - zoneWidth / 2 + 50, y + 2, ZONES[i].name, {
          fontFamily: FONT_DISPLAY,
          fontSize: '19px',
          color: '#FFF9E6',
          alpha: 1,
        }).setOrigin(0, 0.5).setShadow(0, 1, '#1c3a0e', 3).setDepth(uiDepth + 2);

        const stars = progress.zoneStars[i] || 0;
        const maxStars = ZONES[i].battles * 3;
        // One icon + plain digits only — never ★ in the string AND a sprite
        // (Kenney Future's ★ glyph + icon_star stacked mid-"0/15").
        // Chick mascot lives outside the bar, so stars can use the full right edge.
        const starRight = width / 2 + zoneWidth / 2 - 24;
        const countText = this.add.text(starRight, y - 4, `${stars}/${maxStars}`, {
          fontFamily: FONT_DISPLAY,
          fontSize: '22px',
          color: '#FFE135',
        }).setOrigin(1, 0.5).setShadow(0, 2, '#1c3a0e', 3).setDepth(uiDepth + 2);

        if (this.textures.exists('icon_star')) {
          const iconGap = 12;
          this.add.image(starRight - countText.width - iconGap, y - 4, 'icon_star')
            .setOrigin(1, 0.5)
            .setDisplaySize(18, 18)
            .setTint(0xffe135)
            .setDepth(uiDepth + 2);
        } else {
          countText.setText(`★ ${stars}/${maxStars}`);
        }

        if (stars < maxStars) {
          const remaining = maxStars - stars;
          this.add.text(width / 2 - zoneWidth / 2 + 50, y + 24,
            `${remaining} star${remaining === 1 ? '' : 's'} to perfect this zone`,
            {
              fontFamily: FONT_DISPLAY,
              fontSize: '18px',
              color: '#FFE135',
              alpha: 1,
            }).setOrigin(0, 0.5).setShadow(0, 1, '#1c3a0e', 3).setDepth(uiDepth + 2);
        } else {
          const badge = GameConfig.zoneMasteryBadges?.[i];
          if (badge) {
            this.add.text(width / 2 - zoneWidth / 2 + 50, y + 24, `🏅 ${badge}`, {
              fontFamily: FONT_DISPLAY,
              fontSize: '14px',
              color: '#FFD700',
            }).setOrigin(0, 0.5).setShadow(0, 1, '#1c3a0e', 2).setDepth(uiDepth + 2);
          }
        }

        // zoneBg is an image scaled via setDisplaySize (scale != 1), so hover
        // tweens must be relative to that base scale. Using absolute 1.03/1
        // would collapse the button to its native texture size (a small blank
        // green box) after the first hover/tap and never restore it.
        const zoneBaseSX = zoneBg.scaleX;
        const zoneBaseSY = zoneBg.scaleY;
        zoneBg.on('pointerover', () => {
          this.tweens.add({ targets: zoneBg, scaleX: zoneBaseSX * 1.03, scaleY: zoneBaseSY * 1.03, duration: 80 });
          this.tweens.add({ targets: shadow, scaleX: 1.03, scaleY: 1.03, duration: 80 });
        });
        zoneBg.on('pointerout', () => {
          this.tweens.add({ targets: zoneBg, scaleX: zoneBaseSX, scaleY: zoneBaseSY, duration: 80 });
          this.tweens.add({ targets: shadow, scaleX: 1, scaleY: 1, duration: 80 });
        });
        zoneBg.on('pointerdown', () => {
          this.sound.play('buttonClick', { volume: GameConfig.audio.sfxVolume });
          this.tweens.add({
            targets: zoneBg, scaleX: zoneBaseSX * 0.96, scaleY: zoneBaseSY * 0.96, duration: 60, yoyo: true,
            onComplete: () => {
              this._showBattlePanel(i, this.progress, width, height);
            }
          });
        });
      } else {
        this.add.text(width / 2 - zoneWidth / 2 + 50, y, `Zone ${i + 1}: ${ZONES[i].name}`, {
          fontFamily: FONT_DISPLAY,
          fontSize: '20px',
          color: LOCKED_LABEL,
        }).setOrigin(0, 0.5).setShadow(0, 1, '#000000', 3).setDepth(uiDepth + 2);

        // Kenney fonts lack the chain emoji — it rendered as a white "88"/tofu
        // next to the lock. One lock emoji is enough.
        this.add.text(width / 2 + zoneWidth / 2 - 24, y, '🔒', {
          fontSize: '28px',
        }).setOrigin(1, 0.5).setDepth(uiDepth + 2);
      }
    }

    const endlessY = startY + ZONES.length * (zoneHeight + zoneGap);
    const endlessUnlocked = progress.unlockedZone >= ZONES.length - 1;

    this.add.rectangle(width / 2 + 3, endlessY + 3, zoneWidth, zoneHeight, 0x000000, 0.3)
      .setDepth(uiDepth);
    const endlessBg = this._themedBar(width / 2, endlessY, zoneWidth, zoneHeight,
      endlessUnlocked ? 0x6A1B9A : 0x5A4A3A, endlessUnlocked, uiDepth + 1);

    this.add.text(width / 2, endlessY, endlessUnlocked ? '♾️ Endless Frontier' : '♾️ Endless Frontier 🔒', {
      fontFamily: FONT_DISPLAY,
      fontSize: '26px',
      color: endlessUnlocked ? '#FFD700' : LOCKED_LABEL,
    }).setOrigin(0.5).setShadow(0, 1, '#000000', 3).setDepth(uiDepth + 2);

    if (endlessUnlocked) {
      endlessBg.on('pointerdown', () => {
        this.sound.play('buttonClick', { volume: GameConfig.audio.sfxVolume });
        this.scene.start('GameScene', { zone: 5, battle: 0, playerName: this.playerName });
      });
    }

    const dailyY = endlessY + zoneHeight + zoneGap;
    this.add.rectangle(width / 2 + 3, dailyY + 3, zoneWidth, zoneHeight - 8, 0x000000, 0.3)
      .setDepth(uiDepth);
    const dailyBg = this._themedBar(width / 2, dailyY, zoneWidth, zoneHeight - 8,
      endlessUnlocked ? 0x1565C0 : 0x5A4A3A, endlessUnlocked, uiDepth + 1);

    this.add.text(width / 2, dailyY, endlessUnlocked ? '📅 Daily Challenge' : '📅 Daily Challenge 🔒', {
      fontFamily: FONT_DISPLAY,
      fontSize: '26px',
      color: endlessUnlocked ? '#FFF9E6' : LOCKED_LABEL,
    }).setOrigin(0.5).setShadow(0, 1, '#000000', 3).setDepth(uiDepth + 2);

    if (endlessUnlocked) {
      dailyBg.on('pointerdown', () => {
        this.sound.play('buttonClick', { volume: GameConfig.audio.sfxVolume });
        this.scene.start('GameScene', { mode: 'daily', playerName: this.playerName });
      });
    }
    this._markProgressUi(startIdx);
  }

  /**
   * Themed horizontal bar matching the zone buttons: a tinted `ui_buttonRect`
   * image when the texture is available, otherwise a plain rectangle fallback.
   * Keeps Endless/Daily consistent with the zone list instead of flat grey.
   */
  _themedBar(x, y, w, h, color, unlocked, depth = 20) {
    if (this.textures.exists('ui_buttonRect')) {
      return this.add.image(x, y, 'ui_buttonRect')
        .setDisplaySize(w, h)
        .setTint(color)
        .setDepth(depth)
        .setInteractive({ useHandCursor: unlocked });
    }
    return this.add.rectangle(x, y, w, h, color)
      .setStrokeStyle(3, unlocked ? COLORS.outline : 0x444444)
      .setDepth(depth)
      .setInteractive({ useHandCursor: unlocked });
  }

  /**
   * Chick mascot sits outside zone bars (bottom-right margin), never next to
   * the star count — that read as a random face crowding "9/15".
   */
  _drawMapMascot(width, height) {
    const startIdx = this.children.list.length;
    if (!this.textures.exists('chick')) return;

    const insets = getSafeInsets();
    // Clear of BACK (bottom-left) and the centered zone list (~75% width).
    const mascotX = width - 52 - Math.max(8, insets.right);
    const mascotY = height - 70 - Math.max(8, insets.bottom);

    this._chickSprite = this.add.image(mascotX, mascotY, 'chick')
      .setDisplaySize(52, 52)
      .setDepth(6);

    this._chickTween = this.tweens.add({
      targets: this._chickSprite,
      y: mascotY - 5,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this._markProgressUi(startIdx);
  }

  _showBattlePanel(zoneIndex, progress, width, height) {
    if (this._battlePanel) {
      this._battlePanel.forEach(o => o.destroy());
      this._battlePanel = null;
    }

    const objects = [];
    const zone = ZONES[zoneIndex];
    const panelW = 460;
    const panelH = 240;

    const overlay = this.add.rectangle(width / 2, height / 2, width * 2, height * 2, 0x000000, 0.6)
      .setInteractive().setDepth(300);
    objects.push(overlay);

    const panel = this.add.rectangle(width / 2, height / 2, panelW, panelH, COLORS.uiPanel)
      .setStrokeStyle(3, COLORS.outline).setDepth(301);
    objects.push(panel);

    const title = this.add.text(width / 2, height / 2 - panelH / 2 + 30, zone.name, {
      fontFamily: FONT_DISPLAY, fontSize: '26px', color: '#3D5A1F',
    }).setOrigin(0.5).setDepth(302);
    objects.push(title);

    const btnSpacing = 76;
    const btnStartX = width / 2 - ((zone.battles - 1) * btnSpacing) / 2;
    const btnY = height / 2 + 5;

    for (let b = 0; b < zone.battles; b++) {
      const bx = btnStartX + b * btnSpacing;
      const completedBattles = progress.zoneBattles[zoneIndex] || 0;
      const unlocked = b <= completedBattles;
      const stars = progress.battleStars?.[zoneIndex]?.[b] || 0;
      const isBoss = b === zone.battles - 1;

      const btnBg = this.add.rectangle(bx, btnY, 64, 74, unlocked ? COLORS.button : 0x4A4A4A)
        .setStrokeStyle(2, unlocked ? (isBoss ? 0xE63946 : COLORS.outline) : 0x888888)
        .setInteractive({ useHandCursor: unlocked }).setDepth(302);
      objects.push(btnBg);

      const label = isBoss && unlocked ? '👑' : `${b + 1}`;
      const btnLabel = this.add.text(bx, btnY - 12, label, {
        fontFamily: FONT_DISPLAY, fontSize: isBoss ? '20px' : '22px',
        color: unlocked ? '#4A2C0A' : '#F0F0F0',
      }).setOrigin(0.5).setDepth(303);
      objects.push(btnLabel);

      const starStr = unlocked
        ? '★'.repeat(stars) + '☆'.repeat(Math.max(0, 3 - stars))
        : '☆☆☆';
      const starText = this.add.text(bx, btnY + 20, starStr, {
        fontFamily: FONT_DISPLAY, fontSize: '12px',
        color: stars > 0 ? '#FFE135' : (unlocked ? '#666666' : '#C8C8C8'),
      }).setOrigin(0.5).setDepth(303);
      objects.push(starText);

      if (unlocked && stars > 0 && stars < 3) {
        const chaseRing = this.add.circle(bx, btnY, 38, 0xFFE135, 0)
          .setStrokeStyle(2, 0xFFE135, 0.9).setDepth(301);
        objects.push(chaseRing);
        this.tweens.add({
          targets: chaseRing,
          scaleX: 1.15,
          scaleY: 1.15,
          alpha: { from: 0.9, to: 0.3 },
          duration: 800,
          yoyo: true,
          repeat: -1,
        });
        const chaseLabel = this.add.text(bx, btnY - 38, 'Chase ★', {
          fontFamily: FONT_DISPLAY,
          fontSize: '9px',
          color: '#FFE135',
        }).setOrigin(0.5).setDepth(303);
        objects.push(chaseLabel);
      }

      if (unlocked) {
        btnBg.on('pointerover', () => {
          this.tweens.add({ targets: [btnBg, btnLabel, starText], scaleX: 1.12, scaleY: 1.12, duration: 60 });
        });
        btnBg.on('pointerout', () => {
          this.tweens.add({ targets: [btnBg, btnLabel, starText], scaleX: 1, scaleY: 1, duration: 60 });
        });
        btnBg.on('pointerdown', () => {
          this.sound.play('buttonClick', { volume: GameConfig.audio.sfxVolume });
          this._battlePanel.forEach(o => o.destroy());
          this._battlePanel = null;
          this.scene.start('GameScene', {
            zone: zoneIndex, battle: b, playerName: this.playerName,
          });
        });
      }
    }

    const closeBg = this.add.rectangle(width / 2, height / 2 + panelH / 2 - 32, 120, 36, 0xE63946)
      .setStrokeStyle(2, COLORS.outline).setInteractive({ useHandCursor: true }).setDepth(302);
    const closeText = this.add.text(width / 2, height / 2 + panelH / 2 - 32, 'CLOSE', {
      fontFamily: FONT_DISPLAY, fontSize: '16px', color: '#FFFFFF',
    }).setOrigin(0.5).setDepth(303);
    objects.push(closeBg, closeText);

    closeBg.on('pointerdown', () => {
      this.sound.play('buttonClick', { volume: GameConfig.audio.sfxVolume });
      this._battlePanel.forEach(o => o.destroy());
      this._battlePanel = null;
    });

    overlay.on('pointerdown', () => {
      this._battlePanel.forEach(o => o.destroy());
      this._battlePanel = null;
    });

    this._battlePanel = objects;
  }

  _createButton(x, y, label, callback, opts = {}) {
    const depth = opts.depth ?? 0;
    const bw = opts.width ?? 140;
    const bh = opts.height ?? 50;
    const shadow = this.add.rectangle(x + 2, y + 2, bw, bh, 0x000000, 0.3).setDepth(depth);
    const bg = this.add.rectangle(x, y, bw, bh, COLORS.button)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, COLORS.outline)
      .setDepth(depth + 1);

    const text = this.add.text(x, y, label, {
      fontFamily: FONT_DISPLAY,
      fontSize: '22px',
      color: '#4A2C0A',
    }).setOrigin(0.5).setDepth(depth + 2);

    bg.on('pointerover', () => {
      this.tweens.add({ targets: [bg, text, shadow], scaleX: 1.08, scaleY: 1.08, duration: 60 });
    });
    bg.on('pointerout', () => {
      this.tweens.add({ targets: [bg, text, shadow], scaleX: 1, scaleY: 1, duration: 60 });
    });
    bg.on('pointerdown', () => {
      this.tweens.add({
        targets: [bg, text], scaleX: 0.94, scaleY: 0.94, duration: 50, yoyo: true,
        onComplete: callback,
      });
    });
    return [shadow, bg, text];
  }
}
