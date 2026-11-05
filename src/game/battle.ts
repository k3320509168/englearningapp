import type { Question } from './types';

// 戰鬥規則的純函式：不依賴 React / Phaser，方便單元測試。

export const CHOICE_LETTERS = ['A', 'B', 'C', 'D'];
export const BASE_DAMAGE = 50;
export const PLAYER_MAX_HP = 100;
export const WRONG_ANSWER_DAMAGE = 10;
// 句子題：唸對的單字比例達到此門檻即判定通過
export const SENTENCE_PASS_RATIO = 0.8;

// ---------- 計時 ----------
// 每題 20 秒的「combo 計時」：20 秒內答對 combo +1，越快答對傷害越高。
// 前 25 關超時只會讓 combo 歸零（不扣血、不算錯題），可以繼續慢慢想；
// 第 26 關之後超時就算答錯。
export const QUESTION_LIMIT = 20_000;
export const LENIENT_STAGE_COUNT = 25;
export const FAST_TIME = 5_000;   // 5 秒內答對：傷害 ×1.5
export const QUICK_TIME = 10_000; // 10 秒內答對：傷害 ×1.2

export const isLenientStage = (stageIdx: number) => stageIdx < LENIENT_STAGE_COUNT;

export function speedMultiplier(elapsedMs: number): number {
  if (elapsedMs <= FAST_TIME) return 1.5;
  if (elapsedMs <= QUICK_TIME) return 1.2;
  return 1;
}

export function shuffleArray<T>(array: T[], random: () => number = Math.random): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

// 打亂選擇題選項並重新標上 A-D，避免玩家背答案位置
export function shuffleChoice(q: Question, random: () => number = Math.random): Question {
  if (q.type !== 'choice' || !q.options) return q;
  const correctIdx = CHOICE_LETTERS.indexOf(q.ans);
  const items = q.options.map((opt, i) => ({ text: opt.replace(/^[A-D]\.\s*/, ''), correct: i === correctIdx }));
  const shuffled = shuffleArray(items, random);
  return {
    ...q,
    options: shuffled.map((it, i) => `${CHOICE_LETTERS[i]}. ${it.text}`),
    ans: CHOICE_LETTERS[shuffled.findIndex(it => it.correct)],
  };
}

// 拼寫／填空：自由輸入（最多到答案的長度），按 Enter 或「送出」才判定對錯，
// 打錯可以用 Backspace 改，讓玩家有思考的空間
// 可以接受的拼法（答案＋同義的寫法，例如 THANK／THANKS）
// 只接受「同義寫法」；口說題的 accept 是辨識容錯（例如 STAR），拼寫時接受會教錯
const typedCandidates = (q: Question) => [q.ans, ...(q.type === 'spell' ? q.spellAccept ?? [] : [])];
const maxTypedLength = (q: Question) => Math.max(...typedCandidates(q).map(a => a.length));

export function applyLetter(q: Question, typed: string, letter: string): string {
  return typed.length >= maxTypedLength(q) ? typed : typed + letter.toUpperCase();
}

export const checkTypedAnswer = (q: Question, typed: string) => typedCandidates(q).includes(typed.toUpperCase());

export function checkChoice(q: Question, letter: string): boolean {
  return letter.toUpperCase() === q.ans;
}

// 語音辨識常把 I am、do not 寫成縮寫（I'm、don't），題目答案多半是完整寫法：比對前兩邊都展開
const CONTRACTIONS: Record<string, string> = {
  "I'M": 'I AM', "YOU'RE": 'YOU ARE', "WE'RE": 'WE ARE', "THEY'RE": 'THEY ARE',
  "IT'S": 'IT IS', "HE'S": 'HE IS', "SHE'S": 'SHE IS', "THAT'S": 'THAT IS', "WHAT'S": 'WHAT IS', "WHERE'S": 'WHERE IS', "THERE'S": 'THERE IS',
  "LET'S": 'LET US', "DON'T": 'DO NOT', "DOESN'T": 'DOES NOT', "DIDN'T": 'DID NOT', "ISN'T": 'IS NOT', "AREN'T": 'ARE NOT',
  "CAN'T": 'CANNOT', "WON'T": 'WILL NOT', "I'LL": 'I WILL', "YOU'LL": 'YOU WILL', "WE'LL": 'WE WILL',
  "I'D": 'I WOULD', "I'VE": 'I HAVE', "WE'VE": 'WE HAVE', "COULDN'T": 'COULD NOT', "SHOULDN'T": 'SHOULD NOT',
};

function normalizeWords(text: string): string[] {
  return text.toUpperCase().replace(/[’]/g, "'").replace(/[^A-Z' ]/g, ' ').split(/\s+/).filter(Boolean)
    .flatMap(w => (CONTRACTIONS[w] ?? w).split(' '));
}

// 依序比對（最長共同子序列），計算玩家唸對的單字比例
export function sentenceMatchRatio(expected: string, transcript: string): number {
  const a = normalizeWords(expected);
  const b = normalizeWords(transcript);
  if (a.length === 0) return 0;
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[a.length][b.length] / a.length;
}

// 關鍵否定詞清單：句中否定詞必須嚴格一致，避免漏唸 NOT/NEVER 導致意思相反卻被誤判過關
const NEGATION_WORDS = new Set(['NOT', 'NO', 'NEVER', 'NEITHER', 'NOR', 'NONE', 'CANNOT']);

function negationMismatch(expectedWords: string[], heardWords: string[]): boolean {
  const countExp = expectedWords.filter(w => NEGATION_WORDS.has(w)).length;
  const countHeard = heardWords.filter(w => NEGATION_WORDS.has(w)).length;
  return countExp !== countHeard;
}

// 常見反義前綴清單：相差此類前綴代表詞義完全相反，絕對不能納入發音容錯
const OPPOSING_PREFIXES = ['UN', 'IN', 'IM', 'DIS', 'NON', 'IR', 'IL', 'MIS', 'MAL', 'ANTI'];

function hasOpposingPrefixMismatch(a: string, b: string): boolean {
  const [longer, shorter] = a.length >= b.length ? [a, b] : [b, a];
  for (const p of OPPOSING_PREFIXES) {
    if (longer.startsWith(p) && longer.slice(p.length) === shorter) {
      return true;
    }
  }
  return false;
}

// 兩個字差幾個字母（編輯距離）
function editDistance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...new Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return dp[a.length][b.length];
}

// 辨識出來的字算不算唸對：完全一樣、單複數（reservation / reservations），
// 或長字只差一個字母（辨識引擎常見的小誤差，例如 luggage → luggages）
// 長單字容許的誤差：電腦/手機麥克風收音常見一兩個音素微差（例如 helicopter 聽成 hellicopter，accommodation 聽成 accomadation）。
// 短字維持嚴格避免誤判（例如 apple 不能算 apply、start 不能算 restart）
const CONFUSABLE_PAIRS = [
  ['INCREASE', 'DECREASE'], ['ALTITUDE', 'ATTITUDE'], ['ECONOMIC', 'ECONOMICAL'],
] as const;
const wordTolerance = (len: number) => (len >= 12 ? 3 : len >= 8 ? 2 : len >= 6 ? 1 : 0);
function wordMatches(heard: string, target: string): boolean {
  if (heard === target) return true;
  if (CONFUSABLE_PAIRS.some(([a, b]) => (heard === a && target === b) || (heard === b && target === a))) return false;
  if (heard === `${target}S` || heard === `${target}ES` || `${heard}S` === target) return true;
  // 反義前綴保護（R2）：若相差否定/反義前綴（如 conspicuous vs inconspicuous），絕不容錯
  if (hasOpposingPrefixMismatch(heard, target)) return false;
  const tol = wordTolerance(target.length);
  return tol > 0 && Math.abs(heard.length - target.length) <= tol && editDistance(heard, target) <= tol;
}
// 辨識結果把一個字拆成幾個詞（例如 heli copter）：相鄰 1～3 個詞合起來比對
function anySpanMatches(words: string[], target: string): boolean {
  for (let i = 0; i < words.length; i++) {
    let joined = '';
    for (let j = i; j < Math.min(words.length, i + 3); j++) {
      joined += words[j];
      if (wordMatches(joined, target)) return true;
    }
  }
  return false;
}

// transcripts：辨識引擎給的所有候選，任何一個唸對就算對
export function checkVoice(q: Question, transcripts: string | string[]): boolean {
  const heardList = Array.isArray(transcripts) ? transcripts : [transcripts];
  const candidates = [q.ans, ...(q.accept ?? []), ...(q.spellAccept ?? [])];
  const isSentence = q.ans.trim().includes(' ');
  return heardList.some(transcript => {
    if (isSentence) {
      const heardWords = normalizeWords(transcript);
      return candidates.some(c => {
        const expWords = normalizeWords(c);
        // 關鍵否定詞一致性保護（R2）：嚴防漏唸 NOT 或多唸 NOT 顛倒句義
        if (negationMismatch(expWords, heardWords)) return false;
        return sentenceMatchRatio(c, transcript) >= SENTENCE_PASS_RATIO;
      });
    }
    const words = normalizeWords(transcript);
    // 片語（例如 thank you）也可能被辨識成連在一起的一個字；一個長字也可能被拆成幾個詞
    const joined = words.join('');
    return candidates.some(c => anySpanMatches(words, c.toUpperCase()) || joined === c.toUpperCase().replace(/[^A-Z]/g, ''));
  });
}

// 只聽到開頭一小段（例如 helicopter 只聽到 "Hel"）：收音被提早切斷，不是唸錯，讓玩家免費再唸一次
export function isVoiceFragment(q: Question, transcripts: string[]): boolean {
  const target = (q.speak ?? q.ans).toUpperCase().replace(/[^A-Z]/g, '');
  const raw = (transcripts[0] ?? '').toUpperCase();
  const words = raw.replace(/[^A-Z]/g, ' ').split(/\s+/).filter(Boolean).filter(w => !['UH', 'UM', 'AH', 'OH', 'A', 'THE'].includes(w));
  const heard = words.join('');
  if (!heard) return true;
  if (heard.length <= target.length * 0.65) {
    if (target.startsWith(heard.slice(0, 2))) return true;
    if (words.some(w => target.startsWith(w.slice(0, 2)))) return true;
  }
  return false;
}

// 從題目描述取出中文提示，例如「請拼出：書本」→「書本」、「填空題：B U D G _ T (預算)」→「預算」
export function questionHint(q: Question): string {
  // 只有填空題的中文放在最後的括號裡；其他題目的中文本身可能就有括號（例如「附加（檔案）」），整段都要
  if (q.desc.startsWith('填空題')) {
    const paren = q.desc.match(/[(（]([^)）]+)[)）]\s*$/);
    if (paren) return paren[1];
  }
  if (q.type === 'choice') return '';
  return (q.desc.split('：').pop() ?? '').trim();
}

// 瀏覽器不支援語音辨識時，把單字語音題改為拼寫題，讓玩家仍能練到這個字
export function voiceFallback(q: Question): Question {
  if (q.type !== 'voice') return q;
  // 只帶「同義寫法」；辨識容錯（accept）是給語音用的，拼寫時不能算對
  if (/^[A-Z]+$/.test(q.ans)) return { ...q, type: 'spell', desc: `請拼出：${questionHint(q)}`, accept: undefined };
  // 片語、短句（例如 GOOD MORNING）：鍵盤只能打字母，所以去掉空格與撇號連在一起拼
  const letters = q.ans.replace(/[^A-Z]/g, '');
  return { ...q, type: 'spell', ans: letters, desc: `請先聽發音，再拼出英文（不用打空格）：${questionHint(q)}`, accept: undefined, spellAccept: undefined };
}

// 拼寫／填空的進度顯示：拼寫顯示字母格，填空把已輸入的字母填進題目的空格
export interface AnswerSlot {
  char: string;
  blank: boolean;
}

export function answerSlots(q: Question, typed: string): AnswerSlot[] {
  if (q.type === 'spell') {
    // 格子數是答案的長度；打的是較長的可接受拼法（例如 THANKYOU）時跟著延長
    const n = Math.max(q.ans.length, typed.length);
    return Array.from({ length: n }, (_, i) => ({ char: typed[i] ?? '', blank: true }));
  }
  if (q.type === 'fill') {
    const pattern = (q.desc.split('：').pop() ?? '').split(/[(（]/)[0].trim().split(/\s+/);
    let i = 0;
    return pattern.map(ch => (ch === '_' ? { char: typed[i++] ?? '', blank: true } : { char: ch, blank: false }));
  }
  return [];
}

// 選擇題：把正確選項填回題目，得到完整句子供學習回饋使用
export function completedSentence(q: Question): string {
  if (q.type !== 'choice' || !q.options) return '';
  const answer = q.options.find(o => o.startsWith(`${q.ans}.`))?.replace(/^[A-D]\.\s*/, '') ?? '';
  const sentence = q.desc.replace(/^【[^】]*】/, '').trim();
  return sentence.includes('___') ? sentence.replace('___', answer) : '';
}

// 這一題「答案」要唸的英文（答錯回饋、錯題本、圖鑑共用）：
// 聽力題唸題目播放的英文；有空格的句子唸填好答案的完整句子；正確選項是英文就唸選項；
// 都沒有就是空字串（不要把中文選項或空白交給英文語音去唸——會沒有聲音）
export function questionAudio(q: Question): string {
  const sentence = completedSentence(q);
  if (sentence) return sentence;
  if (q.speak?.trim()) return q.speak;
  if (q.type !== 'choice') return q.ans;
  const option = q.options?.find(o => o.startsWith(`${q.ans}.`))?.replace(/^[A-D]\.\s*/, '') ?? '';
  return /[A-Za-z]/.test(option) ? option : '';
}

// 援軍：連續答錯幾次後出現
export const ASSIST_STREAK = 3;

export interface Assist {
  hiddenOptions: string[]; // 選擇題：被刪掉的兩個錯誤選項
  revealed: string;        // 拼寫／填空：預先填好的字母
  showWord: boolean;       // 語音題：直接顯示要唸的單字
}

export function buildAssist(q: Question, random: () => number = Math.random): Assist {
  const assist: Assist = { hiddenOptions: [], revealed: '', showWord: false };
  if (q.type === 'choice') {
    const wrong = CHOICE_LETTERS.filter(l => l !== q.ans);
    assist.hiddenOptions = shuffleArray(wrong, random).slice(0, 2);
  } else if ((q.type === 'spell' || q.type === 'fill') && q.ans.length > 1) {
    // 只剩一個字母的填空題不提示，否則等於直接給答案
    assist.revealed = q.ans[0];
  } else if (q.type === 'voice') {
    assist.showWord = true;
  }
  return assist;
}

// 錯題紀錄的 key：同一題型同一答案視為同一題
export function questionKey(q: Question): string {
  return `${q.type}:${q.type === 'choice' ? `${q.desc}${q.speak ? `|${q.speak}` : ''}` : q.ans}`;
}

// 第一場戰鬥：把同一關的題目依難度排序（選擇題最簡單、再來是短的拼寫），
// 讓新玩家前幾題一定答得出來、先建立信心。題目本身不變，只換順序。
const TYPE_EASE: Record<string, number> = { choice: 0, spell: 1, fill: 2, voice: 3 };
export function easeOrder(questions: Question[]): Question[] {
  const score = (q: Question) => (TYPE_EASE[q.type] ?? 2) * 100 + q.ans.length;
  return [...questions].sort((a, b) => score(a) - score(b));
}
