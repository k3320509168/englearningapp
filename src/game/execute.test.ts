import { describe, expect, it } from 'vitest';
import { canExecute, executeKindOf } from './execute';

describe('C3：處決僅為致命一擊演出', () => {
  it.each([['elite', 300], ['mini', 1000], ['big', 3000], ['region', 100], ['silentKing', 300]] as const)('%s僅看致命與Combo門檻', (kind, combo) => {
    expect(canExecute(kind, { combo, lethal: true })).toBe(true);
    expect(canExecute(kind, { combo: combo - 1, lethal: true })).toBe(false);
    expect(canExecute(kind, { combo: 1e10, lethal: false })).toBe(false);
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
