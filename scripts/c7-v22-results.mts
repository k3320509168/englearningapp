import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { gzipSync, gunzipSync } from 'node:zlib';
import { masteryReady } from '../src/game/mapMastery';
const dir = 'docs/gpt/c7-v22-budget-results';
const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'input-manifest.json'), 'utf8'));
const hash = (b: Buffer) => createHash('sha256').update(b).digest('hex');
for (const [file, expected] of Object.entries(manifest.files)) {
  if (hash(fs.readFileSync(file)) !== expected) throw new Error(`Simulation input changed: ${file}`);
}
if (manifest.cases.length !== 12 || manifest.cases.some((c: { exit: number }) => c.exit)) throw new Error('12 paths have not completed successfully');
const mcRuns = JSON.parse(fs.readFileSync(path.join(dir, 'mc-runs.json'), 'utf8'));
if (mcRuns.length !== 4 || mcRuns.some((c: { exit: number }) => c.exit)) throw new Error('4 MC runs have not completed successfully');
let assertions = 0;
const check = (ok: boolean, label: string) => { assertions++; if (!ok) throw new Error(label); };
const totalXp = (level: number, xp: number) => (level - 1) * (100 + 5 * level) + xp;
const results: unknown[] = [];
const readRun = (name: string) => {
  const file = path.join(dir, `${name}.json`);
  return JSON.parse(fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : gunzipSync(fs.readFileSync(`${file}.gz`)).toString());
};
const rec = [20, 40, 60, 80, 100, 120, 145, 170, 200];
for (const c of manifest.cases) {
  const x = readRun(c.name);
  const finals = rec.map((recommended, r) => {
    const rows = x.path.filter((p: any) => p.region === r && !p.checkpoint);
    const p = rows.at(-1);
    if (!p) throw new Error(`${c.name}: missing final entry ${r}`);
    return { region: r, recommended, level: p.playerLevel, xp: p.playerXp, delta: p.playerLevel - recommended,
      xpMissingToFloor: x.route === 'mastery' ? null : Math.max(0, totalXp(recommended - (x.route === 'normal' ? 6 : 12), 0) - totalXp(p.playerLevel, p.playerXp)) };
  });
  const maps = x.path.filter((p: any) => p.checkpoint === 'afterMap');
  const floor = x.route === 'normal' ? -6 : -12;
  let consecutive = 0, longest = 0;
  for (const p of maps) { consecutive = p.delta < floor ? consecutive + 1 : 0; longest = Math.max(longest, consecutive); }
  const bossPass = finals.every(p => x.route === 'mastery' ? p.delta <= 15 : p.delta >= floor);
  const mapPass = x.route === 'mastery' ? maps.every((p: any) => p.delta <= 15) : longest < 3;
  let day = '', previousAllowance = 0;
  const dayGold: Record<string, number> = {};
  for (const p of x.path) {
    if (p.date) day = p.date.slice(0, 10);
    const led = p.xpLedger as Record<string, number>;
    const sum = (prefix: string) => Object.entries(led).filter(([k]) => k.startsWith(prefix)).reduce((a, [,v]) => a + v, 0);
    check(sum('accepted:') === totalXp(p.playerLevel, p.playerXp) - 500, `${c.name}: XP total`);
    for (const key of Object.keys(led).filter(k => k.startsWith('offered:'))) {
      const src = key.slice(8);
      const n = (prefix: string) => led[`${prefix}:${src}`] ?? 0;
      check(n('offered') + n('bonus') === n('accepted') + n('deducted') + n('overflow'), `${c.name}: source ${src}`);
    }
    check(Object.entries(p.ledger).filter(([k]) => k.endsWith('Gold')).reduce((a, [,v]) => a + Number(v), 0) === p.gold, `${c.name}: gold`);
    const paid = sum('allowanceGold:');
    check(paid >= previousAllowance, `${c.name}: allowance monotonic`);
    dayGold[day] = (dayGold[day] ?? 0) + paid - previousAllowance;
    check(dayGold[day] <= 150 + 50 * p.region, `${c.name}: daily allowance cap`);
    previousAllowance = paid;
    if (p.playerLevel === 200) check(p.playerXp === 0, `${c.name}: max level bank`);
  }
  results.push({ name: c.name, profile: x.profile, route: x.route, completeMaps: x.completedMaps, stopped: x.stopped,
    pass: bossPass && mapPass, bossPass, mapPass, longestMapsBelowFloor: longest, finalLevel: x.final.playerLevel,
    beforeBoss: finals, minMapDelta: Math.min(...maps.map((p: any) => p.delta)), maxMapDelta: Math.max(...maps.map((p: any) => p.delta)),
    masteredMaps: maps.filter((p: any) => masteryReady(p.region, p.mastery)).length, reviewDays: x.reviewDays,
    submitted: x.pathMetrics.answers, modelMs: x.pathMetrics.ms, sideSubmitted: x.pathMetrics.sideAnswers ?? 0,
    sideCorrect: x.pathMetrics.sideCorrect ?? 0, sideModelMs: x.pathMetrics.sideMs ?? 0,
    sideRuns: x.sideModes.length, xpLedger: x.xpLedger });
}
const mc = mcRuns.map((c: { name: string }) => {
  const text = fs.readFileSync(path.join(dir, `${c.name}.txt`), 'utf8');
  let region = -1; const rows: unknown[] = [];
  for (const line of text.split('\n')) {
    const header = line.match(/\] r(\d+)/); if (header) region = Number(header[1]);
    for (const part of line.split('|')) {
      const m = part.match(/(normal|elite|gate|boss|final) 首過(\d+)% 平均([\d.]+)次 ≤3次(\d+)%\(n=(\d+)\)/);
      if (m) rows.push({ region, kind: m[1], firstPercentRounded: Number(m[2]), meanTriesRounded: Number(m[3]), within3PercentRounded: Number(m[4]), n: Number(m[5]) });
    }
  }
  return { name: c.name, results: rows };
});
const summary = { spec: 'C7-v2.2', sourceCommit: manifest.commit, assertions, acceptance: '終王開戰前；地圖為每圖完成含自選複習後，跨區連續計算', results, mc };
fs.writeFileSync(path.join(dir, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
// 原始JSON以gzip保存，解開內容不改；輸入與產物hash可供重驗。
const artifacts: Record<string,string> = {};
for (const file of fs.readdirSync(dir).filter(f => /-seed7\.json$/.test(f))) {
  const bytes = fs.readFileSync(path.join(dir, file));
  const packed = gzipSync(bytes);
  fs.writeFileSync(path.join(dir, `${file}.gz`), packed);
  artifacts[`${file}.gz`] = hash(packed);
  fs.unlinkSync(path.join(dir, file));
}
for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.json.gz'))) artifacts[file] = hash(fs.readFileSync(path.join(dir, file)));
fs.writeFileSync(path.join(dir, 'artifacts.json'), JSON.stringify(artifacts, null, 2) + '\n');
console.log(JSON.stringify({ paths: results.length, mc: mc.length, assertions, passed: results.filter((r: any) => r.pass).length }));
