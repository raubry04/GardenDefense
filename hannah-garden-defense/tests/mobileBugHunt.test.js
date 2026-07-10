import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

describe('mobile/iOS bug-hunt regressions', () => {
  it('BossBanner defines HUD_DEPTH (no ReferenceError on boss waves)', () => {
    const src = read('src/ui/BossBanner.js');
    expect(src).toMatch(/const\s+HUD_DEPTH\s*=/);
    expect(src).toContain('setDepth(HUD_DEPTH)');
  });

  it('GameScene guards battle-complete against double victory + late leaks', () => {
    const src = read('src/scenes/GameScene.js');
    // Guard flag initialised and used to gate the victory transition + update loop.
    expect(src).toContain('_battleEnded');
    expect(src).toMatch(/battle-complete'[\s\S]{0,80}if \(this\._battleEnded\) return;/);
    // Delayed VictoryScene start is guarded against a torn-down scene.
    expect(src).toMatch(/if \(!this\.sys\?\.isActive\?\.\(\)\) return;/);
  });

  it('GameScene removes scene-local event listeners on shutdown', () => {
    const src = read('src/scenes/GameScene.js');
    expect(src).toContain("this.events.off('enemy-spawn')");
    expect(src).toContain("this.events.off('battle-complete')");
  });

  it('EnemyBehavior ignores gate leaks once the battle is decided', () => {
    const src = read('src/battle/EnemyBehavior.js');
    expect(src).toMatch(/if \(s\._defeatHandled \|\| s\._battleEnded\)/);
  });

  it('TowerTray aborts tower drag on pointercancel (iOS gesture interrupt)', () => {
    const src = read('src/ui/TowerTray.js');
    expect(src).toContain('pointercancel');
    expect(src).toContain('_onTowerDragCancel');
  });

  it('AbilityBar guards against touch double-fire', () => {
    const src = read('src/ui/AbilityBar.js');
    expect(src).toMatch(/if \(btn\.pending\) return;/);
  });

  it('player-name storage helpers are guarded and reused by scenes', () => {
    const progress = read('src/utils/hannahProgress.js');
    expect(progress).toContain('export function loadPlayerName');
    expect(progress).toContain('export function savePlayerName');
    for (const scene of [
      'src/scenes/MainMenuScene.js',
      'src/scenes/WorldMapScene.js',
      'src/scenes/GameOverScene.js',
      'src/scenes/LeaderboardScene.js',
    ]) {
      const src = read(scene);
      expect(src).not.toContain("localStorage.getItem('hannahGarden_playerName')");
      expect(src).not.toContain("localStorage.setItem('hannahGarden_playerName'");
    }
  });

  it('main.js re-resumes audio on foreground (iOS backgrounding)', () => {
    const src = read('src/main.js');
    expect(src).toContain('visibilitychange');
    expect(src).toContain('SceneMusicManager.resumeAudioContext');
  });

  it('VictoryScene trophy pop-in restores display-size base scale (not absolute 1)', () => {
    const src = read('src/scenes/VictoryScene.js');
    expect(src).toContain('trophyBaseSX');
    expect(src).toMatch(/scaleX:\s*trophyBaseSX/);
    expect(src).not.toMatch(/setDisplaySize\(56,\s*56\)[\s\S]{0,120}scaleX:\s*1,\s*scaleY:\s*1/);
  });

  it('BattleHud heart pulse/reset uses display-size base scale', () => {
    const src = read('src/ui/BattleHud.js');
    expect(src).toContain("setData('baseScaleX'");
    expect(src).toContain('HEART_DISPLAY');
    expect(src).toMatch(/heart\.setScale\(bx,\s*by\)/);
    expect(src).not.toMatch(/heart\.setScale\(1\)/);
  });

  it('AbilityBar disables send-wave input while hidden (mid-wave)', () => {
    const src = read('src/ui/AbilityBar.js');
    expect(src).toMatch(/setSendWaveVisible\(visible\)[\s\S]*?disableInteractive\(\)/);
    expect(src).toMatch(/setInteractive\(\{\s*useHandCursor:\s*true\s*\}\)/);
  });

  it('TowerPlacement tears down pointer listeners on GameScene shutdown', () => {
    const placement = read('src/battle/TowerPlacement.js');
    const game = read('src/scenes/GameScene.js');
    expect(placement).toContain('teardownInput()');
    expect(placement).toContain("s.input.off('pointermove'");
    expect(placement).toContain("s.input.off('pointerdown'");
    expect(game).toContain('this.towerPlacement?.teardownInput()');
  });

  it('WorldMap zone bars are tall enough for the text-size pass', () => {
    const src = read('src/scenes/WorldMapScene.js');
    expect(src).toMatch(/const zoneHeight = 7[8-9]|const zoneHeight = [8-9]\d/);
  });

  it('TowerTray never scale-tweens the cost-chip star (setDisplaySize images)', () => {
    const src = read('src/ui/TowerTray.js');
    expect(src).toMatch(/hoverTargets = \[cardBg, nameText, costText, costBadge, greyOverlay\]/);
    expect(src).toContain('coinIcon.setScale(1)');
    expect(src).not.toMatch(/hoverTargets = \[[^\]]*coinIcon/);
  });

  it('UIScene re-asserts bringToTop so WAVE HUD stays above world props', () => {
    const ui = read('src/scenes/UIScene.js');
    const game = read('src/scenes/GameScene.js');
    const hud = read('src/ui/BattleHud.js');
    expect(ui).toContain('bringToTop');
    expect(ui).toContain('_bringUiAboveWorld');
    expect(game).toContain("bringToTop('UIScene')");
    // Opaque panel is what actually stops trees showing through WAVE glyphs.
    expect(hud).toContain('HUD_PANEL_ALPHA');
    expect(hud).toMatch(/wavePanel[\s\S]*?HUD_PANEL_ALPHA/);
    expect(hud).not.toMatch(/rectangle\(wavePanelX,\s*row2Y,\s*240,\s*44,\s*0x000000,\s*0\.45\)/);
  });

  it('AbilityBar places name labels left of circles and fits bonus pill', () => {
    const src = read('src/ui/AbilityBar.js');
    expect(src).toContain('ABILITY_SHORT_NAMES');
    expect(src).toContain('_fitSendWaveBonusBg');
    expect(src).toContain('TEXT_PILL_BG');
    expect(src).toMatch(/setOrigin\(1,\s*0\.5\)/);
    expect(src).toMatch(/\.toUpperCase\(\)/);
    expect(src).toMatch(/SUNSHINE_BURST:\s*'SUN'/);
  });

  it('WorldMap keeps BACK clear of zone bars and chick clear of stars', () => {
    const src = read('src/scenes/WorldMapScene.js');
    expect(src).not.toContain('_drawDecorativeAnimals');
    expect(src).toContain('getSafeInsets');
    expect(src).toContain('_placeBackButton');
    expect(src).not.toMatch(/add\.text\([^)]*['"]⛓/);
    // Chick is a corner mascot outside the zone bar — not beside star digits.
    expect(src).toContain('_drawMapMascot');
    expect(src).not.toContain('_drawChickCompanion');
    expect(src).not.toMatch(/zoneWidth \/ 2 - 22/);
    expect(src).toMatch(/starRight/);
    expect(src).toMatch(/zoneWidth \/ 2 - 24/);
    // Zone 1 sits just under the header (~16px gap), not a large fixed drop.
    expect(src).toContain('headerBottom + 16');
    expect(src).not.toMatch(/getSafeTop\(\)\s*\+\s*168/);
  });

  it('WorldMap zone star count is one icon + digits (no ★+sprite double)', () => {
    const src = read('src/scenes/WorldMapScene.js');
    // Primary path: plain digits; sprite only when icon_star exists.
    expect(src).toMatch(/`\$\{stars\}\/\$\{maxStars\}`/);
    expect(src).toContain("textures.exists('icon_star')");
    expect(src).toMatch(/add\.image\([\s\S]*?'icon_star'/);
    // Must not create text with ★ AND always add the sprite (old double-star bug).
    expect(src).not.toMatch(
      /add\.text\([\s\S]*?`★ \$\{stars\}\/\$\{maxStars\}`[\s\S]*?add\.image\([\s\S]*?icon_star/,
    );
    expect(src).toContain('LOCKED_LABEL');
    expect(src).toMatch(/color:\s*LOCKED_LABEL/);
  });

  it('menu/map scenes do not scatter random fillCircle speckles', () => {
    for (const rel of [
      'src/scenes/WorldMapScene.js',
      'src/scenes/UpgradeScene.js',
      'src/scenes/VictoryScene.js',
      'src/scenes/GameOverScene.js',
      'src/scenes/LeaderboardScene.js',
    ]) {
      const src = read(rel);
      expect(src).not.toMatch(/fillCircle\(x,\s*y,\s*Phaser\.Math\.Between/);
    }
  });

  it('Tutorial Skip uses dark text on a light outlined button', () => {
    const src = read('src/systems/TutorialManager.js');
    expect(src).toContain("color: '#4A2C0A'");
    expect(src).toMatch(/skipBg[\s\S]*?0xFFF9E6/);
    expect(src).toMatch(/setStrokeStyle\(2,\s*COLORS\.button\)/);
    expect(src).not.toMatch(/color:\s*'#666666'[\s\S]{0,40}Skip|Skip[\s\S]{0,80}color:\s*'#666666'/);
  });

  it('main.js preloads Kenney fonts before Phaser starts', () => {
    const src = read('src/main.js');
    expect(src).toContain('preloadKenneyFonts');
    expect(src).toContain('document.fonts.load');
    expect(src).toMatch(/await preloadKenneyFonts\(\)/);
  });

  it('Upgrade cost buttons avoid emoji tofu before the number', () => {
    const src = read('src/scenes/UpgradeScene.js');
    expect(src).toMatch(/const cardHeight = 1[2-4]\d/);
    expect(src).not.toMatch(/`⬆ \$\{upgCost\}☀`/);
    expect(src).toMatch(/ui_uiStar/);
    expect(src).toMatch(/fontSize:\s*'15px'/);
    expect(src).toMatch(/color:\s*'#1B5E20'/);
  });

  it('Upgrade animal icons use cream plates (not grey backing circles)', () => {
    const src = read('src/scenes/UpgradeScene.js');
    expect(src).toMatch(/0xFFF9E6/);
    expect(src).toMatch(/0xB8D080/);
    expect(src).not.toMatch(/add\.circle\(iconX,\s*iconY,\s*24,\s*0xE8F0E0/);
    expect(src).not.toMatch(/add\.circle\(iconX,\s*iconY,\s*20,\s*0x888888/);
  });

  it('shared textReadability tokens back HUD panels and pills', () => {
    const tokens = read('src/utils/textReadability.js');
    expect(tokens).toContain('HUD_PANEL_ALPHA');
    expect(tokens).toContain('TEXT_PILL_BG');
    expect(tokens).toContain('MIN_WORLD_TEXT_PANEL_ALPHA');
    expect(tokens).toContain('FONT_DISPLAY');
    expect(tokens).toContain('titleTextStyle');
    expect(tokens).toContain('buttonTextStyle');
  });

  it('SettingsPanel is a roomy kids-game card in DESIGN space', () => {
    const src = read('src/ui/SettingsPanel.js');
    expect(src).toContain("from '../utils/responsiveCamera.js'");
    expect(src).toMatch(/const\s*\{\s*width,\s*height\s*\}\s*=\s*DESIGN/);
    expect(src).not.toMatch(/=\s*scene\.scale/);
    expect(src).toContain('titleTextStyle');
    // Touch targets ≥44px; labels sit above ± controls (no overlap).
    expect(src).toMatch(/btnSize = 44/);
    expect(src).toContain('controlsY');
    expect(src).toContain('Settings');
  });

  it('BattleHud lives count sits on an opaque panel (not shadow-only)', () => {
    const src = read('src/ui/BattleHud.js');
    expect(src).toContain('livesPanel');
    expect(src).toContain('resizeLivesPanelToContent');
    expect(src).toMatch(/livesPanel[\s\S]*?HUD_PANEL_ALPHA/);
  });

  it('SceneMusicManager gates resume until a user gesture', () => {
    const src = read('src/utils/SceneMusicManager.js');
    expect(src).toContain('audioUnlocked');
    expect(src).toMatch(/force:\s*true/);
    expect(src).toMatch(/if \(!audioUnlocked && !opts\.force\) return/);
  });

  it('AbilityBar / layout keep portrait ability circles inset for name pills', () => {
    const bar = read('src/ui/AbilityBar.js');
    const layout = read('src/utils/battleLayout.js');
    expect(bar).toMatch(/width - 72/);
    expect(layout).toMatch(/pad\.right\) \+ 72/);
  });
});
