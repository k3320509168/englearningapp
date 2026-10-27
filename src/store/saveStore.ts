import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Question } from '../game/types';
import { questionKey } from '../game/battle';

// 玩家存檔（存在瀏覽器 localStorage）。
// 修改資料結構時：SAVE_VERSION +1，並在 migrateSave 補上舊版轉換，避免舊存檔壞掉。
export const SAVE_VERSION = 2;

export interface MistakeRecord {
  question: Question;
  wrongCount: number;
  lastWrongAt: number;
}

export interface Settings {
  speechRate: number;
  volume: number;
  autoSpeak: boolean;   // 出題時自動播放發音
  showLessons: boolean; // 每 10 關開始前自動顯示戰前預習
}

interface SaveData {
  unlockedIndex: number;
  mistakes: Record<string, MistakeRecord>;
  settings: Settings;
  tutorialDone: boolean;
}

interface SaveActions {
  unlockLevel: (index: number) => void;
  recordMistake: (q: Question) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setTutorialDone: (done: boolean) => void;
  resetProgress: () => void;
}

export const initialSave: SaveData = {
  unlockedIndex: 0,
  mistakes: {},
  settings: { speechRate: 0.9, volume: 1, autoSpeak: true, showLessons: true },
  tutorialDone: false,
};

export function migrateSave(persisted: unknown, version: number): SaveData {
  const data = (persisted ?? {}) as Partial<SaveData>;
  // v0 → v1：補齊預設值；v1 → v2：新增音量、自動發音、預習設定與新手引導進度。
  // 兩次升級都是「只新增欄位」，所以用預設值補齊即可；舊玩家已經玩過，視為看過新手引導
  if (version < 2) {
    return {
      ...initialSave,
      ...data,
      settings: { ...initialSave.settings, ...data.settings },
      tutorialDone: version >= 1 ? true : (data.tutorialDone ?? false),
    };
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
      setTutorialDone: (done) => set({ tutorialDone: done }),
      resetProgress: () => set(s => ({ unlockedIndex: 0, mistakes: {}, settings: s.settings })),
    }),
    {
      name: 'english-rpg-save',
      version: SAVE_VERSION,
      storage: createJSONStorage(() => localStorage),
      migrate: migrateSave,
      partialize: ({ unlockedIndex, mistakes, settings, tutorialDone }) => ({ unlockedIndex, mistakes, settings, tutorialDone }),
    },
  ),
);
