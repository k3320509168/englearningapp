import { describe, expect, it } from 'vitest';
import { GATE_LEVEL, GATE_QUESTIONS, PLACEMENT_PER_LEVEL, SKIPPABLE_REGIONS, canChallengeGate, checkQuizAnswer, gateQuestions, placementQuestions } from './placement';
import { REGIONS } from './regions';
import { initialSave, useSaveStore } from '../store/saveStore';

describe('跳級：守門試煉與程度測驗', () => {
  it('守門試煉需要等級門檻，最後一個區域不能跳過', () => {
    expect(canChallengeGate(0, GATE_LEVEL[0] - 1)).toBe(false);
    expect(canChallengeGate(0, GATE_LEVEL[0])).toBe(true);
    expect(canChallengeGate(SKIPPABLE_REGIONS, 60)).toBe(false);
  });

  it('出題數正確，而且不會出需要麥克風的題目', () => {
    for (let r = 0; r < SKIPPABLE_REGIONS; r++) {
      const g = gateQuestions(r);
      expect(g).toHaveLength(GATE_QUESTIONS);
      expect(g.every(q => q.type !== 'voice')).toBe(true);
      expect(placementQuestions(r)).toHaveLength(PLACEMENT_PER_LEVEL);
    }
  });

  it('填空可以只填空格，也可以打完整個字', () => {
    const q = { type: 'fill', desc: '填空題：H _ U S E (房子)', ans: 'O', speak: 'house' };
    expect(checkQuizAnswer(q, 'o')).toBe(true);
    expect(checkQuizAnswer(q, 'House')).toBe(true);
    expect(checkQuizAnswer(q, 'a')).toBe(false);
    expect(checkQuizAnswer({ type: 'choice', desc: '', ans: 'B', options: [] }, 'B')).toBe(true);
  });

  it('跳過的區域算通關、地圖全開、劇情記為看過，但不給等級', () => {
    useSaveStore.setState({ ...initialSave });
    useSaveStore.getState().skipRegions(2);
    const s = useSaveStore.getState();
    expect(s.unlockedIndex).toBe(2);
    expect(s.player.level).toBe(1);
    expect(s.bestStage[REGIONS[1].id]).toBe(REGIONS[1].maps.length * 10 - 1);
    expect(s.storySeen).toEqual(expect.arrayContaining(['region-0', 'clear-0', 'region-1', 'clear-1']));
    expect(s.storySeen).not.toContain('region-2');
    useSaveStore.getState().skipRegions(1); // 不會倒退
    expect(useSaveStore.getState().unlockedIndex).toBe(2);
  });
});

describe('程度測驗的上限', () => {
  it('最遠建議從熔岩魔域開始', async () => {
    const { PLACEMENT_MAX_START } = await import('./placement');
    expect(REGIONS[PLACEMENT_MAX_START].name).toBe('熔岩魔域');
  });
});

describe('測驗的同義寫法（M4）', () => {
  it('程度測驗、守門試煉和戰鬥用同一套判定', () => {
    const q = { type: 'spell', desc: '請拼出：謝謝', ans: 'THANK', spellAccept: ['THANKS'] };
    expect(checkQuizAnswer(q, 'thanks')).toBe(true);
    expect(checkQuizAnswer({ type: 'spell', desc: '請拼出：開始', ans: 'START' }, 'star')).toBe(false);
  });
});
