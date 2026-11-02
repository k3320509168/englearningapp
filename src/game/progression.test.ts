import { describe, expect, it } from 'vitest';
import { monsterGrowth,
  BOSS_BONUS_TABLE, HITS_TO_KILL, UPGRADES, comboMultiplier, computeDamage, goldWithBonus, heroScale,
  REGION_LEVELS, recommendedLevel, monsterAttack, monsterElement, monsterMaxHp, monsterLevel, playerStats, rollBossBonus, upgradeCost,
} from './progression';
import { BASE_DAMAGE, PLAYER_MAX_HP } from './battle';
import { LEVEL_STAT } from './growth';
import { regionStageCount } from './stageLayout';
import { buildParty, gainEnergy, nextAlive, normalizeParty, partyHp } from './party';
import { DEFAULT_CHARACTER } from './character';

const noUpgrades = { hp: 0, atk: 0, combo: 0, gold: 0 };
const base = playerStats({ upgrades: noUpgrades });
const plain = { atk: BASE_DAMAGE, combo: 0, comboStep: 0.1, element: 1, amplify: false, crit: false };

describe('playerStats', () => {
  it('applies shop upgrades', () => {
    expect(base.maxHp).toBe(PLAYER_MAX_HP);
    const s = playerStats({ upgrades: { hp: 2, atk: 3, combo: 1, gold: 2 } });
    expect(s.maxHp).toBe(PLAYER_MAX_HP + 20);
    expect(s.atkMult).toBeCloseTo(1.3);
    expect(s.comboStep).toBeCloseTo(0.12);
    expect(s.goldMult).toBeCloseTo(1.2);
  });
});

describe('computeDamage', () => {
  it('uses base damage with no bonuses', () => {
    expect(computeDamage(plain)).toBe(BASE_DAMAGE);
  });

  it('combo: +10% per layer up to 10, then diminishing but always growing', () => {
    expect(comboMultiplier(10)).toBeCloseTo(2);
    expect(computeDamage({ ...plain, combo: 10 })).toBe(BASE_DAMAGE * 2);
    expect(comboMultiplier(50)).toBeCloseTo(4.2, 1);
    expect(comboMultiplier(100)).toBeCloseTo(5.4, 1);
    expect(comboMultiplier(1000)).toBe(12);
    for (const c of [10, 50, 100, 300, 1000]) expect(comboMultiplier(c + 1)).toBeGreaterThan(comboMultiplier(c));
  });

  it('multiplies element, amplify and crit together', () => {
    expect(computeDamage({ ...plain, element: 1.5 })).toBe(75);
    expect(computeDamage({ ...plain, amplify: true, crit: true })).toBe(BASE_DAMAGE * 2 * 2);
  });

  it('stays sane on the first stage even with a huge combo', () => {
    expect(computeDamage({ ...plain, combo: 1000, crit: true, speed: 1.5 })).toBeLessThan(2000);
  });

  it('boss bonus rolls ×1/×2 most often and ×10 rarely', () => {
    expect(BOSS_BONUS_TABLE.map(b => b.mult)).toEqual([1, 2, 3, 5, 10]);
    const total = BOSS_BONUS_TABLE.reduce((sum, b) => sum + b.weight, 0);
    expect(total).toBe(100);
    expect(rollBossBonus(() => 0)).toBe(1);
    expect(rollBossBonus(() => 0.5)).toBe(2);
    expect(rollBossBonus(() => 0.99)).toBe(10);
    expect(rollBossBonus(() => 0, 3)).toBe(3);
  });
});

describe('monsters', () => {
  it('are designed around answers needed with no combo', () => {
    // A1 第一關的怪物是 Lv5（前置區域打完約 Lv5），比 Lv1 的基準多 4 級成長
    const a1 = 1 + 4 * LEVEL_STAT;
    expect(monsterMaxHp(0, 0, false) / BASE_DAMAGE).toBeCloseTo(HITS_TO_KILL.normal * a1, 1);
    expect(monsterMaxHp(0, 0, true) / BASE_DAMAGE).toBeCloseTo(HITS_TO_KILL.boss * a1, 1);
    expect(monsterMaxHp(30, 0, false)).toBeGreaterThan(monsterMaxHp(0, 0, false));
    expect(monsterMaxHp(0, 4, false)).toBeGreaterThan(monsterMaxHp(0, 0, false));
  });

  it('get harder every stage and every region, without a jump between regions', () => {
    for (let r = 0; r < 9; r++) {
      const n = regionStageCount(r);
      for (let st = 1; st < n; st++) expect(monsterMaxHp(st, r, false)).toBeGreaterThanOrEqual(monsterMaxHp(st - 1, r, false));
      if (r > 0) expect(monsterMaxHp(0, r, false) / monsterMaxHp(regionStageCount(r - 1) - 1, r - 1, false)).toBeLessThan(1.08);
    }
    // 最後一區（C2）的最後一關：沒升級時約要 10 題以上的傷害（第九輪：怪物以裝備跟上一半的英雄為基準）
    expect(monsterMaxHp(49, 8, false) / BASE_DAMAGE).toBeGreaterThan(6);
  });

  it('are based on a hero of the same level, a little stronger each region (round 13)', () => {
    expect(monsterMaxHp(0, 0, false)).toBe(Math.round(BASE_DAMAGE * HITS_TO_KILL.normal * (1 + 4 * LEVEL_STAT)));
    const lv = monsterLevel(5, 0);
    // 比沒裝備的同等級英雄強、比裝備全部跟上的英雄弱：裝備是加分，不是必備
    expect(monsterAttack(false, 5, 0) / 20).toBeGreaterThanOrEqual(heroScale(lv, 0));
    expect(monsterAttack(false, 5, 0) / 20).toBeLessThan(heroScale(lv, 5));
    // 等級每級只差 0.65%，取整後可能一樣；比較成長倍率本身
    expect(monsterGrowth(0, 5, 'final')).toBeGreaterThan(monsterGrowth(0, 5, 'elite'));
  });

  it('hit harder in later regions', () => {
    // A1 第一關是 Lv5：比 Lv1 基準（20／30）多一點點
    expect(monsterAttack(false, 0, 0)).toBe(21);
    expect(monsterAttack(true, 0, 0)).toBe(31);
    expect(monsterAttack(false, 8, 49)).toBeGreaterThan(40);
  });

  it('have an element; revenge bosses are dark', () => {
    expect(monsterElement(0, 0)).toBe('wood');
    expect(monsterElement(3, 0)).not.toBe(monsterElement(0, 0));
    expect(monsterElement(5, 2, true)).toBe('dark');
  });
});

describe('party', () => {
  it('builds members from class and hero stats', () => {
    // 騎士：N 稀有度的劍士（HP ×1.0）；升品階後是 R（×1.12）
    const party = buildParty(['player', 'knight'], ['knight'], { ...DEFAULT_CHARACTER, classId: 'warrior' }, base);
    expect(party.map(m => m.id)).toEqual(['player', 'knight']);
    expect(party[0].maxHp).toBe(130);
    expect(party[0].skill).toBe('haste');
    expect(party[1].maxHp).toBe(100);
    expect(party[1].name).toBe('KNIGHT');
    expect(partyHp(party)).toEqual({ hp: 230, maxHp: 230 });
    expect(buildParty(['knight'], ['knight'], null, base, { tiers: { knight: 1 } })[0].maxHp).toBe(112);
  });

  it('can leave the protagonist out, but never be empty', () => {
    expect(normalizeParty(['knight'], ['knight'], true)).toEqual(['knight']);
    expect(normalizeParty([], ['knight'], true)).toEqual(['player']);
    expect(normalizeParty(['player', 'mage'], ['knight'], false)).toEqual(['knight']);
    expect(normalizeParty(['player', 'knight', 'knight', 'archer', 'mage', 'bard'], ['knight', 'archer', 'mage', 'bard'], true))
      .toEqual(['player', 'knight', 'archer', 'mage']);
  });

  it('rotates over members that are still standing', () => {
    const party = buildParty(['player', 'knight'], ['knight'], DEFAULT_CHARACTER, base);
    party[1].hp = 0;
    expect(nextAlive(party, 1)).toBe(0);
    expect(gainEnergy(party)[1].energy).toBe(0);
    expect(gainEnergy(party)[0].energy).toBe(1);
  });
});

describe('economy', () => {
  it('prices upgrades by level', () => {
    const hp = UPGRADES.find(u => u.id === 'hp')!;
    expect(upgradeCost(hp, 0)).toBe(50);
    expect(upgradeCost(hp, 2)).toBe(150);
  });

  it('applies gold bonuses', () => {
    const s = playerStats({ upgrades: { ...noUpgrades, gold: 2 } });
    expect(goldWithBonus(10, s)).toBe(12);
  });
});

describe('skills', () => {
  it('get stronger with rarity', async () => {
    const { RARITY_POWER, SKILLS, skillEffect, skillDesc } = await import('./progression');
    for (const id of Object.keys(SKILLS) as (keyof typeof SKILLS)[]) {
      const weak = skillEffect(id, RARITY_POWER.N);
      const strong = skillEffect(id, RARITY_POWER.UR);
      const sum = (e: Record<string, unknown>) => Object.values(e).reduce<number>((a, v) => a + (typeof v === 'number' ? v : 0), 0);
      expect(sum(strong as Record<string, unknown>)).toBeGreaterThanOrEqual(sum(weak as Record<string, unknown>));
      expect(skillDesc(id, 1).length).toBeGreaterThan(0);
    }
    expect(skillDesc('heal', RARITY_POWER.N)).toContain('25%');
    expect(skillDesc('heal', RARITY_POWER.UR)).toContain('48%');
  });

  it('heroes of the same class do not all share one skill; SSR heroes have signatures', async () => {
    const { HEROES, heroSkill } = await import('./heroes');
    const { SKILLS } = await import('./progression');
    const swords = new Set(HEROES.filter(h => h.classId === 'swordsman' && h.rarity !== 'SSR').map(heroSkill));
    expect(swords.size).toBeGreaterThan(1);
    for (const h of HEROES.filter(h => h.rarity === 'SSR')) expect(SKILLS[heroSkill(h)].signature).toBe(true);
    expect(new Set(HEROES.filter(h => h.rarity === 'SSR').map(heroSkill)).size).toBe(15);
  });
});

describe('question difficulty within a region', () => {
  it('early stages only draw easy questions, later stages reach harder ones', async () => {
    const { createDecks, questionDifficulty, maxDifficultyAt, LEVELS } = await import('./QuestionData');
    // A2（A1 的 1-1～1-10 新手關另外限定只出選擇題）
    const decks = createDecks(LEVELS[1]);
    for (let i = 0; i < 40; i++) expect(questionDifficulty(decks.normal(0))).toBeLessThanOrEqual(1);
    expect(maxDifficultyAt(0)).toBe(1);
    expect(maxDifficultyAt(20)).toBe(2);
    expect(maxDifficultyAt(49)).toBe(3);
    const late = new Set(Array.from({ length: 200 }, () => questionDifficulty(decks.normal(49))));
    expect(late.has(3) || late.has(2)).toBe(true);
  });
});


describe('C2：v2.0高階Combo曲線', () => {
  it.each([[1000, 12], [3000, 16], [10000, 20], [100000, 34], [1000000, 50]])('錨點 %d 對應倍率 %d', (combo, multiplier) => {
    expect(comboMultiplier(combo)).toBeCloseTo(multiplier);
  });
  it('百萬後緩增至60且高數值不溢位', () => {
    expect(comboMultiplier(1e7)).toBeCloseTo(55);
    expect(comboMultiplier(1e8)).toBeCloseTo(60);
    expect(comboMultiplier(Number.MAX_VALUE)).toBe(60);
    expect(comboMultiplier(Infinity)).toBe(60);
    expect(comboMultiplier(NaN)).toBe(1);
    expect(comboMultiplier(-1)).toBe(1);
  });
  it.each([[0.1, 50, 60], [0.2, 99, 119], [0.3, 148, 178]])('商店step=%s保留百萬與最終比例', (step, million, cap) => {
    expect(comboMultiplier(1e6, step)).toBeCloseTo(million);
    expect(comboMultiplier(1e12, step)).toBeCloseTo(cap);
  });
});


describe('C7 v2.2推薦終點與既有敵人曲線分離', () => {
  it('recommends the regional target at every terminal boss, including C2 Lv200', () => {
    for (let r = 0; r < 9; r++) {
      const last = regionStageCount(r) - 1;
      expect(recommendedLevel(r, last)).toBe(REGION_LEVELS[r][1]);
      expect(monsterLevel(r, last, 'final')).toBe(REGION_LEVELS[r][1] + 4);
    }
  });
});
