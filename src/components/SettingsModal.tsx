import { useEffect, useRef, useState } from 'react';
import Modal from './Modal';
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { createRecognizer, isSpeechRecognitionSupported } from '../game/speech';
import type { Recognizer } from '../game/speech';
import { useSpeak } from './useSpeak';
import { keepFocus } from './keepFocus';

export default function SettingsModal() {
  const settings = useSaveStore(s => s.settings);
  const updateSettings = useSaveStore(s => s.updateSettings);
  const resetProgress = useSaveStore(s => s.resetProgress);
  const { closeModal, openModal } = useUiStore();
  const say = useSpeak();
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <Modal title="設定" onClose={closeModal}>
      <section className="settings-group">
        <h3>🔊 聲音</h3>
        <label className="range">
          <span>發音語速 <b>{settings.speechRate.toFixed(1)}x</b></span>
          <input type="range" min={0.5} max={1.3} step={0.1} value={settings.speechRate}
            onChange={e => updateSettings({ speechRate: Number(e.target.value) })} />
        </label>
        <label className="range">
          <span>音量 <b>{Math.round(settings.volume * 100)}%</b></span>
          <input type="range" min={0} max={1} step={0.1} value={settings.volume}
            onChange={e => updateSettings({ volume: Number(e.target.value) })} />
        </label>
        <button className="btn" onMouseDown={keepFocus} onClick={() => say('Welcome to the English adventure.')}>▶ 試聽</button>
        <label className="check">
          <input type="checkbox" checked={settings.autoSpeak} onChange={e => updateSettings({ autoSpeak: e.target.checked })} />
          出題時自動播放發音
        </label>
      </section>

      <section className="settings-group">
        <h3>🎤 麥克風測試</h3>
        <MicTest />
      </section>

      <section className="settings-group">
        <h3>📖 學習</h3>
        <label className="check">
          <input type="checkbox" checked={settings.showLessons} onChange={e => updateSettings({ showLessons: e.target.checked })} />
          每 10 關開始前自動顯示戰前預習
        </label>
        <button className="btn" onMouseDown={keepFocus} onClick={() => openModal('tutorial')}>❓ 重看新手引導</button>
      </section>

      <section className="settings-group danger">
        <h3>⚠️ 重置進度</h3>
        <p className="muted">清除區域進度、金幣、升級、道具、英雄、錯題本與圖鑑（設定會保留）。此動作無法復原。</p>
        {confirmReset ? (
          <div className="feedback-actions">
            <button className="btn btn-danger" onMouseDown={keepFocus} onClick={() => { resetProgress(); setConfirmReset(false); }}>確定重置</button>
            <button className="btn" onMouseDown={keepFocus} onClick={() => setConfirmReset(false)}>取消</button>
          </div>
        ) : (
          <button className="btn" onMouseDown={keepFocus} onClick={() => setConfirmReset(true)}>重置進度…</button>
        )}
      </section>
    </Modal>
  );
}

function MicTest() {
  const [status, setStatus] = useState<'idle' | 'listening' | 'done' | 'error'>('idle');
  const [text, setText] = useState('');
  const recognizer = useRef<Recognizer | null>(null);

  useEffect(() => {
    recognizer.current = createRecognizer({
      onStart: () => { setStatus('listening'); setText(''); },
      onResult: (t) => { setStatus('done'); setText(t); },
      onError: (err) => { setStatus('error'); setText(err === 'not-allowed' ? '請允許瀏覽器使用麥克風' : `辨識失敗（${err}）`); },
      onEnd: () => setStatus(s => (s === 'listening' ? 'idle' : s)),
    });
    return () => recognizer.current?.stop();
  }, []);

  if (!isSpeechRecognitionSupported()) {
    return <p className="muted">這個瀏覽器不支援語音辨識，口說題會自動改成拼寫題。建議使用 Chrome 或 Edge。</p>;
  }
  return (
    <div className="mic-test">
      <button className="btn" onMouseDown={keepFocus} onClick={() => recognizer.current?.start()} disabled={status === 'listening'}>
        {status === 'listening' ? '🎤 聆聽中…' : '🎤 說一句英文試試'}
      </button>
      {status === 'done' && <p>聽到：<b>{text}</b> ✅</p>}
      {status === 'error' && <p className="voice-error">{text}</p>}
    </div>
  );
}
