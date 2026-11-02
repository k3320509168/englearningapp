import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import Modal from './Modal';
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import type { GrowthTab } from '../store/uiStore';
import { useNotices } from './useNotices';
import { CLASSES, classDef, elementDef } from '../game/character';
import type { ClassId } from '../game/character';
import {
  ADVANCE_REQ, BADGE_COST, MAX_LEVEL, classBufferLimit, bestTier, canAdvance, pathBadgeCost, playerLevelCap, childrenOf, currentClassName, describeMods, nextOptions, xpToNext,
} from '../game/growth';
import {
  DRAGON_REGION, EQUIPMENT, HOLY_FORGE_QUESTIONS, MAX_GRADE, SLOTS, displayName, enhanceChance, gradeMaterial, gradeOf, maxPlus, enhanceCost, equipDef, equipMods, materialIcon, materialName, resolveCost, SELL_RATE, sellValue,
} from '../game/equipment';
import type { OwnedEquip } from '../game/equipment';
import { RARITY_INFO } from '../game/heroes';
import { buildMember, playerMods } from '../game/party';
import { CLASS_SKILL, SKILLS, skillDesc, playerStats } from '../game/progression';
import { avatarDataUrl } from '../game/art/sprites';
import { sfx } from '../game/sfx';
import { keepFocus } from './keepFocus';

type Tab = GrowthTab;

// 主角成長：等級、轉職樹、裝備、鍛造
export default function GrowthModal() {
  const sv = useSaveStore();
  const { character, player, materials, equipment, equipped, gold, unlockedIndex, upgrades } = sv;
  const { closeModal, openModal } = useUiStore();
  const [tab, setTab] = useState<Tab>(() => useUiStore.getState().growthTab);
  const notices = useNotices();
  const [selling, setSelling] = useState<string | null>(null); // 正在確認賣出的裝備
  const [forgeSlot, setForgeSlot] = useState<'all' | 'weapon' | 'armor' | 'accessory'>('all');
  const equippedItems = useMemo(
    () => Object.values(equipped).map(uid => equipment.find(e => e.uid === uid)).filter((e): e is OwnedEquip => e !== undefined),
    [equipped, equipment],
  );
  if (!character) return null;

  const ownedCount = (defId: string) => equipment.filter(e => e.defId === defId).length;
  const sellText = (item: OwnedEquip) => {
    const v = sellValue(item, character.element);
    return [`🪙${v.gold}`, ...Object.entries(v.materials).map(([k, n]) => `${materialIcon(k)}${n}`)].join(' ');
  };

  const growth = { level: player.level, classPath: player.classPath, equipped: equippedItems };
  const member = buildMember('player', character, playerStats({ upgrades }), { growth });
  const mods = playerMods(growth);
  const cls = classDef(character.classId);
  // 等級上限看所有職業裡轉得最高的那一個
  const levelCap = playerLevelCap(bestTier({ ...sv.classPaths, current: player.classPath }));
  const el = elementDef(character.element);
  const className = currentClassName(cls.name, player.classPath);
  const skill = SKILLS[CLASS_SKILL[character.classId]];

  const materialBar = (
    <p className="material-bar">
      <span>🪙 <b>{gold}</b></span>
      {['ore', 'core', ...((materials.dragon ?? 0) > 0 || unlockedIndex >= DRAGON_REGION ? ['dragon'] : []), `crystal_${character.element}`].map(id => (
        <span key={id} title={materialName(id)}>{materialIcon(id)} {materialName(id)} <b>{materials[id] ?? 0}</b></span>
      ))}
    </p>
  );

  return (
    <Modal title={`🛡️ ${character.name}・${className}`} onClose={closeModal} wide>
      <div className="tabs" role="tablist">
        {([['hero', '主角'], ['gear', '裝備'], ['forge', '鍛造坊']] as [Tab, string][]).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={`tab ${tab === id ? 'is-active' : ''}`} onMouseDown={keepFocus} onClick={() => setTab(id)}>
            {label}{((id === 'hero' && notices.classAdvance) || (id === 'gear' && notices.gradeUp) || (id === 'forge' && notices.forge)) && <span className="dot-badge" aria-label="有可以做的事" />}
          </button>
        ))}
      </div>

      {tab === 'hero' && (
        <>
          <section className="growth-head" style={{ '--el': el.color } as CSSProperties}>
            <img src={avatarDataUrl(character, 'idle', 3, player.classPath.length)} alt="" />
            <div>
              <h3>Lv {player.level} <span className="muted">/ {levelCap}</span></h3>
              {sv.titles.length > 0 && <p className="title-badges">{sv.titles.map(t => <span key={t}>🏅 {t}</span>)}</p>}
              {player.level >= levelCap && player.level < MAX_LEVEL && (
                <div>
                  <p className="muted">已達等級上限，轉職後上限提高（覺醒後最高 Lv {MAX_LEVEL}）</p>
                  <p>暫存 EXP {player.xp}{classBufferLimit(player.level, levelCap) > 0 ? ` / ${classBufferLimit(player.level, levelCap)}` : ''}，轉職後立即結算。</p>
                  {player.xp >= classBufferLimit(player.level, levelCap) && <p>暫存已滿，先轉職再繼續成長。</p>}
                </div>
              )}
              {player.level < levelCap && (
                <div className="xp-bar" title="答對題目、打倒怪物都能得到經驗值">
                  <span style={{ width: `${(player.xp / xpToNext(player.level)) * 100}%` }} />
                  <small>EXP {player.xp} / {xpToNext(player.level)}</small>
                </div>
              )}
              <p className="hero-stats">HP {member.maxHp} ・ 攻擊 {Math.round(member.atk)} ・ 暴擊 {Math.round(member.crit * 100)}%</p>
              <p className="skill-line">{skill.icon} {skill.name}：{skillDesc(member.skill, member.skillPower)}</p>
              {describeMods({ ...mods, hp: 0, atk: 0, crit: 0 }).length > 0 && (
                <p className="mods-line">被動：{describeMods({ ...mods, hp: 0, atk: 0, crit: 0 }).join('、')}</p>
              )}
              <button className="btn btn-ghost btn-small" onMouseDown={keepFocus} onClick={() => openModal('character')}>✨ 修改外觀</button>
            </div>
          </section>

          <section className="class-path">
            {/* 換職業：五種職業共用等級、各自保留轉職路線，戰鬥外免費切換 */}
            <div className="class-switch-head">
              <p className="summary-label">職業</p>
              <span className="muted">🎖️ 職業徽章 {sv.classBadges}</span>
            </div>
            <div className="class-switch" role="group" aria-label="切換職業">
              {CLASSES.map(c => {
                const path = c.id === character.classId ? player.classPath : sv.classPaths[c.id] ?? [];
                const tierName = ['未轉職', '一轉', '二轉', '覺醒'][path.length];
                return (
                  <button key={c.id} className={`class-chip ${c.id === character.classId ? 'is-on' : ''}`} onMouseDown={keepFocus}
                    onClick={() => { if (sv.switchClass(c.id)) sfx.coin(); }} aria-pressed={c.id === character.classId}>
                    <b>{c.name}</b><small>{c.id === (sv.homeClass ?? character.classId) ? '★ ' : ''}{tierName}</small>
                  </button>
                );
              })}
            </div>
            {/* P1 主角成長：先顯示「目前職業 → 下一轉職 → 還缺什麼」，再展開完整轉職樹 */}
            {renderAdvance()}
            <ClassTree classId={character.classId} path={player.classPath} />
            {player.classPath.length > 0 && (
              <button className="btn btn-ghost btn-small" onMouseDown={keepFocus} onClick={() => sv.resetClassPath()}>
                ↺ 重置這個職業的路線{character.classId !== (sv.homeClass ?? character.classId) ? `（退回 🎖️ ${pathBadgeCost(player.classPath)}）` : ''}
              </button>
            )}
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
              const cap = maxPlus(item);
              const canEnhance = item.plus < cap && gold >= cost.gold && (materials.ore ?? 0) >= cost.ore;
              const grade = gradeOf(item);
              const hasMaterial = !!gradeMaterial(item, equipment, Object.values(equipped).filter((u): u is string => !!u));
              return (
                <li key={item.uid} className="gear-item" style={{ '--rarity': RARITY_INFO[def.rarity].color } as CSSProperties}>
                  <span className="rarity-tag inline">{def.rarity}</span>
                  <div className="gear-info">
                    <b>{item.blessed && '✨'}{displayName(def, character.classId)} +{item.plus}{grade > 0 && <span className="grade-stars" aria-label={`品階 ${grade}`}> {'★'.repeat(grade)}</span>}</b>
                    <small className="muted">{describeMods(equipMods(item)).join('、')}</small>
                  </div>
                  {isOn ? <span className="hero-tag">裝備中</span>
                    : <button className="btn btn-small" onMouseDown={keepFocus} onClick={() => { sfx.click(); sv.equip(item.uid); }}>裝備</button>}
                  <button className="btn btn-small btn-primary" onMouseDown={keepFocus} disabled={!canEnhance}
                    onClick={() => {
                      const r = sv.enhance(item.uid);
                      if (r === 'ok') sfx.coin();
                      else if (r === 'fail') { sfx.wrong(); useUiStore.getState().celebrate({ icon: '💨', title: '強化失敗', sub: '材料用掉了，裝備沒事。試試「神聖鍛造」：答對 3 題英文一定成功', color: '#8a8494' }); }
                    }}
                    title={item.plus >= cap ? `已經強化到目前上限 +${cap}${grade < MAX_GRADE ? '（升品階可以提高上限）' : ''}` : `需要 🪙${cost.gold}、🪨${cost.ore}`}>
                    {item.plus >= cap ? `MAX +${cap}` : `強化 ${Math.round(enhanceChance(item) * 100)}% 🪙${cost.gold} 🪨${cost.ore}`}
                  </button>
                  {item.plus < cap && enhanceChance(item) < 1 && (
                    <button className="btn btn-small" onMouseDown={keepFocus} disabled={!canEnhance}
                      onClick={() => useUiStore.getState().openHolyForge(item.uid)}
                      title={`答對 ${HOLY_FORGE_QUESTIONS} 題英文題，強化一定成功，而且得到神聖加護（效果 +10%）`}>
                      ✨ 神聖鍛造
                    </button>
                  )}
                  {grade < MAX_GRADE && (
                    <button className="btn btn-small" onMouseDown={keepFocus} disabled={!hasMaterial}
                      onClick={() => { if (sv.gradeUp(item.uid)) sfx.victory(); }}
                      title={hasMaterial ? '用掉一件沒穿在身上的同名裝備：效果 +20%、強化上限 +2（稀有度不變）' : '需要一件沒穿在身上的同名裝備（可以到鍛造坊再打造一件）'}>
                      ★ 升品階 {grade}→{grade + 1}
                    </button>
                  )}
                  {!isOn && (selling === item.uid ? (
                    <span className="sell-confirm">
                      <small>賣出可得 {sellText(item)}</small>
                      <button className="btn btn-small btn-danger" onMouseDown={keepFocus} onClick={() => { if (sv.sellEquip(item.uid)) sfx.coin(); setSelling(null); }}>確定賣出</button>
                      <button className="btn btn-small btn-ghost" onMouseDown={keepFocus} onClick={() => setSelling(null)}>取消</button>
                    </span>
                  ) : (
                    <button className="btn btn-small btn-ghost" onMouseDown={keepFocus} onClick={() => setSelling(item.uid)} title={`退還打造與強化投入的 ${Math.round(SELL_RATE * 100)}%`}>賣出</button>
                  ))}
                </li>
              );
            })}
          </ul>
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
            {EQUIPMENT
              .filter(def => forgeSlot === 'all' || def.slot === forgeSlot)
              .map(def => {
                const need = resolveCost(def, character.element);
                const regionOk = (def.requires?.regionsCleared ?? 0) <= unlockedIndex;
                const tierOk = (def.requires?.classTier ?? 0) <= player.classPath.length;
                const enough = Object.entries(need).every(([k, v]) => (materials[k] ?? 0) >= v) && gold >= def.cost.gold;
                const lockText = !regionOk ? `通關 ${def.requires!.regionsCleared} 個區域後解鎖` : !tierOk ? '二轉後解鎖' : '';
                return (
                  <li key={def.id} className={`gear-item ${lockText ? 'is-locked' : ''}`} style={{ '--rarity': RARITY_INFO[def.rarity].color } as CSSProperties}>
                    <span className="rarity-tag inline">{def.rarity}</span>
                    <div className="gear-info">
                      <b>{SLOTS.find(sl => sl.id === def.slot)?.icon} {displayName(def, character.classId)}{ownedCount(def.id) > 0 && <small className="muted"> 已擁有 {ownedCount(def.id)} 件</small>}</b>
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
    const curTier = Math.min(4, player.classPath.length);
    const curTierName = ['基礎職業（未轉職）', '一轉職業', '二轉職業', '三轉職業', '👑 終極覺醒'][curTier] ?? '👑 終極覺醒';

    if (options.length === 0) {
      return (
        <div className="advance-goal-card is-awakened">
          <div className="advance-goal-head">
            <span className="advance-badge">👑 階級：{curTierName}</span>
            <span className="advance-status-pill is-ready">★ 登峰造極</span>
          </div>
          <p className="advance-goal-desc">恭喜！已到達這條轉職路線的終極形態，擁有最高職業被動與屬性加成！</p>
        </div>
      );
    }

    const tier = options[0].tier;
    const nextTierTitle = tier === 4 ? '四轉・終極覺醒' : tier === 3 ? '三轉・大師職業' : tier === 2 ? '二轉・進階職業' : '一轉・初階職業';
    const req = ADVANCE_REQ[tier];
    const badgeCost = character!.classId === (sv.homeClass ?? character!.classId) ? 0 : BADGE_COST[tier];
    const ok = canAdvance(tier, player.level) && sv.classBadges >= badgeCost;
    const lvDiff = Math.max(0, req.level - player.level);
    const badgeDiff = Math.max(0, badgeCost - sv.classBadges);

    return (
      <div className={`advance-goal-card ${ok ? 'is-advance-ready' : ''}`}>
        <div className="advance-goal-head">
          <div className="advance-goal-title">
            <span className="advance-tag">目前階級：<b>{curTierName}</b></span>
            <span className="advance-arrow" aria-hidden>➔</span>
            <span className="advance-tag is-next">下一轉職：<b>{nextTierTitle}</b></span>
          </div>
          <span className={`advance-status-pill ${ok ? 'is-ready' : 'is-pending'}`}>
            {ok ? '✨ 條件已達成！請選擇分支' : `🔒 尚缺 ${lvDiff > 0 ? `Lv ${lvDiff} ` : ''}${badgeDiff > 0 ? `🎖️ ${badgeDiff} ` : ''}`}
          </span>
        </div>

        <div className="advance-req-row">
          <div className={`advance-req-item ${player.level >= req.level ? 'is-met' : 'is-unmet'}`}>
            <span className="advance-req-icon">{player.level >= req.level ? '✔' : '●'}</span>
            <span>等級需求：<b>Lv {req.level}</b>（目前 Lv {player.level}{lvDiff > 0 ? `，還差 ${lvDiff} 級` : '，已達成'}）</span>
          </div>
          {badgeCost > 0 && (
            <div className={`advance-req-item ${sv.classBadges >= badgeCost ? 'is-met' : 'is-unmet'}`}>
              <span className="advance-req-icon">{sv.classBadges >= badgeCost ? '✔' : '●'}</span>
              <span>職業徽章：<b>🎖️ {badgeCost}</b>（持有 🎖️ {sv.classBadges}{badgeDiff > 0 ? `，還差 ${badgeDiff} 個` : '，已足夠'}）</span>
            </div>
          )}
        </div>

        <p className="advance-prompt">可選轉職分支（轉職將突破等級上限並獲得專屬被動）：</p>
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
                  onClick={() => {
                    if (!sv.advanceClass(o.id)) return;
                    useUiStore.getState().celebrate({ icon: '⚔️', title: `轉職：${o.name}`, sub: o.desc, img: avatarDataUrl(character!, 'idle', 4, sv.player.classPath.length + 1), color: '#ff7a3d' });
                  }}>轉職</button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}

// 轉職樹：這個職業的兩條路線（一轉 → 二轉 → 三轉 → 終極覺醒），走過的節點點亮
function ClassTree({ classId, path }: { classId: ClassId; path: string[] }) {
  const lit = (id: string) => path.includes(id);
  return (
    <div className="class-tree-panel">
      <div className="class-tree-title">★ 轉職路線軌跡（一轉 Lv30 ➔ 二轉 Lv80 ➔ 三轉 Lv120 ➔ 終極覺醒 Lv160）★</div>
      <div className="class-tree">
        {childrenOf(classId).map(first => (
          <div key={first.id} className="tree-branch">
            <div className={`tree-node-wrapper ${lit(first.id) ? 'is-lit' : ''}`} title={`${first.name}（Lv 30 需求）：${first.desc}`}>
              <span className="tree-tier-tag">一轉 (Lv30)</span>
              <span className="tree-node">{first.name}</span>
            </div>
            <span className={`tree-connector ${lit(first.id) ? 'is-active' : ''}`} aria-hidden>══▶</span>
            <div className="tree-seconds">
              {childrenOf(first.id).map(second => {
                const thirds = childrenOf(second.id);
                return (
                  <div key={second.id} className="tree-pair">
                    <div className={`tree-node-wrapper ${lit(second.id) ? 'is-lit' : ''}`} title={`${second.name}（Lv 80 需求）：${second.desc}`}>
                      <span className="tree-tier-tag">二轉 (Lv80)</span>
                      <span className="tree-node">{second.name}</span>
                    </div>
                    {thirds.map(third => {
                      const awakens = childrenOf(third.id);
                      return (
                        <div key={third.id} className="tree-awake-group">
                          <span className={`tree-sub-connector ${lit(second.id) ? 'is-active' : ''}`} aria-hidden>─▶</span>
                          <div className={`tree-node-wrapper ${lit(third.id) ? 'is-lit' : ''}`} title={`${third.name}（Lv 120 需求）：${third.desc}`}>
                            <span className="tree-tier-tag">三轉 (Lv120)</span>
                            <span className="tree-node">{third.name}</span>
                          </div>
                          {awakens.map(a => (
                            <div key={a.id} className="tree-awake-group">
                              <span className={`tree-sub-connector ${lit(third.id) ? 'is-active' : ''}`} aria-hidden>─▶</span>
                              <div className={`tree-node-wrapper is-awake ${lit(a.id) ? 'is-lit' : ''}`} title={`${a.name}（Lv 160 需求）：${a.desc}`}>
                                <span className="tree-node">👑 覺醒 (Lv160)</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
