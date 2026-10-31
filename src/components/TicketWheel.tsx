import { useEffect, useState } from 'react';
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
// 扇區大小照實際機率（避免以為每一格都是 20%）；太小的格子只放圖示，名稱看下方圖例
const TOTAL = WHEEL_PRIZES.reduce((sum, p) => sum + p.weight, 0);
const SECTORS = WHEEL_PRIZES.reduce<{ from: number; to: number }[]>((acc, p) => {
  const from = acc.length ? acc[acc.length - 1].to : 0;
  return [...acc, { from, to: from + (p.weight / TOTAL) * 360 }];
}, []);
const mid = (i: number) => (SECTORS[i].from + SECTORS[i].to) / 2;
const width = (i: number) => SECTORS[i].to - SECTORS[i].from;
const SPIN_MS = 3200;
const BULBS = 16;

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

  // 鍵盤：Enter／空白鍵＝轉、跳過、收下（或再轉一次）
  const visible = !((pending <= 0 && state === 'ready') || hidden || busy || celebrating);
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault(); e.stopImmediatePropagation();
      // 按下畫面上的主要按鈕（轉／跳過／收下／再轉一次）
      document.querySelector<HTMLButtonElement>('.wheel-card .wheel-go')?.click();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [visible]);

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
    const wobble = (Math.random() - 0.5) * width(idx) * 0.6;
    const target = 360 * 5 + (360 - mid(idx)) + wobble;
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
  // 每格之間留一條深色分隔線
  const gradient = `conic-gradient(${WHEEL_PRIZES.map((p, i) => `#101127 ${SECTORS[i].from}deg ${SECTORS[i].from + 1.4}deg, ${p.color} ${SECTORS[i].from + 1.4}deg ${SECTORS[i].to}deg`).join(', ')})`;

  return (
    <div className="wheel-overlay" role="dialog" aria-label="獎勵轉盤">
      <div className={`wheel-card is-${state}`}>
        <p className="wheel-title"><span>🎡 獎勵轉盤{pending > 0 && state !== 'done' ? ` ×${pending}` : ''}</span></p>
        <p className="wheel-sub">破關獎勵！轉轉看能拿到什麼</p>
        <div className="wheel-stage" onClick={state === 'spinning' ? spin : undefined}>
          {/* 外圈的跑馬燈：轉的時候跑得快、停下來一起閃 */}
          <div className="wheel-bulbs" aria-hidden>
            {Array.from({ length: BULBS }, (_, i) => <i key={i} style={{ '--b': `${(i * 360) / BULBS}deg`, '--i': i } as CSSProperties} />)}
          </div>
          <span className="wheel-pointer" aria-hidden />
          <div className="wheel" style={{ ...style, background: gradient }}>
            {WHEEL_PRIZES.map((p, i) => (
              <span key={p.id} className="wheel-label" style={{ '--a': `${mid(i)}deg` } as CSSProperties}>
                {/* 下半圈的字翻過來，停下時不會是倒的 */}
                <span className={mid(i) > 90 && mid(i) < 270 ? 'wheel-text is-flip' : 'wheel-text'}><b>{p.icon}</b>{width(i) >= 40 && p.label}</span>
              </span>
            ))}
          </div>
          <span className="wheel-hub" aria-hidden>★</span>
        </div>
        <ul className="wheel-legend">
          {WHEEL_PRIZES.map(p => <li key={p.id}><i style={{ background: p.color }} />{p.icon} {p.id === 'none' ? `銘謝惠顧（🪙${p.gold}）` : p.label} <small>{Math.round((p.weight / TOTAL) * 100)}%</small></li>)}
        </ul>
        <div className="wheel-bottom">
          {state === 'done' && won ? (
            <div className={`wheel-result ${won.id === 'none' ? '' : 'is-win'}`}>
              <p className="wheel-prize">{won.id === 'none' ? `${won.icon} 銘謝惠顧・送你 🪙 ${won.gold}` : `${won.icon} ${won.label}！`}</p>
              <p className="wheel-note">🎫 召喚券 {tickets} 張{toTen > 0 ? `・再 ${toTen} 張就能十連` : '・可以十連召喚了！'}</p>
              {pending > 0
                ? <button className="btn btn-primary wheel-go" onMouseDown={keepFocus} onClick={again}>再轉一次（還有 {pending} 次）</button>
                : <button className="btn btn-primary wheel-go" onMouseDown={keepFocus} onClick={close}>收下 ⏎</button>}
              {won.id !== 'none' && Array.from({ length: 16 }, (_, i) => (
                <i key={i} className="confetti" aria-hidden style={{ '--x': `${(i * 41) % 100}%`, '--d': `${(i % 5) * 0.1}s`, '--c': ['#ffcd4b', '#ff5af0', '#7fe8ff', '#5fd36b'][i % 4] } as CSSProperties} />
              ))}
            </div>
          ) : (
            <div className="wheel-actions">
              <button className="btn btn-primary wheel-go" onMouseDown={keepFocus} onClick={spin}>{state === 'spinning' ? '跳過 ⏭' : '轉！'}</button>
              {state === 'ready' && <button className="btn btn-ghost btn-small" onMouseDown={keepFocus} onClick={close}>稍後再轉</button>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
