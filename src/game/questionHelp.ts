import type { Question } from './types';
import { LEVELS, getPool } from './QuestionData';
import { questionHint } from './battle';
import { vocabFor } from './vocab';

// 拼寫題的補充提示：同一個中文在題庫裡對到不同英文時（例如「開始」= start／commence），
// 只看中文會猜錯，所以補上詞性與第一個字母

let collisions: Map<string, Set<string>> | null = null;

function hintCollisions(): Map<string, Set<string>> {
  if (collisions) return collisions;
  collisions = new Map();
  for (const level of LEVELS) {
    const pool = getPool(level);
    for (const q of [...pool.normal, ...pool.boss]) {
      if (q.type === 'choice') continue;
      const hint = questionHint(q);
      const ans = q.type === 'fill' ? (q.speak ?? '').toUpperCase() : q.ans;
      if (!hint || !ans) continue;
      if (!collisions.has(hint)) collisions.set(hint, new Set());
      collisions.get(hint)!.add(ans);
    }
  }
  return collisions;
}

const POS_NAMES: Record<string, string> = { 'n.': '名詞', 'v.': '動詞', 'adj.': '形容詞', 'adv.': '副詞', 'phr.': '片語', 'n./v.': '名詞／動詞' };

export function spellingExtra(q: Question): string {
  if (q.type !== 'spell') return '';
  const parts: string[] = [];
  const pos = vocabFor(q)?.pos;
  if (pos) parts.push(POS_NAMES[pos] ?? pos);
  if ((hintCollisions().get(questionHint(q))?.size ?? 0) > 1) parts.push(`${q.ans[0]} 開頭`);
  return parts.join('・');
}
