import { expect, it } from 'vitest';
import { evaluateBalanceRun, parseBalanceMetrics } from './balance-report.mjs';
const stdout = [0, 4, 8].map(r => `[good/bare/base] r${r}\n  normal 首過100% 平均1次 | boss 首過90% | final 首過80% 平均1次`).join('\n');
it('非零退出與spawn錯誤不能產生達標', () => {
  expect(evaluateBalanceRun({ status: 1, stdout }, 'bare', 'good').passed).toBe(false);
  expect(evaluateBalanceRun({ status: null, error: Error('spawn') }, 'bare', 'good').passed).toBe(false);
});
it('解析只限各區段，不向後借另一區成績', () => {
  expect(parseBalanceMetrics(stdout)).toEqual([100, 80, 100, 80, 100, 80]);
  const missing = stdout.replace('normal 首過100%', 'normal 未測');
  expect(parseBalanceMetrics(missing)[0]).toBe(null);
  expect(evaluateBalanceRun({ status: 0, stdout: missing }, 'bare', 'good').passed).toBe(false);
});
it('依實際門檻而非硬編綠勾；未指定門檻不假裝驗收', () => {
  expect(evaluateBalanceRun({ status: 0, stdout }, 'bare', 'good').passed).toBe(true);
  expect(evaluateBalanceRun({ status: 0, stdout: stdout.replaceAll('80%', '70%') }, 'bare', 'good').passed).toBe(false);
  expect(evaluateBalanceRun({ status: 0, stdout }, 'normal', 'average').passed).toBe(null);
});
