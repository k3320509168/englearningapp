import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { keepFocus } from './keepFocus';

// 共用彈出視窗：點背景或按 Esc 關閉
export default function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); onClose(); }
    };
    // capture：比戰鬥介面的鍵盤處理先收到，避免 Esc 同時讓玩家撤退
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()}>
        <header className="modal-head">
          <h2>{title}</h2>
          <button className="btn btn-ghost btn-small" onMouseDown={keepFocus} onClick={onClose} aria-label="關閉">✕</button>
        </header>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
