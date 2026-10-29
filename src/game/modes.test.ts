import { describe, expect, it } from 'vitest';
import { RUSH_PER_DAY, rushQuestions, rushReward, towerQuestions, towerRegion, towerReward } from './modes';
import { initialSave, useSaveStore } from '../store/saveStore';

describe('daily rush', () => {
  it('rewards more for more correct answers and higher combos', () => {
    expect(rushReward(20, 10, 0).gold).toBeGreaterThan(rushReward(10, 5, 0).gold);
    expect(rushReward(9, 0, 0).ore).toBe(3);
    expect(rushReward(10, 5, 4).gold).toBeGreaterThan(rushReward(10, 5, 0).gold);
  });

  it('falls back to easy questions when little has been learned, never voice', () => {
    const qs = rushQuestions({}, 0);
    expect(qs.length).toBeGreaterThan(0);
    expect(qs.every(q => q.type !== 'voice')).toBe(true);
  });

  it('allows three runs a day', () => {
    useSaveStore.setState({ ...initialSave });
    for (let i = 0; i < RUSH_PER_DAY; i++) useSaveStore.getState().startRush();
    expect(useSaveStore.getState().rushRuns).toBe(RUSH_PER_DAY);
  });
});

describe('hero tower', () => {
  it('climbs one CEFR region every 3 floors and pays triple every 5th floor', () => {
    expect(towerRegion(1)).toBe(0);
    expect(towerRegion(4)).toBe(1);
    expect(towerReward(5).shards).toBe(3 * towerReward(4).shards);
    expect(towerQuestions(1)).toHaveLength(5);
  });

  it('rewards only the first clear of the next floor', () => {
    useSaveStore.setState({ ...initialSave, heroes: ['knight'], heroShards: {} });
    expect(useSaveStore.getState().clearTowerFloor(2, 'knight')).toBeNull();
    expect(useSaveStore.getState().clearTowerFloor(1, 'knight')).toMatchObject({ shards: 5 });
    expect(useSaveStore.getState().heroShards.knight).toBe(5);
    expect(useSaveStore.getState().clearTowerFloor(1, 'knight')).toBeNull();
  });
});
