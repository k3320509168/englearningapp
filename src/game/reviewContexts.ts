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
  { key: 'choice:【倒裝】Only after the audit ___ the scale of the discrepancy.', objective: 'g:restricted_inversion', family: 'audit-revelation', context: 'corporate-audit', expectedAnswer: 'did the board recognise' },
  { key: 'choice:【倒裝】Only when the allocation became public ___ the conflict of interest.', objective: 'g:restricted_inversion', family: 'public-disclosure', context: 'public-allocations', expectedAnswer: 'did the members acknowledge' },
  { key: 'choice:【文法】Only after the discrepancy was pointed out ___ the two bookings had been treated differently.', objective: 'g:restricted_inversion', family: 'customer-explanation', context: 'booking-service', expectedAnswer: 'did the agent explain why' },
  { key: "choice:【時態】The trial is still under way. Researchers ___ the new coating for six months now.", objective: "g:ongoing_present_perfect_progressive", family: "materials-testing", context: "research", expectedAnswer: "have been testing" },
  { key: "choice:【時態語意】She began lessons last spring and still attends them. Which form links that start to an activity continuing now? She ___ the language for almost a year.", objective: "g:ongoing_present_perfect_progressive", family: "ongoing-lessons", context: "education", expectedAnswer: "has been studying" },
  { key: "choice:【時態】Our competitors ___ aggressively in artificial intelligence for the past few years to gain market share.", objective: "g:ongoing_present_perfect_progressive", family: "business-investment", context: "industry", expectedAnswer: "have been investing" },
  { key: "choice:【文法】The phrase is one to ___ the recipient can assent without agreeing to the proposed action.", objective: "g:preposition_relative_which", family: "assent-wording", context: "interpretation", expectedAnswer: "which" },
  { key: "choice:【文法】The assurance is one on ___ the buyer cannot rely without knowing its limits.", objective: "g:preposition_relative_which", family: "reliance-guarantee", context: "commerce", expectedAnswer: "which" },
  { key: "choice:【文法】The inference depends on a premise, the truth of ___ has not been established.", objective: "g:preposition_relative_which", family: "evaluating-premise", context: "argumentation", expectedAnswer: "which" },
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
