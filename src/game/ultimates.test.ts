import { describe, expect, it } from 'vitest';
import { ULTIMATE_NAMES, ULTIMATE_THRESHOLDS, ultimateEchoes, ultimateTier, ultimateRank } from './ultimates';
describe('C2：12階招式門檻', () => {
  it('每個門檻前後分級正確，普通攻擊另算一階', () => {
    expect(ULTIMATE_THRESHOLDS).toEqual([5, 10, 20, 35, 50, 75, 200, 1000, 10000, 100000, 1000000]);
    ULTIMATE_THRESHOLDS.forEach((n, i) => {
      expect(ultimateTier(n - 1)).toBe(i);
      expect(ultimateTier(n)).toBe(i + 1);
      expect(ultimateRank(i + 1)).not.toBe('');
    });
    Object.values(ULTIMATE_NAMES).forEach(names => expect(names).toHaveLength(11));
  });
  it('只有百萬以上出現回響且保留層數上限', () => {
    expect(ultimateEchoes(999999)).toBe(0);
    expect(ultimateEchoes(1000000)).toBe(1);
    expect(ultimateEchoes(1140000)).toBe(2);
    expect(ultimateEchoes(1e10)).toBe(5);
  });
});
