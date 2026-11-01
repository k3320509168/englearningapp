import { useBattleStore } from '../store/battleStore';
import { answerTiming } from '../game/answerTiming';
import { useSaveStore } from '../store/saveStore';
import { SLOW_RATE, speak } from '../game/speech';

// 依玩家設定的語速、音量與語音播放發音；slow 為慢速（用「慢速語速」設定，並改用會遵守語速的本機語音）
export function useSpeak(trackBattle = false) {
  const { speechRate, slowRate, volume, voiceName } = useSaveStore(s => s.settings);
  return (text: string | undefined, slow = false) => {
    if (!text) return;
    const b = useBattleStore.getState();
    const listening = trackBattle && b.phase === 'answering' && b.question?.desc.startsWith('🎧');
    const timing = listening ? answerTiming(b.question, b.questionSeq) : null;
    let end: (() => void) | undefined;
    speak(text, speechRate, volume, slow, voiceName || undefined, slowRate ?? SLOW_RATE,
      timing ? { onStart: duration => { end = timing.startAudio(duration); }, onEnd: () => end?.() } : undefined);
  };
}
