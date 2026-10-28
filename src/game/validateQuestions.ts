import type { Question } from './types';
import type { QuestionPool } from './QuestionData';
import { VOCAB, vocabKey } from './vocab';

// 題庫驗證：檢查資料格式是否符合 MainScene 的判讀規則。
// error = 遊戲中會壞掉或無法作答；warning = 可以玩，但值得人工檢查。

export interface ValidationIssue {
  level: 'error' | 'warning';
  where: string;
  message: string;
}

const QUESTION_TYPES = ['spell', 'fill', 'choice', 'voice'];
const LETTERS_ONLY = /^[A-Z]+$/;
// 語音題允許單字或句子（大絕招句型），以空白分隔
const VOICE_ANSWER = /^[A-Z']+( [A-Z']+)*$/;
const CHOICE_LETTERS = ['A', 'B', 'C', 'D'];
const MIN_QUESTIONS_PER_LEVEL = 3;
const SKILLS = ['listening', 'speaking', 'reading', 'writing'];

export function validateQuestion(q: Question, where: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const error = (message: string) => issues.push({ level: 'error', where, message });
  const warn = (message: string) => issues.push({ level: 'warning', where, message });

  if (!QUESTION_TYPES.includes(q.type)) error(`未知題型 "${q.type}"`);
  if (!q.desc?.trim()) error('缺少 desc（題目描述）');
  if (!q.ans?.trim()) {
    error('缺少 ans（正確答案）');
    return issues;
  }

  // 學習資料：戰前預習與答錯回饋會用到
  const key = vocabKey(q);
  if (key && !VOCAB[key]) warn(`單字 ${key} 缺少中文與例句（請補到 vocab.ts）`);
  if (q.type === 'choice' && !q.explain?.trim()) warn('選擇題缺少 explain（文法解說）');
  if (q.skill !== undefined && !SKILLS.includes(q.skill)) error(`skill 只能是 ${SKILLS.join(' / ')}："${q.skill}"`);
  if (q.difficulty !== undefined && ![1, 2, 3].includes(q.difficulty)) error(`difficulty 只能是 1、2、3："${q.difficulty}"`);
  // 聽力題：題目只用聲音，一定要有 speak 才播得出來
  if ((q.skill === 'listening' || q.desc?.startsWith('🎧')) && !q.speak?.trim()) error('聽力題缺少 speak（要播放的英文）');
  if (q.skill === 'listening' && !q.desc.startsWith('🎧')) error('聽力題的 desc 要以 🎧 開頭（遊戲會自動播放聲音）');

  switch (q.type) {
    case 'spell': {
      // 只能用 A-Z 鍵輸入，答案若含空白或符號會永遠無法答對
      if (!LETTERS_ONLY.test(q.ans)) error(`spell 答案只能是大寫 A-Z："${q.ans}"`);
      q.spellAccept?.forEach(x => { if (!LETTERS_ONLY.test(x)) error(`spellAccept（同義寫法）只能是大寫 A-Z："${x}"`); });
      if (q.speak && q.speak.toUpperCase().replace(/[^A-Z]/g, '') !== q.ans) {
        warn(`speak "${q.speak}" 與答案 "${q.ans}" 不一致`);
      }
      break;
    }
    case 'fill': {
      if (!LETTERS_ONLY.test(q.ans)) error(`fill 答案只能是大寫 A-Z："${q.ans}"`);
      // desc 格式：「填空題：B U D G _ T (預算)」— 把底線依序換成答案，應拼回 speak 的單字
      const pattern = q.desc.split('：').pop()!.split('(')[0].replace(/\s/g, '');
      const blanks = (pattern.match(/_/g) || []).length;
      if (blanks !== q.ans.length) {
        error(`空格數 (${blanks}) 與答案長度 (${q.ans.length}) 不符`);
      } else if (q.speak) {
        let i = 0;
        const rebuilt = pattern.replace(/_/g, () => q.ans[i++]);
        const target = q.speak.toUpperCase().replace(/[^A-Z]/g, '');
        if (rebuilt !== target) error(`填入答案後為 "${rebuilt}"，與 speak "${q.speak}" 不符`);
      }
      break;
    }
    case 'choice': {
      if (!q.options || q.options.length !== 4) {
        error(`choice 必須剛好 4 個選項（目前 ${q.options?.length ?? 0} 個）`);
      } else {
        q.options.forEach((opt, i) => {
          if (!opt.startsWith(`${CHOICE_LETTERS[i]}. `)) error(`選項 ${i + 1} 應以 "${CHOICE_LETTERS[i]}. " 開頭："${opt}"`);
        });
        const texts = q.options.map(o => o.slice(3).trim().toLowerCase());
        if (new Set(texts).size !== texts.length) error('選項內容重複');
      }
      if (!CHOICE_LETTERS.includes(q.ans)) error(`choice 答案必須是 A-D："${q.ans}"`);
      break;
    }
    case 'voice': {
      if (!VOICE_ANSWER.test(q.ans)) error(`voice 答案需為大寫英文單字或句子："${q.ans}"`);
      q.spellAccept?.forEach(a => {
        if (!LETTERS_ONLY.test(a)) error(`spellAccept（同義寫法）只能是大寫 A-Z："${a}"`);
      });
      q.accept?.forEach(a => {
        if (!VOICE_ANSWER.test(a)) error(`accept 需為大寫英文："${a}"`);
      });
      if (q.speak && !q.speak.toUpperCase().includes(q.ans)) {
        warn(`speak "${q.speak}" 不包含答案 "${q.ans}"，示範發音可能與答案不同`);
      }
      break;
    }
  }
  return issues;
}

export function validateQuestionPool(pool: QuestionPool, levels: string[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const levelKey of levels) {
    if (!pool[levelKey]) {
      issues.push({ level: 'error', where: levelKey, message: '此等級沒有題庫，遊戲會改用 A1 題目' });
    }
  }
  for (const levelKey of Object.keys(pool)) {
    if (!levels.includes(levelKey)) {
      issues.push({ level: 'error', where: levelKey, message: '題庫的等級名稱不在 LEVELS 中，永遠不會被使用' });
    }
  }

  for (const [levelKey, { normal, boss }] of Object.entries(pool)) {
    for (const [deckName, deck] of [['normal', normal], ['boss', boss]] as const) {
      if (deck.length < MIN_QUESTIONS_PER_LEVEL) {
        issues.push({ level: 'warning', where: `${levelKey} / ${deckName}`, message: `只有 ${deck.length} 題，玩家很快會看到重複題目` });
      }
      deck.forEach((q, i) => issues.push(...validateQuestion(q, `${levelKey} / ${deckName}[${i}]`)));
    }

    const all = [...normal, ...boss];
    for (const type of QUESTION_TYPES) {
      if (!all.some(q => q.type === type)) {
        issues.push({ level: 'warning', where: levelKey, message: `缺少 ${type} 題型` });
      }
    }

    const seen = new Map<string, number>();
    all.forEach(q => {
      const key = `${q.type}|${q.desc}`;
      seen.set(key, (seen.get(key) ?? 0) + 1);
    });
    for (const [key, count] of seen) {
      if (count > 1) issues.push({ level: 'error', where: levelKey, message: `重複題目 ×${count}：${key.split('|')[1]}` });
    }
  }
  return issues;
}
