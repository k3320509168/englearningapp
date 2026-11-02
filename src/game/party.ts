import { BASE_DAMAGE } from './battle';
import { classDef } from './character';
import type { Character, ClassId, Element } from './character';
import { CLASS_SKILL, SKILLS, playerSkillPower } from './progression';
import type { PlayerStats, SkillId } from './progression';
import { heroDef, heroSkill, heroSkillPower, heroStats, heroWord } from './heroes';
import type { HeroId } from './heroes';
import { NO_MODS, combineMods, levelMods, pathMods } from './growth';
import type { Mods } from './growth';
import { equipMods } from './equipment';
import type { OwnedEquip } from './equipment';
import { TRUE_NAME_BONUS, isTrueName } from './trueName';
import { weaponForHero, weaponForClass, weaponCombinedMods } from './weapons';
import { CLASS_TALENT, heroTalent } from './talents';
import type { TalentId } from './talents';

// 隊伍：主角＋夥伴英雄，最多 4 人，可以不派主角。
// 每題由隊伍輪流出手；困難題由隊長（第一位）出手；敵人回合隨機攻擊一位隊員。

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
  skillPower: number; // 技能威力：稀有度（主角看轉職）越高越強
  energy: number;
  energyMax: number; // 技能 CD：能量集滿才能施放
  mods: Mods; // 等級、轉職、裝備帶來的被動效果
  classId: ClassId; // 職業：決定出手後給下一位隊員的接力加成
  talent: TalentId; // 被動天賦（數值跟著 skillPower 成長）
}

// 主角的成長資料
export interface PlayerGrowth {
  level: number;
  classPath: string[];
  equipped: OwnedEquip[];
}

export function playerMods(g: PlayerGrowth): Mods {
  return combineMods(levelMods(g.level), pathMods(g.classPath), ...g.equipped.map(equipMods));
}

export interface PartyOptions {
  tiers?: Record<HeroId, number>;
  stars?: Record<HeroId, number>;
  heroLevels?: Record<HeroId, number>;
  trueName?: Record<HeroId, boolean[]>;
  growth?: PlayerGrowth;
  weapons?: Record<string, { level: number; unlocked: boolean }>;
}

// 主角的基礎數值和 SSR 英雄同級（第十三輪）：主角多出來的只有轉職與裝備，全程大約在 SSR 英雄的 ±15% 內，
// 不會「主角絕對最強」
export const PLAYER_BASE_MULT = 1.45;

// 出戰時的能量：搶攻型技能一開場就是滿的
const skillEnergy = (id: SkillId) => ({ energy: SKILLS[id].opening ? SKILLS[id].cost : 0, energyMax: SKILLS[id].cost });

export function buildMember(id: MemberId, character: Character | null, stats: PlayerStats, opts: PartyOptions = {}): Member {
  if (id === 'player') {
    const c = character!;
    const cls = classDef(c.classId);
    let mods = opts.growth ? playerMods(opts.growth) : { ...NO_MODS };
    const classWp = weaponForClass(c.classId);
    if (classWp && opts.weapons?.[classWp.id]?.unlocked) {
      mods = combineMods(mods, weaponCombinedMods(classWp, opts.weapons[classWp.id].level));
    }
    const base = opts.growth ? PLAYER_BASE_MULT : 1; // 黃金之路只用最基礎的主角
    const maxHp = Math.round(stats.maxHp * cls.stats.hp * base * (1 + mods.hp));
    return {
      id, name: c.name, element: c.element, maxHp, hp: maxHp,
      atk: BASE_DAMAGE * stats.atkMult * cls.stats.atk * base * (1 + mods.atk), crit: cls.stats.crit + mods.crit,
      skill: CLASS_SKILL[c.classId], skillPower: playerSkillPower(opts.growth?.classPath.length ?? 0), ...skillEnergy(CLASS_SKILL[c.classId]), mods, classId: c.classId,
      talent: CLASS_TALENT[c.classId],
    };
  }
  const h = heroDef(id);
  const hs = heroStats(h, opts.tiers?.[id] ?? 0, opts.stars?.[id] ?? 0);
  // 真名英雄：基礎能力 +50%
  const named = isTrueName(opts.trueName?.[id]) ? TRUE_NAME_BONUS : 0;
  let mods = combineMods(levelMods(opts.heroLevels?.[id] ?? 1), { hp: named, atk: named });
  const heroWp = weaponForHero(id);
  if (heroWp && opts.weapons?.[heroWp.id]?.unlocked) {
    mods = combineMods(mods, weaponCombinedMods(heroWp, opts.weapons[heroWp.id].level));
  }
  const maxHp = Math.round(stats.maxHp * hs.hp * (1 + mods.hp));
  return {
    id, name: heroWord(h), element: h.element, maxHp, hp: maxHp,
    atk: BASE_DAMAGE * stats.atkMult * hs.atk * (1 + mods.atk), crit: hs.crit,
    skill: heroSkill(h), skillPower: heroSkillPower(h, opts.tiers?.[id] ?? 0), ...skillEnergy(heroSkill(h)), mods, classId: h.classId,
    talent: heroTalent(h.id),
  };
}

export function buildParty(
  ids: MemberId[], owned: HeroId[], character: Character | null, stats: PlayerStats, opts: PartyOptions = {},
): Member[] {
  return normalizeParty(ids, owned, character !== null).map(id => buildMember(id, character, stats, opts));
}

// 隊伍共用的被動：每題多出的時間（加總）、守護間隔（最短）
export function teamTimeBonus(party: Member[]): number {
  return party.filter(isAlive).reduce((sum, m) => sum + m.mods.timeMs, 0);
}

export function teamGuardEvery(party: Member[]): number {
  const list = party.filter(isAlive).map(m => m.mods.guardEvery).filter(n => n > 0);
  return list.length ? Math.min(...list) : 0;
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

export const skillReady = (m: Member) => isAlive(m) && m.energy >= m.energyMax;

// 答對一題：站著的隊員各 +1 能量
export function gainEnergy(party: Member[]): Member[] {
  return party.map(m => (isAlive(m) ? { ...m, energy: Math.min(m.energyMax, m.energy + 1) } : m));
}
