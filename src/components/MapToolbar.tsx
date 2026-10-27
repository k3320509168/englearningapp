import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { classDef } from '../game/character';
import { keepFocus } from './keepFocus';

// 地圖畫面上方的工具列：金幣、英雄、商店、圖鑑、說明、設定
export default function MapToolbar() {
  const gold = useSaveStore(s => s.gold);
  const partySize = useSaveStore(s => s.party.length);
  const character = useSaveStore(s => s.character);
  const mistakeCount = useSaveStore(s => Object.keys(s.mistakes).length);
  const openModal = useUiStore(s => s.openModal);

  return (
    <header className="map-toolbar">
      <div className="toolbar-row">
        <span className="brand">⚔️ 單字冒險</span>
        <span className="gold-badge" aria-label={`金幣 ${gold}`}>🪙 {gold}</span>
        <span className="muted map-stat" title="答錯過的單字，會在復仇魔王關卡再次出現">📌 錯題 {mistakeCount}</span>
        <div className="toolbar-actions">
          <button className="btn btn-small" onMouseDown={keepFocus} onClick={() => openModal('tutorial')} aria-label="說明">❓</button>
          <button className="btn btn-small" onMouseDown={keepFocus} onClick={() => openModal('settings')} aria-label="設定">⚙️</button>
        </div>
      </div>
      <nav className="toolbar-row toolbar-nav">
        {character && (
          <button className="btn btn-small" onMouseDown={keepFocus} onClick={() => openModal('character')}>🛡️ {character.name}・{classDef(character.classId).name}</button>
        )}
        <button className="btn btn-small" onMouseDown={keepFocus} onClick={() => openModal('heroes')}>⚔️ 隊伍 {partySize}/4</button>
        <button className="btn btn-small" onMouseDown={keepFocus} onClick={() => openModal('shop')}>🏪 商店</button>
        <button className="btn btn-small" onMouseDown={keepFocus} onClick={() => openModal('codex')}>📚 圖鑑</button>
      </nav>
    </header>
  );
}
