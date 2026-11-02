import { useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { MemberId } from '../game/party';

// 拖到哪裡：隊伍的第幾格（0 = 隊長），或下方的英雄圖鑑（= 離隊）
export type DropTarget = number | 'bench';

export interface DragState {
  id: MemberId;
  img: string;
  x: number;
  y: number;
  over: DropTarget | null;
}

// 手指／滑鼠下面是哪一格：隊伍格子標 data-slot，圖鑑區標 data-bench
function targetAt(x: number, y: number): DropTarget | null {
  const el = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-slot],[data-bench]');
  if (!el) return null;
  return el.dataset.slot !== undefined ? Number(el.dataset.slot) : 'bench';
}

// 英雄卡拖拉換隊：滑鼠按住移動超過 6px 就開始拖；手機長按 0.25 秒才開始拖（一般滑動仍然是捲動畫面）。
// 拖拉結束後會吃掉緊接著的那次 click，避免放開時順便打開英雄詳細資料
export function usePartyDrag(onDrop: (id: MemberId, target: DropTarget) => void) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const suppressClick = useRef(false);

  const start = (id: MemberId, img: string) => (e: ReactPointerEvent) => {
    if (e.button !== 0) return;
    const touch = e.pointerType !== 'mouse';
    const sx = e.clientX;
    const sy = e.clientY;
    let x = sx;
    let y = sy;
    let active = false;

    const begin = () => {
      active = true;
      suppressClick.current = true;
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate(35); } catch { /* ignore */ }
      }
      setDrag({ id, img, x, y, over: targetAt(x, y) });
    };
    const timer = touch ? window.setTimeout(begin, 250) : 0;

    const move = (ev: PointerEvent) => {
      x = ev.clientX;
      y = ev.clientY;
      if (!active) {
        const dist = Math.hypot(x - sx, y - sy);
        if (touch && dist > 8) cleanup(); // 長按前就滑動：當作捲動
        else if (!touch && dist > 6) begin();
        return;
      }
      setDrag(d => d && { ...d, x, y, over: targetAt(x, y) });
    };
    const finish = (ev: PointerEvent, drop: boolean) => {
      if (active) {
        const target = drop ? targetAt(ev.clientX, ev.clientY) : null;
        if (target !== null) onDrop(id, target);
        setDrag(null);
        window.setTimeout(() => { suppressClick.current = false; }, 0);
      }
      cleanup();
    };
    const up = (ev: PointerEvent) => finish(ev, true);
    const cancel = (ev: PointerEvent) => finish(ev, false);
    // 拖拉中不要讓手機捲動畫面
    const blockScroll = (ev: TouchEvent) => { if (active) ev.preventDefault(); };
    function cleanup() {
      window.clearTimeout(timer);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('touchmove', blockScroll);
    }
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('touchmove', blockScroll, { passive: false });
  };

  // 包住原本的 click：剛拖完就不觸發
  const guardClick = (fn: () => void) => () => {
    if (suppressClick.current) return;
    fn();
  };

  return { drag, start, guardClick };
}
