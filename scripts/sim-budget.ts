// 只供Node模擬；所有養成購買均經正式store，沒有資源補給捷徑。
import { initialSave, useSaveStore } from '../src/store/saveStore';
import { DEFAULT_CHARACTER } from '../src/game/character';
import { ADVANCE_REQ, nextOptions } from '../src/game/growth';
import { EQUIPMENT, SLOTS, equipDef, equipMods } from '../src/game/equipment';
import type { Mods } from '../src/game/growth';
import { currentRarity, heroDef, RARITIES } from '../src/game/heroes';
import { claimableMilestones } from '../src/game/daily';

const state = () => useSaveStore.getState();
export type BudgetSave = typeof initialSave;
export type BudgetLedger = Record<string, number>;
export const snapshotSave = (): BudgetSave => structuredClone(Object.fromEntries(Object.keys(initialSave).map(key => [key, state()[key as keyof BudgetSave]]))) as unknown as BudgetSave;

export function simulationClock(start = new Date(2026, 10, 1, 12).getTime()) {
  const original = Date;
  let now = start;
  const replacement = new Proxy(original, {
    construct(target, args) { return Reflect.construct(target, args.length ? args : [now]); },
    get(target, key, receiver) { return key === 'now' ? () => now : Reflect.get(target, key, receiver); },
    apply() { return new original(now).toString(); },
  });
  globalThis.Date = replacement;
  return { now: () => now, set: (value: number) => { now = value; }, restore: () => { globalThis.Date = original; } };
}

export function assertBudget() {
  const s = state();
  if (!Number.isFinite(s.gold) || s.gold < 0) throw new Error(`budget gold invalid: ${s.gold}`);
  for (const [id, n] of Object.entries(s.materials)) if (!Number.isInteger(n) || n < 0) throw new Error(`budget material invalid: ${id}=${n}`);
  if (s.party.some(id => id !== 'player' && !s.heroes.includes(id))) throw new Error('budget party contains unowned hero');
}

// 明示的保守啟發式，只比較戰鬥mods，不宣稱這是每種玩家的最佳配裝。
const strength = (mods: Partial<Mods>) => (mods.atk ?? 0) + .7 * (mods.hp ?? 0) + 2 * (mods.crit ?? 0)
  + .5 * (mods.critDmg ?? 0) + (mods.timeMs ?? 0) / 20000 + (mods.guardEvery ? 2 / mods.guardEvery : 0);

export function budgetMaintenance(rand: () => number, ledger: BudgetLedger) {
  const add = (key: string, n = 1) => { ledger[key] = (ledger[key] ?? 0) + n; };
  const action = (source: string, work: () => unknown) => {
    const before = state().gold;
    const materials = { ...state().materials };
    work(); assertBudget();
    add(source, state().gold - before);
    for (const [id, n] of Object.entries(state().materials)) {
      const delta = n - (materials[id] ?? 0);
      if (delta) add(`${source.replace(/Gold$/, '')}Material:${id}`, delta);
    }
  };
  state().ensureDaily();
  for (const task of state().daily?.tasks ?? []) action('dailyGold', () => state().claimDaily(task.id));
  for (const task of state().weekly?.tasks ?? []) action('weeklyGold', () => state().claimWeekly(task.id));
  for (const milestone of claimableMilestones(state().daily)) action('streakGold', () => state().claimStreak(milestone.days));
  while (state().wheelPending > 0) { action('wheelGold', () => state().spinWheel(rand)); add('wheelSpins'); }
  for (const tier of [1, 2, 3] as const) {
    if (state().player.level < ADVANCE_REQ[tier].level) break;
    const option = nextOptions(DEFAULT_CHARACTER.classId, state().player.classPath)[0];
    if (option) state().advanceClass(option.id);
  }
  while (state().tickets >= 10) {
    if (!state().summonHeroes(10, rand)) break;
    add('summonTickets', 10);
  }
  const owned = [...state().heroes].sort((a, b) => RARITIES.indexOf(currentRarity(heroDef(b), state().heroTier[b] ?? 0))
    - RARITIES.indexOf(currentRarity(heroDef(a), state().heroTier[a] ?? 0))
    || (state().heroLevel[b] ?? 1) - (state().heroLevel[a] ?? 1) || a.localeCompare(b));
  const chosen = owned.slice(0, 3);
  const healer = owned.find(id => heroDef(id).classId === 'monk');
  if (healer && !chosen.includes(healer) && chosen.length === 3) chosen[2] = healer;
  useSaveStore.setState({ party: ['player', ...chosen] });
  for (const id of chosen) for (let i = 0; i < 10; i++) {
    let raised = false;
    action('starGold', () => { raised = state().starUp(id); });
    if (!raised) break;
    add('starUps');
  }
  // 先建裝備、再訓練；每圖一次消費。買不起最高裝備會嘗試次級，而不是憑空補材料。
  for (const { id: slot } of SLOTS) {
    let current = state().equipment.find(item => item.uid === state().equipped[slot]);
    const score = current ? strength(equipMods(current)) : 0;
    const candidates = EQUIPMENT.filter(def => def.slot === slot && strength(def.mods) > score
      && (def.requires?.regionsCleared ?? 0) <= state().unlockedIndex
      && (def.requires?.classTier ?? 0) <= state().player.classPath.length)
      .sort((a, b) => strength(b.mods) - strength(a.mods) || a.cost.gold - b.cost.gold);
    for (const def of candidates) {
      let forged = false;
      action('forgeGold', () => { forged = state().forge(def.id); });
      if (!forged) continue;
      current = state().equipment.at(-1)!;
      state().equip(current.uid); add('forges'); break;
    }
    if (current) while ((state().equipment.find(item => item.uid === current!.uid)?.plus ?? 3) < 3) {
      let result: 'ok' | 'fail' | false = false;
      action('enhanceGold', () => { result = state().enhance(current!.uid, false, rand); });
      if (!result) break;
      add('enhanceAttempts');
    }
  }
  // 輪流各升一級，避免第一位英雄耗盡全部訓練金。
  for (let round = 0; round < 200; round++) {
    let bought = false;
    for (const id of chosen) action('heroTrainingGold', () => {
      if (state().trainHero(id)) { bought = true; add('heroLevelsBought'); }
    });
    if (!bought) break;
  }
  // 當天完成的任務當天領，不等到換日被新任務覆蓋。
  for (const task of state().daily?.tasks ?? []) action('dailyGold', () => state().claimDaily(task.id));
  for (const task of state().weekly?.tasks ?? []) action('weeklyGold', () => state().claimWeekly(task.id));
  assertBudget();
}

export function budgetReport(ledger: BudgetLedger) {
  const s = state();
  return {
    playerLevel: s.player.level, gold: s.gold, materials: { ...s.materials },
    party: s.party.map(id => ({ id, level: id === 'player' ? s.player.level : s.heroLevel[id] ?? 1, stars: s.heroStars[id] ?? 0 })),
    equipment: SLOTS.map(({ id }) => {
      const item = s.equipment.find(e => e.uid === s.equipped[id]);
      return { slot: id, item: item ? `${equipDef(item.defId)?.name ?? item.defId}+${item.plus}` : '無', blessed: !!item?.blessed };
    }), ledger: { ...ledger },
  };
}

export function assertBudgetLedger(ledger: BudgetLedger) {
  const gold = Object.entries(ledger).filter(([key]) => key.endsWith('Gold')).reduce((sum, [, n]) => sum + n, 0);
  if (gold !== state().gold) throw new Error(`budget gold ledger mismatch: ${gold} != ${state().gold}`);
  const ids = new Set([...Object.keys(state().materials), ...Object.keys(ledger).filter(key => key.includes('Material:')).map(key => key.split('Material:')[1])]);
  for (const id of ids) {
    const total = Object.entries(ledger).filter(([key]) => key.endsWith(`Material:${id}`)).reduce((sum, [, n]) => sum + n, 0);
    if (total !== (state().materials[id] ?? 0)) throw new Error(`budget material ledger mismatch: ${id}: ${total} != ${state().materials[id] ?? 0}`);
  }
}
