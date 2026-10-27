import type { Question, VocabEntry } from './types';
import type { QuestionPool } from './QuestionData';
import { validateQuestion } from './validateQuestions';
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
  const seen = new Set(existing.map(q => `${q.type}|${q.desc}`));
  const result: Reviewed = { accepted: [], rejected: [] };
  for (const deck of ['normal', 'boss'] as const) {
    batch[deck].forEach((q, i) => {
      const issues: ValidationIssue[] = q && typeof q === 'object' ? validateQuestion(q, `${deck}[${i}]`) : [{ level: 'error', where: deck, message: '不是物件' }];
      const errors = issues.filter(x => x.level === 'error').map(x => x.message);
      const key = `${q?.type}|${q?.desc}`;
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
