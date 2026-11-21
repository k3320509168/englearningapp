import './loadBanks';
import { questionKey } from '../src/game/battle';
import { knowledgeKey } from '../src/game/knowledge';
import { QUESTION_POOL } from '../src/game/QuestionData';
import { REVIEW_CONTEXTS } from '../src/game/reviewContexts';

const questions = Object.values(QUESTION_POOL).flatMap(pool => pool.normal);
const keys = new Set<string>();
const dimensions = new Set<string>();
const counts = new Map<string, number>();
let errors = 0;
function fail(message: string) {
  errors++;
  console.error(message);
}
for (const entry of REVIEW_CONTEXTS) {
  if (keys.has(entry.key)) fail(`重複題目：${entry.key}`);
  keys.add(entry.key);
  const matches = questions.filter(question => questionKey(question) === entry.key);
  if (matches.length !== 1 || matches.some(q => q.type !== 'choice' || q.speak || knowledgeKey(q) !== entry.objective ||
    !q.options?.some(option => option === `${q.ans}. ${entry.expectedAnswer}`))) {
    fail(`題目已移除或更換考點／答案：${entry.key}`);
  }
  counts.set(entry.objective, (counts.get(entry.objective) ?? 0) + 1);
  for (const field of ['context', 'family'] as const) {
    const value = entry[field].trim().toLowerCase();
    const dimension = `${entry.objective}:${field}:${value}`;
    if (!value || dimensions.has(dimension)) fail(`考點內的 ${field} 必須相異：${entry.key}`);
    dimensions.add(dimension);
  }
}
for (const [objective, count] of counts) if (count < 2) fail(`考點缺少異情境題：${objective}`);
if (errors) process.exitCode = 1;
else console.log(`正式複習情境檢查通過（${keys.size} 題）`);
