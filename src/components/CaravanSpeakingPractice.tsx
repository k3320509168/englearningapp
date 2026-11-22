import { useEffect, useRef, useState } from 'react';
import { createRecognizer, isSpeechRecognitionSupported, recognitionErrorText } from '../game/speech';
import type { Recognizer } from '../game/speech';

export default function CaravanSpeakingPractice() {
  const [supported] = useState(isSpeechRecognitionSupported);
  const [phase, setPhase] = useState<'idle' | 'waiting' | 'speaking'>('idle');
  const [transcript, setTranscript] = useState('');
  const [message, setMessage] = useState('');
  const active = useRef<Recognizer | null>(null);

  const stop = () => {
    const current = active.current;
    if (!current) return;
    // 瀏覽器可能延遲回送最後一段辨識，結束後就不再更新這個畫面。
    active.current = null;
    current.stop();
    setPhase('idle');
  };
  useEffect(() => () => {
    const current = active.current;
    active.current = null;
    current?.stop();
  }, []);

  const begin = () => {
    stop();
    setTranscript('');
    setMessage('');
    const recognizer = createRecognizer({
      maxListenMs: 20000,
      onStart: () => { if (active.current === recognizer) setPhase('speaking'); },
      onPhase: next => { if (active.current === recognizer) setPhase(next); },
      onResult: results => { if (active.current === recognizer) setTranscript((results[0] ?? '').slice(0, 2000)); },
      onError: error => { if (active.current === recognizer) setMessage(recognitionErrorText(error)); },
      onEnd: () => { if (active.current === recognizer) setPhase('idle'); },
    });
    if (!recognizer) return;
    active.current = recognizer;
    recognizer.start();
  };

  return <details className="caravan-reference" onToggle={event => { if (!event.currentTarget.open) { stop(); setTranscript(''); } }}>
    <summary>口頭回應隊長（選練）</summary>
    <p lang="en">The customer says the delivery cannot be late. Explain why the short route is unsafe and offer one practical next step.</p>
    <p>用自己的話說兩三句。這裡會顯示瀏覽器辨識到的文字，供你自行比較。語音辨識由瀏覽器處理，可能使用其線上服務。</p>
    <div className="caravan-actions">
      {supported && (phase === 'idle'
        ? <button type="button" className="btn" onClick={begin}>開始自由口說</button>
        : <button type="button" className="btn" onClick={stop}>取消收音</button>)}
    </div>
    {!supported && <p role="status">這個瀏覽器沒有語音辨識。可以直接練說，或選擇上方的寫作練習。</p>}
    {phase !== 'idle' && <p role="status">{phase === 'waiting' ? '等待語音辨識啟動…' : '聆聽中…'}</p>}
    {message && <p role="status">{message} 你仍可直接練說或使用寫作練習。</p>}
    {transcript && <blockquote lang="en" aria-label="瀏覽器辨識文字">{transcript}</blockquote>}
    <ul>
      <li>有說明改道的安全理由。</li>
      <li>有對延誤提出具體安排。</li>
    </ul>
    <p>辨識文字關閉後清除。此練習提供自我檢查。</p>
  </details>;
}
