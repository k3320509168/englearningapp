import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import Modal from './Modal';
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { CLASS_SKILL, HEROES, SKILLS } from '../game/progression';
import type { SkillId } from '../game/progression';
import { classDef, elementDef } from '../game/character';
import type { Element } from '../game/character';
import { PARTY_MAX } from '../game/party';
import type { MemberId } from '../game/party';
import { avatarDataUrl, heroDataUrl } from '../game/art/sprites';
import { keepFocus } from './keepFocus';

interface Entry {
  id: MemberId;
  name: string;
  desc: string;
  element: Element;
  skill: SkillId;
  portrait: string;
  owned: boolean;
  cost: number;
}

// 隊伍編成：主角＋夥伴英雄，最多 4 人，可以不派主角。第一位是隊長（負責魔王題）
export default function HeroModal() {
  const { gold, heroes, party, character, buyHero, toggleMember, setLeader } = useSaveStore();
  const closeModal = useUiStore(s => s.closeModal);

  const entries = useMemo<Entry[]>(() => {
    const list: Entry[] = HEROES.map(h => ({
      id: h.id, name: h.name, desc: h.desc, element: h.element, skill: h.skill,
      portrait: heroDataUrl(h.id), owned: heroes.includes(h.id), cost: h.cost,
    }));
    if (character) {
      const cls = classDef(character.classId);
      list.unshift({
        id: 'player', name: character.name, desc: `主角・${cls.name}（${cls.role}）`, element: character.element,
        skill: CLASS_SKILL[character.classId], portrait: avatarDataUrl(character, 'idle', 3), owned: true, cost: 0,
      });
    }
    return list;
  }, [character, heroes]);

  const full = party.length >= PARTY_MAX;

  return (
    <Modal title="⚔️ 隊伍" onClose={closeModal}>
      <p className="shop-gold">
        出戰 <b>{party.length}/{PARTY_MAX}</b> ・ 持有金幣 <b>🪙 {gold}</b>
      </p>
      <p className="muted party-note">每題由隊伍輪流出手；第一位是隊長，負責「魔王題」。答對累積能量，滿了點頭像施放技能。</p>
      <ul className="hero-grid">
        {entries.map(e => {
          const pos = party.indexOf(e.id);
          const inParty = pos >= 0;
          const el = elementDef(e.element);
          const skill = SKILLS[e.skill];
          return (
            <li key={e.id} className={`hero-card ${inParty ? 'is-selected' : ''}`}>
              {inParty && <span className="party-pos">{pos === 0 ? '👑 隊長' : `第 ${pos + 1} 位`}</span>}
              <img className="hero-portrait" src={e.portrait} alt="" />
              <b>{e.name} <span className="el-badge" style={{ '--el': el.color } as CSSProperties}>{el.name}</span></b>
              <span className="muted">{e.desc}</span>
              <span className="skill-line">{skill.icon} {skill.name}：{skill.desc}</span>
              {!e.owned ? (
                <button className="btn btn-primary btn-small" onMouseDown={keepFocus} onClick={() => buyHero(e.id as Exclude<MemberId, 'player'>)} disabled={gold < e.cost}>解鎖 🪙 {e.cost}</button>
              ) : inParty ? (
                <span className="hero-actions">
                  {pos > 0 && <button className="btn btn-small" onMouseDown={keepFocus} onClick={() => setLeader(e.id)}>設為隊長</button>}
                  <button className="btn btn-ghost btn-small" onMouseDown={keepFocus} onClick={() => toggleMember(e.id)} disabled={party.length <= 1}>離隊</button>
                </span>
              ) : (
                <button className="btn btn-small" onMouseDown={keepFocus} onClick={() => toggleMember(e.id)} disabled={full}>{full ? '隊伍已滿' : '加入隊伍'}</button>
              )}
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
