import { completedSentence, questionHint } from './battle';
import { vocabFor } from './vocab';
import type { Question } from './types';

// 題目的「答案」怎麼顯示與發音：單字題顯示單字，選擇題顯示完整句子或正確選項
export function answerLabel(q: Question): { text: string; audio: string; meaning: string } {
  const v = vocabFor(q);
  if (v) return { text: v.display, audio: v.display, meaning: v.meaning };
  // 選擇題：有空格就顯示完整句子，否則（例如「早餐的英文是？」）顯示正確選項
  const sentence = completedSentence(q);
  const option = q.options?.find(o => o.startsWith(`${q.ans}.`))?.replace(/^[A-D]\.\s*/, '') ?? '';
  return { text: sentence || option || q.desc, audio: sentence || option, meaning: q.explain ?? questionHint(q) };
}
