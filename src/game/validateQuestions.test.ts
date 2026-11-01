import { describe, expect, it } from 'vitest';
import { validateQuestion } from './validateQuestions';
import type { Question } from './types';

const choice = (desc: string): Question => ({
  type: 'choice', skill: 'reading', desc, options: ['A. pen', 'B. pens', 'C. a pens', 'D. pen\'s'], ans: 'A', explain: '單數名詞。',
});
const errors = (q: Question) => validateQuestion(q, 'test').filter(i => i.level === 'error').map(i => i.message);

describe('choice questions must show something to answer', () => {
  it('rejects a description of the question type instead of the sentence', () => {
    expect(errors(choice('【生活文法】含有名詞單複數的英文句子'))).toHaveLength(1);
    expect(errors(choice('【生活文法】含有 there is/are 的英文句子'))).toHaveLength(1);
    expect(errors(choice('【旅遊文法】含有助動詞的否定句'))).toHaveLength(1);
  });

  it('accepts a real sentence and Chinese-to-English word questions', () => {
    expect(errors(choice('【生活文法】The ___ is on the desk.'))).toEqual([]);
    expect(errors(choice('【字彙】「紅色」的英文是？'))).toEqual([]);
  });
});

// PRE 的圖像/中文指令是正式新手題型；不能被一般英文句子規則誤殺。
describe('prologue pool validation', () => {
  it('permits picture prompts and deliberate PRE cross-deck reuse only', async () => {
    const { validateQuestionPool } = await import('./validateQuestions');
    const q = choice('這是什麼動物？ 🐰');
    const pool = { PRE: { normal: [q], boss: [q] } };
    expect(validateQuestionPool(pool, []).filter(i => i.level === 'error')).toEqual([]);
    const duplicated = { PRE: { normal: [q, q], boss: [q] } };
    expect(validateQuestionPool(duplicated, []).some(i => i.level === 'error' && i.message.includes('重複'))).toBe(true);
    // 一般區域仍要有可理解的英文或明確中翻英提示。
    expect(errors(q)).toHaveLength(1);
  });
  it('still rejects placeholder descriptions even when picture prompts are permitted', () => {
    const q = choice('【生活文法】含有 there is/are 的英文句子');
    expect(validateQuestion(q, 'PRE', { allowPicturePrompt: true }).filter(i => i.level === 'error')).toHaveLength(1);
  });
});


describe('fill questions use the actual answer slot format', () => {
  it('supports sentence chunks but rejects a blank attached to punctuation', () => {
    const q: Question = { type: 'fill', desc: '填空題：I a _ Tom. (我是湯姆)', ans: 'M', speak: 'I am Tom.' };
    expect(errors(q)).toEqual([]);
    expect(errors({ ...q, desc: '填空題：It is ho _. (它是熱的)', ans: 'T', speak: 'It is hot.' })).toHaveLength(1);
  });
});
