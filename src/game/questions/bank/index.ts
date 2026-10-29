import type { Question, VocabEntry } from '../../types';
import r0 from './r0.json';
import r1 from './r1.json';
import r2 from './r2.json';
import r3 from './r3.json';
import r4 from './r4.json';
import r5 from './r5.json';
import r6 from './r6.json';
import r7 from './r7.json';
import r8 from './r8.json';
import v0 from './vocab-r0.json';
import v1 from './vocab-r1.json';
import v2 from './vocab-r2.json';
import v3 from './vocab-r3.json';
import v4 from './vocab-r4.json';
import v5 from './vocab-r5.json';
import v6 from './vocab-r6.json';
import v7 from './vocab-r7.json';
import v8 from './vocab-r8.json';

// CEFR 題庫（Gemini 出題 → 驗證 → 抽查）：每個區域一個檔案，各區目標題數見 questionPipeline 的 BANK_TARGETS。
// 依區域分檔，索引 = 區域順序（0 = A1、1 = A2、2 = A2+、3 = B1、4 = B1+、5 = B2、6 = B2+、7 = C1、8 = C2）。
// 注意：r2～r5 在第四輪前是 B1～C2 的位置，當時都還是空的，所以直接沿用檔名
export interface BankFile { normal: Question[]; boss: Question[] }

export const BANK: BankFile[] = [r0, r1, r2, r3, r4, r5, r6, r7, r8] as BankFile[];
export const BANK_VOCAB: Record<string, VocabEntry>[] = [v0, v1, v2, v3, v4, v5, v6, v7, v8] as Record<string, VocabEntry>[];
export const bankFile = (regionIdx: number) => `src/game/questions/bank/r${regionIdx}.json`;
export const bankVocabFile = (regionIdx: number) => `src/game/questions/bank/vocab-r${regionIdx}.json`;
