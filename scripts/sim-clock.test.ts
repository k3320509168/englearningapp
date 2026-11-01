import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
import { advanceAnswerTime } from './sim-clock';

it('長作答期間每滿一條可多次出手，不丟整段時間的行動', () => {
  let elapsed = 0, attacks = 0, gauge = 0;
  const get = () => ({ phase: 'answering', questionSeq: 1, tick(ms: number) {
    elapsed += ms; gauge += ms / 1000;
    if (gauge >= 1) { attacks++; gauge = 0; }
  } });
  advanceAnswerTime(get, 3250);
  expect(elapsed).toBe(3250);
  expect(attacks).toBe(3);
  expect(gauge).toBeCloseTo(.25);
});

it('超時已換題或進入回饋後不把舊題剩餘時間灌給新題', () => {
  for (const change of ['phase', 'questionSeq'] as const) {
    let elapsed = 0;
    const state = { phase: 'answering', questionSeq: 1, tick(ms: number) {
      elapsed += ms;
      if (elapsed >= 100) { if (change === 'phase') state.phase = 'feedback'; else state.questionSeq++; }
    } };
    advanceAnswerTime(() => state, 5000);
    expect(elapsed).toBe(100);
  }
});

it('CLI零樣本顯示未測而不是NaN或假通過率', () => {
  const text = execFileSync(process.execPath, ['--import', 'tsx', fileURLToPath(new URL('./realsim2.mts', import.meta.url))], {
    env: { ...process.env, GROWTH: 'bare', REGIONS: '0', MAPS: '0', FINALS: '0' }, encoding: 'utf8',
  });
  expect(text).toContain('沒有可測樣本');
  expect(text).not.toMatch(/NaN|Infinity|首過100%/);
});

it('同一SEED的獨立CLI戰鬥重跑一致（含抽題/選項洗牌）', () => {
  const run = () => execFileSync(process.execPath, ['--import', 'tsx', fileURLToPath(new URL('./realsim2.mts', import.meta.url))], {
    env: { ...process.env, GROWTH: 'bare', PROFILE: 'average', REGIONS: '0', MAPS: '1', FINALS: '1', SEED: '17' }, encoding: 'utf8',
  });
  expect(run()).toBe(run());
}, 20000);

it('budget同種子連續路徑及經濟快照可重現', () => {
  const folder = mkdtempSync(join(tmpdir(), 'enggame-budget-test-'));
  const file = join(folder, 'budget.json');
  try {
    const run = () => {
      const output = execFileSync(process.execPath, ['--import', 'tsx', fileURLToPath(new URL('./realsim2.mts', import.meta.url))], {
        env: { ...process.env, GROWTH: 'budget', PROFILE: 'average', REGIONS: '0', MAPS: '1', FINALS: '1', SEED: '17', BUDGET_OUT: file }, encoding: 'utf8',
      });
      return { output, report: readFileSync(file, 'utf8') };
    };
    expect(run()).toEqual(run());
  } finally { rmSync(folder, { recursive: true, force: true }); }
}, 30000);

it('每圖技能次數不混入額外區域魔王樣本', () => {
  const run = (finals: string) => execFileSync(process.execPath, ['--import', 'tsx', fileURLToPath(new URL('./realsim2.mts', import.meta.url))], {
    env: { ...process.env, GROWTH: 'bare', PROFILE: 'average', REGIONS: '0', MAPS: '1', FINALS: finals, SEED: '17' }, encoding: 'utf8',
  }).match(/技能(\d+)／圖/)?.[1];
  const mapsOnly = run('0');
  expect(mapsOnly).toBeDefined();
  expect(run('1')).toBe(mapsOnly);
}, 20000);


it('停用模擬的localStorage序列化不改變戰鬥或資源路徑', () => {
  const folder = mkdtempSync(join(tmpdir(), 'enggame-persistence-test-'));
  const file = join(folder, 'budget.json');
  try {
    const run = (persist: string) => {
      const output = execFileSync(process.execPath, ['--import', 'tsx', fileURLToPath(new URL('./realsim2.mts', import.meta.url))], {
        env: { ...process.env, GROWTH: 'budget', PROFILE: 'good', ROUTE: 'fast', REGIONS: '0', MAPS: '0', FINALS: '0', SEED: '7', BUDGET_OUT: file, SIM_PERSIST: persist }, encoding: 'utf8',
      });
      return { output, report: readFileSync(file, 'utf8') };
    };
    expect(run('0')).toEqual(run('1'));
  } finally { rmSync(folder, { recursive: true, force: true }); }
}, 30000);
