export interface Question {
  type: string;
  desc: string;
  ans: string;
  speak?: string;
  options?: string[];
  accept?: string[];
  // 選擇題的文法／字彙解說，用於戰前預習與答錯回饋
  explain?: string;
}

export interface Stage {
  name: string;
  bossMode: boolean;
  questions: Question[];
  revenge?: boolean; // 復仇魔王：題目來自玩家到期的錯題
}

// 單字資料（中文、詞性、例句），以大寫單字為 key 存在 vocab.ts
export interface VocabEntry {
  word?: string; // 顯示用拼法，預設為 key 的小寫（例如 THANK → "thank you"）
  pos: string;
  meaning: string;
  example: string;
  exampleZh: string;
}
