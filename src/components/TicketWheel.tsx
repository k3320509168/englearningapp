import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { useBattleStore } from '../store/battleStore';
import { WHEEL_PRIZES } from '../game/wheel';
import { TEN_PULL } from '../game/heroes';
import { sfx } from '../game/sfx';
import { keepFocus } from './keepFocus';

// 獎勵轉盤：破第 5、10、15、20 關（第一次）後出現。
// 結果在按下「轉！」的瞬間決定並存檔，動畫為視覺演出。
const TOTAL = WHEEL_PRIZES.reduce((sum, p) => sum + p.weight, 0);
const SECTORS = WHEEL_PRIZES.reduce<{ from: number; to: number }[]>((acc, p) => {
  const from = acc.length ? acc[acc.length - 1].to : 0;
  return [...acc, { from, to: from + (p.weight / TOTAL) * 360 }];
}, []);
const mid = (i: number) => (SECTORS[i].from + SECTORS[i].to) / 2;
const width = (i: number) => SECTORS[i].to - SECTORS[i].from;
const SPIN_MS = 3400;
const BULBS = 20;

// 計算 SVG 精準扇形路徑
function sectorPath(cx: number, cy: number, r: number, a1: number, a2: number): string {
  const d2r = (deg: number) => (deg * Math.PI) / 180;
  const pt = (deg: number) => [cx + r * Math.sin(d2r(deg)), cy - r * Math.cos(d2r(deg))];
  const diff = a2 - a1;
  const p1 = pt(a1);
  const p2 = pt(a2);
  if (diff >= 180) {
    const midPt = pt(a1 + diff / 2);
    return `M ${cx} ${cy} L ${p1[0].toFixed(2)} ${p1[1].toFixed(2)} A ${r} ${r} 0 0 1 ${midPt[0].toFixed(2)} ${midPt[1].toFixed(2)} A ${r} ${r} 0 0 1 ${p2[0].toFixed(2)} ${p2[1].toFixed(2)} Z`;
  }
  return `M ${cx} ${cy} L ${p1[0].toFixed(2)} ${p1[1].toFixed(2)} A ${r} ${r} 0 0 1 ${p2[0].toFixed(2)} ${p2[1].toFixed(2)} Z`;
}

export default function TicketWheel() {
  const pending = useSaveStore(s => s.wheelPending);
  const tickets = useSaveStore(s => s.tickets);
  const hidden = useUiStore(s => s.wheelHidden);
  const busy = useBattleStore(s => s.active && (s.phase === 'answering' || s.phase === 'casting' || s.phase === 'lesson'));
  const celebrating = useUiStore(s => s.celebrations.length > 0 || s.modal !== null);
  const [state, setState] = useState<'ready' | 'spinning' | 'done'>('ready');
  const [angle, setAngle] = useState(0);
  const [prize, setPrize] = useState(-1);
  const [instant, setInstant] = useState(false);
  const [timer, setTimer] = useState<number | undefined>(undefined);

  // 鍵盤操作：Enter／空白鍵
  const visible = !((pending <= 0 && state === 'ready') || hidden || busy || celebrating);
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault(); e.stopImmediatePropagation();
      document.querySelector<HTMLButtonElement>('.wheel-card .wheel-go')?.click();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [visible]);

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
    // 指針在 12 點鐘（0 度），目標為 (360 - mid(idx))
    const wobble = (Math.random() - 0.5) * Math.min(width(idx) * 0.5, 12);
    const target = 360 * 6 + (360 - mid(idx)) + wobble;
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
  const rotatorStyle = {
    transform: `rotate(${angle}deg)`,
    transition: instant ? 'none' : `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.75, 0.1, 1)`,
  } as CSSProperties;

  return (
    <div className="wheel-overlay" role="dialog" aria-label="獎勵轉盤">
      <div className={`wheel-card is-${state}`}>
        <div className="wheel-header">
          <p className="wheel-title">
            <span>🎡 冒險獎勵轉盤{pending > 0 && state !== 'done' ? ` ×${pending}` : ''}</span>
          </p>
          <p className="wheel-sub">通關大吉！快試試今天的手氣吧</p>
        </div>

        <div className="wheel-stage" onClick={state === 'spinning' ? spin : undefined}>
          {/* 外圈街機跑馬燈 */}
          <div className="wheel-bulbs" aria-hidden>
            {Array.from({ length: BULBS }, (_, i) => (
              <i
                key={i}
                className={i % 2 === 0 ? 'bulb-gold' : 'bulb-ruby'}
                style={{ '--b': `${(i * 360) / BULBS}deg`, '--i': i } as CSSProperties}
              />
            ))}
          </div>

          {/* 像素指針（固定在正上方 12 點鐘位置，附帶跳動微動畫） */}
          <div className="wheel-pointer-container" aria-hidden>
            <div className={`wheel-pointer ${state === 'spinning' ? 'is-ticking' : ''}`}>
              <span className="pointer-gem" />
            </div>
          </div>

          {/* 轉盤主體（使用 SVG 渲染精準扇區與放射狀居中排版） */}
          <div className="wheel-rotator" style={rotatorStyle}>
            <svg viewBox="0 0 300 300" className="wheel-svg" aria-hidden>
              <defs>
                <filter id="pixelShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="1" floodColor="#090a18" floodOpacity="0.8" />
                </filter>
                <radialGradient id="rimGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="85%" stopColor="transparent" />
                  <stop offset="98%" stopColor="rgba(255, 215, 0, 0.25)" />
                  <stop offset="100%" stopColor="rgba(255, 215, 0, 0.4)" />
                </radialGradient>
              </defs>

              {/* 轉盤底盤金屬外圈 */}
              <circle cx="150" cy="150" r="147" fill="#0f1124" stroke="#ffd15c" strokeWidth="5" />
              <circle cx="150" cy="150" r="143" fill="#1b1e3d" stroke="#0f1124" strokeWidth="3" />

              {/* 各扇區 */}
              {WHEEL_PRIZES.map((p, i) => (
                <path
                  key={p.id}
                  d={sectorPath(150, 150, 140, SECTORS[i].from, SECTORS[i].to)}
                  fill={p.color}
                  stroke="#0f1124"
                  strokeWidth="3.5"
                />
              ))}

              {/* 扇區表面光影與刻度線 */}
              <circle cx="150" cy="150" r="140" fill="url(#rimGlow)" pointerEvents="none" />

              {/* 扇區文字與圖示（嚴格沿半徑方向居中，保證任何時候均勻工整） */}
              {WHEEL_PRIZES.map((p, i) => {
                const m = mid(i);
                const w = width(i);
                return (
                  <g key={`lbl-${p.id}`} transform={`rotate(${m}, 150, 150)`}>
                    {/* 圖示 */}
                    <text
                      x="150"
                      y={w >= 40 ? 52 : 56}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={w >= 40 ? 22 : 18}
                      filter="url(#pixelShadow)"
                    >
                      {p.icon}
                    </text>
                    {/* 標籤文字 */}
                    {w >= 35 ? (
                      <text
                        x="150"
                        y="80"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={w >= 50 ? 13 : 11}
                        fontWeight="bold"
                        fill="#ffffff"
                        stroke="#0f1124"
                        strokeWidth="3"
                        paintOrder="stroke fill"
                      >
                        {p.label}
                      </text>
                    ) : (
                      <text
                        x="150"
                        y="78"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="12"
                        fontWeight="bold"
                        fill="#ffd15c"
                        stroke="#0f1124"
                        strokeWidth="3"
                        paintOrder="stroke fill"
                      >
                        ×5
                      </text>
                    )}
                  </g>
                );
              })}

              {/* 中心軸金屬固定圈 */}
              <circle cx="150" cy="150" r="28" fill="#0f1124" stroke="#ffd15c" strokeWidth="3" />
              <circle cx="150" cy="150" r="23" fill="#e5a11c" stroke="#ffe27a" strokeWidth="2" />
              <circle cx="150" cy="150" r="18" fill="#ffd15c" />
              <text x="150" y="152" textAnchor="middle" dominantBaseline="central" fontSize="16" fill="#613c04" fontWeight="bold">★</text>
            </svg>
          </div>
        </div>

        {/* 獎品一覽與機率看板（卡片式像素面板，清晰大方） */}
        <div className="wheel-odds-board">
          <div className="wheel-odds-title">★ 轉盤獎品與獲得機率 ★</div>
          <div className="wheel-odds-grid">
            {WHEEL_PRIZES.map(p => (
              <div
                key={p.id}
                className={`wheel-odds-chip ${p.id === 't5' ? 'is-jackpot' : ''}`}
                style={{ '--accent-c': p.color } as CSSProperties}
              >
                <span className="wheel-odds-icon">{p.icon}</span>
                <span className="wheel-odds-label">{p.id === 'none' ? `金幣 🪙${p.gold}` : p.label}</span>
                <span className="wheel-odds-rate">{Math.round((p.weight / TOTAL) * 100)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* 底部操作或結算 */}
        <div className="wheel-bottom">
          {state === 'done' && won ? (
            <div className={`wheel-result ${won.id === 'none' ? '' : 'is-win'}`}>
              <div className="wheel-prize-banner">
                <span className="wheel-prize-text">
                  {won.id === 'none' ? `${won.icon} 銘謝惠顧・贈送安慰金 🪙 +${won.gold}` : `🎉 恭喜獲得 ${won.icon} ${won.label}！`}
                </span>
              </div>
              <p className="wheel-note">
                🎫 召喚券目前擁有 <b>{tickets}</b> 張{toTen > 0 ? `（再 ${toTen} 張即可十連抽！）` : '（已經可以進行十連召喚囉！）'}
              </p>
              {pending > 0 ? (
                <button className="btn btn-primary wheel-go" onMouseDown={keepFocus} onClick={again}>
                  再轉一次（剩餘 {pending} 次）
                </button>
              ) : (
                <button className="btn btn-primary wheel-go" onMouseDown={keepFocus} onClick={close}>
                  開心收下 ⏎
                </button>
              )}
              {won.id !== 'none' && Array.from({ length: 24 }, (_, i) => (
                <i
                  key={i}
                  className="confetti"
                  aria-hidden
                  style={{
                    '--x': `${(i * 37) % 100}%`,
                    '--d': `${(i % 6) * 0.08}s`,
                    '--c': ['#ffd15c', '#ff5af0', '#38bdf8', '#4ade80', '#fb923c'][i % 5],
                  } as CSSProperties}
                />
              ))}
            </div>
          ) : (
            <div className="wheel-actions">
              <button className="btn btn-primary wheel-go" onMouseDown={keepFocus} onClick={spin}>
                {state === 'spinning' ? '點擊跳過 ⏭' : '🎯 開始轉盤！'}
              </button>
              {state === 'ready' && (
                <button className="btn btn-ghost btn-small" onMouseDown={keepFocus} onClick={close}>
                  稍後再轉（保留次數）
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
