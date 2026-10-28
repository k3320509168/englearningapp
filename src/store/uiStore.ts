import { create } from 'zustand';

// 介面狀態（不存檔）：目前開啟的視窗，以及視窗需要的參數（例如哪個區域、哪段劇情）
export type ModalName = 'settings' | 'tutorial' | 'shop' | 'heroes' | 'codex' | 'mic' | 'character' | 'summon' | 'region' | 'story' | 'growth' | 'trueName' | 'golden' | 'daily' | 'skillBoss' | 'review' | 'placement' | 'gateTrial';

export type GrowthTab = 'hero' | 'gear' | 'forge';

// 全螢幕慶祝：升級、三星、SSR、真名、轉職等重大時刻。排隊依序顯示
export interface Celebration {
  icon: string;
  title: string;
  sub?: string;
  img?: string;   // 角色圖（data URL）
  color?: string; // 光芒顏色
}

interface UiState {
  modal: ModalName | null;
  regionIdx: number;
  storyId: string;
  storyReplay: boolean; // 從設定重看劇情：看完直接關閉
  heroId: string;
  growthTab: GrowthTab;
  celebrations: Celebration[];
  hintOpen: boolean; // 戰鬥中的情境提示還沒按「知道了」：計時暫停
  retreatAsk: boolean; // 撤退確認中（計時暫停）
  setRetreatAsk: (on: boolean) => void;
  imeWarning: boolean; // 偵測到中文輸入法（注音）：英文字母打不進去
  setImeWarning: (on: boolean) => void;
  setHintOpen: (open: boolean) => void;
  celebrate: (c: Celebration) => void;
  dismissCelebration: () => void;
  openModal: (name: ModalName) => void;
  openRegion: (regionIdx: number) => void;
  openGate: (regionIdx: number) => void;
  openStory: (storyId: string, replay?: boolean) => void;
  openTrueName: (heroId: string) => void;
  openGrowth: (tab?: GrowthTab) => void;
  closeModal: () => void;
}

export const useUiStore = create<UiState>()((set) => ({
  modal: null,
  regionIdx: 0,
  storyId: '',
  storyReplay: false,
  heroId: '',
  growthTab: 'hero',
  celebrations: [],
  hintOpen: false,
  retreatAsk: false,
  setRetreatAsk: (on) => set({ retreatAsk: on }),
  imeWarning: false,
  setImeWarning: (on) => set(s => (s.imeWarning === on ? s : { imeWarning: on })),
  setHintOpen: (open) => set({ hintOpen: open }),
  celebrate: (c) => set(s => ({ celebrations: [...s.celebrations, c] })),
  dismissCelebration: () => set(s => ({ celebrations: s.celebrations.slice(1) })),
  openModal: (name) => set(name === 'growth' ? { modal: name, growthTab: 'hero' } : { modal: name }),
  openRegion: (regionIdx) => set({ modal: 'region', regionIdx }),
  openGate: (regionIdx) => set({ modal: 'gateTrial', regionIdx }),
  openStory: (storyId, replay = false) => set({ modal: 'story', storyId, storyReplay: replay }),
  openTrueName: (heroId) => set({ modal: 'trueName', heroId }),
  openGrowth: (tab = 'hero') => set({ modal: 'growth', growthTab: tab }),
  closeModal: () => set({ modal: null }),
}));
