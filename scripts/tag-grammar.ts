// 文法自動標籤：npx tsx scripts/tag-grammar.ts [--write] [--region 0]
// 只處理還沒有 grammar 欄位的題目，標上 grammarReview: "pending"；人工確認後把 pending 改成 approved（或 rejected）。
// 不加 --write 時只列出結果。
import fs from 'node:fs';
import path from 'node:path';
import { autoGrammarTags } from '../src/game/grammar';
import type { Question } from '../src/game/types';

const args = process.argv.slice(2);
const write = args.includes('--write');
const regionArg = args.indexOf('--region');
const regions = regionArg >= 0 ? [Number(args[regionArg + 1])] : [0, 1, 2, 3, 4, 5, 6, 7, 8];
const dir = path.resolve(import.meta.dirname, '../src/game/questions/bank');

for (const r of regions) {
  const file = path.join(dir, `r${r}.json`);
  if (!fs.existsSync(file)) continue;
  const bank = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, Question[]>;
  let tagged = 0;
  const counts: Record<string, number> = {};
  for (const list of Object.values(bank)) {
    for (const q of list) {
      if (q.grammar) { if (q.grammarReview !== 'rejected') q.grammar.forEach((g, i) => { if (i === 0) counts[g] = (counts[g] ?? 0) + 1; }); continue; }
      const tags = autoGrammarTags(q);
      if (!tags.length) continue;
      tagged++;
      counts[tags[0]] = (counts[tags[0]] ?? 0) + 1;
      console.log(`r${r} [${tags.join(', ')}] ${q.desc.replace(/\n/g, ' ').slice(0, 80)} => ${q.options?.['ABCD'.indexOf(q.ans)]}`);
      if (write) { q.grammar = tags; q.grammarReview = 'pending'; }
    }
  }
  console.log(`r${r}：新標 ${tagged} 題；主要考點題數 ${JSON.stringify(counts)}`);
  if (write && tagged) fs.writeFileSync(file, `${JSON.stringify(bank, null, 2)}\n`);
}
