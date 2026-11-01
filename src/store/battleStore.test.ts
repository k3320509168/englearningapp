import { PROLOGUE_KEY } from '../game/stageLayout';
import { beforeEach, describe, expect, it } from 'vitest';
import { FAST_STAGGER } from '../game/enemyPatterns';
import { PLAYER_BASE_MULT } from '../game/party';
import { REVENGE_MAX_QUESTIONS, RUNE_GOLD, setBattleRandom, useBattleStore } from './battleStore';
import { dueMistakes, initialSave, migrateSave, useSaveStore } from './saveStore';
import { LEVELS } from '../game/QuestionData';
import { ASSIST_STREAK, LENIENT_STAGE_COUNT, PLAYER_MAX_HP, QUESTION_LIMIT, questionKey, voiceFallback } from '../game/battle';
import { ELITE_SHIELD, GOLD, SKILL_ENERGY, skillEffect, SRS_INTERVALS, TREASURE_TIME, monsterAttack } from '../game/progression';
import { DEFAULT_CHARACTER } from '../game/character';
import type { Question } from '../game/types';
import { chapterCount, regionStageCount } from '../game/regions';

const state = () => useBattleStore.getState();
const saved = () => useSaveStore.getState();

const answerCurrent = () => {
  const q = state().question!;
  if (q.type === 'choice') state().chooseOption(q.ans);
  else if (q.type === 'voice') state().submitVoice(q.ans);
  else { q.ans.slice(state().typed.length).split('').forEach(ch => state().inputLetter(ch)); state().submitTyped(); }
};

const answerWrong = () => {
  const q = state().question!;
  if (q.type === 'choice') {
    const hidden = state().assist?.hiddenOptions ?? [];
    state().chooseOption(['A', 'B', 'C', 'D'].find(l => l !== q.ans && !hidden.includes(l))!);
  } else if (q.type === 'voice') state().submitVoice('banana');
  else { state().inputLetter(q.ans[state().typed.length] === 'Q' ? 'Z' : 'Q'); state().submitTyped(); }
};

// 一路答對，遇到結算自動往下，直到 stop 條件成立
const playUntil = (stop: () => boolean, guard = 2000) => {
  for (let i = 0; i < guard && !stop(); i++) {
    const s = state();
    if (s.phase === 'monsterDown' || s.phase === 'summary') s.nextStage();
    else if (s.phase === 'lesson') s.startBattle();
    else if (s.phase === 'feedback') s.continueAfterFeedback();
    else answerCurrent();
  }
};

// 預設：劍士主角＋騎士；亂數固定為 0.99（不暴擊、敵人打最後一位）；已看過困難題提示（不觸發第一次固定 ×2 的教學）
const resetSave = (patch: Partial<ReturnType<typeof saved>> = {}) => {
  setBattleRandom(() => 0.99);
  useSaveStore.setState({ ...initialSave, character: DEFAULT_CHARACTER, settings: { ...initialSave.settings, showLessons: false }, hintsSeen: ['boss', 'skill'], ...patch });
};

const startLevel = (patch: Partial<ReturnType<typeof saved>> = {}) => {
  resetSave(patch);
  state().startLevel(LEVELS[0]);
};

describe('battle flow', () => {
  beforeEach(() => startLevel());

  it('needs a few correct answers to defeat the first monster, then earns gold', () => {
    answerCurrent();
    expect(state().phase).toBe('answering');
    expect(state().monsterHp).toBeGreaterThan(0);
    playUntil(() => state().phase === 'monsterDown');
    expect(state().answers.length).toBeGreaterThanOrEqual(2);
    expect(state().runGold).toBeGreaterThanOrEqual(GOLD.kill);
    expect(saved().gold).toBe(state().runGold);
  });

  it('shows feedback, damages the player and records the mistake', () => {
    answerWrong();
    expect(state().phase).toBe('feedback');
    expect(state().playerHp).toBe(state().playerMaxHp - monsterAttack(false, 0, state().stageIdx));
    expect(Object.keys(saved().mistakes)).toHaveLength(1);
    state().continueAfterFeedback();
    expect(state().phase).toBe('answering');
    expect(state().retrying).toBe(true);
  });

  it('ends in game over after enough wrong answers, keeping earned gold', () => {
    playUntil(() => state().phase === 'monsterDown');
    state().nextStage();
    const goldBefore = saved().gold;
    for (let i = 0; i < 40 && state().phase !== 'gameOver'; i++) {
      answerWrong();
      state().continueAfterFeedback();
    }
    expect(state().phase).toBe('gameOver');
    expect(saved().gold).toBe(goldBefore);
  });

  it('clears the whole region (20-stage maps + region boss) with boss summaries; the next region waits for the gatekeeper', () => {
    let summaries = 0;
    for (let i = 0; i < 2000 && state().phase !== 'levelClear'; i++) {
      const s = state();
      if (s.phase === 'summary') { summaries++; s.nextStage(); }
      else if (s.phase === 'monsterDown') s.nextStage();
      else answerCurrent();
    }
    expect(state().phase).toBe('levelClear');
    // 每張三星關卡的第 15、20 關各一次（區域魔王直接通關）
    expect(summaries).toBe(chapterCount(0) * 2);
    // 魔王倒下了，但下一區要等守門人封印＋區域試煉
    expect(saved().bossDown).toContain(0);
    expect(saved().unlockedIndex).toBe(0);
    expect(saved().gold).toBeGreaterThan(GOLD.levelClear);
  });

  it('needs more than one hit on later monsters without Combo', () => {
    playUntil(() => state().stageIdx === 35 && state().phase === 'answering');
    useBattleStore.setState({ combo: 0 });
    answerCurrent();
    expect(state().monsterHp).toBeGreaterThan(0);
    expect(state().phase).toBe('answering');
  });

  it('converts single-word voice questions to spelling when recognition is unsupported', () => {
    state().startLevel(LEVELS[0], voiceFallback);
    const types = state().stages.flatMap(st => st.questions).map(q => voiceFallback(q).type);
    expect(types).not.toContain('voice');
  });
});

describe('party and upgrades', () => {
  it('sums the party HP with upgrades (swordsman ×1.45 protagonist + knight ×1.0)', () => {
    startLevel({ upgrades: { hp: 2, atk: 0, combo: 0, gold: 0 } });
    const hp = PLAYER_MAX_HP + 20;
    expect(state().playerMaxHp).toBe(Math.round(hp * PLAYER_BASE_MULT) + hp);
    expect(state().playerHp).toBe(state().playerMaxHp);
  });

  it('takes turns attacking', () => {
    startLevel();
    answerCurrent();
    const first = state().event?.member;
    answerCurrent();
    expect(state().event?.member).not.toBe(first);
  });

  it('can fight without the protagonist', () => {
    startLevel({ party: ['knight'] });
    expect(state().party.map(m => m.id)).toEqual(['knight']);
  });

  it('loses only when every member is down', () => {
    startLevel();
    for (let i = 0; i < 60 && state().phase !== 'gameOver'; i++) { answerWrong(); state().continueAfterFeedback(); }
    expect(state().phase).toBe('gameOver');
    expect(state().party.every(m => m.hp === 0)).toBe(true);
  });
});

describe('combo timer', () => {
  beforeEach(() => startLevel());

  it('前置區域 P-1～P-9 不計時: time running out changes nothing', () => {
    state().startLevel(PROLOGUE_KEY);
    if (state().phase === 'lesson') state().startBattle();
    useBattleStore.setState({ combo: 5 });
    state().tick(QUESTION_LIMIT + 1);
    expect(state().overtime).toBe(false);
    expect(state().combo).toBe(5);
  });

  it('first 25 stages: a timeout only breaks combo — no damage, no mistake, keep answering', () => {
    state().startLevel(LEVELS[0], undefined, 10);
    if (state().phase === 'lesson') state().startBattle();
    useBattleStore.setState({ combo: 5 });
    state().tick(QUESTION_LIMIT + 1);
    expect(state().phase).toBe('answering');
    expect(state().overtime).toBe(true);
    // 規格 v2.0：超時和答錯一樣只保留一半 combo
    expect(state().combo).toBe(2);
    // A1 是正式規則，行動條會照常累積（敵人可能自己出手）；超時本身不算答錯、不記錯題
    expect(state().feedback).toBeNull();
    expect(Object.keys(saved().mistakes)).toHaveLength(0);
    // 超時後答對：有攻擊，但這題不累積 combo
    answerCurrent();
    expect(state().event?.kind).toBe('attack');
    expect(state().combo).toBe(2);
    expect(state().overtime).toBe(false);
  });

  it('from stage 26 on, a timeout counts as wrong', () => {
    state().startLevel(LEVELS[0], undefined, LENIENT_STAGE_COUNT);
    state().tick(QUESTION_LIMIT + 1);
    expect(state().phase).toBe('feedback');
    expect(state().feedback?.timeout).toBe(true);
    expect(state().playerHp).toBeLessThan(state().playerMaxHp);
    // 看解說時不計時
    const left = state().questionLeft;
    state().tick(5000);
    expect(state().questionLeft).toBe(left);
  });

  it('gives a speed bonus: within 5s x1.5, within 10s x1.2', () => {
    useBattleStore.setState({ monsterHp: 1e9, monsterMaxHp: 1e9 });
    answerCurrent();
    expect(state().event?.fast).toBe(1.5);
    state().tick(7000);
    answerCurrent();
    expect(state().event?.fast).toBe(1.2);
    state().tick(12_000);
    answerCurrent();
    expect(state().event?.fast).toBeUndefined();
  });

  it('enemies only attack on wrong answers', () => {
    for (let i = 0; i < 6; i++) { state().tick(3000); answerCurrent(); playUntil(() => state().phase === 'answering'); }
    expect(state().playerHp).toBe(state().playerMaxHp);
  });
});

describe('stage variations', () => {
  it('elite monsters need 3 correct answers to break the shield; a wrong answer restores one layer', () => {
    startLevel();
    state().startLevel(LEVELS[0], undefined, 4);
    expect(state().stages[4].kind).toBe('elite');
    expect(state().monsterShield).toBe(ELITE_SHIELD);
    const hp = state().monsterHp;
    answerCurrent();
    answerCurrent();
    expect(state().monsterShield).toBe(ELITE_SHIELD - 2);
    expect(state().monsterHp).toBe(hp);
    answerWrong();
    expect(state().monsterShield).toBe(ELITE_SHIELD - 1);
  });

  it('treasure chests never attack, drop gold per hit, and escape when time is up', () => {
    startLevel();
    state().startLevel(LEVELS[0], undefined, 6);
    expect(state().stages[6].kind).toBe('treasure');
    answerWrong();
    expect(state().playerHp).toBe(state().playerMaxHp);
    state().continueAfterFeedback();
    const gold = state().runGold;
    answerCurrent();
    expect(state().runGold).toBeGreaterThan(gold);
    state().tick(TREASURE_TIME);
    expect(state().phase).toBe('monsterDown');
    expect(state().event?.kind).toBe('escape');
  });
});

describe('boss questions', () => {
  beforeEach(() => startLevel());

  it('every 8th question is a boss question; a correct answer multiplies the combo', () => {
    playUntil(() => state().isBossQuestion);
    expect(state().questionCount % 8).toBe(0);
    const before = state().combo;
    answerCurrent(); // 測試的亂數固定 0.99 → 抽到最稀有的 ×10
    expect(state().event?.bossQuestion).toBe(true);
    expect(state().event?.bonus).toEqual({ mult: 10, from: before, to: before * 10 + 1, gain: before * 9 });
    expect(state().combo).toBe(before * 10 + 1);
  });

  it('the very first hard question is a fixed ×2 so new players see how it works', () => {
    startLevel({ hintsSeen: [] });
    playUntil(() => state().isBossQuestion);
    const before = state().combo;
    answerCurrent();
    expect(state().event?.bonus).toEqual({ mult: 2, from: before, to: before * 2 + 1, gain: before });
  });

  it('valor guarantees at least ×3', () => {
    playUntil(() => state().isBossQuestion);
    setBattleRandom(() => 0);
    useBattleStore.setState({ combo: 4, bossBoost: true });
    answerCurrent();
    expect(state().event?.bonus?.mult).toBe(3);
    expect(state().combo).toBe(13);
    expect(state().bossBoost).toBe(false);
  });

  it('prefers past mistakes', () => {
    const q: Question = { type: 'spell', desc: '請拼出：測試', ans: 'MISTAKEWORD' };
    startLevel({ mistakes: { [questionKey(q)]: { question: q, wrongCount: 1, lastWrongAt: 0, box: 0, dueAt: 0 } } });
    // 從 2-1 開始（1-1～1-10 新手關只出選擇題，拼寫的錯題要等之後）
    state().startLevel(LEVELS[0], undefined, 20);
    playUntil(() => state().isBossQuestion);
    expect(state().original?.ans).toBe('MISTAKEWORD');
  });
});

describe('skills', () => {
  beforeEach(() => startLevel());

  const fillEnergy = () => {
    for (let i = 0; i < SKILL_ENERGY + 3 && state().party[0].energy < state().party[0].energyMax; i++) {
      playUntil(() => state().phase === 'answering');
      answerCurrent();
    }
    playUntil(() => state().phase === 'answering');
  };

  it('needs full energy, pauses the clock while confirming, and can be cancelled', () => {
    state().requestSkill(0);
    expect(state().phase).toBe('answering');
    fillEnergy();
    const left = state().questionLeft;
    state().requestSkill(0);
    expect(state().phase).toBe('casting');
    state().tick(1000);
    expect(state().questionLeft).toBe(left);
    // 不會自動關閉：一直等到玩家按施放或取消
    state().tick(60_000);
    expect(state().phase).toBe('casting');
    expect(state().questionLeft).toBe(left);
    state().cancelSkill();
    expect(state().phase).toBe('answering');
    // 取消不會用掉能量，之後還能再放
    expect(state().party[0].energy).toBe(state().party[0].energyMax);
    state().requestSkill(0);
    state().confirmSkill();
    expect(state().party[0].energy).toBe(0);
  });

  it('opening (搶攻) skills are ready from the start', () => {
    // 弓箭手主角的「專注」是搶攻型：一開場能量就是滿的
    startLevel({ character: { ...DEFAULT_CHARACTER, classId: 'archer' } });
    playUntil(() => state().phase === 'answering');
    expect(state().party[0].energy).toBe(state().party[0].energyMax);
    state().requestSkill(0);
    expect(state().phase).toBe('casting');
  });

  it('haste (warrior) adds time to this question', () => {
    startLevel({ character: { ...DEFAULT_CHARACTER, classId: 'warrior' } });
    fillEnergy();
    const left = state().questionLeft;
    state().requestSkill(0);
    state().confirmSkill();
    const m = state().party[0];
    expect(state().questionLeft).toBe(left + skillEffect('haste', m.skillPower).timeThis! * 1000);
    expect(state().party[0].energy).toBe(0);
  });

  it('guard (swordsman) keeps combo and blocks damage on the next mistake', () => {
    fillEnergy();
    const combo = state().combo;
    state().requestSkill(0);
    state().confirmSkill();
    const hp = state().playerHp;
    answerWrong();
    expect(state().combo).toBe(combo);
    expect(state().playerHp).toBe(hp);
  });

  it('amplify (mage) doubles damage for the next hits', () => {
    startLevel({ character: { ...DEFAULT_CHARACTER, classId: 'mage' }, party: ['player'] });
    useBattleStore.setState({ combo: 0, questionCount: 1, monsterHp: 1e9, monsterMaxHp: 1e9, party: state().party.map(m => ({ ...m, energy: SKILL_ENERGY })) });
    const before = state().monsterHp;
    answerCurrent();
    const normal = before - state().monsterHp;
    useBattleStore.setState({ combo: 0 });
    state().requestSkill(0);
    expect(state().phase).toBe('casting');
    state().confirmSkill();
    answerCurrent();
    expect(Math.abs(state().event!.amount! - normal * 2)).toBeLessThanOrEqual(1);
  });

  it('charge skills multiply only the next hit', () => {
    startLevel({ character: { ...DEFAULT_CHARACTER, classId: 'mage' }, party: ['player'] });
    useBattleStore.setState({ combo: 0, questionCount: 1, monsterHp: 1e9, monsterMaxHp: 1e9, critLeft: 0 });
    const before = state().monsterHp;
    answerCurrent();
    const normal = before - state().monsterHp;
    playUntil(() => state().phase === 'answering');
    useBattleStore.setState({ combo: 0, charge: 3 });
    answerCurrent();
    expect(Math.abs(state().event!.amount! - normal * 3)).toBeLessThanOrEqual(2);
    expect(state().charge).toBe(1);
  });
});

describe('items', () => {
  beforeEach(() => startLevel({ items: { potion: 1, hint: 1, shield: 1 } }));

  it('potion heals only when hurt', () => {
    state().consumeItem('potion');
    expect(saved().items.potion).toBe(1);
    answerWrong(); state().continueAfterFeedback();
    expect(state().playerHp).toBeLessThan(state().playerMaxHp);
    state().consumeItem('potion');
    expect(state().playerHp).toBe(state().playerMaxHp);
    expect(saved().items.potion).toBe(0);
  });

  it('shield blocks the next hit', () => {
    state().consumeItem('shield');
    expect(state().shield).toBe(true);
    const hp = state().playerHp;
    answerWrong();
    expect(state().playerHp).toBe(hp);
    expect(saved().items.shield).toBe(0);
  });
});

describe('assist (援軍)', () => {
  beforeEach(() => startLevel());

  it(`appears after ${ASSIST_STREAK} wrong answers in a row with a hint and a shield`, () => {
    for (let i = 0; i < ASSIST_STREAK; i++) { answerWrong(); state().continueAfterFeedback(); }
    expect(state().assist).not.toBeNull();
    expect(state().assistSource).toBe('helper');
    expect(state().shield).toBe(true);
  });
});

describe('revenge boss (SRS)', () => {
  // 用不在 A1 題庫裡的字，避免在一般關卡就被複習掉
  const q1: Question = { type: 'spell', desc: '請拼出：測試一', ans: 'REVENGEONE' };
  const q2: Question = { type: 'spell', desc: '請拼出：測試二', ans: 'REVENGETWO' };

  it('replaces the 15th-stage mini boss with due mistakes and promotes them when answered', () => {
    const now = Date.now();
    startLevel({
      mistakes: {
        [questionKey(q1)]: { question: q1, wrongCount: 1, lastWrongAt: now - 2 * 86_400_000, box: 0, dueAt: now - 1000 },
        [questionKey(q2)]: { question: q2, wrongCount: 1, lastWrongAt: now, box: 0, dueAt: now + 60_000 }, // 還沒到期
      },
    });
    // 從 1-15 開始，避免錯題在前面的困難題就先被複習掉
    state().startLevel(LEVELS[0], undefined, 14);
    const boss = state().stages[14];
    expect(boss.revenge).toBe(true);
    expect(boss.questions.map(q => q.ans)).toEqual(['REVENGEONE']);

    playUntil(() => state().phase === 'summary');
    const m = saved().mistakes[questionKey(q1)];
    expect(m.box).toBe(1);
    expect(m.dueAt).toBeGreaterThanOrEqual(now + SRS_INTERVALS[1]);
    expect(saved().codex[questionKey(q1)].correct).toBeGreaterThan(0);
  });

  it('uses the normal boss when nothing is due', () => {
    startLevel();
    playUntil(() => state().stageIdx === 9);
    expect(state().stages[9].revenge).toBeFalsy();
  });

  it(`limits revenge to ${REVENGE_MAX_QUESTIONS} questions, oldest first`, () => {
    const mistakes = Object.fromEntries(Array.from({ length: 8 }, (_, i) => {
      const q: Question = { type: 'spell', desc: `q${i}`, ans: 'BOOK' + 'X'.repeat(i) };
      return [questionKey(q), { question: q, wrongCount: 1, lastWrongAt: 0, box: 0, dueAt: 100 - i }];
    }));
    const due = dueMistakes(mistakes, Date.now(), REVENGE_MAX_QUESTIONS);
    expect(due).toHaveLength(REVENGE_MAX_QUESTIONS);
    expect(due[0].dueAt).toBe(93);
  });

  it('a correct answer on the same day as the mistake does not count yet; three different days graduate', () => {
    const q: Question = { type: 'spell', desc: '請拼出：測試三', ans: 'REVENGETHREE' };
    const key = questionKey(q);
    const now = Date.now();
    useSaveStore.setState({ mistakes: { [key]: { question: q, wrongCount: 1, lastWrongAt: now, box: 0, dueAt: 0 } } });
    useSaveStore.getState().recordAnswer(q, true, true);
    expect(saved().mistakes[key].box).toBe(0);
    expect(saved().mistakes[key].dueAt).toBeGreaterThanOrEqual(now + SRS_INTERVALS[1]);
    // 之後在不同天答對：1 → 2 → 畢業
    for (const box of [1, 2]) {
      useSaveStore.setState(st => ({ mistakes: { [key]: { ...st.mistakes[key], lastWrongAt: 0, dueAt: 0 } } }));
      useSaveStore.getState().recordAnswer(q, true, true);
      expect(saved().mistakes[key].box).toBe(box);
    }
    useSaveStore.setState(st => ({ mistakes: { [key]: { ...st.mistakes[key], dueAt: 0 } } }));
    useSaveStore.getState().recordAnswer(q, true, true);
    expect(saved().mistakes[key]).toBeUndefined();
  });

  it('mixes in knowledge points that are due for their cross-day review', () => {
    const q: Question = { type: 'spell', desc: '請拼出：重複練習', ans: 'REPEATWORD' };
    startLevel({
      codex: { [questionKey(q)]: { question: q, correct: 1, wrong: 0, firstSeenAt: 0 } },
      knowledge: { 'w:repeatword': { wins: [0], dueAt: 0 } },
    });
    state().startLevel(LEVELS[0], undefined, 20);
    useBattleStore.setState({ monsterHp: 1e9, monsterMaxHp: 1e9 });
    setBattleRandom(() => 0); // 每次都抽中到期複習
    answerCurrent();
    expect(state().original?.ans).toBe('REPEATWORD');
    // 隔了 20 小時以上答對：跨日成功，封印能量 +1
    const gold = saved().gold;
    answerCurrent();
    expect(saved().knowledge['w:repeatword'].wins).toHaveLength(2);
    expect(state().runRunes).toBe(1);
    expect(saved().gold).toBeGreaterThanOrEqual(gold + RUNE_GOLD);
    setBattleRandom(() => 0.99);
  });

  it('due mistakes come least-known first', () => {
    const mk = (ans: string, box: number, dueAt: number) => ({ question: { type: 'spell' as const, desc: ans, ans }, wrongCount: 1, lastWrongAt: 0, box, dueAt });
    const due = dueMistakes({ a: mk('A', 2, 1), b: mk('B', 0, 50), c: mk('C', 1, 2) }, Date.now(), 3);
    expect(due.map(m => m.question.ans)).toEqual(['B', 'C', 'A']);
  });

  it('does not count the retry right after seeing the answer as a review', () => {
    startLevel();
    const original = state().original!;
    answerWrong();
    state().continueAfterFeedback();
    answerCurrent();
    expect(saved().mistakes[questionKey(original)].box).toBe(0);
  });
});

describe('save migration', () => {
  it('upgrades a v2 save: adds economy fields and SRS data', () => {
    const q: Question = { type: 'spell', desc: '請拼出：書本', ans: 'BOOK' };
    const migrated = migrateSave({
      unlockedIndex: 2, tutorialDone: true, settings: { speechRate: 1.1 },
      mistakes: { [questionKey(q)]: { question: q, wrongCount: 2, lastWrongAt: 500 } },
    }, 2);
    // 舊的第 3 區（B1）在九區域順序是第 4 個
    expect(migrated.unlockedIndex).toBe(3);
    expect(migrated.gold).toBe(0);
    expect(migrated.party).toEqual(['player', 'knight']);
    expect(migrated.settings.speechRate).toBe(1.1);
    expect(migrated.mistakes[questionKey(q)]).toMatchObject({ box: 0, dueAt: 500, wrongCount: 2 });
  });

  it('treats v1 players as having seen the tutorial, and new players as not', () => {
    expect(migrateSave({ unlockedIndex: 1 }, 1).tutorialDone).toBe(true);
    expect(migrateSave(undefined, 0).tutorialDone).toBe(false);
  });
});

describe('lesson phase', () => {
  it('opens the lesson at stage 1 and 11 when enabled', () => {
    resetSave({ settings: { ...initialSave.settings, showLessons: true } });
    state().startLevel(LEVELS[0]);
    expect(state().phase).toBe('lesson');
    state().inputLetter('A');
    expect(state().typed).toBe('');
    state().startBattle();
    for (let i = 0; i < 500 && state().stageIdx < 10; i++) {
      const s = state();
      if (s.phase === 'monsterDown' || s.phase === 'summary') s.nextStage();
        else answerCurrent();
    }
    expect(state().stageIdx).toBe(10);
    expect(state().phase).toBe('lesson');
  });
});

describe('stage progress', () => {
  it('saves the current stage and resumes there next time', () => {
    resetSave();
    state().startLevel(LEVELS[0]);
    playUntil(() => state().stageIdx === 4 && state().phase === 'answering');
    expect(saved().levelProgress[LEVELS[0]]).toBe(4);
    state().exitToMap();
    state().startLevel(LEVELS[0]);
    expect(state().stageIdx).toBe(4);
  });

  it('can restart from stage 1 on request, and retries from the stage where the player fell', () => {
    resetSave({ levelProgress: { [LEVELS[0]]: 6 } });
    state().startLevel(LEVELS[0], undefined, 0);
    expect(state().stageIdx).toBe(0);
    playUntil(() => state().stageIdx === 3 && state().phase === 'answering');
    for (let i = 0; i < 40 && state().phase !== 'gameOver'; i++) { answerWrong(); state().continueAfterFeedback(); }
    state().retryLevel();
    expect(state().stageIdx).toBe(3);
    expect(state().playerHp).toBe(state().playerMaxHp);
  });

  it('resets progress after clearing the whole level', () => {
    resetSave();
    state().startLevel(LEVELS[0]);
    playUntil(() => state().phase === 'levelClear');
    expect(saved().levelProgress[LEVELS[0]]).toBe(0);
  });
});

describe('region boss skills', () => {
  const startBoss = (levelIdx: number) => {
    resetSave({ unlockedIndex: levelIdx });
    state().startLevel(LEVELS[levelIdx], undefined, regionStageCount(levelIdx) - 1);
    if (state().phase === 'lesson') state().startBattle();
    useBattleStore.setState({ monsterHp: 1e9, monsterMaxHp: 1e9 });
  };

  it('each region boss has its own skill', () => {
    startBoss(0);
    expect(state().bossSkill).toBe('regrow');
    startBoss(8);
    expect(state().bossSkill).toBe('seal');
  });

  it('A1 tree regrows 10% every 3 questions unless the player answers 5 in a row', () => {
    startBoss(0);
    useBattleStore.setState({ monsterHp: 5e8 });
    for (let i = 0; i < 3; i++) { useBattleStore.setState({ streak: 0 }); answerCurrent(); }
    expect(state().bossCast?.text).toContain('瘋狂生長');
    expect(state().monsterHp).toBeGreaterThan(5e8);
  });

  it('C1 bomb explodes on a wrong answer during the countdown', () => {
    startBoss(7);
    useBattleStore.setState({ bombLeft: 3 });
    const before = state().party.map(m => m.hp);
    answerWrong();
    expect(state().bombLeft).toBe(0);
    expect(state().party.every((m, i) => m.hp < before[i])).toBe(true);
  });

  it('C2 seal blocks skills until 20 correct answers in a row (a huge Bonus combo alone does not break it)', () => {
    startBoss(8);
    useBattleStore.setState({ party: state().party.map(m => ({ ...m, energy: m.energyMax })) });
    state().requestSkill(0);
    expect(state().phase).toBe('answering');
    useBattleStore.setState({ combo: 5000, streak: 3 });
    answerCurrent();
    expect(state().sealed).toBe(true);
    useBattleStore.setState({ streak: 19 });
    answerCurrent();
    expect(state().sealed).toBe(false);
  });
});

describe('talents and finishers', () => {
  it('every member has a talent; the monk player gets lifesteal', () => {
    startLevel({ character: { ...DEFAULT_CHARACTER, classId: 'monk' } });
    expect(state().party[0].talent).toBe('lifesteal');
    expect(state().party.every(m => !!m.talent)).toBe(true);
  });

  it('a monk finisher heals the whole party', () => {
    startLevel({ character: { ...DEFAULT_CHARACTER, classId: 'monk' }, party: ['knight', 'player'] });
    useBattleStore.setState({ monsterHp: 1e9, monsterMaxHp: 1e9, party: state().party.map(m => ({ ...m, hp: Math.round(m.maxHp / 2) })) });
    // 騎士先出手，接著僧侶主角收尾觸發連攜技
    answerCurrent();
    answerCurrent();
    expect(state().event?.finisher).toContain('神聖洗禮');
    expect(state().party.every(m => m.hp > m.maxHp / 2)).toBe(true);
  });
});

describe('gate boss and elite skills (A2+)', () => {
  it('a time thief shortens every question by 5 seconds', () => {
    resetSave({ unlockedIndex: 2 });
    // 第 5 關（index 4）的菁英怪是第一隻，技能是時光小偷；第 10 關（index 9）守門頭目換下一招
    state().startLevel(LEVELS[2], undefined, 4);
    if (state().phase === 'lesson') state().startBattle();
    expect(state().foeSkill).toBe('timeThief');
    expect(state().questionLimit).toBeLessThan(QUESTION_LIMIT);
    state().startLevel(LEVELS[2], undefined, 9);
    expect(state().foeSkill).toBe('hardShell');
  });

  it('A1 and A2 elites have no extra skills', () => {
    resetSave();
    state().startLevel(LEVELS[0], undefined, 4);
    expect(state().foeSkill).toBeNull();
  });
});

describe('enemy attack patterns (action gauge)', () => {
  const startAt = (levelIdx: number, fromStage?: number) => {
    resetSave({ unlockedIndex: levelIdx });
    state().startLevel(LEVELS[levelIdx], undefined, fromStage);
    if (state().phase === 'lesson') state().startBattle();
  };

  it('attacks on its own when the gauge fills, even if the player never answers wrong', () => {
    startAt(4);
    const hp = state().playerHp;
    state().tick(11_000); // 赤岩峽谷的史萊姆約 10 秒集滿（還沒超過 20 秒的答題時間）
    expect(state().event?.kind).toBe('enemyMove');
    expect(state().playerHp).toBeLessThan(hp);
    expect(state().enemyGauge).toBe(0);
  });

  it('A1 1-1~1-10 enemies never attack on their own (onboarding)', () => {
    startAt(0);
    state().tick(60_000);
    expect(state().event?.kind).not.toBe('enemyMove');
    expect(state().enemyGauge).toBe(0);
  });

  it('A1 enemies attack far less often than later regions', () => {
    startAt(0, 60);
    state().tick(10_000);
    expect(state().event?.kind).not.toBe('enemyMove');
    expect(state().enemyGauge).toBeGreaterThan(0);
  });

  it('a correct answer pushes the gauge back, a fast one even more', () => {
    startAt(4);
    useBattleStore.setState({ enemyGauge: 0.6, monsterHp: 1e9, monsterMaxHp: 1e9 });
    answerCurrent(); // 測試裡作答時間是 0，算快答
    expect(state().enemyGauge).toBeCloseTo(0.6 - FAST_STAGGER);
  });

  it('region bosses use their own move list, and a shield blocks a whole move', () => {
    startAt(2, regionStageCount(2) - 1); // 碧藍海岸的深海巨獸：觸手拍擊 → 漩渦 → 噴水連擊
    useBattleStore.setState({ shield: true, enemyGauge: 0.999 });
    state().tick(100);
    expect(state().shield).toBe(false);
    expect(state().event?.kind).toBe('shield');
    useBattleStore.setState({ enemyGauge: 0.999 });
    state().tick(100);
    expect(state().event?.move?.name).toBe('漩渦');
  });

  it('a monk heals the whole party when it attacks', () => {
    startAt(0);
    resetSave({ character: { ...DEFAULT_CHARACTER, classId: 'monk' }, party: ['player', 'knight'] });
    state().startLevel(LEVELS[0]);
    useBattleStore.setState({ monsterHp: 1e9, monsterMaxHp: 1e9, party: state().party.map(m => ({ ...m, hp: Math.round(m.maxHp / 2) })) });
    answerCurrent();
    expect(state().party.every(m => m.hp > m.maxHp / 2)).toBe(true);
  });

  it('golden road has no action gauge', () => {
    resetSave();
    state().startGoldenRoad();
    const hp = state().playerHp;
    state().tick(15_000);
    expect(state().playerHp).toBe(hp);
  });
});

describe('新手引導', () => {
  it('前置區域 P-1～P-3 不累積技能能量；P-4 開場隊長能量直接集滿', () => {
    startLevel({ hintsSeen: [] });
    state().startLevel(PROLOGUE_KEY, undefined, 0);
    for (let i = 0; i < 4; i++) { playUntil(() => state().phase === 'answering'); answerCurrent(); }
    expect(state().party.every(m => m.energy === 0)).toBe(true);
    state().startLevel(PROLOGUE_KEY, undefined, 3);
    if (state().phase === 'lesson') state().startBattle();
    const lead = state().party[0];
    expect(lead.energy).toBe(lead.energyMax);
  });
});

describe('前置區域「失語邊境」', () => {
  it('打完 P-1～P-10：記成通關，不打倒 A1 魔王、不開下一區，也不算三星', () => {
    resetSave({ prologueDone: false });
    state().startLevel(PROLOGUE_KEY);
    expect(state().stages).toHaveLength(10);
    expect(state().levelIdx).toBe(0);
    playUntil(() => state().phase === 'levelClear' || state().phase === 'gameOver', 5000);
    expect(state().phase).toBe('levelClear');
    expect(saved().prologueDone).toBe(true);
    expect(saved().bossDown).not.toContain(0);
    expect(saved().unlockedIndex).toBe(0);
    expect(Object.keys(saved().mapStars).some(k => k.startsWith(PROLOGUE_KEY))).toBe(false);
  });
});

describe('C1：固定敵群與即時結算', () => {
  it('一般關固定五隻，即使未達參考題數也不補怪', () => {
    startLevel();
    expect(state().waves).toBe(5);
    useBattleStore.setState({ monsterHp: 1, monsterMaxHp: 1, minAnswers: 99 });
    for (let i = 0; i < 5; i++) answerCurrent();
    expect(state().phase).toBe('monsterDown');
    expect(state().wave).toBe(5);
    expect(state().waves).toBe(5);
    expect(state().stageAnswers).toBe(5);
    expect(state().bonusLeft).toBe(0);
    expect(state().executing).toBe(false);
  });

  it.each([4, 14, 19])('菁英/首領第%d關首題致命即結算，追擊可跳過且不重發關卡獎勵', stageIdx => {
    startLevel();
    state().startLevel(LEVELS[0], undefined, stageIdx);
    if (state().phase === 'lesson') state().startBattle();
    useBattleStore.setState({ monsterHp: 1, monsterShield: 0, minAnswers: 20, combo: 0 });
    answerCurrent();
    const phase = state().phase;
    expect(['monsterDown', 'summary']).toContain(phase);
    expect(state().monsterHp).toBe(0);
    expect(state().stageAnswers).toBe(1);
    expect(state().stageSubmissions).toBe(1);
    expect(state().bonusLeft).toBe(19);
    expect(state().executing).toBe(false);
    const tickets = saved().tickets;
    const drops = { ...state().runDrops };
    state().startBonus();
    expect(state().bonusRound).toBe(true);
    for (let i = 0; i < 16; i++) answerCurrent();
    expect(state().bonusGold).toBe(60);
    expect(saved().tickets).toBe(tickets);
    expect(state().runDrops).toEqual(drops);
    state().endBonus();
    expect(state().phase).toBe(phase);
    expect(state().executing).toBe(false);
  });

  it('技能不會在零作答時造成敵人傷害或自動通關', () => {
    startLevel();
    useBattleStore.setState({ monsterHp: 1, party: state().party.map(m => ({ ...m, energy: m.energyMax, cooldown: 0 })) });
    for (let i = 0; i < state().party.length; i++) {
      state().requestSkill(i);
      if (state().phase === 'casting') state().confirmSkill();
      expect(state().monsterHp).toBe(1);
      expect(state().stageSubmissions).toBe(0);
      expect(state().phase).toBe('answering');
    }
  });

  it.each([6, 26])('寶箱第%d關倒數與自動超時不能零作答通關；真實提交後逃走', stageIdx => {
    startLevel();
    state().startLevel(LEVELS[0], undefined, stageIdx);
    state().tick(TREASURE_TIME + QUESTION_LIMIT);
    if (state().phase === 'feedback') state().continueAfterFeedback();
    expect(state().phase).toBe('answering');
    expect(state().treasureLeft).toBe(0);
    expect(state().stageSubmissions).toBe(0);
    answerCurrent();
    expect(state().phase).toBe('monsterDown');
    expect(state().event?.kind).toBe('escape');
    expect(state().stageSubmissions).toBe(1);
  });
});


describe('C3：處決不代替實際傷害', () => {
  it('即使Combo和舊條件足夠，非致命傷害仍不會強制擊殺', () => {
    startLevel();
    state().startLevel(LEVELS[0], undefined, 19);
    useBattleStore.setState({ monsterHp: 1e12, monsterMaxHp: 1e12, combo: 5000, streak: 20, stageAnswers: 20, stageHits: 20 });
    answerCurrent();
    expect(state().phase).toBe('answering');
    expect(state().monsterHp).toBeGreaterThan(0);
    expect(state().event?.slain).toBeFalsy();
    expect(state().executing).toBe(false);
  });
  it('沉默君王首題致命即可結束，M12無免死或最後一題', () => {
    startLevel();
    state().startLevel(LEVELS[8], undefined, regionStageCount(8) - 1);
    useBattleStore.setState({ monsterHp: 1, monsterShield: 0, combo: 300, streak: 0, minAnswers: 40 });
    answerCurrent();
    expect(state().phase).toBe('levelClear');
    expect(state().monsterHp).toBe(0);
    expect(state().stageAnswers).toBe(1);
    expect(state().event?.slain).toBe(true);
    expect(state().event?.execution).toBeFalsy();
    expect(state().mods.every(m => m.phase !== 'active' && m.phase !== 'idle')).toBe(true);
  });
});
