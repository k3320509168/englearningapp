import revisions from './questions/revisions-v25.json';
import type { Question } from './types';
const patches = revisions as Record<string, Question>;

// 只替換本批人工修訂的精確舊題，不以答案單字粗略覆蓋其他題義。
export function revisedQuestion(q: Question): Question {
  return patches[`${q.type}|${q.desc}|${q.speak ?? ''}`] ?? q;
}

// 遷移同一教學概念改名後的詞彙知識紀錄。
export const revisedLexicalKeys = Object.entries(patches).flatMap(([old, question]) => {
  if (!old.startsWith('voice|') || question.type !== 'voice' || question.knowledgeType !== 'lexical' || !question.speak) return [];
  const previous = old.slice(old.lastIndexOf('|') + 1);
  return previous && previous !== question.speak
    ? [[`w:${previous.toLowerCase()}`, `w:${question.speak.toLowerCase()}`] as const]
    : [];
});
