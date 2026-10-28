import { describe, expect, it } from 'vitest';
import { CLASS_NODES, MAX_LEVEL, addXp, canAdvance, combineMods, nextOptions, pathMods, xpToNext } from './growth';
import { EQUIPMENT, enhanceCost, equipMods, resolveCost, rollDrops } from './equipment';
import { buildMember, playerMods, teamGuardEvery } from './party';
import { DEFAULT_CHARACTER, CLASSES } from './character';
import { playerStats } from './progression';
import { initialSave, migrateSave, useSaveStore } from '../store/saveStore';

const base = playerStats({ upgrades: { hp: 0, atk: 0, combo: 0, gold: 0 } });

describe('levels', () => {
  it('levels up, possibly several times, and stops at the cap', () => {
    expect(addXp(1, 0, xpToNext(1) - 1)).toMatchObject({ level: 1, levelsGained: 0 });
    expect(addXp(1, 0, xpToNext(1) + xpToNext(2))).toMatchObject({ level: 3, xp: 0, levelsGained: 2 });
    expect(addXp(MAX_LEVEL - 1, 0, 1e9)).toMatchObject({ level: MAX_LEVEL, xp: 0 });
  });

  it('each level makes the protagonist stronger', () => {
    const lv1 = buildMember('player', DEFAULT_CHARACTER, base, { growth: { level: 1, classPath: [], equipped: [] } });
    const lv11 = buildMember('player', DEFAULT_CHARACTER, base, { growth: { level: 11, classPath: [], equipped: [] } });
    expect(lv11.atk / lv1.atk).toBeCloseTo(1.3);
  });
});

describe('class tree', () => {
  it('every class has 2 branches, each with 2 second-tier options and an awakening', () => {
    for (const c of CLASSES) {
      const first = nextOptions(c.id, []);
      expect(first).toHaveLength(2);
      for (const t1 of first) {
        const second = nextOptions(c.id, [t1.id]);
        expect(second).toHaveLength(2);
        second.forEach(t2 => expect(nextOptions(c.id, [t1.id, t2.id])).toHaveLength(1));
      }
    }
    expect(CLASS_NODES.length).toBe(4 * 2 * (1 + 2 + 2));
  });

  it('requires level and cleared regions', () => {
    expect(canAdvance(1, 10, 1)).toBe(true);
    expect(canAdvance(1, 9, 1)).toBe(false);
    expect(canAdvance(1, 10, 0)).toBe(false);
    expect(canAdvance(2, 30, 3)).toBe(true);
  });

  it('class passives combine along the path', () => {
    const m = pathMods(['squire', 'paladin']);
    expect(m.guardEvery).toBe(4);
    expect(m.hp).toBeCloseTo(0.15 + 0.15 + 0.1);
    expect(combineMods({ guardEvery: 5 }, { guardEvery: 8 }).guardEvery).toBe(5);
  });

  it('squire grants the team a periodic guard', () => {
    const p = buildMember('player', DEFAULT_CHARACTER, base, { growth: { level: 10, classPath: ['squire'], equipped: [] } });
    expect(teamGuardEvery([p])).toBe(5);
  });
});

describe('equipment', () => {
  it('enhancing raises effects by 10% per level and costs more', () => {
    const item = { uid: 'x', defId: 'blade_training', plus: 5 };
    expect(equipMods(item).atk).toBeCloseTo(0.15);
    expect(enhanceCost(item).gold).toBeGreaterThan(enhanceCost({ ...item, plus: 0 }).gold);
    expect(playerMods({ level: 1, classPath: [], equipped: [item] }).atk).toBeCloseTo(0.15);
  });

  it('resolves "own element" crystals', () => {
    const def = EQUIPMENT.find(e => e.id === 'blade_element')!;
    expect(resolveCost(def, 'fire')).toEqual({ ore: 10, crystal_fire: 3 });
  });

  it('bosses drop cores and crystals of their element', () => {
    expect(rollDrops('boss', 'water', () => 0)).toEqual({ ore: 3, crystal_water: 2, core: 1 });
    expect(rollDrops('normal', 'water', () => 0.99)).toEqual({});
  });
});

describe('growth in the save', () => {
  it('forges, equips automatically, enhances and advances class', () => {
    useSaveStore.setState({ ...initialSave, character: DEFAULT_CHARACTER, gold: 10_000, materials: { ore: 20 } });
    const sv = () => useSaveStore.getState();
    expect(sv().forge('blade_steel')).toBe(false); // 還沒通關第 1 個區域
    expect(sv().forge('blade_training')).toBe(true);
    const item = sv().equipment[0];
    expect(sv().equipped.weapon).toBe(item.uid);
    expect(sv().enhance(item.uid)).toBe(true);
    expect(sv().equipment[0].plus).toBe(1);

    expect(sv().advanceClass('squire')).toBe(false);
    useSaveStore.setState({ player: { level: 10, xp: 0, classPath: [] }, unlockedIndex: 1 });
    expect(sv().advanceClass('elementalist')).toBe(false); // 不是劍士的路線
    expect(sv().advanceClass('squire')).toBe(true);
    expect(sv().player.classPath).toEqual(['squire']);
  });

  it('hero training is capped at the protagonist level', () => {
    useSaveStore.setState({ ...initialSave, character: DEFAULT_CHARACTER, gold: 10_000, player: { level: 2, xp: 0, classPath: [] } });
    expect(useSaveStore.getState().trainHero('knight')).toBe(true);
    expect(useSaveStore.getState().trainHero('knight')).toBe(false);
    expect(useSaveStore.getState().heroLevel.knight).toBe(2);
  });

  it('migrates v9 saves with default growth', () => {
    expect(migrateSave({ gold: 5 }, 9).player).toEqual({ level: 1, xp: 0, classPath: [] });
  });
});

describe('growth from battles', () => {
  it('correct answers give EXP and bosses drop materials', async () => {
    const { useBattleStore, setBattleRandom } = await import('../store/battleStore');
    setBattleRandom(() => 0.99);
    useSaveStore.setState({ ...initialSave, character: DEFAULT_CHARACTER, settings: { ...initialSave.settings, showLessons: false } });
    const st = () => useBattleStore.getState();
    st().startLevel(Object.keys(migrateSave({}, 10).levelProgress)[0] ?? 'A1 入門 (120-224分)');
    for (let i = 0; i < 500 && st().phase !== 'summary'; i++) {
      if (st().phase === 'monsterDown') { st().nextStage(); continue; }
      const q = st().question!;
      if (q.type === 'choice') st().chooseOption(q.ans);
      else if (q.type === 'voice') st().submitVoice(q.ans);
      else q.ans.slice(st().typed.length).split('').forEach(c => st().inputLetter(c));
    }
    expect(st().runXp).toBeGreaterThan(0);
    expect(useSaveStore.getState().player.level).toBeGreaterThan(1);
    expect(useSaveStore.getState().materials.core).toBe(1);
  });
});

describe('retroactive EXP', () => {
  it('older saves get EXP for stages already cleared', () => {
    expect(migrateSave({ bestStage: { a: 19 } }, 9).player.level).toBeGreaterThan(1);
    expect(migrateSave(undefined, 0).player.level).toBe(1);
  });
});

describe('賣出裝備', () => {
  it('退還打造與強化投入的 65%', async () => {
    const { sellValue } = await import('./equipment');
    // 見習之刃：🪙100、礦石 3；強化到 +2 再花 🪙50+100、礦石 1+2
    const v = sellValue({ uid: 'x', defId: 'blade_training', plus: 2 }, 'fire');
    expect(v.gold).toBe(Math.floor(250 * 0.65));
    expect(v.materials).toEqual({ ore: Math.floor(6 * 0.65) });
  });
});

describe('經驗值曲線', () => {
  it('前期每級需求接近，Lv 1→10 總量與舊曲線相同', () => {
    let total = 0;
    for (let l = 1; l < 10; l++) total += xpToNext(l);
    expect(total).toBe(1035);
    expect(xpToNext(1)).toBeGreaterThanOrEqual(100);
    expect(xpToNext(10)).toBe(190);
  });
});
