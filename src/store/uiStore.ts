import { create } from 'zustand';

// 介面狀態（不存檔）：目前開啟的視窗，以及視窗需要的參數（例如哪個區域、哪段劇情）
export type ModalName = 'settings' | 'tutorial' | 'shop' | 'heroes' | 'codex' | 'mic' | 'character' | 'summon' | 'region' | 'story' | 'growth' | 'trueName';

interface UiState {
  modal: ModalName | null;
  regionIdx: number;
  storyId: string;
  heroId: string;
  openModal: (name: ModalName) => void;
  openRegion: (regionIdx: number) => void;
  openStory: (storyId: string) => void;
  openTrueName: (heroId: string) => void;
  closeModal: () => void;
}

export const useUiStore = create<UiState>()((set) => ({
  modal: null,
  regionIdx: 0,
  storyId: '',
  heroId: '',
  openModal: (name) => set({ modal: name }),
  openRegion: (regionIdx) => set({ modal: 'region', regionIdx }),
  openStory: (storyId) => set({ modal: 'story', storyId }),
  openTrueName: (heroId) => set({ modal: 'trueName', heroId }),
  closeModal: () => set({ modal: null }),
}));
