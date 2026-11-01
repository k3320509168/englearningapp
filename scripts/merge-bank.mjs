// 三方合併題庫 JSON（衝突時用）：在合併進行中執行 node scripts/merge-bank.mjs <題庫檔> <merge-base>；逐題（type|desc|speak）合併後寫回
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const file = process.argv[2];
const show = ref => { try { return JSON.parse(execSync(`git show ${ref}:${file}`, { maxBuffer: 1 << 30 }).toString()); } catch { return null; } };
const oursRef = process.argv[4] || 'HEAD';
const theirsRef = process.argv[5] || 'MERGE_HEAD';
const base = show(process.argv[3]), ours = show(oursRef), theirs = show(theirsRef);
const qkey = q => `${q.type}|${q.desc}|${q.speak ?? ''}`;
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
let both = 0;
function pick(b, o, t) {
  if (o === undefined) return t; if (t === undefined) return o;
  if (same(o, t)) return o;
  if (b !== undefined && same(o, b)) return t;
  if (b !== undefined && same(t, b)) return o;
  both++; return o; // 兩邊都改：保留我們（Codex 已審修）
}
function mergeArr(b = [], o = [], t = []) {
  const bm = new Map(b.map(q => [qkey(q), q])), tm = new Map(t.map(q => [qkey(q), q]));
  const om = new Map(o.map(q => [qkey(q), q]));
  const out = [];
  for (const q of o) { const k = qkey(q); if (bm.has(k) && !tm.has(k) && same(q, bm.get(k))) continue; out.push(pick(bm.get(k), q, tm.get(k))); }
  for (const q of t) { const k = qkey(q); if (om.has(k)) continue; if (bm.has(k)) continue; out.push(q); }
  return out;
}
let result;
if (Array.isArray(ours ?? theirs)) result = mergeArr(base ?? [], ours ?? [], theirs ?? []);
else if (file.includes('vocab')) {
  result = { ...(theirs ?? {}) };
  for (const [k, v] of Object.entries(ours ?? {})) result[k] = pick(base?.[k], v, theirs?.[k]);
} else {
  result = {};
  for (const sec of new Set([...Object.keys(ours ?? {}), ...Object.keys(theirs ?? {})])) result[sec] = mergeArr(base?.[sec], ours?.[sec], theirs?.[sec]);
}
writeFileSync(file, JSON.stringify(result, null, 2) + '\n');
const count = x => Array.isArray(x) ? x.length : Object.values(x).reduce((s, a) => s + (Array.isArray(a) ? a.length : 1), 0);
console.log(file, 'ours', ours ? count(ours) : 0, 'theirs', theirs ? count(theirs) : 0, '→', count(result), '兩邊都改', both);
