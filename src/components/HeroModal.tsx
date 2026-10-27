import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import Modal from './Modal';
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { CLASS_SKILL, SKILLS } from '../game/progression';
import { classDef, elementDef } from '../game/character';
import {
  HEROES, RARITIES, RARITY_INFO, TIER_UP_GOLD, TIER_UP_SHARDS, currentRarity, heroDef, heroSkill, heroStats, heroTitle, heroWord,
} from '../game/heroes';
import type { Rarity } from '../game/heroes';
import { PARTY_MAX } from '../game/party';
import { trainCost } from '../store/saveStore';
import { LEVEL_STAT } from '../game/growth';
import type { MemberId } from '../game/party';
import { avatarDataUrl, heroDataUrl } from '../game/art/sprites';
import { keepFocus } from './keepFocus';

type Filter = 'owned' | 'all' | Rarity;

// 英雄：上方是出戰隊伍（最多 4 人，第一位是隊長），下方是 50 位英雄的圖鑑。
// 點英雄看詳細資料、加入／離開隊伍、升品階。
export default function HeroModal() {
  const { gold, heroes, party, character, heroShards, heroTier, heroLevel, player, tickets, toggleMember, setLeader, tierUp, trainHero } = useSaveStore();
  const { closeModal, openModal } = useUiStore();
  const [filter, setFilter] = useState<Filter>('owned');
  const [selected, setSelected] = useState<MemberId | null>(null);

  const portraits = useMemo(() => {
    const map: Record<string, string> = Object.fromEntries(HEROES.map(h => [h.id, heroDataUrl(h.id, 2)]));
    if (character) map.player = avatarDataUrl(character, 'idle', 2, player.classPath.length);
    return map;
  }, [character, player.classPath.length]);

  const list = HEROES
    .filter(h => filter === 'all' || (filter === 'owned' ? heroes.includes(h.id) : currentRarity(h, heroTier[h.id] ?? 0) === filter))
    .sort((a, b) => RARITIES.indexOf(currentRarity(b, heroTier[b.id] ?? 0)) - RARITIES.indexOf(currentRarity(a, heroTier[a.id] ?? 0)));

  return (
    <Modal title="⚔️ 隊伍與英雄" onClose={closeModal} wide>
      <section className="party-slots">
        <p className="shop-gold">出戰隊伍 <b>{party.length}/{PARTY_MAX}</b> <span className="muted">第一位是隊長，負責魔王題</span></p>
        <div className="party-row">
          {Array.from({ length: PARTY_MAX }, (_, i) => {
            const id = party[i];
            if (!id) return <div key={i} className="party-slot is-empty">空位</div>;
            const name = id === 'player' ? character?.name ?? '' : heroWord(heroDef(id));
            return (
              <button key={id} className={`party-slot ${selected === id ? 'is-selected' : ''}`} onMouseDown={keepFocus} onClick={() => setSelected(id)}>
                {i === 0 && <span className="party-pos">👑</span>}
                <img src={portraits[id]} alt="" />
                <span>{name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {selected && renderDetail(selected)}

      <section className="hero-collection">
        <div className="collection-head">
          <p className="shop-gold">收集 <b>{heroes.length}/{HEROES.length}</b></p>
          <button className="btn btn-primary btn-small" onMouseDown={keepFocus} onClick={() => openModal('summon')}>🔮 召喚（🎫 {tickets}）</button>
        </div>
        <div className="tabs tabs-scroll" role="tablist">
          {(['owned', 'all', 'UR', 'SSR', 'SR', 'R', 'N'] as Filter[]).map(f => (
            <button key={f} role="tab" aria-selected={filter === f} className={`tab ${filter === f ? 'is-active' : ''}`} onMouseDown={keepFocus} onClick={() => setFilter(f)}>
              {f === 'owned' ? '已擁有' : f === 'all' ? '全部' : f}
            </button>
          ))}
        </div>
        <ul className="hero-tiles">
          {character && filter === 'owned' && (
            <li>
              <button className={`hero-tile ${party.includes('player') ? 'in-party' : ''}`} onMouseDown={keepFocus} onClick={() => setSelected('player')}>
                <img src={portraits.player} alt="" />
                <b>{character.name}</b>
                <small>主角</small>
              </button>
            </li>
          )}
          {list.map(h => {
            const owned = heroes.includes(h.id);
            const rarity = currentRarity(h, heroTier[h.id] ?? 0);
            return (
              <li key={h.id}>
                <button
                  className={`hero-tile ${owned ? '' : 'is-locked'} ${party.includes(h.id) ? 'in-party' : ''}`}
                  style={{ '--rarity': RARITY_INFO[rarity].color } as CSSProperties}
                  onMouseDown={keepFocus}
                  onClick={() => setSelected(h.id)}
                  aria-label={`${rarity} ${heroWord(h)} ${heroTitle(h)}${owned ? '' : '（未擁有）'}`}
                >
                  <span className="rarity-tag">{rarity}</span>
                  <img src={portraits[h.id]} alt="" />
                  <b>{owned ? heroWord(h) : '？？？'}</b>
                  <small>{owned ? heroTitle(h) : h.meaning}</small>
                  {(heroShards[h.id] ?? 0) > 0 && <span className="shard-tag">◆{heroShards[h.id]}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </section>
      <p className="muted party-note">持有金幣 🪙 {gold}。重複召喚到的英雄會變成碎片，集滿可以升一個品階（每位英雄只能升一次）。</p>
    </Modal>
  );

  function renderDetail(id: MemberId) {
    const pics = portraits;
    const inParty = party.includes(id);
    const pos = party.indexOf(id);
    const full = party.length >= PARTY_MAX;

    if (id === 'player') {
      if (!character) return null;
      const cls = classDef(character.classId);
      const skill = SKILLS[CLASS_SKILL[character.classId]];
      const el = elementDef(character.element);
      return (
        <section className="hero-detail">
          <img src={pics.player} alt="" />
          <div>
            <h3>{character.name} <span className="el-badge" style={{ '--el': el.color } as CSSProperties}>{el.name}</span></h3>
            <p className="muted">主角・{cls.name}（{cls.role}）</p>
            <p className="skill-line">{skill.icon} {skill.name}：{skill.desc}</p>
            {renderMemberButtons(id, inParty, pos, full)}
          </div>
        </section>
      );
    }

    const h = heroDef(id);
    const owned = heroes.includes(id);
    const tier = heroTier[id] ?? 0;
    const rarity = currentRarity(h, tier);
    const stats = heroStats(h, tier);
    const el = elementDef(h.element);
    const skill = SKILLS[heroSkill(h)];
    const shards = heroShards[id] ?? 0;
    const need = TIER_UP_SHARDS[h.rarity];
    const canTierUp = owned && tier === 0 && shards >= need && gold >= TIER_UP_GOLD[h.rarity];
    const level = heroLevel[id] ?? 1;
    const levelMult = 1 + (level - 1) * LEVEL_STAT;
    const cost = trainCost(level, ['N', 'R', 'SR', 'SSR'].indexOf(h.rarity));
    const levelCap = level >= player.level;
    return (
      <section className="hero-detail" style={{ '--rarity': RARITY_INFO[rarity].color } as CSSProperties}>
        <img src={pics[id]} alt="" className={owned ? '' : 'is-locked'} />
        <div>
          <h3>
            <span className="rarity-tag inline">{rarity}</span> {heroWord(h)}
            {' '}<span className="el-badge" style={{ '--el': el.color } as CSSProperties}>{el.name}</span>
          </h3>
          <p className="muted">{h.id}：{h.meaning}・{heroTitle(h)}（{classDef(h.classId).role}）</p>
          <p className="hero-stats">Lv {level} ・ HP ×{(stats.hp * levelMult).toFixed(2)} ・ 攻擊 ×{(stats.atk * levelMult).toFixed(2)} ・ 暴擊 {Math.round(stats.crit * 100)}%</p>
          <p className="skill-line">{skill.icon} {skill.name}：{skill.desc}</p>
          {owned ? (
            <>
              {tier === 0 ? (
                <p className="tier-line">
                  升品階 {h.rarity} → {RARITIES[RARITIES.indexOf(h.rarity) + 1]}：碎片 ◆{shards}/{need}、🪙 {TIER_UP_GOLD[h.rarity]}
                  {' '}<button className="btn btn-small btn-primary" onMouseDown={keepFocus} onClick={() => tierUp(id)} disabled={!canTierUp}>升品階</button>
                </p>
              ) : <p className="tier-line">✨ 已升品階（{rarity}）</p>}
              <p className="tier-line">
                訓練 Lv {level} → {level + 1}：🪙 {cost}
                {' '}<button className="btn btn-small" onMouseDown={keepFocus} onClick={() => trainHero(id)} disabled={levelCap || gold < cost}>訓練</button>
                {levelCap && <small className="muted">（英雄等級不能超過主角 Lv {player.level}）</small>}
              </p>
              {renderMemberButtons(id, inParty, pos, full)}
            </>
          ) : <p className="muted">尚未擁有：可以透過召喚取得。</p>}
        </div>
      </section>
    );
  }

  function renderMemberButtons(id: MemberId, inParty: boolean, pos: number, full: boolean) {
    return (
      <span className="hero-actions">
        {inParty ? (
          <>
            {pos > 0 && <button className="btn btn-small" onMouseDown={keepFocus} onClick={() => setLeader(id)}>設為隊長</button>}
            <button className="btn btn-ghost btn-small" onMouseDown={keepFocus} onClick={() => toggleMember(id)} disabled={party.length <= 1}>離隊</button>
          </>
        ) : (
          <button className="btn btn-small btn-primary" onMouseDown={keepFocus} onClick={() => toggleMember(id)} disabled={full}>{full ? '隊伍已滿' : '加入隊伍'}</button>
        )}
      </span>
    );
  }
}
