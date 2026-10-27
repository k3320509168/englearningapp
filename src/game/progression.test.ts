import { describe, expect, it } from 'vitest';
import {
  BOSS_QUESTION_STEPS, HITS_TO_KILL, UPGRADES, bossStep, comboMultiplier, computeDamage, goldWithBonus,
  monsterElement, monsterMaxHp, playerStats, upgradeCost,
} from './progression';
import { BASE_DAMAGE, PLAYER_MAX_HP } from './battle';
import { buildParty, gainEnergy, nextAlive, normalizeParty, partyHp } from './party';
import { DEFAULT_CHARACTER } from './character';

const noUpgrades = { hp: 0, atk: 0, combo: 0, gold: 0 };
const base = playerStats({ upgrades: noUpgrades });
const plain = { atk: BASE_DAMAGE, combo: 0, comboStep: 0.1, bossMult: 1, element: 1, amplify: false, crit: false };

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

  it('combo has no cap: +10% per combo', () => {
    expect(comboMultiplier(10)).toBeCloseTo(2);
    expect(comboMultiplier(100)).toBeCloseTo(11);
    expect(computeDamage({ ...plain, combo: 10 })).toBe(BASE_DAMAGE * 2);
  });

  it('multiplies element, boss multiplier, amplify and crit together', () => {
    expect(computeDamage({ ...plain, element: 1.5 })).toBe(75);
    expect(computeDamage({ ...plain, bossMult: 30, amplify: true, crit: true })).toBe(BASE_DAMAGE * 30 * 2 * 2);
  });

  it('can reach hundreds of millions with a long run', () => {
    const mult = 2 * 3 * 5 ** 8; // 10 道魔王題
    expect(computeDamage({ ...plain, combo: 50, bossMult: mult })).toBeGreaterThan(1e8);
  });

  it('boss question steps go ×2, ×3, then ×5', () => {
    expect([0, 1, 2, 3, 9].map(bossStep)).toEqual([2, 3, 5, 5, 5]);
    expect(BOSS_QUESTION_STEPS).toEqual([2, 3, 5]);
  });
});

describe('monsters', () => {
  it('are designed around answers needed with no combo', () => {
    expect(monsterMaxHp(0, 0, false) / BASE_DAMAGE).toBeCloseTo(HITS_TO_KILL.normal);
    expect(monsterMaxHp(0, 0, true) / BASE_DAMAGE).toBeCloseTo(HITS_TO_KILL.boss);
    expect(monsterMaxHp(30, 0, false)).toBeGreaterThan(monsterMaxHp(0, 0, false));
    expect(monsterMaxHp(0, 4, false)).toBeGreaterThan(monsterMaxHp(0, 0, false));
  });

  it('have an element; revenge bosses are dark', () => {
    expect(monsterElement(0, 0)).toBe('wood');
    expect(monsterElement(3, 0)).not.toBe(monsterElement(0, 0));
    expect(monsterElement(5, 2, true)).toBe('dark');
  });
});

describe('party', () => {
  it('builds members from class and hero stats', () => {
    const party = buildParty(['player', 'knight'], { ...DEFAULT_CHARACTER, classId: 'warrior' }, base);
    expect(party.map(m => m.id)).toEqual(['player', 'knight']);
    expect(party[0].maxHp).toBe(130);
    expect(party[0].skill).toBe('haste');
    expect(party[1].maxHp).toBe(120);
    expect(partyHp(party)).toEqual({ hp: 250, maxHp: 250 });
  });

  it('can leave the protagonist out, but never be empty', () => {
    expect(normalizeParty(['knight'], ['knight'], true)).toEqual(['knight']);
    expect(normalizeParty([], ['knight'], true)).toEqual(['player']);
    expect(normalizeParty(['player', 'mage'], ['knight'], false)).toEqual(['knight']);
    expect(normalizeParty(['player', 'knight', 'knight', 'archer', 'mage', 'bard'], ['knight', 'archer', 'mage', 'bard'], true))
      .toEqual(['player', 'knight', 'archer', 'mage']);
  });

  it('rotates over members that are still standing', () => {
    const party = buildParty(['player', 'knight'], DEFAULT_CHARACTER, base);
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
