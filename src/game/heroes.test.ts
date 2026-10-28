import { describe, expect, it } from 'vitest';
import {
  HEROES, PITY_SSR, RARITIES, TEN_PULL, currentRarity, heroCharacter, heroDef, heroStats, rollRarity, summon,
} from './heroes';
import { normalizeCharacter } from './character';
import { useSaveStore, initialSave, migrateSave } from '../store/saveStore';

// 固定亂數序列，讓抽卡結果可重現
const seq = (...values: number[]) => { let i = 0; return () => values[i++ % values.length]; };

describe('hero roster', () => {
  it('has 50 heroes with unique English-word names', () => {
    expect(HEROES).toHaveLength(50);
    expect(new Set(HEROES.map(h => h.id)).size).toBe(50);
    HEROES.forEach(h => expect(h.id).toMatch(/^[a-z]+$/));
  });

  it('spreads heroes across rarities (N 16, R 14, SR 12, SSR 8)', () => {
    const count = (r: string) => HEROES.filter(h => h.rarity === r).length;
    expect([count('N'), count('R'), count('SR'), count('SSR')]).toEqual([16, 14, 12, 8]);
  });

  it('gives each hero a valid, stable look', () => {
    HEROES.forEach(h => expect(normalizeCharacter(heroCharacter(h))).toEqual(heroCharacter(h)));
    const looks = new Set(HEROES.map(h => JSON.stringify(h.look) + h.classId + h.element));
    expect(looks.size).toBe(50);
  });

  it('tiering up raises rarity by exactly one step and boosts stats', () => {
    const phoenix = heroDef('phoenix');
    expect(currentRarity(phoenix, 0)).toBe('SSR');
    expect(currentRarity(phoenix, 1)).toBe('UR');
    expect(heroStats(phoenix, 1).atk).toBeGreaterThan(heroStats(phoenix, 0).atk);
    expect(RARITIES.indexOf(currentRarity(heroDef('apple'), 1))).toBe(1);
  });
});

describe('summon', () => {
  it('rolls rarities by weight', () => {
    expect(rollRarity(() => 0)).toBe('SSR');
    expect(rollRarity(() => 0.99)).toBe('N');
  });

  it(`guarantees an SSR within ${PITY_SSR} pulls`, () => {
    const { results, counter } = summon(1, { sinceSsr: PITY_SSR - 1, spark: 0 }, () => 0.99);
    expect(results[0].rarity).toBe('SSR');
    expect(counter.sinceSsr).toBe(0);
    expect(counter.spark).toBe(1);
  });

  it('a ten-pull always contains at least one SR or better', () => {
    const { results } = summon(TEN_PULL, { sinceSsr: 0, spark: 0 }, () => 0.99);
    expect(results.filter(r => r.rarity === 'SR')).toHaveLength(1);
    expect(results.at(-1)!.rarity).toBe('SR');
  });
});

describe('summon in the save', () => {
  const reset = () => useSaveStore.setState({ ...initialSave, gold: 10_000 });

  it('spends tickets, adds new heroes, and turns duplicates into shards', () => {
    reset();
    const out = useSaveStore.getState().summonHeroes(2, seq(0.99, 0))!; // 兩次都是 N 的第一位（knight，已擁有）
    expect(out.every(r => r.id === 'knight' && !r.isNew && r.shards === 5)).toBe(true);
    expect(useSaveStore.getState().heroShards.knight).toBe(10);
    expect(useSaveStore.getState().tickets).toBe(initialSave.tickets - 2);
    expect(useSaveStore.getState().summonHeroes(999)).toBeNull();
  });

  it('exchanges 100 spark points for any SSR and allows one tier-up', () => {
    reset();
    useSaveStore.setState({ summonCounter: { sinceSsr: 0, spark: 100 } });
    const got = useSaveStore.getState().exchangeSpark('aurora')!;
    expect(got.isNew).toBe(true);
    expect(useSaveStore.getState().heroes).toContain('aurora');
    expect(useSaveStore.getState().exchangeSpark('aurora')).toBeNull(); // 點數不夠了
    useSaveStore.setState({ heroShards: { aurora: 60 } });
    expect(useSaveStore.getState().tierUp('aurora')).toBe(false); // 還沒有真名進度
    useSaveStore.setState({ trueName: { aurora: [true, true, true, false, false] } });
    expect(useSaveStore.getState().tierUp('aurora')).toBe(true);
    expect(useSaveStore.getState().heroTier.aurora).toBe(1);
    expect(useSaveStore.getState().tierUp('aurora')).toBe(false); // 只能升一次
  });

  it('migrates old saves: keeps old heroes and grants starter tickets', () => {
    const m = migrateSave({ heroes: ['knight', 'archer', 'bogus'], party: ['player', 'bogus', 'archer'] }, 7);
    expect(m.heroes).toEqual(['knight', 'archer']);
    expect(m.party).toEqual(['player', 'archer']);
    expect(m.tickets).toBe(initialSave.tickets);
  });
});

describe('hero titles', () => {
  it('does not repeat the class name', async () => {
    const { heroTitle } = await import('./heroes');
    expect(heroTitle(heroDef('archer'))).toBe('弓箭手');
    expect(heroTitle(heroDef('apple'))).toBe('蘋果劍士');
  });
});

describe('送別英雄', () => {
  it('不在隊伍才能賣，退還基本金幣＋投入的 65%，碎片保留', async () => {
    const { HERO_SELL_BASE, heroSellValue, trainCost } = await import('../store/saveStore');
    useSaveStore.setState({ ...initialSave, gold: 0, heroes: ['knight', 'apple'], party: ['player', 'knight'], heroLevel: { apple: 3 }, heroShards: { apple: 5 }, trueName: { apple: [true] } });
    expect(useSaveStore.getState().sellHero('knight')).toBe(0); // 在隊伍中
    const rarityIdx = ['N', 'R', 'SR', 'SSR'].indexOf(heroDef('apple').rarity);
    const expected = heroSellValue('apple', 3, 0);
    expect(expected).toBe(HERO_SELL_BASE[heroDef('apple').rarity] + Math.floor((trainCost(1, rarityIdx) + trainCost(2, rarityIdx)) * 0.65));
    expect(useSaveStore.getState().sellHero('apple')).toBe(expected);
    const s = useSaveStore.getState();
    expect(s.gold).toBe(expected);
    expect(s.heroes).toEqual(['knight']);
    expect(s.trueName.apple).toBeUndefined();
    expect(s.heroShards.apple).toBe(5);
    expect(s.sellHero('knight')).toBe(0); // 至少留一位
  });
});
