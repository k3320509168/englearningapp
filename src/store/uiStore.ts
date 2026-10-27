import { create } from 'zustand';

// 介面狀態（不存檔）：目前開啟的視窗
export type ModalName = 'settings' | 'tutorial' | 'shop' | 'heroes' | 'codex' | 'mic' | 'character';

interface UiState {
  modal: ModalName | null;
  openModal: (name: ModalName) => void;
  closeModal: () => void;
}

export const useUiStore = create<UiState>()((set) => ({
  modal: null,
  openModal: (name) => set({ modal: name }),
  closeModal: () => set({ modal: null }),
}));
