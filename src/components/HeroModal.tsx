import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import Modal from './Modal';
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { CLASS_SKILL, SKILLS, playerSkillPower, skillDesc } from '../game/progression';
import { classDef, elementDef } from '../game/character';
import {
  HEROES, RARITIES, RARITY_INFO, TIER_UP_GOLD, TIER_UP_SHARDS, currentRarity, heroDef, heroSkill, heroSkillPower, heroStats, heroTitle, heroWord,
} from '../game/heroes';
import type { Rarity } from '../game/heroes';
import { PARTY_MAX } from '../game/party';
import { heroSellValue, trainCost } from '../store/saveStore';
import { RELAY } from '../game/synergy';
import { sfx } from '../game/sfx';
import { LEVEL_STAT } from '../game/growth';
import { TIER_UP_TRIALS, TRIAL_COUNT, TRUE_NAME_BONUS, isTrueName, trialsDone } from '../game/trueName';
import type { MemberId } from '../game/party';
import { avatarDataUrl, heroDataUrl } from '../game/art/sprites';
import { keepFocus } from './keepFocus';

type Filter = 'owned' | 'all' | Rarity;

// 英雄：上方是出戰隊伍（最多 4 人，第一位是隊長），下方是 50 位英雄的圖鑑。
// 點英雄看詳細資料、加入／離開隊伍、升品階。
export default function HeroModal() {
  const { gold, heroes, party, character, heroShards, heroTier, heroLevel, player, tickets, trueName, toggleMember, setLeader, clearParty, tierUp, trainHero, sellHero } = useSaveStore();
  const { closeModal, openModal, openTrueName } = useUiStore();
  const [filter, setFilter] = useState<Filter>('owned');
  const [selected, setSelected] = useState<MemberId | null>(null);
  const [selling, setSelling] = useState<string | null>(null); // 正在確認送別的英雄

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
        <div className="collection-head">
          <p className="shop-gold">出戰隊伍 <b>{party.length}/{PARTY_MAX}</b> <span className="muted">第一位是隊長，負責魔王題</span></p>
          {party.length > 1 && (
            <button className="btn btn-ghost btn-small" onMouseDown={keepFocus} onClick={() => { clearParty(); setSelected(null); }}>全部撤下</button>
          )}
        </div>
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
        <label className="hero-filter">
          顯示
          <select value={filter} onChange={e => setFilter(e.target.value as Filter)}>
            {(['owned', 'all', 'UR', 'SSR', 'SR', 'R', 'N'] as Filter[]).map(f => (
              <option key={f} value={f}>{f === 'owned' ? '已擁有' : f === 'all' ? '全部英雄' : `${f} 品階`}</option>
            ))}
          </select>
        </label>
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
                  <b>{owned ? heroWord(h) : '？？？'}{isTrueName(trueName[h.id]) && <span className="true-mark" title="真名英雄"> ✦</span>}</b>
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
            <p className="skill-line">{skill.icon} {skill.name}：{skillDesc(skill.id, playerSkillPower(player.classPath.length))}</p>
            <p className="skill-line relay-line">接力 {RELAY[character.classId].icon} {RELAY[character.classId].name}：{RELAY[character.classId].desc}</p>
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
    const trials = trialsDone(trueName[id]);
    const canTierUp = owned && tier === 0 && shards >= need && gold >= TIER_UP_GOLD[h.rarity] && trials >= TIER_UP_TRIALS;
    const level = heroLevel[id] ?? 1;
    const levelMult = (1 + (level - 1) * LEVEL_STAT) * (isTrueName(trueName[id]) ? 1 + TRUE_NAME_BONUS : 1);
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
          <p className="skill-line">{skill.signature && <span className="rarity-tag inline">專屬</span>} {skill.icon} {skill.name}：{skillDesc(skill.id, heroSkillPower(h, tier))}</p>
          <p className="skill-line relay-line">接力 {RELAY[h.classId].icon} {RELAY[h.classId].name}：{RELAY[h.classId].desc}{h.classId === 'warrior' ? '；戰士會替隊友擋攻擊' : ''}</p>
          {owned ? (
            <>
              {tier === 0 ? (
                <p className="tier-line">
                  升品階 {h.rarity} → {RARITIES[RARITIES.indexOf(h.rarity) + 1]}：碎片 ◆{shards}/{need}、🪙 {TIER_UP_GOLD[h.rarity]}、真名考驗 {Math.min(trials, TIER_UP_TRIALS)}/{TIER_UP_TRIALS}
                  {' '}<button className="btn btn-small btn-primary" onMouseDown={keepFocus} onClick={() => {
                    if (!tierUp(id)) return;
                    const r = currentRarity(h, 1);
                    useUiStore.getState().celebrate({ icon: '🌟', title: `升品階：${r}`, sub: `${heroWord(h)}・${heroTitle(h)}變得更強了`, img: heroDataUrl(id, 4), color: RARITY_INFO[r].color });
                  }} disabled={!canTierUp}>升品階</button>
                </p>
              ) : <p className="tier-line">✨ 已升品階（{rarity}）</p>}
              <p className="tier-line">
                ✦ 真名考驗 {trials}/{TRIAL_COUNT}{isTrueName(trueName[id]) ? `（真名英雄：能力 +${TRUE_NAME_BONUS * 100}%）` : ''}
                {' '}<button className="btn btn-small btn-primary" onMouseDown={keepFocus} onClick={() => openTrueName(id)}>{isTrueName(trueName[id]) ? '查看' : '挑戰'}</button>
              </p>
              <p className="tier-line">
                訓練 Lv {level} → {level + 1}：🪙 {cost}
                {' '}<button className="btn btn-small" onMouseDown={keepFocus} onClick={() => trainHero(id)} disabled={levelCap || gold < cost}>訓練</button>
                {levelCap && <small className="muted">（英雄等級不能超過主角 Lv {player.level}）</small>}
              </p>
              {renderMemberButtons(id, inParty, pos, full)}
              {renderSell(id, inParty, level, tier, trials)}
            </>
          ) : <p className="muted">尚未擁有：可以透過召喚取得。</p>}
        </div>
      </section>
    );
  }

  // 送別英雄（賣出）：隊伍中的英雄要先離隊；有升品階或真名進度時特別提醒會失去
  function renderSell(id: string, inParty: boolean, level: number, tier: number, trials: number) {
    if (heroes.length <= 1) return null;
    if (inParty) return <p className="muted sell-note">想送別這位英雄，請先讓這位英雄離隊。</p>;
    const value = heroSellValue(id, level, tier);
    if (selling !== id) {
      return <button className="btn btn-ghost btn-small" onMouseDown={keepFocus} onClick={() => setSelling(id)}>👋 送別（賣出 🪙{value}）</button>;
    }
    const losses = [level > 1 && `Lv ${level}`, tier > 0 && '已升的品階', trials > 0 && `真名考驗 ${trials}/${TRIAL_COUNT}`].filter(Boolean);
    return (
      <div className="sell-confirm">
        <small>送別後得到 🪙{value}，碎片會保留。{losses.length > 0 && <b className="sell-warn">會失去：{losses.join('、')}</b>}之後再召喚到會是新的英雄。</small>
        <button className="btn btn-small btn-danger" onMouseDown={keepFocus} onClick={() => { if (sellHero(id)) sfx.coin(); setSelling(null); }}>確定送別</button>
        <button className="btn btn-small btn-ghost" onMouseDown={keepFocus} onClick={() => setSelling(null)}>取消</button>
      </div>
    );
  }

  function renderMemberButtons(id: MemberId, inParty: boolean, pos: number, full: boolean) {
    return (
      <span className="hero-actions">
        {inParty ? (
          <>
            {pos > 0 && <button className="btn btn-small" onMouseDown={keepFocus} onClick={() => setLeader(id)}>設為隊長</button>}
            {/* 只剩一位隊員時不能離隊，直接不顯示 */}
            {party.length > 1 && <button className="btn btn-ghost btn-small" onMouseDown={keepFocus} onClick={() => toggleMember(id)}>離隊</button>}
          </>
        ) : (
          <button className="btn btn-small btn-primary" onMouseDown={keepFocus} onClick={() => toggleMember(id)} disabled={full}>{full ? '隊伍已滿' : '加入隊伍'}</button>
        )}
      </span>
    );
  }
}
