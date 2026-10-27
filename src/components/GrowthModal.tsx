import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import Modal from './Modal';
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { classDef, elementDef } from '../game/character';
import {
  ADVANCE_REQ, MAX_LEVEL, canAdvance, childrenOf, classNode, currentClassName, describeMods, nextOptions, xpToNext,
} from '../game/growth';
import {
  EQUIPMENT, MAX_PLUS, SLOTS, displayName, enhanceCost, equipDef, equipMods, materialIcon, materialName, resolveCost,
} from '../game/equipment';
import type { OwnedEquip } from '../game/equipment';
import { RARITY_INFO } from '../game/heroes';
import { buildMember, playerMods } from '../game/party';
import { CLASS_SKILL, SKILLS, playerStats } from '../game/progression';
import { avatarDataUrl } from '../game/art/sprites';
import { sfx } from '../game/sfx';
import { keepFocus } from './keepFocus';

type Tab = 'hero' | 'gear' | 'forge';

// 主角成長：等級、轉職樹、裝備、鍛造
export default function GrowthModal() {
  const sv = useSaveStore();
  const { character, player, materials, equipment, equipped, gold, unlockedIndex, upgrades } = sv;
  const { closeModal, openModal } = useUiStore();
  const [tab, setTab] = useState<Tab>('hero');
  const equippedItems = useMemo(
    () => Object.values(equipped).map(uid => equipment.find(e => e.uid === uid)).filter((e): e is OwnedEquip => e !== undefined),
    [equipped, equipment],
  );
  if (!character) return null;

  const growth = { level: player.level, classPath: player.classPath, equipped: equippedItems };
  const member = buildMember('player', character, playerStats({ upgrades }), { growth });
  const mods = playerMods(growth);
  const cls = classDef(character.classId);
  const el = elementDef(character.element);
  const className = currentClassName(cls.name, player.classPath);
  const skill = SKILLS[CLASS_SKILL[character.classId]];

  const materialBar = (
    <p className="material-bar">
      <span>🪙 <b>{gold}</b></span>
      {['ore', 'core', `crystal_${character.element}`].map(id => (
        <span key={id} title={materialName(id)}>{materialIcon(id)} {materialName(id)} <b>{materials[id] ?? 0}</b></span>
      ))}
    </p>
  );

  return (
    <Modal title={`🛡️ ${character.name}・${className}`} onClose={closeModal} wide>
      <div className="tabs" role="tablist">
        {([['hero', '主角'], ['gear', '裝備'], ['forge', '鍛造坊']] as [Tab, string][]).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={`tab ${tab === id ? 'is-active' : ''}`} onMouseDown={keepFocus} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {tab === 'hero' && (
        <>
          <section className="growth-head" style={{ '--el': el.color } as CSSProperties}>
            <img src={avatarDataUrl(character, 'idle', 3, player.classPath.length)} alt="" />
            <div>
              <h3>Lv {player.level} <span className="muted">/ {MAX_LEVEL}</span></h3>
              {sv.titles.length > 0 && <p className="title-badges">{sv.titles.map(t => <span key={t}>🏅 {t}</span>)}</p>}
              {player.level < MAX_LEVEL && (
                <div className="xp-bar" title="答對題目、打倒怪物都能得到經驗值">
                  <span style={{ width: `${(player.xp / xpToNext(player.level)) * 100}%` }} />
                  <small>EXP {player.xp} / {xpToNext(player.level)}</small>
                </div>
              )}
              <p className="hero-stats">HP {member.maxHp} ・ 攻擊 {Math.round(member.atk)} ・ 暴擊 {Math.round(member.crit * 100)}%</p>
              <p className="skill-line">{skill.icon} {skill.name}：{skill.desc}</p>
              {describeMods({ ...mods, hp: 0, atk: 0, crit: 0 }).length > 0 && (
                <p className="mods-line">被動：{describeMods({ ...mods, hp: 0, atk: 0, crit: 0 }).join('、')}</p>
              )}
              <button className="btn btn-ghost btn-small" onMouseDown={keepFocus} onClick={() => openModal('character')}>✨ 修改外觀</button>
            </div>
          </section>

          <section className="class-path">
            <p className="summary-label">轉職路線</p>
            <ol className="path-steps">
              <li className="is-done">{cls.name}</li>
              {player.classPath.map(id => <li key={id} className="is-done">{classNode(id)?.name}</li>)}
            </ol>
            {renderAdvance()}
          </section>
        </>
      )}

      {tab === 'gear' && (
        <>
          {materialBar}
          <ul className="gear-slots">
            {SLOTS.map(slot => {
              const item = equippedItems.find(e => equipDef(e.defId)?.slot === slot.id);
              const def = item && equipDef(item.defId);
              return (
                <li key={slot.id} className="gear-slot" style={{ '--rarity': def ? RARITY_INFO[def.rarity].color : 'var(--muted)' } as CSSProperties}>
                  <span className="gear-icon">{slot.icon}</span>
                  <div>
                    <b>{slot.name}</b>
                    <span>{def && item ? `${displayName(def, character.classId)} +${item.plus}` : '（空）'}</span>
                    {item && <small className="muted">{describeMods(equipMods(item)).join('、')}</small>}
                  </div>
                  {item && <button className="btn btn-ghost btn-small" onMouseDown={keepFocus} onClick={() => sv.unequip(slot.id)}>卸下</button>}
                </li>
              );
            })}
          </ul>
          <p className="summary-label">背包（{equipment.length}）</p>
          {equipment.length === 0 && <p className="muted">還沒有裝備，到「鍛造坊」打造第一件吧！</p>}
          <ul className="gear-list">
            {equipment.map(item => {
              const def = equipDef(item.defId);
              if (!def) return null;
              const isOn = equipped[def.slot] === item.uid;
              const cost = enhanceCost(item);
              const canEnhance = item.plus < MAX_PLUS && gold >= cost.gold && (materials.ore ?? 0) >= cost.ore;
              return (
                <li key={item.uid} className="gear-item" style={{ '--rarity': RARITY_INFO[def.rarity].color } as CSSProperties}>
                  <span className="rarity-tag inline">{def.rarity}</span>
                  <div className="gear-info">
                    <b>{displayName(def, character.classId)} +{item.plus}</b>
                    <small className="muted">{describeMods(equipMods(item)).join('、')}</small>
                  </div>
                  {isOn ? <span className="hero-tag">裝備中</span>
                    : <button className="btn btn-small" onMouseDown={keepFocus} onClick={() => { sfx.click(); sv.equip(item.uid); }}>裝備</button>}
                  <button className="btn btn-small btn-primary" onMouseDown={keepFocus} disabled={!canEnhance}
                    onClick={() => { if (sv.enhance(item.uid)) sfx.coin(); }}
                    title={item.plus >= MAX_PLUS ? '已經強化到最高' : `需要 🪙${cost.gold}、🪨${cost.ore}`}>
                    {item.plus >= MAX_PLUS ? 'MAX' : `強化 🪙${cost.gold} 🪨${cost.ore}`}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {tab === 'forge' && (
        <>
          {materialBar}
          <p className="muted party-note">素材來源：一般怪掉礦石，菁英怪與頭目掉屬性結晶，頭目掉魔核，寶箱怪掉一大堆。</p>
          <ul className="gear-list">
            {EQUIPMENT.map(def => {
              const need = resolveCost(def, character.element);
              const regionOk = (def.requires?.regionsCleared ?? 0) <= unlockedIndex;
              const tierOk = (def.requires?.classTier ?? 0) <= player.classPath.length;
              const enough = Object.entries(need).every(([k, v]) => (materials[k] ?? 0) >= v) && gold >= def.cost.gold;
              const lockText = !regionOk ? `通關 ${def.requires!.regionsCleared} 個區域後解鎖` : !tierOk ? '二轉後解鎖' : '';
              return (
                <li key={def.id} className={`gear-item ${lockText ? 'is-locked' : ''}`} style={{ '--rarity': RARITY_INFO[def.rarity].color } as CSSProperties}>
                  <span className="rarity-tag inline">{def.rarity}</span>
                  <div className="gear-info">
                    <b>{SLOTS.find(sl => sl.id === def.slot)?.icon} {displayName(def, character.classId)}</b>
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
    </Modal>
  );

  function renderAdvance() {
    const options = nextOptions(character!.classId, player.classPath);
    if (options.length === 0) return <p className="muted">已經覺醒，到達這條路線的最終形態！</p>;
    const tier = options[0].tier;
    const req = ADVANCE_REQ[tier];
    const ok = canAdvance(tier, player.level, unlockedIndex);
    return (
      <>
        <p className={ok ? 'req-ok' : 'muted'}>
          {tier === 3 ? '覺醒' : tier === 2 ? '二轉' : '一轉'}條件：{req.label}（目前 Lv {player.level}、已通關 {unlockedIndex} 個區域）
        </p>
        <div className="advance-options">
          {options.map(o => {
            const next = childrenOf(o.id);
            return (
              <div key={o.id} className="advance-card">
                <b>{o.name} <small className="muted">{o.en}</small></b>
                <span>{o.desc}</span>
                <small className="mods-line">{describeMods(o.mods).join('、')}</small>
                {next.length > 0 && <small className="muted">之後可選：{next.map(n => n.name).join(' ／ ')}</small>}
                <button className="btn btn-small btn-primary" onMouseDown={keepFocus} disabled={!ok}
                  onClick={() => { if (sv.advanceClass(o.id)) sfx.victory(); }}>轉職</button>
              </div>
            );
          })}
        </div>
      </>
    );
  }
}
