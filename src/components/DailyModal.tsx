import { useEffect } from 'react';
import Modal from './Modal';
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { dailyDef } from '../game/daily';
import { sfx } from '../game/sfx';
import { keepFocus } from './keepFocus';

// 每日任務：每天 3 項，完成後領取獎勵；顯示連續登入天數
export default function DailyModal() {
  const closeModal = useUiStore(s => s.closeModal);
  const daily = useSaveStore(s => s.daily);
  const { ensureDaily, claimDaily } = useSaveStore.getState();
  useEffect(() => { ensureDaily(); }, [ensureDaily]);
  if (!daily) return null;

  return (
    <Modal title="📅 每日任務" onClose={closeModal}>
      <p className="shop-gold">🔥 連續登入 <b>{daily.streak}</b> 天 <span className="muted">（每天午夜換新任務）</span></p>
      <ul className="daily-list">
        {daily.tasks.map(t => {
          const def = dailyDef(t.id);
          if (!def) return null;
          const done = t.progress >= def.goal;
          return (
            <li key={t.id} className={`daily-item ${t.claimed ? 'is-claimed' : done ? 'is-done' : ''}`}>
              <div className="daily-info">
                <b>{def.label}</b>
                <span className="daily-track"><span style={{ width: `${(t.progress / def.goal) * 100}%` }} /></span>
                <small className="muted">{t.progress} / {def.goal}・獎勵 🪙{def.reward.gold}{def.reward.tickets ? ` 🎫×${def.reward.tickets}` : ''}</small>
              </div>
              {t.claimed ? <span className="hero-tag">已領取</span> : (
                <button className="btn btn-small btn-primary" onMouseDown={keepFocus} disabled={!done}
                  onClick={() => { if (claimDaily(t.id)) sfx.coin(); }}>{done ? '領取' : '進行中'}</button>
              )}
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
