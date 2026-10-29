// 審題：把還沒審過的選擇題（聽力、閱讀）匯出成文字檔，上傳給 Gemini Pro 檢查；
// 再把它回傳的結果匯回：能修正的套用修正，修不好的刪掉，並記錄哪些題目已經審過。
//
//   npx tsx scripts/review-batch.ts export --level 0 --skill reading --count 80 --out D:/Game_q_storege/review-L0-reading.txt
//   npx tsx scripts/review-batch.ts apply --level 0 --map D:/Game_q_storege/review-L0-reading.txt.map.json --result 結果.json
//   npx tsx scripts/review-batch.ts status
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { LEVELS } from '../src/game/QuestionData';
import { bankFile } from '../src/game/questions/bank';
import type { BankFile } from '../src/game/questions/bank';
import type { Question, QuestionSkill } from '../src/game/types';
import { escapeControlChars } from '../src/game/questionPipeline';
import { questionKey, validateQuestion } from '../src/game/validateQuestions';

const [mode, ...args] = process.argv.slice(2);
const arg = (name: string, fallback: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const readJson = <T>(file: string, fallback?: T): T => (existsSync(file) || fallback === undefined ? JSON.parse(readFileSync(file, 'utf-8')) as T : fallback);
const writeJson = (file: string, data: unknown) => writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
const reviewedFile = (level: number) => `src/game/questions/bank/reviewed-r${level}.json`;

const level = Number(arg('level', '0'));
const all = (f: BankFile) => [...f.normal, ...f.boss];

// 給 Gemini 的審題說明（和題目檔一起上傳）
export const REVIEW_PROMPT = (levelName: string) => `你是嚴格的 CEFR 英語考題審查老師。附檔是「${levelName}」程度的選擇題，每行一題：編號｜播放的英文（聽力題才有）｜題目｜選項｜標準答案｜解說。
請逐題檢查，找出有問題的題目：
1. 標準答案錯誤；2. 有兩個以上選項都說得通（模稜兩可）；3. 英文文法或用字錯誤；4. 中文翻譯或解說錯誤；5. 明顯超出或低於這個 CEFR 等級。
只回傳一個 JSON 程式碼區塊（字串裡不要直接換行）：
{ "bad": [ { "id": "q3", "reason": "簡短說明", "fix": { "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "ans": "B", "explain": "修正後的解說" } } ] }
- 能修好就給 fix（只填需要改的欄位）；修不好或不適合就省略 fix，代表刪掉。
- 沒問題的題目不要列出。全部沒問題就回傳 { "bad": [] }。`;

if (mode === 'status') {
  LEVELS.forEach((name, i) => {
    const file = readJson<BankFile>(bankFile(i));
    const done = new Set(readJson<string[]>(reviewedFile(i), []));
    const choices = all(file).filter(q => q.type === 'choice');
    if (choices.length) console.log(`${name}：選擇題 ${choices.length} 題，已審 ${choices.filter(q => done.has(questionKey(q))).length} 題`);
  });
} else if (mode === 'export') {
  const skill = arg('skill', 'reading') as QuestionSkill;
  const file = readJson<BankFile>(bankFile(level));
  const done = new Set(readJson<string[]>(reviewedFile(level), []));
  const todo = all(file).filter(q => q.type === 'choice' && q.skill === skill && !done.has(questionKey(q))).slice(0, Number(arg('count', '80')));
  const out = arg('out', `review-L${level}-${skill}.txt`);
  const map: Record<string, string> = {};
  const lines = todo.map((q, i) => {
    const id = `q${i + 1}`;
    map[id] = questionKey(q);
    return [id, q.speak ?? '', q.desc, (q.options ?? []).join(' / '), q.ans, q.explain ?? ''].join('｜');
  });
  writeFileSync(out, `${lines.join('\n')}\n`);
  writeJson(`${out}.map.json`, map);
  writeFileSync(`${out}.prompt.txt`, REVIEW_PROMPT(LEVELS[level]));
  console.log(`匯出 ${todo.length} 題到 ${out}`);
} else if (mode === 'apply') {
  const map = readJson<Record<string, string>>(arg('map', ''));
  const raw = readFileSync(arg('result', ''), 'utf-8').trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  const result = JSON.parse(escapeControlChars(raw)) as { bad?: { id: string; reason?: string; fix?: Partial<Question> }[] };
  const file = readJson<BankFile>(bankFile(level));
  const bad = new Map((result.bad ?? []).map(b => [map[b.id], b]));
  let fixed = 0;
  let removed = 0;
  for (const deck of ['normal', 'boss'] as const) {
    file[deck] = file[deck].flatMap(q => {
      const verdict = bad.get(questionKey(q));
      if (!verdict) return [q];
      if (verdict.fix) {
        const next = { ...q, ...verdict.fix } as Question;
        if (!validateQuestion(next, 'review').some(x => x.level === 'error')) {
          fixed++;
          console.log(`  ✎ ${q.desc}：${verdict.reason ?? ''}`);
          return [next];
        }
      }
      removed++;
      console.log(`  ✖ ${q.desc}：${verdict.reason ?? ''}`);
      return [];
    });
  }
  writeJson(bankFile(level), file);
  // 審過的題目記下來，下次不再匯出（修正只改選項、答案、解說，不影響題目的 key）
  const reviewed = new Set(readJson<string[]>(reviewedFile(level), []));
  for (const key of Object.values(map)) reviewed.add(key);
  writeJson(reviewedFile(level), [...reviewed]);
  console.log(`審題結果：${Object.keys(map).length} 題中修正 ${fixed} 題、刪除 ${removed} 題`);
} else {
  console.log('用法：review-batch.ts export|apply|status（說明見檔案開頭）');
}
