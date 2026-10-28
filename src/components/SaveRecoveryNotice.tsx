import { useState } from 'react';
import { SAVE_RECOVERY_KEY } from '../store/saveStore';
import { keepFocus } from './keepFocus';

// 讀檔時發現存檔損毀：原始資料已備份到另一個 key，這裡告訴玩家並提供複製
export default function SaveRecoveryNotice() {
  const [backupKey, setBackupKey] = useState(() => {
    try { return localStorage.getItem(SAVE_RECOVERY_KEY); } catch { return null; }
  });
  const [copied, setCopied] = useState(false);
  if (!backupKey) return null;
  const dismiss = () => {
    try { localStorage.removeItem(SAVE_RECOVERY_KEY); } catch { /* 略過 */ }
    setBackupKey(null);
  };
  const copy = () => {
    let raw = '';
    try { raw = localStorage.getItem(backupKey) ?? ''; } catch { /* 略過 */ }
    void navigator.clipboard?.writeText(raw).then(() => setCopied(true));
  };
  return (
    <div className="recovery-notice" role="alert">
      <p>⚠️ 這台裝置上的存檔資料損毀，無法讀取，所以遊戲從頭開始。原本的資料已經另外備份，沒有被刪除。
        如果有登入雲端存檔，登入後可以下載雲端的進度；也可以複製備份資料交給開發者協助還原。</p>
      <div className="feedback-actions">
        <button className="btn btn-small" onMouseDown={keepFocus} onClick={copy}>{copied ? '已複製' : '複製損毀的資料'}</button>
        <button className="btn btn-small btn-primary" onMouseDown={keepFocus} onClick={dismiss}>知道了</button>
      </div>
    </div>
  );
}
