import { describe, expect, it } from 'vitest';
import type { Question } from './types';
import {
  isPlacementReviewDue,
  startPlacementReview,
  answerPlacementReview,
  placementQuestionKey,
  startPlacement,
  REVIEW_DAYS,
  REVIEW_RETRY_HOURS,
  REVIEW_TOTAL_QUESTIONS,
} from './placementTest';
import type { PlacementReviewState } from './placementTest';
import { ADVANCED_REVIEW_READING } from './placementReviewReading';
import { initialSave, migrateSave, SAVE_VERSION, useSaveStore } from '../store/saveStore';

const mockPool: Question[][] = Array.from({ length: 10 }, (_, lv) => [
  ...Array.from({ length: 10 }, (_, i) => ({ type: 'choice' as const, skill: 'reading' as const, desc: `L${lv} r${i}`, ans: 'A', options: ['A. x', 'B. y', 'C. z', 'D. w'] })),
  ...Array.from({ length: 10 }, (_, i) => ({ type: 'choice' as const, skill: 'listening' as const, desc: `🎧 L${lv} l${i}`, speak: 'x', ans: 'A', options: ['A. x', 'B. y', 'C. z', 'D. w'] })),
  ...Array.from({ length: 10 }, (_, i) => ({ type: 'voice' as const, skill: 'speaking' as const, desc: `L${lv} v${i}`, ans: 'X', speak: 'x' })),
  ...Array.from({ length: 10 }, (_, i) => ({ type: 'spell' as const, skill: 'writing' as const, desc: `L${lv} s${i}`, ans: 'X', speak: 'x' })),
]);

describe('7天跳級回顧檢查 (T11 / 二)', () => {
  it('判斷 7 天回顧是否到期', () => {
    const baseTime = 1000000;
    // 未驗證的跳級記錄：不到期
    expect(isPlacementReviewDue({ level: 4, region: 3, at: baseTime, verified: false }, baseTime + 8 * 86_400_000)).toBe(false);

    // 已驗證但未滿 7 天：不到期
    expect(isPlacementReviewDue({ level: 4, region: 3, at: baseTime, verified: true, verifiedAt: baseTime }, baseTime + 6 * 86_400_000)).toBe(false);

    // 已驗證且滿 7 天：到期
    expect(isPlacementReviewDue({ level: 4, region: 3, at: baseTime, verified: true, verifiedAt: baseTime }, baseTime + REVIEW_DAYS * 86_400_000)).toBe(true);

    // 已經通過回顧：不再到期
    expect(isPlacementReviewDue({ level: 4, region: 3, at: baseTime, verified: true, verifiedAt: baseTime, reviewPassed: true }, baseTime + 10 * 86_400_000)).toBe(false);

    // 回顧未通過，未滿 24 小時：不到期
    expect(isPlacementReviewDue({
      level: 4, region: 3, at: baseTime, verified: true, verifiedAt: baseTime, reviewPassed: false, lastReviewAt: baseTime + 7 * 86_400_000,
    }, baseTime + 7 * 86_400_000 + 10 * 3600_000)).toBe(false);

    // 回顧未通過，滿 24 小時：再次到期重測
    expect(isPlacementReviewDue({
      level: 4, region: 3, at: baseTime, verified: true, verifiedAt: baseTime, reviewPassed: false, lastReviewAt: baseTime + 7 * 86_400_000,
    }, baseTime + 7 * 86_400_000 + REVIEW_RETRY_HOURS * 3600_000)).toBe(true);
  });

  it('生成 12 題（聽說讀寫各 3 題）', () => {
    const state = startPlacementReview({ level: 4, speakingVerified: true }, { pool: mockPool, rand: () => 0.5 });
    expect(state.queue).toHaveLength(REVIEW_TOTAL_QUESTIONS);

    const readingCount = state.queue.filter(q => q.type === 'choice' && q.skill === 'reading').length;
    const listeningCount = state.queue.filter(q => q.type === 'choice' && q.skill === 'listening').length;
    const speakingCount = state.queue.filter(q => q.type === 'voice').length;
    const writingCount = state.queue.filter(q => q.type === 'spell' || q.type === 'fill').length;

    expect(readingCount).toBe(3);
    expect(listeningCount).toBe(3);
    expect(speakingCount).toBe(3);
    expect(writingCount).toBe(3);
  });

  it('總分 >= 9 且每項技能 >= 2 判定通過', () => {
    let state: PlacementReviewState = startPlacementReview({ level: 4, speakingVerified: true }, { pool: mockPool, rand: () => 0.5 });
    // 全對答滿 12 題
    for (let i = 0; i < 12; i++) {
      state = answerPlacementReview(state, true);
    }
    expect(state.done).toBe(true);
    expect(state.passed).toBe(true);
    expect(state.weak).toEqual([]);
  });

  it('若總分不足 9 或有單項技能低於 2 題，判定未通過並標註弱項', () => {
    let state: PlacementReviewState = startPlacementReview({ level: 4, speakingVerified: true }, { pool: mockPool, rand: () => 0.5 });
    // 答題：除了 speaking 技能全錯外，其他全部答對（9 題對，3 題錯）
    for (let i = 0; i < 12; i++) {
      const q = state.queue[state.currentIdx];
      const isVoice = q.type === 'voice';
      state = answerPlacementReview(state, !isVoice);
    }
    expect(state.done).toBe(true);
    // 雖然總分 9 題，但 speaking correct = 0 (<2)，因此判定未通過
    expect(state.passed).toBe(false);
    expect(state.weak).toContain('speaking');
  });
});

function finishCorrect(state: PlacementReviewState, skipVoice = false) {
  for (let i = 0; i < state.queue.length; i++) {
    state = answerPlacementReview(state, true, skipVoice && state.queue[i].type === 'voice');
  }
  return state;
}

it('初測題目有紀錄時優先選未見，必要時才補回舊題且不重複', () => {
  const exposed = mockPool[4].filter(q => q.skill === 'reading').slice(0, 8).map(placementQuestionKey);
  const state = startPlacementReview({ level: 4, placementQuestionKeys: exposed }, { pool: mockPool });
  const selected = state.queue.map(placementQuestionKey);
  expect(state.reusedCount).toBe(1);
  expect(selected.filter(key => exposed.includes(key))).toHaveLength(1);
  expect(new Set(selected).size).toBe(12);
});

it('缺整項口說時，即使其他九題全對也無法通過', () => {
  const pool = mockPool.map(list => list.filter(q => q.type !== 'voice'));
  const result = finishCorrect(startPlacementReview({ level: 4 }, { pool, voice: true }));
  expect(result.queue).toHaveLength(9);
  expect(result.passed).toBe(false);
  expect(result.weak).toEqual(['speaking']);
});

it('麥克風中途失敗跳過口說，保留未驗證且不得通過完整複測', () => {
  const result = finishCorrect(startPlacementReview({ level: 4 }, { pool: mockPool, voice: true }), true);
  expect(result.speakingVerified).toBe(false);
  expect(result.scores.speaking.correct).toBe(0);
  expect(result.passed).toBe(false);
});

it.each([1, 7, 8, 9])('正式層級 %i 無麥克風能完成九題，口說保持未驗證', level => {
  const state = startPlacementReview({ level }, { voice: false });
  expect(state.queue).toHaveLength(9);
  expect(state.passTotal).toBe(7);
  const passed = finishCorrect(state);
  expect(passed.passed).toBe(true);
  expect(passed.speakingVerified).toBe(false);
});

it.each([7, 8, 9])('正式層級 %i 的獨立閱讀素材只進複測，且優先使用', level => {
  const [item] = ADVANCED_REVIEW_READING[level]!;
  expect(startPlacement(level, { rand: () => 0.5 }).queue).not.toContain(item);
  expect(startPlacementReview({ level }, { voice: true }).queue).toContain(item);
});

it('存檔往返後保留初測及複測題鍵，舊版與破損清單可讀', () => {
  const placement = { level: 7, region: 6, at: 1, speakingVerified: false, confidence: 'ok' as const, weak: [], verified: true };
  expect(migrateSave({ placement }, SAVE_VERSION).placement?.placementQuestionKeys).toBeUndefined();
  const imported = migrateSave(JSON.parse(JSON.stringify({ placement: { ...placement, placementQuestionKeys: ['a', 1, 'a', 'b'] } })), SAVE_VERSION);
  expect(imported.placement?.placementQuestionKeys).toEqual(['a', 'b']);
  useSaveStore.setState({ ...initialSave, placement: imported.placement });
  useSaveStore.getState().recordPlacementReview(false, ['reading'], ['b', 'c']);
  expect(useSaveStore.getState().placement?.placementQuestionKeys).toEqual(['a', 'b', 'c']);
});
