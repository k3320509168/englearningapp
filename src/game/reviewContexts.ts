import { questionKey } from './battle';
import type { Question } from './types';

export interface ReviewContext {
  key: string;
  objective: string;
  family: string;
  context: string;
  expectedAnswer: string;
}

// 同一子考點：肯定陳述句的單數第三人稱 be。題目來源為正式 A1 題庫。
export const REVIEW_CONTEXTS: readonly ReviewContext[] = [
  { key: 'choice:【職場文法】David ___ an engineer at a tech company in Taipei.', objective: 'g:be_verb', family: 'occupation', context: 'work', expectedAnswer: 'is' },
  { key: 'choice:【學校文法】Our teacher ___ in the classroom before 8:00 every morning.', objective: 'g:be_verb', family: 'location', context: 'school', expectedAnswer: 'is' },
  { key: 'choice:【家庭文法】My grandmother ___ seventy years old.', objective: 'g:be_verb', family: 'age', context: 'home', expectedAnswer: 'is' },
];

const byObjective = new Map<string, ReviewContext[]>();
for (const context of REVIEW_CONTEXTS) {
  const group = byObjective.get(context.objective) ?? [];
  group.push(context);
  byObjective.set(context.objective, group);
}

export function preferReviewContext(
  objective: string,
  candidates: readonly Question[],
  history: Readonly<Record<string, { correct: number; wrong: number }>>,
): readonly Question[] {
  const group = byObjective.get(objective);
  if (!group) return candidates;

  const seen = group.filter(entry => (history[entry.key]?.correct ?? 0) + (history[entry.key]?.wrong ?? 0) > 0);
  if (!seen.some(entry => (history[entry.key]?.correct ?? 0) > 0)) return candidates;

  const byKey = new Map(group.map(entry => [entry.key, entry]));
  const fresh = candidates.filter(question => {
    const key = questionKey(question);
    const entry = byKey.get(key);
    return entry && !history[key] && seen.every(previous => previous.family !== entry.family && previous.context !== entry.context);
  });
  return fresh.length ? fresh : candidates;
}
