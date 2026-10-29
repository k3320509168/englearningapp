import type { Question, QuestionSkill, VocabEntry, VocabSense } from './types';
import type { QuestionPool } from './QuestionData';
import { questionKey, validateQuestion } from './validateQuestions';
import type { ValidationIssue } from './validateQuestions';

// 題庫自動擴充流程（純函式部分）：產生給 Gemini 的提示詞 → 解析回傳的 JSON → 逐題驗證與去重。
// 實際呼叫 API、寫檔、開 PR 在 scripts/generate-questions.ts 與 GitHub Actions。

export interface GeneratedBatch {
  normal: Question[];
  boss: Question[];
  vocab: Record<string, VocabEntry>;
}

export interface Reviewed {
  accepted: { deck: 'normal' | 'boss'; question: Question; warnings: string[] }[];
  rejected: { question: unknown; reasons: string[] }[];
}

export function buildPrompt(levelKey: string, count: number, existingDescs: string[]): string {
  return `你是多益（TOEIC）與 CEFR 英語教材的出題老師。請為程度「${levelKey}」出 ${count} 題新的英文練習題，對象是排斥英文的台灣成年人，主題以職場、生活為主。

請只回傳 JSON（不要任何說明文字），格式：
{
  "normal": [ ...題目 ],
  "boss": [ ...較難的題目，約佔 1/4 ],
  "vocab": { "大寫單字": { "pos": "詞性", "meaning": "繁體中文意思", "example": "英文例句", "exampleZh": "例句中文翻譯" } }
}

題目格式（四種題型都要有）：
- 拼寫：{ "type": "spell", "desc": "請拼出：中文意思", "ans": "全大寫單字（只能有 A-Z）", "speak": "小寫單字" }
- 填空：{ "type": "fill", "desc": "填空題：W O R _ (中文)", "ans": "空格中的大寫字母", "speak": "完整小寫單字" }（字母之間用空格隔開，空格用 _ 表示）
- 選擇：{ "type": "choice", "desc": "【主題】含有 ___ 的英文句子", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "ans": "A~D", "explain": "繁體中文解說" }
- 口說：{ "type": "voice", "desc": "請唸出單字：中文意思", "ans": "全大寫單字", "speak": "小寫單字" }

規則：
- 選擇題只能有一個正確答案，錯誤選項要明確錯誤，不可以有模稜兩可。
- 拼寫、填空、口說題的單字都要附上 vocab。
- 不要和以下已有的題目重複：
${existingDescs.slice(0, 200).map(d => `  - ${d}`).join('\n')}`;
}

// ---------- CEFR 題庫 ----------
// 各區題庫目標（和 Gemini 討論後定案）：初級少、高級多，越高級需要越多語境練習。
// 比例：聽 30%、讀 30%、說 20%、寫 20%（文法與字彙併在閱讀、寫作裡）。
export const SKILL_TARGET = 250; // 舊的「每項 250 題」，只給沒指定區域時用
export const BANK_TARGETS = [1000, 1000, 1000, 1300, 1300, 1500, 1800, 2000, 2000];
export const BANK_SKILLS: QuestionSkill[] = ['listening', 'speaking', 'reading', 'writing'];
const SKILL_SHARE: Record<QuestionSkill, number> = { listening: 0.3, reading: 0.3, speaking: 0.2, writing: 0.2 };
export const skillTarget = (levelIdx: number, skill: QuestionSkill) =>
  Math.round((BANK_TARGETS[levelIdx] ?? SKILL_TARGET * 4) * SKILL_SHARE[skill]);

const SKILL_RULES: Record<QuestionSkill, string> = {
  listening: `聽力題（全部用選擇題，玩家只聽得到聲音、看不到英文）：
  { "type": "choice", "skill": "listening", "difficulty": 1, "desc": "🎧 聽一聽，選出正確的意思", "speak": "要播放的英文（單字、片語或一句話）", "options": ["A. 中文意思", "B. ...", "C. ...", "D. ..."], "ans": "A~D", "explain": "繁體中文解說（寫出英文原句與意思）" }
  - desc 一定要以 🎧 開頭，例如「🎧 聽一聽，選出正確的意思」「🎧 聽到這句話，最適合的回應是？」（回應題的選項用英文）。
  - 難度 1 用單字、難度 2 用片語或短句、難度 3 用完整句子或對話回應。`,
  speaking: `口說題（全部用口說題型，玩家要對著麥克風唸）：
  { "type": "voice", "skill": "speaking", "difficulty": 1, "desc": "請唸出單字：中文意思", "ans": "全大寫英文（單字或短句，只能有 A-Z、空白、撇號）", "speak": "小寫示範發音" }
  - 難度 1 是單字，難度 2 是常用片語（desc 寫「請唸出：中文意思」），難度 3 是短句（不超過 8 個字）。
  - 單字題的單字要附 vocab。`,
  reading: `閱讀題（全部用選擇題，考句子理解、文法與字彙用法）：
  { "type": "choice", "skill": "reading", "difficulty": 1, "desc": "【主題】含有 ___ 的英文句子（難度 3 可以是 2～3 句的短文再問問題）", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "ans": "A~D", "explain": "繁體中文解說" }`,
  writing: `寫作題（拼寫題與填空題各一半）：
  - 拼寫：{ "type": "spell", "skill": "writing", "difficulty": 1, "desc": "請拼出：中文意思", "ans": "全大寫單字（只能有 A-Z）", "speak": "小寫單字" }
  - 填空：{ "type": "fill", "skill": "writing", "difficulty": 1, "desc": "填空題：W O R _ (中文)", "ans": "空格中的大寫字母", "speak": "完整小寫單字" }（字母之間用空格隔開，空格用 _ 表示）
  - 難度越高單字越長、越不常見，填空的空格越多：難度 1 挖 1 個字母、難度 2 挖 2 個、難度 3 挖 3 個以上（ans 依空格順序連在一起）。
  - 難度依「單字在這個等級裡有多常見、多好拼」判斷，不是依主題；同一個字的拼寫題與填空題可以都出。`,
};

export function buildSkillPrompt(levelKey: string, skill: QuestionSkill, count: number, existingDescs: string[], existingWords: string[]): string {
  return `你是 CEFR 與多益（TOEIC）英語教材的出題老師。請為程度「${levelKey}」出 ${count} 題新的「${skill}」練習題，對象是台灣成年人，主題以職場、生活、旅遊為主。
單字與句型必須符合這個 CEFR 等級（參考 CEFR 與 English Vocabulary Profile 的等級）。

請只回傳 JSON（不要任何說明文字），格式：
{
  "normal": [ ...題目 ],
  "boss": [ ...較難的題目，約佔 1/4 ],
  "vocab": { "大寫單字": { "pos": "主要詞性", "meaning": "主要的繁體中文意思", "example": "英文例句", "exampleZh": "例句中文翻譯",
    "senses": [ { "pos": "詞性", "meaning": "繁體中文意思", "examples": [ { "en": "英文例句", "zh": "中文翻譯" } ] } ] } }
}

${SKILL_RULES[skill]}

規則：
- 每一題都要有 "skill": "${skill}" 與 "difficulty"（這個等級內的難易：1 簡單、2 中等、3 較難，比例約 4:3:3）。
- 選擇題只能有一個正確答案，錯誤選項要明確錯誤，不可以有模稜兩可。
- 有單字的題目（拼寫、填空、口說單字、聽力單字）都要附上 vocab；vocab 的 senses 列出這個字常用的每一個詞性（最多 3 個），每個詞性 2～3 個例句，例句的難度符合這個等級。
- 不要和以下已有的題目重複：
${existingDescs.slice(-150).map(d => `  - ${d}`).join('\n')}
- 盡量不要再用這些已經出過的單字：${existingWords.slice(-300).join(', ')}`;
}

// 模型回傳的 senses 格式不對就丟掉，避免單字學習視窗壞掉
export function cleanVocab(vocab: Record<string, VocabEntry>): Record<string, VocabEntry> {
  const out: Record<string, VocabEntry> = {};
  for (const [rawKey, v] of Object.entries(vocab)) {
    const key = rawKey.toUpperCase().replace(/[^A-Z]/g, '');
    if (!key || !v || typeof v.meaning !== 'string' || typeof v.example !== 'string') continue;
    const senses: VocabSense[] = Array.isArray(v.senses)
      ? v.senses
        .filter(s => s && typeof s.pos === 'string' && typeof s.meaning === 'string' && Array.isArray(s.examples))
        .map(s => ({ pos: s.pos, meaning: s.meaning, examples: s.examples.filter(e => e && typeof e.en === 'string' && typeof e.zh === 'string').slice(0, 3) }))
        .filter(s => s.examples.length > 0)
        .slice(0, 3)
      : [];
    out[key] = { pos: String(v.pos ?? ''), meaning: v.meaning, example: v.example, exampleZh: String(v.exampleZh ?? ''), ...(senses.length ? { senses } : {}) };
  }
  return out;
}

// 補上（或改正）題目的分類與難度：skill 一律以這一批要求的為準，難度缺少或不合法時用 2
export function tagBatch(batch: GeneratedBatch, skill: QuestionSkill): GeneratedBatch {
  const tag = (q: Question): Question => (q && typeof q === 'object'
    ? { ...q, skill, difficulty: ([1, 2, 3] as const).includes(q.difficulty as 1) ? q.difficulty : 2 }
    : q);
  return { normal: batch.normal.map(tag), boss: batch.boss.map(tag), vocab: cleanVocab(batch.vocab) };
}

export const countSkill = (file: { normal: Question[]; boss: Question[] }, skill: QuestionSkill) =>
  [...file.normal, ...file.boss].filter(q => q.skill === skill).length;

// 解析模型回傳：容許包在 ```json 區塊裡
export function parseBatch(text: string): GeneratedBatch {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  const data = JSON.parse(cleaned) as Partial<GeneratedBatch>;
  return {
    normal: Array.isArray(data.normal) ? data.normal : [],
    boss: Array.isArray(data.boss) ? data.boss : [],
    vocab: data.vocab && typeof data.vocab === 'object' ? data.vocab : {},
  };
}

// 逐題驗證：有 error 的題目或與現有題目重複的題目會被丟掉；warning 保留下來讓人工抽查
export function reviewBatch(batch: GeneratedBatch, existing: Question[]): Reviewed {
  const seen = new Set(existing.map(questionKey));
  const result: Reviewed = { accepted: [], rejected: [] };
  for (const deck of ['normal', 'boss'] as const) {
    batch[deck].forEach((q, i) => {
      const issues: ValidationIssue[] = q && typeof q === 'object' ? validateQuestion(q, `${deck}[${i}]`) : [{ level: 'error', where: deck, message: '不是物件' }];
      const errors = issues.filter(x => x.level === 'error').map(x => x.message);
      const key = questionKey(q ?? {});
      if (seen.has(key)) errors.push('與現有題目重複');
      if (errors.length) {
        result.rejected.push({ question: q, reasons: errors });
        return;
      }
      seen.add(key);
      // 拼寫／填空／口說題缺少 vocab 的警告：如果這批有附上單字資料就不算
      const warnings = issues.filter(x => x.level === 'warning').map(x => x.message)
        .filter(w => !(w.includes('缺少中文與例句') && Object.keys(batch.vocab).some(k => w.includes(k))));
      result.accepted.push({ deck, question: q, warnings });
    });
  }
  return result;
}

export function addToPool(pool: Partial<QuestionPool>, levelKey: string, accepted: Reviewed['accepted']): Partial<QuestionPool> {
  const level = pool[levelKey] ?? { normal: [], boss: [] };
  return {
    ...pool,
    [levelKey]: {
      normal: [...level.normal, ...accepted.filter(a => a.deck === 'normal').map(a => a.question)],
      boss: [...level.boss, ...accepted.filter(a => a.deck === 'boss').map(a => a.question)],
    },
  };
}

// PR 說明：列出新題目與需要人工抽查的警告
export function reviewReport(levelKey: string, reviewed: Reviewed): string {
  const lines = [`## 題庫自動擴充：${levelKey}`, '', `新增 ${reviewed.accepted.length} 題，丟棄 ${reviewed.rejected.length} 題。`, '', '### 新題目（請抽查）'];
  for (const a of reviewed.accepted) {
    lines.push(`- [${a.deck}] ${a.question.type}｜${a.question.desc}｜答案：${a.question.ans}${a.warnings.length ? ` ⚠ ${a.warnings.join('；')}` : ''}`);
  }
  if (reviewed.rejected.length) {
    lines.push('', '### 已丟棄');
    for (const r of reviewed.rejected) lines.push(`- ${JSON.stringify(r.question).slice(0, 120)} ✖ ${r.reasons.join('；')}`);
  }
  return lines.join('\n');
}
