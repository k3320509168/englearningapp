import { useBattleStore } from '../store/battleStore';
import { isSpeechRecognitionSupported } from './speech';
import { voiceFallback } from './battle';

// 從地圖（Phaser 圓點或 React 按鈕）開始關卡的共用入口。
// 場景切換由 MapScene 訂閱 battleStore.active 處理，React 與 Phaser 不必互相呼叫。
export function beginLevel(levelKey: string) {
  useBattleStore.getState().startLevel(levelKey, isSpeechRecognitionSupported() ? undefined : voiceFallback);
}
