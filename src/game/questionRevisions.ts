import revisions from './questions/revisions-v25.json';
import type { Question } from './types';
const patches = revisions as Record<string, Question>;

// 只替換本批人工修訂的精確舊題，不以答案單字粗略覆蓋其他題義。
export function revisedQuestion(q: Question): Question {
  return patches[`${q.type}|${q.desc}|${q.speak ?? ''}`] ?? q;
}
