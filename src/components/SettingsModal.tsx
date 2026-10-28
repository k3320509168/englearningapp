import { useEffect, useRef, useState } from 'react';
import Modal from './Modal';
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { SLOW_RATE, createRecognizer, englishVoices, isSpeechRecognitionSupported, pickVoice } from '../game/speech';
import type { Recognizer } from '../game/speech';
import { useSpeak } from './useSpeak';
import { sfx } from '../game/sfx';
import { keepFocus } from './keepFocus';
import { STORIES } from '../game/story';
import { REGIONS } from '../game/regions';
import { CloudLoginError, CloudSection, BackupSection } from './CloudSave';
import { forgetCloudForReset } from '../cloud/cloudSave';

const TEXT_SCALES: [number, string][] = [[1, '標準'], [1.15, '大'], [1.3, '特大']];

// 劇情名稱：序章、各區域的開場與通關、黃金之路結局
function storyTitle(id: string): string {
  if (id === 'prologue') return '序章';
  if (id === 'golden-ending') return '黃金之路・結局';
  const [kind, idx] = id.split('-');
  const name = REGIONS[Number(idx)]?.name ?? '';
  return kind === 'region' ? `${name}・開場` : `${name}・通關`;
}

export default function SettingsModal() {
  const settings = useSaveStore(s => s.settings);
  const updateSettings = useSaveStore(s => s.updateSettings);
  const resetProgress = useSaveStore(s => s.resetProgress);
  const { closeModal, openModal, openStory } = useUiStore();
  const storySeen = useSaveStore(s => s.storySeen);
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <Modal title="設定" onClose={closeModal}>
      <CloudLoginError />
      <section className="settings-group">
        <h3>🔊 聲音</h3>
        <label className="range">
          <span>正常語速 <b>{settings.speechRate.toFixed(1)}x</b></span>
          <input type="range" min={0.5} max={1.3} step={0.1} value={settings.speechRate}
            onChange={e => updateSettings({ speechRate: Number(e.target.value) })} />
        </label>
        <label className="range">
          <span>慢速語速（🐢 按鈕）<b>{(settings.slowRate ?? SLOW_RATE).toFixed(2)}x</b></span>
          <input type="range" min={0.3} max={0.9} step={0.05} value={settings.slowRate ?? SLOW_RATE}
            onChange={e => updateSettings({ slowRate: Number(e.target.value) })} />
        </label>
        <label className="range">
          <span>發音音量 <b>{Math.round(settings.volume * 100)}%</b></span>
          <input type="range" min={0} max={1} step={0.1} value={settings.volume}
            onChange={e => updateSettings({ volume: Number(e.target.value) })} />
        </label>
        <label className="range">
          <span>打擊音效 <b>{Math.round(settings.sfxVolume * 100)}%</b></span>
          <input type="range" min={0} max={1} step={0.1} value={settings.sfxVolume}
            onChange={e => { updateSettings({ sfxVolume: Number(e.target.value) }); sfx.hit(); }} />
        </label>
        <label className="range">
          <span>背景音樂 <b>{Math.round(settings.musicVolume * 100)}%</b></span>
          <input type="range" min={0} max={1} step={0.05} value={settings.musicVolume}
            onChange={e => updateSettings({ musicVolume: Number(e.target.value) })} />
        </label>
        <VoicePicker />
        <label className="check">
          <input type="checkbox" checked={settings.autoSpeak} onChange={e => updateSettings({ autoSpeak: e.target.checked })} />
          出題時自動播放發音
        </label>
      </section>

      <section className="settings-group">
        <h3>🎤 麥克風測試</h3>
        <MicTest />
        <label className="check">
          <input type="checkbox" checked={settings.voiceAsSpelling} onChange={e => updateSettings({ voiceAsSpelling: e.target.checked })} />
          暫時不用麥克風：口說題改成拼寫題（下一次進入關卡生效）
        </label>
      </section>

      <section className="settings-group">
        <h3>👁️ 顯示</h3>
        <div className="text-scale" role="radiogroup" aria-label="文字大小">
          <span>文字大小</span>
          {TEXT_SCALES.map(([v, label]) => (
            <button key={v} role="radio" aria-checked={settings.textScale === v} className={`btn btn-small ${settings.textScale === v ? 'btn-primary' : ''}`}
              onMouseDown={keepFocus} onClick={() => updateSettings({ textScale: v })}>{label}</button>
          ))}
        </div>
        <label className="check">
          <input type="checkbox" checked={settings.reduceMotion} onChange={e => updateSettings({ reduceMotion: e.target.checked })} />
          減少動態效果（不震動、不閃光，適合容易頭暈的人）
        </label>
      </section>

      <section className="settings-group">
        <h3>📖 學習</h3>
        <label className="check">
          <input type="checkbox" checked={settings.showLessons} onChange={e => updateSettings({ showLessons: e.target.checked })} />
          每 10 關開始前自動顯示戰前預習
        </label>
        <button className="btn" onMouseDown={keepFocus} onClick={() => openModal('tutorial')}>❓ 重看遊戲說明</button>
      </section>

      <section className="settings-group">
        <h3>📜 劇情回顧</h3>
        {storySeen.length === 0 ? <p className="muted">還沒有看過的劇情。</p> : (
          <div className="story-list">
            {Object.keys(STORIES).filter(id => storySeen.includes(id)).map(id => (
              <button key={id} className="btn btn-small" onMouseDown={keepFocus} onClick={() => openStory(id, true)}>{storyTitle(id)}</button>
            ))}
          </div>
        )}
      </section>

      <section className="settings-group">
        <h3>☁️ 雲端存檔</h3>
        <CloudSection />
      </section>

      <section className="settings-group">
        <h3>💾 存檔備份</h3>
        <BackupSection />
      </section>

      <section className="settings-group danger">
        <h3>⚠️ 重置進度</h3>
        <p className="muted">全部歸零：主角、區域進度、金幣、英雄、裝備、錯題本、圖鑑、劇情與設定都會清除，從建立主角重新開始。此動作無法復原。
          有登入雲端存檔的話會先登出，雲端上的舊存檔不會被覆蓋（之後重新登入時可以選擇要保留哪一份）。</p>
        {confirmReset ? (
          <div className="feedback-actions">
            <button className="btn btn-danger" onMouseDown={keepFocus} onClick={() => {
              void forgetCloudForReset().finally(() => {
                resetProgress();
                setConfirmReset(false);
                // 重新載入：回到建立主角的畫面
                window.location.reload();
              });
            }}>確定全部重置</button>
            <button className="btn" onMouseDown={keepFocus} onClick={() => setConfirmReset(false)}>取消</button>
          </div>
        ) : (
          <button className="btn" onMouseDown={keepFocus} onClick={() => setConfirmReset(true)}>重置進度…</button>
        )}
      </section>
    </Modal>
  );
}

// 發音語音：預設自動選最清楚的語音；也可以自己挑（只列出適合學英文的語音）
function VoicePicker() {
  const voiceName = useSaveStore(s => s.settings.voiceName ?? '');
  const updateSettings = useSaveStore(s => s.updateSettings);
  const say = useSpeak();
  const [voices, setVoices] = useState(() => englishVoices());
  // 語音清單是非同步載入的，載好後更新
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const update = () => setVoices(englishVoices());
    window.speechSynthesis.addEventListener('voiceschanged', update);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', update);
  }, []);
  const auto = pickVoice(false);
  const sample = 'Good morning. I would like to make a reservation.';
  return (
    <div className="voice-picker">
      <label className="range">
        <span>發音語音</span>
        <select value={voiceName} onChange={e => updateSettings({ voiceName: e.target.value })} aria-label="發音語音">
          <option value="">自動（{auto?.name ?? '瀏覽器預設'}）</option>
          {voices.map(v => <option key={v.name} value={v.name}>{v.name}（{v.lang}）</option>)}
        </select>
      </label>
      <div className="feedback-actions">
        <button className="btn btn-small" onMouseDown={keepFocus} onClick={() => say(sample)}>▶ 試聽：正常速度</button>
        <button className="btn btn-small" onMouseDown={keepFocus} onClick={() => say(sample, true)}>🐢 試聽：慢速</button>
      </div>
      {voices.length === 0 && <p className="voice-error">這台裝置找不到英文語音，聽力題會改成顯示單字。可以到系統設定安裝英文語音（Mac：系統設定 → 輔助使用 → 語音內容；Windows：設定 → 時間與語言 → 語音）。</p>}
      <p className="muted voice-note">聽起來不自然的話，換一個語音試試。Mac 推薦 Samantha，Windows 推薦 Microsoft Aria／Jenny。</p>
    </div>
  );
}

function MicTest() {
  const [status, setStatus] = useState<'idle' | 'listening' | 'done' | 'error'>('idle');
  const [text, setText] = useState('');
  const recognizer = useRef<Recognizer | null>(null);

  useEffect(() => {
    recognizer.current = createRecognizer({
      onStart: () => { setStatus('listening'); setText(''); },
      onResult: (t) => { setStatus('done'); setText(t[0] ?? ''); },
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
