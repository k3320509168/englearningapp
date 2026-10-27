import { BASE_DAMAGE } from './battle';
import { classDef } from './character';
import type { Character, Element } from './character';
import { CLASS_SKILL, SKILL_ENERGY } from './progression';
import type { PlayerStats, SkillId } from './progression';
import { heroDef, heroSkill, heroStats, heroWord } from './heroes';
import type { HeroId } from './heroes';

// 隊伍：主角＋夥伴英雄，最多 4 人，可以不派主角。
// 每題由隊伍輪流出手；魔王題由隊長（第一位）出手；敵人回合隨機攻擊一位隊員。

export type MemberId = 'player' | HeroId;
export const PARTY_MAX = 4;

export interface Member {
  id: MemberId;
  name: string;
  element: Element;
  maxHp: number;
  hp: number;
  atk: number;
  crit: number;
  skill: SkillId;
  energy: number;
}

export function buildMember(id: MemberId, character: Character | null, stats: PlayerStats, tier = 0): Member {
  if (id === 'player') {
    const c = character!;
    const cls = classDef(c.classId);
    const maxHp = Math.round(stats.maxHp * cls.stats.hp);
    return {
      id, name: c.name, element: c.element, maxHp, hp: maxHp,
      atk: BASE_DAMAGE * stats.atkMult * cls.stats.atk, crit: cls.stats.crit,
      skill: CLASS_SKILL[c.classId], energy: 0,
    };
  }
  const h = heroDef(id);
  const hs = heroStats(h, tier);
  const maxHp = Math.round(stats.maxHp * hs.hp);
  return {
    id, name: heroWord(h), element: h.element, maxHp, hp: maxHp,
    atk: BASE_DAMAGE * stats.atkMult * hs.atk, crit: hs.crit,
    skill: heroSkill(h), energy: 0,
  };
}

export function buildParty(
  ids: MemberId[], owned: HeroId[], character: Character | null, stats: PlayerStats, tiers: Record<HeroId, number> = {},
): Member[] {
  return normalizeParty(ids, owned, character !== null).map(id => buildMember(id, character, stats, tiers[id] ?? 0));
}

// 存檔修正：只留下擁有的成員、不重複、最多 4 人；空隊伍時至少派一位
export function normalizeParty(ids: MemberId[], owned: HeroId[], hasCharacter: boolean): MemberId[] {
  const valid = ids.filter((id, i) =>
    ids.indexOf(id) === i && (id === 'player' ? hasCharacter : owned.includes(id)));
  const party = valid.slice(0, PARTY_MAX);
  if (party.length === 0) party.push(hasCharacter ? 'player' : owned[0] ?? 'knight');
  return party;
}

export const isAlive = (m: Member) => m.hp > 0;

// 從 from 開始（含）找下一位還站著的隊員
export function nextAlive(party: Member[], from: number): number {
  for (let i = 0; i < party.length; i++) {
    const idx = (from + i) % party.length;
    if (isAlive(party[idx])) return idx;
  }
  return -1;
}

export const leaderIndex = (party: Member[]) => nextAlive(party, 0);

export function partyHp(party: Member[]) {
  return {
    hp: party.reduce((sum, m) => sum + m.hp, 0),
    maxHp: party.reduce((sum, m) => sum + m.maxHp, 0),
  };
}

export const skillReady = (m: Member) => isAlive(m) && m.energy >= SKILL_ENERGY;

// 答對一題：站著的隊員各 +1 能量
export function gainEnergy(party: Member[]): Member[] {
  return party.map(m => (isAlive(m) ? { ...m, energy: Math.min(SKILL_ENERGY, m.energy + 1) } : m));
}
