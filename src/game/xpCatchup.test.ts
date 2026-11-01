import { describe, expect, it } from 'vitest';
import { allowance, allowanceCap, catchupMultiplier, catchupXp, frontierRecommendedLevel } from './xpCatchup';
import { cumulativeXpAtLevel, xpToNext } from './growth';
import { REGIONS, regionStageCount } from './regions';
import { recommendedLevel } from './progression';

describe('non-mainline catch-up', () => {
  it('uses every threshold and applies a new multiplier after crossing a level', () => {
    expect([-4, -3, 3, 4, 7, 8, 10, 11, 12, 13].map(catchupMultiplier)).toEqual([1.25, 1, 1, .7, .7, .4, .4, .2, .2, 0]);
    expect(catchupXp(115, 1000, 276, 160, 120)).toMatchObject({ level: 116, xp: 95, accepted: 345, bonus: 69, deducted: 0 });
    expect(catchupXp(15, 220, 3000, 40, 5)).toMatchObject({ level: 18, xp: 0, accepted: 560, bonus: 0, deducted: 2440 });
    // One award starts with a blessing, then crosses into a penalty: record both separately.
    const mixed = catchupXp(1, 0, 10000, 200, 5);
    expect(mixed.bonus).toBeGreaterThan(0);
    expect(mixed.deducted).toBeGreaterThan(0);
    expect(mixed.accepted + mixed.deducted).toBe(10000 + mixed.bonus);
  });
  it('never deletes banks or advances beyond the frontier soft cap', () => {
    expect(catchupXp(40, 3160, 104, 40, 25)).toMatchObject({ level: 40, xp: 3160, accepted: 0, deducted: 104 });
    expect(catchupXp(200, 0, 336, 200, 200)).toMatchObject({ level: 200, xp: 0, deducted: 336 });
    for (let lv = 1; lv <= 200; lv += 3) for (const frontier of [5, 60, 120, 187, 200]) {
      const xp = lv === 200 ? 0 : xpToNext(lv) - 1;
      const r = catchupXp(lv, xp, 20000, 200, frontier);
      expect(r.accepted).toBe(cumulativeXpAtLevel(r.level) + r.xp - cumulativeXpAtLevel(lv) - xp);
      expect(r.accepted).toBeGreaterThanOrEqual(0);
      expect(r.accepted + r.deducted).toBe(20000 + r.bonus);
      expect(r.level).toBeLessThanOrEqual(Math.max(lv, Math.min(200, frontier + 13)));
    }
  });
  it('anchors the frontier to progress, including defeated bosses and the completed ninth region', () => {
    const id = REGIONS[4].id;
    const s = { unlockedIndex: 4, bestStage: { [id]: 65 }, levelProgress: { [id]: 0 }, bossDown: [] as number[] };
    expect(frontierRecommendedLevel(s)).toBe(recommendedLevel(4, 65));
    expect(frontierRecommendedLevel({ ...s, bossDown: [4] })).toBe(recommendedLevel(4, regionStageCount(4) - 1));
    expect(frontierRecommendedLevel({ ...s, unlockedIndex: 9, bossDown: [8] })).toBe(200);
  });
  it('carries small deductions to an allowance and caps gold without multiplying it', () => {
    expect(allowance(2, 0, 5, 150)).toEqual({ gold: 0, used: 0, remainder: 7 });
    expect(allowance(1, 0, 7, 150)).toEqual({ gold: 1, used: 1, remainder: 0 });
    expect(allowance(2440, 142, 0, 150)).toEqual({ gold: 8, used: 150, remainder: 0 });
    expect(allowanceCap(9)).toBe(550);
  });
});

import { initialSave, migrateSave, SAVE_VERSION, useSaveStore } from '../store/saveStore';
import { DEFAULT_CHARACTER } from './character';
import { localDate } from './daily';
import { rushReward, towerReward } from './modes';

it('uses actual rush/tower/sweep store awards and reconciles daily allowance across reloads', () => {
  useSaveStore.setState({ ...structuredClone(initialSave), character: DEFAULT_CHARACTER,
    player: { level: 40, xp: 3160, classPath: [] }, unlockedIndex: 1 });
  const sv = () => useSaveStore.getState();
  const r = sv().grantRush(rushReward(10, 10, 1)); //104 XP blocked by existing cap
  expect(r).toMatchObject({ xp: 0, allowanceGold: 13 });
  expect(sv().player.xp).toBe(3160);
  expect(sv().xpLedger['deducted:rush']).toBe(104);
  const t = sv().clearTowerFloor(1, null)!;
  expect(t).toMatchObject({ xp: 0 });
  expect(sv().xpLedger['offered:tower']).toBe(towerReward(1).xp);
  expect(sv().clearTowerFloor(1, null)).toBeNull();
  useSaveStore.setState({ sweepTickets: 1 });
  const sweep = sv().sweepMap(0, () => .5)!;
  expect(sweep.xp).toBe(0);
  expect(sv().xpLedger['offered:sweep']).toBe(84);
  const loaded = migrateSave(JSON.parse(JSON.stringify(sv())), SAVE_VERSION);
  expect(loaded.xpAllowanceGold).toBe(sv().xpAllowanceGold);
  expect(loaded.player.xp).toBe(3160);
  expect(loaded.xpAllowanceRemainder).toBe(sv().xpAllowanceRemainder);
  useSaveStore.setState({ xpAllowanceDay: '2000-01-01', xpAllowanceGold: 200, xpAllowanceRemainder: 7 });
  const a = sv().awardXp(104, 'rush');
  expect(a.allowanceGold).toBe(13);
  expect(sv().xpAllowanceDay).toBe(localDate());
  expect(sv().xpAllowanceGold).toBe(13);
});

it('replayed learning with zero capacity does not consume the daily knowledge subsidy', () => {
  useSaveStore.setState({ ...structuredClone(initialSave), character: DEFAULT_CHARACTER,
    player: { level: 40, xp: 3160, classPath: [] } });
  const q = { type: 'spell' as const, desc: '蘋果', ans: 'APPLE', speak: 'apple' };
  const sv = () => useSaveStore.getState();
  expect(sv().grantLearningXp(0, q, true, true).xp).toBe(0);
  expect(sv().learningXpDay).toEqual({});
  expect(sv().xpLedger['offered:replay']).toBeGreaterThan(0);
  expect(sv().grantLearningXp(0, q, true, false).xp).toBeGreaterThan(0);
  expect(Object.values(sv().learningXpDay)).toEqual([localDate()]);
});
