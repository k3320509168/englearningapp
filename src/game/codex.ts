import { getPool } from './QuestionData';
import { vocabFor, vocabKey } from './vocab';
import { completedSentence, questionKey } from './battle';
import { masteryStars } from './progression';
import type { Question } from './types';

// 圖鑑＝單字圖鑑：把題庫整理成「單字」與「文法」兩種收藏，同一個字的不同題型合併計算熟練度

export interface CodexStats {
  correct: number;
  wrong: number;
}

export interface CodexItem {
  id: string;
  kind: 'word' | 'grammar';
  title: string;
  subtitle: string;
  pos: string;
  example: string;
  audio: string;
  correct: number;
  wrong: number;
  seen: boolean;
  stars: number;
  needsReview: boolean;
}

function grammarTitle(q: Question): string {
  const sentence = completedSentence(q);
  if (sentence) return sentence;
  return q.options?.find(o => o.startsWith(`${q.ans}.`))?.replace(/^[A-D]\.\s*/, '') ?? q.desc;
}

export function codexItems(
  levelKey: string,
  codex: Record<string, CodexStats>,
  mistakes: Record<string, unknown>,
): CodexItem[] {
  const pool = getPool(levelKey);
  const items = new Map<string, CodexItem>();

  for (const q of [...pool.normal, ...pool.boss]) {
    const word = vocabKey(q);
    const v = vocabFor(q);
    const id = word ? `w:${word}` : `g:${q.desc}`;
    const stats = codex[questionKey(q)];
    const item = items.get(id) ?? {
      id,
      kind: word ? 'word' as const : 'grammar' as const,
      title: v?.display ?? grammarTitle(q),
      subtitle: v?.meaning ?? q.explain ?? '',
      pos: v?.pos ?? '',
      example: v ? `${v.example}\n${v.exampleZh}` : '',
      audio: v?.display ?? completedSentence(q),
      correct: 0, wrong: 0, seen: false, stars: 0, needsReview: false,
    };
    item.correct += stats?.correct ?? 0;
    item.wrong += stats?.wrong ?? 0;
    item.seen ||= stats !== undefined;
    item.needsReview ||= questionKey(q) in mistakes;
    item.stars = masteryStars(item.correct);
    items.set(id, item);
  }
  return [...items.values()];
}
