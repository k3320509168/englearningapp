import './loadBanks';
import { QUESTION_POOL } from '../src/game/QuestionData';
import { ADVANCED_REVIEW_READING } from '../src/game/placementReviewReading';
import { TRANSFER_CHECK_ITEMS } from '../src/game/transferCheckItems';
import { TRANSFER_PRACTICE_ITEMS } from '../src/game/transferPractice';
import { PLACEMENT_LEVELS, startPlacementReview } from '../src/game/placementTest';
import diag from '../src/game/questions/bank/diag.json';

const normalize = (text: string) => text.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
const occupied = new Set([
  ...Object.values(QUESTION_POOL).flatMap(pool => [...pool.normal, ...pool.boss].map(q => normalize(q.desc))),
  ...diag.map(q => normalize(q.desc)),
  ...[...TRANSFER_PRACTICE_ITEMS, ...TRANSFER_CHECK_ITEMS].map(q => normalize(q.source)),
]);
const issues: string[] = [];
for (const [level, entries] of Object.entries(ADVANCED_REVIEW_READING)) {
  if (!['7', '8', '9'].includes(level)) issues.push(`不支援的進階複測層級 ${level}`);
  for (const question of entries ?? []) {
    const id = normalize(question.desc);
    if (!id || occupied.has(id) || question.type !== 'choice' || question.skill !== 'reading' || question.speak) issues.push(`複測素材重複或題型不符：${question.desc}`);
    occupied.add(id);
    const options = question.options ?? [];
    const bodies = options.map(option => normalize(option.slice(3)));
    if (options.length !== 4 || options.some((option, i) => !option.startsWith(`${'ABCD'[i]}. `)) ||
      bodies.includes('') || new Set(bodies).size !== 4 || !/^[A-D]$/.test(question.ans) || !question.explain?.trim()) {
      issues.push(`複測選項或解析無效：${question.desc}`);
    }
  }
}
for (const level of [7, 8, 9]) if (!ADVANCED_REVIEW_READING[level]?.length) issues.push(`複測層級缺少獨立閱讀題：${level}`);
for (let level = 1; level < PLACEMENT_LEVELS.length; level++) {
  for (const voice of [true, false]) {
    const review = startPlacementReview({ level }, { voice, rand: () => 0.5 });
    if (review.level !== level || review.queue.length !== review.requiredTotal) {
      issues.push(`診斷庫題量不足：${PLACEMENT_LEVELS[level]}（${voice ? '含口說' : '無麥克風'}）`);
    }
  }
}
for (const issue of issues) console.error(issue);
if (issues.length) process.exitCode = 1;
else console.log('高階程度複測素材隔離檢查通過');
