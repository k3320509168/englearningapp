import { beforeEach, describe, expect, it } from 'vitest';
import { REVENGE_MAX_QUESTIONS, setBattleRandom, useBattleStore } from './battleStore';
import { dueMistakes, initialSave, migrateSave, useSaveStore } from './saveStore';
import { LEVELS } from '../game/QuestionData';
import { ASSIST_STREAK, CAST_CONFIRM_TIME, LENIENT_STAGE_COUNT, PLAYER_MAX_HP, QUESTION_LIMIT, questionKey, voiceFallback } from '../game/battle';
import { ELITE_SHIELD, GOLD, SKILL_ENERGY, skillEffect, SRS_INTERVALS, TREASURE_TIME, monsterAttack } from '../game/progression';
import { DEFAULT_CHARACTER } from '../game/character';
import type { Question } from '../game/types';

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

// 預設：劍士主角＋騎士；亂數固定為 0.99（不暴擊、敵人打最後一位）
const resetSave = (patch: Partial<ReturnType<typeof saved>> = {}) => {
  setBattleRandom(() => 0.99);
  useSaveStore.setState({ ...initialSave, character: DEFAULT_CHARACTER, settings: { ...initialSave.settings, showLessons: false }, ...patch });
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

  it('clears all 50 stages with boss summaries, then unlocks the next level', () => {
    let summaries = 0;
    for (let i = 0; i < 2000 && state().phase !== 'levelClear'; i++) {
      const s = state();
      if (s.phase === 'summary') { summaries++; s.nextStage(); }
      else if (s.phase === 'monsterDown') s.nextStage();
      else answerCurrent();
    }
    expect(state().phase).toBe('levelClear');
    expect(summaries).toBe(4);
    expect(saved().unlockedIndex).toBe(1);
    expect(saved().gold).toBeGreaterThan(GOLD.levelClear);
  });

  it('needs more than one hit on later monsters without Combo', () => {
    playUntil(() => state().stageIdx === 35 && state().phase === 'answering');
    useBattleStore.setState({ combo: 0, bossMult: 1 });
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
  it('sums the party HP with upgrades (swordsman x1.0 + knight x1.0)', () => {
    startLevel({ upgrades: { hp: 2, atk: 0, combo: 0, gold: 0 } });
    const hp = PLAYER_MAX_HP + 20;
    expect(state().playerMaxHp).toBe(hp * 2);
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

  it('first 25 stages: a timeout only breaks combo — no damage, no mistake, keep answering', () => {
    useBattleStore.setState({ combo: 5 });
    state().tick(QUESTION_LIMIT + 1);
    expect(state().phase).toBe('answering');
    expect(state().overtime).toBe(true);
    expect(state().combo).toBe(0);
    expect(state().playerHp).toBe(state().playerMaxHp);
    expect(Object.keys(saved().mistakes)).toHaveLength(0);
    // 超時後答對：有攻擊，但這題不累積 combo
    answerCurrent();
    expect(state().event?.kind).toBe('attack');
    expect(state().combo).toBe(0);
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

  it('every 5th question is a boss question; multipliers chain x2 then x3', () => {
    playUntil(() => state().isBossQuestion);
    expect(state().questionCount % 5).toBe(0);
    answerCurrent();
    expect(state().bossMult).toBe(2);
    expect(state().event?.bossQuestion).toBe(true);
    playUntil(() => state().isBossQuestion);
    answerCurrent();
    expect(state().bossMult).toBe(6);
  });

  it('a wrong answer resets combo and the multiplier', () => {
    playUntil(() => state().isBossQuestion);
    answerCurrent();
    playUntil(() => state().phase === 'answering' && !state().isBossQuestion);
    answerWrong();
    expect(state().combo).toBe(0);
    expect(state().bossMult).toBe(1);
  });

  it('prefers past mistakes', () => {
    const q: Question = { type: 'spell', desc: '請拼出：測試', ans: 'MISTAKEWORD' };
    startLevel({ mistakes: { [questionKey(q)]: { question: q, wrongCount: 1, lastWrongAt: 0, box: 0, dueAt: 0 } } });
    playUntil(() => state().isBossQuestion);
    expect(state().original?.ans).toBe('MISTAKEWORD');
  });
});

describe('skills', () => {
  beforeEach(() => startLevel());

  const fillEnergy = () => {
    for (let i = 0; i < SKILL_ENERGY; i++) {
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
    state().tick(CAST_CONFIRM_TIME);
    expect(state().phase).toBe('answering');
    expect(state().party[0].energy).toBe(SKILL_ENERGY);
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

  it('replaces the stage 10 boss with due mistakes and promotes them when answered', () => {
    const now = Date.now();
    startLevel({
      mistakes: {
        [questionKey(q1)]: { question: q1, wrongCount: 1, lastWrongAt: now - 2 * 86_400_000, box: 0, dueAt: now - 1000 },
        [questionKey(q2)]: { question: q2, wrongCount: 1, lastWrongAt: now, box: 0, dueAt: now + 60_000 }, // 還沒到期
      },
    });
    // 從第 10 關開始，避免錯題在前面的魔王題就先被複習掉
    state().startLevel(LEVELS[0], undefined, 9);
    const boss = state().stages[9];
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

  it('mixes in learned-but-not-mastered words now and then', () => {
    const q: Question = { type: 'spell', desc: '請拼出：重複練習', ans: 'REPEATWORD' };
    startLevel({ codex: { [questionKey(q)]: { question: q, correct: 1, wrong: 0, firstSeenAt: 0 } } });
    useBattleStore.setState({ monsterHp: 1e9, monsterMaxHp: 1e9 });
    setBattleRandom(() => 0); // 每次都抽中重複練習
    answerCurrent();
    // 抽到的是答對過、還沒熟練的字（剛答對的那題或 REPEATWORD）
    const c = saved().codex[questionKey(state().original!)];
    expect(c.correct).toBeGreaterThan(0);
    expect(c.correct).toBeLessThan(5);
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

describe('enemy assaults (A2+)', () => {
  const startAt = (levelIdx: number) => {
    resetSave({ unlockedIndex: levelIdx });
    state().startLevel(LEVELS[levelIdx]);
    if (state().phase === 'lesson') state().startBattle();
    // 不讓怪物倒下，專心看蓄力
    useBattleStore.setState({ monsterHp: 1e9, monsterMaxHp: 1e9 });
  };
  const untilCharging = () => {
    for (let i = 0; i < 10 && !state().charging; i++) answerCurrent();
  };

  it('A1 and A2 never charge', () => {
    startAt(1);
    for (let i = 0; i < 8; i++) answerCurrent();
    expect(state().charging).toBe(false);
  });

  it('A2+: a fast correct answer interrupts and stuns (next hit ×1.5)', () => {
    startAt(2);
    untilCharging();
    expect(state().charging).toBe(true);
    const hp = state().playerHp;
    answerCurrent(); // 測試裡作答時間是 0，算快答
    expect(state().event?.interrupted).toBe(true);
    expect(state().charge).toBe(1.5);
    expect(state().playerHp).toBe(hp);
  });

  it('A2+: a slow correct answer still takes the charged hit; a wrong answer takes 1.5×', () => {
    startAt(2);
    untilCharging();
    useBattleStore.setState({ questionLeft: state().questionLimit - 8000 });
    const hp = state().playerHp;
    answerCurrent();
    expect(state().event?.counter?.amount).toBe(monsterAttack(false, 2, 0));
    expect(state().playerHp).toBe(hp - monsterAttack(false, 2, 0));

    untilCharging();
    const before = state().playerHp;
    answerWrong();
    expect(before - state().playerHp).toBe(Math.round(monsterAttack(false, 2, 0) * 1.5));
  });
});

describe('region boss skills', () => {
  const startBoss = (levelIdx: number) => {
    resetSave({ unlockedIndex: levelIdx });
    state().startLevel(LEVELS[levelIdx], undefined, 49);
    if (state().phase === 'lesson') state().startBattle();
    useBattleStore.setState({ monsterHp: 1e9, monsterMaxHp: 1e9 });
  };

  it('each region boss has its own skill', () => {
    startBoss(0);
    expect(state().bossSkill).toBe('regrow');
    startBoss(8);
    expect(state().bossSkill).toBe('seal');
  });

  it('A1 tree regrows 10% every 3 questions unless combo is 5+', () => {
    startBoss(0);
    useBattleStore.setState({ monsterHp: 5e8 });
    for (let i = 0; i < 3; i++) { useBattleStore.setState({ combo: 0 }); answerCurrent(); }
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

  it('C2 seal blocks skills until 50 combo', () => {
    startBoss(8);
    useBattleStore.setState({ party: state().party.map(m => ({ ...m, energy: SKILL_ENERGY })) });
    state().requestSkill(0);
    expect(state().phase).toBe('answering');
    useBattleStore.setState({ combo: 49 });
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
