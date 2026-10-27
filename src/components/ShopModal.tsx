import { useState } from 'react';
import Modal from './Modal';
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { ITEMS, UPGRADES, upgradeCost } from '../game/progression';
import { keepFocus } from './keepFocus';

// 商店：用金幣購買永久升級與戰鬥道具
export default function ShopModal() {
  const { gold, upgrades, items, buyUpgrade, buyItem } = useSaveStore();
  const closeModal = useUiStore(s => s.closeModal);
  const [tab, setTab] = useState<'upgrades' | 'items'>('upgrades');

  return (
    <Modal title="🏪 商店" onClose={closeModal}>
      <p className="shop-gold">持有金幣 <b>🪙 {gold}</b></p>
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'upgrades'} className={`tab ${tab === 'upgrades' ? 'is-active' : ''}`} onMouseDown={keepFocus} onClick={() => setTab('upgrades')}>永久升級</button>
        <button role="tab" aria-selected={tab === 'items'} className={`tab ${tab === 'items' ? 'is-active' : ''}`} onMouseDown={keepFocus} onClick={() => setTab('items')}>戰鬥道具</button>
      </div>

      {tab === 'upgrades' ? (
        <ul className="shop-list">
          {UPGRADES.map(u => {
            const level = upgrades[u.id];
            const maxed = level >= u.maxLevel;
            const cost = upgradeCost(u, level);
            return (
              <li key={u.id} className="shop-item">
                <span className="shop-icon" aria-hidden="true">{u.icon}</span>
                <div className="shop-info">
                  <b>{u.name} <small className="muted">Lv.{level}/{u.maxLevel}</small></b>
                  <span className="muted">目前：{level ? u.desc(level) : '尚未升級'}</span>
                  {!maxed && <span>下一級：{u.desc(level + 1)}</span>}
                </div>
                <button className="btn btn-primary btn-small" onMouseDown={keepFocus} onClick={() => buyUpgrade(u.id)} disabled={maxed || gold < cost}>
                  {maxed ? '已滿級' : `🪙 ${cost}`}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <ul className="shop-list">
          {ITEMS.map(it => (
            <li key={it.id} className="shop-item">
              <span className="shop-icon" aria-hidden="true">{it.icon}</span>
              <div className="shop-info">
                <b>{it.name} <small className="muted">持有 {items[it.id]}</small></b>
                <span className="muted">{it.desc}</span>
              </div>
              <button className="btn btn-primary btn-small" onMouseDown={keepFocus} onClick={() => buyItem(it.id)} disabled={gold < it.cost}>🪙 {it.cost}</button>
            </li>
          ))}
        </ul>
      )}
      <p className="muted shop-note">💡 打倒怪獸、通過 Boss 都能獲得金幣；就算體力耗盡，賺到的金幣也會保留。</p>
    </Modal>
  );
}
