import { describe, expect, it } from 'vitest';
import { BONUS_GAIN_CAP, applyHardBonus, decayCombo, grantSkillCombo, skillWindowOf } from './combo';

describe('combo 規則 v2.0', () => {
  it('困難題只乘原生 combo，單次最多 +15 萬', () => {
    expect(applyHardBonus(100, 10)).toEqual({ organic: 1000, gain: 900 });
    expect(applyHardBonus(1_000_000, 10).gain).toBe(BONUS_GAIN_CAP);
    expect(applyHardBonus(50, 1).gain).toBe(0);
  });
  it('技能加 combo：每 8 題視窗最多 +40', () => {
    expect(grantSkillCombo(0, 12)).toBe(12);
    expect(grantSkillCombo(36, 12)).toBe(4);
    expect(grantSkillCombo(40, 20)).toBe(0);
    expect(skillWindowOf(7)).toBe(0);
    expect(skillWindowOf(8)).toBe(1);
  });
  it('答錯保留比例：原生與技能各自保留', () => {
    expect(decayCombo(120, 20, 0.5)).toEqual({ combo: 60, skill: 10 });
    expect(decayCombo(120, 20, 0.7)).toEqual({ combo: 84, skill: 14 });
    expect(decayCombo(120, 20, 1)).toEqual({ combo: 120, skill: 20 });
  });
});
