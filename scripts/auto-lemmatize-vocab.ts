// 執行方式：npx tsx scripts/auto-lemmatize-vocab.ts
// 功能：從全部題庫與分區詞庫中自動萃取未建檔單字、高頻生活片語、文法句型與選擇題字彙，
// 全面補充至 generated-vocab.json，讓冒險圖鑑、錯題本與戰鬥結算能完整查閱所有單字/片語卡片！

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import './loadBanks';
import { QUESTION_POOL } from '../src/game/QuestionData';
import { VOCAB, vocabKey } from '../src/game/vocab';
import type { Question, VocabEntry } from '../src/game/types';

const genVocabPath = resolve(process.cwd(), 'src/game/questions/generated-vocab.json');
const currentGenVocab: Record<string, VocabEntry> = JSON.parse(readFileSync(genVocabPath, 'utf-8'));

function extractMeaning(desc: string): string {
  let m = desc;
  m = m.replace(/^請唸出(?:單字|短句|數字|片語|句子|問句|日常對話)?：/, '');
  m = m.replace(/^請拼出(?:單字|數字|片語)?：/, '');
  const paren = m.match(/\((.+?)\)/);
  if (paren && paren[1]) return paren[1].trim();
  m = m.replace(/^[「『"']+|[」』"']+$/g, '');
  return m.trim();
}

function extractMeaningFromExplain(explain: string | undefined, word: string): string {
  if (!explain) return word;
  const quoteMatch = explain.match(/[「『](.+?)[」』]/);
  if (quoteMatch && quoteMatch[1].length <= 15) return quoteMatch[1].trim();

  const pattern = new RegExp(word + '\\s*(?:指|表示|意為|是|的意思是|為)\\s*([^，。；\\n]+)', 'i');
  const m = explain.match(pattern);
  if (m && m[1]) return m[1].replace(/^[「『"']+|[」』"']+$/g, '').trim();

  const paren = explain.match(/\(([\u4e00-\u9fa5]+)\)/);
  if (paren && paren[1] && paren[1].length <= 10) return paren[1].trim();

  const first = explain.split(/[，。；：\n]/)[0].trim();
  if (first.length >= 2 && first.length <= 15 && !first.includes(word)) return first;

  return word;
}

function guessPos(word: string): string {
  const w = word.toLowerCase();
  if (w.endsWith('tion') || w.endsWith('ment') || w.endsWith('ness') || w.endsWith('ity') || w.endsWith('ship') || w.endsWith('ance') || w.endsWith('ence')) return 'n.';
  if (w.endsWith('able') || w.endsWith('ible') || w.endsWith('ous') || w.endsWith('ive') || w.endsWith('ful') || w.endsWith('less') || w.endsWith('al') || w.endsWith('ic')) return 'adj.';
  if (w.endsWith('ly')) return 'adv.';
  if (w.endsWith('ize') || w.endsWith('ise') || w.endsWith('ate') || w.endsWith('ify')) return 'v.';
  return 'n.';
}

function determinePos(text: string): string {
  const words = text.trim().split(/\s+/);
  if (words.length === 1) {
    return guessPos(words[0]);
  }
  if (/^(I|YOU|HE|SHE|WE|THEY|IT|THERE|THIS|WHAT|WHERE|HOW|CAN|PLEASE|DO|DID|HAVE)\b/i.test(text) || text.endsWith('.')) {
    return 'sent.';
  }
  return 'phr.';
}

let addedCount = 0;
const newEntries: Record<string, VocabEntry> = { ...currentGenVocab };

// 1. 先將全部分區 vocab-r0 ~ vocab-r8 的詞條完整同步入 newEntries
for (let r = 0; r <= 8; r++) {
  try {
    const vrPath = resolve(process.cwd(), `src/game/questions/bank/vocab-r${r}.json`);
    const vr = JSON.parse(readFileSync(vrPath, 'utf-8'));
    for (const [rawKey, entry] of Object.entries<any>(vr)) {
      const canonical = rawKey.replace(/^R\d+:/, '').toUpperCase();
      if (!newEntries[canonical]) {
        newEntries[canonical] = {
          word: entry.word ?? canonical.toLowerCase(),
          pos: entry.pos ?? (canonical.includes(' ') ? 'phr.' : 'n.'),
          meaning: entry.meaning ?? '',
          example: entry.example ?? (entry.senses?.[0]?.examples?.[0]?.en || `${canonical.toLowerCase()}.`),
          exampleZh: entry.exampleZh ?? (entry.senses?.[0]?.examples?.[0]?.zh || `${entry.meaning || ''}。`),
          senses: entry.senses,
        };
        addedCount++;
      }
    }
  } catch {}
}

// 基礎功能詞列表（不單獨萃取為高階字典卡）
const STOP_WORDS = new Set([
  'THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'ANY', 'CAN', 'HAD', 'HER', 'WAS', 'ONE', 'OUR', 'OUT', 'DAY', 'GET', 'HAS', 'HIM', 'HIS', 'HOW', 'MAN', 'NEW', 'NOW', 'OLD', 'SEE', 'TWO', 'WAY', 'WHO', 'BOY', 'DID', 'ITS', 'LET', 'PUT', 'SAY', 'SHE', 'TOO', 'USE', 'THAT', 'THIS', 'WITH', 'FROM', 'HAVE', 'THEY', 'BEEN', 'WERE'
]);

// 2. 掃描題目池，為選擇題中的高階單字/片語萃取字典卡
for (const [, pool] of Object.entries(QUESTION_POOL)) {
  const allQ = [...pool.normal, ...pool.boss];
  for (const q of allQ) {
    let key = vocabKey(q);

    // 若非拼寫/語音/填空，檢查是否為單字或片語選擇題
    if (!key && q.type === 'choice' && q.options) {
      const correctOpt = q.options.find(o => o.startsWith(q.ans + '.'));
      if (correctOpt) {
        const candidate = correctOpt.slice(3).trim();
        // 1. 單字候選（3 個字母以上，非虛詞）
        if (/^[A-Za-z]+$/.test(candidate) && candidate.length >= 3 && !STOP_WORDS.has(candidate.toUpperCase())) {
          key = candidate.toUpperCase();
        }
        // 2. 高階片語/搭配詞候選（2~4 個單字，如 carte blanche, take umbrage）
        else if (/^[A-Za-z]+(\s+[A-Za-z]+){1,3}$/.test(candidate) && candidate.length >= 5) {
          key = candidate.toUpperCase();
        }
      }
    }

    if (!key) continue;

    const canonicalKey = key.replace(/^R\d+:/, '').toUpperCase();

    if (!newEntries[canonicalKey]) {
      let word = canonicalKey.toLowerCase();
      let meaning = '';
      let pos = 'n.';
      let example = `${word.charAt(0).toUpperCase() + word.slice(1)}.`;
      let exampleZh = '';

      if (q.type === 'choice') {
        meaning = extractMeaningFromExplain(q.explain, word);
        pos = canonicalKey.includes(' ') ? 'phr.' : guessPos(word);
        if (q.desc.includes('___')) {
          const cleanDesc = q.desc.replace(/【[^】]+】/g, '').replace(/🎧\s*/g, '').trim();
          example = cleanDesc.replace(/_{2,}/g, word);
          exampleZh = q.explain ? q.explain.split(/[。；\n]/)[0].trim() + '。' : `${meaning}。`;
        } else {
          example = `The concept of ${word} is fundamental in this context.`;
          exampleZh = `此語境充分體現了「${meaning}」的核心意涵。`;
        }
      } else {
        meaning = extractMeaning(q.desc) || q.explain || canonicalKey;
        const speak = q.speak || q.ans.toLowerCase();
        word = speak;
        pos = determinePos(speak);
        example = q.speak ? (q.speak.endsWith('.') || q.speak.endsWith('?') ? q.speak : `${q.speak.charAt(0).toUpperCase() + q.speak.slice(1)}.`) : `${canonicalKey.toLowerCase()}.`;
        exampleZh = meaning.endsWith('。') || meaning.endsWith('？') ? meaning : `${meaning}。`;
      }

      newEntries[canonicalKey] = {
        word,
        pos,
        meaning,
        example,
        exampleZh,
      };

      addedCount++;
    }
  }
}

writeFileSync(genVocabPath, JSON.stringify(newEntries, null, 1) + '\n', 'utf-8');
console.log(`成功萃取並補入 ${addedCount} 筆詞彙/片語/句型卡片至 generated-vocab.json！總詞庫量達 ${Object.keys(newEntries).length} 條。`);
