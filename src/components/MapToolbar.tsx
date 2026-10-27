import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { keepFocus } from './keepFocus';

// 地圖畫面上方的工具列
export default function MapToolbar() {
  const mistakeCount = useSaveStore(s => Object.keys(s.mistakes).length);
  const openModal = useUiStore(s => s.openModal);

  return (
    <header className="map-toolbar">
      <span className="brand">⚔️ 單字冒險</span>
      <span className="muted map-stat" title="答錯過的單字，之後會再出現讓你複習">📌 錯題本 {mistakeCount} 個</span>
      <div className="toolbar-actions">
        <button className="btn btn-small" onMouseDown={keepFocus} onClick={() => openModal('tutorial')}>❓ 說明</button>
        <button className="btn btn-small" onMouseDown={keepFocus} onClick={() => openModal('settings')}>⚙️ 設定</button>
      </div>
    </header>
  );
}
