import { create } from 'zustand';

// 介面狀態（不存檔）：目前開啟的視窗，以及視窗需要的參數（例如哪個區域、哪段劇情）
export type ModalName = 'settings' | 'tutorial' | 'shop' | 'heroes' | 'codex' | 'mic' | 'character' | 'summon' | 'region' | 'story' | 'growth' | 'trueName' | 'golden' | 'daily' | 'skillBoss';

export type GrowthTab = 'hero' | 'gear' | 'forge';

interface UiState {
  modal: ModalName | null;
  regionIdx: number;
  storyId: string;
  heroId: string;
  growthTab: GrowthTab;
  openModal: (name: ModalName) => void;
  openRegion: (regionIdx: number) => void;
  openStory: (storyId: string) => void;
  openTrueName: (heroId: string) => void;
  openGrowth: (tab?: GrowthTab) => void;
  closeModal: () => void;
}

export const useUiStore = create<UiState>()((set) => ({
  modal: null,
  regionIdx: 0,
  storyId: '',
  heroId: '',
  growthTab: 'hero',
  openModal: (name) => set(name === 'growth' ? { modal: name, growthTab: 'hero' } : { modal: name }),
  openRegion: (regionIdx) => set({ modal: 'region', regionIdx }),
  openStory: (storyId) => set({ modal: 'story', storyId }),
  openTrueName: (heroId) => set({ modal: 'trueName', heroId }),
  openGrowth: (tab = 'hero') => set({ modal: 'growth', growthTab: tab }),
  closeModal: () => set({ modal: null }),
}));
