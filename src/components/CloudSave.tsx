import { useRef, useState } from 'react';
import {
  cloudEnabled, exportBackupFile, importSave, parseSaveCode, resolveConflict, sendLoginLink, signOut, summarize, uploadNow, useCloudStore,
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
      setSent(err ? `⚠️ ${err}` : `登入連結已寄到 ${email.trim()}，請到信箱點連結（會回到遊戲並自動登入）。`);
    };
    return (
      <>
        <p className="muted">登入後存檔會自動備份到雲端，換手機或電腦登入同一個 Email 就能接著玩。不登入也可以照常遊玩。</p>
        <form className="trial-input" onSubmit={e => { e.preventDefault(); void send(); }}>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="你的 Email" autoComplete="email" aria-label="Email" />
          <button className="btn btn-primary" type="submit" disabled={sending || !email.includes('@')}>{sending ? '寄送中…' : '寄送登入連結'}</button>
        </form>
        {sent && <p className={sent.startsWith('⚠️') ? 'voice-error' : 'req-ok'}>{sent}</p>}
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

// 備份檔：不需要登入的備份方式。下載成一個檔案，換裝置時再讀取這個檔案
export function BackupSection() {
  const [loaded, setLoaded] = useState<ReturnType<typeof parseSaveCode> | undefined>(undefined);
  const [msg, setMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const download = () => {
    const { name, text } = exportBackupFile();
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
    setMsg(`已下載「${name}」，請把這個檔案收好（可以存到雲端硬碟或傳給自己）`);
  };

  const pick = (file: File | undefined) => {
    setMsg('');
    if (!file) return;
    void file.text().then(text => setLoaded(parseSaveCode(text)), () => setLoaded(null));
  };

  return (
    <>
      <p className="muted">把整份存檔下載成一個備份檔，自己保存；換瀏覽器或裝置時，再讀取這個檔案還原。要在多台裝置之間同步，建議使用上面的雲端存檔。</p>
      <div className="feedback-actions">
        <button className="btn btn-small" onMouseDown={keepFocus} onClick={download}>📤 下載備份檔</button>
        <button className="btn btn-small" onMouseDown={keepFocus} onClick={() => { setLoaded(undefined); fileRef.current?.click(); }}>📥 讀取備份檔</button>
        <input ref={fileRef} type="file" accept=".json,application/json,text/plain" hidden
          onChange={e => { pick(e.target.files?.[0]); e.target.value = ''; }} aria-label="選擇備份檔" />
      </div>
      {loaded === null && <p className="voice-error">這個檔案無法讀取，請確認選的是遊戲下載的備份檔。</p>}
      {loaded && (
        <>
          <p>這份備份：<b>{describe(summarize(loaded.state))}</b>。讀取會取代目前的進度。</p>
          <div className="feedback-actions">
            <button className="btn btn-small btn-danger" onMouseDown={keepFocus} onClick={() => { void importSave(loaded).then(() => { setMsg('讀取完成！'); setLoaded(undefined); }); }}>確定讀取</button>
            <button className="btn btn-small" onMouseDown={keepFocus} onClick={() => setLoaded(undefined)}>取消</button>
          </div>
        </>
      )}
      {msg && <p className="req-ok">{msg}</p>}
    </>
  );
}
