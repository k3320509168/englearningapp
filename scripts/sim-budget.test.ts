import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { initialSave, useSaveStore } from '../src/store/saveStore';
import { DEFAULT_CHARACTER } from '../src/game/character';
import { assertBudget, assertBudgetLedger, budgetMaintenance, simulationClock, snapshotSave } from './sim-budget';

const state = () => useSaveStore.getState();
let clock: ReturnType<typeof simulationClock> | undefined;
beforeEach(() => {
  useSaveStore.setState({ ...structuredClone(initialSave), character: DEFAULT_CHARACTER, tickets: 0, player: { ...initialSave.player, level: 5 } });
});
afterEach(() => { clock?.restore(); clock = undefined; });

describe('C9資源有限的養成', () => {
  it('零金幣/材料不會獲得免費裝備、強化或英雄等級', () => {
    const ledger = { initialGold: 0 };
    budgetMaintenance(() => .5, ledger);
    expect(state().equipment).toEqual([]);
    expect(state().heroLevel.knight ?? 1).toBe(1);
    expect(state().gold).toBe(0);
    assertBudgetLedger(ledger);
  });

  it('有限錢包的每一筆購買可對帳；不免費神聖加護', () => {
    useSaveStore.setState({ gold: 500, materials: { ore: 8 } });
    const ledger = { initialGold: 500, 'initialMaterial:ore': 8 };
    budgetMaintenance(() => .5, ledger);
    expect(state().gold).toBeLessThan(500);
    expect(state().materials.ore).toBeLessThan(8);
    expect(state().equipment.every(item => item.plus <= 3 && !item.blessed)).toBe(true);
    assertBudget(); assertBudgetLedger(ledger);
    expect(() => assertBudgetLedger({ ...ledger, initialGold: 501 })).toThrow('ledger mismatch');
  });

  it('還原快照不攜帶上一輪MC試跑收入且保留store方法', () => {
    const saved = snapshotSave();
    const addGold = state().addGold;
    state().addGold(10000);
    state().addMaterials({ ore: 100 });
    useSaveStore.setState(structuredClone(saved));
    expect(state().gold).toBe(saved.gold);
    expect(state().materials).toEqual(saved.materials);
    expect(state().addGold).toBe(addGold);
    state().materials.ore = 5;
    expect(saved.materials.ore ?? 0).toBe(0);
  });

  it('模擬日期可換日，完成的每日先領，換日不重領舊任務', () => {
    const originalDate = Date;
    clock = simulationClock(new Date(2026, 10, 1, 12).getTime());
    state().ensureDaily();
    const day = state().daily!.date;
    useSaveStore.setState({ daily: { date: day, streak: 1, tasks: [{ id: 'correct20', progress: 20, claimed: false }] } });
    const ledger = { initialGold: 0 };
    budgetMaintenance(() => .5, ledger);
    expect(ledger).toHaveProperty('dailyGold', 80);
    clock.set(clock.now() + 86400000);
    state().ensureDaily();
    expect(state().daily!.date).not.toBe(day);
    expect(state().daily!.streak).toBe(2);
    budgetMaintenance(() => .5, ledger);
    expect(ledger).toHaveProperty('dailyGold', 80);
    assertBudgetLedger(ledger);
    clock.restore(); clock = undefined;
    expect(Date).toBe(originalDate);
  });
});
