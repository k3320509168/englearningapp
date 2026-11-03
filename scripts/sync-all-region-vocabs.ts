import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Question, VocabEntry } from '../src/game/types';
import { completedSentence } from '../src/game/battle';

// 全局字典池：合併 generated-vocab.json 以及所有既有 vocab-r0 ~ vocab-r8
const genVocabPath = resolve(process.cwd(), 'src/game/questions/generated-vocab.json');
const globalVocab: Record<string, VocabEntry> = existsSync(genVocabPath)
  ? JSON.parse(readFileSync(genVocabPath, 'utf-8'))
  : {};

for (let r = 0; r <= 8; r++) {
  const p = resolve(process.cwd(), `src/game/questions/bank/vocab-r${r}.json`);
  if (existsSync(p)) {
    const vr = JSON.parse(readFileSync(p, 'utf-8'));
    for (const [k, v] of Object.entries(vr)) {
      const uk = k.toUpperCase().trim();
      if (!globalVocab[uk]) globalVocab[uk] = v as VocabEntry;
      if (!globalVocab[k]) globalVocab[k] = v as VocabEntry;
    }
  }
}

console.log(`初始 globalVocab 詞條數: ${Object.keys(globalVocab).length}`);

// 詞性推測輔助函式
function guessPos(w: string): string {
  const lower = w.toLowerCase().trim();
  if (lower.includes(' ') || lower.includes('-')) return 'phr.';
  if (['i', 'you', 'he', 'she', 'we', 'they', 'it', 'this', 'that', 'these', 'those', 'who', 'what', 'which', 'my', 'your', 'his', 'her', 'our', 'their', 'its'].includes(lower)) return 'pron.';
  if (['in', 'on', 'at', 'by', 'for', 'with', 'about', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'over', 'under'].includes(lower)) return 'prep.';
  if (['and', 'but', 'or', 'so', 'because', 'although', 'though', 'while', 'if', 'unless', 'since'].includes(lower)) return 'conj.';
  if (['can', 'could', 'may', 'might', 'must', 'shall', 'should', 'will', 'would'].includes(lower)) return 'v.aux.';
  if (lower.endsWith('tion') || lower.endsWith('ment') || lower.endsWith('ness') || lower.endsWith('ity') || lower.endsWith('ship') || lower.endsWith('ance') || lower.endsWith('ence') || lower.endsWith('ism') || lower.endsWith('ist') || lower.endsWith('er') || lower.endsWith('or')) return 'n.';
  if (lower.endsWith('able') || lower.endsWith('ible') || lower.endsWith('ous') || lower.endsWith('ive') || lower.endsWith('ful') || lower.endsWith('less') || lower.endsWith('al') || lower.endsWith('ic') || lower.endsWith('ary')) return 'adj.';
  if (lower.endsWith('ly')) return 'adv.';
  if (lower.endsWith('ize') || lower.endsWith('ise') || lower.endsWith('ate') || lower.endsWith('ify') || lower.endsWith('ed') || lower.endsWith('ing')) return 'v.';
  return 'n.';
}

// 從題目的 desc、explain 中提取精確中文釋義
function extractMeaning(q: Question, word: string): string {
  const explain = q.explain || '';
  const desc = q.desc || '';

  // 1. 抓取「詞：中文」或「詞 (pos)：中文」
  const colonRegex = new RegExp(`(?:${word}|\\b)\\s*(?:\\([a-z.]+\\))?\\s*[：:]\\s*([\\u4e00-\\u9fa5\\s；，、]+?)(?:[。；\\n]|$)`, 'i');
  const colonMatch = explain.match(colonRegex) || desc.match(colonRegex);
  if (colonMatch && colonMatch[1] && colonMatch[1].trim().length >= 1 && colonMatch[1].trim().length <= 25) {
    return colonMatch[1].trim();
  }

  // 2. 抓取引號中的中文：例如 「辦公室」
  const quoteMatch = desc.match(/[「『](.+?)[」』]/) || explain.match(/[「『](.+?)[」』]/);
  if (quoteMatch && quoteMatch[1] && quoteMatch[1].trim().length <= 20) {
    return quoteMatch[1].trim();
  }

  // 3. 抓取括號內的中文釋義
  const parenMatch = desc.match(/[\(（]([\u4e00-\u9fa5\s；，、]+)[\)）]/) || explain.match(/[\(（]([\u4e00-\u9fa5\s；，、]+)[\)）]/);
  if (parenMatch && parenMatch[1] && parenMatch[1].trim().length <= 20) {
    return parenMatch[1].trim();
  }

  // 4. 抓取「指/表示/意為/是/的意思是/為...」
  const defMatch = explain.match(/(?:指|表示|意為|是|的意思是|為)\s*([\u4e00-\u9fa5\s；，、]+?)(?:[，。；\n]|$)/);
  if (defMatch && defMatch[1] && defMatch[1].trim().length >= 1 && defMatch[1].trim().length <= 25) {
    return defMatch[1].trim();
  }

  // 5. 抓取第一句純中文
  const firstZh = explain.split(/[，。；：\n]/).find(part => /^[\u4e00-\u9fa5\s]+$/.test(part.trim()) && part.trim().length >= 2 && part.trim().length <= 20);
  if (firstZh) return firstZh.trim();

  const descClean = desc.replace(/^請(?:唸出|拼出|填入)[^：:]*[：:]/, '').replace(/^[「『"']+|[」』"']+$/g, '').trim();
  if (/^[\u4e00-\u9fa5\s]+$/.test(descClean) && descClean.length <= 20) return descClean;

  return word.toLowerCase();
}

// 為每一個分區提取並補齊該區題庫所屬的全部單字與片語
for (let r = 0; r <= 8; r++) {
  const bankPath = resolve(process.cwd(), `src/game/questions/bank/r${r}.json`);
  const vocabPath = resolve(process.cwd(), `src/game/questions/bank/vocab-r${r}.json`);
  const bankData: { normal: Question[]; boss: Question[] } = JSON.parse(readFileSync(bankPath, 'utf-8'));
  const regionVocab: Record<string, VocabEntry> = existsSync(vocabPath)
    ? JSON.parse(readFileSync(vocabPath, 'utf-8'))
    : {};

  const allQuestions = [...bankData.normal, ...bankData.boss];
  let addedCount = 0;

  for (const q of allQuestions) {
    let rawTarget = '';
    if (q.type === 'spell' || q.type === 'voice') rawTarget = q.ans.trim();
    else if (q.type === 'fill' && q.speak) rawTarget = q.speak.trim();
    else if (q.type === 'choice' && q.options) {
      const opt = q.options.find(o => o.startsWith(`${q.ans}.`));
      if (opt) rawTarget = opt.replace(/^[A-D]\.\s*/, '').trim();
    }

    if (!rawTarget) continue;
    const cleanKey = rawTarget.replace(/[^A-Za-z0-9\s-_]/g, '').trim().toUpperCase();
    if (!cleanKey || cleanKey.length < 2 || cleanKey.length > 40) continue;

    // 檢查全域詞庫是否有此詞
    const existing = globalVocab[cleanKey] || globalVocab[cleanKey.replace(/\s+/g, '_')] || globalVocab[rawTarget.toUpperCase()];

    if (existing) {
      if (!regionVocab[cleanKey]) {
        regionVocab[cleanKey] = { ...existing, word: existing.word ?? rawTarget.toLowerCase() };
        addedCount++;
      }
      continue;
    }

    // 若完全沒有，依題目上下文自動構建高標準單字卡
    const pos = guessPos(cleanKey);
    const meaning = extractMeaning(q, rawTarget);
    const exEn = completedSentence(q) || (q.desc && !q.desc.includes('請') ? q.desc : `The word is ${rawTarget.toLowerCase()}.`);
    const exZh = q.explain ? q.explain.split(/[。\n]/)[0].trim() : `這個詞的意思是${meaning}。`;

    const newEntry: VocabEntry = {
      word: rawTarget.toLowerCase(),
      pos,
      meaning,
      example: exEn,
      exampleZh: exZh || `例句：${exEn}`,
    };

    regionVocab[cleanKey] = newEntry;
    globalVocab[cleanKey] = newEntry;
    addedCount++;
  }

  // 寫回 vocab-rX.json
  writeFileSync(vocabPath, JSON.stringify(regionVocab, null, 2), 'utf-8');
  console.log(`Region ${r}: 題數 ${allQuestions.length} -> 補齊後 vocab 詞條數: ${Object.keys(regionVocab).length} (新增 ${addedCount})`);
}

// 寫回 generated-vocab.json
writeFileSync(genVocabPath, JSON.stringify(globalVocab, null, 2), 'utf-8');
console.log(`最新 globalVocab 總詞條數: ${Object.keys(globalVocab).length}`);
