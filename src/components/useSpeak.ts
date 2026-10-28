import { useSaveStore } from '../store/saveStore';
import { SLOW_RATE, speak } from '../game/speech';

// 依玩家設定的語速、音量與語音播放發音；slow 為慢速（用「慢速語速」設定，並改用會遵守語速的本機語音）
export function useSpeak() {
  const { speechRate, slowRate, volume, voiceName } = useSaveStore(s => s.settings);
  return (text: string | undefined, slow = false) => {
    if (text) speak(text, speechRate, volume, slow, voiceName || undefined, slowRate ?? SLOW_RATE);
  };
}
