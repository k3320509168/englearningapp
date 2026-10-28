import { describe, expect, it } from 'vitest';
import type { Question } from './types';
import {
  applyLetter, checkChoice, checkVoice, isLenientStage,
  questionHint, sentenceMatchRatio, shuffleChoice, speedMultiplier,
} from './battle';

const choiceQ: Question = { type: 'choice', desc: 'I ___ a student.', options: ['A. am', 'B. is', 'C. are', 'D. be'], ans: 'A' };

describe('shuffleChoice', () => {
  it('keeps the correct answer text attached to the new answer letter', () => {
    for (let seed = 0; seed < 20; seed++) {
      let s = seed;
      const random = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
      const shuffled = shuffleChoice(choiceQ, random);
      const correct = shuffled.options!.find(o => o.startsWith(shuffled.ans + '.'));
      expect(correct).toBe(`${shuffled.ans}. am`);
      expect(shuffled.options!.map(o => o[0])).toEqual(['A', 'B', 'C', 'D']);
    }
  });

  it('leaves non-choice questions untouched', () => {
    const q: Question = { type: 'spell', desc: '請拼出：書本', ans: 'BOOK' };
    expect(shuffleChoice(q)).toBe(q);
  });
});

describe('applyLetter', () => {
  const q: Question = { type: 'spell', desc: '請拼出：書本', ans: 'BOOK' };
  it('lets the player type freely up to the answer length (judged only on submit)', () => {
    // 自由輸入、不當場判定；最多打到答案的長度
    expect(applyLetter(q, '', 'b')).toBe('B');
    expect(applyLetter(q, 'BO', 'X')).toBe('BOX');
    expect(applyLetter(q, 'BOOK', 'S')).toBe('BOOK');
  });
});

describe('checkChoice', () => {
  it('is case-insensitive', () => {
    expect(checkChoice(choiceQ, 'a')).toBe(true);
    expect(checkChoice(choiceQ, 'B')).toBe(false);
  });
});

describe('voice', () => {
  it('matches single words as whole words, including accept list', () => {
    const q: Question = { type: 'voice', desc: '', ans: 'START', accept: ['STAR'] };
    expect(checkVoice(q, 'start')).toBe(true);
    expect(checkVoice(q, 'a star')).toBe(true);
    expect(checkVoice(q, 'restart')).toBe(false);
  });

  it('passes sentences at 80% of words in order', () => {
    const q: Question = { type: 'voice', desc: '', ans: 'PLEASE SEND ME THE REPORT TODAY' };
    expect(sentenceMatchRatio(q.ans, 'please send me the report today')).toBe(1);
    expect(checkVoice(q, 'please send me a report today')).toBe(true); // 5/6 ≈ 83%
    expect(checkVoice(q, 'please send report')).toBe(false); // 3/6
  });
});

describe('combo timer rules', () => {
  it('rewards fast answers', () => {
    expect(speedMultiplier(3000)).toBe(1.5);
    expect(speedMultiplier(8000)).toBe(1.2);
    expect(speedMultiplier(15_000)).toBe(1);
  });

  it('the first 25 stages are lenient', () => {
    expect(isLenientStage(0)).toBe(true);
    expect(isLenientStage(24)).toBe(true);
    expect(isLenientStage(25)).toBe(false);
  });
});

describe('questionHint', () => {
  it('extracts the Chinese hint from desc', () => {
    expect(questionHint({ type: 'spell', desc: '請拼出：書本', ans: 'BOOK' })).toBe('書本');
    expect(questionHint({ type: 'fill', desc: '填空題：B U D G _ T (預算)', ans: 'E' })).toBe('預算');
    expect(questionHint(choiceQ)).toBe('');
  });
});

describe('口說轉拼寫：辨識容錯不能當成正確拼法（N1）', () => {
  it('全題庫掃描：拼寫時只接受答案與同義寫法', async () => {
    const { LEVELS, getPool } = await import('./QuestionData');
    const { voiceFallback, checkTypedAnswer } = await import('./battle');
    let checked = 0;
    for (const level of LEVELS) {
      const pool = getPool(level);
      for (const q of [...pool.normal, ...pool.boss]) {
        if (q.type !== 'voice') continue;
        const spell = voiceFallback(q);
        if (spell.type !== 'spell') continue;
        checked++;
        expect(checkTypedAnswer(spell, q.ans)).toBe(true);
        for (const heard of q.accept ?? []) {
          if (!(q.spellAccept ?? []).includes(heard)) expect(checkTypedAnswer(spell, heard)).toBe(false);
        }
      }
    }
    expect(checked).toBeGreaterThan(50);
  });

  it('同義寫法在拼寫與口說都接受；誤聽只在口說接受', async () => {
    const { voiceFallback, checkTypedAnswer, checkVoice } = await import('./battle');
    const thank = { type: 'voice', desc: '請唸出單字：謝謝', ans: 'THANK', speak: 'thank you', spellAccept: ['THANKS', 'THANKYOU'] };
    expect(checkTypedAnswer(voiceFallback(thank), 'THANKS')).toBe(true);
    expect(checkVoice(thank, 'thanks')).toBe(true);
    const start = { type: 'voice', desc: '請唸出單字：開始', ans: 'START', speak: 'start', accept: ['STAR'] };
    expect(checkVoice(start, 'star')).toBe(true);
    expect(checkTypedAnswer(voiceFallback(start), 'STAR')).toBe(false);
  });
});
