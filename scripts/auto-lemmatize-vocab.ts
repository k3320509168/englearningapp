// 執行方式：npx tsx scripts/auto-lemmatize-vocab.ts
// 功能：從全部題庫中自動萃取未建檔單字、高頻生活片語與文法句型，
// 自動補充到 generated-vocab.json 與對應詞庫，消除 validate:questions 警告，
// 並讓冒險圖鑑與錯題本能完整查閱所有題目的單字/片語卡片！

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import './loadBanks';
import { QUESTION_POOL } from '../src/game/QuestionData';
import { VOCAB, vocabKey } from '../src/game/vocab';
import type { VocabEntry } from '../src/game/types';

const genVocabPath = resolve(process.cwd(), 'src/game/questions/generated-vocab.json');
const currentGenVocab: Record<string, VocabEntry> = JSON.parse(readFileSync(genVocabPath, 'utf-8'));

function extractMeaning(desc: string): string {
  let m = desc;
  m = m.replace(/^請唸出(?:單字|短句|數字|片語|句子|問句|日常對話)?：/, '');
  m = m.replace(/^請拼出(?:單字|數字|片語)?：/, '');
  const paren = m.match(/\((.+?)\)/);
  if (paren && paren[1]) return paren[1].trim();
  // 移除引號
  m = m.replace(/^[「『"']+|[」』"']+$/g, '');
  return m.trim();
}

function determinePos(text: string): string {
  const words = text.trim().split(/\s+/);
  if (words.length === 1) {
    return 'n.';
  }
  if (/^(I|YOU|HE|SHE|WE|THEY|IT|THERE|THIS|WHAT|WHERE|HOW|CAN|PLEASE|DO|DID|HAVE)\b/i.test(text) || text.endsWith('.')) {
    return 'sent.';
  }
  return 'phr.';
}

let addedCount = 0;
const newEntries: Record<string, VocabEntry> = { ...currentGenVocab };

for (const [, pool] of Object.entries(QUESTION_POOL)) {
  const allQ = [...pool.normal, ...pool.boss];
  for (const q of allQ) {
    const key = vocabKey(q);
    if (!key) continue;

    if (!VOCAB[key] && !newEntries[key]) {
      const meaning = extractMeaning(q.desc) || q.explain || key;
      const speak = q.speak || q.ans.toLowerCase();
      const pos = determinePos(speak);
      
      const example = q.speak ? (q.speak.endsWith('.') || q.speak.endsWith('?') ? q.speak : `${q.speak.charAt(0).toUpperCase() + q.speak.slice(1)}.`) : `${key.toLowerCase()}.`;
      const exampleZh = meaning.endsWith('。') || meaning.endsWith('？') ? meaning : `${meaning}。`;

      newEntries[key] = {
        word: speak,
        pos,
        meaning,
        example,
        exampleZh,
      };
      // 同步到 VOCAB 避免重複
      VOCAB[key] = newEntries[key];
      addedCount++;
    }
  }
}

writeFileSync(genVocabPath, JSON.stringify(newEntries, null, 1) + '\n', 'utf-8');
console.log(`成功萃取並補入 ${addedCount} 筆詞彙/片語/句型卡片至 generated-vocab.json！總詞庫量達 ${Object.keys(newEntries).length} 條。`);
