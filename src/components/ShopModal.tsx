import { useState, type CSSProperties } from 'react';
import Modal from './Modal';
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { ITEMS, UPGRADES, upgradeCost } from '../game/progression';
import { HEROES } from '../game/heroes';
import { classDef } from '../game/character';
import {
  ALL_WEAPONS, WEAPON_MAX_LEVEL, weaponUpgradeCost, weaponAtkMultiplier,
} from '../game/weapons';
import { sfx } from '../game/sfx';
import { keepFocus } from './keepFocus';

// 冒險工坊：整合永久升級、戰鬥道具與專武神兵強化（一般裝備鍛造在「成長」鍛造坊）
export default function ShopModal() {
  const sv = useSaveStore();
  const { gold, upgrades, items, buyUpgrade, buyItem, weapons, weaponShards, upgradeWeapon } = sv;
  const { closeModal, shopTab, openShop, openModal } = useUiStore();
  const [tab, setTab] = useState<'upgrades' | 'weapons'>(shopTab === 'weapons' ? 'weapons' : 'upgrades');
  const [shopSubTab, setShopSubTab] = useState<'upgrades' | 'items'>('upgrades');
  const [weaponFilter, setWeaponFilter] = useState<'all' | 'protagonist' | 'hero'>('all');

  return (
    <Modal title="⚒️ 冒險工坊" onClose={closeModal} wide>
      <div className="shop-header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <p className="shop-gold" style={{ margin: 0 }}>持有金幣 <b>🪙 {gold}</b></p>
        <button
          className="btn btn-small btn-ghost"
          style={{ fontSize: 12, padding: '3px 8px' }}
          onMouseDown={keepFocus}
          onClick={() => useUiStore.getState().openGrowth('forge')}
          title="打造與升品階一般武器、防具、飾品"
        >
          🛡️ 前往成長鍛造坊 ➔
        </button>
      </div>

      <div className="tabs" role="tablist">
        <button
          role="tab"
          aria-selected={tab === 'upgrades'}
          className={`tab ${tab === 'upgrades' ? 'is-active' : ''}`}
          onMouseDown={keepFocus}
          onClick={() => { sfx.click(); setTab('upgrades'); openShop('upgrades'); }}
        >
          🏪 雜貨商會
        </button>
        <button
          role="tab"
          aria-selected={tab === 'weapons'}
          className={`tab ${tab === 'weapons' ? 'is-active' : ''}`}
          onMouseDown={keepFocus}
          onClick={() => { sfx.click(); setTab('weapons'); openShop('weapons'); }}
        >
          ⚔️ 專武強化
        </button>
      </div>

      {tab === 'upgrades' && (
        <>
          <div className="forge-filter-tabs" style={{ marginBottom: 10 }}>
            <button
              className={`pill ${shopSubTab === 'upgrades' ? 'is-on' : ''}`}
              onMouseDown={keepFocus}
              onClick={() => { sfx.click(); setShopSubTab('upgrades'); }}
            >
              ⚔️ 永久升級
            </button>
            <button
              className={`pill ${shopSubTab === 'items' ? 'is-on' : ''}`}
              onMouseDown={keepFocus}
              onClick={() => { sfx.click(); setShopSubTab('items'); }}
            >
              🧪 戰鬥道具
            </button>
          </div>

          {shopSubTab === 'upgrades' ? (
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
                    <button
                      className="btn btn-primary btn-small"
                      onMouseDown={keepFocus}
                      onClick={() => {
                        if (buyUpgrade(u.id)) sfx.upgrade();
                        else sfx.cantAfford();
                      }}
                      disabled={maxed || gold < cost}
                    >
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
                  <button
                    className="btn btn-primary btn-small"
                    onMouseDown={keepFocus}
                    onClick={() => {
                      if (buyItem(it.id)) sfx.coin();
                      else sfx.cantAfford();
                    }}
                    disabled={gold < it.cost}
                  >
                    🪙 {it.cost}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="muted shop-note">💡 打倒怪獸、通過 Boss 都能獲得金幣；就算體力耗盡，賺到的金幣也會保留。</p>
        </>
      )}

      {tab === 'weapons' && (
        <>
          <div className="forge-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div className="forge-filter-tabs">
              {([['all', `全部 (${ALL_WEAPONS.length})`], ['protagonist', '👑 主角神兵 (5)'], ['hero', `🌟 SSR 專武 (${ALL_WEAPONS.length - 5})`]] as const).map(([id, label]) => (
                <button
                  key={id}
                  className={`pill ${weaponFilter === id ? 'is-on' : ''}`}
                  onMouseDown={keepFocus}
                  onClick={() => { sfx.click(); setWeaponFilter(id); }}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              className="btn btn-small btn-secondary"
              onMouseDown={keepFocus}
              onClick={() => { closeModal(); openModal('summon'); }}
            >
              🔮 前往真名鍛爐召喚 ➔
            </button>
          </div>
          <p className="forge-tip" style={{ margin: '6px 0 0' }}>💡 專武提供獨立攻擊加成（+7%～+15%）與專屬特色被動。可消耗金幣與專屬碎片提升神兵等階！</p>

          <ul className="weapon-forge-list">
            {ALL_WEAPONS
              .filter(wp => weaponFilter === 'all' || (weaponFilter === 'protagonist' ? !!wp.classId : !!wp.heroId))
              .map(wp => {
                const owned = weapons[wp.id];
                const isUnlocked = !!owned?.unlocked;
                const curLvl = owned?.level ?? 0;
                const shards = weaponShards[wp.id] ?? 0;
                const cost = weaponUpgradeCost(curLvl);
                const isMax = curLvl >= WEAPON_MAX_LEVEL;
                const canUpgrade = isUnlocked && !isMax && cost !== null && gold >= cost.gold && shards >= cost.shards;
                const atkBonusPct = Math.round(weaponAtkMultiplier(curLvl) * 100);
                const ownerName = wp.heroId
                  ? (HEROES.find(h => h.id === wp.heroId)?.meaning ?? wp.heroId)
                  : wp.classId
                    ? classDef(wp.classId)?.name ?? wp.classId
                    : '專屬';
                const wpColor = isUnlocked ? '#ffd15c' : '#c084fc';

                return (
                  <li key={wp.id} className={`weapon-forge-item ${!isUnlocked ? 'is-locked' : ''}`} style={{ '--rarity': wpColor } as CSSProperties}>
                    <div className="weapon-forge-icon" aria-hidden="true">{wp.icon}</div>
                    <div className="weapon-forge-info">
                      <div className="weapon-forge-title-row">
                        <span className="rarity-tag inline" style={{ borderColor: wpColor, color: wpColor }}>
                          {wp.heroId ? 'SSR專武' : '主角神兵'}
                        </span>
                        <b style={{ color: wpColor }}>{wp.name}</b>
                        {isUnlocked ? (
                          <span className="hero-tag" style={{ background: '#ffd15c', color: '#1a1000' }}>+{curLvl}</span>
                        ) : (
                          <span className="muted" style={{ fontSize: 11 }}>未擁有</span>
                        )}
                      </div>
                      <div className="weapon-forge-meta">
                        <span style={{ color: '#ffd15c' }}>專屬：<b>{ownerName}</b></span>
                        <span>攻擊加成：<b>+{atkBonusPct}%</b></span>
                        {isUnlocked && <span>持有碎片：<b>{shards}</b> 枚</span>}
                      </div>
                      <div className="weapon-forge-passive">{wp.passiveDesc}</div>
                      {!isUnlocked && (
                        <div className="lock-text muted">🔒 獲取途徑：真名鍛爐召喚 或 完成英雄真名試煉解鎖</div>
                      )}
                      {isUnlocked && !isMax && cost && (
                        <div className="cost-line" style={{ marginTop: 2 }}>
                          下一級消耗：🪙{cost.gold} ｜ 🪓碎片×{cost.shards} {shards < cost.shards && <span className="short">(缺 {cost.shards - shards})</span>}
                        </div>
                      )}
                    </div>
                    <div className="weapon-forge-actions">
                      {isUnlocked ? (
                        <button
                          className="btn btn-small btn-primary"
                          onMouseDown={keepFocus}
                          disabled={!canUpgrade}
                          onClick={() => {
                            if (upgradeWeapon(wp.id)) sfx.forge();
                            else sfx.cantAfford();
                          }}
                        >
                          {isMax ? '★ 已滿級' : '強化神兵'}
                        </button>
                      ) : (
                        <button
                          className="btn btn-small btn-ghost"
                          onMouseDown={keepFocus}
                          onClick={() => { closeModal(); openModal('summon'); }}
                        >
                          去鍛爐 ➔
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
          </ul>
        </>
      )}
    </Modal>
  );
}
