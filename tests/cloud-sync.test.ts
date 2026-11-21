// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';

const mock = vi.hoisted(() => ({
  upsert: vi.fn(), fetch: vi.fn(),
  listener: null as ((event: AuthChangeEvent, session: Session | null) => void) | null,
}));
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({
  from: () => ({ upsert: mock.upsert, select: () => ({ eq: () => ({ maybeSingle: mock.fetch }) }) }),
  auth: { onAuthStateChange: (cb: typeof mock.listener) => { mock.listener = cb; } },
}) }));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((ok, fail) => { resolve = ok; reject = fail; });
  return { promise, resolve, reject };
}
const user = { id: 'test-player' } as User;
async function setup() {
  const cloud = await import('../src/cloud/cloudSave');
  const { useSaveStore, initialSave } = await import('../src/store/saveStore');
  useSaveStore.setState({ ...structuredClone(initialSave), gold: 100 });
  localStorage.setItem('english-rpg-cloud', JSON.stringify({ userId: user.id, syncedAt: 'old', dirty: true }));
  cloud.initCloud();
  cloud.useCloudStore.setState({ user, status: 'idle' });
  return { ...cloud, useSaveStore };
}
beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers();
  localStorage.clear();
  // Dummy configuration; createClient is mocked, no real credentials or network.
  vi.stubEnv('VITE_SUPABASE_URL', 'https://test.invalid');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-only-placeholder');
  mock.upsert.mockReset().mockResolvedValue({ error: null });
  mock.fetch.mockReset().mockResolvedValue({ data: null, error: null });
  mock.listener = null;
});
afterEach(() => { vi.restoreAllMocks(); vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllEnvs(); });

it('上傳等待期間新增本地進度，保留 dirty 並自動補傳最新快照', async () => {
  const c = await setup();
  const wait = deferred<{ error: null }>();
  mock.upsert.mockReturnValueOnce(wait.promise);
  const upload = c.uploadNow();
  c.useSaveStore.setState({ gold: 150 });
  wait.resolve({ error: null });
  await upload;
  expect(JSON.parse(localStorage.getItem('english-rpg-cloud')!).dirty).toBe(true);
  await vi.advanceTimersByTimeAsync(5000);
  expect(mock.upsert).toHaveBeenCalledTimes(2);
  expect(mock.upsert.mock.calls[0][0].data.state.gold).toBe(100);
  expect(mock.upsert.mock.calls[1][0].data.state.gold).toBe(150);
  expect(JSON.parse(localStorage.getItem('english-rpg-cloud')!).dirty).toBe(false);
});

it('同時按同步不重疊上傳，後續自動補傳仍採最新存檔', async () => {
  const c = await setup();
  const wait = deferred<{ error: null }>();
  mock.upsert.mockReturnValueOnce(wait.promise);
  const first = c.uploadNow();
  c.useSaveStore.setState({ gold: 180 });
  const second = c.uploadNow();
  expect(mock.upsert).toHaveBeenCalledTimes(1);
  wait.resolve({ error: null });
  await Promise.all([first, second]);
  await vi.advanceTimersByTimeAsync(5000);
  expect(mock.upsert).toHaveBeenCalledTimes(2);
  expect(mock.upsert.mock.calls[1][0].data.state.gold).toBe(180);
});

it.each(['rejection', 'response'])('上傳 %s 失敗保留本地進度，手動重試可恢復', async kind => {
  const c = await setup();
  if (kind === 'rejection') mock.upsert.mockRejectedValueOnce(new Error('offline'));
  else mock.upsert.mockResolvedValueOnce({ error: { message: 'offline' } });
  await c.uploadNow();
  expect(c.useCloudStore.getState()).toMatchObject({ status: 'error', error: 'offline' });
  expect(c.useSaveStore.getState().gold).toBe(100);
  expect(JSON.parse(localStorage.getItem('english-rpg-cloud')!)).toMatchObject({ dirty: true, syncedAt: 'old' });
  await c.uploadNow();
  expect(c.useCloudStore.getState().status).toBe('idle');
  expect(JSON.parse(localStorage.getItem('english-rpg-cloud')!).dirty).toBe(false);
});

it('上傳中登出，舊請求不能把介面改回已同步或寫入新 metadata', async () => {
  const c = await setup();
  const wait = deferred<{ error: null }>();
  mock.upsert.mockReturnValueOnce(wait.promise);
  const upload = c.uploadNow();
  mock.listener!('SIGNED_OUT', null);
  wait.resolve({ error: null });
  await upload;
  expect(c.useCloudStore.getState()).toMatchObject({ status: 'signedOut', user: null, lastSync: null });
  expect(JSON.parse(localStorage.getItem('english-rpg-cloud')!).syncedAt).toBe('old');
  await vi.advanceTimersByTimeAsync(5000);
  expect(mock.upsert).toHaveBeenCalledTimes(1);
});

it('切換帳號完成同步後，舊帳號的上傳回覆不污染新帳號', async () => {
  const c = await setup();
  const wait = deferred<{ error: null }>();
  mock.upsert.mockReturnValueOnce(wait.promise);
  const oldUpload = c.uploadNow();
  mock.listener!('SIGNED_OUT', null);
  const other = { id: 'other-player' } as User;
  mock.listener!('SIGNED_IN', { user: other } as Session);
  await vi.advanceTimersByTimeAsync(0);
  expect(mock.upsert).toHaveBeenCalledTimes(2);
  expect(JSON.parse(localStorage.getItem('english-rpg-cloud')!).userId).toBe(other.id);
  wait.resolve({ error: null });
  await oldUpload;
  expect(c.useCloudStore.getState().user?.id).toBe(other.id);
  expect(JSON.parse(localStorage.getItem('english-rpg-cloud')!).userId).toBe(other.id);
});

it('登入下載尚未完成就登出，不得套用遲到的雲端進度', async () => {
  const c = await setup();
  mock.listener!('SIGNED_OUT', null);
  const wait = deferred<{ data: unknown; error: null }>();
  mock.fetch.mockReturnValueOnce(wait.promise);
  mock.listener!('SIGNED_IN', { user } as Session);
  mock.listener!('SIGNED_OUT', null);
  wait.resolve({ data: { data: { state: { gold: 999 }, version: 26 }, updated_at: 'new' }, error: null });
  await vi.advanceTimersByTimeAsync(0);
  expect(c.useSaveStore.getState().gold).toBe(100);
  expect(c.useCloudStore.getState().status).toBe('signedOut');
  expect(mock.upsert).not.toHaveBeenCalled();
});

it.each(['local', 'cloud'] as const)('兩邊都有進度須先等選擇，保留 %s 才執行對應動作', async keep => {
  const c = await setup();
  const { DEFAULT_CHARACTER } = await import('../src/game/character');
  const { initialSave, SAVE_VERSION } = await import('../src/store/saveStore');
  c.useSaveStore.setState({ character: { ...DEFAULT_CHARACTER, name: '本地' }, gold: 100 });
  mock.listener!('SIGNED_OUT', null);
  mock.fetch.mockResolvedValueOnce({ data: {
    data: { state: { ...structuredClone(initialSave), character: { ...DEFAULT_CHARACTER, name: '雲端' }, gold: 900 }, version: SAVE_VERSION },
    updated_at: '2026-11-22T00:00:00Z',
  }, error: null });
  mock.listener!('SIGNED_IN', { user } as Session);
  await vi.advanceTimersByTimeAsync(0);
  expect(c.useCloudStore.getState().status).toBe('conflict');
  expect(c.useSaveStore.getState().gold).toBe(100);
  await c.uploadNow();
  expect(mock.upsert).not.toHaveBeenCalled();
  await c.resolveConflict(keep);
  expect(c.useCloudStore.getState()).toMatchObject({ status: 'idle', conflict: null });
  expect(c.useSaveStore.getState().gold).toBe(keep === 'local' ? 100 : 900);
  expect(mock.upsert).toHaveBeenCalledTimes(keep === 'local' ? 1 : 0);
});

it.each(['array', 'future', 'missing'] as const)('雲端快照 %s 無效時不覆寫本地存檔', async kind => {
  const c = await setup();
  const { SAVE_VERSION } = await import('../src/store/saveStore');
  const before = localStorage.getItem(c.SAVE_KEY);
  const data = kind === 'array' ? { state: [], version: SAVE_VERSION }
    : kind === 'future' ? { state: { gold: 999 }, version: SAVE_VERSION + 1 }
    : { version: SAVE_VERSION };
  await c.applyCloud({ data, updatedAt: 'new' } as Parameters<typeof c.applyCloud>[0]);
  expect(localStorage.getItem(c.SAVE_KEY)).toBe(before);
  expect(c.useSaveStore.getState().gold).toBe(100);
  expect(c.useCloudStore.getState().status).toBe('error');
  expect(mock.upsert).not.toHaveBeenCalled();
});

it('下載的舊日期存檔換日後保留 dirty 並補傳每日進度', async () => {
  const c = await setup();
  vi.setSystemTime(new Date(2026, 10, 23, 9));
  const { initialSave, SAVE_VERSION } = await import('../src/store/saveStore');
  await c.applyCloud({ data: { state: structuredClone(initialSave), version: SAVE_VERSION }, updatedAt: 'old-cloud' });
  expect(c.useSaveStore.getState().daily?.date).toBe('2026-11-23');
  expect(JSON.parse(localStorage.getItem('english-rpg-cloud')!).dirty).toBe(true);
  await vi.advanceTimersByTimeAsync(5000);
  expect(mock.upsert).toHaveBeenCalledTimes(1);
  expect(mock.upsert.mock.calls[0][0].data.state.daily.date).toBe('2026-11-23');
});

it('套用存檔等待完成時登出，完成回呼不能恢復舊帳號同步狀態', async () => {
  const c = await setup();
  const { initialSave, SAVE_VERSION } = await import('../src/store/saveStore');
  const wait = deferred<void>();
  vi.spyOn(c.useSaveStore.persist, 'rehydrate').mockReturnValueOnce(wait.promise);
  const applying = c.applyCloud({ data: { state: structuredClone(initialSave), version: SAVE_VERSION }, updatedAt: 'late' });
  mock.listener!('SIGNED_OUT', null);
  wait.resolve();
  await applying;
  expect(c.useCloudStore.getState()).toMatchObject({ status: 'signedOut', user: null, lastSync: null });
  expect(JSON.parse(localStorage.getItem('english-rpg-cloud')!).syncedAt).toBe('old');
});

it('本地與雲端皆無存檔的登入不會卡在同步中，後續進度可自動上傳', async () => {
  const c = await setup();
  mock.listener!('SIGNED_OUT', null);
  localStorage.removeItem(c.SAVE_KEY);
  mock.listener!('SIGNED_IN', { user } as Session);
  await vi.advanceTimersByTimeAsync(0);
  expect(c.useCloudStore.getState().status).toBe('idle');
  c.useSaveStore.setState({ gold: 180 });
  await vi.advanceTimersByTimeAsync(5000);
  expect(mock.upsert).toHaveBeenCalledTimes(1);
  expect(mock.upsert.mock.calls[0][0].data.state.gold).toBe(180);
});
