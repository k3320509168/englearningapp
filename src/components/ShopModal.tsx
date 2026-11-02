import { useState, type CSSProperties } from 'react';
import Modal from './Modal';
import { useSaveStore } from '../store/saveStore';
import { useUiStore, type ShopTab } from '../store/uiStore';
import { ITEMS, UPGRADES, upgradeCost } from '../game/progression';
import {
  EQUIPMENT, SLOTS, displayName,
  materialIcon, materialName, resolveCost, sortEquipment,
} from '../game/equipment';
import { RARITY_INFO, HEROES } from '../game/heroes';
import { classDef } from '../game/character';
import { describeMods } from '../game/growth';
import {
  ALL_WEAPONS, WEAPON_MAX_LEVEL, weaponUpgradeCost, weaponAtkMultiplier,
} from '../game/weapons';
import { sfx } from '../game/sfx';
import { keepFocus } from './keepFocus';

// 冒險工坊：整合永久升級、戰鬥道具、裝備鍛造與專武神兵強化（第二十一輪規格）
export default function ShopModal() {
  const sv = useSaveStore();
  const { gold, upgrades, items, buyUpgrade, buyItem, materials, character, player, unlockedIndex, weapons, weaponShards, upgradeWeapon } = sv;
  const { closeModal, shopTab, openShop, openModal } = useUiStore();
  const [tab, setTab] = useState<ShopTab>(shopTab || 'upgrades');
  const [shopSubTab, setShopSubTab] = useState<'upgrades' | 'items'>('upgrades');
  const [forgeSlot, setForgeSlot] = useState<'all' | 'weapon' | 'armor' | 'accessory'>('all');
  const [weaponFilter, setWeaponFilter] = useState<'all' | 'protagonist' | 'hero'>('all');

  const materialBar = (
    <div className="material-bar" aria-label="持有鍛造素材">
      <span title="金幣">🪙 {gold}</span>
      <span title="鐵礦">🪨 {materials.ore ?? 0}</span>
      <span title="布料">🧵 {materials.cloth ?? 0}</span>
      <span title="皮革">🧶 {materials.leather ?? 0}</span>
      <span title="原木">🪵 {materials.wood ?? 0}</span>
      <span title="水晶">💎 {materials.crystal ?? 0}</span>
      <span title="元素精華">✨ {materials.essence ?? 0}</span>
      <span title="龍鱗">🐉 {materials.scale ?? 0}</span>
    </div>
  );

  const ownedCount = (defId: string) => sv.equipment.filter(e => e.defId === defId).length;

  return (
    <Modal title="⚒️ 冒險工坊" onClose={closeModal}>
      <div className="shop-header-bar">
        <p className="shop-gold">持有金幣 <b>🪙 {gold}</b></p>
      </div>

      <div className="tabs" role="tablist">
        <button
          role="tab"
          aria-selected={tab === 'upgrades'}
          className={`tab ${tab === 'upgrades' ? 'is-active' : ''}`}
          onMouseDown={keepFocus}
          onClick={() => { setTab('upgrades'); openShop('upgrades'); }}
        >
          🏪 雜貨商會
        </button>
        <button
          role="tab"
          aria-selected={tab === 'forge'}
          className={`tab ${tab === 'forge' ? 'is-active' : ''}`}
          onMouseDown={keepFocus}
          onClick={() => { setTab('forge'); openShop('forge'); }}
        >
          🛡️ 裝備鍛造
        </button>
        <button
          role="tab"
          aria-selected={tab === 'weapons'}
          className={`tab ${tab === 'weapons' ? 'is-active' : ''}`}
          onMouseDown={keepFocus}
          onClick={() => { setTab('weapons'); openShop('weapons'); }}
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
              onClick={() => setShopSubTab('upgrades')}
            >
              ⚔️ 永久升級
            </button>
            <button
              className={`pill ${shopSubTab === 'items' ? 'is-on' : ''}`}
              onMouseDown={keepFocus}
              onClick={() => setShopSubTab('items')}
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
        </>
      )}

      {tab === 'forge' && (
        <>
          {materialBar}
          <div className="forge-toolbar">
            <div className="forge-filter-tabs">
              {([['all', '全部'], ['weapon', '⚔️ 武器'], ['armor', '🛡️ 防具'], ['accessory', '💍 飾品']] as const).map(([id, label]) => (
                <button
                  key={id}
                  className={`pill ${forgeSlot === id ? 'is-on' : ''}`}
                  onMouseDown={keepFocus}
                  onClick={() => setForgeSlot(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="forge-tip">💡 擊倒怪物可獲取鍛造素材；重複打造同名裝備可「升品階」大幅提升威力！</p>
          </div>
          <ul className="forge-grid">
            {sortEquipment(EQUIPMENT)
              .filter(def => forgeSlot === 'all' || def.slot === forgeSlot)
              .map(def => {
                const charEl = character?.element ?? 'light';
                const charClass = character?.classId ?? 'swordsman';
                const need = resolveCost(def, charEl);
                const regionOk = (def.requires?.regionsCleared ?? 0) <= unlockedIndex;
                const tierOk = (def.requires?.classTier ?? 0) <= player.classPath.length;
                const enough = Object.entries(need).every(([k, v]) => (materials[k] ?? 0) >= v) && gold >= def.cost.gold;
                const lockText = !regionOk ? `通關 ${def.requires!.regionsCleared} 個區域後解鎖` : !tierOk ? '二轉後解鎖' : '';
                return (
                  <li key={def.id} className={`gear-item ${lockText ? 'is-locked' : ''}`} style={{ '--rarity': RARITY_INFO[def.rarity].color } as CSSProperties}>
                    <span className="rarity-tag inline">{def.rarity}</span>
                    <div className="gear-info">
                      <b>{SLOTS.find(sl => sl.id === def.slot)?.icon} {displayName(def, charClass)}{ownedCount(def.id) > 0 && <small className="muted"> 已擁有 {ownedCount(def.id)} 件</small>}</b>
                      <small className="muted">{describeMods(def.mods).join('、')}</small>
                      <small className="cost-line">
                        🪙{def.cost.gold}
                        {Object.entries(need).map(([k, v]) => (
                          <span key={k} className={(materials[k] ?? 0) >= v ? '' : 'short'}> {materialIcon(k)}{materialName(k)}×{v}</span>
                        ))}
                      </small>
                    </div>
                    {lockText ? <span className="muted lock-text">🔒 {lockText}</span>
                      : <button className="btn btn-small btn-primary" onMouseDown={keepFocus} disabled={!enough}
                        onClick={() => { if (sv.forge(def.id)) sfx.victory(); }}>鍛造</button>}
                  </li>
                );
              })}
          </ul>
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
                  onClick={() => setWeaponFilter(id)}
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
                            if (upgradeWeapon(wp.id)) sfx.coin();
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
