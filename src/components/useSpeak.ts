import { useSaveStore } from '../store/saveStore';
import { speak } from '../game/speech';

// 依玩家設定的語速與音量播放發音；slow 為慢速（再乘 0.7）
export function useSpeak() {
  const { speechRate, volume } = useSaveStore(s => s.settings);
  return (text: string | undefined, slow = false) => {
    if (text) speak(text, slow ? speechRate * 0.7 : speechRate, volume);
  };
}
