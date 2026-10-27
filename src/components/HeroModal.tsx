import { useMemo } from 'react';
import Modal from './Modal';
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { HEROES } from '../game/progression';
import { heroDataUrl } from '../game/art/sprites';
import { keepFocus } from './keepFocus';

// 英雄：每位英雄強化一種題型，鼓勵玩家嘗試所有玩法
export default function HeroModal() {
  const { gold, heroes, hero, buyHero, selectHero } = useSaveStore();
  const closeModal = useUiStore(s => s.closeModal);
  // 英雄頭像直接用遊戲裡的像素圖
  const portraits = useMemo(() => Object.fromEntries(HEROES.map(h => [h.id, heroDataUrl(h.id)])), []);

  return (
    <Modal title="🦸 英雄" onClose={closeModal}>
      <p className="shop-gold">持有金幣 <b>🪙 {gold}</b></p>
      <ul className="hero-grid">
        {HEROES.map(h => {
          const owned = heroes.includes(h.id);
          const selected = hero === h.id;
          return (
            <li key={h.id} className={`hero-card ${selected ? 'is-selected' : ''}`}>
              <img className="hero-portrait" src={portraits[h.id]} alt="" />
              <b>{h.name}</b>
              <span className="muted">{h.desc}</span>
              {selected ? (
                <span className="hero-tag">出戰中</span>
              ) : owned ? (
                <button className="btn btn-small" onMouseDown={keepFocus} onClick={() => selectHero(h.id)}>選擇出戰</button>
              ) : (
                <button className="btn btn-primary btn-small" onMouseDown={keepFocus} onClick={() => buyHero(h.id)} disabled={gold < h.cost}>解鎖 🪙 {h.cost}</button>
              )}
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
