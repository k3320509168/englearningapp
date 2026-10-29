// 用 Gemini 聊天室出題（不經過 API）：產生要貼給 Gemini 的提示詞 → 把回覆的 JSON 存成檔案 → 匯入題庫。
// 匯入時和 API 流程（generate-questions.ts）走一模一樣的驗證、去重與單字資料處理，寫進同一份 bank/r*.json。
//
//   npx tsx scripts/chat-batch.ts prompt --level 0 --skill writing --count 40 --out prompt.txt
//   npx tsx scripts/chat-batch.ts import --level 0 --skill writing --file reply.json
//   npx tsx scripts/chat-batch.ts import --level 0 --skill writing --download   （讀下載資料夾最新的檔案）
//   npx tsx scripts/chat-batch.ts status
import { copyFileSync, mkdirSync, readFileSync, readdirSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { LEVELS, QUESTION_POOL } from '../src/game/QuestionData';
import './loadBanks';
import { VOCAB, vocabKey } from '../src/game/vocab';
import { bankFile, bankVocabFile } from '../src/game/questions/bank';
import type { BankFile } from '../src/game/questions/bank';
import type { Question, QuestionSkill, VocabEntry } from '../src/game/types';
import { BANK_SKILLS, buildSkillPrompt, skillTarget, countSkill, parseBatch, reviewBatch, tagBatch } from '../src/game/questionPipeline';

const [mode, ...args] = process.argv.slice(2);
const arg = (name: string, fallback: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const readJson = <T>(file: string): T => JSON.parse(readFileSync(file, 'utf-8')) as T;
const writeJson = (file: string, data: unknown) => writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
const wordOf = (q: Question) => vocabKey(q) ?? (q.type === 'voice' ? q.ans : null);

// Gemini「下載程式碼」存進下載資料夾的最新檔案（有時副檔名是 .tmp，內容仍是完整的 JSON）
function latestDownload(): string {
  const dir = join(homedir(), 'Downloads');
  const files = readdirSync(dir)
    .filter(f => /\.(json|tmp|md|txt)$/i.test(f))
    .map(f => ({ path: join(dir, f), time: statSync(join(dir, f)).mtimeMs }))
    .filter(f => Date.now() - f.time < 10 * 60_000)
    .sort((a, b) => b.time - a.time);
  if (!files.length) throw new Error('下載資料夾 10 分鐘內沒有新的檔案');
  return files[0].path;
}

const level = Number(arg('level', '0'));
const skill = arg('skill', 'writing') as QuestionSkill;
const existing: Question[] = Object.values(QUESTION_POOL).flatMap(p => [...p.normal, ...p.boss]);

if (mode === 'status') {
  LEVELS.forEach((name, i) => {
    const file = readJson<BankFile>(bankFile(i));
    console.log(`${name}：${BANK_SKILLS.map(s => `${s} ${countSkill(file, s)}/${skillTarget(i, s)}`).join('、')}`);
  });
} else if (mode === 'prompt') {
  if (!BANK_SKILLS.includes(skill)) throw new Error(`--skill 只能是 ${BANK_SKILLS.join('／')}`);
  // 只附同一個區域、同一項技能已有的題目，提示詞才不會長到貼不進聊天室
  const pool = QUESTION_POOL[LEVELS[level]];
  const levelQs = [...pool.normal, ...pool.boss];
  const same = levelQs.filter(q => q.skill === skill);
  // 聽力題的題目文字都一樣，改給已經播過的英文，Gemini 才知道哪些不要重複
  const seen = same.map(q => (skill === 'listening' ? q.speak ?? q.desc : q.desc));
  const words = levelQs.map(wordOf).filter((w): w is string => !!w);
  const prompt = buildSkillPrompt(LEVELS[level], skill, Number(arg('count', '40')), seen, words);
  writeFileSync(arg('out', 'prompt.txt'), prompt);
  console.log(`提示詞 ${prompt.length} 字，已寫入 ${arg('out', 'prompt.txt')}`);
} else if (mode === 'import') {
  const file = readJson<BankFile>(bankFile(level));
  const vocab = readJson<Record<string, VocabEntry>>(bankVocabFile(level));
  const knownWords = new Set([...Object.keys(VOCAB), ...Object.keys(vocab)]);
  const source = args.includes('--download') ? latestDownload() : arg('file', 'reply.json');
  const text = readFileSync(source, 'utf-8');
  // 壞掉的檔案整批不收（例如 Gemini 中途重來、輸出被截斷），題庫保持原樣
  let parsed;
  try {
    parsed = parseBatch(text);
  } catch (e) {
    console.log(`✖ 整批不收：JSON 解析失敗（${(e as Error).message.slice(0, 80)}），檔案留在 ${source}`);
    process.exit(1);
  }
  if (/```/.test(text.trim().replace(/^```(?:json)?/, '').replace(/```\s*$/, ''))) {
    console.log(`✖ 整批不收：回覆裡有第二個程式碼區塊（Gemini 中途重來），檔案留在 ${source}`);
    process.exit(1);
  }
  const batch = tagBatch(parsed, skill);
  // 匯入過的下載檔移到 --archive 資料夾，下一批才不會重複匯入
  if (args.includes('--download')) {
    const dir = arg('archive', join(homedir(), 'Downloads', 'gemini-batches'));
    mkdirSync(dir, { recursive: true });
    // 可能是不同磁碟（例如 D:），不能直接 rename：先複製再移除下載檔
    copyFileSync(source, join(dir, `${LEVELS[level].split(' ')[0]}-${skill}-${Date.now()}.json`));
    unlinkSync(source);
  }
  const reviewed = reviewBatch(batch, existing);
  for (const a of reviewed.accepted) {
    file[a.deck].push(a.question);
    const w = wordOf(a.question);
    if (w && batch.vocab[w] && !knownWords.has(w)) {
      vocab[w] = batch.vocab[w];
      knownWords.add(w);
    }
  }
  writeJson(bankFile(level), file);
  writeJson(bankVocabFile(level), vocab);
  console.log(`${LEVELS[level]}・${skill}：新增 ${reviewed.accepted.length} 題、丟棄 ${reviewed.rejected.length} 題，目前 ${countSkill(file, skill)}/${skillTarget(level, skill)}`);
  for (const r of reviewed.rejected) console.log(`  ✖ ${JSON.stringify(r.question).slice(0, 90)}：${r.reasons.join('；')}`);
  const warned = reviewed.accepted.filter(a => a.warnings.length);
  for (const a of warned) console.log(`  ⚠ ${a.question.desc}：${a.warnings.join('；')}`);
} else {
  console.log('用法：chat-batch.ts prompt|import|status（說明見檔案開頭）');
}
