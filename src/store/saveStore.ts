import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Question } from '../game/types';
import { questionKey } from '../game/battle';
import { HEROES, ITEMS, SRS_INTERVALS, SRS_MASTERED_BOX, UPGRADES, upgradeCost } from '../game/progression';
import type { HeroId, ItemId, UpgradeId } from '../game/progression';
import { normalizeCharacter } from '../game/character';
import type { Character } from '../game/character';
import { PARTY_MAX } from '../game/party';
import type { MemberId } from '../game/party';

// 玩家存檔（存在瀏覽器 localStorage）。
// 修改資料結構時：SAVE_VERSION +1，並在 migrateSave 補上舊版轉換，避免舊存檔壞掉。
export const SAVE_VERSION = 7;

// 錯題本＝間隔重複（SRS）的複習清單：box 越高，下次複習間隔越長
export interface MistakeRecord {
  question: Question;
  wrongCount: number;
  lastWrongAt: number;
  box: number;
  dueAt: number;
}

// 圖鑑：遇過的每一題
export interface CodexEntry {
  question: Question;
  correct: number;
  wrong: number;
  firstSeenAt: number;
}

export interface Settings {
  speechRate: number;
  volume: number;
  sfxVolume: number;    // 打擊音效
  autoSpeak: boolean;   // 出題時自動播放發音
  showLessons: boolean; // 每 10 關開始前自動顯示戰前預習
}

interface SaveData {
  // 玩家自創的主角；null 代表還沒建立（第一次進入遊戲會先開角色創建）
  character: Character | null;
  unlockedIndex: number;
  // 每個區域目前打到第幾關（stage index），離開後回來從這裡繼續
  levelProgress: Record<string, number>;
  micAsked: boolean;
  mistakes: Record<string, MistakeRecord>;
  codex: Record<string, CodexEntry>;
  settings: Settings;
  tutorialDone: boolean;
  gold: number;
  upgrades: Record<UpgradeId, number>;
  items: Record<ItemId, number>;
  heroes: HeroId[];
  // 出戰隊伍（第一位是隊長），'player' 代表主角
  party: MemberId[];
}

interface SaveActions {
  setCharacter: (c: Character) => void;
  unlockLevel: (index: number) => void;
  setLevelProgress: (levelKey: string, stageIdx: number) => void;
  setMicAsked: () => void;
  // review：這次作答是否算一次 SRS 複習（看完正確答案後的重答不算）
  recordAnswer: (q: Question, correct: boolean, review: boolean) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setTutorialDone: (done: boolean) => void;
  addGold: (amount: number) => void;
  buyUpgrade: (id: UpgradeId) => boolean;
  buyItem: (id: ItemId) => boolean;
  consumeItem: (id: ItemId) => boolean;
  buyHero: (id: HeroId) => boolean;
  toggleMember: (id: MemberId) => void;
  setLeader: (id: MemberId) => void;
  resetProgress: () => void;
}

export const initialSave: SaveData = {
  character: null,
  unlockedIndex: 0,
  levelProgress: {},
  micAsked: false,
  mistakes: {},
  codex: {},
  settings: { speechRate: 0.9, volume: 1, sfxVolume: 0.7, autoSpeak: true, showLessons: true },
  tutorialDone: false,
  gold: 0,
  upgrades: { hp: 0, atk: 0, combo: 0, gold: 0 },
  items: { potion: 0, hint: 0, shield: 0 },
  heroes: ['knight'],
  party: ['player', 'knight'],
};

export function migrateSave(persisted: unknown, version: number): SaveData {
  const data = (persisted ?? {}) as Partial<SaveData> & { hero?: HeroId };
  // 每次升級都只「新增欄位」，所以用預設值補齊即可。
  // v1 → v2：舊玩家已經玩過，視為看過新手引導。
  // v2 → v3：錯題補上 SRS 欄位（立即可複習）。
  // v3 → v4：新增音效音量設定（預設值補齊）。
  // v4 → v5：新增各區域關卡進度與麥克風詢問紀錄。
  // v5 → v6：新增自創主角（舊玩家也要先建立角色）。
  // v6 → v7：單一出戰英雄改為 4 人隊伍（主角＋原本選的英雄）。
  const migrated: SaveData = {
    ...initialSave,
    ...data,
    settings: { ...initialSave.settings, ...data.settings },
    upgrades: { ...initialSave.upgrades, ...data.upgrades },
    items: { ...initialSave.items, ...data.items },
    character: normalizeCharacter(data.character),
    party: data.party ?? ['player', data.hero ?? 'knight'],
    tutorialDone: version >= 1 ? (version < 2 ? true : data.tutorialDone ?? true) : (data.tutorialDone ?? false),
  };
  migrated.mistakes = Object.fromEntries(Object.entries(data.mistakes ?? {}).map(([key, m]) => [
    key, { ...m, box: m.box ?? 0, dueAt: m.dueAt ?? m.lastWrongAt ?? 0 },
  ]));
  return migrated;
}

export function dueMistakes(mistakes: Record<string, MistakeRecord>, now: number, limit: number): MistakeRecord[] {
  return Object.values(mistakes)
    .filter(m => m.dueAt <= now)
    .sort((a, b) => a.dueAt - b.dueAt)
    .slice(0, limit);
}

export const useSaveStore = create<SaveData & SaveActions>()(
  persist(
    (set, get) => {
      // 扣金幣並套用變更；金幣不足時不動作
      const purchase = (cost: number, apply: (s: SaveData) => Partial<SaveData>): boolean => {
        if (get().gold < cost) return false;
        set(s => ({ gold: s.gold - cost, ...apply(s) }));
        return true;
      };

      return {
        ...initialSave,
        setCharacter: (c) => set({ character: normalizeCharacter(c) }),
        unlockLevel: (index) => set(s => ({ unlockedIndex: Math.max(s.unlockedIndex, index) })),
        setLevelProgress: (levelKey, stageIdx) => set(s => ({ levelProgress: { ...s.levelProgress, [levelKey]: stageIdx } })),
        setMicAsked: () => set({ micAsked: true }),

        recordAnswer: (q, correct, review) => set(s => {
          const key = questionKey(q);
          const now = Date.now();
          const prevCodex = s.codex[key];
          const codex = {
            ...s.codex,
            [key]: {
              question: q,
              correct: (prevCodex?.correct ?? 0) + (correct ? 1 : 0),
              wrong: (prevCodex?.wrong ?? 0) + (correct ? 0 : 1),
              firstSeenAt: prevCodex?.firstSeenAt ?? now,
            },
          };

          const mistakes = { ...s.mistakes };
          const prev = mistakes[key];
          if (!correct) {
            mistakes[key] = { question: q, wrongCount: (prev?.wrongCount ?? 0) + 1, lastWrongAt: now, box: 0, dueAt: now };
          } else if (prev && review && prev.dueAt <= now) {
            const box = prev.box + 1;
            if (box >= SRS_MASTERED_BOX) delete mistakes[key];
            else mistakes[key] = { ...prev, box, dueAt: now + SRS_INTERVALS[box] };
          }
          return { codex, mistakes };
        }),

        updateSettings: (patch) => set(s => ({ settings: { ...s.settings, ...patch } })),
        setTutorialDone: (done) => set({ tutorialDone: done }),
        addGold: (amount) => set(s => ({ gold: s.gold + amount })),

        buyUpgrade: (id) => {
          const def = UPGRADES.find(u => u.id === id)!;
          const level = get().upgrades[id];
          if (level >= def.maxLevel) return false;
          return purchase(upgradeCost(def, level), s => ({ upgrades: { ...s.upgrades, [id]: level + 1 } }));
        },

        buyItem: (id) => {
          const def = ITEMS.find(i => i.id === id)!;
          return purchase(def.cost, s => ({ items: { ...s.items, [id]: s.items[id] + 1 } }));
        },

        consumeItem: (id) => {
          if (get().items[id] <= 0) return false;
          set(s => ({ items: { ...s.items, [id]: s.items[id] - 1 } }));
          return true;
        },

        buyHero: (id) => {
          const def = HEROES.find(h => h.id === id)!;
          if (get().heroes.includes(id)) return false;
          // 隊伍還有空位就直接加入
          return purchase(def.cost, s => ({
            heroes: [...s.heroes, id],
            party: s.party.length < PARTY_MAX ? [...s.party, id] : s.party,
          }));
        },

        // 加入或移出隊伍：最多 4 人、至少留 1 人
        toggleMember: (id) => set(s => {
          if (s.party.includes(id)) return s.party.length > 1 ? { party: s.party.filter(m => m !== id) } : {};
          const owned = id === 'player' ? s.character !== null : s.heroes.includes(id);
          return owned && s.party.length < PARTY_MAX ? { party: [...s.party, id] } : {};
        }),

        setLeader: (id) => set(s => (s.party.includes(id) ? { party: [id, ...s.party.filter(m => m !== id)] } : {})),

        // 只保留設定、新手引導進度與主角
        resetProgress: () => set(s => ({ ...initialSave, settings: s.settings, tutorialDone: s.tutorialDone, character: s.character })),
      };
    },
    {
      name: 'english-rpg-save',
      version: SAVE_VERSION,
      storage: createJSONStorage(() => localStorage),
      migrate: migrateSave,
      partialize: (s) => ({
        character: s.character,
        unlockedIndex: s.unlockedIndex, levelProgress: s.levelProgress, micAsked: s.micAsked, mistakes: s.mistakes, codex: s.codex, settings: s.settings,
        tutorialDone: s.tutorialDone, gold: s.gold, upgrades: s.upgrades, items: s.items, heroes: s.heroes, party: s.party,
      }),
    },
  ),
);
