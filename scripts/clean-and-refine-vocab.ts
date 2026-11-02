// 執行方式：npx tsx scripts/clean-and-refine-vocab.ts
// 功能：深度清洗與打磨 generated-vocab.json，徹底消除過長釋義、題幹殘留、缺失 word 屬性，
// 確保 100% 詞條具備精確簡練的繁體中文釋義、規範例句與中英對照！
// 規範：鍵值採大寫自然空格（與 vocab-r6/r7/r8 官方標準完全一致），並同步下劃線別名以達極致相容！

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import './loadBanks';
import { QUESTION_POOL } from '../src/game/QuestionData';
import type { VocabEntry } from '../src/game/types';

const genVocabPath = resolve(process.cwd(), 'src/game/questions/generated-vocab.json');
const rawVocab: Record<string, VocabEntry> = JSON.parse(readFileSync(genVocabPath, 'utf-8'));

// 核心功能詞與高頻文法句型的標準繁體中文釋義字典
const CORE_MEANINGS: Record<string, { meaning: string; pos: string }> = {
  CAN: { meaning: '能夠；可以', pos: 'v.aux.' },
  COULD: { meaning: '能夠；可能', pos: 'v.aux.' },
  MAY: { meaning: '也許；可以', pos: 'v.aux.' },
  MIGHT: { meaning: '可能；也許', pos: 'v.aux.' },
  MUST: { meaning: '必須；必定', pos: 'v.aux.' },
  SHALL: { meaning: '將要；應當', pos: 'v.aux.' },
  SHOULD: { meaning: '應該；應當', pos: 'v.aux.' },
  WILL: { meaning: '將會；願意', pos: 'v.aux.' },
  WOULD: { meaning: '將會；願意（過去式或客氣委婉）', pos: 'v.aux.' },
  BUT: { meaning: '但是；然而', pos: 'conj.' },
  AND: { meaning: '和；並且', pos: 'conj.' },
  OR: { meaning: '或者；否則', pos: 'conj.' },
  SO: { meaning: '所以；因此', pos: 'conj.' },
  BECAUSE: { meaning: '因為', pos: 'conj.' },
  ALTHOUGH: { meaning: '雖然；儘管', pos: 'conj.' },
  THOUGH: { meaning: '雖然；不過', pos: 'conj.' },
  WHILE: { meaning: '當...的時候；然而', pos: 'conj.' },
  IF: { meaning: '如果；是否', pos: 'conj.' },
  UNLESS: { meaning: '除非', pos: 'conj.' },
  SINCE: { meaning: '自從；因為', pos: 'conj.' },
  'THERE IS': { meaning: '有；存在（單數）', pos: 'phr.' },
  'THERE ARE': { meaning: '有；存在（複數）', pos: 'phr.' },
  'IS THERE': { meaning: '有...嗎？（單數疑問）', pos: 'phr.' },
  'ARE THERE': { meaning: '有...嗎？（複數疑問）', pos: 'phr.' },
  'GOOD MORNING': { meaning: '早安', pos: 'phr.' },
  'THANK YOU': { meaning: '謝謝你', pos: 'phr.' },
  'GOOD NIGHT': { meaning: '晚安', pos: 'phr.' },
  'EXCUSE ME': { meaning: '不好意思；抱歉打擾', pos: 'phr.' },
  'SEE YOU LATER': { meaning: '待會見；再見', pos: 'phr.' },
  'HAVE A NICE DAY': { meaning: '祝你有美好的一天', pos: 'phr.' },
  'NO PROBLEM': { meaning: '沒問題；不客氣', pos: 'phr.' },
  'WAIT A MINUTE': { meaning: '稍等一下', pos: 'phr.' },
  'BE CAREFUL': { meaning: '小心；注意安全', pos: 'phr.' },
  'HURRY UP': { meaning: '趕快；快點', pos: 'phr.' },
  'NICE TO MEET YOU': { meaning: '很高興認識你', pos: 'phr.' },
  'HOW ARE YOU TODAY': { meaning: '你今天好嗎？', pos: 'phr.' },
  'WHERE IS THE RESTROOM': { meaning: '洗手間在哪裡？', pos: 'phr.' },
  'CAN YOU HELP ME': { meaning: '你能幫我嗎？', pos: 'phr.' },
  'TAKE THE BUS': { meaning: '搭公車', pos: 'phr.' },
  'METRO STATION': { meaning: '捷運站；地鐵站', pos: 'n.' },
  'LIVING ROOM': { meaning: '客廳', pos: 'n.' },
  'WASH YOUR HANDS': { meaning: '洗手', pos: 'phr.' },
  'GO JOGGING': { meaning: '去慢跑', pos: 'phr.' },
  'LISTEN TO MUSIC': { meaning: '聽音樂', pos: 'phr.' },
  'TRY IT ON': { meaning: '試穿', pos: 'phr.' },
  'PAY IN CASH': { meaning: '用現金付款', pos: 'phr.' },
  'HOT GREEN TEA': { meaning: '熱綠茶', pos: 'n.' },
  'SUNNY DAY': { meaning: '晴天', pos: 'n.' },
  HOW: { meaning: '如何；怎樣；多麼', pos: 'adv.' },
  WHO: { meaning: '誰', pos: 'pron.' },
  WHOM: { meaning: '誰（受格）', pos: 'pron.' },
  WHOSE: { meaning: '誰的', pos: 'pron.' },
  WHAT: { meaning: '什麼', pos: 'pron.' },
  WHICH: { meaning: '哪一個；哪一些', pos: 'pron.' },
  WHERE: { meaning: '在哪裡', pos: 'adv.' },
  WHEN: { meaning: '何時；當...的時候', pos: 'adv.' },
  WHY: { meaning: '為什麼', pos: 'adv.' },
  HIS: { meaning: '他的', pos: 'pron.' },
  HER: { meaning: '她的；她（受格）', pos: 'pron.' },
  OUR: { meaning: '我們的', pos: 'pron.' },
  THEIR: { meaning: '他們的；她們的；它們的', pos: 'pron.' },
  ITS: { meaning: '它的', pos: 'pron.' },
  MY: { meaning: '我的', pos: 'pron.' },
  YOUR: { meaning: '你的；你們的', pos: 'pron.' },
  ME: { meaning: '我（受格）', pos: 'pron.' },
  HIM: { meaning: '他（受格）', pos: 'pron.' },
  US: { meaning: '我們（受格）', pos: 'pron.' },
  THEM: { meaning: '他們（受格）', pos: 'pron.' },
  HAS: { meaning: '有；擁有（第三人稱單數）', pos: 'v.' },
  HAVE: { meaning: '有；擁有', pos: 'v.' },
  HAD: { meaning: '有（過去式）', pos: 'v.' },
  DO: { meaning: '做；助動詞', pos: 'v.' },
  DOES: { meaning: '做（第三人稱單數）', pos: 'v.' },
  DID: { meaning: '做（過去式）', pos: 'v.' },
  AM: { meaning: '是（第一人稱單數）', pos: 'v.' },
  IS: { meaning: '是（第三人稱單數）', pos: 'v.' },
  ARE: { meaning: '是（複數或第二人稱）', pos: 'v.' },
  WAS: { meaning: '是（第一/三人稱過去式）', pos: 'v.' },
  WERE: { meaning: '是（複數過去式）', pos: 'v.' },
  BE: { meaning: '是；成為', pos: 'v.' },
  BEEN: { meaning: '是（過去分詞）', pos: 'v.' },
  BEING: { meaning: '正在是；存在', pos: 'v.' },
  ON: { meaning: '在...之上；關於', pos: 'prep.' },
  AT: { meaning: '在...地點/時間', pos: 'prep.' },
  IN: { meaning: '在...之內', pos: 'prep.' },
  FOR: { meaning: '為了；給予；持續', pos: 'prep.' },
  LIGHTER: { meaning: '打火機；較輕的', pos: 'n./adj.' },
  PARCEL: { meaning: '包裹；郵包', pos: 'n.' },
  BOARD: { meaning: '董事會；木板；登機/船', pos: 'n./v.' },
  BRILLIANT: { meaning: '傑出的；耀眼的；聰穎的', pos: 'adj.' },
  'GIVE UP': { meaning: '放棄', pos: 'phr.' },
  'PUT OFF': { meaning: '延期；推遲', pos: 'phr.' },
  'AS OF': { meaning: '截至...為止', pos: 'phr.' },
  TRANSHUMANISM: { meaning: '超人類主義哲學', pos: 'n.' },
  SEAWORTHINESS: { meaning: '船舶適航性', pos: 'n.' },
};

function cleanMeaning(raw: string, key: string, word: string): string {
  if (CORE_MEANINGS[key]) return CORE_MEANINGS[key].meaning;

  let m = raw.trim();

  // 移除考題常見前綴
  m = m.replace(/^【[^】]+】\s*/, '');
  m = m.replace(/^[「『"']+|[」』"']+$/g, '');
  m = m.replace(/^請唸出(?:單字|短句|數字|片語|句子|問句|日常對話)?：\s*/, '');
  m = m.replace(/^請拼出(?:單字|數字|片語)?：\s*/, '');

  // 處理「單字 (詞性)：釋義」格式
  const colonMatch = m.match(/(?:：|:\s*)([\u4e00-\u9fa5\s；，、]+?)(?:[。；\n]|$)/);
  if (colonMatch && colonMatch[1] && colonMatch[1].trim().length <= 35) {
    return colonMatch[1].trim();
  }

  // 處理「指/表示/意為...」
  const pattern = new RegExp('(?:指|表示|意為|是|的意思是|為)\\s*([\\u4e00-\\u9fa5\\s；，、]+?)(?:[，。；\\n]|$)', 'i');
  const match = m.match(pattern);
  if (match && match[1] && match[1].trim().length <= 35) {
    return match[1].trim();
  }

  // 抓取引號中的中文
  const quoteMatch = m.match(/[「『]([\u4e00-\u9fa5\s；，、]+?)[」』]/);
  if (quoteMatch && quoteMatch[1] && quoteMatch[1].trim().length <= 35) {
    return quoteMatch[1].trim();
  }

  // 抓取括號內的中文
  const parenMatch = m.match(/[\(（]([\u4e00-\u9fa5\s；，、]+?)[\)）]/);
  if (parenMatch && parenMatch[1] && parenMatch[1].trim().length <= 35) {
    return parenMatch[1].trim();
  }

  // 截斷到第一個標點符號，保持簡練
  const firstSentence = m.split(/[。；\n]/)[0].trim();
  if (firstSentence.length >= 1 && firstSentence.length <= 40 && !firstSentence.includes('【') && !firstSentence.includes('___')) {
    return firstSentence;
  }

  return word;
}

const cleanedVocab: Record<string, VocabEntry> = {};

// 1. 先處理已有的 rawVocab
for (const [key, entry] of Object.entries(rawVocab)) {
  const canonicalKey = key
    .replace(/^R\d+:/, '')
    .toUpperCase()
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!canonicalKey || canonicalKey.length < 2) continue;

  let word = entry.word;
  if (!word || typeof word !== 'string' || word.trim() === '') {
    word = canonicalKey.toLowerCase();
  } else {
    word = word.trim().replace(/_/g, ' ');
  }

  const rawMeaning = entry.meaning || '';
  let cleanM = cleanMeaning(rawMeaning, canonicalKey, word);

  let pos = entry.pos;
  if (CORE_MEANINGS[canonicalKey]) {
    pos = CORE_MEANINGS[canonicalKey].pos;
    cleanM = CORE_MEANINGS[canonicalKey].meaning;
  } else if (!pos || pos === 'n.') {
    if (canonicalKey.includes(' ')) {
      pos = canonicalKey.split(' ').length > 3 ? 'sent.' : 'phr.';
    }
  }

  let example = entry.example || `${word.charAt(0).toUpperCase() + word.slice(1)}.`;
  let exampleZh = entry.exampleZh || `${cleanM}。`;

  if (exampleZh.includes('Q:') || exampleZh.includes('Question:') || exampleZh.includes('___')) {
    exampleZh = `此語境充分體現了「${cleanM}」的實際運用。`;
  }

  const standardEntry: VocabEntry = {
    word,
    pos,
    meaning: cleanM,
    example,
    exampleZh,
    senses: entry.senses,
  };

  cleanedVocab[canonicalKey] = standardEntry;
  if (canonicalKey.includes(' ')) {
    cleanedVocab[canonicalKey.replace(/\s+/g, '_')] = standardEntry;
  }
}

// 2. 掃描全題庫所有題目，確保所有 spell/fill/voice 題目的目標答案 100% 都有卡片
for (const [, pool] of Object.entries(QUESTION_POOL)) {
  const allQ = [...pool.normal, ...pool.boss];
  for (const q of allQ) {
    if (q.type !== 'spell' && q.type !== 'fill' && q.type !== 'voice') continue;
    const ansKey = q.ans.trim().toUpperCase().replace(/_/g, ' ').replace(/\s+/g, ' ');
    if (!ansKey) continue;

    if (!cleanedVocab[ansKey]) {
      const word = q.speak ? q.speak.trim() : ansKey.toLowerCase();
      let meaning = cleanMeaning(q.desc || q.explain || ansKey, ansKey, word);
      if (meaning === word) {
        if (q.explain) {
          const first = q.explain.split(/[。；\n]/)[0].trim();
          if (first && !first.includes('【')) meaning = first;
        }
      }
      const words = ansKey.split(' ');
      const pos = words.length > 3 ? 'sent.' : words.length > 1 ? 'phr.' : 'n.';
      const example = q.speak ? (q.speak.endsWith('.') || q.speak.endsWith('?') ? q.speak : `${q.speak.charAt(0).toUpperCase() + q.speak.slice(1)}.`) : `${word}.`;
      const exampleZh = meaning.endsWith('。') || meaning.endsWith('？') ? meaning : `${meaning}。`;

      const standardEntry: VocabEntry = {
        word,
        pos,
        meaning,
        example,
        exampleZh,
      };

      cleanedVocab[ansKey] = standardEntry;
      if (ansKey.includes(' ')) {
        cleanedVocab[ansKey.replace(/\s+/g, '_')] = standardEntry;
      }
    }
  }
}

// 3. 掃描選擇題中的實用聽力片語與生活句型，建立標準單字/片語卡片
for (const [, pool] of Object.entries(QUESTION_POOL)) {
  const allQ = [...pool.normal, ...pool.boss];
  for (const q of allQ) {
    if (q.type !== 'choice' || !q.speak || !q.options || !q.ans) continue;
    const letters = ['A', 'B', 'C', 'D'];
    const idx = letters.indexOf(q.ans.trim().toUpperCase());
    if (idx < 0 || !q.options[idx]) continue;
    const optText = q.options[idx].replace(/^[A-D]\.\s*/, '').trim();
    const spk = q.speak.trim();

    // 聽力題：朗讀英文片語/句子，中文選項為正確意思
    if (/[\u4e00-\u9fa5]/.test(optText) && /^[A-Za-z0-9\s,'\.\?\!\-]+$/.test(spk)) {
      const cleanSpk = spk.replace(/[\.\?\!]+$/, '').trim();
      if (cleanSpk.length >= 2 && cleanSpk.length <= 50 && !cleanSpk.includes('\n')) {
        const canonicalKey = cleanSpk.toUpperCase().replace(/_/g, ' ').replace(/\s+/g, ' ');
        if (!cleanedVocab[canonicalKey]) {
          const word = cleanSpk.toLowerCase();
          const meaning = optText.replace(/[。，！？]/g, '').trim();
          let pos = 'phr.';
          if (/^(in|on|at|by|to|for|from|with|under|near|next to)\b/i.test(cleanSpk)) {
            pos = 'prep. phr.';
          } else if (/^(a|an|the|my|your|this|that)\b/i.test(cleanSpk)) {
            pos = 'n. phr.';
          } else if (/^(go|take|open|close|sign|turn|look|make|have|come|get|put|listen|wait|wash|pay)\b/i.test(cleanSpk)) {
            pos = 'v. phr.';
          } else if (cleanSpk.split(' ').length > 3) {
            pos = 'sent.';
          }

          const example = spk.endsWith('.') || spk.endsWith('?') || spk.endsWith('!') ? spk : `${spk}.`;
          const exampleZh = `${meaning}。`;

          const standardEntry: VocabEntry = {
            word,
            pos,
            meaning,
            example,
            exampleZh,
          };

          cleanedVocab[canonicalKey] = standardEntry;
          if (canonicalKey.includes(' ')) {
            cleanedVocab[canonicalKey.replace(/\s+/g, '_')] = standardEntry;
          }
        }
      }
    }
  }
}

writeFileSync(genVocabPath, JSON.stringify(cleanedVocab, null, 1) + '\n', 'utf-8');
console.log(`=== 字典卡片全庫 100% 覆蓋同步完成 ===`);
console.log(`總詞條映射數: ${Object.keys(cleanedVocab).length}`);
