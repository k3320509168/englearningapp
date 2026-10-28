export interface Question {
  type: string;
  desc: string;
  ans: string;
  speak?: string;
  options?: string[];
  accept?: string[];      // 口說題專用：語音辨識常見的誤聽（例如 start 聽成 STAR），不代表拼法正確
  spellAccept?: string[]; // 同義寫法（例如 THANK／THANKS／THANKYOU）：拼寫與口說都接受
  // 選擇題的文法／字彙解說，用於戰前預習與答錯回饋
  explain?: string;
}

export interface Stage {
  name: string;
  bossMode: boolean;
  questions: Question[];
  revenge?: boolean; // 復仇魔王：題目來自玩家到期的錯題
  kind?: 'elite' | 'treasure' | 'final'; // 關卡變化：菁英怪、寶箱怪；final 是沉默魔王
}

// 單字資料（中文、詞性、例句），以大寫單字為 key 存在 vocab.ts
export interface VocabExample { en: string; zh: string }

// 一個詞性的意思與例句（同一個字可以有好幾個詞性，例如 run 的 v. 跑／n. 一段跑步）
export interface VocabSense {
  pos: string;
  meaning: string;
  examples: VocabExample[];
}

export interface VocabEntry {
  word?: string; // 顯示用拼法，預設為 key 的小寫（例如 THANK → "thank you"）
  pos: string;
  meaning: string;
  example: string;
  exampleZh: string;
  senses?: VocabSense[]; // 單字學習視窗用的完整詞性與例句（由出題流程補齊；沒有時用上面的主要意思）
}
