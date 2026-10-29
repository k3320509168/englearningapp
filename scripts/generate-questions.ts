// 題庫自動擴充：呼叫 Gemini 出題 → 逐題驗證與去重 → 寫入題庫 JSON → 產生 PR 說明。
//
// CEFR 題庫（每個區域聽說讀寫各 250 題，存在 src/game/questions/bank/）：
//   GEMINI_API_KEY=xxx npx tsx scripts/generate-questions.ts --level all --skill all --target 250 --batch 40 --max-calls 60
//   --level 0～5 或 all；--skill listening／speaking／reading／writing 或 all；
//   --target 每個區域每項技能的目標題數；--batch 每次呼叫要幾題；--max-calls 這次最多呼叫幾次（沒補滿的下次接著補）
//   npx tsx scripts/generate-questions.ts --level 0 --skill writing --dry-run   （不呼叫 API，用內建範例測試流程）
//
// 舊模式（不分技能，寫入 questions/generated.json）：--legacy --level 0 --count 12
//
// 環境變數：GEMINI_API_KEY（必填，除非 --dry-run）、GEMINI_MODEL（預設 gemini-3.8-flash）
// 產生的 PR 說明寫在 question-report.md，GitHub Actions 會拿來當 PR 內容。
import { readFileSync, writeFileSync } from 'node:fs';
import { LEVELS, QUESTION_POOL } from '../src/game/QuestionData';
import './loadBanks';
import { VOCAB, vocabKey } from '../src/game/vocab';
import { bankFile, bankVocabFile } from '../src/game/questions/bank';
import type { BankFile } from '../src/game/questions/bank';
import type { Question, QuestionSkill, VocabEntry } from '../src/game/types';
import {
  BANK_SKILLS, addToPool, skillTarget, buildPrompt, buildSkillPrompt, countSkill, parseBatch, reviewBatch, reviewReport, tagBatch,
} from '../src/game/questionPipeline';
import type { GeneratedBatch, Reviewed } from '../src/game/questionPipeline';

const POOL_FILE = 'src/game/questions/generated.json';
const VOCAB_FILE = 'src/game/questions/generated-vocab.json';
const REPORT_FILE = 'question-report.md';

const args = process.argv.slice(2);
const arg = (name: string, fallback: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const dryRun = args.includes('--dry-run');

const SAMPLE = JSON.stringify({
  normal: [{ type: 'spell', skill: 'writing', difficulty: 1, desc: '請拼出：（測試）行事曆', ans: 'CALENDARX', speak: 'calendarx' }],
  boss: [],
  vocab: {
    CALENDARX: {
      pos: 'n.', meaning: '（測試）行事曆', example: 'This is a dry run.', exampleZh: '這是流程測試。',
      senses: [{ pos: 'n.', meaning: '（測試）行事曆', examples: [{ en: 'Check the calendarx.', zh: '看一下行事曆。' }] }],
    },
  },
});

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// 免費額度是「每個模型每天 20 次」，而且失敗的呼叫（503 忙碌）也會算進去。
// 所以：忙碌時不在同一個模型上重試，直接換下一個模型（各模型額度分開算）；
// 某個模型今天的額度用完就整天不再用它；全部用完就結束這次執行，已拿到的題目照樣開 PR。
const API = 'https://generativelanguage.googleapis.com/v1beta';
let models: string[] | null = null;
const exhausted = new Set<string>();

class QuotaExhausted extends Error {}

async function listModels(key: string): Promise<string[]> {
  if (process.env.GEMINI_MODELS) return process.env.GEMINI_MODELS.split(',').map(s => s.trim()).filter(Boolean);
  const preferred = process.env.GEMINI_MODEL ?? 'gemini-3.8-flash';
  try {
    const res = await fetch(`${API}/models?pageSize=200`, { headers: { 'x-goog-api-key': key } });
    const data = await res.json() as { models?: { name: string; supportedGenerationMethods?: string[] }[] };
    const names = (data.models ?? [])
      .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
      .map(m => m.name.replace('models/', ''))
      .filter(n => /^gemini-[\d.]+-(flash|pro)/.test(n) && !/image|tts|audio|live|embedding|preview-\d{2}-\d{2}/.test(n));
    // 先用指定的模型，其餘 flash 優先（快、額度較多），再來 pro
    const rest = names.filter(n => n !== preferred).sort((a, b) => Number(b.includes('flash')) - Number(a.includes('flash')) || b.localeCompare(a));
    return [preferred, ...rest];
  } catch {
    return [preferred];
  }
}

async function callGemini(prompt: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('缺少 GEMINI_API_KEY（請在 GitHub Secrets 或環境變數設定）');
  if (!models) {
    models = await listModels(key);
    console.log(`可用模型：${models.join('、')}`);
  }
  for (const model of models.filter(m => !exhausted.has(m))) {
    const res = await fetch(`${API}/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.8 },
      }),
    });
    if (res.ok) {
      const data = await res.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
      const text = data.candidates?.[0]?.content?.parts?.map(p => p.text ?? '').join('') ?? '';
      if (!text) throw new Error(`${model} 沒有回傳內容`);
      return text;
    }
    const body = await res.text();
    if (res.status === 429 && /per.?day|PerDay/i.test(body)) {
      console.log(`::warning::${model} 今天的免費額度用完了，改用下一個模型`);
      exhausted.add(model);
    } else if (res.status === 429) {
      console.log(`${model} 每分鐘次數太多，等 60 秒`);
      await sleep(60_000);
    } else if (res.status >= 500) {
      console.log(`${model} 忙碌（${res.status}），改用下一個模型`);
    } else {
      console.log(`::warning::${model} 錯誤 ${res.status}：${body.slice(0, 300)}`);
      exhausted.add(model);
    }
  }
  if (models.every(m => exhausted.has(m))) throw new QuotaExhausted('所有模型今天的額度都用完了');
  await sleep(30_000); // 全部都忙：等一下，下一次呼叫再輪一次
  throw new Error('所有模型都忙碌，這次先跳過');
}

const readJson = <T>(file: string): T => JSON.parse(readFileSync(file, 'utf-8')) as T;
const writeJson = (file: string, data: unknown) => writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
const wordOf = (q: Question) => vocabKey(q) ?? (q.type === 'voice' ? q.ans : null);

// ---------- 舊模式 ----------
async function legacy() {
  const levelKey = LEVELS[Number(arg('level', '0'))] ?? LEVELS[0];
  const count = Number(arg('count', '12'));
  const existing = Object.values(QUESTION_POOL).flatMap(p => [...p.normal, ...p.boss]);
  const batch = parseBatch(dryRun ? SAMPLE : await callGemini(buildPrompt(levelKey, count, existing.map(q => q.desc))));
  const reviewed = reviewBatch(batch, existing);
  const pool = readJson<Record<string, BankFile>>(POOL_FILE);
  const vocab = readJson<Record<string, VocabEntry>>(VOCAB_FILE);
  const usedWords = new Set(reviewed.accepted.map(a => (a.question.speak ?? a.question.ans).toUpperCase().replace(/[^A-Z]/g, '')));
  const newVocab = Object.fromEntries(Object.entries(batch.vocab).filter(([k]) => usedWords.has(k) && !vocab[k]));
  const report = reviewReport(levelKey, reviewed);
  writeFileSync(REPORT_FILE, report);
  console.log(report);
  if (dryRun) return console.log('\n（dry-run：沒有寫入題庫）');
  if (reviewed.accepted.length === 0) {
    console.log('\n沒有可用的新題目');
    process.exit(1);
  }
  writeJson(POOL_FILE, addToPool(pool, levelKey, reviewed.accepted));
  writeJson(VOCAB_FILE, { ...vocab, ...newVocab });
}

// ---------- CEFR 題庫（批次模式）----------
async function bank() {
  const levelArg = arg('level', 'all');
  const skillArg = arg('skill', 'all');
  const levels = levelArg === 'all' ? LEVELS.map((_, i) => i) : [Number(levelArg)];
  const skills = skillArg === 'all' ? BANK_SKILLS : [skillArg as QuestionSkill];
  const fixedTarget = args.includes('--target') ? Number(arg('target', '0')) : null;
  // 免費額度以「次數」計，一次多要一點題目比較划算
  const batchSize = Number(arg('batch', '60'));
  const maxCalls = Number(arg('max-calls', '60'));
  if (skills.some(s => !BANK_SKILLS.includes(s))) throw new Error(`--skill 只能是 ${BANK_SKILLS.join('／')} 或 all`);

  const existing: Question[] = Object.values(QUESTION_POOL).flatMap(p => [...p.normal, ...p.boss]);
  const knownWords = new Set(Object.keys(VOCAB));
  const sections: string[] = [];
  const totals: string[] = [];
  let calls = 0;
  let added = 0;
  let quotaOut = false;

  for (const li of levels) {
    const file = readJson<BankFile>(bankFile(li));
    const vocab = readJson<Record<string, VocabEntry>>(bankVocabFile(li));
    for (const skill of skills) {
      const target = fixedTarget ?? skillTarget(li, skill);
      const all: Reviewed = { accepted: [], rejected: [] };
      // 連續兩次都沒有新題目就換下一項，避免一直重複呼叫
      let misses = 0;
      while (!quotaOut && countSkill(file, skill) < target && calls < maxCalls && misses < 2) {
        const need = Math.min(batchSize, target - countSkill(file, skill));
        const words = existing.map(wordOf).filter((w): w is string => !!w);
        const prompt = buildSkillPrompt(LEVELS[li], skill, need, existing.map(q => q.desc), words);
        calls++;
        let batch: GeneratedBatch;
        let reviewed: Reviewed;
        try {
          batch = tagBatch(parseBatch(dryRun ? SAMPLE : await callGemini(prompt)), skill);
          reviewed = reviewBatch(batch, existing);
        } catch (e) {
          console.log(`第 ${calls} 次呼叫失敗：${(e as Error).message}`);
          if (e instanceof QuotaExhausted) quotaOut = true;
          misses++;
          continue;
        }
        misses = reviewed.accepted.length === 0 ? misses + 1 : 0;
        all.accepted.push(...reviewed.accepted);
        all.rejected.push(...reviewed.rejected);
        for (const a of reviewed.accepted) {
          file[a.deck].push(a.question);
          existing.push(a.question);
          const w = wordOf(a.question);
          if (w && batch.vocab[w] && !knownWords.has(w)) {
            vocab[w] = batch.vocab[w];
            knownWords.add(w);
          }
        }
        console.log(`${LEVELS[li]}・${skill}：${countSkill(file, skill)}/${target}（第 ${calls} 次呼叫，這次 +${reviewed.accepted.length}）`);
        if (dryRun) break;
        await sleep(4000); // 免費額度每分鐘次數有限
      }
      added += all.accepted.length;
      totals.push(`| ${LEVELS[li]} | ${skill} | ${countSkill(file, skill)} / ${target} | +${all.accepted.length} |`);
      if (all.accepted.length || all.rejected.length) sections.push(reviewReport(`${LEVELS[li]}・${skill}`, all));
    }
    if (!dryRun) {
      writeJson(bankFile(li), file);
      writeJson(bankVocabFile(li), vocab);
    }
  }

  const report = [
    `# CEFR 題庫擴充：新增 ${added} 題（呼叫 Gemini ${calls} 次）`, '',
    '| 區域 | 技能 | 目前題數 | 這次新增 |', '|---|---|---|---|', ...totals, '',
    calls >= maxCalls ? '> 這次達到呼叫上限，還沒補滿的部分下次執行會接著補。' : '',
    quotaOut ? '> 所有模型今天的免費額度都用完了，明天（太平洋時間午夜重置後）再執行會接著補。' : '', '',
    ...sections,
  ].join('\n');
  // PR 說明有長度上限（約 65000 字），題目太多時只列前面的部分
  const LIMIT = 60_000;
  writeFileSync(REPORT_FILE, report.length > LIMIT ? `${report.slice(0, LIMIT)}\n\n…（題目太多，其餘請直接看 PR 的檔案變更）` : report);
  console.log(report.slice(0, 3000));
  if (dryRun) console.log('\n（dry-run：沒有寫入題庫）');
  else if (added === 0) {
    console.log('\n沒有可用的新題目');
    process.exit(1);
  }
}

await (args.includes('--legacy') ? legacy() : bank());
