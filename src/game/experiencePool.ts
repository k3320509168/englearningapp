import { REGION_LEVELS } from './progression';
import { xpScale, xpToNext } from './growth';
import { chapterCount, regionStageCount, stageRole } from './stageLayout';
import { MASTERY_TARGET } from './mapMastery';
export function regionXpBudget(region: number): number {
  const [start, end] = REGION_LEVELS[region];
  let sum = 0;
  for (let lv = start; lv < end; lv++) sum += xpToNext(lv);
  return sum * 0.85;
}
const weight = (region: number, stage: number) => {
  const role = stageRole(region, stage);
  return role === 'final' ? 90 : role === 'boss' || role === 'gate' ? 30 : role === 'elite' ? 15 : 6;
};
export function firstClearXp(region: number, stage: number): number {
  if (!Number.isInteger(region) || region < 0 || region >= 9 || !Number.isInteger(stage) || stage < 0 || stage >= regionStageCount(region)) return 0;
  const pool = regionXpBudget(region) * 0.7;
  const totalWeight = 186 * chapterCount(region) + 90;
  const regular = (s: number) => Math.round(pool * weight(region, s) / totalWeight);
  const last = regionStageCount(region) - 1;
  if (stage !== last) return regular(stage);
  let paid = 0;
  for (let s = 0; s < last; s++) paid += regular(s);
  return Math.round(pool) - paid;
}
export function learningXp(region: number, eligible: boolean): number {
  const base = 3 * xpScale(region);
  const target = regionXpBudget(region) * 0.3 / (0.9 * chapterCount(region) * MASTERY_TARGET[region]);
  return Math.round(eligible ? Math.max(base, target) : base);
}
