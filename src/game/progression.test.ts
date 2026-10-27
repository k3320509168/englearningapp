import { describe, expect, it } from 'vitest';
import type { Question } from './types';
import {
  UPGRADES, comboAfterWrong, computeDamage, goldWithBonus, monsterMaxHp, playerStats, rollBuffChoices, upgradeCost,
} from './progression';
import { BASE_DAMAGE, PLAYER_MAX_HP } from './battle';

const spell: Question = { type: 'spell', desc: '請拼出：書本', ans: 'BOOK' };
const choice: Question = { type: 'choice', desc: 'x', options: ['A. a', 'B. b', 'C. c', 'D. d'], ans: 'A' };
const voice: Question = { type: 'voice', desc: 'x', ans: 'START' };
const noUpgrades = { hp: 0, atk: 0, combo: 0, gold: 0 };
const base = playerStats({ upgrades: noUpgrades, hero: 'archer' });

describe('playerStats', () => {
  it('applies upgrades and the knight HP bonus', () => {
    expect(playerStats({ upgrades: noUpgrades, hero: 'archer' }).maxHp).toBe(PLAYER_MAX_HP);
    const s = playerStats({ upgrades: { hp: 2, atk: 3, combo: 1, gold: 2 }, hero: 'knight' });
    expect(s.maxHp).toBe(PLAYER_MAX_HP + 20 + 20);
    expect(s.atkMult).toBeCloseTo(1.3);
    expect(s.comboCap).toBeCloseTo(2.2);
    expect(s.goldMult).toBeCloseTo(1.2);
  });
});

describe('computeDamage', () => {
  it('uses base damage with no bonuses', () => {
    expect(computeDamage(choice, 1, base, 'knight', [])).toBe(BASE_DAMAGE);
  });

  it('applies hero type bonuses', () => {
    expect(computeDamage(spell, 1, base, 'archer', [])).toBe(65);
    expect(computeDamage(voice, 1, base, 'bard', [])).toBe(100);
    expect(computeDamage(choice, 1, base, 'archer', [])).toBe(BASE_DAMAGE);
  });

  it('stacks buffs', () => {
    expect(computeDamage(choice, 1, base, 'knight', ['sniper', 'sniper'])).toBe(80);
    expect(computeDamage(spell, 1, base, 'knight', ['power'])).toBe(Math.round(BASE_DAMAGE * 1.15));
  });
});

describe('comboAfterWrong', () => {
  it('resets by default, keeps for mage on choice, halves with ember', () => {
    expect(comboAfterWrong(spell, 6, 'knight', [])).toBe(0);
    expect(comboAfterWrong(choice, 6, 'mage', [])).toBe(6);
    expect(comboAfterWrong(spell, 6, 'mage', [])).toBe(0);
    expect(comboAfterWrong(spell, 7, 'knight', ['ember'])).toBe(3);
  });
});

describe('economy', () => {
  it('prices upgrades by level', () => {
    const hp = UPGRADES.find(u => u.id === 'hp')!;
    expect(upgradeCost(hp, 0)).toBe(50);
    expect(upgradeCost(hp, 2)).toBe(150);
  });

  it('applies gold bonuses', () => {
    const s = playerStats({ upgrades: { ...noUpgrades, gold: 2 }, hero: 'knight' });
    expect(goldWithBonus(10, s, [])).toBe(12);
    expect(goldWithBonus(10, s, ['fortune'])).toBe(15);
  });

  it('makes later stages and bosses tougher', () => {
    expect(monsterMaxHp(0, 0, false)).toBe(50);
    expect(monsterMaxHp(30, 0, false)).toBeGreaterThan(monsterMaxHp(0, 0, false));
    expect(monsterMaxHp(9, 0, true)).toBe(monsterMaxHp(9, 0, false) * 2);
    expect(monsterMaxHp(0, 4, false)).toBeGreaterThan(monsterMaxHp(0, 0, false));
  });
});

describe('rollBuffChoices', () => {
  it('returns 3 distinct buffs', () => {
    for (let i = 0; i < 20; i++) {
      const c = rollBuffChoices();
      expect(c).toHaveLength(3);
      expect(new Set(c).size).toBe(3);
    }
  });
});
