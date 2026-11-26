import { describe, expect, it } from 'vitest';
import { GATE_LEVEL, GATE_QUESTIONS, PLACEMENT_PER_LEVEL, SKIPPABLE_REGIONS, canChallengeGate, checkQuizAnswer, gateQuestions, placementQuestions } from './placement';
import { REGIONS, regionStageCount } from './regions';
import { clearStoryId, regionStoryId } from './story';
import { SAVE_VERSION, initialSave, migrateSave, useSaveStore } from '../store/saveStore';

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

  it('跳級只開地圖，保留補打區域的劇情與首通', () => {
    useSaveStore.setState({ ...initialSave });
    useSaveStore.getState().skipRegions(2);
    const s = useSaveStore.getState();
    expect(s.unlockedIndex).toBe(2);
    expect(s.player.level).toBe(1);
    expect(s.bestStage[REGIONS[1].id]).toBe(regionStageCount(1) - 1);
    expect(s.storySeen).toEqual([]);
    expect(s.bossDown).toEqual([]);
    expect(s.firstClearXpClaimed).toEqual({});
    expect(s.mapStars).toEqual({});
    expect(s.claimStoryReward(clearStoryId(0))).toBeNull();
    useSaveStore.getState().skipRegions(1); // 不會倒退
    expect(useSaveStore.getState().unlockedIndex).toBe(2);
  });
});

it('舊跳級存檔只收回未擊倒魔王的通關劇情，保留曾領取的獎勵', () => {
  const seen = [regionStoryId(0), clearStoryId(0), regionStoryId(1), clearStoryId(1)];
  const current = migrateSave({
    ...initialSave, unlockedIndex: 2, bossDown: [1], storySeen: seen,
    storyRewardClaimed: [clearStoryId(0)], tickets: 42,
  }, SAVE_VERSION);
  expect(current.storySeen).toEqual([regionStoryId(0), regionStoryId(1), clearStoryId(1)]);
  expect(current.storyRewardClaimed).toEqual([clearStoryId(0)]);
  expect(current.tickets).toBe(42);
  useSaveStore.setState(current);
  const store = useSaveStore.getState();
  store.markStorySeen(clearStoryId(2));
  expect(store.claimStoryReward(clearStoryId(2))).toBeNull();
  expect(store.claimStoryReward(clearStoryId(1))).toEqual({ rewardType: 'ticket', amount: 1 });
  store.defeatRegionBoss(0);
  expect(store.claimStoryReward(clearStoryId(0))).toBeNull();
  expect(useSaveStore.getState().tickets).toBe(43);
  const beforeBossFlags = migrateSave({ ...initialSave, unlockedIndex: 1, storySeen: [clearStoryId(0)] }, 16);
  expect(beforeBossFlags.bossDown).toContain(0);
  expect(beforeBossFlags.storySeen).toContain(clearStoryId(0));
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
