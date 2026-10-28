import { describe, expect, it } from 'vitest';
import { chargeColor, comboFx, comboTierOf, hitPitch } from './comboFx';

describe('Combo 分級特效', () => {
  it('沿用 5／10／20 的稱號，再往上加 30、50 兩級', () => {
    expect([0, 4, 5, 9, 10, 19, 20, 29, 30, 49, 50, 999].map(comboTierOf)).toEqual([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
    expect(comboFx(5).label).toBe('GREAT!');
    expect(comboFx(10).label).toBe('AWESOME!');
    expect(comboFx(20).label).toBe('UNSTOPPABLE!');
  });

  it('等級越高特效只會疊加、不會變少', () => {
    for (let t = 1; t <= 5; t++) {
      const prev = comboFx([0, 5, 10, 20, 30, 50][t - 1]);
      const cur = comboFx([0, 5, 10, 20, 30, 50][t]);
      expect(cur.afterimages).toBeGreaterThanOrEqual(prev.afterimages);
      expect(cur.slashes).toBeGreaterThanOrEqual(prev.slashes);
      expect(cur.particles).toBeGreaterThan(prev.particles);
    }
  });

  it('拼寫進度從白色依序點燃到金色', () => {
    expect(chargeColor(0)).toBe(0xffffff);
    expect(chargeColor(1)).toBe(0xffcd4b);
  });

  it('打擊音高最多升一個八度', () => {
    expect(hitPitch(0)).toBe(1);
    expect(hitPitch(12)).toBe(2);
    expect(hitPitch(100)).toBe(2);
  });
});
