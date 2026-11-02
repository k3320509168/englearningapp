import { describe, expect, it } from 'vitest';
import { STABLE_GAP, isStable, strictTrialWait, TRIAL_PER_SKILL, TRIAL_SKILLS, emptyTrialScore, completeTrial, knowledgeKey, regionMastery, sealTargets, trialPassed, trialQuestions, updateKnowledge } from './knowledge';
import type { KnowledgeRecord } from './knowledge';
import { addBank, questionDifficulty, questionSkill } from './QuestionData';
import r0 from './questions/bank/r0.json';
import type { BankFile } from './questions/bank';
import { autoGrammarTags } from './grammar';
import type { Question } from './types';
import { initialSave, migrateSave, useSaveStore } from '../store/saveStore';

const HOUR = 60 * 60 * 1000;

describe('知識點', () => {
  it('同一個字的聽、說、拼寫、填空算同一個知識點；句子題各自一個', () => {
    const keys = [
      knowledgeKey({ type: 'choice', desc: '🎧 聽一聽', speak: 'Office', options: ['A. 辦公室'], ans: 'A' }),
      knowledgeKey({ type: 'spell', desc: '請拼出：辦公室', ans: 'OFFICE', speak: 'office' }),
      knowledgeKey({ type: 'voice', desc: '請唸出單字：辦公室', ans: 'OFFICE' }),
      knowledgeKey({ type: 'fill', desc: '填空題：O F F _ C E', ans: 'I', speak: 'office' }),
    ];
    expect(new Set(keys)).toEqual(new Set(['w:office']));
    expect(knowledgeKey({ type: 'choice', desc: 'There ___ some milk.', options: [], ans: 'A' })).toMatch(/^q:/);
    expect(knowledgeKey({ type: 'choice', desc: '🎧', speak: 'Whose bag is this?', options: [], ans: 'A' })).toMatch(/^q:/);
  });

  it('同一天答對很多次只算一次；隔 20 小時以上才算下一次，三次就穩定', () => {
    let rec: KnowledgeRecord | undefined;
    const step = (correct: boolean, counted: boolean, at: number) => {
      const r = updateKnowledge(rec, correct, counted, at);
      if (r) rec = r.rec;
      return r;
    };
    expect(step(true, false, 0)).toBeNull(); // 看完答案後重答不算
    expect(step(true, true, 0)?.crossDay).toBe(false);
    expect(step(true, true, 5 * HOUR)).toBeNull();
    expect(rec!.wins).toHaveLength(1);
    expect(rec!.dueAt).toBe(STABLE_GAP);
    expect(step(true, true, STABLE_GAP)?.crossDay).toBe(true);
    // 答錯不扣掉紀錄，等可以再算數的時候排進複習
    step(false, true, STABLE_GAP + HOUR);
    expect(rec!.wins).toHaveLength(2);
    expect(rec!.dueAt).toBe(2 * STABLE_GAP);
    step(true, true, 3 * STABLE_GAP);
    expect(rec!.wins).toHaveLength(3);
  });

  it('封印目標：A1 已學 360、穩定 300；題庫小時用 90%／75%', () => {
    expect(sealTargets(0, 800)).toEqual({ learn: 360, stable: 300 });
    expect(sealTargets(1, 100)).toEqual({ learn: 90, stable: 75 });
  });

  it('區域掌握度：只算這一區題庫裡的知識點', () => {
    const m = regionMastery(0, { 'w:zzz-not-in-bank': { wins: [0, 1, 2], dueAt: 0 } }, Date.now());
    expect(m.learned).toBe(0);
    expect(m.sealMet).toBe(false);
  });
});

describe('區域試煉', () => {
  it('聽讀說寫各 6 題、同一個知識點不重複，沒看過的優先', () => {
    const qs = trialQuestions(0, () => false, () => 0.5);
    for (const s of TRIAL_SKILLS) {
      const n = qs.filter(q => questionSkill(q) === s).length;
      expect(n).toBeLessThanOrEqual(TRIAL_PER_SKILL);
    }
    expect(new Set(qs.map(knowledgeKey)).size).toBe(qs.length);
  });

  it('空白、缺能力、未答完與不合法成績不可換算成通過', () => {
    for (const strict of [false, true]) {
      expect(trialPassed(emptyTrialScore(), strict)).toBe(false);
      const perSkill = strict ? 10 : 6;
      for (const missing of TRIAL_SKILLS) {
        for (const total of [0, 1, perSkill - 1, perSkill + 1]) {
          const score = emptyTrialScore();
          for (const skill of TRIAL_SKILLS) score[skill] = { correct: perSkill, total: perSkill };
          score[missing] = { correct: total, total };
          expect(trialPassed(score, strict)).toBe(false);
        }
        for (const correct of [-1, perSkill + 0.5, perSkill + 1, NaN, Infinity]) {
          const score = emptyTrialScore();
          for (const skill of TRIAL_SKILLS) score[skill] = { correct: perSkill, total: perSkill };
          score[missing] = { correct, total: perSkill };
          expect(trialPassed(score, strict)).toBe(false);
        }
      }
    }
  });

  it('開考前拒絕缺題型、少一題或重複知識點的題組（普通 24 題、高標準 40 題）', () => {
    const batch24 = TRIAL_SKILLS.flatMap(skill => Array.from({ length: 6 }, (_, i): Question => ({
      type: 'choice', skill, difficulty: 1, desc: `${skill} question ${i}`, ans: 'A', options: ['A. yes', 'B. no'],
    })));
    expect(completeTrial(batch24, false)).toBe(true);
    expect(completeTrial(batch24, true)).toBe(false);
    expect(completeTrial([])).toBe(false);
    expect(completeTrial(batch24.slice(1), false)).toBe(false);
    expect(completeTrial([...batch24.slice(1), batch24[1]], false)).toBe(false);
    expect(completeTrial(batch24.map(q => ({ ...q, skill: 'reading' })), false)).toBe(false);

    const batch40 = TRIAL_SKILLS.flatMap(skill => Array.from({ length: 10 }, (_, i): Question => ({
      type: 'choice', skill, difficulty: 1, desc: `${skill} strict question ${i}`, ans: 'A', options: ['A. yes', 'B. no'],
    })));
    expect(completeTrial(batch40, true)).toBe(true);
    expect(completeTrial(batch40, false)).toBe(false);
    expect(completeTrial(batch40.slice(1), true)).toBe(false);
  });

  it('封印完成普通試煉：18/24、每項 ≥ 4；高標準硬闖試煉：36/40、每項 ≥ 8', () => {
    const scoreNormal = (each: number[]) => {
      const s = emptyTrialScore();
      TRIAL_SKILLS.forEach((k, i) => { s[k] = { correct: each[i], total: 6 }; });
      return s;
    };
    expect(trialPassed(scoreNormal([5, 5, 4, 4]), false)).toBe(true);
    expect(trialPassed(scoreNormal([6, 6, 6, 3]), false)).toBe(false);
    expect(trialPassed(scoreNormal([5, 5, 4, 4]), true)).toBe(false);

    const scoreStrict = (each: number[]) => {
      const s = emptyTrialScore();
      TRIAL_SKILLS.forEach((k, i) => { s[k] = { correct: each[i], total: 10 }; });
      return s;
    };
    expect(trialPassed(scoreStrict([9, 9, 9, 9]), true)).toBe(true);
    expect(trialPassed(scoreStrict([10, 10, 9, 7]), true)).toBe(false);
    expect(trialPassed(scoreStrict([10, 8, 9, 9]), true)).toBe(true);
    expect(trialPassed(scoreStrict([8, 8, 8, 8]), true)).toBe(false); // 32 < 36
    expect(trialPassed(scoreStrict([9, 9, 9, 9]), false)).toBe(false); // total != 6
  });
});

describe('v17 存檔', () => {
  it('圖鑑答對過的字算已學；已開放的區域算打倒過魔王', () => {
    const q = { type: 'spell', desc: '請拼出：書', ans: 'BOOK', speak: 'book' };
    const m = migrateSave({ unlockedIndex: 2, codex: { 'spell:BOOK': { question: q, correct: 2, wrong: 0, firstSeenAt: 100 } } }, 16);
    expect(m.knowledge['w:book'].wins).toEqual([100]);
    expect(m.bossDown).toEqual([0, 1]);
  });

  it('新玩家沒有存檔：不能被當成舊玩家（新手引導、情境提示都要出現）', () => {
    const merged = useSaveStore.persist.getOptions().merge!(undefined, { ...initialSave } as never) as typeof initialSave;
    expect(merged.tutorialDone).toBe(false);
    expect(merged.hintsSeen).toEqual([]);
  });
});

describe('區域試煉的難度分布', () => {
  it('A1 題庫：每種能力難度 1、2、3 各 2 題', () => {
    addBank(0, r0 as BankFile);
    const qs = trialQuestions(0, () => false, () => 0.3);
    expect(qs).toHaveLength(24);
    for (const s of TRIAL_SKILLS) {
      const d = qs.filter(q => questionSkill(q) === s).map(questionDifficulty).sort();
      expect(d).toEqual([1, 1, 2, 2, 3, 3]);
    }
  });

  it('A1 高標準試煉：每種能力 10 題，總共 40 題且無重複知識點', () => {
    addBank(0, r0 as BankFile);
    const qs = trialQuestions(0, () => false, () => 0.3, true);
    expect(qs).toHaveLength(40);
    expect(completeTrial(qs, true)).toBe(true);
    for (const s of TRIAL_SKILLS) {
      const group = qs.filter(q => questionSkill(q) === s);
      expect(group).toHaveLength(10);
    }
  });
});

describe('高標準試煉冷卻', () => {
  it('24 小時內最多 2 次，最早那次滿 24 小時後才能再來', () => {
    const DAY = 24 * HOUR;
    expect(strictTrialWait(undefined, 0)).toBe(0);
    expect(strictTrialWait([0], HOUR)).toBe(0);
    expect(strictTrialWait([0, HOUR], 2 * HOUR)).toBe(DAY - 2 * HOUR);
    expect(strictTrialWait([0, HOUR], DAY)).toBe(0);
  });
});

describe('文法知識點（第八輪）', () => {
  const grammarQ = (desc: string): Question => ({ type: 'choice', skill: 'reading', desc, options: ['A. is', 'B. am', 'C. are', 'D. be'], ans: 'A', grammar: ['be_verb'], grammarReview: 'approved' });

  it('已審核的文法題依主要考點記錄；待審的不算', () => {
    expect(knowledgeKey(grammarQ('【生活文法】He ___ tall.'))).toBe('g:be_verb');
    expect(knowledgeKey({ ...grammarQ('【生活文法】He ___ tall.'), grammarReview: 'pending' })).toMatch(/^q:/);
  });

  it('三天都答對同一題不算穩定，要至少 2 道不同的題', () => {
    let rec: KnowledgeRecord | undefined;
    for (const day of [0, 1, 2]) rec = updateKnowledge(rec, true, true, day * STABLE_GAP, 'same')?.rec ?? rec;
    expect(rec!.wins).toHaveLength(3);
    expect(isStable(rec)).toBe(false);
    rec = updateKnowledge(rec, true, true, 2 * STABLE_GAP + HOUR, 'other')?.rec ?? rec;
    expect(isStable(rec)).toBe(true);
  });

  it('A1 的十個核心文法都有至少 6 題，列入封印', () => {
    addBank(0, r0 as BankFile);
    const m = regionMastery(0, {}, Date.now());
    expect(m.grammarTotal).toBe(10);
    expect(m.grammarStableTarget).toBe(8);
    expect(m.sealMet).toBe(false);
  });

  it('自動標籤：be 動詞、there is、can、第三人稱；字彙題不標', () => {
    const tag = (desc: string, opts: string[], ans: string) => autoGrammarTags({ type: 'choice', desc, options: opts.map((o, i) => `${'ABCD'[i]}. ${o}`), ans });
    expect(tag('【生活文法】She ___ a teacher.', ['is', 'am', 'are', 'be'], 'A')).toEqual(['be_verb']);
    expect(tag('【生活文法】___ two cats.', ['There is', 'There are', 'It is', 'They'], 'B')).toEqual(['there_is_are']);
    expect(tag('【生活文法】He ___ swim.', ['can', 'cans', 'is', 'do'], 'A')[0]).toBe('can_cannot');
    expect(tag('【職場文法】She ___ every day.', ['work', 'works', 'working', 'is work'], 'B')).toEqual(['present_simple_3s']);
    expect(tag('【短文理解】What is it?', ['A cat', 'A dog', 'A bird', 'A fish'], 'A')).toEqual([]);
  });
});


describe('明示詞彙與篇章知識點', () => {
  it('長句跟讀不虛增單字數；四詞固定表達仍可明示為詞彙', () => {
    const sentence: Question = { type: 'voice', skill: 'speaking', difficulty: 3, knowledgeType: 'discourse', desc: '請唸出：我們應核實說法', ans: 'WE SHOULD VERIFY THE CLAIM', speak: 'we should verify the claim' };
    expect(knowledgeKey(sentence)).toMatch(/^q:/);
    const phrase: Question = { ...sentence, difficulty: 2, knowledgeType: 'lexical', desc: '請唸出：應優先處理的事', ans: 'A MATTER OF PRIORITY', speak: 'a matter of priority' };
    expect(knowledgeKey(phrase)).toBe('w:a matter of priority');
    // 舊題仍使用原先推斷，避免不必要地改寫已存在的存檔知識點。
    expect(knowledgeKey({type:'spell',desc:'請拼出：書',ans:'BOOK',speak:'book'})).toBe('w:book');
  });
});
