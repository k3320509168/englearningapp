import { useEffect, useRef, useState } from 'react';
import Modal from './Modal';
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { SLOW_RATE, createRecognizer, englishVoices, isSpeechRecognitionSupported, pickVoice, recognitionErrorText } from '../game/speech';
import type { Recognizer } from '../game/speech';
import { useSpeak } from './useSpeak';
import { sfx } from '../game/sfx';
import { keepFocus } from './keepFocus';
import { useSpeechJam } from './useSpeechJam';
import { CloudLoginError, CloudSection, BackupSection } from './CloudSave';
import { forgetCloudForReset } from '../cloud/cloudSave';

const TEXT_SCALES: [number, string][] = [[1, '標準'], [1.15, '大'], [1.3, '特大']];

// 設定分成五類（第二十一輪 E6）：桌機左側分類、手機上方一排；標題與關閉按鈕固定，只有內容捲動
type SettingTab = 'sound' | 'voice' | 'display' | 'save' | 'advanced';
const SETTING_TABS: { id: SettingTab; icon: string; label: string; short: string }[] = [
  { id: 'sound', icon: '🔊', label: '聲音音效', short: '聲音' },
  { id: 'voice', icon: '🗣️', label: '語音學習', short: '語音' },
  { id: 'display', icon: '👁️', label: '顯示操作', short: '操作' },
  { id: 'save', icon: '💾', label: '存檔帳號', short: '存檔' },
  { id: 'advanced', icon: '⚠️', label: '進階選項', short: '進階' },
];

export default function SettingsModal() {
  const settings = useSaveStore(s => s.settings);
  const updateSettings = useSaveStore(s => s.updateSettings);
  const resetProgress = useSaveStore(s => s.resetProgress);
  const { closeModal, openModal } = useUiStore();
  const [confirmReset, setConfirmReset] = useState(false);
  const [tab, setTab] = useState<SettingTab>('sound');

  return (
    <Modal title="⚙️ 設定" onClose={closeModal} wide>
      <CloudLoginError />
      <div className="settings-layout">
        <nav className="settings-nav" aria-label="設定分類">
          {SETTING_TABS.map(t => (
            <button
              key={t.id}
              className={`settings-tab ${tab === t.id ? 'is-on' : ''}`}
              aria-current={tab === t.id}
              onMouseDown={keepFocus}
              onClick={() => { sfx.click(); setTab(t.id); }}
            >
              <span aria-hidden>{t.icon}</span>
              <span className="tab-text-full">{t.label}</span>
              <span className="tab-text-short">{t.short}</span>
            </button>
          ))}
        </nav>
        <div className="settings-content">
          {tab === 'sound' && (
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
            </section>
          )}
          {tab === 'voice' && (
            <>
              <section className="settings-group">
                <h3>🗣️ 發音語音</h3>
                <VoicePicker />
                <label className="check">
                  <input type="checkbox" checked={settings.autoSpeak} onChange={e => updateSettings({ autoSpeak: e.target.checked })} />
                  出題時自動播放發音
                </label>
              </section>
              <section className="settings-group">
                <h3>🎤 麥克風</h3>
                <MicTest />
                <label className="check">
                  <input type="checkbox" checked={settings.voiceAsSpelling} onChange={e => updateSettings({ voiceAsSpelling: e.target.checked })} />
                  暫時不用麥克風：口說題改成拼寫題（下一次進入關卡生效）
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
            </>
          )}
          {tab === 'display' && (
            <section className="settings-group">
              <h3>👁️ 顯示與操作</h3>
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
              <p className="muted">鍵盤：選擇題按 A～D、Enter 下一步、Esc 關閉視窗或撤退；拼寫題直接打字。</p>
            </section>
          )}
          {tab === 'save' && (
            <>
              <section className="settings-group">
                <h3>☁️ 雲端存檔</h3>
                <CloudSection />
              </section>
              <section className="settings-group">
                <h3>💾 存檔備份</h3>
                <BackupSection />
              </section>
            </>
          )}
          {tab === 'advanced' && (
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
          )}
        </div>
      </div>
    </Modal>
  );
}

// 發音語音：預設自動選最清楚的語音；也可以自己挑（只列出適合學英文的語音）
function VoicePicker() {
  const voiceName = useSaveStore(s => s.settings.voiceName ?? '');
  const updateSettings = useSaveStore(s => s.updateSettings);
  const say = useSpeak();
  const jammed = useSpeechJam();
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
      <div className="voice-select-wrap">
        <label htmlFor="voice-select" className="voice-select-label">選擇英文發音引擎：</label>
        <select id="voice-select" value={voiceName} onChange={e => updateSettings({ voiceName: e.target.value })} aria-label="發音語音">
          <option value="">自動最佳（{auto?.name ?? '瀏覽器預設'}）</option>
          {voices.map(v => <option key={v.name} value={v.name}>{v.name}（{v.lang}）</option>)}
        </select>
      </div>
      <div className="voice-test-box">
        <div className="voice-test-header">
          <span className="voice-test-title">🎧 語音發音試聽：</span>
          <span className="muted" style={{ fontSize: 11.5 }}>可驗證正常與慢速朗讀效果</span>
        </div>
        <div className="feedback-actions">
          <button className="btn btn-small btn-primary" onMouseDown={keepFocus} onClick={() => { sfx.click(); say(sample); }}>▶ 試聽：正常速度</button>
          <button className="btn btn-small" onMouseDown={keepFocus} onClick={() => { sfx.click(); say(sample, true); }}>🐢 試聽：慢速</button>
        </div>
        {jammed && <p className="q-silent">⚠️ 瀏覽器的發音引擎卡住了，按試聽也不會出聲。請重新整理頁面；還是不行，請完全關閉瀏覽器（Mac 按 Cmd+Q）再打開。</p>}
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
      onError: (err) => { setStatus('error'); setText(recognitionErrorText(err)); },
      onEnd: () => setStatus(s => (s === 'listening' ? 'idle' : s)),
    });
    return () => recognizer.current?.stop();
  }, []);

  if (!isSpeechRecognitionSupported()) {
    const isHttps = typeof window !== 'undefined' && window.isSecureContext;
    return (
      <div className="mic-notice-box">
        <p className="muted" style={{ margin: 0, lineHeight: 1.6 }}>
          {!isHttps
            ? '💡 局域網 HTTP 開發預覽下，瀏覽器安全規範限制麥克風；上架至正式 HTTPS 網站後 Chrome 將全功能支援語音辨識！目前已提供拼寫模式保障順暢闖關。'
            : '這個瀏覽器目前不支援語音辨識，口說題會自動改成拼寫題。建議使用 Chrome 或 Edge。'}
        </p>
      </div>
    );
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
