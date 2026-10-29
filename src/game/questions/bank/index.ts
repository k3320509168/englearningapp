import type { Question } from '../../types';

// CEFR 題庫（Gemini 出題 → 驗證 → 抽查）：每個區域一個檔案，各區目標題數見 questionPipeline 的 BANK_TARGETS。
// 依區域分檔，索引 = 區域順序（0 = A1、1 = A2、2 = A2+、3 = B1、4 = B1+、5 = B2、6 = B2+、7 = C1、8 = C2）。
// 注意：r2～r5 在第四輪前是 B1～C2 的位置，當時都還是空的，所以直接沿用檔名。
//
// 題庫很大（全部到位約 6～10MB），不打包進主程式：
//   - 遊戲裡用 bank/loader.ts 分區域在背景載入（開始關卡前確保那一區已載入）
//   - 腳本（Node）用 scripts/loadBanks.ts 直接讀檔
export interface BankFile { normal: Question[]; boss: Question[] }

export const BANK_COUNT = 9;
export const bankFile = (regionIdx: number) => `src/game/questions/bank/r${regionIdx}.json`;
export const bankVocabFile = (regionIdx: number) => `src/game/questions/bank/vocab-r${regionIdx}.json`;
