import { describe, expect, it } from 'vitest';
import type { Question } from './types';
import { MAX_PROBE_QUESTIONS, PLACEMENT_LEVELS, answerPlacement, answeredCount, currentQuestion, maxTestable, startPlacement } from './placementTest';
import type { PlacementState } from './placementTest';

// 假題庫：每個層級聽讀各 12、口說 6、寫作 6，desc 帶層級方便模擬作答
const pool: Question[][] = PLACEMENT_LEVELS.map((_, lv) => [
  ...Array.from({ length: 12 }, (_, i) => ({ type: 'choice', skill: 'reading' as const, desc: `L${lv} r${i}`, ans: 'A', options: ['A. x', 'B. y', 'C. z', 'D. w'] })),
  ...Array.from({ length: 12 }, (_, i) => ({ type: 'choice', skill: 'listening' as const, desc: `🎧 L${lv} l${i}`, speak: 'x', ans: 'A', options: ['A. x', 'B. y', 'C. z', 'D. w'] })),
  ...Array.from({ length: 6 }, (_, i) => ({ type: 'voice', skill: 'speaking' as const, desc: `L${lv} v${i}`, ans: 'X', speak: 'x' })),
  ...Array.from({ length: 6 }, (_, i) => ({ type: 'spell', skill: 'writing' as const, desc: `L${lv} s${i}`, ans: 'X', speak: 'x' })),
]);
const levelOfQ = (q: Question) => Number(q.desc.match(/L(\d)/)![1]);

function run(trueLevel: number, rand: () => number, opts: { voice?: boolean; start?: number } = {}) {
  let s: PlacementState = startPlacement(opts.start, { pool, rand, voice: opts.voice, now: 0 });
  for (let i = 0; i < 60 && s.phase !== 'done'; i++) {
    const q = currentQuestion(s)!;
    const p = levelOfQ(q) <= trueLevel ? 0.92 : 0.25;
    s = answerPlacement(s, rand() < p, { pool, rand, now: 0 });
  }
  return s;
}
const seeded = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

describe('自適應程度測驗 v1.6', () => {
  it('落點大致正確：真實程度 ±1 級以內，題數 ≤ 36', () => {
    for (const level of [0, 1, 3, 4, 6, 9]) {
      const hits: number[] = [];
      for (let seed = 1; seed <= 20; seed++) {
        const s = run(level, seeded(seed));
        expect(s.phase).toBe('done');
        expect(answeredCount(s)).toBeLessThanOrEqual(36);
        expect(s.probed).toBeLessThanOrEqual(MAX_PROBE_QUESTIONS);
        hits.push(Math.abs(s.result! - level));
      }
      // 至少 75% 準確落在真實程度或低一級（寧可保守）
      expect(hits.filter(d => d <= 1).length).toBeGreaterThanOrEqual(15);
    }
  });

  it('純猜題很難跳級：全部亂猜的玩家多半落在 Pre-A1～A1', () => {
    const results = Array.from({ length: 30 }, (_, i) => run(-1, seeded(i + 1)).result!);
    expect(results.filter(r => r <= 1).length).toBeGreaterThanOrEqual(25);
  });

  it('沒有麥克風：不考口說、記成口說未驗證，不用拼字補口說分', () => {
    const s = run(5, seeded(3), { voice: false });
    expect(s.speakingVerified).toBe(false);
    expect(s.confirm.speaking.total).toBe(0);
  });

  it('題庫還沒補齊的層級不測', () => {
    expect(maxTestable(pool)).toBe(9);
    const partial = pool.map((list, lv) => (lv > 2 ? [] : list));
    expect(maxTestable(partial)).toBe(2);
    let s = startPlacement(4, { pool: partial, rand: seeded(1), now: 0 });
    expect(s.level).toBe(2);
    for (let i = 0; i < 60 && s.phase !== 'done'; i++) s = answerPlacement(s, true, { pool: partial, rand: seeded(i), now: 0 });
    expect(s.result).toBe(2);
  });

  it('真的題庫：A1、A2 已經有診斷題', () => {
    expect(maxTestable()).toBeGreaterThanOrEqual(2);
  });
});

describe('口說跳過', () => {
  it('跳過一題口說：剩下的口說題也跳過，記成未驗證，寫作照考', async () => {
    const { skipSpeaking } = await import('./placementTest');
    let s = startPlacement(3, { pool, rand: seeded(5), now: 0 });
    for (let i = 0; i < 60 && s.phase === 'probe'; i++) s = answerPlacement(s, true, { pool, rand: seeded(i), now: 0 });
    expect(s.phase).toBe('confirm');
    expect(currentQuestion(s)?.type).toBe('voice');
    s = skipSpeaking(s, 0);
    expect(s.speakingVerified).toBe(false);
    expect(s.queue.every(q => q.type !== 'voice')).toBe(true);
    for (let i = 0; i < 10 && s.phase !== 'done'; i++) s = answerPlacement(s, true, { pool, rand: seeded(i), now: 0 });
    expect(s.phase).toBe('done');
    expect(s.confirm.writing.total).toBe(4);
  });
});
