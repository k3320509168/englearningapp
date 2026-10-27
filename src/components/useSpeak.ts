import { useSaveStore } from '../store/saveStore';
import { speak } from '../game/speech';

// 依玩家設定的語速與音量播放發音；slow 為固定的慢速（0.5 倍，並改用會遵守語速的本機語音）
export function useSpeak() {
  const { speechRate, volume } = useSaveStore(s => s.settings);
  return (text: string | undefined, slow = false) => {
    if (text) speak(text, speechRate, volume, slow);
  };
}
