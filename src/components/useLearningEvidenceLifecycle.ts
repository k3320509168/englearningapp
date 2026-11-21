import { useEffect } from 'react';
import { clearLearningEvidence } from '../game/learningEvidence';
import { useSaveStore } from '../store/saveStore';

// 掛在 Game，不依賴測驗視窗是否開啟；設定頁的匯入、雲端套用與重置也會清除。
export function useLearningEvidenceLifecycle() {
  useEffect(() => {
    const offHydrate = useSaveStore.persist.onHydrate(clearLearningEvidence);
    const offReset = useSaveStore.subscribe((state, previous) => {
      if (previous.character && !state.character) clearLearningEvidence();
    });
    return () => { offHydrate(); offReset(); };
  }, []);
}
