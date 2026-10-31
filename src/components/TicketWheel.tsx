import { useState } from 'react';
import type { CSSProperties } from 'react';
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { useBattleStore } from '../store/battleStore';
import { WHEEL_PRIZES } from '../game/wheel';
import { TEN_PULL } from '../game/heroes';
import { sfx } from '../game/sfx';
import { keepFocus } from './keepFocus';

// 獎勵轉盤：破第 5、10、15、20 關（第一次）後出現。結果在按下「轉！」的瞬間就決定並存檔，
// 動畫只是演出（重新整理也不能重抽）。轉的時候點一下可以跳過動畫
const SEG = 360 / WHEEL_PRIZES.length;
const SPIN_MS = 3200;

export default function TicketWheel() {
  const pending = useSaveStore(s => s.wheelPending);
  const tickets = useSaveStore(s => s.tickets);
  const hidden = useUiStore(s => s.wheelHidden);
  const busy = useBattleStore(s => s.active && (s.phase === 'answering' || s.phase === 'casting' || s.phase === 'lesson'));
  // 慶祝畫面、劇情對話等視窗都結束了再出現
  const celebrating = useUiStore(s => s.celebrations.length > 0 || s.modal !== null);
  const [state, setState] = useState<'ready' | 'spinning' | 'done'>('ready');
  const [angle, setAngle] = useState(0);
  const [prize, setPrize] = useState(-1);
  const [instant, setInstant] = useState(false);
  const [timer, setTimer] = useState<number | undefined>(undefined);

  // 按下「轉！」時次數就扣掉了：轉動中（spinning）也要繼續顯示，不然最後一次會直接跳到結果
  if ((pending <= 0 && state === 'ready') || hidden || busy || celebrating) return null;

  const land = (idx: number) => {
    setState('done');
    const p = WHEEL_PRIZES[idx];
    if (p.id === 'none') sfx.click();
    else if ((p.tickets ?? 0) >= 3) sfx.victory();
    else sfx.coin();
  };

  const spin = () => {
    if (state === 'spinning') {
      // 跳過動畫
      window.clearTimeout(timer);
      setInstant(true);
      land(prize);
      return;
    }
    const idx = useSaveStore.getState().spinWheel();
    if (idx < 0) return;
    sfx.click();
    setPrize(idx);
    setInstant(false);
    // 指針在正上方：轉到這一格的中間，多轉幾圈；格子內稍微偏一點比較像真的
    const wobble = (Math.random() - 0.5) * SEG * 0.6;
    const target = 360 * 5 + (360 - (idx * SEG + SEG / 2)) + wobble;
    setAngle(a => a - (a % 360) + target);
    setState('spinning');
    setTimer(window.setTimeout(() => land(idx), SPIN_MS));
  };

  const again = () => { setState('ready'); setPrize(-1); };
  const close = () => {
    setState('ready');
    setPrize(-1);
    if (useSaveStore.getState().wheelPending > 0) useUiStore.getState().setWheelHidden(true);
  };

  const won = prize >= 0 ? WHEEL_PRIZES[prize] : null;
  const toTen = Math.max(0, TEN_PULL - tickets);
  const style = { '--angle': `${angle}deg`, '--spin-ms': instant ? '0ms' : `${SPIN_MS}ms` } as CSSProperties;
  const gradient = `conic-gradient(${WHEEL_PRIZES.map((p, i) => `${p.color} ${i * SEG}deg ${(i + 1) * SEG}deg`).join(', ')})`;

  return (
    <div className="wheel-overlay" role="dialog" aria-label="獎勵轉盤">
      <div className="wheel-card">
        <p className="wheel-title">🎡 獎勵轉盤{pending > 0 && state !== 'done' ? ` ×${pending}` : ''}</p>
        <p className="muted wheel-sub">破關獎勵！轉轉看能拿到什麼</p>
        <div className="wheel-stage" onClick={state === 'spinning' ? spin : undefined}>
          <span className="wheel-pointer" aria-hidden>▼</span>
          <div className="wheel" style={{ ...style, background: gradient }}>
            {WHEEL_PRIZES.map((p, i) => (
              <span key={p.id} className="wheel-label" style={{ '--a': `${i * SEG + SEG / 2}deg` } as CSSProperties}>
                {/* 下半圈的字翻過來，停下時不會是倒的 */}
                <span className={i * SEG + SEG / 2 > 90 && i * SEG + SEG / 2 < 270 ? 'wheel-text is-flip' : 'wheel-text'}><b>{p.icon}</b>{p.label}</span>
              </span>
            ))}
          </div>
          <span className="wheel-hub" aria-hidden>★</span>
        </div>
        {state === 'done' && won ? (
          <div className={`wheel-result ${won.id === 'none' ? '' : 'is-win'}`}>
            <p className="wheel-prize">{won.id === 'none' ? `${won.icon} 銘謝惠顧，送你 🪙 ${won.gold}` : `🎉 抽中 ${won.icon} ${won.label}！`}</p>
            <p className="muted">🎫 召喚券 {tickets} 張{toTen > 0 ? `，再 ${toTen} 張就能十連` : '，可以十連召喚了！'}</p>
            <div className="tutorial-actions">
              {pending > 0
                ? <button className="btn btn-primary" onMouseDown={keepFocus} onClick={again}>再轉一次（還有 {pending} 次）</button>
                : <button className="btn btn-primary" onMouseDown={keepFocus} onClick={close}>收下</button>}
            </div>
            {won.id !== 'none' && Array.from({ length: 16 }, (_, i) => (
              <i key={i} className="confetti" aria-hidden style={{ '--x': `${(i * 41) % 100}%`, '--d': `${(i % 5) * 0.1}s`, '--c': ['#ffcd4b', '#ff5af0', '#7fe8ff', '#5fd36b'][i % 4] } as CSSProperties} />
            ))}
          </div>
        ) : (
          <div className="tutorial-actions">
            {state === 'ready' && <button className="btn btn-ghost" onMouseDown={keepFocus} onClick={close}>稍後再轉</button>}
            <button className="btn btn-primary wheel-go" onMouseDown={keepFocus} onClick={spin}>{state === 'spinning' ? '跳過 ⏭' : '轉！'}</button>
          </div>
        )}
      </div>
    </div>
  );
}
