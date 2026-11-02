// 執行方式：npx tsx scripts/auto-lemmatize-vocab.ts
// 功能：從全部題庫與分區詞庫中自動萃取未建檔單字、高頻生活片語、文法句型與選擇題字彙，
// 全面補充至 generated-vocab.json，讓冒險圖鑑、錯題本與戰鬥結算能完整查閱所有單字/片語卡片！

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import './loadBanks';
import { QUESTION_POOL } from '../src/game/QuestionData';
import { vocabKey } from '../src/game/vocab';
import type { VocabEntry } from '../src/game/types';

const genVocabPath = resolve(process.cwd(), 'src/game/questions/generated-vocab.json');
const currentGenVocab: Record<string, VocabEntry> = JSON.parse(readFileSync(genVocabPath, 'utf-8'));

function extractMeaning(desc: string): string {
  let m = desc;
  m = m.replace(/^請唸出(?:單字|短句|數字|片語|句子|問句|日常對話)?：/, '');
  m = m.replace(/^請拼出(?:單字|數字|片語)?：/, '');
  const paren = m.match(/[\(（](.+?)[\)）]/);
  if (paren && paren[1]) return paren[1].trim();
  m = m.replace(/^[「『"']+|[」』"']+$/g, '');
  return m.trim();
}

function extractMeaningFromExplain(explain: string | undefined, word: string): string {
  if (!explain) return word;

  // 1. 抓取引號中的中文：例如 「辦公室」
  const quoteMatch = explain.match(/[「『](.+?)[」』]/);
  if (quoteMatch && quoteMatch[1].length <= 20) return quoteMatch[1].trim();

  // 2. 抓取「詞：中文」格式，例如 "DESK (n.)：書桌；辦公桌。"
  const colonMatch = explain.match(/(?:：|:\s*)([\u4e00-\u9fa5\s；，、]+?)(?:[。；\n]|$)/);
  if (colonMatch && colonMatch[1] && colonMatch[1].trim().length <= 25) {
    return colonMatch[1].trim();
  }

  // 3. 抓取「指/表示/意為/為...」
  const pattern = new RegExp('(?:指|表示|意為|是|的意思是|為)\\s*([\\u4e00-\\u9fa5\\s；，、]+?)(?:[，。；\\n]|$)', 'i');
  const m = explain.match(pattern);
  if (m && m[1] && m[1].trim().length <= 25) {
    return m[1].replace(/^[「『"']+|[」』"']+$/g, '').trim();
  }

  // 4. 抓取括號內的中文釋義
  const paren = explain.match(/[\(（]([\u4e00-\u9fa5\s；，、]+)[\)）]/);
  if (paren && paren[1] && paren[1].length <= 20) return paren[1].trim();

  // 5. 取第一句純中文
  const first = explain.split(/[，。；：\n]/)[0].trim();
  if (first.length >= 2 && first.length <= 20 && !first.toLowerCase().includes(word.toLowerCase())) return first;

  return word;
}

function guessPos(word: string): string {
  const w = word.toLowerCase().trim();
  if (w.includes(' ')) return 'phr.';
  if (['i', 'you', 'he', 'she', 'we', 'they', 'it', 'this', 'that', 'these', 'those', 'who', 'what', 'which', 'my', 'your', 'his', 'her', 'our', 'their', 'its'].includes(w)) return 'pron.';
  if (['in', 'on', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'over', 'under'].includes(w)) return 'prep.';
  if (['and', 'but', 'or', 'so', 'because', 'although', 'though', 'while', 'if', 'unless', 'since'].includes(w)) return 'conj.';
  if (['can', 'could', 'may', 'might', 'must', 'shall', 'should', 'will', 'would'].includes(w)) return 'v.aux.';
  if (w.endsWith('tion') || w.endsWith('ment') || w.endsWith('ness') || w.endsWith('ity') || w.endsWith('ship') || w.endsWith('ance') || w.endsWith('ence') || w.endsWith('ism') || w.endsWith('ist') || w.endsWith('er') || w.endsWith('or')) return 'n.';
  if (w.endsWith('able') || w.endsWith('ible') || w.endsWith('ous') || w.endsWith('ive') || w.endsWith('ful') || w.endsWith('less') || w.endsWith('al') || w.endsWith('ic') || w.endsWith('ary')) return 'adj.';
  if (w.endsWith('ly')) return 'adv.';
  if (w.endsWith('ize') || w.endsWith('ise') || w.endsWith('ate') || w.endsWith('ify') || w.endsWith('ed') || w.endsWith('ing')) return 'v.';
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
      const canonical = rawKey.replace(/^R\d+:/, '').toUpperCase().replace(/\s+/g, '_');
      if (!newEntries[canonical]) {
        newEntries[canonical] = {
          word: entry.word ?? rawKey.toLowerCase(),
          pos: entry.pos ?? (canonical.includes('_') ? 'phr.' : 'n.'),
          meaning: entry.meaning ?? '',
          example: entry.example ?? (entry.senses?.[0]?.examples?.[0]?.en || `${rawKey.toLowerCase()}.`),
          exampleZh: entry.exampleZh ?? (entry.senses?.[0]?.examples?.[0]?.zh || `${entry.meaning || ''}。`),
          senses: entry.senses,
        };
        addedCount++;
      }
    }
  } catch {}
}

// 2. 深度掃描全題庫：包含拼寫、填空、語音、以及所有選擇題中的單字與片語
for (const [, pool] of Object.entries(QUESTION_POOL)) {
  const allQ = [...pool.normal, ...pool.boss];
  for (const q of allQ) {
    // 取得或識別目標詞彙
    let key = vocabKey(q);

    // 如果 vocabKey 沒命中，但這是選擇題，從正確選項與題幹中提取
    if (!key && q.type === 'choice' && q.options && q.ans) {
      const letters = ['A', 'B', 'C', 'D'];
      const ansLetter = q.ans.trim().toUpperCase();
      const idx = letters.indexOf(ansLetter);
      const optStr = idx >= 0 && q.options[idx] ? q.options[idx] : q.options.find(o => o.trim().toUpperCase().startsWith(ansLetter + '.'));

      if (optStr) {
        // 清理選項文字：去除前綴 A. 與後續括號或標點
        let candidate = optStr.replace(/^[A-D]\.\s*/i, '').trim();
        candidate = candidate.replace(/[\(\[（].*?[\)\]）]/g, '').trim();

        // 單字或 2-4 字的高頻短片語
        if (/^[A-Za-z]+(\s+[A-Za-z]+){0,3}$/.test(candidate) && candidate.length >= 2) {
          key = candidate;
        }
      }
    }

    if (!key) continue;

    const rawWord = key.trim();
    const canonicalKey = rawWord.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
    if (!canonicalKey || canonicalKey.length < 2) continue;

    // 若尚未建檔，則自動建立精緻字典卡片
    if (!newEntries[canonicalKey]) {
      let word = rawWord.toLowerCase();
      let meaning = '';
      let pos = 'n.';
      let example = '';
      let exampleZh = '';

      if (q.type === 'choice') {
        meaning = extractMeaningFromExplain(q.explain, rawWord);
        pos = determinePos(rawWord);

        // 如果題目包含填空下劃線 ___，直接置換形成最地道的真實例句
        if (q.desc.includes('___')) {
          const cleanDesc = q.desc.replace(/【[^】]+】/g, '').replace(/🎧\s*/g, '').trim();
          example = cleanDesc.replace(/_{2,}/g, word);
          const firstExp = q.explain ? q.explain.split(/[。；\n]/)[0].trim() : '';
          exampleZh = firstExp ? (firstExp.endsWith('。') ? firstExp : `${firstExp}。`) : `${meaning}。`;
        } else if (q.desc.startsWith('【') && q.desc.includes('】')) {
          // 篇章/對話/文法題
          const stem = q.desc.replace(/【[^】]+】\s*/, '').replace(/🎧\s*/g, '').trim();
          if (stem.length >= 10 && /^[A-Z]/i.test(stem)) {
            example = stem.endsWith('.') || stem.endsWith('?') ? stem : `${stem}.`;
            exampleZh = q.explain ? q.explain.split(/[。；\n]/)[0].trim() + '。' : `${meaning}。`;
          } else {
            example = `We should focus on the usage of ${word} in modern English.`;
            exampleZh = `在現代英文語境中應充分掌握「${meaning}」的核心用法。`;
          }
        } else {
          example = `The phrase "${word}" is frequently used in practical English communication.`;
          exampleZh = `「${meaning}」是在實用英語溝通中經常運用的重要表達。`;
        }
      } else {
        // 拼寫、填空、口說題
        meaning = extractMeaning(q.desc) || extractMeaningFromExplain(q.explain, rawWord) || rawWord;
        pos = determinePos(rawWord);
        const speak = q.speak || rawWord;
        word = speak;
        example = speak ? (speak.endsWith('.') || speak.endsWith('?') ? speak : `${speak.charAt(0).toUpperCase() + speak.slice(1)}.`) : `${rawWord}.`;
        exampleZh = meaning.endsWith('。') || meaning.endsWith('？') ? meaning : `${meaning}。`;
      }

      // 避免中文釋義是英文本身或空值
      if (!meaning || meaning.toLowerCase() === word.toLowerCase()) {
        meaning = q.desc ? extractMeaning(q.desc) : word;
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
