import { afterEach, expect, it } from 'vitest';
import { questionKey } from '../game/battle';
import { DEFAULT_CHARACTER } from '../game/character';
import { addBank, LEVELS } from '../game/QuestionData';
import r0 from '../game/questions/bank/r0.json';
import type { BankFile } from '../game/questions/bank';
import { preferReviewContext, REVIEW_CONTEXTS } from '../game/reviewContexts';
import { setBattleRandom, useBattleStore } from './battleStore';
import { initialSave, useSaveStore } from './saveStore';

const tagged = REVIEW_CONTEXTS.map(entry => (r0 as BankFile).normal.find(q => questionKey(q) === entry.key)!);
const [work, school, home] = tagged;
const history = (correct: number, wrong = 0) => ({ correct, wrong });
afterEach(() => setBattleRandom(() => 0.99));

it('優先換情境，答錯過的題也算已見', () => {
  expect(preferReviewContext('g:be_verb', tagged, {
    [questionKey(work)]: history(1),
    [questionKey(school)]: history(0, 1),
  })).toEqual([home]);
});

it('沒有已答對的情境或關卡的可用題已看過時，保留既有抽題池', () => {
  expect(preferReviewContext('g:be_verb', tagged, { [questionKey(work)]: history(0, 1) })).toBe(tagged);
  const allowed = [work];
  expect(preferReviewContext('g:be_verb', allowed, { [questionKey(work)]: history(1) })).toBe(allowed);
});

it('主線作答後，到期複習實際抽到另一個正式情境', () => {
  addBank(0, { normal: tagged, boss: [] });
  const battle = () => useBattleStore.getState();
  setBattleRandom(() => 0.99);
  useSaveStore.setState({
    ...structuredClone(initialSave),
    character: DEFAULT_CHARACTER,
    codex: { [questionKey(work)]: { question: work, ...history(1), firstSeenAt: 0 } },
    knowledge: { 'g:be_verb': { wins: [0], dueAt: 0 } },
    settings: { ...initialSave.settings, showLessons: false },
    hintsSeen: ['boss', 'skill'],
  });
  // 用一般關卡，避開首領優先題型和新手抽題限制。
  battle().startLevel(LEVELS[0], undefined, 5);
  const starter = { type: 'choice', desc: 'Which word means 貓?', ans: 'A', options: ['A. cat', 'B. dog'] };
  useBattleStore.setState({ monsterHp: 1e9, monsterMaxHp: 1e9, question: starter, original: starter });
  setBattleRandom(() => 0);
  battle().chooseOption('A');
  expect([questionKey(school), questionKey(home)]).toContain(questionKey(battle().original!));
});
