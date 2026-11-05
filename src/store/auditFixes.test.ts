import { beforeEach, expect, it } from 'vitest';
import { initialSave, migrateSave, SAVE_VERSION, useSaveStore } from './saveStore';
import { DEFAULT_CHARACTER } from '../game/character';
import { useBattleStore } from './battleStore';
import { WEAPON_SUMMON_RATES } from '../game/weapons';
const S = () => useSaveStore.getState();
beforeEach(() => useSaveStore.setState({ ...structuredClone(initialSave), character: DEFAULT_CHARACTER }));
it('v24將舊素材別名加回既有素材；保存再載入不重複增加', () => {
  const migrated = migrateSave({ ...initialSave, materials: { ore: 10, core: 2, dragon: 4, magic_core: 3, dragon_crystal: 1 } }, 23);
  expect(migrated.materials).toEqual({ ore: 10, core: 5, dragon: 5 });
  expect(migrateSave(migrated, SAVE_VERSION).materials).toEqual(migrated.materials);
});
it('召喚魔核龍晶立即可用於正式鍛造配方', () => {
  useSaveStore.setState({ weaponTickets: 5, gold: 10000, materials: { ore: 100 }, unlockedIndex: 8 });
  for (const seq of [[.5, .1, .9, .1], [.5, .1, .9, .1], [.5, .1, .9, .1], [.5, .1, .1]]) {
    let i = 0; S().summonWeapons(1, () => seq[i++] ?? .9);
  }
  expect(S().materials.core).toBe(3); expect(S().materials.dragon).toBe(1);
  expect(S().forge('blade_legend')).toBe(true);
  expect(S().materials.core).toBe(0);
});
it('舊補發標記能持久化，普通存檔再載入不重補', () => {
  const old = migrateSave({ ...initialSave, weaponTickets: 0, bossDown: [3, 4] }, 23);
  expect(old.weaponTickets).toBe(5);
  useSaveStore.setState(old);
  const data = useSaveStore.persist.getOptions().partialize!(S());
  expect(data).toHaveProperty('_weaponBossBackfilled', true);
  expect(migrateSave(data, SAVE_VERSION).weaponTickets).toBe(5);
  expect(migrateSave(data, 23).weaponTickets).toBe(5);
});
it('新版正常通關的券不再走歷史補發', () => {
  expect(migrateSave({ ...initialSave, weaponTickets: 15, bossDown: [3, 4] }, SAVE_VERSION).weaponTickets).toBe(15);
});
it('機率表揭露現行不含保底的分配，沒有減少稀有素材收益', () => {
  expect(WEAPON_SUMMON_RATES.map(r => r.rate)).toEqual([5, 19, 28.5, 47.5]);
  expect(WEAPON_SUMMON_RATES.reduce((sum, r) => sum + r.rate, 0)).toBe(100);
});
it('黃金之路不能消耗無效護盾，正常戰鬥仍可使用', () => {
  const B = useBattleStore.getState;
  B().startGoldenRoad(); if (B().phase === 'lesson') B().startBattle();
  useSaveStore.setState({ items: { ...S().items, shield: 3 } });
  B().consumeItem('shield'); expect(S().items.shield).toBe(3); expect(B().shield).toBe(false);
  B().exitToMap();
});
