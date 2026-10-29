// Node 腳本用：把 CEFR 題庫直接讀進 QUESTION_POOL 與 VOCAB（遊戲裡是分區域在背景載入）
import { existsSync, readFileSync } from 'node:fs';
import { BANK_COUNT, bankFile, bankVocabFile } from '../src/game/questions/bank';
import { addBank } from '../src/game/QuestionData';
import { addBankVocab } from '../src/game/vocab';

for (let i = 0; i < BANK_COUNT; i++) {
  if (existsSync(bankFile(i))) addBank(i, JSON.parse(readFileSync(bankFile(i), 'utf-8')));
  if (existsSync(bankVocabFile(i))) addBankVocab(JSON.parse(readFileSync(bankVocabFile(i), 'utf-8')));
}
