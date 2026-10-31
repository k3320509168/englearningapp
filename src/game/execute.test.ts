import { describe, expect, it } from 'vitest';
import { canExecute, executeKindOf } from './execute';

describe('處決條件', () => {
  const ok = { combo: 5000, streak: 10, answered: 10, correct: 10, minAnswers: 16 };
  it('四個條件都要達到', () => {
    expect(canExecute('big', ok)).toBe(true);
    expect(canExecute('big', { ...ok, combo: 2999 })).toBe(false);
    expect(canExecute('big', { ...ok, streak: 7 })).toBe(false);
    expect(canExecute('big', { ...ok, answered: 9, correct: 9 })).toBe(false);
    expect(canExecute('big', { ...ok, answered: 12, correct: 10 })).toBe(false); // 83% < 85%
  });
  it('普通關、寶箱、復仇魔王沒有處決；區域魔王與沉默君王分開', () => {
    const base = { bossMode: true, final: false, inMap: 20, lastRegion: false };
    expect(executeKindOf({ ...base, bossMode: false })).toBeNull();
    expect(executeKindOf({ ...base, bossMode: false, kind: 'treasure' })).toBeNull();
    expect(executeKindOf({ ...base, revenge: true })).toBeNull();
    expect(executeKindOf({ ...base, bossMode: false, kind: 'elite' })).toBe('elite');
    expect(executeKindOf({ ...base, inMap: 15 })).toBe('mini');
    expect(executeKindOf(base)).toBe('big');
    expect(executeKindOf({ ...base, final: true })).toBe('region');
    expect(executeKindOf({ ...base, final: true, lastRegion: true })).toBe('silentKing');
  });
});
