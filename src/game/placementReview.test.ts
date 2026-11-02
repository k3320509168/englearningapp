import { describe, expect, it } from 'vitest';
import type { Question } from './types';
import {
  isPlacementReviewDue,
  startPlacementReview,
  answerPlacementReview,
  REVIEW_DAYS,
  REVIEW_RETRY_HOURS,
  REVIEW_TOTAL_QUESTIONS,
} from './placementTest';
import type { PlacementReviewState } from './placementTest';

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
