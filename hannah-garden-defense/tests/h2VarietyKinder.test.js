import { describe, it, expect } from 'vitest';
import { GameConfig } from '../src/config.js';
import { resolveBattleModifiers, battleModifierLabel } from '../src/utils/battleModifiers.js';
import {
  calculateStars,
  starTimeBudgetMs,
  meetsStarTimeBonus,
  projectedStarsFromLives,
  starMeterHint,
} from '../src/utils/starRating.js';
import {
  dailyChallengeMap,
  dailyChallengeParams,
  dailyChallengeSeed,
  dailyChestReward,
  hasClaimedDailyChest,
} from '../src/utils/dailyChallenge.js';
import { computeDefeatConsolation } from '../src/utils/defeatConsolation.js';
import { WaveManager } from '../src/systems/WaveManager.js';
import { buildCanvasMapData } from '../src/utils/pathTile2D.js';

function mockScene() {
  return {
    events: { handlers: {}, on() {}, emit() {} },
    sunshinePoints: 200,
    battleSunshineEarned: 0,
    game: { events: { emit() {} } },
  };
}

describe('H2 battle modifiers', () => {
  it('maps battle index to expected modifier ids', () => {
    expect(resolveBattleModifiers(0, 0).ids).toEqual([]);
    expect(resolveBattleModifiers(0, 1).mirrorPath).toBe(true);
    expect(resolveBattleModifiers(0, 2).nightTint).toBe(true);
    expect(resolveBattleModifiers(0, 3).wind).toBe(true);
    expect(resolveBattleModifiers(0, 4).reversePath).toBe(true);
  });

  it('skips flyersHeavy when zone has no flyers', () => {
    const mods = resolveBattleModifiers(0, 2);
    expect(mods.flyersHeavy).toBe(false);
    expect(mods.ids).not.toContain('flyersHeavy');
  });

  it('keeps flyersHeavy when zone has Parrots', () => {
    const mods = resolveBattleModifiers(1, 2);
    expect(mods.flyersHeavy).toBe(true);
    expect(battleModifierLabel(mods)).toMatch(/Night|Sky/i);
  });

  it('mirror and reverse change path endpoints', () => {
    const cols = 20;
    const rows = 12;
    const base = buildCanvasMapData(0, cols, rows, 64, { centerLayout: true });
    const mirrored = buildCanvasMapData(0, cols, rows, 64, { centerLayout: true, mirrorPath: true });
    const reversed = buildCanvasMapData(0, cols, rows, 64, { centerLayout: true, reversePath: true });

    expect(mirrored.waypoints[0].x).not.toBe(base.waypoints[0].x);
    expect(reversed.waypoints[0].x).toBe(base.waypoints[base.waypoints.length - 1].x);
    expect(reversed.waypoints[0].y).toBe(base.waypoints[base.waypoints.length - 1].y);
  });
});

describe('H2 named bosses', () => {
  it('config defines a named boss per campaign zone', () => {
    for (let z = 0; z < GameConfig.zones.length; z++) {
      const boss = GameConfig.zoneBosses[z];
      expect(boss?.name, `zone ${z} boss name`).toBeTruthy();
      expect(boss?.telegraph).toBeTruthy();
      expect(boss?.type).toBeTruthy();
      expect(boss?.uniqueRule).toBeTruthy();
    }
  });

  it('zone 0 boss is King Croak (not a plain pool tail with no spectacle)', () => {
    const boss = GameConfig.zoneBosses[0];
    expect(boss.name).toBe('King Croak');
    expect(boss.type).toBe('FROG');
    expect(boss.extraSplits).toBeGreaterThan(2);
    expect(boss.hpMult).toBeGreaterThan(1.5);
  });

  it('WaveManager uses named boss type (zone 1 = Parrot, not Cow)', () => {
    const wm = new WaveManager(mockScene());
    const zone = GameConfig.zones[1];
    wm.initBattle(1, zone.battles - 1);
    expect(wm.isBossBattle).toBe(true);
    expect(wm.bossType).toBe('PARROT');
    expect(wm.bossDef.name).toBe('Sky Screech');
    const preview = wm.getNextWavePreview();
    expect(preview.bossName).toBe('Sky Screech');
  });
});

describe('H2 zoneIntro mid/late campaign', () => {
  it('extends zoneIntro through zones 3 and 4', () => {
    expect(GameConfig.waves.zoneIntro[3]).toBeTruthy();
    expect(GameConfig.waves.zoneIntro[4]).toBeTruthy();
    expect(GameConfig.waves.zoneIntro[3].hippoFromBattle).toBe(2);
    expect(GameConfig.waves.zoneIntro[4].elephantFromBattle).toBe(3);
  });

  it('zone 3 battle 0 excludes Hippo before gate battle', () => {
    const wm = new WaveManager(mockScene());
    wm.initBattle(3, 0, { waveSeed: 'h2-z3' });
    expect(wm.waves.flat()).not.toContain('HIPPO');
  });

  it('zone 4 battle 0 excludes Elephant before gate battle', () => {
    const wm = new WaveManager(mockScene());
    wm.initBattle(4, 0, { waveSeed: 'h2-z4' });
    expect(wm.waves.flat()).not.toContain('ELEPHANT');
  });
});

describe('H2 downtime trim', () => {
  it('shortens prep / cooldown and boosts Send Wave bonus', () => {
    expect(GameConfig.prepPhaseSeconds).toBeLessThanOrEqual(20);
    expect(GameConfig.waveCooldownSeconds).toBeLessThanOrEqual(12);
    expect(GameConfig.earlyWaveBonusPoints).toBeGreaterThanOrEqual(20);
  });
});

describe('H2 star criteria', () => {
  it('lives alone cannot earn 3★ without time bonus', () => {
    const waves = 8;
    const overBudget = starTimeBudgetMs(waves) + 1000;
    expect(calculateStars({
      livesRemaining: 20,
      elapsedMs: overBudget,
      waveCount: waves,
    })).toBe(2);
  });

  it('lives + under-time bonus yields 3★', () => {
    const waves = 8;
    expect(meetsStarTimeBonus(1000, waves)).toBe(true);
    expect(calculateStars({
      livesRemaining: 20,
      elapsedMs: 1000,
      waveCount: waves,
    })).toBe(3);
  });

  it('2★ still uses lives threshold only', () => {
    expect(calculateStars({
      livesRemaining: 10,
      elapsedMs: 1000,
      waveCount: 5,
    })).toBe(2);
  });

  it('HUD projection and hint stay kid-readable', () => {
    expect(projectedStarsFromLives(20)).toBe(2);
    expect(starMeterHint(20)).toMatch(/3 stars/i);
    expect(starMeterHint(20)).toMatch(/finish fast/i);
  });
});

describe('H2 elite variants', () => {
  it('expands Chase ★ elites beyond Frog/Horse/Buffalo', () => {
    const elites = Object.keys(GameConfig.eliteVariants);
    expect(elites).toEqual(expect.arrayContaining([
      'FROG', 'HORSE', 'BUFFALO', 'PARROT', 'BEAR', 'MONKEY', 'GORILLA', 'ZEBRA', 'RHINO',
    ]));
    expect(elites.length).toBeGreaterThanOrEqual(10);
  });
});

describe('H2 defeat consolation', () => {
  it('scales with wave reached and caps', () => {
    const early = computeDefeatConsolation(1);
    const late = computeDefeatConsolation(12);
    expect(early.xp).toBe(GameConfig.defeatConsolation.xpBase);
    expect(early.metaSunshine).toBe(GameConfig.defeatConsolation.metaSunshineBase);
    expect(late.xp).toBeLessThanOrEqual(GameConfig.defeatConsolation.xpCap);
    expect(late.metaSunshine).toBeLessThanOrEqual(GameConfig.defeatConsolation.metaSunshineCap);
    expect(late.xp).toBeGreaterThan(early.xp);
  });
});

describe('H2 daily rotation + chest', () => {
  it('rotates zone/battle by weekday (not fixed Coop B1 forever)', () => {
    const sun = dailyChallengeMap(new Date(2026, 6, 5)); // Sunday
    const mon = dailyChallengeMap(new Date(2026, 6, 6)); // Monday
    const maps = GameConfig.dailyChallenge.weekdayMaps;
    expect(maps.length).toBe(7);
    expect(sun).toEqual(maps[0]);
    expect(mon).toEqual(maps[1]);
    expect(sun).not.toEqual(mon);
  });

  it('params include rotated map and stable seed', () => {
    const date = new Date(2026, 6, 8); // Wednesday
    const params = dailyChallengeParams(date);
    expect(params.zone).toBe(GameConfig.dailyChallenge.weekdayMaps[3].zone);
    expect(params.battle).toBe(GameConfig.dailyChallenge.weekdayMaps[3].battle);
    expect(dailyChallengeSeed(date)).toBe(params.seed);
  });

  it('chest reward is configured and claim is once per date', () => {
    const chest = dailyChestReward();
    expect(chest.metaSunshine).toBe(40);
    expect(chest.xp).toBe(25);
    expect(hasClaimedDailyChest({ lastDailyChestDate: '2026-07-11' }, '2026-07-11')).toBe(true);
    expect(hasClaimedDailyChest({ lastDailyChestDate: '2026-07-10' }, '2026-07-11')).toBe(false);
  });
});
