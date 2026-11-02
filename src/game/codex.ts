import { getPool } from './QuestionData';
import { vocabFor, vocabKey, VOCAB } from './vocab';
import { completedSentence, questionAudio, questionKey } from './battle';
import { masteryStars } from './progression';
import type { Question } from './types';

// 圖鑑＝單字圖鑑：把題庫整理成「單字」、「片語」與「文法」收藏，同一個字的不同題型合併計算熟練度

export interface CodexStats {
  correct: number;
  wrong: number;
}

export interface CodexItem {
  id: string;
  kind: 'word' | 'phrase' | 'grammar';
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
  vocabKey?: string;
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
    let word = vocabKey(q);
    let v = vocabFor(q);

    // 智慧識別：若選擇題正確選項直接命中字典單字或片語，作為單字/片語卡片建立
    if (!word && q.type === 'choice' && q.options) {
      const opt = q.options.find(o => o.startsWith(`${q.ans}.`));
      if (opt) {
        const candidate = opt.replace(/^[A-D]\.\s*/, '').trim();
        const candidateKey = candidate.toUpperCase();
        const entry = VOCAB[candidateKey] || VOCAB[candidate];
        if (entry) {
          word = candidateKey;
          v = { ...entry, key: candidateKey, display: entry.word ?? candidate.toLowerCase() };
        }
      }
    }

    const isPhrase = Boolean(word && (word.includes(' ') || word.includes('-') || v?.pos?.toLowerCase().includes('phrase') || v?.pos?.includes('片語')));
    const kind: 'word' | 'phrase' | 'grammar' = word ? (isPhrase ? 'phrase' : 'word') : 'grammar';
    const id = word ? `${kind}:${word}` : `g:${q.desc}`;
    const stats = codex[questionKey(q)];
    const item = items.get(id) ?? {
      id,
      kind,
      title: v?.display ?? (word || grammarTitle(q)),
      subtitle: v?.meaning ?? q.explain ?? q.desc ?? '',
      pos: v?.pos ?? (kind === 'phrase' ? 'phrase' : kind === 'grammar' ? 'grammar' : ''),
      example: v ? `${v.example}\n${v.exampleZh}` : (q.desc && q.desc !== grammarTitle(q) ? q.desc : ''),
      audio: v?.display ?? questionAudio(q),
      correct: 0, wrong: 0, seen: false, stars: 0, needsReview: false,
      vocabKey: v?.key ?? (word || undefined),
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
