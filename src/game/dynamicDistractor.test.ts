import { describe, expect, it } from 'vitest';
import { withDynamicDistractor } from './QuestionData';
import type { Question } from './types';

describe('withDynamicDistractor', () => {
  const sampleQ: Question = {
    type: 'choice',
    desc: 'What is this animal?',
    options: ['A. Cat', 'B. Dog', 'C. Elephant', 'D. Tiger'],
    ans: 'B',
  };

  const pool = ['Lion', 'Leopard', 'Panther', 'Cheetah', 'Giraffe', 'Zebra'];

  it('keeps the correct answer untouched and valid', () => {
    for (let i = 0; i < 20; i++) {
      const result = withDynamicDistractor(sampleQ, pool, () => 0.1); // 強制觸發
      expect(result.ans).toBe('B');
      expect(result.options![1]).toBe('B. Dog');
      expect(result.options!).toHaveLength(4);
      // 確保 4 個選項全數不重複
      const texts = result.options!.map(o => o.replace(/^[A-D]\.\s*/, ''));
      expect(new Set(texts).size).toBe(4);
    }
  });

  it('does not modify non-choice questions', () => {
    const spellQ: Question = { type: 'spell', desc: 'Spell DOG', ans: 'DOG' };
    const result = withDynamicDistractor(spellQ, pool, () => 0.1);
    expect(result).toBe(spellQ);
  });
});
