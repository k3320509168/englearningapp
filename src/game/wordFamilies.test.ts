import { describe, expect, it } from 'vitest';
import { detectWordEvolution, WORD_FAMILIES } from './wordFamilies';
import type { Question } from './types';

describe('wordFamilies', () => {
  it('covers major word families', () => {
    expect(WORD_FAMILIES.act.derivatives).toContain('action');
    expect(WORD_FAMILIES.decide.derivatives).toContain('decision');
    expect(WORD_FAMILIES.create.derivatives).toContain('creative');
  });

  it('detects evolution from spelling or choice answer', () => {
    const q: Question = {
      type: 'spell',
      desc: '請拼出：決定 (名詞)',
      ans: 'DECISION',
    };
    const evo = detectWordEvolution(q);
    expect(evo).toEqual({
      root: 'decide',
      evolved: 'decision',
      meaning: '決定',
    });
  });

  it('detects evolution from voice or listen speak field', () => {
    const q: Question = {
      type: 'voice',
      desc: '請唸出單字：有創造力的',
      ans: 'CREATIVE',
      speak: 'creative',
    };
    const evo = detectWordEvolution(q);
    expect(evo).toEqual({
      root: 'create',
      evolved: 'creative',
      meaning: '創造',
    });
  });

  it('returns null for base words or words without family', () => {
    const q: Question = {
      type: 'choice',
      desc: 'What is this?',
      ans: 'APPLE',
      options: ['A. apple', 'B. banana'],
    };
    expect(detectWordEvolution(q)).toBeNull();
  });
});
