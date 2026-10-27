import { beforeEach, describe, expect, it } from 'vitest';
import { REVENGE_MAX_QUESTIONS, useBattleStore } from './battleStore';
import { dueMistakes, initialSave, migrateSave, useSaveStore } from './saveStore';
import { LEVELS } from '../game/QuestionData';
import { ASSIST_STREAK, PLAYER_MAX_HP, questionKey, voiceFallback } from '../game/battle';
import { BUFF_EVERY, GOLD, POTION_HEAL, SRS_INTERVALS, monsterAttack } from '../game/progression';
import type { Question } from '../game/types';

const state = () => useBattleStore.getState();
const saved = () => useSaveStore.getState();

const answerCurrent = () => {
  const q = state().question!;
  if (q.type === 'choice') state().chooseOption(q.ans);
  else if (q.type === 'voice') state().submitVoice(q.ans);
  else q.ans.slice(state().typed.length).split('').forEach(ch => state().inputLetter(ch));
};

const answerWrong = () => {
  const q = state().question!;
  if (q.type === 'choice') {
    const hidden = state().assist?.hiddenOptions ?? [];
    state().chooseOption(['A', 'B', 'C', 'D'].find(l => l !== q.ans && !hidden.includes(l))!);
  } else if (q.type === 'voice') state().submitVoice('banana');
  else state().inputLetter(q.ans[state().typed.length] === 'Q' ? 'Z' : 'Q');
};

// 一路答對，遇到結算／Buff 自動往下，直到 stop 條件成立
const playUntil = (stop: () => boolean, guard = 2000) => {
  for (let i = 0; i < guard && !stop(); i++) {
    const s = state();
    if (s.phase === 'monsterDown' || s.phase === 'summary') s.nextStage();
    else if (s.phase === 'buff') s.pickBuff(s.buffChoices[0]);
    else if (s.phase === 'lesson') s.startBattle();
    else if (s.phase === 'feedback') s.continueAfterFeedback();
    else answerCurrent();
  }
};

const resetSave = (patch: Partial<ReturnType<typeof saved>> = {}) => {
  useSaveStore.setState({ ...initialSave, settings: { ...initialSave.settings, showLessons: false }, ...patch });
};

const startLevel = (patch: Partial<ReturnType<typeof saved>> = {}) => {
  resetSave(patch);
  state().startLevel(LEVELS[0]);
};

describe('battle flow', () => {
  beforeEach(() => startLevel());

  it('defeats the first monster with one correct answer and earns gold', () => {
    answerCurrent();
    expect(state().phase).toBe('monsterDown');
    expect(state().runGold).toBe(GOLD.correct + GOLD.kill);
    expect(saved().gold).toBe(GOLD.correct + GOLD.kill);
  });

  it('shows feedback, damages the player and records the mistake', () => {
    answerWrong();
    expect(state().phase).toBe('feedback');
    expect(state().playerHp).toBe(state().playerMaxHp - monsterAttack(false));
    expect(Object.keys(saved().mistakes)).toHaveLength(1);
    state().continueAfterFeedback();
    expect(state().phase).toBe('answering');
    expect(state().retrying).toBe(true);
  });

  it('ends in game over after enough wrong answers, keeping earned gold', () => {
    answerCurrent();
    state().nextStage();
    const goldBefore = saved().gold;
    for (let i = 0; i < 40 && state().phase !== 'gameOver'; i++) {
      answerWrong();
      state().continueAfterFeedback();
    }
    expect(state().phase).toBe('gameOver');
    expect(saved().gold).toBe(goldBefore);
  });

  it('clears all 50 stages with buffs and boss summaries, then unlocks the next level', () => {
    let summaries = 0;
    let buffs = 0;
    for (let i = 0; i < 2000 && state().phase !== 'levelClear'; i++) {
      const s = state();
      if (s.phase === 'summary') { summaries++; s.nextStage(); }
      else if (s.phase === 'buff') { buffs++; s.pickBuff(s.buffChoices[0]); }
      else if (s.phase === 'monsterDown') s.nextStage();
      else answerCurrent();
    }
    expect(state().phase).toBe('levelClear');
    expect(summaries).toBe(4);
    expect(buffs).toBe(Math.floor(45 / BUFF_EVERY));
    expect(saved().unlockedIndex).toBe(1);
    expect(saved().gold).toBeGreaterThan(GOLD.levelClear);
  });

  it('needs more than one hit on later monsters without Combo or buffs', () => {
    playUntil(() => state().stageIdx === 35 && state().phase === 'answering');
    useBattleStore.setState({ combo: 0, buffs: [] });
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

describe('heroes and upgrades', () => {
  it('applies the knight HP bonus and HP upgrades', () => {
    startLevel({ hero: 'knight', upgrades: { hp: 2, atk: 0, combo: 0, gold: 0 } });
    expect(state().playerMaxHp).toBe(PLAYER_MAX_HP + 20 + 20);
    expect(state().playerHp).toBe(state().playerMaxHp);
  });
});

describe('buffs', () => {
  it(`offers 3 buffs after every ${BUFF_EVERY} normal kills and applies instant heal`, () => {
    startLevel();
    answerWrong(); state().continueAfterFeedback();
    playUntil(() => state().phase === 'buff');
    expect(state().stageIdx).toBe(BUFF_EVERY - 1);
    expect(state().buffChoices).toHaveLength(3);
    useBattleStore.setState({ buffChoices: ['heal', 'power', 'sniper'] });
    const hp = state().playerHp;
    state().pickBuff('heal');
    expect(state().playerHp).toBeGreaterThan(hp);
    expect(state().buffs).not.toContain('heal');
    expect(state().stageIdx).toBe(BUFF_EVERY);
  });
});

describe('items', () => {
  beforeEach(() => startLevel({ items: { potion: 1, hint: 1, shield: 1 } }));

  it('potion heals only when hurt', () => {
    state().consumeItem('potion');
    expect(saved().items.potion).toBe(1);
    answerWrong(); state().continueAfterFeedback();
    const hp = state().playerHp;
    state().consumeItem('potion');
    expect(state().playerHp).toBe(Math.min(state().playerMaxHp, hp + POTION_HEAL));
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
        [questionKey(q1)]: { question: q1, wrongCount: 1, lastWrongAt: now, box: 0, dueAt: now - 1000 },
        [questionKey(q2)]: { question: q2, wrongCount: 1, lastWrongAt: now, box: 0, dueAt: now + 60_000 }, // 還沒到期
      },
    });
    playUntil(() => state().stageIdx === 9);
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
    expect(migrated.unlockedIndex).toBe(2);
    expect(migrated.gold).toBe(0);
    expect(migrated.hero).toBe('knight');
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
      else if (s.phase === 'buff') s.pickBuff(s.buffChoices[0]);
      else answerCurrent();
    }
    expect(state().stageIdx).toBe(10);
    expect(state().phase).toBe('lesson');
  });
});
