import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
// @ts-expect-error 獨立Node報告模組
import { evaluateBalanceRun } from './balance-report.mjs';

// 9 組情境配置：三種養成 × 三種正確率
const GROWTHS = ['bare', 'normal', 'high'] as const;
const PROFILES = [
  { id: 'average', label: '82% (一般玩家)', rate: 0.82 },
  { id: 'good', label: '90% (良好玩家)', rate: 0.90 },
  { id: 'strong', label: '96% (精通玩家)', rate: 0.96 },
];

console.log('================================================================');
console.log('開始執行全盤戰鬥平衡模擬：3種養成 × 3種正確率 (9組矩陣)');
console.log('================================================================\n');

const results: Record<string, Record<string, ReturnType<typeof evaluateBalanceRun>>> = {};
let failed = false;
let unassessed = false;

for (const growth of GROWTHS) {
  results[growth] = {};
  for (const prof of PROFILES) {
    console.log(`>>> 正在模擬 [${prof.label} × ${growth}]...`);
    const env = {
      ...process.env,
      PROFILE: prof.id,
      GROWTH: growth,
      REGIONS: '0,4,8',
      MAPS: '6',
      FINALS: '12',
    };
    const res = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/realsim2.mts'], { env, encoding: 'utf8' });
    const evaluation = evaluateBalanceRun(res, growth, prof.id);
    results[growth][prof.id] = evaluation;
    if (evaluation.passed === null) unassessed = true;
    if (evaluation.passed === false) {
      failed = true;
      console.error(evaluation.text, res.error ?? res.stderr);
    }
    const output = res.stdout ?? '';
    // 萃取關鍵結果顯示
    const lines = output.split('\n').filter(l => l.includes('normal 首過') || l.includes('[') && l.includes('/'));
    lines.forEach(l => console.log('   ', l));
    console.log('');
  }
}

// 產出驗收報告 Markdown
let report = `# 全盤戰鬥模擬驗收報告（TASKS 第四節）\n\n`;
report += `測試時間：${new Date().toISOString()}\n`;
report += `矩陣覆蓋：3種養成 (bare 裸裝 / normal 正常+3 / high 頂級+7) × 3種正確率 (82% / 90% / 96%)\n\n`;
report += `| 養成等級 | 正確率 | A1 一般關首過 | A1 終王首過 | B1+ 一般關首過 | B1+ 終王首過 | C2 一般關首過 | C2 終王首過 | 指標達成判斷 |\n`;
report += `|---|---|---|---|---|---|---|---|---|\n`;

for (const growth of GROWTHS) {
  for (const prof of PROFILES) {
    const evaluation = results[growth][prof.id];
    const [r0Norm, r0Final, r4Norm, r4Final, r8Norm, r8Final] = evaluation.metrics.map((n: number | null) => n === null ? '-' : `${n}%`);
    const evalText = evaluation.text;
    report += `| ${growth} | ${prof.label} | ${r0Norm} | ${r0Final} | ${r4Norm} | ${r4Final} | ${r8Norm} | ${r8Final} | ${evalText} |\n`;
  }
}

report += `\n本輪僅抽樣A1、B1+、C2，不是全九區驗收。主角/英雄同資源對照與大BOSS勝率未測，不作結論。\n`;

fs.writeFileSync('docs/FULL_BALANCE_SIMULATION_REPORT.md', report, 'utf8');
console.log('模擬報告已輸出至: docs/FULL_BALANCE_SIMULATION_REPORT.md');
process.exitCode = failed ? 1 : unassessed ? 2 : 0;
