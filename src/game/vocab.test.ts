import { describe, expect, it } from 'vitest';
import { vocabSenses } from './vocab';

describe('單字學習：詞性與例句', () => {
  const base = { pos: 'v.', meaning: '跑', example: 'I run every day.', exampleZh: '我每天跑步。' };

  it('沒有完整資料時用主要意思與例句', () => {
    expect(vocabSenses(base)).toEqual([{ pos: 'v.', meaning: '跑', examples: [{ en: 'I run every day.', zh: '我每天跑步。' }] }]);
  });

  it('主要詞性排第一個，而且包含主要例句；不改動原本的資料', () => {
    const senses = [
      { pos: 'n.', meaning: '跑步', examples: [{ en: 'Let us go for a run.', zh: '我們去跑步吧。' }] },
      { pos: 'v.', meaning: '跑；經營', examples: [{ en: 'She runs a shop.', zh: '她經營一家店。' }] },
    ];
    const out = vocabSenses({ ...base, senses });
    expect(out.map(s => s.pos)).toEqual(['v.', 'n.']);
    expect(out[0].examples.map(e => e.en)).toEqual(['I run every day.', 'She runs a shop.']);
    expect(senses[1].examples).toHaveLength(1);
  });
});
