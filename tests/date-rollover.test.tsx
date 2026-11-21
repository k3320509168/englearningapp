// @vitest-environment jsdom
import React, { act, StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useDailyRefresh } from '../src/components/useDailyRefresh';
import DailyModal from '../src/components/DailyModal';
import LoginRewardModal from '../src/components/LoginRewardModal';
import { initialSave, useSaveStore } from '../src/store/saveStore';
import { pickDaily, refreshWeekly } from '../src/game/daily';

let root: Root;
function OpenGame({ screen = 'login' }: { screen?: 'login' | 'daily' }) {
  useDailyRefresh();
  return screen === 'daily' ? <DailyModal /> : <LoginRewardModal />;
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 10, 22, 23, 59, 40));
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  document.body.innerHTML = '<div id="root"></div>';
  root = createRoot(document.getElementById('root')!);
  useSaveStore.setState({ ...structuredClone(initialSave),
    settings: { ...initialSave.settings, musicVolume: 0, sfxVolume: 0, volume: 0 },
    daily: { date: '2026-11-21', streak: 1, tasks: pickDaily('2026-11-21') },
    weekly: refreshWeekly(null, '2026-11-22'),
  });
});
afterEach(async () => {
  await act(async () => root.unmount());
  vi.restoreAllMocks();
  vi.useRealTimers();
});

it('畫面保持開啟跨週一午夜，簽到天數和週任務更新且獎勵只領一次', async () => {
  await act(async () => root.render(<StrictMode><OpenGame /></StrictMode>));
  expect(document.querySelector('.streak-hero-title')?.textContent).toContain('2');
  await act(async () => vi.advanceTimersByTime(60_000));
  expect(useSaveStore.getState().daily?.date).toBe('2026-11-23');
  expect(document.querySelector('.streak-hero-title')?.textContent).toContain('3');
  expect(document.querySelector('.is-today')?.textContent).toContain('第 3 天');
  expect(useSaveStore.getState().weekly?.week).toBe('2026-11-23');
  expect(useSaveStore.getState().weekly?.tasks.find(t => t.id === 'w_days5')?.progress).toBe(1);
  const before = useSaveStore.getState().gold;
  const claim = [...document.querySelectorAll<HTMLButtonElement>('.milestone-btn')].find(b => !b.disabled)!;
  expect(claim).toBeTruthy();
  await act(async () => claim.click());
  expect(useSaveStore.getState().gold).toBe(before + 100);
  expect(useSaveStore.getState().claimStreak(3)).toBe(false);
  await act(async () => vi.advanceTimersByTime(120_000));
  expect(useSaveStore.getState().gold).toBe(before + 100);
  expect(useSaveStore.getState().weekly?.tasks.find(t => t.id === 'w_days5')?.progress).toBe(1);
});

it.each(['focus', 'visibilitychange'])('背景停留多日後由 %s 刷新，重複事件不多算登入', async event => {
  await act(async () => root.render(<OpenGame screen="daily" />));
  vi.setSystemTime(new Date(2026, 10, 25, 9));
  const target = event === 'focus' ? window : document;
  await act(async () => target.dispatchEvent(new Event(event)));
  expect(useSaveStore.getState().daily?.date).toBe('2026-11-25');
  expect(useSaveStore.getState().daily?.streak).toBe(1);
  expect(document.body.textContent).toContain('2026-11-23 起');
  expect(useSaveStore.getState().weekly?.tasks.find(t => t.id === 'w_days5')?.progress).toBe(1);
  await act(async () => { target.dispatchEvent(new Event(event)); target.dispatchEvent(new Event(event)); });
  expect(useSaveStore.getState().weekly?.tasks.find(t => t.id === 'w_days5')?.progress).toBe(1);
});

it('碎片題完成標記會隨午夜刷新，舊日狀態不會鎖住新一天', async () => {
  useSaveStore.setState({ shardQuizDay: new Date().toDateString() });
  await act(async () => root.render(<OpenGame screen="daily" />));
  expect(document.querySelector('.shard-quiz-btn')?.textContent).toContain('今天已完成');
  await act(async () => vi.advanceTimersByTime(60_000));
  expect(document.querySelector('.shard-quiz-btn')?.textContent).not.toContain('今天已完成');
});

it('卸載後清掉計時器與前景事件，不再改動存檔', async () => {
  await act(async () => root.render(<StrictMode><OpenGame /></StrictMode>));
  await act(async () => root.render(null));
  const savedDay = useSaveStore.getState().daily?.date;
  vi.setSystemTime(new Date(2026, 10, 23, 9));
  await act(async () => {
    window.dispatchEvent(new Event('focus'));
    document.dispatchEvent(new Event('visibilitychange'));
    vi.advanceTimersByTime(120_000);
  });
  expect(useSaveStore.getState().daily?.date).toBe(savedDay);
});
