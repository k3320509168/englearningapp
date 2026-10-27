import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Question } from '../game/types';
import { questionKey } from '../game/battle';

// 玩家存檔（存在瀏覽器 localStorage）。
// 修改資料結構時：SAVE_VERSION +1，並在 migrateSave 補上舊版轉換，避免舊存檔壞掉。
export const SAVE_VERSION = 1;

export interface MistakeRecord {
  question: Question;
  wrongCount: number;
  lastWrongAt: number;
}

export interface Settings {
  speechRate: number;
}

interface SaveData {
  unlockedIndex: number;
  mistakes: Record<string, MistakeRecord>;
  settings: Settings;
}

interface SaveActions {
  unlockLevel: (index: number) => void;
  recordMistake: (q: Question) => void;
  updateSettings: (patch: Partial<Settings>) => void;
}

export const initialSave: SaveData = {
  unlockedIndex: 0,
  mistakes: {},
  settings: { speechRate: 0.9 },
};

export function migrateSave(persisted: unknown, version: number): SaveData {
  const data = (persisted ?? {}) as Partial<SaveData>;
  // version 0：尚未有存檔版本的舊資料，直接補齊預設值
  if (version < 1) {
    return { ...initialSave, ...data, settings: { ...initialSave.settings, ...data.settings } };
  }
  return data as SaveData;
}

export const useSaveStore = create<SaveData & SaveActions>()(
  persist(
    (set) => ({
      ...initialSave,
      unlockLevel: (index) => set(s => ({ unlockedIndex: Math.max(s.unlockedIndex, index) })),
      recordMistake: (q) => set(s => {
        const key = questionKey(q);
        const prev = s.mistakes[key];
        return {
          mistakes: {
            ...s.mistakes,
            [key]: { question: q, wrongCount: (prev?.wrongCount ?? 0) + 1, lastWrongAt: Date.now() },
          },
        };
      }),
      updateSettings: (patch) => set(s => ({ settings: { ...s.settings, ...patch } })),
    }),
    {
      name: 'english-rpg-save',
      version: SAVE_VERSION,
      storage: createJSONStorage(() => localStorage),
      migrate: migrateSave,
      partialize: ({ unlockedIndex, mistakes, settings }) => ({ unlockedIndex, mistakes, settings }),
    },
  ),
);
