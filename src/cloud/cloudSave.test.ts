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
