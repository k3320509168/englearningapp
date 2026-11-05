// 只讀模擬輸出中的相應區塊，不能借用下一區的成績。
export function parseBalanceMetrics(raw) {
  const metrics = [];
  for (const region of [0, 4, 8]) {
    const block = raw.match(new RegExp(`(?:^|\\n)\\[[^\\n]+\\] r${region}\\b[^]*?(?=\\n\\[[^\\n]+\\] r\\d+\\b|$)`))?.[0] ?? '';
    for (const kind of ['normal', 'final']) {
      const value = block.match(new RegExp(`${kind} 首過(\\d+(?:\\.\\d+)?)%`));
      metrics.push(value ? Number(value[1]) : null);
    }
  }
  return metrics;
}
export function evaluateBalanceRun(result, growth, profile) {
  if (result.error || result.status !== 0) return { metrics: Array(6).fill(null), text: '❌ 執行失敗', passed: false };
  const metrics = parseBalanceMetrics(result.stdout ?? '');
  if (metrics.some(n => n === null)) return { metrics, text: '❌ 成績缺漏', passed: false };
  if (growth === 'bare' && profile === 'good') {
    const passed = metrics.every((n, i) => n >= (i % 2 ? 75 : 98));
    return { metrics, text: passed ? '✅ 裸裝一般關≥98%、終王≥75%' : '❌ 裸裝門檻未達', passed };
  }
  // 本腳本未模擬每張地圖的大BOSS，不能把終王數字當大BOSS驗收。
  return { metrics, text: '已產生成績；未設驗收門檻', passed: null };
}
