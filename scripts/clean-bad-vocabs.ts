import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { VocabEntry } from '../src/game/types';

// 常見已知單字的標準中文釋義與正確詞性補正字典
const DICTIONARY_FIXES: Record<string, { pos: string; meaning: string }> = {
  'ASSUME': { pos: 'v.', meaning: '假定、承擔' },
  'REFLECT': { pos: 'v.', meaning: '反映、沉思' },
  'REACH': { pos: 'v.', meaning: '觸及、達到' },
  'BEGAN': { pos: 'v.', meaning: '開始（begin過去式）' },
  'CONSUMED': { pos: 'v.', meaning: '消耗、消費' },
  'MOVING': { pos: 'adj.', meaning: '移動的、動人的' },
  'GOING': { pos: 'v.', meaning: '進行、前往' },
  'LIGHT': { pos: 'n.', meaning: '光線、燈光' },
  'BETTER': { pos: 'adj.', meaning: '更好的' },
  'CHANGED': { pos: 'v.', meaning: '改變、調整' },
  'REDUCED': { pos: 'v.', meaning: '減少、降低' },
  'EXTENDED': { pos: 'adj.', meaning: '延長的、擴展的' },
  'EXECUTED': { pos: 'v.', meaning: '執行、處決' },
};

function cleanVocabMap(data: Record<string, VocabEntry>, regionName: string): { cleaned: Record<string, VocabEntry>; removed: number; fixed: number } {
  const result: Record<string, VocabEntry> = {};
  let removed = 0;
  let fixed = 0;

  for (const [key, entry] of Object.entries(data)) {
    const rawWord = (entry.word || key).trim();
    const cleanWord = rawWord.replace(/^[\$#\d\.\s]+/, '').trim().toLowerCase();
    const meaning = (entry.meaning || '').trim();

    // 1. 垃圾資料過濾：純數字、金額 ($170.)、純符號、長整句作為單字
    if (/^\$?\d+(\.\d+)?\.?$/.test(rawWord) || /^\$?\d+/.test(meaning)) {
      removed++;
      continue;
    }
    // 過長整句被誤當成片語且未經翻譯者
    if (rawWord.length > 35 && rawWord.endsWith('.') && meaning.toLowerCase() === rawWord.toLowerCase()) {
      removed++;
      continue;
    }

    // 2. 檢查已知補正字典
    const upperKey = key.toUpperCase().trim();
    if (DICTIONARY_FIXES[upperKey]) {
      result[key] = {
        ...entry,
        pos: DICTIONARY_FIXES[upperKey].pos,
        meaning: DICTIONARY_FIXES[upperKey].meaning,
      };
      fixed++;
      continue;
    }

    // 3. 檢查 meaning 是否回填為英文單字本身（假釋義）
    if (meaning.toLowerCase() === rawWord.toLowerCase() || meaning.toLowerCase() === cleanWord) {
      // 嘗試從例句中文中抓取真正中文意思
      const exZh = entry.exampleZh || '';
      const match = exZh.match(/是([^\s，。；]+)/) || exZh.match(/[「『]([^\s」』]+)[」』]/);
      if (match && match[1] && match[1].length <= 15 && !/^[A-Za-z]+$/.test(match[1])) {
        result[key] = {
          ...entry,
          meaning: match[1].trim(),
        };
        fixed++;
        continue;
      }

      // 無法提取真實中文釋義，堅決剔除假條目
      removed++;
      continue;
    }

    // 4. 文法位置功能詞過濾：如 THAT 當名詞且無實質義項
    if (upperKey === 'THAT' && entry.pos === 'n.' && meaning === 'that') {
      removed++;
      continue;
    }

    result[key] = entry;
  }

  return { cleaned: result, removed, fixed };
}

// 清理 R0 ~ R8
for (let r = 0; r <= 8; r++) {
  const p = resolve(process.cwd(), `src/game/questions/bank/vocab-r${r}.json`);
  if (!existsSync(p)) continue;
  const original = JSON.parse(readFileSync(p, 'utf8'));
  const { cleaned, removed, fixed } = cleanVocabMap(original, `R${r}`);
  writeFileSync(p, JSON.stringify(cleaned, null, 2) + '\n', 'utf8');
  console.log(`R${r}: 移除垃圾條目 ${removed} 筆，修復中文釋義 ${fixed} 筆，保留純淨條目 ${Object.keys(cleaned).length} 筆`);
}

// 同步清理 generated-vocab.json
const gPath = resolve(process.cwd(), 'src/game/questions/generated-vocab.json');
if (existsSync(gPath)) {
  const genOriginal = JSON.parse(readFileSync(gPath, 'utf8'));
  const { cleaned, removed, fixed } = cleanVocabMap(genOriginal, 'generated-vocab');
  writeFileSync(gPath, JSON.stringify(cleaned, null, 2) + '\n', 'utf8');
  console.log(`generated-vocab: 移除垃圾條目 ${removed} 筆，修復中文釋義 ${fixed} 筆，保留純淨條目 ${Object.keys(cleaned).length} 筆`);
}

console.log('✅ 詞典清理完畢！');
