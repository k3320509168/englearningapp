import { useEffect, useRef, useState } from 'react';
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import type { ModalName } from '../store/uiStore';
import { classDef } from '../game/character';
import { currentClassName } from '../game/growth';
import { useNotices } from './useNotices';
import { keepFocus } from './keepFocus';

// 地圖畫面的工具列：上排是主角與資源，下排是 4 個主要入口＋「更多」。
// 手機上主要入口固定在畫面底部（拇指點得到），有事可做的入口顯示紅點。
export default function MapToolbar() {
  const gold = useSaveStore(s => s.gold);
  const partySize = useSaveStore(s => s.party.length);
  const tickets = useSaveStore(s => s.tickets);
  const player = useSaveStore(s => s.player);
  const character = useSaveStore(s => s.character);
  const mistakeCount = useSaveStore(s => Object.keys(s.mistakes).length);
  const openModal = useUiStore(s => s.openModal);
  const notices = useNotices();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // 點選單以外的地方或按 Esc 關閉「更多」
  useEffect(() => {
    if (!moreOpen) return;
    const onDown = (e: PointerEvent) => { if (!moreRef.current?.contains(e.target as Node)) setMoreOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMoreOpen(false); };
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('pointerdown', onDown); window.removeEventListener('keydown', onKey); };
  }, [moreOpen]);

  const dot = (on: boolean) => on && <span className="dot-badge" aria-label="有可以做的事" />;
  const open = (name: ModalName) => { setMoreOpen(false); openModal(name); };
  const className = character ? currentClassName(classDef(character.classId).name, player.classPath) : '';

  return (
    <header className="map-toolbar">
      <div className="toolbar-row">
        <span className="brand">⚔️ 單字冒險</span>
        {character && (
          <button className="hero-chip" onMouseDown={keepFocus} onClick={() => openModal('growth')} aria-label={`主角 ${character.name}，Lv ${player.level} ${className}`}>
            <b>Lv {player.level}</b> {character.name}・{className}
          </button>
        )}
        <div className="toolbar-actions">
          <span className="gold-badge" aria-label={`金幣 ${gold}`}>🪙 {gold}</span>
          <span className="ticket-badge" aria-label={`召喚券 ${tickets}`}>🎫 {tickets}</span>
          <span className="muted map-stat" title="答錯過的單字，會在戰鬥中以魔王題再次出現">📌 {mistakeCount}</span>
        </div>
      </div>
      <nav className="toolbar-nav" aria-label="主要選單">
        <button className="nav-btn" onMouseDown={keepFocus} onClick={() => open('heroes')}>
          <span className="nav-icon">⚔️</span><span>隊伍 {partySize}/4</span>{dot(notices.tierUp)}
        </button>
        <button className="nav-btn" onMouseDown={keepFocus} onClick={() => open('summon')}>
          <span className="nav-icon">🔮</span><span>召喚</span>{dot(notices.summon)}
        </button>
        <button className="nav-btn" onMouseDown={keepFocus} onClick={() => open('growth')}>
          <span className="nav-icon">🛡️</span><span>成長</span>{dot(notices.classAdvance || notices.forge || notices.gradeUp)}
        </button>
        <button className="nav-btn" onMouseDown={keepFocus} onClick={() => open('daily')}>
          <span className="nav-icon">📅</span><span>每日</span>{dot(notices.daily)}
        </button>
        <div className="nav-more" ref={moreRef}>
          <button className="nav-btn" onMouseDown={keepFocus} onClick={() => setMoreOpen(v => !v)} aria-expanded={moreOpen} aria-haspopup="menu">
            <span className="nav-icon">☰</span><span>更多</span>
          </button>
          {moreOpen && (
            <div className="more-menu" role="menu">
              <button role="menuitem" onMouseDown={keepFocus} onClick={() => open('shop')}>🏪 商店</button>
              <button role="menuitem" onMouseDown={keepFocus} onClick={() => open('codex')}>📚 圖鑑</button>
              <button role="menuitem" onMouseDown={keepFocus} onClick={() => open('tutorial')}>❓ 說明</button>
              <button role="menuitem" onMouseDown={keepFocus} onClick={() => open('settings')}>⚙️ 設定</button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
