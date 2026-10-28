import { describe, expect, it, vi } from 'vitest';

// 測試環境沒有 localStorage：用記憶體版代替
const mem = new Map<string, string>();
vi.stubGlobal('localStorage', { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v), removeItem: (k: string) => void mem.delete(k) });
import { SAVE_KEY, exportSaveCode, parseSaveCode, summarize } from './cloudSave';

describe('存檔碼', () => {
  it('匯出後可以原樣讀回（含中文）', () => {
    const save = { state: { character: { name: '小夢' }, player: { level: 7 }, unlockedIndex: 2, gold: 350 }, version: 14 };
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    const back = parseSaveCode(exportSaveCode());
    expect(back).toEqual(save);
    expect(summarize(back!.state)).toMatchObject({ name: '小夢', level: 7, regions: 2, gold: 350 });
  });

  it('亂貼的文字不會被當成存檔', () => {
    expect(parseSaveCode('hello')).toBeNull();
    expect(parseSaveCode(btoa('{"foo":1}'))).toBeNull();
  });
});

describe('登入連結失敗', () => {
  it('看得懂 Supabase 放在網址上的錯誤', async () => {
    const { readLoginError } = await import('./cloudSave');
    expect(readLoginError('#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired&sb=')).toContain('最新那一封');
    expect(readLoginError('#error=server_error&error_description=Something+broke')).toContain('Something broke');
    expect(readLoginError('#access_token=abc')).toBeNull();
    expect(readLoginError('')).toBeNull();
  });
});
