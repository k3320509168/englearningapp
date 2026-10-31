import { useEffect } from 'react';
import type { CSSProperties } from 'react';
import { useUiStore } from '../store/uiStore';
import { useBattleStore } from '../store/battleStore';
import { sfx } from '../game/sfx';

// 全螢幕慶祝：重大時刻排隊依序顯示，點一下或 3 秒後自動關閉。
// 作答中不打斷（例如答題時升級），等這隻怪物倒下或結算時才出現。
// 例外：blocking 的規則說明（女神的祝福、首領登場）馬上出現、不會自動消失，計時暫停到玩家點一下
export default function CelebrationOverlay() {
  const current = useUiStore(s => s.celebrations[0]);
  const dismiss = useUiStore(s => s.dismissCelebration);
  const busy = useBattleStore(s => s.active && (s.phase === 'answering' || s.phase === 'casting'));
  const show = current && (!busy || current.blocking);

  useEffect(() => {
    if (!show) return;
    sfx.victory();
    const t = current.blocking ? 0 : window.setTimeout(dismiss, 3200);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); dismiss(); } };
    window.addEventListener('keydown', onKey, true);
    return () => { window.clearTimeout(t); window.removeEventListener('keydown', onKey, true); };
  }, [show, current, dismiss]);

  if (!show) return null;
  return (
    <div className="celebrate" role="alert" onClick={dismiss} style={{ '--glow': current.color ?? '#ffcd4b' } as CSSProperties}>
      <div className="celebrate-rays" aria-hidden />
      <div className="celebrate-card">
        {current.img ? <img className="celebrate-img" src={current.img} alt="" /> : <span className="celebrate-icon" aria-hidden>{current.icon}</span>}
        <p className="celebrate-title">{current.img && <span aria-hidden>{current.icon} </span>}{current.title}</p>
        {current.sub && <p className="celebrate-sub">{current.sub}</p>}
        <small className={current.blocking ? 'celebrate-tap' : 'muted'}>{current.blocking ? '⏸ 計時暫停中・點一下開始' : '點一下繼續'}</small>
      </div>
      {Array.from({ length: 18 }, (_, i) => (
        <i key={i} className="confetti" aria-hidden style={{ '--x': `${(i * 37) % 100}%`, '--d': `${(i % 6) * 0.12}s`, '--c': ['#ffcd4b', '#ff5af0', '#7fe8ff', '#5fd36b', '#ffffff'][i % 5] } as CSSProperties} />
      ))}
    </div>
  );
}
