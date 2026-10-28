import type { Question, VocabEntry } from '../../types';
import r0 from './r0.json';
import r1 from './r1.json';
import r2 from './r2.json';
import r3 from './r3.json';
import r4 from './r4.json';
import r5 from './r5.json';
import v0 from './vocab-r0.json';
import v1 from './vocab-r1.json';
import v2 from './vocab-r2.json';
import v3 from './vocab-r3.json';
import v4 from './vocab-r4.json';
import v5 from './vocab-r5.json';

// CEFR 題庫（Gemini 自動出題 → 驗證 → 人工抽查）：每個區域一個檔案，目標每區聽說讀寫各 250 題。
// 依區域分檔，不同區域的出題 PR 不會互相衝突。索引 = 區域順序（0 = A1 … 5 = C2）
export interface BankFile { normal: Question[]; boss: Question[] }

export const BANK: BankFile[] = [r0, r1, r2, r3, r4, r5] as BankFile[];
export const BANK_VOCAB: Record<string, VocabEntry>[] = [v0, v1, v2, v3, v4, v5] as Record<string, VocabEntry>[];
export const bankFile = (regionIdx: number) => `src/game/questions/bank/r${regionIdx}.json`;
export const bankVocabFile = (regionIdx: number) => `src/game/questions/bank/vocab-r${regionIdx}.json`;
