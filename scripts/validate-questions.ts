// 用法：npm run validate:questions
// 有 error 時以結束碼 1 離開，可接在 CI 或 Gemini 批次生成題庫之後執行。
import { QUESTION_POOL, LEVELS } from '../src/game/QuestionData';
import { validateQuestionPool } from '../src/game/validateQuestions';

const issues = validateQuestionPool(QUESTION_POOL, LEVELS);
const errors = issues.filter(i => i.level === 'error');
const warnings = issues.filter(i => i.level === 'warning');

for (const i of issues) {
  console.log(`${i.level === 'error' ? '✖ 錯誤' : '⚠ 警告'}  [${i.where}] ${i.message}`);
}

const total = Object.values(QUESTION_POOL).reduce((n, p) => n + p.normal.length + p.boss.length, 0);
console.log(`\n共檢查 ${total} 題：${errors.length} 個錯誤、${warnings.length} 個警告`);
process.exit(errors.length > 0 ? 1 : 0);
