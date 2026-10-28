// 題庫自動擴充：呼叫 Gemini 出題 → 逐題驗證與去重 → 寫入 src/game/questions/*.json → 產生 PR 說明。
//
// 用法：
//   GEMINI_API_KEY=xxx npx tsx scripts/generate-questions.ts --level 0 --count 12
//   npx tsx scripts/generate-questions.ts --level 0 --dry-run   （不呼叫 API，用內建範例測試流程）
//
// 環境變數：GEMINI_API_KEY（必填，除非 --dry-run）、GEMINI_MODEL（預設 gemini-3.8-flash）
// 產生的 PR 說明寫在 question-report.md，GitHub Actions 會拿來當 PR 內容。
import { readFileSync, writeFileSync } from 'node:fs';
import { LEVELS, QUESTION_POOL } from '../src/game/QuestionData';
import { addToPool, buildPrompt, parseBatch, reviewBatch, reviewReport } from '../src/game/questionPipeline';

const POOL_FILE = 'src/game/questions/generated.json';
const VOCAB_FILE = 'src/game/questions/generated-vocab.json';
const REPORT_FILE = 'question-report.md';

const args = process.argv.slice(2);
const arg = (name: string, fallback: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const dryRun = args.includes('--dry-run');
const levelKey = LEVELS[Number(arg('level', '0'))] ?? LEVELS[0];
const count = Number(arg('count', '12'));

const SAMPLE = JSON.stringify({
  normal: [{ type: 'spell', desc: '請拼出：（測試）行事曆', ans: 'CALENDARX', speak: 'calendarx' }],
  boss: [],
  vocab: { CALENDARX: { pos: 'n.', meaning: '（測試）行事曆', example: 'This is a dry run.', exampleZh: '這是流程測試。' } },
});

async function callGemini(prompt: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('缺少 GEMINI_API_KEY（請在 GitHub Secrets 或環境變數設定）');
  const model = process.env.GEMINI_MODEL ?? 'gemini-3.8-flash';
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.8 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini API 錯誤 ${res.status}：${await res.text()}`);
  const data = await res.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = data.candidates?.[0]?.content?.parts?.map(p => p.text ?? '').join('') ?? '';
  if (!text) throw new Error('Gemini 沒有回傳內容');
  return text;
}

const existing = Object.values(QUESTION_POOL).flatMap(p => [...p.normal, ...p.boss]);
const prompt = buildPrompt(levelKey, count, existing.map(q => q.desc));
const text = dryRun ? SAMPLE : await callGemini(prompt);
const batch = parseBatch(text);
const reviewed = reviewBatch(batch, existing);

const pool = JSON.parse(readFileSync(POOL_FILE, 'utf-8'));
const vocab = JSON.parse(readFileSync(VOCAB_FILE, 'utf-8'));
const usedWords = new Set(reviewed.accepted.map(a => (a.question.speak ?? a.question.ans).toUpperCase().replace(/[^A-Z]/g, '')));
const newVocab = Object.fromEntries(Object.entries(batch.vocab).filter(([k]) => usedWords.has(k) && !vocab[k]));

const report = reviewReport(levelKey, reviewed);
writeFileSync(REPORT_FILE, report);
console.log(report);

if (dryRun) {
  console.log('\n（dry-run：沒有寫入題庫）');
} else if (reviewed.accepted.length > 0) {
  writeFileSync(POOL_FILE, `${JSON.stringify(addToPool(pool, levelKey, reviewed.accepted), null, 2)}\n`);
  writeFileSync(VOCAB_FILE, `${JSON.stringify({ ...vocab, ...newVocab }, null, 2)}\n`);
  console.log(`\n已寫入 ${reviewed.accepted.length} 題、${Object.keys(newVocab).length} 個單字`);
} else {
  console.log('\n沒有可用的新題目');
  process.exit(1);
}
