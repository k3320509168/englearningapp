import { useSaveStore } from '../store/saveStore';
import { speak } from '../game/speech';

// 依玩家設定的語速、音量與語音播放發音；slow 為慢速（並改用會遵守語速的本機語音）
export function useSpeak() {
  const { speechRate, volume, voiceName } = useSaveStore(s => s.settings);
  return (text: string | undefined, slow = false) => {
    if (text) speak(text, speechRate, volume, slow, voiceName || undefined);
  };
}
