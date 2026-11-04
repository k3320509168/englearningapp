import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { CSSProperties } from 'react';
import Modal from './Modal';
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { CLASS_SKILL, SKILLS, playerSkillPower, skillDesc } from '../game/progression';
import { classDef, elementDef } from '../game/character';
import {
  HEROES, MAX_STARS, RARITIES, RARITY_INFO, STAR_BONUS, STAR_COSTS, STAR_GOLD, TIER_UP_GOLD, TIER_UP_SHARDS, currentRarity, heroDef, heroSkill, heroSkillPower, heroStats, heroTitle, heroWord,
} from '../game/heroes';
import type { Rarity } from '../game/heroes';
import { PARTY_MAX } from '../game/party';
import { heroSellValue, trainCost } from '../store/saveStore';
import { FINISHERS, RELAY } from '../game/synergy';
import { CLASS_TALENT, TALENTS, heroTalent, talentDesc } from '../game/talents';
import type { TalentId } from '../game/talents';
import type { ClassId } from '../game/character';
import { sfx } from '../game/sfx';
import { LEVEL_STAT } from '../game/growth';
import { TIER_UP_TRIALS, TRIAL_COUNT, TRUE_NAME_BONUS, isTrueName, trialsDone } from '../game/trueName';
import type { MemberId } from '../game/party';
import { avatarDataUrl, heroDataUrl } from '../game/art/sprites';
import { keepFocus } from './keepFocus';
import { usePartyDrag } from './usePartyDrag';
import { NameGlow, StarBadge } from './HeroBits';
import { PITY_SSR } from '../game/heroes';
import { weaponForHero, weaponForClass, weaponAtkMultiplier, weaponUpgradeCost } from '../game/weapons';

type Filter = 'owned' | 'all' | Rarity;

// 英雄：上方是出戰隊伍（最多 4 人，第一位是隊長），下方是 50 位英雄的圖鑑。
// 支援直覺的點擊換人/替換（防呆免拖曳）與手勢隔離拖曳雙軌制，極致流暢防閃退
export default function HeroModal() {
  const { gold, heroes, party, character, heroShards, heroTier, heroStars, wishShards, heroLevel, player, tickets, trueName, summonCounter, toggleMember, setLeader, placeMember, clearParty, tierUp, starUp, trainHero, trainHeroMax, sellHero } = useSaveStore();
  const { closeModal, openModal, openTrueName } = useUiStore();
  const [filter, setFilter] = useState<Filter>('owned');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<MemberId>(party[0] ?? 'player');
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [detailExpanded, setDetailExpanded] = useState(false);
  const [selling, setSelling] = useState<string | null>(null); // 正在確認送別的英雄
  const [tab, setTab] = useState<'skills' | 'growth'>('skills');
  const [help, setHelp] = useState(false);

  // 記憶體快取讀取頭像（按需讀取，不預建 50 份 Canvas，杜絕 OOM 閃退）
  const getPortrait = (id: MemberId): string => {
    if (id === 'player') {
      return character ? avatarDataUrl(character, 'idle', 2, player.classPath.length) : '';
    }
    return heroDataUrl(id, 2);
  };

  // 防呆安全的當前選中角色：避免送別或非法 ID 引發空指標崩潰
  const currentSelected: MemberId = (selected === 'player'
    ? (character ? 'player' : (party[0] ?? 'player'))
    : (heroes.includes(selected) ? selected : (party[0] ?? 'player')));

  // 拖拉換隊：拖到隊伍格子＝上場／換位／替換；隊伍裡的英雄拖回圖鑑＝離隊
  const { drag, start, guardClick } = usePartyDrag((id, target) => {
    if (target === 'bench') {
      if (party.includes(id) && party.length > 1) {
        toggleMember(id);
        if (selected === id) setSelected('player');
      }
    } else {
      placeMember(id, target);
      setSelectedSlot(target);
    }
    sfx.coin();
  });

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return HEROES
      .filter(h => {
        const rarity = currentRarity(h, heroTier[h.id] ?? 0);
        const matchesFilter = filter === 'all' || (filter === 'owned' ? heroes.includes(h.id) : rarity === filter);
        if (!matchesFilter) return false;
        if (!q) return true;
        const word = heroWord(h).toLowerCase();
        const title = heroTitle(h).toLowerCase();
        const meaning = (h.meaning ?? '').toLowerCase();
        const el = elementDef(h.element).name.toLowerCase();
        const cls = classDef(h.classId).name.toLowerCase();
        return word.includes(q) || title.includes(q) || meaning.includes(q) || el.includes(q) || cls.includes(q);
      })
      .sort((a, b) => RARITIES.indexOf(currentRarity(b, heroTier[b.id] ?? 0)) - RARITIES.indexOf(currentRarity(a, heroTier[a.id] ?? 0)));
  }, [filter, heroes, heroTier, search]);

  return (
    <Modal title="⚔️ 隊伍與英雄" onClose={closeModal} wide>
      <div className="hero-modal-layout">
        <section className="party-slots party-slots-fixed">
          <div className="collection-head">
            <p className="shop-gold">出戰隊伍 <b>{party.length}/{PARTY_MAX}</b></p>
            <span className="hero-head-actions">
              <span className="shop-gold">🪙 {gold}</span>
              {party.length > 1 && (
                <button className="btn btn-ghost btn-small" onMouseDown={keepFocus} onClick={() => { clearParty(); setSelected('player'); setSelectedSlot(0); }}>全部撤下</button>
              )}
              <button className={`btn btn-small help-btn ${help ? 'btn-primary' : 'btn-ghost'}`} onMouseDown={keepFocus} onClick={() => setHelp(h => !h)} aria-expanded={help} aria-label="說明">?</button>
            </span>
          </div>
          {help && <HeroHelp />}
          <div className="party-row">
            {Array.from({ length: PARTY_MAX }, (_, i) => {
              const id = party[i];
              const over = drag?.over === i ? 'is-drop' : '';
              const isSelectedSlot = selectedSlot === i;
              const order = <span className="slot-num" aria-hidden>{i + 1}</span>;

              if (!id) {
                return (
                  <button
                    key={i}
                    data-slot={i}
                    className={`party-slot slot-${i + 1} is-empty ${over} ${isSelectedSlot ? 'is-target' : ''}`}
                    onClick={() => setSelectedSlot(i)}
                    aria-label={`空位 ${i + 1}`}
                  >
                    {order}
                    <small>{isSelectedSlot ? '已選中空位' : '點選或拖曳'}</small>
                  </button>
                );
              }

              const name = id === 'player' ? character?.name ?? '' : heroWord(heroDef(id));
              const portrait = getPortrait(id);
              return (
                <button
                  key={id}
                  data-slot={i}
                  className={`party-slot slot-${i + 1} ${currentSelected === id ? 'is-selected' : ''} ${isSelectedSlot ? 'is-target' : ''} ${over} ${drag?.id === id ? 'is-dragging' : ''}`}
                  onMouseDown={keepFocus}
                  onPointerDown={start(id, portrait)}
                  onClick={guardClick(() => {
                    sfx.click();
                    setSelected(id);
                    setSelectedSlot(i);
                  })}
                  aria-label={`第 ${i + 1} 位${i === 0 ? '（隊長）' : ''}：${name}`}
                >
                  {order}
                  {i === 0 && <span className="party-pos">👑</span>}
                  {party.length > 1 && i > 0 && (
                    <span
                      className="party-slot-remove"
                      title="撤下此位置英雄"
                      onClick={(e) => {
                        e.stopPropagation();
                        sfx.coin();
                        toggleMember(id);
                        if (selected === id) setSelected('player');
                        setSelectedSlot(null);
                      }}
                    >
                      ✕
                    </span>
                  )}
                  <img src={portrait} alt="" draggable={false} />
                  <span>{name}</span>
                  {id !== 'player' && <StarBadge id={id} compact />}
                </button>
              );
            })}
          </div>
          {selectedSlot !== null && selectedSlot >= 0 && selectedSlot < PARTY_MAX && (
            <div className="party-slot-guide">
              <span className="party-guide-text">
                👉 <b>替換模式</b>：已選中【第 {selectedSlot + 1} 位{party[selectedSlot] ? `：${party[selectedSlot] === 'player' ? '主角' : heroWord(heroDef(party[selectedSlot]))}` : '（空位）'}】
              </span>
              <small className="muted">點擊下方任一英雄即可直接上陣替換</small>
              <button className="btn btn-tiny btn-ghost" onMouseDown={keepFocus} onClick={() => setSelectedSlot(null)}>✕ 取消</button>
            </div>
          )}
        </section>

        <div className="hero-modal-scroll">
          {/* 手機端可自由收合／展開英雄詳細資料面板，讓出戰隊伍與下方圖鑑清單順暢銜接 */}
          <div className="hero-detail-container">
            <div className={`hero-detail-wrapper ${detailExpanded ? 'is-expanded' : 'is-collapsed'}`}>
              {currentSelected && renderDetail(currentSelected)}
            </div>
          </div>

          <section className={`hero-collection ${drag?.over === 'bench' && party.includes(drag.id) ? 'is-drop' : ''}`} data-bench>
            <div className="collection-head">
              <p className="shop-gold">📖 英雄圖鑑 <b>{heroes.length}/{HEROES.length}</b></p>
              <button className="btn btn-primary summon-entry" onMouseDown={keepFocus} onClick={() => openModal('summon')}>
                🔮 召喚 <small>🎫 {tickets}・SSR 保底 {summonCounter.sinceSsr}/{PITY_SSR}</small>
              </button>
            </div>
            <div className="hero-filter-row">
              <div className="hero-filter" role="group" aria-label="篩選英雄">
                {(['owned', 'all', 'UR', 'SSR', 'SR', 'R', 'N'] as Filter[]).map(f => (
                  <button key={f} className={`pill ${filter === f ? 'is-on' : ''}`} onMouseDown={keepFocus} onClick={() => setFilter(f)} aria-pressed={filter === f}>
                    {f === 'owned' ? '已擁有' : f === 'all' ? '全部' : f}
                  </button>
                ))}
              </div>
              <div className="hero-search-box">
                <input
                  type="text"
                  className="hero-search-input"
                  placeholder="🔍 搜尋英雄、稱號、屬性..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {search && (
                  <button className="hero-search-clear" onClick={() => setSearch('')} aria-label="清除搜尋">
                    ✕
                  </button>
                )}
              </div>
            </div>
            {list.length === 0 && search && (
              <div className="codex-empty-tip">
                🔍 找不到符合「{search}」的英雄，試試其他關鍵字或切換「全部」篩選。
              </div>
            )}
            <ul className="hero-tiles">
              {character && filter === 'owned' && !search && (
                <li>
                  <button
                    className={`hero-tile ${party.includes('player') ? 'in-party' : ''} ${currentSelected === 'player' ? 'is-selected' : ''}`}
                    onMouseDown={keepFocus}
                    onPointerDown={start('player', getPortrait('player'))}
                    onClick={guardClick(() => {
                      sfx.click();
                      if (selectedSlot !== null && selectedSlot >= 0 && selectedSlot < PARTY_MAX) {
                        placeMember('player', selectedSlot);
                        setSelected('player');
                        sfx.upgrade();
                        return;
                      }
                      // 若未預選格子且主角未上陣：未滿員直接自動加入出戰
                      if (!party.includes('player') && party.length < PARTY_MAX) {
                        placeMember('player', party.length);
                        setSelected('player');
                        setSelectedSlot(party.length);
                        sfx.upgrade();
                        return;
                      }
                      setSelected('player');
                      const idx = party.indexOf('player');
                      if (idx >= 0) setSelectedSlot(idx);
                      else setSelectedSlot(0); // 滿員未上陣時預設高亮第 1 位方便一鍵替換
                    })}
                  >
                    <img src={getPortrait('player')} alt="" draggable={false} />
                    <b>{character.name}</b>
                    <small>主角</small>
                  </button>
                </li>
              )}
              {list.map(h => {
                const owned = heroes.includes(h.id);
                const rarity = currentRarity(h, heroTier[h.id] ?? 0);
                const inParty = party.includes(h.id);
                const portrait = getPortrait(h.id);
                return (
                  <li key={h.id}>
                    <button
                      className={`hero-tile ${owned ? '' : 'is-locked'} ${inParty ? 'in-party' : ''} ${currentSelected === h.id ? 'is-selected' : ''}`}
                      style={{ '--rarity': RARITY_INFO[rarity].color } as CSSProperties}
                      onMouseDown={keepFocus}
                      onPointerDown={owned ? start(h.id, portrait) : undefined}
                      onClick={guardClick(() => {
                        sfx.click();
                        // 若當前有選中的出戰格子，且點擊的是已擁有英雄，一鍵直接替換上陣！
                        if (selectedSlot !== null && selectedSlot >= 0 && selectedSlot < PARTY_MAX && owned) {
                          placeMember(h.id, selectedSlot);
                          setSelected(h.id);
                          sfx.upgrade();
                          return;
                        }
                        // 若未預選格子且未上陣：未滿員直接自動加入隊伍！
                        if (owned && !inParty && party.length < PARTY_MAX) {
                          placeMember(h.id, party.length);
                          setSelected(h.id);
                          setSelectedSlot(party.length);
                          sfx.upgrade();
                          return;
                        }
                        setSelected(h.id);
                        const idx = party.indexOf(h.id);
                        if (idx >= 0) setSelectedSlot(idx);
                        else if (owned) setSelectedSlot(0); // 滿員未上陣時預設選中第 1 位方便一鍵替換
                      })}
                      aria-label={`${rarity} ${heroWord(h)} ${heroTitle(h)}${owned ? '' : '（未擁有）'}`}
                    >
                      <span className="rarity-tag">{rarity}</span>
                      <img src={portrait} alt="" draggable={false} />
                      <b>{owned ? heroWord(h) : '？？？'}{isTrueName(trueName[h.id]) && <span className="true-mark" title="真名英雄"> ✦</span>}</b>
                      <small>{owned ? heroTitle(h) : h.meaning}</small>
                      {(heroShards[h.id] ?? 0) > 0 && <span className="shard-tag">◆{heroShards[h.id]}</span>}
                      {owned && <StarBadge id={h.id} compact />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        {/* 常駐底部操作列：無論手機滑動到哪裡，選中英雄時隨時可一鍵上陣、秒換或離隊，徹底免去滑回頂部的痛苦 */}
        <div className="hero-docked-bar">
          <div className="hero-docked-info">
            <img src={getPortrait(currentSelected)} alt="" className="hero-docked-avatar" />
            <div className="hero-docked-meta">
              <span className="hero-docked-name">
                {currentSelected === 'player' ? (character?.name ?? '主角') : heroWord(heroDef(currentSelected))}
              </span>
              <span className="hero-docked-status">
                {party.includes(currentSelected)
                  ? `出戰中 · 第 ${party.indexOf(currentSelected) + 1} 位`
                  : '待命英雄'}
              </span>
            </div>
          </div>

          <div className="hero-docked-actions">
            {!party.includes(currentSelected) ? (
              party.length < PARTY_MAX ? (
                <button
                  className="btn btn-primary btn-small hero-docked-btn"
                  onMouseDown={keepFocus}
                  onClick={() => {
                    placeMember(currentSelected, party.length);
                    setSelectedSlot(party.length);
                    sfx.upgrade();
                  }}
                >
                  ⚡ 加入隊伍（第 {party.length + 1} 位）
                </button>
              ) : selectedSlot !== null && selectedSlot >= 0 && selectedSlot < PARTY_MAX ? (
                <button
                  className="btn btn-primary btn-small hero-docked-btn"
                  onMouseDown={keepFocus}
                  onClick={() => {
                    placeMember(currentSelected, selectedSlot);
                    sfx.upgrade();
                  }}
                >
                  ⚡ 替換第 {selectedSlot + 1} 位 ({party[selectedSlot] === 'player' ? '主角' : heroWord(heroDef(party[selectedSlot]))})
                </button>
              ) : (
                <div className="hero-docked-slots">
                  <span className="hero-docked-label">換至：</span>
                  {party.map((mId, slotIdx) => (
                    <button
                      key={slotIdx}
                      className="btn btn-secondary btn-tiny hero-docked-slot-pill"
                      onMouseDown={keepFocus}
                      onClick={() => {
                        placeMember(currentSelected, slotIdx);
                        setSelectedSlot(slotIdx);
                        sfx.upgrade();
                      }}
                    >
                      {slotIdx + 1}位 {mId === 'player' ? '主角' : heroWord(heroDef(mId))}
                    </button>
                  ))}
                </div>
              )
            ) : (
              <div className="hero-docked-party-ops">
                {party.indexOf(currentSelected) > 0 && (
                  <button
                    className="btn btn-secondary btn-tiny"
                    onMouseDown={keepFocus}
                    onClick={() => {
                      setLeader(currentSelected);
                      sfx.upgrade();
                    }}
                  >
                    👑 設為隊長
                  </button>
                )}
                {party.length > 1 && (
                  <button
                    className="btn btn-ghost btn-tiny text-bad"
                    onMouseDown={keepFocus}
                    onClick={() => {
                      toggleMember(currentSelected);
                      if (selected === currentSelected) setSelected('player');
                      setSelectedSlot(null);
                      sfx.coin();
                    }}
                  >
                    ✕ 下陣離隊
                  </button>
                )}
              </div>
            )}

            <button
              className="btn btn-ghost btn-tiny hero-docked-detail-btn"
              onMouseDown={keepFocus}
              onClick={() => setDetailExpanded(v => !v)}
              title="查看此英雄詳細數值與技能"
            >
              {detailExpanded ? '▲ 收合數值' : '📊 數值'}
            </button>
          </div>
        </div>
      </div>
      {drag && createPortal(<img className="drag-ghost" src={drag.img} alt="" style={{ left: drag.x, top: drag.y }} />, document.body)}
    </Modal>
  );

  // 詳細資料（第十二輪重設計）：主卡（立繪、名字、星星、屬性、等級、三個數值、常用按鈕）＋「技能／養成」分頁。
  // 條件不足的按鈕不消失，直接顯示還缺什麼
  function renderDetail(id: MemberId) {
    const inParty = party.includes(id);
    const pos = party.indexOf(id);
    const full = party.length >= PARTY_MAX;

    if (id === 'player') {
      if (!character) return null;
      const cls = classDef(character.classId);
      const skill = SKILLS[CLASS_SKILL[character.classId]];
      const el = elementDef(character.element);
      const power = playerSkillPower(player.classPath.length);
      return (
        <section className="hero-detail hd">
          <div className="hd-main">
            <img src={getPortrait('player')} alt="" draggable={false} />
            <div className="hd-info">
              <h3>{character.name} <span className="el-badge" style={{ '--el': el.color } as CSSProperties}>{el.name}</span></h3>
              <p className="muted">主角・{cls.name}・Lv {player.level}</p>
              {renderMemberButtons(id, inParty, pos, full)}
            </div>
            <WeaponSlot classId={character.classId} />
          </div>
          <SkillList rows={[
            { icon: skill.icon, label: '技能', name: skill.name, desc: skillDesc(skill.id, power) },
            { icon: RELAY[character.classId].icon, label: '接力', name: RELAY[character.classId].name, desc: RELAY[character.classId].desc },
            ...talentRows(CLASS_TALENT[character.classId], power, character.classId),
          ]} />
          <p className="muted hd-note">主角的升級、轉職與裝備在「成長」。<button className="btn btn-ghost btn-small" onMouseDown={keepFocus} onClick={() => useUiStore.getState().openGrowth('hero')}>前往成長</button></p>
        </section>
      );
    }

    const h = heroDef(id);
    const owned = heroes.includes(id);
    const tier = heroTier[id] ?? 0;
    const rarity = currentRarity(h, tier);
    const stars = heroStars[id] ?? 0;
    const stats = heroStats(h, tier, stars);
    const el = elementDef(h.element);
    const skill = SKILLS[heroSkill(h)];
    const shards = heroShards[id] ?? 0;
    const need = TIER_UP_SHARDS[h.rarity];
    const trials = trialsDone(trueName[id]);
    const named = isTrueName(trueName[id]);
    const level = heroLevel[id] ?? 1;
    const levelMult = (1 + (level - 1) * LEVEL_STAT) * (named ? 1 + TRUE_NAME_BONUS : 1);
    const cost = trainCost(level, ['N', 'R', 'SR', 'SSR'].indexOf(h.rarity));
    const levelCap = level >= player.level;
    const power = heroSkillPower(h, tier);

    // 升星（SSR）與升品階的條件：哪些達成、哪些還缺
    const starNeed = STAR_COSTS[stars] ?? 0;
    const canStar = h.rarity === 'SSR' && tier === 0 && stars < MAX_STARS;
    const starReqs = canStar ? [
      { ok: shards + wishShards >= starNeed, text: `碎片 ◆${shards}/${starNeed}${wishShards ? `（＋願望 ${wishShards}）` : ''}` },
      { ok: gold >= STAR_GOLD(stars), text: `🪙 ${STAR_GOLD(stars)}` },
    ] : [];
    const tierReqs = tier === 0 ? [
      ...(h.rarity === 'SSR' ? [{ ok: stars >= MAX_STARS, text: '四星' }] : []),
      { ok: shards + wishShards >= need, text: `碎片 ◆${shards}/${need}` },
      { ok: gold >= TIER_UP_GOLD[h.rarity], text: `🪙 ${TIER_UP_GOLD[h.rarity]}` },
      { ok: trials >= TIER_UP_TRIALS, text: `真名 ${Math.min(trials, TIER_UP_TRIALS)}/${TIER_UP_TRIALS}` },
    ] : [];
    const nextRarity = RARITIES[RARITIES.indexOf(h.rarity) + 1];

    return (
      <section className="hero-detail hd" style={{ '--rarity': RARITY_INFO[rarity].color } as CSSProperties}>
        <div className="hd-main">
          <img src={getPortrait(id)} alt="" className={owned ? '' : 'is-locked'} draggable={false} />
          <div className="hd-info">
            <h3>
              <span className="rarity-tag inline">{rarity}</span>{' '}
              {owned ? <NameGlow id={id} progress={trueName[id]} /> : heroWord(h)}{' '}
              {owned && <StarBadge id={id} />}{' '}
              <span className="el-badge" style={{ '--el': el.color } as CSSProperties}>{el.name}</span>
            </h3>
            <p className="muted">{h.meaning}・{heroTitle(h)}・{classDef(h.classId).role}{owned && `・Lv ${level}`}</p>
            <div className="hd-stats">
              <span title="生命">❤️ ×{(stats.hp * levelMult).toFixed(2)}</span>
              <span title="攻擊">⚔️ ×{(stats.atk * levelMult).toFixed(2)}</span>
              <span title="暴擊率">🎯 {Math.round(stats.crit * 100)}%</span>
            </div>
            {owned ? (
              <div className="hd-actions">
                <span className="hd-train">
                  <button className="btn btn-small btn-primary" onMouseDown={keepFocus} onClick={() => { if (trainHeroMax(id) > 0) sfx.upgrade(); else sfx.cantAfford(); }} disabled={levelCap || gold < cost} title="金幣夠就一直升">一鍵訓練</button>
                  <button className="btn btn-small btn-ghost" onMouseDown={keepFocus} onClick={() => { if (trainHero(id)) sfx.upgrade(); else sfx.cantAfford(); }} disabled={levelCap || gold < cost}>訓練 🪙{cost}</button>
                  {(levelCap || gold < cost) && <small className="req-no">{levelCap ? `最高到主角 Lv ${player.level}` : `還差 🪙${cost - gold}`}</small>}
                </span>
                {renderMemberButtons(id, inParty, pos, full)}
              </div>
            ) : <p className="muted">尚未擁有：可以透過召喚取得。</p>}
          </div>
          {h.rarity === 'SSR' && <WeaponSlot heroId={id} />}
        </div>

        <div className="hd-tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'skills'} className={`pill ${tab === 'skills' ? 'is-on' : ''}`} onMouseDown={keepFocus} onClick={() => { sfx.click(); setTab('skills'); }}>技能</button>
          {owned && <button role="tab" aria-selected={tab === 'growth'} className={`pill ${tab === 'growth' ? 'is-on' : ''}`} onMouseDown={keepFocus} onClick={() => { sfx.click(); setTab('growth'); }}>養成{(canStar && starReqs.every(r => r.ok)) || (tier === 0 && tierReqs.every(r => r.ok)) ? ' ●' : ''}</button>}
        </div>

        {(tab === 'skills' || !owned) ? (
          <SkillList rows={[
            { icon: skill.icon, label: skill.signature ? '專屬' : '技能', name: skill.name, desc: skillDesc(skill.id, power) },
            { icon: RELAY[h.classId].icon, label: '接力', name: RELAY[h.classId].name, desc: `${RELAY[h.classId].desc}${h.classId === 'warrior' ? '；戰士會替隊友擋攻擊' : ''}` },
            ...talentRows(heroTalent(h.id), power, h.classId),
          ]} />
        ) : (
          <div className="hd-growth">
            {canStar && (
              <GrowthRow title={`升星 ${'★'.repeat(stars + 1)}`} effect={`生命與攻擊 +${Math.round(STAR_BONUS * 100)}%`} reqs={starReqs}
                action="升星" onAction={() => {
                  if (!starUp(id)) return;
                  sfx.starUp();
                  useUiStore.getState().celebrate({ icon: '⭐', title: `升星：${stars + 1} 星`, sub: `${heroWord(h)}・${heroTitle(h)}變得更強了`, img: heroDataUrl(id, 4), color: RARITY_INFO.SSR.color });
                }} />
            )}
            {tier === 0 ? (
              <GrowthRow title={`升品階 ${h.rarity} → ${nextRarity}`} effect="能力大幅提升、等級上限提高" reqs={tierReqs}
                action="升品階" onAction={() => {
                  if (!tierUp(id)) return;
                  sfx.starUp();
                  const r = currentRarity(h, 1);
                  useUiStore.getState().celebrate({ icon: '🌟', title: `升品階：${r}`, sub: `${heroWord(h)}・${heroTitle(h)}變得更強了`, img: heroDataUrl(id, 4), color: RARITY_INFO[r].color });
                }} />
            ) : <p className="growth-row is-done">✨ 已升品階（{rarity}）</p>}
            <div className="growth-row">
              <div>
                <b>✦ 真名考驗 {trials}/{TRIAL_COUNT}</b>
                <small className="muted">{named ? `真名英雄：能力 +${TRUE_NAME_BONUS * 100}%` : `完成五項考驗：能力 +${TRUE_NAME_BONUS * 100}%，每項送碎片`}</small>
              </div>
              <button className="btn btn-small btn-primary" onMouseDown={keepFocus} onClick={() => openTrueName(id)}>{named ? '查看' : '挑戰'}</button>
            </div>
            {renderSell(id, inParty, level, tier, trials)}
          </div>
        )}
      </section>
    );
  }

  // 送別英雄（賣出）：隊伍中的英雄要先離隊；有升品階或真名進度時特別提醒會失去
  function renderSell(id: string, inParty: boolean, level: number, tier: number, trials: number) {
    if (heroes.length <= 1) return null;
    if (inParty) {
      return (
        <p className="muted sell-note">
          {party.length > 1 && <button className="btn btn-ghost btn-small" onMouseDown={keepFocus} onClick={() => toggleMember(id)}>離隊</button>}
          想送別這位英雄，請先讓這位英雄離隊。
        </p>
      );
    }
    const value = heroSellValue(id, level, tier);
    if (selling !== id) {
      return <button className="btn btn-ghost btn-small" onMouseDown={keepFocus} onClick={() => setSelling(id)}>👋 送別（賣出 🪙{value}）</button>;
    }
    const losses = [level > 1 && `Lv ${level}`, tier > 0 && '已升的品階', trials > 0 && `真名考驗 ${trials}/${TRIAL_COUNT}`].filter(Boolean);
    return (
      <div className="sell-confirm">
        <small>送別後得到 🪙{value}，碎片會保留。{losses.length > 0 && <b className="sell-warn">會失去：{losses.join('、')}</b>}之後再召喚到會是新的英雄。</small>
        <button
          className="btn btn-small btn-danger"
          onMouseDown={keepFocus}
          onClick={() => {
            if (sellHero(id)) {
              sfx.coin();
              if (selected === id) {
                setSelected('player');
                setSelectedSlot(null);
                setTab('skills');
              }
            }
            setSelling(null);
          }}
        >
          確定送別
        </button>
        <button className="btn btn-small btn-ghost" onMouseDown={keepFocus} onClick={() => setSelling(null)}>取消</button>
      </div>
    );
  }

  // 隊伍操作按鈕：加入、離隊、設為隊長，以及隊伍滿員時的「一鍵替換」防呆換人機制
  function renderMemberButtons(id: MemberId, inParty: boolean, pos: number, full: boolean) {
    if (inParty) {
      return (
        <span className="hero-actions">
          {pos > 0 && (
            <button className="btn btn-ghost btn-small" onMouseDown={keepFocus} onClick={() => { setLeader(id); sfx.click(); }}>
              👑 設為隊長
            </button>
          )}
          {party.length > 1 && (
            <button
              className="btn btn-ghost btn-small"
              onMouseDown={keepFocus}
              onClick={() => {
                toggleMember(id);
                setSelected('player');
                setSelectedSlot(null);
                sfx.click();
              }}
              title="離開目前出戰隊伍"
            >
              🚪 下陣離隊
            </button>
          )}
        </span>
      );
    }

    // 未在隊伍中且未滿：加入隊伍
    if (!full) {
      return (
        <span className="hero-actions">
          <button
            className="btn btn-small btn-primary"
            onMouseDown={keepFocus}
            onClick={() => {
              toggleMember(id);
              setSelectedSlot(party.length);
              sfx.upgrade();
            }}
          >
            ⚔️ 加入隊伍
          </button>
        </span>
      );
    }

    // 隊伍已滿 4 人：直覺一鍵替換（點選位置或預設替換最後一位，免拖曳）
    const targetSlot = (selectedSlot !== null && selectedSlot >= 0 && selectedSlot < PARTY_MAX)
      ? selectedSlot
      : (party.length - 1);
    const targetMember = party[targetSlot];
    const targetName = targetMember === 'player' ? '主角' : (targetMember ? heroWord(heroDef(targetMember)) : `第 ${targetSlot + 1} 位`);

    return (
      <span className="hero-actions hero-replace-actions">
        <button
          className="btn btn-small btn-primary"
          onMouseDown={keepFocus}
          onClick={() => {
            placeMember(id, targetSlot);
            setSelectedSlot(targetSlot);
            sfx.upgrade();
          }}
          title={`點擊直接替換【第 ${targetSlot + 1} 位：${targetName}】`}
        >
          🔄 替換【第 {targetSlot + 1} 位 {targetName}】
        </button>
        <span className="slot-quick-pick">
          <small className="muted">換至：</small>
          {party.map((m, idx) => (
            <button
              key={idx}
              className={`btn btn-tiny ${targetSlot === idx ? 'btn-secondary' : 'btn-ghost'}`}
              onMouseDown={keepFocus}
              onClick={() => {
                placeMember(id, idx);
                setSelectedSlot(idx);
                sfx.upgrade();
              }}
              title={`換到第 ${idx + 1} 位（${m === 'player' ? '主角' : heroWord(heroDef(m))}）`}
            >
              {idx + 1}位
            </button>
          ))}
        </span>
      </span>
    );
  }
}

// 被動天賦與連攜技（收尾時發動的大招）
function talentRows(talent: TalentId, power: number, classId: ClassId): SkillRow[] {
  const t = TALENTS[talent];
  const f = FINISHERS[classId];
  return [
    { icon: t.icon, label: '天賦', name: t.name, desc: talentDesc(talent, power) },
    { icon: f.icon, label: '連攜', name: f.name, desc: '所有隊員輪流答對一次後，由這位隊員收尾時發動的大招' },
  ];
}

interface SkillRow { icon: string; label: string; name: string; desc: string }
// 技能一行一項（圖示＋名稱＋一句效果），點一下展開完整說明
function SkillList({ rows }: { rows: SkillRow[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <ul className="hd-skills">
      {rows.map((r, i) => (
        <li key={r.label}>
          <button className={`hd-skill ${open === i ? 'is-open' : ''}`} onMouseDown={keepFocus} onClick={() => setOpen(o => (o === i ? null : i))} aria-expanded={open === i}>
            <span className="hd-skill-tag">{r.label}</span>
            <span aria-hidden>{r.icon}</span>
            <b>{r.name}</b>
            <span className="hd-skill-desc">{r.desc}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

// 養成一項：標題、效果、條件（✔ 達成／✘ 還缺）、按鈕
function GrowthRow({ title, effect, reqs, action, onAction }: { title: string; effect: string; reqs: { ok: boolean; text: string }[]; action: string; onAction: () => void }) {
  const ready = reqs.every(r => r.ok);
  return (
    <div className={`growth-row ${ready ? 'is-ready' : ''}`}>
      <div>
        <b>{title}</b>
        <small className="muted">{effect}</small>
        <span className="growth-reqs">{reqs.map(r => <span key={r.text} className={r.ok ? 'req-ok' : 'req-no'}>{r.ok ? '✔' : '✘'} {r.text}</span>)}</span>
      </div>
      <button className="btn btn-small btn-primary" onMouseDown={keepFocus} onClick={onAction} disabled={!ready}>{action}</button>
    </div>
  );
}

// 專武欄位：SSR 英雄與主角專屬武器（安全防禦性可選鏈，根除 TypeError 空指針）
function WeaponSlot({ heroId, classId }: { heroId?: string; classId?: ClassId }) {
  const wp = heroId ? weaponForHero(heroId) : classId ? weaponForClass(classId) : undefined;
  const userWp = useSaveStore(s => (wp && s.weapons ? s.weapons[wp.id] : undefined));
  const shards = useSaveStore(s => (wp && s.weaponShards ? s.weaponShards[wp.id] ?? 0 : 0));
  const gold = useSaveStore(s => s.gold);
  const upgradeWeapon = useSaveStore(s => s.upgradeWeapon);
  if (!wp) return null;

  const isUnlocked = !!userWp?.unlocked;
  const level = userWp?.level ?? 0;
  const cost = weaponUpgradeCost(level);
  const atkMult = Math.round(weaponAtkMultiplier(level) * 100);
  const canUpgrade = isUnlocked && cost && shards >= cost.shards && gold >= cost.gold;

  return (
    <aside
      className={`hd-weapon-anticipation ${isUnlocked ? 'hd-weapon-unlocked' : ''}`}
      style={{ '--wp-color': isUnlocked ? '#ffd15c' : '#a855f7' } as CSSProperties}
      title={`專武【${wp.name}】\n${wp.desc}\n加成：攻擊 +${atkMult}%、${wp.passiveDesc}`}
    >
      <div className="hd-weapon-halo" aria-hidden />
      <div className="hd-weapon-box">
        <span className="hd-weapon-icon" aria-hidden>{wp.icon}</span>
        {isUnlocked ? (
          <span className="hd-weapon-level">+{level}</span>
        ) : (
          <span className="hd-weapon-lock">🔒</span>
        )}
      </div>
      <div className="hd-weapon-details">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <b className="hd-weapon-title">{wp.name}</b>
          {isUnlocked && <span className="badge badge-gold">+{level}</span>}
        </div>
        <span className="hd-weapon-role">攻 +{atkMult}% ｜ {wp.passiveDesc}</span>
        {isUnlocked ? (
          cost ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <button
                className="btn btn-tiny btn-primary"
                onMouseDown={keepFocus}
                onClick={(e) => {
                  e.stopPropagation();
                  if (upgradeWeapon(wp.id)) sfx.forge();
                  else sfx.cantAfford();
                }}
                disabled={!canUpgrade}
                title={`強化需要 ${cost.shards} 碎片、🪙${cost.gold}`}
              >
                強化 (🧩{shards}/{cost.shards} 🪙{cost.gold})
              </button>
            </div>
          ) : (
            <small className="hd-weapon-status" style={{ color: '#ffd15c', fontWeight: 'bold' }}>👑 鍛造極限 (Lv MAX)</small>
          )
        ) : (
          <small className="hd-weapon-status">{heroId ? '完成真名考驗或於專武召喚解鎖' : '於專武召喚/鍛爐解鎖'}</small>
        )}
      </div>
    </aside>
  );
}

// 說明（按「?」打開）：取代畫面上的長篇文字
function HeroHelp() {
  return (
    <ul className="hero-help">
      <li><b>出手順序</b>：格子上的數字就是出手順序，1 號是隊長（先出手、負責困難題）。支援點擊直接換人或拖曳換位。</li>
      <li><b>快速換人</b>：隊伍滿員時，點選想替換的格子或點選圖鑑中的英雄，直接點「🔄 替換」即可一鍵上陣，免去長按拖曳！</li>
      <li><b>星星</b>：SSR 英雄可以用碎片升星，每顆星生命與攻擊 +8%。滑鼠移到星星上（手機點一下）看還差多少碎片。</li>
      <li><b>碎片</b>：重複抽到的英雄會變成碎片；願望碎片（每日碎片題）可以補任何英雄。</li>
      <li><b>升品階</b>：碎片＋金幣＋真名考驗，每位英雄可以升一次（SSR 要先四星），能力大幅提升。</li>
      <li><b>真名考驗</b>：用英雄名字這個英文字出的五道題，每完成一項名字就亮起幾個字母，全部完成能力 +50%。</li>
      <li><b>訓練</b>：用金幣升級，最高到主角等級。金幣可以在每日素材本、時空之塔、錯題修煉場邊複習邊賺。</li>
    </ul>
  );
}
