import { describe, expect, it } from 'vitest';
import { HEROES } from './heroes';
import { HERO_LORE } from './heroLore';
import { TRIAL_COUNT, checkTyped, isTrueName, revealedName, trialQuestion } from './trueName';
import { buildMember } from './party';
import { playerStats } from './progression';
import { initialSave, useSaveStore } from '../store/saveStore';

const base = playerStats({ upgrades: { hp: 0, atk: 0, combo: 0, gold: 0 } });

describe('true-name content', () => {
  it('every hero has trial content, and usage sentences contain the blank', () => {
    for (const h of HEROES) {
      const lore = HERO_LORE[h.id];
      expect(lore, h.id).toBeTruthy();
      expect(lore.usage.en).toContain('___');
      expect(new Set([lore.form.answer, ...lore.form.wrong]).size).toBe(4);
    }
  });

  it('builds all five trials with a valid answer among the options', () => {
    for (const h of HEROES) {
      for (let i = 0; i < TRIAL_COUNT; i++) {
        const q = trialQuestion(h.id, i);
        if (q.kind === 'choice') {
          expect(q.options).toHaveLength(4);
          expect(new Set(q.options).size).toBe(4);
          expect(q.options).toContain(q.answer);
        } else {
          expect(q.answer).toBe(h.id.toUpperCase());
        }
      }
    }
  });

  it('checks typed answers ignoring case and spaces around', () => {
    expect(checkTyped('APPLE', ' apple ')).toBe(true);
    expect(checkTyped('APPLE', 'aple')).toBe(false);
  });
});

describe('true-name progress', () => {
  it('reveals letters as trials are completed', () => {
    expect(revealedName('apple', undefined)).toEqual(['', '', '', '', '']);
    expect(revealedName('apple', [true, true, false, false, false]).join('')).toBe('AP');
    expect(revealedName('apple', [true, true, true, true, true]).join('')).toBe('APPLE');
  });

  it('gives shards once per trial and +50% stats when complete', () => {
    useSaveStore.setState({ ...initialSave });
    const sv = () => useSaveStore.getState();
    expect(sv().completeTrial('knight', 0)).toBe(true);
    expect(sv().completeTrial('knight', 0)).toBe(false);
    expect(sv().heroShards.knight).toBe(3);
    expect(sv().completeTrial('phoenix', 0)).toBe(false); // 沒有這位英雄
    for (let i = 1; i < TRIAL_COUNT; i++) sv().completeTrial('knight', i);
    expect(isTrueName(sv().trueName.knight)).toBe(true);
    const plain = buildMember('knight', null, base);
    const named = buildMember('knight', null, base, { trueName: sv().trueName });
    expect(named.atk / plain.atk).toBeCloseTo(1.5);
  });
});
