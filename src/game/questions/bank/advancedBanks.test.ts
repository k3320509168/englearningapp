import { describe, expect, it } from 'vitest';
import r6 from './r6.json';
import r7 from './r7.json';
import r8 from './r8.json';
import v6 from './vocab-r6.json';
import v7 from './vocab-r7.json';
import v8 from './vocab-r8.json';
import { addBankVocab, vocabFor, vocabKey, vocabSenses } from '../../vocab';
import { validateQuestion, questionKey } from '../../validateQuestions';
import { checkChoice, checkTypedAnswer, checkVoice, shuffleChoice, voiceFallback, answerSlots } from '../../battle';
import { checkQuizAnswer } from '../../placement';
import type { Question } from '../../types';

// 內容正確性與程度仍需逐題語言審查；本測試驗證真實遊戲 parser 的可作答性。
for (const [region, bank, vocab] of [[6, r6, v6], [7, r7, v7], [8, r8, v8]] as const) {
  describe(`advanced bank r${region}`, () => {
    const all = [...bank.normal, ...bank.boss] as Question[];
    addBankVocab(vocab);
    it('has complete fields, no duplicate keys, and resolves every lexical entry', () => {
      expect(all.length).toBeGreaterThanOrEqual(40);
      expect(new Set(all.map(questionKey)).size).toBe(all.length);
      for (const q of all) {
        expect(validateQuestion(q, `r${region}: ${q.desc}`).filter(i => i.level === 'error')).toEqual([]);
        if (q.type !== 'choice' && q.vocabId) {
          const k = vocabKey(q)!;
          expect(vocab).toHaveProperty(k);
        }
      }
    });
    it('preserves answers after shuffling and rejects each distractor', () => {
      for (const q of all.filter(q => q.type === 'choice')) {
        const correctText = q.options!['ABCD'.indexOf(q.ans)].slice(3);
        for (const random of [0, 0.15, 0.4, 0.7, 0.99]) {
          const shuffled = shuffleChoice(q, () => random);
          expect(shuffled.options!['ABCD'.indexOf(shuffled.ans)].slice(3)).toBe(correctText);
          for (const letter of 'ABCD') expect(checkChoice(shuffled, letter)).toBe(letter === shuffled.ans);
        }
      }
    });
    it('can answer spelling, fill, voice and no-microphone fallback using production functions', () => {
      for (const q of all.filter(q => q.type !== 'choice')) {
        if (q.type === 'voice') {
          expect(checkVoice(q, q.speak!)).toBe(true);
          expect(checkVoice(q, 'banana bicycle telephone')).toBe(false);
          const fallback = voiceFallback(q);
          expect(fallback.ans).toMatch(/^[A-Z]+$/);
          expect(checkTypedAnswer(fallback, fallback.ans)).toBe(true);
          expect(checkQuizAnswer(fallback, fallback.ans)).toBe(true);
        } else {
          expect(checkTypedAnswer(q, q.ans)).toBe(true);
          for (const variant of q.spellAccept ?? []) {
            expect(checkTypedAnswer(q, variant)).toBe(true);
            expect(checkQuizAnswer(q, variant)).toBe(true);
          }
          expect(checkTypedAnswer(q, q.ans + 'Z')).toBe(false);
          expect(checkQuizAnswer(q, q.ans)).toBe(true);
          if (q.type === 'fill') {
            expect(answerSlots(q, q.ans).map(s => s.char).join('')).toBe(q.speak!.toUpperCase());
            expect(checkQuizAnswer(q, q.speak!)).toBe(true);
          }
        }
      }
    });
    it('keeps all four skills and three difficulty levels in each skill', () => {
      for (const skill of ['listening', 'reading', 'speaking', 'writing']) {
        const qs = all.filter(q => q.skill === skill);
        expect(new Set(qs.map(q => q.difficulty))).toEqual(new Set([1, 2, 3]));
        expect(qs.length / all.length).toBeCloseTo(skill === 'listening' || skill === 'reading' ? 0.3 : 0.2, 1);
      }
    });
  });
}


describe('advanced vocabulary sense isolation', () => {
  it('keeps literary and environmental senses of adaptation separate in the actual study lookup', () => {
    addBankVocab(v6);
    addBankVocab(v7);
    const literary = [...r6.normal, ...r6.boss].find(q => q.type === 'fill' && q.speak === 'adaptation') as Question;
    const environmental = [...r7.normal, ...r7.boss].find(q => q.type === 'spell' && q.ans === 'ADAPTATION') as Question;
    expect(vocabFor(literary)?.meaning).toContain('另一種形式');
    expect(vocabFor(environmental)?.meaning).toContain('新條件');
    expect(vocabFor(literary)?.display).toBe('adaptation');
    expect(vocabFor(environmental)?.display).toBe('adaptation');
  });
});

// 同詞跨情境出現時，後來的跟讀詞條不得把先前拼寫題的例句吃掉。
it('retains examples from earlier contexts when a later batch reuses a word', () => {
  addBankVocab(v7);
  const q = [...r7.normal, ...r7.boss].find(q => q.type === 'spell' && q.ans === 'CORROBORATION') as Question;
  const entry = vocabFor(q)!;
  const examples = vocabSenses(entry).flatMap(s => s.examples.map(e => e.en));
  expect(examples).toContain('The allegation requires independent corroboration.');
  expect(examples).toContain('The sighting needs independent corroboration.');
});
