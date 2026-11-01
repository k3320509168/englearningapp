import type { Question, QuestionSkill } from './types';
import { knowledgeKey } from './knowledge';
import { questionSkill } from './QuestionData';
export const MASTERY_TARGET = [60, 65, 70, 80, 85, 90, 100, 105, 110];
export const MASTERY_PACKS = [2, 2, 2, 3, 3, 3, 4, 4, 4];
export interface MapMastery {
  cleared: number; // 20個小關的bitset，不能用跳級開圖代替通關
  total: number;
  items: string[];
  skills: Record<QuestionSkill, number>;
  day: string;
  dailyKnowledge: Record<string, number>;
  dailyItems: string[];
  speechFallback: boolean;
  spoken: number;
  claimed: boolean;
}
export const emptyMapMastery = (): MapMastery => ({ cleared: 0, total: 0, items: [], skills: { listening: 0, reading: 0, speaking: 0, writing: 0 }, day: '', dailyKnowledge: {}, dailyItems: [], speechFallback: false, spoken: 0, claimed: false });
export function recordMastery(prev: MapMastery | undefined, q: Question, day: string, fallback: boolean): MapMastery {
  const s = prev ?? emptyMapMastery();
  if (s.claimed) return s;
  const counts = s.day === day ? s.dailyKnowledge : {};
  const daily = s.day === day ? s.dailyItems : [];
  const key = knowledgeKey(q), item = `${q.type}|${q.desc}|${q.speak ?? ''}`;
  if ((counts[key] ?? 0) >= 2 || daily.includes(item)) return s;
  const skill = questionSkill(q);
  return { ...s, total: s.total + 1, items: s.items.includes(item) ? s.items : [...s.items, item], skills: { ...s.skills, [skill]: s.skills[skill] + 1 }, day,
    dailyKnowledge: { ...counts, [key]: (counts[key] ?? 0) + 1 }, dailyItems: [...daily, item], spoken: s.spoken + (skill === 'speaking' && !fallback ? 1 : 0), speechFallback: s.speechFallback || (skill === 'speaking' && fallback) };
}
export function masteryReady(region: number, s?: MapMastery): boolean {
  const target = MASTERY_TARGET[region];
  return !!s && !!target && s.cleared === (1 << 20) - 1 && s.total >= target && s.items.length >= Math.ceil(s.total * 0.6) &&
    s.skills.listening >= Math.ceil(s.total * 0.15) && s.skills.reading >= Math.ceil(s.total * 0.15) &&
    s.skills.speaking >= Math.ceil(s.total * 0.1) && s.skills.writing >= Math.ceil(s.total * 0.1);
}
