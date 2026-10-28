import { useState } from 'react';
import {
  cloudEnabled, exportSaveCode, importSave, parseSaveCode, resolveConflict, sendLoginLink, signOut, summarize, uploadNow, useCloudStore,
} from '../cloud/cloudSave';
import type { SaveSummary } from '../cloud/cloudSave';
import { REGIONS } from '../game/regions';
import { keepFocus } from './keepFocus';

const timeText = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleString('zh-TW', { hour12: false }) : '—');
const describe = (s: SaveSummary) => `${s.name}・Lv ${s.level}・${REGIONS[Math.min(s.regions, REGIONS.length - 1)]?.name ?? ''}・🪙${s.gold}`;

// 設定裡的「雲端存檔」：Email 登入連結、同步狀態、手動上傳、登出
// 登入連結失敗的提示（設定視窗最上方與雲端存檔區都會顯示）
export function CloudLoginError() {
  const loginError = useCloudStore(s => s.loginError);
  if (!loginError) return null;
  return (
    <p className="login-error" role="alert">
      <span>⚠️ {loginError}</span>
      <button className="btn btn-ghost btn-small" onMouseDown={keepFocus} onClick={() => useCloudStore.setState({ loginError: '' })}>知道了</button>
    </p>
  );
}

export function CloudSection() {
  const { status, user, lastSync, error } = useCloudStore();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  if (!cloudEnabled) return <p className="muted">雲端存檔還沒有設定（需要在 .env.local 填入 Supabase 連線資訊）。</p>;

  if (!user) {
    const send = async () => {
      if (!email.includes('@')) return;
      setSending(true);
      const err = await sendLoginLink(email.trim());
      setSending(false);
      setSent(err ? `寄送失敗：${err}` : `登入連結已寄到 ${email.trim()}，請到信箱點連結（會回到遊戲並自動登入）。`);
    };
    return (
      <>
        <p className="muted">登入後存檔會自動備份到雲端，換手機或電腦登入同一個 Email 就能接著玩。不登入也可以照常遊玩。</p>
        <form className="trial-input" onSubmit={e => { e.preventDefault(); void send(); }}>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="你的 Email" autoComplete="email" aria-label="Email" />
          <button className="btn btn-primary" type="submit" disabled={sending || !email.includes('@')}>{sending ? '寄送中…' : '寄送登入連結'}</button>
        </form>
        {sent && <p className={sent.startsWith('寄送失敗') ? 'voice-error' : 'req-ok'}>{sent}</p>}
      </>
    );
  }

  return (
    <>
      <p>已登入：<b>{user.email}</b></p>
      <p className="muted">
        {status === 'syncing' ? '☁️ 同步中…' : status === 'error' ? `⚠️ 同步失敗：${error}` : status === 'conflict' ? '⚠️ 雲端與這台裝置的進度不同，請選擇要保留哪一份' : `✅ 已同步（${timeText(lastSync)}）`}
      </p>
      <div className="feedback-actions">
        <button className="btn btn-small" onMouseDown={keepFocus} onClick={() => void uploadNow()} disabled={status === 'syncing' || status === 'conflict'}>☁️ 立即上傳</button>
        <button className="btn btn-small btn-ghost" onMouseDown={keepFocus} onClick={() => void signOut()}>登出</button>
      </div>
    </>
  );
}

// 兩邊都有新進度時跳出：讓玩家選要保留哪一份（另一份會被覆蓋）
export function CloudConflict() {
  const conflict = useCloudStore(s => s.conflict);
  const [busy, setBusy] = useState(false);
  if (!conflict) return null;
  const choose = async (keep: 'local' | 'cloud') => { setBusy(true); await resolveConflict(keep); setBusy(false); };
  return (
    <div className="modal-backdrop">
      <div className="modal" role="dialog" aria-label="選擇要保留的存檔">
        <header className="modal-head"><h2>☁️ 選擇要保留的存檔</h2></header>
        <div className="modal-body">
          <p>雲端和這台裝置都有新的進度，請選一份保留（另一份會被覆蓋）：</p>
          <div className="conflict-grid">
            <button className="conflict-card" disabled={busy} onMouseDown={keepFocus} onClick={() => void choose('cloud')}>
              <b>☁️ 雲端的存檔</b><span>{describe(conflict.cloud)}</span><small className="muted">最後更新 {timeText(conflict.cloud.updatedAt)}</small>
            </button>
            <button className="conflict-card" disabled={busy} onMouseDown={keepFocus} onClick={() => void choose('local')}>
              <b>💻 這台裝置的存檔</b><span>{describe(conflict.local)}</span><small className="muted">選這份會上傳並取代雲端</small>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 存檔碼：不需要登入的備份方式
export function SaveCodeSection() {
  const [code, setCode] = useState('');
  const [mode, setMode] = useState<'idle' | 'export' | 'import'>('idle');
  const [msg, setMsg] = useState('');
  const pasted = mode === 'import' ? parseSaveCode(code) : null;

  return (
    <>
      <p className="muted">把整份存檔轉成一段文字，可以自己保存備份，或貼到別的瀏覽器還原。</p>
      <div className="feedback-actions">
        <button className="btn btn-small" onMouseDown={keepFocus} onClick={() => { setCode(exportSaveCode()); setMode('export'); setMsg(''); }}>📤 匯出存檔碼</button>
        <button className="btn btn-small" onMouseDown={keepFocus} onClick={() => { setCode(''); setMode('import'); setMsg(''); }}>📥 匯入存檔碼</button>
      </div>
      {mode !== 'idle' && (
        <textarea className="save-code" value={code} readOnly={mode === 'export'} onChange={e => setCode(e.target.value)}
          placeholder="把存檔碼貼在這裡" rows={4} onFocus={e => mode === 'export' && e.target.select()} aria-label="存檔碼" />
      )}
      {mode === 'export' && (
        <button className="btn btn-small btn-primary" onMouseDown={keepFocus}
          onClick={() => { void navigator.clipboard?.writeText(code).then(() => setMsg('已複製到剪貼簿'), () => setMsg('請手動選取並複製')); }}>📋 複製</button>
      )}
      {mode === 'import' && code.trim() && (
        pasted ? (
          <>
            <p>這份存檔：<b>{describe(summarize(pasted.state))}</b>。匯入會取代目前的進度。</p>
            <button className="btn btn-small btn-danger" onMouseDown={keepFocus} onClick={() => { void importSave(pasted).then(() => { setMsg('匯入完成！'); setMode('idle'); }); }}>確定匯入</button>
          </>
        ) : <p className="voice-error">這段存檔碼無法讀取，請確認有完整貼上。</p>
      )}
      {msg && <p className="req-ok">{msg}</p>}
    </>
  );
}
