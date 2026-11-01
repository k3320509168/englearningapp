import { cumulativeXpAtLevel, MAX_LEVEL, xpToNext } from './growth';
import { recommendedLevel } from './progression';
import { REGIONS, regionStageCount } from './regions';

export const isCatchupSource = (source: string) => ['rush', 'tower', 'sweep', 'dojo', 'replay', 'skill'].includes(source);
export function frontierRecommendedLevel(s: {
  unlockedIndex: number; bestStage: Record<string, number>; levelProgress: Record<string, number>; bossDown: number[];
}): number {
  const r = Math.min(REGIONS.length - 1, Math.max(0, Math.floor(s.unlockedIndex)));
  const id = REGIONS[r].id, last = regionStageCount(r) - 1;
  const stage = s.bossDown.includes(r) ? last : Math.max(s.bestStage[id] ?? 0, s.levelProgress[id] ?? 0);
  return recommendedLevel(r, Math.min(last, Math.max(0, stage)));
}
export function catchupMultiplier(delta: number): number {
  return delta <= -4 ? 1.25 : delta <= 3 ? 1 : delta <= 7 ? 0.7 : delta <= 10 ? 0.4 : delta <= 12 ? 0.2 : 0;
}
export function catchupXp(level: number, xp: number, raw: number, classCap: number, frontier: number) {
  const cap = Math.min(MAX_LEVEL, classCap, frontier + 13);
  const before = cumulativeXpAtLevel(level) + xp;
  let lv = level, cur = xp, remaining = raw, bonus = 0;
  // 已有主線暫存不受副本上限影響，也不挪作副本新獎勵。
  if (lv < cap && cur < xpToNext(lv)) {
    while (lv < cap && remaining > 1e-9) {
      const mult = catchupMultiplier(lv - frontier);
      if (mult <= 0) break;
      const gap = xpToNext(lv) - cur;
      const spent = Math.min(remaining, gap / mult);
      cur += spent * mult;
      bonus += spent * Math.max(0, mult - 1);
      remaining -= spent;
      if (cur >= xpToNext(lv) - 1e-8) { cur = 0; lv++; }
      else break;
    }
  }
  cur = Math.round(cur);
  if (lv < cap && cur >= xpToNext(lv)) { cur = 0; lv++; }
  const accepted = cumulativeXpAtLevel(lv) + cur - before;
  const catchupBonus = Math.round(bonus);
  return { level: lv, xp: cur, levelsGained: lv - level, accepted,
    bonus: catchupBonus, deducted: Math.max(0, raw + catchupBonus - accepted) };
}
export const allowanceCap = (unlocked: number) => 150 + 50 * Math.min(8, Math.max(0, Math.floor(unlocked)));
export function allowance(deducted: number, used: number, remainder: number, cap: number) {
  const pool = remainder + deducted;
  const gold = Math.max(0, Math.min(cap - used, Math.floor(pool / 8)));
  return { gold, used: used + gold, remainder: used + gold >= cap ? 0 : pool % 8 };
}
