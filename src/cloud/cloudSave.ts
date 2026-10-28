import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { create } from 'zustand';
import { useSaveStore } from '../store/saveStore';

// 雲端存檔（Supabase）：登入是選擇性的，不登入照常玩、存檔只在這個瀏覽器。
// 登入後存檔自動上傳；換裝置登入時下載。兩邊都有新進度時，讓玩家選要留哪一份。
// 連線資訊放在專案根目錄的 .env.local（VITE_SUPABASE_URL、VITE_SUPABASE_ANON_KEY），沒有設定時雲端功能整個關閉。

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
export const supabase: SupabaseClient | null = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;
export const cloudEnabled = supabase !== null;

export const SAVE_KEY = 'english-rpg-save';
const META_KEY = 'english-rpg-cloud'; // 這台裝置上次同步的紀錄

interface Meta { userId: string; syncedAt: string; dirty: boolean }

// 存檔摘要：衝突時讓玩家比較兩份
export interface SaveSummary { name: string; level: number; regions: number; gold: number; updatedAt?: string }

export interface CloudSnapshot { data: { state: Record<string, unknown>; version: number }; updatedAt: string }

type Status = 'off' | 'signedOut' | 'idle' | 'syncing' | 'error' | 'conflict';
interface CloudState {
  status: Status;
  user: User | null;
  lastSync: string | null;
  error: string;
  conflict: { local: SaveSummary; cloud: SaveSummary; snapshot: CloudSnapshot } | null;
}
export const useCloudStore = create<CloudState>()(() => ({
  status: cloudEnabled ? 'signedOut' : 'off', user: null, lastSync: null, error: '', conflict: null,
}));
const setCloud = (patch: Partial<CloudState>) => useCloudStore.setState(patch);

const readMeta = (): Meta | null => {
  try { return JSON.parse(localStorage.getItem(META_KEY) ?? 'null') as Meta | null; } catch { return null; }
};
const writeMeta = (m: Meta) => { try { localStorage.setItem(META_KEY, JSON.stringify(m)); } catch { /* 無痕模式等情況 */ } };

const readLocal = (): { state: Record<string, unknown>; version: number } | null => {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY) ?? 'null'); } catch { return null; }
};

export function summarize(state: Record<string, unknown> | undefined, updatedAt?: string): SaveSummary {
  const s = (state ?? {}) as { character?: { name?: string } | null; player?: { level?: number }; unlockedIndex?: number; gold?: number };
  return { name: s.character?.name ?? '（未建立主角）', level: s.player?.level ?? 1, regions: s.unlockedIndex ?? 0, gold: s.gold ?? 0, updatedAt };
}

// 新玩家的空存檔（還沒建立主角）不必跟雲端比較
const isEmptySave = (state: Record<string, unknown> | undefined) => !state?.character;

async function fetchCloud(userId: string): Promise<CloudSnapshot | null> {
  const { data, error } = await supabase!.from('saves').select('data, updated_at').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data ? { data: data.data, updatedAt: data.updated_at } : null;
}

export async function uploadNow(): Promise<void> {
  const user = useCloudStore.getState().user;
  const local = readLocal();
  if (!supabase || !user || !local) return;
  setCloud({ status: 'syncing', error: '' });
  const updatedAt = new Date().toISOString();
  const { error } = await supabase.from('saves').upsert({ user_id: user.id, data: local, save_version: local.version, updated_at: updatedAt });
  if (error) return setCloud({ status: 'error', error: error.message });
  writeMeta({ userId: user.id, syncedAt: updatedAt, dirty: false });
  setCloud({ status: 'idle', lastSync: updatedAt });
}

// 用雲端的存檔取代這台裝置的存檔（舊版存檔會自動轉換）
export async function applyCloud(snapshot: CloudSnapshot): Promise<void> {
  const user = useCloudStore.getState().user;
  localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot.data));
  await useSaveStore.persist.rehydrate();
  if (user) writeMeta({ userId: user.id, syncedAt: snapshot.updatedAt, dirty: false });
  setCloud({ status: 'idle', lastSync: snapshot.updatedAt, conflict: null });
}

// 衝突時玩家選了要留哪一份
export async function resolveConflict(keep: 'local' | 'cloud'): Promise<void> {
  const c = useCloudStore.getState().conflict;
  if (!c) return;
  setCloud({ conflict: null });
  if (keep === 'cloud') await applyCloud(c.snapshot);
  else await uploadNow();
}

// 登入後（或重新整理後已是登入狀態）比對雲端與這台裝置
async function syncOnLogin(user: User) {
  setCloud({ user, status: 'syncing', error: '' });
  try {
    const cloud = await fetchCloud(user.id);
    const local = readLocal();
    const meta = readMeta();
    if (!cloud) return uploadNow();                                  // 雲端還沒有：上傳
    if (!local || isEmptySave(local.state)) return applyCloud(cloud); // 這台是新裝置：直接下載
    const sameDevice = meta?.userId === user.id;
    const cloudChanged = !sameDevice || cloud.updatedAt !== meta?.syncedAt;
    const localChanged = !sameDevice || (meta?.dirty ?? true);
    if (!cloudChanged) return localChanged ? uploadNow() : setCloud({ status: 'idle', lastSync: cloud.updatedAt });
    if (!localChanged) return applyCloud(cloud);
    // 兩邊都有新進度：讓玩家選
    setCloud({
      status: 'conflict',
      conflict: { local: summarize(local.state), cloud: summarize(cloud.data.state, cloud.updatedAt), snapshot: cloud },
    });
  } catch (e) {
    setCloud({ status: 'error', error: e instanceof Error ? e.message : String(e) });
  }
}

let started = false;
let uploadTimer: number | undefined;

// 遊戲啟動時呼叫一次：恢復登入狀態、監聽登入登出、存檔變動後自動上傳（5 秒內的變動合併成一次）
export function initCloud() {
  if (!supabase || started) return;
  started = true;
  supabase.auth.onAuthStateChange((event, session) => {
    if (session?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
      if (useCloudStore.getState().user?.id !== session.user.id) void syncOnLogin(session.user);
    } else if (event === 'SIGNED_OUT') {
      setCloud({ user: null, status: 'signedOut', lastSync: null, conflict: null });
    }
  });
  useSaveStore.subscribe(() => {
    // 登出時玩的進度也要記下「有變動」，下次登入才會跟雲端比較
    const meta = readMeta();
    if (meta && !meta.dirty) writeMeta({ ...meta, dirty: true });
    const { user, status } = useCloudStore.getState();
    if (!user || status === 'conflict' || status === 'syncing') return;
    window.clearTimeout(uploadTimer);
    uploadTimer = window.setTimeout(() => { void uploadNow(); }, 5000);
  });
}

// Email 登入連結：點信裡的連結回到遊戲就會登入
export async function sendLoginLink(email: string): Promise<string | null> {
  if (!supabase) return '雲端存檔沒有設定';
  const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin + import.meta.env.BASE_URL } });
  return error ? error.message : null;
}

export async function signOut() {
  await supabase?.auth.signOut();
}

// ---------- 存檔碼（不需要雲端）：整份存檔轉成一段文字，可以備份或搬到別的瀏覽器 ----------
export function exportSaveCode(): string {
  const bytes = new TextEncoder().encode(localStorage.getItem(SAVE_KEY) ?? '');
  // 分段轉換，避免存檔很大時展開參數超過上限
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

export function parseSaveCode(code: string): { state: Record<string, unknown>; version: number } | null {
  try {
    const bytes = Uint8Array.from(atob(code.trim()), c => c.charCodeAt(0));
    const data = JSON.parse(new TextDecoder().decode(bytes));
    return data && typeof data === 'object' && data.state && typeof data.version === 'number' ? data : null;
  } catch {
    return null;
  }
}

export async function importSave(data: { state: Record<string, unknown>; version: number }) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  await useSaveStore.persist.rehydrate();
  const meta = readMeta();
  if (meta) writeMeta({ ...meta, dirty: true });
  if (useCloudStore.getState().user) void uploadNow();
}
