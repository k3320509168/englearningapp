import { beforeEach, describe, expect, it } from 'vitest';
import { useBattleStore } from './battleStore';
import { initialSave, migrateSave, useSaveStore } from './saveStore';
import { LEVELS } from '../game/QuestionData';
import { ASSIST_STREAK, PLAYER_MAX_HP, WRONG_ANSWER_DAMAGE, voiceFallback } from '../game/battle';

const state = () => useBattleStore.getState();

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

const startLevel = (showLessons = false) => {
  useSaveStore.setState({ ...initialSave, settings: { ...initialSave.settings, showLessons } });
  state().startLevel(LEVELS[0]);
};

describe('battleStore', () => {
  beforeEach(() => startLevel());

  it('defeats a normal monster with one correct answer', () => {
    answerCurrent();
    expect(state().phase).toBe('monsterDown');
    expect(state().combo).toBe(1);
    state().nextStage();
    expect(state().stageIdx).toBe(1);
  });

  it('shows feedback, damages the player and records the mistake on a wrong answer', () => {
    answerWrong();
    expect(state().phase).toBe('feedback');
    expect(state().playerHp).toBe(PLAYER_MAX_HP - WRONG_ANSWER_DAMAGE);
    expect(Object.keys(useSaveStore.getState().mistakes)).toHaveLength(1);
    state().continueAfterFeedback();
    expect(state().phase).toBe('answering');
  });

  it('ends in game over after enough wrong answers', () => {
    // 每連錯 3 次援軍就會給一次護盾，所以需要的答錯次數比 HP / 傷害多
    for (let i = 0; i < 30 && state().phase !== 'gameOver'; i++) {
      answerWrong();
      state().continueAfterFeedback();
    }
    expect(state().phase).toBe('gameOver');
  });

  it('clears all 50 stages, shows a summary after each boss, and unlocks the next level', () => {
    let summaries = 0;
    for (let guard = 0; guard < 500 && state().phase !== 'levelClear'; guard++) {
      if (state().phase === 'summary') summaries++;
      if (state().phase === 'monsterDown' || state().phase === 'summary') state().nextStage();
      else answerCurrent();
    }
    expect(state().phase).toBe('levelClear');
    expect(summaries).toBe(4); // 第 10、20、30、40 關；第 50 關直接是通關畫面
    expect(useSaveStore.getState().unlockedIndex).toBe(1);
    expect(state().maxCombo).toBe(50);
  });

  it('converts single-word voice questions to spelling when recognition is unsupported', () => {
    state().startLevel(LEVELS[0], voiceFallback);
    const types = state().stages.flatMap(st => st.questions).map(q => voiceFallback(q).type);
    expect(types).not.toContain('voice');
  });
});

describe('lesson phase', () => {
  it('opens the lesson at stage 1 and 11 when enabled, and starts the battle on demand', () => {
    startLevel(true);
    expect(state().phase).toBe('lesson');
    state().inputLetter('A'); // 預習時不能作答
    expect(state().typed).toBe('');
    state().startBattle();
    expect(state().phase).toBe('answering');
    for (let guard = 0; guard < 100 && state().stageIdx < 10; guard++) {
      if (state().phase === 'monsterDown' || state().phase === 'summary') state().nextStage();
      else answerCurrent();
    }
    expect(state().stageIdx).toBe(10);
    expect(state().phase).toBe('lesson');
  });
});

describe('assist (援軍)', () => {
  beforeEach(() => startLevel());

  it(`appears after ${ASSIST_STREAK} wrong answers in a row, gives a hint and a shield`, () => {
    for (let i = 0; i < ASSIST_STREAK; i++) {
      answerWrong();
      state().continueAfterFeedback();
    }
    const s = state();
    expect(s.assist).not.toBeNull();
    expect(s.shield).toBe(true);
    expect(s.event?.kind).toBe('assist');
    const q = s.question!;
    if (q.type === 'choice') expect(s.assist!.hiddenOptions).toHaveLength(2);
    if (q.type === 'choice') expect(s.assist!.hiddenOptions).not.toContain(q.ans);
    if ((q.type === 'spell' || q.type === 'fill') && q.ans.length > 1) expect(s.typed).toBe(q.ans[0]);

    // 護盾擋下下一次傷害
    const hp = s.playerHp;
    answerWrong();
    expect(state().playerHp).toBe(hp);
    expect(state().shield).toBe(false);
    expect(state().event?.kind).toBe('shield');
  });

  it('resets the wrong streak after a correct answer', () => {
    answerWrong(); state().continueAfterFeedback();
    answerWrong(); state().continueAfterFeedback();
    answerCurrent();
    expect(state().wrongStreak).toBe(0);
  });
});

describe('save migration', () => {
  it('fills new v2 fields and treats existing v1 players as having seen the tutorial', () => {
    const migrated = migrateSave({ unlockedIndex: 2, mistakes: {}, settings: { speechRate: 1.1 } }, 1);
    expect(migrated.unlockedIndex).toBe(2);
    expect(migrated.settings).toEqual({ ...initialSave.settings, speechRate: 1.1 });
    expect(migrated.tutorialDone).toBe(true);
  });

  it('shows the tutorial to brand-new players', () => {
    expect(migrateSave(undefined, 0).tutorialDone).toBe(false);
  });
});
