import { describe, expect, it } from 'vitest';
import { LEVEL_STAT, CLASS_NODES, MAX_LEVEL, addXp, classBufferLimit, classAdvanceMessage, canAdvance, combineMods, nextOptions, pathMods, xpToNext } from './growth';
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
    expect(lv11.atk / lv1.atk).toBeCloseTo(1 + 10 * LEVEL_STAT);
  });
});

describe('class tree', () => {
  it('every class has 2 branches, each with 2 second-tier options, third-tier masters, and an awakening', () => {
    for (const c of CLASSES) {
      const first = nextOptions(c.id, []);
      expect(first).toHaveLength(2);
      for (const t1 of first) {
        const second = nextOptions(c.id, [t1.id]);
        expect(second).toHaveLength(2);
        for (const t2 of second) {
          const third = nextOptions(c.id, [t1.id, t2.id]);
          expect(third).toHaveLength(1);
          const awake = nextOptions(c.id, [t1.id, t2.id, third[0].id]);
          expect(awake).toHaveLength(1);
        }
      }
    }
    expect(CLASS_NODES.length).toBe(CLASSES.length * 2 * (1 + 2 + 2 + 2));
  });

  it('requires level for advance', () => {
    // 轉職門檻：一轉 Lv30、二轉 Lv80、三轉 Lv120、覺醒 Lv160
    expect(canAdvance(1, 30)).toBe(true);
    expect(canAdvance(1, 29)).toBe(false);
    expect(canAdvance(2, 80)).toBe(true);
    expect(canAdvance(2, 79)).toBe(false);
    expect(canAdvance(3, 120)).toBe(true);
    expect(canAdvance(3, 119)).toBe(false);
    expect(canAdvance(4, 160)).toBe(true);
    expect(canAdvance(4, 159)).toBe(false);
  });

  it('class passives combine along the path', () => {
    const m = pathMods(['squire', 'paladin']);
    expect(m.guardEvery).toBe(4);
    expect(m.hp).toBeCloseTo(0.08 + 0.1 + 0.1);
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
    expect(sv().enhance(item.uid)).toBe('ok'); // +5 以前一定成功
    expect(sv().equipment[0].plus).toBe(1);

    expect(sv().advanceClass('squire')).toBe(false);
    useSaveStore.setState({ player: { level: 30, xp: 0, classPath: [] }, unlockedIndex: 0 });
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
      else { q.ans.slice(st().typed.length).split('').forEach(c => st().inputLetter(c)); st().submitTyped(); }
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
  it('升級需求 100＋10×Lv：Lv 1→20 共 3,800、Lv 1→200 共 218,900', () => {
    let to20 = 0, to200 = 0;
    for (let l = 1; l < 200; l++) { to200 += xpToNext(l); if (l < 20) to20 += xpToNext(l); }
    expect(to20).toBe(3800);
    expect(to200).toBe(218900);
  });
});

describe('裝備品階', () => {
  it('品階讓效果與強化上限提高，稀有度不變；龍晶只在極光雪嶺（第 6 區）以後掉', async () => {
    const { equipMods, maxPlus, rollDrops, sellValue, gradeMaterial, gradeRefund, equipDef } = await import('./equipment');
    const base = { uid: 'a', defId: 'blade_training', plus: 0 };
    expect(equipMods({ ...base, grade: 2 }).atk).toBeCloseTo(0.1 * 1.4);
    expect(maxPlus({ ...base, grade: 3 })).toBe(16);
    expect(equipDef('blade_training')!.rarity).toBe('N');
    // 素材：沒穿在身上、品階與強化最低的同名裝備
    const all = [base, { uid: 'b', defId: 'blade_training', plus: 3 }, { uid: 'c', defId: 'blade_training', plus: 1 }, { uid: 'd', defId: 'armor_cloth', plus: 0 }];
    expect(gradeMaterial(base, all, ['a', 'c'])?.uid).toBe('b');
    expect(gradeRefund({ uid: 'b', defId: 'blade_training', plus: 3 })).toBe(Math.floor((1 + 2 + 3) * 0.65));
    // 升過品階的裝備賣出時，打造成本按份數計算
    expect(sellValue({ ...base, grade: 1 }, 'fire').gold).toBe(Math.floor(200 * 0.65));
    expect(rollDrops('boss', 'fire', () => 0.1, 4).dragon).toBeUndefined();
    expect(rollDrops('boss', 'fire', () => 0.1, 5).dragon).toBe(1);
  });

  it('每種屬性都有護符，用該屬性的結晶打造', async () => {
    const { EQUIPMENT } = await import('./equipment');
    const amulets = EQUIPMENT.filter(e => e.id.startsWith('amulet_'));
    expect(amulets).toHaveLength(7);
    expect(EQUIPMENT.length).toBe(26);
    expect(amulets.find(a => a.id === 'amulet_fire')!.cost.materials).toMatchObject({ crystal_fire: 4 });
  });
});

describe('enhance success rate and holy forging', () => {
  it('can fail after +5, but holy forging always succeeds and blesses the item', () => {
    useSaveStore.setState({ ...initialSave, character: DEFAULT_CHARACTER, gold: 99999, materials: { ore: 99 },
      equipment: [{ uid: 'w1', defId: 'blade_steel', plus: 6 }] });
    expect(useSaveStore.getState().enhance('w1', false, () => 0.99)).toBe('fail');
    expect(useSaveStore.getState().equipment[0].plus).toBe(6);
    expect(useSaveStore.getState().enhance('w1', true)).toBe('ok');
    expect(useSaveStore.getState().equipment[0]).toMatchObject({ plus: 7, blessed: true });
  });
});


describe('C7 v2.2 class-cap XP bank', () => {
  it('retains a partial award on reaching a temporary cap', () => {
    expect(addXp(39, xpToNext(39) - 1, 102, 40)).toEqual({ level: 40, xp: 101, levelsGained: 1 });
  });
  it('banks ten real levels and flushes them on unlocking the next class cap', () => {
    expect(classBufferLimit(40, 40)).toBe(5450);
    expect(classBufferLimit(100, 100)).toBe(11450);
    expect(classBufferLimit(160, 160)).toBe(17450);
    expect(addXp(40, 0, 1e9, 40)).toEqual({ level: 40, xp: 5450, levelsGained: 0 });
    expect(addXp(40, 5450, 0, 100)).toEqual({ level: 50, xp: 0, levelsGained: 10 });
  });
  it('preserves a bank after resetting to a lower class cap, without delevelling', () => {
    expect(addXp(100, 8000, 0, 40)).toEqual({ level: 100, xp: 8000, levelsGained: 0 });
    expect(addXp(200, 0, 5000, 200)).toEqual({ level: 200, xp: 0, levelsGained: 0 });
  });
  it('advancing the class immediately redeems banked XP and does not grant it twice', () => {
    useSaveStore.setState({ ...structuredClone(initialSave), character: DEFAULT_CHARACTER, player: { ...initialSave.player, level: 40 } });
    const sv = () => useSaveStore.getState();
    sv().gainXp(5450, 'firstClear');
    expect(sv().player).toMatchObject({ level: 40, xp: 5450 });
    expect(sv().advanceClass('squire')).toBe(true);
    expect(sv().player).toMatchObject({ level: 50, xp: 0 });
    expect(sv().xpLedger['accepted:firstClear']).toBe(5450);
    expect(sv().xpLedger['accepted:classUnlock']).toBe(0);
    expect(sv().resetClassPath()).toBe(true);
    sv().gainXp(1000);
    expect(sv().player).toMatchObject({ level: 50, xp: 0 });
    expect(sv().switchClass('mage')).toBe(true);
    expect(sv().player).toMatchObject({ level: 50, xp: 0 });
  });
});


it('only advertises a free cap breakthrough when it is actually available', () => {
  const p = { level: 37, classPath: [] as string[] };
  expect(classAdvanceMessage('swordsman', { ...p, level: 36 }, {}, 'swordsman', 0)).toBeNull();
  expect(classAdvanceMessage('swordsman', p, {}, 'swordsman', 0)).toBe('可免費轉職突破上限');
  expect(classAdvanceMessage('mage', p, {}, 'swordsman', 0)).toBe('切回主職以免費轉職突破上限');
  expect(classAdvanceMessage('mage', p, {}, 'swordsman', 100)).toBe('切回主職以免費轉職突破上限');
  expect(classAdvanceMessage('swordsman', { ...p, level: 200 }, {}, 'swordsman', 0)).toBeNull();
});


it('anchors reset buffering to the class cap, and never erases an older legitimate bank', () => {
  expect(classBufferLimit(45, 40)).toBe(2850);
  expect(addXp(45, 0, 99999, 40)).toEqual({ level: 45, xp: 2850, levelsGained: 0 });
  expect(addXp(50, 0, 99999, 40)).toEqual({ level: 50, xp: 0, levelsGained: 0 });
  expect(addXp(100, 8000, 1000, 40)).toEqual({ level: 100, xp: 8000, levelsGained: 0 });
});


it('placement grants only the missing cumulative XP and cannot double-count a class bank', () => {
  const placement = { level: 5, region: 4, at: 0, speakingVerified: false, confidence: 'ok' as const, weak: [], verified: false };
  useSaveStore.setState({ ...structuredClone(initialSave), character: DEFAULT_CHARACTER, placement,
    player: { level: 40, xp: 5450, classPath: [] } });
  const sv = () => useSaveStore.getState();
  sv().verifyPlacement(3);
  expect(sv().player).toMatchObject({ level: 40, xp: 5450 });
  sv().verifyPlacement(4);
  expect(sv().player).toMatchObject({ level: 81, xp: 0 });
  expect(sv().xpLedger['accepted:placement']).toBe(40400 - 17150);
  sv().verifyPlacement(4);
  expect(sv().xpLedger['accepted:placement']).toBe(23250);
  // A2 floor 21 is already covered by the earned bank: promote without a new grant.
  useSaveStore.setState({ ...structuredClone(initialSave), character: DEFAULT_CHARACTER,
    placement: { ...placement, region: 1 }, player: { level: 20, xp: 800, classPath: [] } });
  sv().verifyPlacement(1);
  expect(sv().player).toMatchObject({ level: 21, xp: 500 });
  expect(sv().xpLedger['accepted:placement']).toBe(0);
});

it('keeps legitimate banks intact across same-version reloads after class reset', () => {
  const s = { ...structuredClone(initialSave), character: DEFAULT_CHARACTER,
    player: { level: 100, xp: 8000, classPath: [] } };
  const once = migrateSave(JSON.parse(JSON.stringify(s)), 21);
  expect(once.player).toEqual(s.player);
  expect(migrateSave(JSON.parse(JSON.stringify(once)), 21).player).toEqual(s.player);
});
