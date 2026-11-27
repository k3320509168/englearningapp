// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { DEFAULT_CHARACTER } from '../src/game/character';

const mock = vi.hoisted(() => ({
  write: vi.fn(), fetch: vi.fn(),
  listener: null as ((event: AuthChangeEvent, session: Session | null) => void) | null,
}));
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({
  from: () => {
    const operation = (kind: 'insert' | 'update', payload: Record<string, unknown>) => {
      const filters: Record<string, unknown> = {};
      const query = {
        eq: (key: string, value: unknown) => { filters[key] = value; return query; },
        select: () => query,
        maybeSingle: async () => {
          const result = await mock.write(payload, { kind, filters });
          return Object.hasOwn(result, 'data') ? result : {
            ...result, data: result.error ? null : { data: payload.data, updated_at: payload.updated_at },
          };
        },
      };
      return query;
    };
    return {
      insert: (payload: Record<string, unknown>) => operation('insert', payload),
      update: (payload: Record<string, unknown>) => operation('update', payload),
      select: () => ({ eq: () => ({ maybeSingle: mock.fetch }) }),
    };
  },
  auth: { onAuthStateChange: (cb: typeof mock.listener) => { mock.listener = cb; } },
}) }));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((ok, fail) => { resolve = ok; reject = fail; });
  return { promise, resolve, reject };
}
const user = { id: 'test-player' } as User;
async function setup(revision: string | null = 'old') {
  const cloud = await import('../src/cloud/cloudSave');
  const { useSaveStore, initialSave } = await import('../src/store/saveStore');
  useSaveStore.setState({ ...structuredClone(initialSave), character: DEFAULT_CHARACTER, gold: 100 });
  if (revision !== null) localStorage.setItem('english-rpg-cloud', JSON.stringify({ userId: user.id, syncedAt: revision, dirty: true }));
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
  mock.write.mockReset().mockResolvedValue({ error: null });
  mock.fetch.mockReset().mockResolvedValue({ data: null, error: null });
  mock.listener = null;
});
afterEach(() => { vi.restoreAllMocks(); vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllEnvs(); });

it('上傳等待期間新增本地進度，保留 dirty 並自動補傳最新快照', async () => {
  const c = await setup();
  const wait = deferred<{ error: null }>();
  mock.write.mockReturnValueOnce(wait.promise);
  const upload = c.uploadNow();
  c.useSaveStore.setState({ gold: 150 });
  wait.resolve({ error: null });
  await upload;
  expect(JSON.parse(localStorage.getItem('english-rpg-cloud')!).dirty).toBe(true);
  await vi.advanceTimersByTimeAsync(5000);
  expect(mock.write).toHaveBeenCalledTimes(2);
  expect(mock.write.mock.calls[0][0].data.state.gold).toBe(100);
  expect(mock.write.mock.calls[1][0].data.state.gold).toBe(150);
  expect(JSON.parse(localStorage.getItem('english-rpg-cloud')!).dirty).toBe(false);
});

it('同時按同步不重疊上傳，後續自動補傳仍採最新存檔', async () => {
  const c = await setup();
  const wait = deferred<{ error: null }>();
  mock.write.mockReturnValueOnce(wait.promise);
  const first = c.uploadNow();
  c.useSaveStore.setState({ gold: 180 });
  const second = c.uploadNow();
  expect(mock.write).toHaveBeenCalledTimes(1);
  wait.resolve({ error: null });
  await Promise.all([first, second]);
  await vi.advanceTimersByTimeAsync(5000);
  expect(mock.write).toHaveBeenCalledTimes(2);
  expect(mock.write.mock.calls[1][0].data.state.gold).toBe(180);
});

it.each(['rejection', 'response'])('上傳 %s 失敗保留本地進度，手動重試可恢復', async kind => {
  const c = await setup();
  if (kind === 'rejection') mock.write.mockRejectedValueOnce(new Error('offline'));
  else mock.write.mockResolvedValueOnce({ error: { message: 'offline' } });
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
  mock.write.mockReturnValueOnce(wait.promise);
  const upload = c.uploadNow();
  mock.listener!('SIGNED_OUT', null);
  wait.resolve({ error: null });
  await upload;
  expect(c.useCloudStore.getState()).toMatchObject({ status: 'signedOut', user: null, lastSync: null });
  expect(JSON.parse(localStorage.getItem('english-rpg-cloud')!).syncedAt).toBe('old');
  await vi.advanceTimersByTimeAsync(5000);
  expect(mock.write).toHaveBeenCalledTimes(1);
});

it('切換帳號完成同步後，舊帳號的上傳回覆不污染新帳號', async () => {
  const c = await setup();
  const wait = deferred<{ error: null }>();
  mock.write.mockReturnValueOnce(wait.promise);
  const oldUpload = c.uploadNow();
  mock.listener!('SIGNED_OUT', null);
  const other = { id: 'other-player' } as User;
  mock.listener!('SIGNED_IN', { user: other } as Session);
  await vi.advanceTimersByTimeAsync(0);
  expect(mock.write).toHaveBeenCalledTimes(2);
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
  expect(mock.write).not.toHaveBeenCalled();
});

it.each(['local', 'cloud'] as const)('兩邊都有進度須先等選擇，保留 %s 才執行對應動作', async keep => {
  const c = await setup();
  const { initialSave, SAVE_VERSION } = await import('../src/store/saveStore');
  c.useSaveStore.setState({ character: { ...DEFAULT_CHARACTER, name: '本地' }, gold: 100 });
  mock.listener!('SIGNED_OUT', null);
  mock.fetch.mockResolvedValue({ data: {
    data: { state: { ...structuredClone(initialSave), character: { ...DEFAULT_CHARACTER, name: '雲端' }, gold: 900 }, version: SAVE_VERSION },
    updated_at: '2026-11-22T00:00:00Z',
  }, error: null });
  mock.listener!('SIGNED_IN', { user } as Session);
  await vi.advanceTimersByTimeAsync(0);
  expect(c.useCloudStore.getState().status).toBe('conflict');
  expect(c.useSaveStore.getState().gold).toBe(100);
  await c.uploadNow();
  expect(mock.write).not.toHaveBeenCalled();
  await c.resolveConflict(keep);
  expect(c.useCloudStore.getState()).toMatchObject({ status: 'idle', conflict: null });
  expect(c.useSaveStore.getState().gold).toBe(keep === 'local' ? 100 : 900);
  expect(mock.write).toHaveBeenCalledTimes(keep === 'local' ? 1 : 0);
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
  expect(mock.write).not.toHaveBeenCalled();
});

it('下載的舊日期存檔換日後保留 dirty 並補傳每日進度', async () => {
  const c = await setup();
  vi.setSystemTime(new Date(2026, 10, 23, 9));
  const { initialSave, SAVE_VERSION } = await import('../src/store/saveStore');
  await c.applyCloud({ data: { state: { ...structuredClone(initialSave), character: DEFAULT_CHARACTER }, version: SAVE_VERSION }, updatedAt: 'old-cloud' });
  expect(c.useSaveStore.getState().daily?.date).toBe('2026-11-23');
  expect(JSON.parse(localStorage.getItem('english-rpg-cloud')!).dirty).toBe(true);
  await vi.advanceTimersByTimeAsync(5000);
  expect(mock.write).toHaveBeenCalledTimes(1);
  expect(mock.write.mock.calls[0][0].data.state.daily.date).toBe('2026-11-23');
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
  expect(mock.write).toHaveBeenCalledTimes(1);
  expect(mock.write.mock.calls[0][0].data.state.gold).toBe(180);
});

it('已寫入日常但尚未建角，手動與自動同步均不建立空白副本', async () => {
  const c = await setup();
  mock.listener!('SIGNED_OUT', null);
  c.useSaveStore.setState({ character: null, gold: 0 });
  c.useSaveStore.getState().ensureDaily();
  mock.listener!('SIGNED_IN', { user } as Session);
  await vi.advanceTimersByTimeAsync(0);
  await c.uploadNow();
  c.useSaveStore.setState(s => ({ settings: { ...s.settings, musicVolume: 0 } }));
  await vi.advanceTimersByTimeAsync(5000);
  expect(mock.write).not.toHaveBeenCalled();
  expect(c.useCloudStore.getState()).toMatchObject({ status: 'idle', lastSync: null });
  c.useSaveStore.setState({ character: DEFAULT_CHARACTER });
  await vi.advanceTimersByTimeAsync(5000);
  expect(mock.write).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({ data: expect.objectContaining({ state: expect.objectContaining({ character: DEFAULT_CHARACTER }) }) }),
    { kind: 'insert', filters: {} },
  );
});

it.each([false, true])('舊空白快照保留本機設定與日常，有角色才條件上傳（已建角 %s）', async created => {
  const c = await setup();
  const { initialSave } = await import('../src/store/saveStore');
  mock.listener!('SIGNED_OUT', null);
  c.useSaveStore.setState(structuredClone(initialSave));
  c.useSaveStore.getState().ensureDaily();
  const remote = JSON.parse(localStorage.getItem(c.SAVE_KEY)!);
  remote.state = Object.fromEntries(Object.entries(remote.state).reverse());
  mock.fetch.mockResolvedValueOnce({ data: { data: remote, updated_at: 'blank' }, error: null });
  c.useSaveStore.setState(s => ({ character: created ? DEFAULT_CHARACTER : null, settings: { ...s.settings, musicVolume: 0 } }));
  mock.listener!('SIGNED_IN', { user } as Session);
  await vi.advanceTimersByTimeAsync(0);
  expect(c.useSaveStore.getState().settings.musicVolume).toBe(0);
  expect(c.useCloudStore.getState()).toMatchObject({ status: 'idle', conflict: null });
  if (!created) {
    expect(mock.write).not.toHaveBeenCalled();
    expect(c.useCloudStore.getState().lastSync).toBeNull();
    c.useSaveStore.setState({ character: DEFAULT_CHARACTER });
    await vi.advanceTimersByTimeAsync(5000);
  }
  expect(mock.write).toHaveBeenCalledTimes(1);
  expect(mock.write.mock.calls[0][1]).toEqual({ kind: 'update', filters: { user_id: user.id, updated_at: 'blank' } });
});

it('已有日常空檔的新裝置可直接下載真正的雲端角色', async () => {
  const c = await setup();
  const { initialSave, SAVE_VERSION } = await import('../src/store/saveStore');
  mock.listener!('SIGNED_OUT', null);
  c.useSaveStore.setState(structuredClone(initialSave));
  c.useSaveStore.getState().ensureDaily();
  mock.fetch.mockResolvedValueOnce({
    data: {
      data: { state: { ...initialSave, character: { ...DEFAULT_CHARACTER, name: '原有主角' }, gold: 900 }, version: SAVE_VERSION },
      updated_at: 'played',
    },
    error: null,
  });
  mock.listener!('SIGNED_IN', { user } as Session);
  await vi.advanceTimersByTimeAsync(0);
  expect(c.useSaveStore.getState()).toMatchObject({ character: { name: '原有主角' }, gold: 900 });
  expect(c.useCloudStore.getState()).toMatchObject({ status: 'idle', lastSync: 'played', conflict: null });
  expect(mock.write).not.toHaveBeenCalled();
});

it('已讀到的空白雲端版本被另一台寫入進度時，保留兩邊存檔', async () => {
  const c = await setup();
  const { initialSave, SAVE_VERSION } = await import('../src/store/saveStore');
  mock.listener!('SIGNED_OUT', null);
  mock.fetch.mockResolvedValueOnce({
    data: { data: { state: initialSave, version: SAVE_VERSION }, updated_at: 'blank' }, error: null,
  }).mockResolvedValueOnce({
    data: { data: { state: { ...initialSave, character: DEFAULT_CHARACTER, gold: 900 }, version: SAVE_VERSION }, updated_at: 'played' }, error: null,
  });
  mock.write.mockResolvedValueOnce({ data: null, error: null });
  mock.listener!('SIGNED_IN', { user } as Session);
  await vi.advanceTimersByTimeAsync(0);
  expect(mock.write).toHaveBeenCalledTimes(1);
  expect(mock.write.mock.calls[0][1].filters.updated_at).toBe('blank');
  expect(c.useSaveStore.getState().gold).toBe(100);
  expect(c.useCloudStore.getState()).toMatchObject({ status: 'conflict', conflict: { cloud: { gold: 900 }, snapshot: { updatedAt: 'played' } } });
});

it.each(['future', 'progress', 'missing'] as const)('無法確認是空白的雲端紀錄（%s）不會自動覆寫', async kind => {
  const c = await setup();
  const { initialSave, SAVE_VERSION } = await import('../src/store/saveStore');
  mock.listener!('SIGNED_OUT', null);
  const data = kind === 'future' ? { state: initialSave, version: SAVE_VERSION + 1 }
    : kind === 'progress' ? { state: { ...initialSave, gold: 900 }, version: SAVE_VERSION }
    : null;
  mock.fetch.mockResolvedValue({ data: { data, updated_at: 'different' }, error: null });
  mock.listener!('SIGNED_IN', { user } as Session);
  await vi.advanceTimersByTimeAsync(0);
  expect(c.useCloudStore.getState().status).toBe(kind === 'progress' ? 'conflict' : 'error');
  await c.uploadNow();
  expect(mock.write).not.toHaveBeenCalled();
  expect(c.useSaveStore.getState().gold).toBe(100);
});

it('另一裝置先寫入時，條件更新不得覆蓋遠端；玩家選本地後才用新版本更新', async () => {
  const c = await setup();
  const { initialSave, SAVE_VERSION } = await import('../src/store/saveStore');
  let row = { data: { state: { ...structuredClone(initialSave), gold: 900 }, version: SAVE_VERSION }, updated_at: '2026-11-22T01:00:00.000Z' };
  mock.fetch.mockImplementation(async () => ({ data: structuredClone(row), error: null }));
  mock.write.mockImplementation(async (payload, operation) => {
    expect(operation.kind).toBe('update');
    expect(operation.filters.user_id).toBe(user.id);
    if (operation.filters.updated_at !== row.updated_at) return { data: null, error: null };
    row = { data: structuredClone(payload.data), updated_at: payload.updated_at };
    return { data: structuredClone(row), error: null };
  });
  await c.uploadNow();
  expect(row.data.state.gold).toBe(900);
  expect(c.useSaveStore.getState().gold).toBe(100);
  expect(c.useCloudStore.getState()).toMatchObject({ status: 'conflict', conflict: { cloud: { gold: 900 }, local: { gold: 100 } } });
  await vi.advanceTimersByTimeAsync(10_000);
  expect(mock.write).toHaveBeenCalledTimes(1);
  c.useSaveStore.setState({ gold: 150 });
  await c.resolveConflict('local');
  expect(row.data.state.gold).toBe(150);
  expect(c.useCloudStore.getState().status).toBe('idle');
  expect(mock.write.mock.calls[1][1].filters.updated_at).toBe('2026-11-22T01:00:00.000Z');
});

it('玩家選擇期間遠端又更新時，重新顯示新衝突而非覆蓋第二份進度', async () => {
  const c = await setup();
  const { initialSave, SAVE_VERSION } = await import('../src/store/saveStore');
  const snapshot = { data: { state: { ...structuredClone(initialSave), gold: 900 }, version: SAVE_VERSION }, updatedAt: 'first' };
  c.useCloudStore.setState({ status: 'conflict', conflict: { local: c.summarize({ gold: 100 }), cloud: c.summarize(snapshot.data.state), snapshot } });
  mock.write.mockResolvedValueOnce({ data: null, error: null });
  mock.fetch.mockResolvedValueOnce({ data: { data: { ...snapshot.data, state: { ...snapshot.data.state, gold: 1200 } }, updated_at: 'second' }, error: null });
  await c.resolveConflict('local');
  expect(mock.write.mock.calls[0][1].filters.updated_at).toBe('first');
  expect(c.useCloudStore.getState()).toMatchObject({ status: 'conflict', conflict: { cloud: { gold: 1200 }, snapshot: { updatedAt: 'second' } } });
  expect(c.useSaveStore.getState().gold).toBe(100);
});

it('首次建立撞到另一裝置的唯一鍵時，不改用 upsert 覆蓋而是顯示衝突', async () => {
  const c = await setup(null);
  mock.write.mockResolvedValueOnce({ data: null, error: { code: '23505', message: 'duplicate' } });
  mock.fetch.mockResolvedValueOnce({ data: { data: { state: { gold: 900 }, version: 26 }, updated_at: 'remote' }, error: null });
  await c.uploadNow();
  expect(mock.write.mock.calls[0][1].kind).toBe('insert');
  expect(mock.write).toHaveBeenCalledTimes(1);
  expect(c.useCloudStore.getState().status).toBe('conflict');
  expect(c.useSaveStore.getState().gold).toBe(100);
});

it('採用伺服器回傳版本，補傳時用該版本比對而非本機送出的時間', async () => {
  const c = await setup();
  const canonical = '2026-11-22T01:00:00.123456+00:00';
  mock.write.mockImplementationOnce(async payload => ({ data: { data: payload.data, updated_at: canonical }, error: null }));
  await c.uploadNow();
  expect(JSON.parse(localStorage.getItem('english-rpg-cloud')!).syncedAt).toBe(canonical);
  c.useSaveStore.setState({ gold: 200 });
  await c.uploadNow();
  expect(mock.write.mock.calls[1][1].filters.updated_at).toBe(canonical);
});

it('同一毫秒重傳仍產生不同版本，避免舊條件繼續命中', async () => {
  const previous = new Date().toISOString();
  const c = await setup(previous);
  await c.uploadNow();
  expect(mock.write.mock.calls[0][1].filters.updated_at).toBe(previous);
  expect(Date.parse(mock.write.mock.calls[0][0].updated_at)).toBeGreaterThan(Date.parse(previous));
});

it('衝突選本地遇到斷線仍保留選擇快照，重試不借用舊 metadata 版本', async () => {
  const c = await setup();
  const snapshot = { data: { state: { gold: 900 }, version: 26 }, updatedAt: 'chosen-version' };
  c.useCloudStore.setState({ status: 'conflict', conflict: { local: c.summarize({ gold: 100 }), cloud: c.summarize({ gold: 900 }), snapshot } });
  mock.write.mockRejectedValueOnce(new Error('offline'));
  await c.resolveConflict('local');
  expect(c.useCloudStore.getState().status).toBe('error');
  expect(c.useCloudStore.getState().conflict?.snapshot.updatedAt).toBe('chosen-version');
  await c.resolveConflict('local');
  expect(mock.write.mock.calls[1][1].filters.updated_at).toBe('chosen-version');
  expect(c.useCloudStore.getState()).toMatchObject({ status: 'idle', conflict: null });
});

it('登入下載斷線時立即同步會重試下載，不把空本地標成已同步', async () => {
  const c = await setup();
  const { initialSave, SAVE_VERSION } = await import('../src/store/saveStore');
  mock.listener!('SIGNED_OUT', null);
  localStorage.removeItem(c.SAVE_KEY);
  mock.fetch.mockRejectedValueOnce(new Error('offline'));
  mock.listener!('SIGNED_IN', { user } as Session);
  await vi.advanceTimersByTimeAsync(0);
  expect(c.useCloudStore.getState().status).toBe('error');
  mock.fetch.mockResolvedValueOnce({ data: { data: { state: { ...structuredClone(initialSave), gold: 900 }, version: SAVE_VERSION }, updated_at: 'downloaded' }, error: null });
  await c.uploadNow();
  expect(c.useSaveStore.getState().gold).toBe(900);
  expect(mock.write).not.toHaveBeenCalled();
  expect(c.useCloudStore.getState().status).toBe('idle');
});

it('共用 metadata 被另一分頁更新時，本分頁仍用自己已知版本做 CAS', async () => {
  const c = await setup();
  localStorage.setItem('english-rpg-cloud', JSON.stringify({ userId: user.id, syncedAt: 'other-tab-version', dirty: false }));
  c.useSaveStore.setState({ gold: 80 });
  mock.write.mockResolvedValueOnce({ data: null, error: null });
  mock.fetch.mockResolvedValueOnce({ data: { data: { state: { gold: 900 }, version: 26 }, updated_at: 'other-tab-version' }, error: null });
  await c.uploadNow();
  expect(mock.write.mock.calls[0][1].filters.updated_at).toBe('old');
  expect(c.useCloudStore.getState().status).toBe('conflict');
  expect(c.useSaveStore.getState().gold).toBe(80);
});

it('遠端紀錄消失先保留本地並提示錯誤，玩家重試才重新建立', async () => {
  const c = await setup();
  mock.write.mockResolvedValueOnce({ data: null, error: null });
  await c.uploadNow();
  expect(c.useCloudStore.getState().status).toBe('error');
  expect(c.useSaveStore.getState().gold).toBe(100);
  expect(JSON.parse(localStorage.getItem('english-rpg-cloud')!)).toMatchObject({ syncedAt: '', dirty: true });
  expect(mock.write).toHaveBeenCalledTimes(1);
  c.useSaveStore.setState({ gold: 150 });
  await vi.advanceTimersByTimeAsync(5000);
  expect(mock.write).toHaveBeenCalledTimes(1);
  await c.uploadNow();
  expect(mock.write.mock.calls[1][1].kind).toBe('insert');
  expect(c.useCloudStore.getState().status).toBe('idle');
});

it('衝突時遠端遭移除，解除過期對話並保留本地，不會卡住或自動重建', async () => {
  const c = await setup();
  const snapshot = { data: { state: { gold: 900 }, version: 26 }, updatedAt: 'deleted' };
  c.useCloudStore.setState({ status: 'conflict', conflict: { local: c.summarize({ gold: 100 }), cloud: c.summarize({ gold: 900 }), snapshot } });
  mock.write.mockResolvedValueOnce({ data: null, error: null });
  await c.resolveConflict('local');
  expect(c.useCloudStore.getState()).toMatchObject({ status: 'error', conflict: null });
  c.useSaveStore.setState({ gold: 150 });
  await vi.advanceTimersByTimeAsync(5000);
  expect(mock.write).toHaveBeenCalledTimes(1);
  await c.uploadNow();
  expect(mock.write.mock.calls[1][1].kind).toBe('insert');
  expect(mock.write.mock.calls[1][0].data.state.gold).toBe(150);
});

async function setupConflict() {
  const c = await setup();
  const data = { state: { gold: 900 }, version: 27 };
  const snapshot = { data, updatedAt: 'visible-revision' };
  c.useCloudStore.setState({
    status: 'conflict', conflict: { local: c.summarize({ gold: 100 }), cloud: c.summarize(data.state), snapshot },
  });
  return { c, snapshot };
}

it('選雲端時遠端版本有變，先展示新版本並保留本地，第二次確認後才套用', async () => {
  const { c, snapshot } = await setupConflict();
  const data = { ...snapshot.data, state: { gold: 1200 } };
  mock.fetch.mockResolvedValue({ data: { data, updated_at: 'new-revision' }, error: null });
  const before = localStorage.getItem(c.SAVE_KEY);
  await c.resolveConflict('cloud');
  expect(localStorage.getItem(c.SAVE_KEY)).toBe(before);
  expect(c.useCloudStore.getState()).toMatchObject({ status: 'conflict', conflict: { cloud: { gold: 1200 },
    snapshot: { updatedAt: 'new-revision' }, notice: '雲端已有更新，請重新比較兩份存檔。' } });
  await c.resolveConflict('cloud');
  expect(c.useSaveStore.getState().gold).toBe(1200);
  expect(c.useCloudStore.getState()).toMatchObject({ status: 'idle', conflict: null, lastSync: 'new-revision' });
  expect(mock.write).not.toHaveBeenCalled();
});

it('選雲端等待期間本地存檔變動，保留新進度並重新比較', async () => {
  const { c, snapshot } = await setupConflict();
  const wait = deferred<{ data: unknown; error: null }>();
  mock.fetch.mockReturnValueOnce(wait.promise);
  const choose = c.resolveConflict('cloud');
  c.useSaveStore.getState().addGold(50);
  wait.resolve({ data: { data: snapshot.data, updated_at: snapshot.updatedAt }, error: null });
  await choose;
  expect(c.useSaveStore.getState().gold).toBe(150);
  expect(c.useCloudStore.getState()).toMatchObject({ status: 'conflict', conflict: { local: { gold: 150 },
    notice: '這台裝置已有更新，請重新比較兩份存檔。' } });
});

it.each(['rejection', 'response'])('選雲端遇到斷線 %s 仍可重新確認，遠端消失時保留本地且等手動重建', async kind => {
  const { c, snapshot } = await setupConflict();
  if (kind === 'rejection') mock.fetch.mockRejectedValueOnce(new Error('offline'));
  else mock.fetch.mockResolvedValueOnce({ data: null, error: { message: 'offline' } });
  await c.resolveConflict('cloud');
  expect(c.useCloudStore.getState()).toMatchObject({ status: 'error', error: 'offline', conflict: { snapshot } });
  expect(c.useSaveStore.getState().gold).toBe(100);
  await c.resolveConflict('cloud');
  expect(c.useCloudStore.getState()).toMatchObject({ status: 'error', conflict: null });
  expect(c.useSaveStore.getState().gold).toBe(100);
  await vi.advanceTimersByTimeAsync(5000);
  expect(mock.write).not.toHaveBeenCalled();
  await c.uploadNow();
  expect(mock.write.mock.calls[0][1].kind).toBe('insert');
});

it('選雲端等待新版本時登出，遲到的存檔不會覆蓋本地', async () => {
  const { c, snapshot } = await setupConflict();
  const wait = deferred<{ data: unknown; error: null }>();
  mock.fetch.mockReturnValueOnce(wait.promise);
  const choose = c.resolveConflict('cloud');
  mock.listener!('SIGNED_OUT', null);
  wait.resolve({ data: { data: snapshot.data, updated_at: snapshot.updatedAt }, error: null });
  await choose;
  expect(c.useSaveStore.getState().gold).toBe(100);
  expect(c.useCloudStore.getState()).toMatchObject({ user: null, status: 'signedOut', conflict: null });
});

it('衝突畫面確認期間鎖定選項，斷線可重試，遠端版本變動須再確認', async () => {
  const { c, snapshot } = await setupConflict();
  const { createElement, act } = await import('react');
  const { createRoot } = await import('react-dom/client');
  const { CloudConflict } = await import('../src/components/CloudSave');
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(createElement(CloudConflict)));
    const buttons = () => [...container.querySelectorAll('button')];
    const chooseCloud = () => act(async () => buttons()[0].click());
    const wait = deferred<{ data: unknown; error: null }>();
    mock.fetch.mockReturnValueOnce(wait.promise);
    await chooseCloud();
    expect(buttons()).toHaveLength(2);
    expect(buttons().every(button => button.disabled)).toBe(true);
    await act(async () => wait.reject(new Error('offline')));
    expect(container.querySelector('[role=alert]')?.textContent).toContain('offline');
    expect(buttons().every(button => !button.disabled)).toBe(true);

    const data = { ...snapshot.data, state: { gold: 1200 } };
    mock.fetch.mockResolvedValue({ data: { data, updated_at: 'recent' }, error: null });
    await chooseCloud();
    expect(container.querySelector('[role=status]')?.textContent).toContain('重新比較');
    expect(buttons()[0].textContent).toContain('1200');
    expect(c.useSaveStore.getState().gold).toBe(100);
    await chooseCloud();
    expect(container.querySelector('[role=dialog]')).toBeNull();
    expect(c.useSaveStore.getState().gold).toBe(1200);
    expect(mock.write).not.toHaveBeenCalled();
  } finally {
    await act(async () => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  }
});
