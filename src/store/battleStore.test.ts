import { beforeEach, describe, expect, it } from 'vitest';
import { useBattleStore } from './battleStore';
import { useSaveStore } from './saveStore';
import { LEVELS } from '../game/QuestionData';
import { PLAYER_MAX_HP, WRONG_ANSWER_DAMAGE, voiceFallback } from '../game/battle';

const answerCurrent = () => {
  const s = useBattleStore.getState();
  const q = s.question!;
  if (q.type === 'choice') s.chooseOption(q.ans);
  else if (q.type === 'voice') s.submitVoice(q.ans);
  else q.ans.split('').forEach(ch => useBattleStore.getState().inputLetter(ch));
};

const answerWrong = () => {
  const s = useBattleStore.getState();
  const q = s.question!;
  if (q.type === 'choice') s.chooseOption(['A', 'B', 'C', 'D'].find(l => l !== q.ans)!);
  else if (q.type === 'voice') s.submitVoice('banana');
  else s.inputLetter(q.ans[0] === 'Q' ? 'Z' : 'Q');
};

describe('battleStore', () => {
  beforeEach(() => {
    useSaveStore.setState({ unlockedIndex: 0, mistakes: {} });
    useBattleStore.getState().startLevel(LEVELS[0]);
  });

  it('defeats a normal monster with one correct answer', () => {
    answerCurrent();
    const s = useBattleStore.getState();
    expect(s.phase).toBe('monsterDown');
    expect(s.combo).toBe(1);
    s.nextStage();
    expect(useBattleStore.getState().stageIdx).toBe(1);
  });

  it('shows feedback, damages the player and records the mistake on a wrong answer', () => {
    answerWrong();
    const s = useBattleStore.getState();
    expect(s.phase).toBe('feedback');
    expect(s.playerHp).toBe(PLAYER_MAX_HP - WRONG_ANSWER_DAMAGE);
    expect(Object.keys(useSaveStore.getState().mistakes)).toHaveLength(1);
    s.continueAfterFeedback();
    expect(useBattleStore.getState().phase).toBe('answering');
  });

  it('ends in game over after enough wrong answers', () => {
    for (let i = 0; i < PLAYER_MAX_HP / WRONG_ANSWER_DAMAGE; i++) {
      answerWrong();
      useBattleStore.getState().continueAfterFeedback();
    }
    expect(useBattleStore.getState().phase).toBe('gameOver');
  });

  it('clears all 50 stages and unlocks the next level', () => {
    for (let guard = 0; guard < 500 && useBattleStore.getState().phase !== 'levelClear'; guard++) {
      if (useBattleStore.getState().phase === 'monsterDown') useBattleStore.getState().nextStage();
      else answerCurrent();
    }
    expect(useBattleStore.getState().phase).toBe('levelClear');
    expect(useSaveStore.getState().unlockedIndex).toBe(1);
  });

  it('converts single-word voice questions to spelling when recognition is unsupported', () => {
    useBattleStore.getState().startLevel(LEVELS[0], voiceFallback);
    const types = useBattleStore.getState().stages.flatMap(st => st.questions).map(q => voiceFallback(q).type);
    expect(types).not.toContain('voice');
  });
});
