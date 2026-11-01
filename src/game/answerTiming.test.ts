import { describe, expect, it } from 'vitest';
import { AnswerTiming, answerTiming } from './answerTiming';
import { useBattleStore } from '../store/battleStore';
import { initialSave, useSaveStore } from '../store/saveStore';
import { LEVELS } from './QuestionData';

describe('system time budgets', () => {
  it('pauses only two actual plays, and ends immediately on completion', () => {
    const t = new AnswerTiming();
    const end = t.startAudio(1000);
    expect(t.advance(500)).toBe(500);
    end(); expect(t.advance(500)).toBe(0);
    t.startAudio(1000);
    expect(t.advance(4000)).toBe(3300);
    t.startAudio(1000); expect(t.advance(500)).toBe(0);
  });
  it('third playback advances danger and countdown but is excluded from fast-answer time', () => {
    const t = new AnswerTiming(); t.startAudio(1000)(); t.startAudio(1000)();
    t.startAudio(1000);
    expect(t.step(100)).toEqual({ systemPauseMs: 0, activePauseMs: 100 });
  });
  it('cannot renew permission or recognition waits indefinitely', () => {
    const t = new AnswerTiming();
    t.setWaiting(true); expect(t.advance(10000)).toBe(10000);
    t.setWaiting(false); expect(t.advance(1000)).toBe(0);
    t.setWaiting(true); expect(t.advance(10000)).toBe(5000);
    expect(t.advance(1000)).toBe(0);
  });
  it('old playback completion cannot release a newer play', () => {
    const t = new AnswerTiming(); const oldEnd = t.startAudio(1000);
    t.startAudio(1000); oldEnd(); expect(t.advance(500)).toBe(500);
  });
  it('separates repeated questions and ignores late callbacks from old questions', () => {
    const q = {};
    const a = answerTiming(q, 1); a.setWaiting(true);
    const b = answerTiming(q, 2); expect(b.advance(500)).toBe(0);
    a.setWaiting(false); expect(answerTiming(q, 2)).toBe(b);
  });
});

describe('independent battle clocks', () => {
  const setup = (type: 'choice' | 'spell') => {
    useSaveStore.setState({ ...structuredClone(initialSave), unlockedIndex: 5 });
    useBattleStore.getState().startLevel(LEVELS[5]);
    if (useBattleStore.getState().phase === 'lesson') useBattleStore.getState().startBattle();
    const b = useBattleStore.getState();
    useBattleStore.setState({ enemyGauge: 0, question: { ...b.question!, type }, activeAnswerMs: 0 });
  };
  it('writing slows the gauge to 70%, without slowing its answer countdown', () => {
    setup('choice'); useBattleStore.getState().tick(100);
    const normal = useBattleStore.getState().enemyGauge;
    setup('spell'); const before = useBattleStore.getState().questionLeft;
    useBattleStore.getState().tick(100);
    expect(useBattleStore.getState().enemyGauge).toBeCloseTo(normal * 0.7);
    expect(useBattleStore.getState().questionLeft).toBe(before - 100);
    expect(useBattleStore.getState().activeAnswerMs).toBe(100);
  });
  it('keeps fast-answer time separate from unprotected replay time', () => {
    setup('choice'); const before = useBattleStore.getState().questionLeft;
    useBattleStore.getState().tick(100, 0, 100);
    expect(useBattleStore.getState().activeAnswerMs).toBe(0);
    expect(useBattleStore.getState().questionLeft).toBe(before - 100);
    expect(useBattleStore.getState().enemyGauge).toBeGreaterThan(0);
  });
  it('excludes bounded system waiting from both active time and gauge advancement', () => {
    setup('choice'); const before = useBattleStore.getState().questionLeft;
    useBattleStore.getState().tick(100, 100);
    expect(useBattleStore.getState().enemyGauge).toBe(0);
    expect(useBattleStore.getState().activeAnswerMs).toBe(0);
    expect(useBattleStore.getState().questionLeft).toBe(before);
    useBattleStore.getState().tick(100, 40);
    expect(useBattleStore.getState().activeAnswerMs).toBe(60);
  });
});
