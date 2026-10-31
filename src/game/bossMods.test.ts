import { describe, expect, it } from 'vitest';
import { afterAnswer, chooseReflect, modDamageMult, modGaugeMult, modPreference, modSealed, modsFor, startMods } from './bossMods';
import type { ModAnswer, ModBattle, ModContext, ModId, ModState } from './bossMods';
import { setBattleRandom, useBattleStore } from '../store/battleStore';
import { initialSave, useSaveStore } from '../store/saveStore';
import { DEFAULT_CHARACTER } from './character';
import { LEVELS } from './QuestionData';

const ctx: ModContext = { skills: ['listening', 'reading', 'speaking', 'writing'], grammarTags: ['be_verb'], rand: () => 0 };
const ok = (patch: Partial<ModAnswer> = {}): ModAnswer => ({ correct: true, skill: 'reading', grammar: null, fast: false, streak: 1, ...patch });
const bad = (patch: Partial<ModAnswer> = {}): ModAnswer => ({ correct: false, skill: 'reading', grammar: null, fast: false, streak: 0, ...patch });
const battle = (patch: Partial<ModBattle> = {}): ModBattle => ({ hpRatio: 1, answers: 1, executing: false, levelIdx: 0, ...patch });
const run = (mods: ModState[], answers: [ModAnswer, Partial<ModBattle>?][]) => {
  let fx = null;
  for (const [a, b] of answers) ({ mods, fx } = afterAnswer(mods, a, battle(b), ctx));
  return { mods, fx: fx! };
};
const start = (ids: ModId[], levelIdx = 0) => startMods(ids, levelIdx, ctx).mods;

describe('分配表', () => {
  it('第 1 張照表；之後輪替，同一張地圖的小 BOSS 和大 BOSS 不一樣，每場最多一個連答鎖', () => {
    expect(modsFor(0, 0, 'gate')).toEqual(['M07']);
    expect(modsFor(0, 0, 'boss')).toEqual(['M03']);
    expect(modsFor(8, 0, 'final')).toEqual(['M11', 'M03']);
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const gate = modsFor(r, c, 'gate');
        const boss = modsFor(r, c, 'boss');
        expect(gate.join()).not.toBe(boss.join());
        for (const set of [gate, boss, modsFor(r, c, 'final')]) {
          expect(set.filter(id => id === 'M01').length).toBeLessThanOrEqual(1);
          expect(new Set(set).size).toBe(set.length);
        }
      }
    }
  });
});

describe('模組', () => {
  it('M01 連答鎖：鎖住時傷害 30%，連對 3 題打破；被打斷 2 次後改成累計 3 題', () => {
    let mods = start(['M01']);
    expect(modDamageMult(mods)).toBe(0.3);
    let r = run(mods, [[ok({ streak: 1 })], [bad()]]);
    expect(r.fx.penalty).toBe(0.05);
    r = run(r.mods, [[ok({ streak: 1 })], [bad()]]);
    expect(r.mods[0].need).toBe(3);
    r = run(r.mods, [[ok({ streak: 1 })], [bad()], [ok({ streak: 1 })], [ok({ streak: 2 })]]);
    expect(r.mods[0].phase).toBe('done');
    expect(r.fx.charge).toBe(2);
    mods = r.mods;
    expect(modDamageMult(mods)).toBe(1);
  });

  it('M06 限時追擊：3 題內沒有 2 題快答，蓄力打出 12% 傷害', () => {
    const idle = start(['M06']);
    let r = run(idle, [[ok(), { answers: 5 }]]);
    expect(r.mods[0].phase).toBe('active');
    r = run(r.mods, [[ok()], [ok()], [ok()]]);
    expect(r.mods[0].phase).toBe('over');
    expect(r.fx.penalty).toBe(0.12);
    r = run(run(idle, [[ok(), { answers: 5 }]]).mods, [[ok({ fast: true })], [ok({ fast: true })]]);
    expect(r.mods[0].phase).toBe('done');
  });

  it('同時有好幾個模組時，答錯只結算最重的懲罰', () => {
    let mods = start(['M03', 'M08']);
    mods = run(mods, [[ok(), { hpRatio: 0.55 }]]).mods;
    expect(mods.every(m => m.phase === 'active')).toBe(true);
    const r = run(mods, [[bad({ skill: 'reading' })]]);
    expect(r.fx.penalty).toBe(0.06);
  });

  it('M09 吸血：答錯回血，整場最多 12%；答對 3 題斬斷並回血', () => {
    let r = run(start(['M09']), [[bad()]]);
    expect(r.mods[0].phase).toBe('active');
    let healed = 0;
    for (let i = 0; i < 6; i++) { r = run(r.mods, [[bad()]]); healed += r.fx.bossHeal; }
    expect(healed).toBeCloseTo(0.12);
    r = run(r.mods, [[ok()], [ok()], [ok()]]);
    expect(r.mods[0].phase).toBe('done');
    expect(r.fx.partyHeal).toBe(0.1);
  });

  it('M05 題型反射：觸發時請玩家選題型，選好後答對那種題就反射', () => {
    let r = run(start(['M05']), [[ok(), { hpRatio: 0.5 }]]);
    expect(r.fx.choice).toHaveLength(2);
    const mods = chooseReflect(r.mods, 'listening');
    expect(modPreference(mods)).toEqual({ skill: 'listening' });
    r = run(mods, [[ok({ skill: 'listening' })]]);
    expect(r.fx.charge).toBe(1.5);
  });

  it('M07 指定文法考點；M04 狂暴讓行動條變快；M11 封印技能', () => {
    const m7 = start(['M07']);
    expect(modPreference(m7)).toEqual({ tag: 'be_verb' });
    expect(run(m7, [[ok({ grammar: 'be_verb' })]]).mods[0].phase).toBe('done');
    expect(modGaugeMult(run(start(['M04']), [[ok(), { hpRatio: 0.3 }]]).mods)).toBe(1.3);
    expect(modSealed(start(['M11']))).toBe(true);
  });

  it('首領倒地（終結連擊）後，還沒處理完的模組全部取消', () => {
    const r = run(start(['M01', 'M03']), [[ok(), { executing: true }]]);
    expect(r.mods.every(m => m.phase === 'over')).toBe(true);
    expect(modDamageMult(r.mods)).toBe(1);
  });
});

describe('首領模組在戰鬥中', () => {
  it('A1 1-15 小 BOSS 帶「弱點揭露」，下一題就出指定的考點', () => {
    setBattleRandom(() => 0.99);
    useSaveStore.setState({ ...initialSave, character: DEFAULT_CHARACTER, hintsSeen: ['boss', 'skill'], settings: { ...initialSave.settings, showLessons: false } });
    const st = () => useBattleStore.getState();
    st().startLevel(LEVELS[0], undefined, 14);
    if (st().phase === 'lesson') st().startBattle();
    expect(st().mods.map(m => m.id)).toEqual(['M07']);
    expect(st().mods[0].phase).toBe('active');
  });
});
