import { useEffect } from 'react';
import { useBattleStore } from '../store/battleStore';
import { useUiStore } from '../store/uiStore';

const TICK_MS = 50;

// 依真實經過的時間推進戰鬥計時（畫面卡頓也不會讓時間變慢）。
// 開著設定等視窗、戰鬥提示還沒按「知道了」、或分頁切到背景時暫停，回來後從暫停處繼續。
export function useBattleClock() {
  useEffect(() => {
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const dt = now - last;
      last = now;
      const ui = useUiStore.getState();
      if (document.hidden || ui.modal || ui.hintOpen || ui.retreatAsk) return;
      // 電腦休眠等極端情況，最多只算 1 秒
      useBattleStore.getState().tick(Math.min(1000, dt));
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, []);
}
