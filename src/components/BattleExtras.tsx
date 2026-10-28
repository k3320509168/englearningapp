import { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useBattleStore } from '../store/battleStore';
import { useSaveStore } from '../store/saveStore';
import { ITEMS } from '../game/progression';
import { keepFocus } from './keepFocus';

// 道具按鈕：戰鬥狀態列與手機的「🎒」選單共用
function ItemButtons({ onUse }: { onUse?: () => void }) {
  const { phase, playerHp, playerMaxHp, shield, assist } = useBattleStore(useShallow(s => ({
    phase: s.phase, playerHp: s.playerHp, playerMaxHp: s.playerMaxHp, shield: s.shield, assist: s.assist,
  })));
  const items = useSaveStore(s => s.items);
  const consumeItem = useBattleStore(s => s.consumeItem);
  const canUse = phase === 'answering';
  // 已經有效果時不能再用（例如滿血時不能喝藥水）
  const disabledReason: Record<string, boolean> = {
    potion: playerHp >= playerMaxHp,
    shield,
    hint: assist !== null,
  };
  return (
    <>
      {ITEMS.map(it => (
        <button key={it.id} className="item-btn" onMouseDown={keepFocus} onClick={() => { consumeItem(it.id); onUse?.(); }}
          disabled={!canUse || items[it.id] <= 0 || disabledReason[it.id]}
          title={`${it.name}：${it.desc}`} aria-label={`使用${it.name}，剩 ${items[it.id]} 個`}>
          {it.icon}<small>{items[it.id]}</small>
        </button>
      ))}
    </>
  );
}

// 戰鬥中的狀態列：本趟金幣、可使用的道具（手機上隱藏，改用 ItemMenu）
export function BattleStatusBar() {
  const runGold = useBattleStore(s => s.runGold);
  return (
    <div className="status-bar">
      <span className="gold-badge" title="這趟冒險獲得的金幣（已存入，可到商店兌換）">🪙 +{runGold}</span>
      <span className="item-bar"><ItemButtons /></span>
    </div>
  );
}

// 手機：道具收成一顆按鈕，點開才顯示，省下一整列的高度
export function ItemMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const total = useSaveStore(s => s.items.potion + s.items.hint + s.items.shield);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
  }, [open]);
  return (
    <div className="item-menu only-mobile" ref={ref}>
      <button className="btn btn-ghost btn-small" onMouseDown={keepFocus} onClick={() => setOpen(v => !v)} aria-expanded={open} aria-label={`道具，共 ${total} 個`}>
        🎒{total > 0 && <small className="item-count">{total}</small>}
      </button>
      {open && <div className="item-pop"><ItemButtons onUse={() => setOpen(false)} /></div>}
    </div>
  );
}
