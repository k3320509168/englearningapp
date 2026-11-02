import { readFileSync } from 'node:fs';

console.log('=== 開始全題庫深度審核 (Deep Question Audit) ===');

let totalCount = 0;
const errors: string[] = [];
const warnings: string[] = [];
const seenKeys = new Set<string>();

for (let r = 0; r <= 8; r++) {
  const p = `src/game/questions/bank/r${r}.json`;
  let data: any;
  try {
    data = JSON.parse(readFileSync(p, 'utf-8'));
  } catch (e: any) {
    errors.push(`r${r}: 無法讀取題庫檔案 ${e.message}`);
    continue;
  }

  const all = [...(data.normal || []), ...(data.boss || [])];
  for (let idx = 0; idx < all.length; idx++) {
    const q = all[idx];
    totalCount++;
    const loc = `r${r}[${idx}](${q.type}, ${q.ans || q.speak})`;

    // 1. 去重鍵檢查
    const key = `${q.type}|${q.desc}|${q.speak || ''}`;
    if (seenKeys.has(key)) {
      errors.push(`${loc}: 重複題目 -> ${key}`);
    } else {
      seenKeys.add(key);
    }

    // 2. 解析完整度
    if (!q.explain || q.explain.trim() === '') {
      errors.push(`${loc}: 缺少 explain 解析`);
    }

    // 3. 題幹基本檢查
    if (!q.desc || q.desc.trim() === '') {
      errors.push(`${loc}: 題幹 desc 為空`);
    }

    // 4. 題型專屬嚴格校驗
    if (q.type === 'choice') {
      if (!Array.isArray(q.options) || q.options.length !== 4) {
        errors.push(`${loc}: 選擇題選項數量不為 4 (實際: ${q.options?.length})`);
      } else {
        const texts = q.options.map((o: string) => o.slice(3).trim());
        const uniq = new Set(texts);
        if (uniq.size !== 4) {
          errors.push(`${loc}: 選擇題選項內容重複 -> ${texts.join(' | ')}`);
        }
      }
      if (!['A', 'B', 'C', 'D'].includes(q.ans)) {
        errors.push(`${loc}: 選擇題答案不在 ABCD 範圍內 -> ${q.ans}`);
      }
    } else if (q.type === 'spell') {
      if (!/^[A-Z]+$/.test(q.ans)) {
        errors.push(`${loc}: 拼寫題答案包含非大寫英文字母 -> ${q.ans}`);
      }
      // 檢查提示的首字母與長度
      const m = q.desc.match(/（([A-Z]) 開頭，(\d+) 個字母/);
      if (m) {
        const expectedLetter = m[1];
        const expectedLen = parseInt(m[2], 10);
        if (q.ans[0] !== expectedLetter) {
          errors.push(`${loc}: 首字母不符 (提示 ${expectedLetter}, 實際 ${q.ans[0]})`);
        }
        if (q.ans.length !== expectedLen && !q.spellAccept) {
          errors.push(`${loc}: 字母數不符 (提示 ${expectedLen}, 實際 ${q.ans.length})`);
        }
      }
    } else if (q.type === 'fill') {
      if (!q.speak || q.speak.trim() === '') {
        errors.push(`${loc}: 填空題缺少 speak 完整詞彙`);
      }
    } else if (q.type === 'voice') {
      if (!q.speak || q.speak.trim() === '') {
        errors.push(`${loc}: 口說題缺少 speak 辨識詞彙`);
      }
      if (/[^\w\s']/.test(q.ans)) {
        errors.push(`${loc}: 口說題答案包含非法標點 -> ${q.ans}`);
      }
    }
  }
}

console.log(`審查完成！共審核 ${totalCount} 道題目。`);
console.log(`發現重大錯誤: ${errors.length} 項`);
console.log(`發現潛在警告: ${warnings.length} 項`);

if (errors.length > 0) {
  console.log('錯誤範例 (前 10 項):');
  errors.slice(0, 10).forEach(e => console.log('  ❌', e));
  process.exit(1);
} else {
  console.log('✅ 全題庫深層審查 100% 通過！結構、答案、長度、首字母、選項去重與解析皆完美無暇！');
}
