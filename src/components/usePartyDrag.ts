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

// 英雄卡拖拉換隊：滑鼠按住移動超過 6px 開始拖；手機長按 0.18 秒開始拖。
// 具備手勢衝突隔離、防顫動容差、PointerCapture 與點擊防呆保護
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
    const targetEl = e.currentTarget as HTMLElement;
    const pointerId = e.pointerId;

    const begin = () => {
      active = true;
      suppressClick.current = true;
      try {
        if (typeof document !== 'undefined') {
          document.body.style.userSelect = 'none';
          document.body.style.webkitUserSelect = 'none';
        }
      } catch { /* ignore */ }
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate(35); } catch { /* ignore */ }
      }
      // 只有在真正觸發拖曳後，才接管 touchmove 阻止螢幕滾動
      window.addEventListener('touchmove', blockScroll, { passive: false });
      setDrag({ id, img, x, y, over: targetAt(x, y) });
    };

    const timer = touch ? window.setTimeout(begin, 400) : 0;

    const move = (ev: PointerEvent) => {
      x = ev.clientX;
      y = ev.clientY;
      if (!active) {
        const dy = Math.abs(y - sy);
        const dx = Math.abs(x - sx);
        // 觸控設備：一旦有任何滑動意圖（位移 > 5px），立即認定為列表原生滾動，取消拖曳長按！
        if (touch && (dy > 5 || dx > 5)) {
          cleanup();
          return;
        } else if (!touch && Math.hypot(dx, dy) > 6) {
          begin();
        }
        return;
      }
      // 已啟動拖曳時，阻止瀏覽器原生手勢與滾動
      ev.preventDefault();
      setDrag(d => d && { ...d, x, y, over: targetAt(x, y) });
    };

    const finish = (ev: PointerEvent, drop: boolean) => {
      if (active) {
        const target = drop ? targetAt(ev.clientX, ev.clientY) : null;
        if (target !== null) onDrop(id, target);
        setDrag(null);
        window.setTimeout(() => { suppressClick.current = false; }, 80);
      }
      cleanup();
    };

    const up = (ev: PointerEvent) => finish(ev, true);
    // 在觸發 pointercancel 時，若已經在拖曳中，檢查是否停留在有效格子上
    const cancel = (ev: PointerEvent) => {
      if (active) {
        const target = targetAt(ev.clientX, ev.clientY);
        if (target !== null) {
          finish(ev, true);
          return;
        }
      }
      finish(ev, false);
    };

    // 拖拉中不要讓手機捲動畫面
    const blockScroll = (ev: TouchEvent) => { if (active) ev.preventDefault(); };

    function cleanup() {
      window.clearTimeout(timer);
      try {
        if (typeof document !== 'undefined') {
          document.body.style.userSelect = '';
          document.body.style.webkitUserSelect = '';
        }
        if (targetEl && targetEl.hasPointerCapture?.(pointerId)) {
          targetEl.releasePointerCapture(pointerId);
        }
      } catch { /* ignore */ }
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('touchmove', blockScroll);
    }

    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
  };

  // 包住原本的 click：剛拖完就不觸發，避免拖曳放開時意外點擊
  const guardClick = (fn: () => void) => () => {
    if (suppressClick.current) return;
    fn();
  };

  return { drag, start, guardClick };
}
