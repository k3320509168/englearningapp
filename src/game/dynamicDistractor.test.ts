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

  it('R1回歸：絕對不修改文法填空題，避免產生雙解（如 who / that 關係子句衝突）', () => {
    const grammarFillQ: Question = {
      type: 'choice',
      desc: 'The client ___ called this morning is waiting.',
      options: ['A. who', 'B. which', 'C. whose', 'D. whom'],
      ans: 'A',
    };
    const grammarPool = ['that', 'where', 'when', 'what', 'how'];
    for (let i = 0; i < 20; i++) {
      const result = withDynamicDistractor(grammarFillQ, grammarPool, () => 0.1);
      // 確保題目完全未被修改，選項依然是原選項
      expect(result.options).toEqual(['A. who', 'B. which', 'C. whose', 'D. whom']);
    }
  });

  it('R1回歸：不修改閱讀題、長文章題或附帶解析的題目', () => {
    const readingQ: Question = {
      type: 'choice',
      desc: 'Line 1: Meeting at noon.\nLine 2: Please bring your notes.\nWhen is the meeting?',
      options: ['A. At noon', 'B. At midnight', 'C. Tomorrow morning', 'D. Next week'],
      ans: 'A',
    };
    const result = withDynamicDistractor(readingQ, ['yesterday', 'evening', 'tonight'], () => 0.1);
    expect(result.options).toEqual(readingQ.options);
  });
});
