import { describe, expect, it } from 'vitest';
import { WHEEL_PRIZES, rollWheel, wheelExpectedTickets, wheelKey } from './wheel';
import { initialSave, useSaveStore } from '../store/saveStore';
import { setBattleRandom, useBattleStore } from '../store/battleStore';
import { DEFAULT_CHARACTER } from './character';
import { LEVELS } from './QuestionData';

describe('獎勵轉盤', () => {
  it('機率總和 100%，每轉期望約 1.1 張召喚券', () => {
    expect(WHEEL_PRIZES.reduce((s, p) => s + p.weight, 0)).toBe(100);
    expect(wheelExpectedTickets()).toBeCloseTo(1.1, 2);
  });

  it('連續 2 次銘謝惠顧後，下一次一定有獎', () => {
    expect(WHEEL_PRIZES[rollWheel(() => 0, 0)].id).toBe('none');
    expect(WHEEL_PRIZES[rollWheel(() => 0, 2)].id).not.toBe('none');
    expect(WHEEL_PRIZES[rollWheel(() => 0.999, 0)].id).toBe('t5');
  });

  it('同一關只給一次轉盤；轉完獎品直接入帳', () => {
    useSaveStore.setState({ ...initialSave });
    const s = () => useSaveStore.getState();
    expect(s().grantWheel('A1#4')).toBe(true);
    expect(s().grantWheel('A1#4')).toBe(false);
    expect(s().wheelPending).toBe(1);
    const before = s().tickets;
    const idx = s().spinWheel(() => 0.5); // 召喚券 ×1 那一格
    expect(WHEEL_PRIZES[idx].id).toBe('t1');
    expect(s().tickets).toBe(before + 1);
    expect(s().wheelPending).toBe(0);
    expect(s().spinWheel()).toBe(-1);
  });

  it('第一次破第 5 關（菁英）拿到一次轉盤，重打不再給', () => {
    setBattleRandom(() => 0.99);
    useSaveStore.setState({ ...initialSave, character: DEFAULT_CHARACTER, hintsSeen: ['boss', 'skill'], settings: { ...initialSave.settings, showLessons: false } });
    const st = () => useBattleStore.getState();
    const play = () => {
      st().startLevel(LEVELS[0], undefined, 4);
      if (st().phase === 'lesson') st().startBattle();
      for (let i = 0; i < 60 && st().phase !== 'monsterDown'; i++) {
        const q = st().question;
        if (st().phase !== 'answering' || !q) { if (st().phase === 'feedback') st().continueAfterFeedback(); continue; }
        useBattleStore.setState({ monsterShield: 0 });
        if (q.type === 'choice') st().chooseOption(q.ans);
        else if (q.type === 'voice') st().submitVoice(q.ans);
        else { q.ans.slice(st().typed.length).split('').forEach(c => st().inputLetter(c)); st().submitTyped(); }
      }
    };
    play();
    expect(useSaveStore.getState().wheelClaimed).toContain(wheelKey(LEVELS[0], 4));
    expect(useSaveStore.getState().wheelPending).toBe(1);
    play();
    expect(useSaveStore.getState().wheelPending).toBe(1);
  });
});
