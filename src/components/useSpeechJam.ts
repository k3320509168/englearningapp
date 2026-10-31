import { useEffect, useState } from 'react';
import { isSpeechJammed, onSpeechJam } from '../game/speech';

// 瀏覽器的發音引擎卡死時為 true（成功唸出一句就恢復）
export function useSpeechJam(): boolean {
  const [jammed, setJammed] = useState(isSpeechJammed);
  useEffect(() => onSpeechJam(setJammed), []);
  return jammed;
}
