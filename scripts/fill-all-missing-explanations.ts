import { readFileSync, writeFileSync } from 'node:fs';

// 收集全專案字彙庫
const globalVocab = new Map<string, any>();

// 1. 讀取 generated-vocab.json
try {
  const gv = JSON.parse(readFileSync('src/game/questions/generated-vocab.json', 'utf-8'));
  for (const item of gv) {
    if (item.word) {
      globalVocab.set(item.word.toUpperCase(), item);
    }
  }
} catch {}

// 2. 讀取 vocab-r0 ~ vocab-r8
for (let r = 0; r <= 8; r++) {
  try {
    const vr = JSON.parse(readFileSync(`src/game/questions/bank/vocab-r${r}.json`, 'utf-8'));
    for (const [key, item] of Object.entries<any>(vr)) {
      const canonical = key.replace(/^R\d+:/, '').toUpperCase();
      if (!globalVocab.has(canonical)) {
        globalVocab.set(canonical, item);
      }
    }
  } catch {}
}

console.log(`Global vocabulary indexed: ${globalVocab.size} entries.`);

let totalEnriched = 0;

for (let r = 0; r <= 8; r++) {
  const path = `src/game/questions/bank/r${r}.json`;
  let data: any;
  try {
    data = JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    continue;
  }

  let enrichedInRegion = 0;
  for (const group of ['normal', 'boss']) {
    for (const q of data[group] || []) {
      if (q.explain && q.explain.trim() !== '') continue;

      if (q.type === 'spell') {
        const word = (q.ans || '').trim().toUpperCase();
        const v = globalVocab.get(word);
        let meaning = '';
        const match = q.desc?.match(/請拼出[：:](.+?)[（(]/);
        if (match) meaning = match[1].trim();
        else meaning = v?.meaning || q.desc;

        const pos = v?.pos || 'n.';
        const ex = v?.example || v?.senses?.[0]?.examples?.[0]?.en;
        const exZh = v?.exampleZh || v?.senses?.[0]?.examples?.[0]?.zh;

        if (ex && exZh) {
          q.explain = `${word} (${pos})：${meaning}。例句：${ex}（${exZh}）`;
        } else {
          q.explain = `${word} (${pos})：${meaning}。`;
        }
        enrichedInRegion++;
      } else if (q.type === 'fill') {
        const fullWord = (q.speak || '').trim().toUpperCase();
        const v = globalVocab.get(fullWord);
        let meaning = '';
        const match = q.desc?.match(/[(（](.+?)[)）]$/);
        if (match) meaning = match[1].trim();
        else meaning = v?.meaning || q.desc;

        const pos = v?.pos || 'n.';
        const ex = v?.example || v?.senses?.[0]?.examples?.[0]?.en;
        const exZh = v?.exampleZh || v?.senses?.[0]?.examples?.[0]?.zh;

        if (ex && exZh) {
          q.explain = `${fullWord} (${pos})：${meaning}。填空答案為「${q.ans}」。例句：${ex}（${exZh}）`;
        } else {
          q.explain = `${fullWord} (${pos})：${meaning}。填空答案為「${q.ans}」。`;
        }
        enrichedInRegion++;
      } else if (q.type === 'voice') {
        const phrase = (q.ans || q.speak || '').trim().toUpperCase();
        const v = globalVocab.get(phrase);
        let meaning = '';
        const match = q.desc?.match(/請唸出(?:單字)?[：:](.+)$/);
        if (match) meaning = match[1].trim();
        else meaning = v?.meaning || q.desc;

        const pos = v?.pos || (phrase.includes(' ') ? 'phr.' : 'n.');
        const ex = v?.example || v?.senses?.[0]?.examples?.[0]?.en;
        const exZh = v?.exampleZh || v?.senses?.[0]?.examples?.[0]?.zh;

        if (ex && exZh) {
          q.explain = `口說表達「${phrase}」(${pos})：${meaning}。例句：${ex}（${exZh}）`;
        } else {
          q.explain = `口說表達「${phrase}」(${pos})：${meaning}。`;
        }
        enrichedInRegion++;
      } else if (q.type === 'choice') {
        q.explain = `正確解答為 ${q.ans}。`;
        enrichedInRegion++;
      }
    }
  }

  if (enrichedInRegion > 0) {
    writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
    console.log(`r${r}: enriched ${enrichedInRegion} questions with explanations.`);
    totalEnriched += enrichedInRegion;
  }
}

console.log(`Total explanations enriched: ${totalEnriched}`);
