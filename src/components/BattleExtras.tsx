import { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useBattleStore } from '../store/battleStore';
import { useSaveStore } from '../store/saveStore';
import { ITEMS } from '../game/progression';
import { keepFocus } from './keepFocus';

// 道具按鈕：戰鬥狀態列與手機的「🎒」選單共用
function ItemButtons({ onUse }: { onUse?: () => void }) {
  const { phase, playerHp, playerMaxHp, shield, assist, golden } = useBattleStore(useShallow(s => ({
    golden: s.mode === 'golden', phase: s.phase, playerHp: s.playerHp, playerMaxHp: s.playerMaxHp, shield: s.shield, assist: s.assist,
  })));
  const items = useSaveStore(s => s.items);
  const consumeItem = useBattleStore(s => s.consumeItem);
  const canUse = phase === 'answering';
  // 已經有效果時不能再用（例如滿血時不能喝藥水）
  const disabledReason: Record<string, boolean> = {
    potion: playerHp >= playerMaxHp,
    shield: shield || golden,
    hint: assist !== null,
  };
  return (
    <>
      {ITEMS.map(it => (
        <button key={it.id} className="item-btn" onMouseDown={keepFocus} onClick={() => { consumeItem(it.id); onUse?.(); }}
          disabled={!canUse || items[it.id] <= 0 || disabledReason[it.id]}
          title={golden && it.id === 'shield' ? '黃金之路不能使用護盾：答錯或超時立即止步' : `${it.name}：${it.desc}`} aria-label={`使用${it.name}，剩 ${items[it.id]} 個`}>
          {it.icon}<small>{items[it.id]}</small>
          <span className="item-name">{it.name}</span>
        </button>
      ))}
    </>
  );
}

// 道具（在商店買）收成上方工具列的一顆 🎒 按鈕，點開才顯示，省下一整列給題目
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
    <div className="item-menu" ref={ref}>
      <button className="btn btn-ghost btn-small" onMouseDown={keepFocus} onClick={() => setOpen(v => !v)} aria-expanded={open} aria-label={`道具，共 ${total} 個`} title="道具：藥水、提示卷軸、護盾（在商店購買）">
        🎒{total > 0 && <small className="item-count">{total}</small>}
      </button>
      {open && <div className="item-pop" role="menu" aria-label="道具"><ItemButtons onUse={() => setOpen(false)} /></div>}
    </div>
  );
}
