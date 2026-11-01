import { beforeEach, describe, expect, it } from 'vitest';
import { emptyMapMastery, masteryReady, recordMastery } from './mapMastery';
import { initialSave, migrateSave, useSaveStore } from '../store/saveStore';
import { REGIONS, mapKey } from './regions';
import type { Question } from './types';
const q = (n: number): Question => ({ type: 'voice', desc: `word${n}`, ans: 'APPLE', speak: 'apple', skill: 'speaking' });
const ready = () => ({ ...emptyMapMastery(), cleared: (1 << 20) - 1, total: 60, items: Array.from({ length: 36 }, (_, i) => String(i)), skills: { listening: 18, reading: 18, speaking: 12, writing: 12 } });
describe('map mastery', () => {
  beforeEach(() => useSaveStore.setState(structuredClone(initialSave)));
  it('counts at most two different questions per knowledge point per day', () => {
    let s = recordMastery(undefined, q(1), '2026-11-01', false);
    s = recordMastery(s, q(1), '2026-11-01', false);
    expect(s.total).toBe(1);
    s = recordMastery(s, q(2), '2026-11-01', true);
    s = recordMastery(s, q(3), '2026-11-01', false);
    expect(s.total).toBe(2); expect(s.spoken).toBe(1); expect(s.speechFallback).toBe(true);
    s = recordMastery(s, q(1), '2026-11-02', false);
    expect(s.total).toBe(3); expect(s.items).toHaveLength(2);
  });
  it('shares the daily knowledge and question limit across different maps', () => {
    const s = useSaveStore.getState();
    s.recordMapLearning('a', q(1), false);
    s.recordMapLearning('b', q(1), false);
    expect(useSaveStore.getState().mapMastery.b).toBeUndefined();
    s.recordMapLearning('b', q(2), false);
    s.recordMapLearning('c', q(3), false);
    expect(useSaveStore.getState().mapMastery.b.total).toBe(1);
    expect(useSaveStore.getState().mapMastery.c).toBeUndefined();
  });
  it('requires all stages, distinctness and all four skill proportions', () => {
    expect(masteryReady(0, ready())).toBe(true);
    expect(masteryReady(0, { ...ready(), cleared: (1 << 19) - 1 })).toBe(false);
    expect(masteryReady(0, { ...ready(), total: 61 })).toBe(false); // 36/61不足60%
    expect(masteryReady(0, { ...ready(), skills: { listening: 0, reading: 36, speaking: 12, writing: 12 } })).toBe(false);
    expect(masteryReady(8, ready())).toBe(false);
  });
  it('grants gold and materials exactly once without XP or progression changes', () => {
    const key = mapKey(REGIONS[0].id, 0), before = useSaveStore.getState();
    useSaveStore.setState({ mapMastery: { [key]: ready() } });
    expect(useSaveStore.getState().claimMapMastery(0, 0)).toBe(true);
    const after = useSaveStore.getState();
    expect(after.gold).toBe(before.gold + 80);
    expect(after.materials.ore).toBe(4);
    expect(after.player).toEqual(before.player);
    expect(after.unlockedIndex).toBe(before.unlockedIndex);
    expect(after.tickets).toBe(before.tickets);
    expect(after.mapStars).toEqual(before.mapStars);
    expect(after.claimMapMastery(0, 0)).toBe(false);
    expect(after.claimMapMastery(0, REGIONS[0].maps.length - 1)).toBe(false);
  });
  it('migrates old saves without inventing mastery or revoking progress', () => {
    const old = migrateSave({ ...initialSave, mapMastery: undefined, unlockedIndex: 4 }, 19);
    expect(old.mapMastery).toEqual({}); expect(old.unlockedIndex).toBe(4);
  });
});
