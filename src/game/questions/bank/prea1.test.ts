import { describe, expect, it } from 'vitest';
import bank from './r-pre.json';

// Pre-A1「失語邊境」題庫（ChatGPT 第十七輪撰寫，docs/STORY.md v1.6）：還沒接進遊戲，先檢查格式
describe('pre-A1 bank', () => {
  const all = bank.normal as { type: string; skill: string; difficulty: number; desc: string; ans: string; speak?: string; options?: string[] }[];

  it('has 100～120 questions in the project format', () => {
    expect(all.length).toBeGreaterThanOrEqual(100);
    for (const q of all) {
      expect([1, 2]).toContain(q.difficulty);
      if (q.type === 'choice') {
        expect(q.options).toHaveLength(4);
        q.options!.forEach((o, i) => expect(o.startsWith(`${'ABCD'[i]}. `)).toBe(true));
        expect('ABCD').toContain(q.ans);
        if (q.skill === 'listening') { expect(q.desc.startsWith('🎧')).toBe(true); expect(q.speak).toBeTruthy(); }
      } else {
        expect(q.ans).toMatch(/^[A-Z ]+$/);
        expect(q.speak).toBeTruthy();
      }
      if (q.type === 'fill') expect(q.desc).toMatch(/^填空題：.*_/);
    }
  });

  it('does not repeat questions and spreads answer positions', () => {
    expect(new Set(all.map(q => `${q.type}|${q.desc}|${q.speak ?? ''}`)).size).toBe(all.length);
    const pos = all.filter(q => q.options).map(q => q.ans);
    for (const l of 'ABCD') expect(pos.filter(a => a === l).length).toBeGreaterThan(pos.length * 0.15);
  });
});
