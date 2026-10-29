import type { VocabEntry } from '../../types';
import type { BankFile } from './index';
import { BANK_COUNT } from './index';
import { addBank, isBankLoaded } from '../../QuestionData';
import { addBankVocab } from '../../vocab';

// 瀏覽器裡分區域載入題庫：每個區域是獨立的檔案，用到才下載（之後由瀏覽器快取）
const files = import.meta.glob<{ default: BankFile }>('./r[0-9].json');
const vocabs = import.meta.glob<{ default: Record<string, VocabEntry> }>('./vocab-r[0-9].json');
const pending = new Map<number, Promise<void>>();

export function loadBank(regionIdx: number): Promise<void> {
  if (regionIdx < 0 || regionIdx >= BANK_COUNT || isBankLoaded(regionIdx)) return Promise.resolve();
  if (!pending.has(regionIdx)) {
    pending.set(regionIdx, Promise.all([files[`./r${regionIdx}.json`]?.(), vocabs[`./vocab-r${regionIdx}.json`]?.()])
      .then(([f, v]) => {
        if (f) addBank(regionIdx, f.default);
        if (v) addBankVocab(v.default);
      })
      .catch(() => { pending.delete(regionIdx); })); // 網路失敗：下次再試，先用內建題目
  }
  return pending.get(regionIdx)!;
}

// 先載入目前區域（最快能玩），其餘的在背景依序載入
export async function loadBanksFrom(regionIdx: number): Promise<void> {
  await loadBank(regionIdx);
  for (let i = 0; i < BANK_COUNT; i++) await loadBank(i);
}
