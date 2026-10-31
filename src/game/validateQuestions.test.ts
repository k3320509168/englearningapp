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
