import { BASE_DAMAGE, PLAYER_MAX_HP } from './battle';
import type { ClassId, Element } from './character';

// 成長系統的數值設定（純資料＋純函式）：永久升級、道具、英雄、技能、傷害、怪物強度、金幣、SRS 間隔。
// 平衡調整只需要改這個檔案。

// ---------- 永久升級（商店） ----------
export type UpgradeId = 'hp' | 'atk' | 'combo' | 'gold';

export interface UpgradeDef {
  id: UpgradeId;
  icon: string;
  name: string;
  desc: (level: number) => string;
  maxLevel: number;
  baseCost: number;
}

export const UPGRADES: UpgradeDef[] = [
  { id: 'hp', icon: '❤️', name: '生命上限', desc: l => `最大 HP +${l * 10}`, maxLevel: 5, baseCost: 50 },
  { id: 'atk', icon: '⚔️', name: '攻擊力', desc: l => `傷害 +${l * 10}%`, maxLevel: 5, baseCost: 60 },
  { id: 'combo', icon: '🔥', name: 'Combo 加成', desc: l => `每層 Combo 傷害 +${10 + l * 2}%`, maxLevel: 3, baseCost: 80 },
  { id: 'gold', icon: '🪙', name: '金幣加成', desc: l => `金幣 +${l * 10}%`, maxLevel: 3, baseCost: 70 },
];

// 第 n 級的價格：基本價 × n（第 1 級 = 基本價）
export function upgradeCost(def: UpgradeDef, currentLevel: number): number {
  return def.baseCost * (currentLevel + 1);
}

// ---------- 消耗道具 ----------
export type ItemId = 'potion' | 'hint' | 'shield';

export interface ItemDef {
  id: ItemId;
  icon: string;
  name: string;
  desc: string;
  cost: number;
}

export const ITEMS: ItemDef[] = [
  { id: 'potion', icon: '🧪', name: '回復藥水', desc: '全隊立即回復 30 HP', cost: 40 },
  { id: 'hint', icon: '💡', name: '提示卷軸', desc: '刪掉兩個錯誤選項，或提示第一個字母、顯示口說單字', cost: 30 },
  { id: 'shield', icon: '🛡️', name: '護盾', desc: '擋下下一次答錯的傷害', cost: 35 },
];

export const POTION_HEAL = 30;

// ---------- 夥伴英雄 ----------
export type HeroId = 'knight' | 'archer' | 'mage' | 'bard';

export interface HeroDef {
  id: HeroId;
  icon: string;
  name: string;
  desc: string;
  cost: number;
  element: Element;
  stats: { hp: number; atk: number; crit: number };
  skill: SkillId;
}

export const HEROES: HeroDef[] = [
  { id: 'knight', icon: '🛡️', name: '騎士', desc: '耐打的守護者，技能「守護之盾」', cost: 0, element: 'light', stats: { hp: 1.2, atk: 0.9, crit: 0.05 }, skill: 'guard' },
  { id: 'archer', icon: '🏹', name: '弓箭手', desc: '暴擊率高，技能「專注」延長每題時間', cost: 300, element: 'wood', stats: { hp: 0.9, atk: 1.0, crit: 0.2 }, skill: 'focus' },
  { id: 'mage', icon: '🔮', name: '法師', desc: '傷害最高，技能「魔力增幅」傷害翻倍', cost: 300, element: 'fire', stats: { hp: 0.8, atk: 1.3, crit: 0.05 }, skill: 'amplify' },
  { id: 'bard', icon: '🎵', name: '吟遊詩人', desc: '輔助型，技能「加速之歌」延長回合', cost: 300, element: 'water', stats: { hp: 1.0, atk: 0.9, crit: 0.1 }, skill: 'haste' },
];

export const heroDef = (id: HeroId) => HEROES.find(h => h.id === id) ?? HEROES[0];

// ---------- 技能 ----------
export type SkillId = 'guard' | 'focus' | 'amplify' | 'haste';

export interface SkillDef {
  id: SkillId;
  icon: string;
  name: string;
  desc: string;
}

export const SKILLS: Record<SkillId, SkillDef> = {
  guard: { id: 'guard', icon: '🛡️', name: '守護之盾', desc: '下一次答錯不扣血，Combo 也不會中斷' },
  focus: { id: 'focus', icon: '🎯', name: '專注', desc: '這回合每一題多 3 秒' },
  amplify: { id: 'amplify', icon: '✨', name: '魔力增幅', desc: '這回合傷害與魔王題倍率翻倍' },
  haste: { id: 'haste', icon: '⏩', name: '加速之歌', desc: '這回合的時間 +5 秒' },
};

// 主角的技能依職業決定
export const CLASS_SKILL: Record<ClassId, SkillId> = {
  mage: 'amplify', swordsman: 'guard', warrior: 'haste', archer: 'focus',
};

// 每答對一題，全隊每人 +1 能量；集滿就能施放技能
export const SKILL_ENERGY = 4;

// ---------- 玩家能力（商店升級） ----------
export interface PlayerStats {
  maxHp: number;     // 隊員的基礎 HP（再乘上各自的職業倍率）
  atkMult: number;
  comboStep: number; // 每層 Combo 增加的傷害
  goldMult: number;
}

export function playerStats({ upgrades }: { upgrades: Record<UpgradeId, number> }): PlayerStats {
  return {
    maxHp: PLAYER_MAX_HP + upgrades.hp * 10,
    atkMult: 1 + upgrades.atk * 0.1,
    comboStep: 0.1 + upgrades.combo * 0.02,
    goldMult: 1 + upgrades.gold * 0.1,
  };
}

// Combo 加成：每層 +10%（可升級），沒有上限——英文越好傷害越高
export function comboMultiplier(combo: number, step = 0.1): number {
  return 1 + step * Math.max(0, combo);
}

// 魔王題倍率：依序答對 ×2 → ×3 → ×5，之後每題 ×5，全部連乘
export const BOSS_QUESTION_STEPS = [2, 3, 5];
export const BOSS_QUESTION_EVERY = 5;

export function bossStep(chain: number): number {
  return BOSS_QUESTION_STEPS[Math.min(chain, BOSS_QUESTION_STEPS.length - 1)];
}

export interface DamageInput {
  atk: number;
  combo: number;
  comboStep: number;
  bossMult: number;
  element: number; // 屬性相剋倍率
  amplify: boolean;
  crit: boolean;
}

export function computeDamage(d: DamageInput): number {
  const mult = comboMultiplier(d.combo, d.comboStep) * d.bossMult * d.element * (d.amplify ? 2 : 1) * (d.crit ? 2 : 1);
  return Math.max(1, Math.round(d.atk * mult));
}

// ---------- 怪物強度 ----------
// 以「沒有 Combo、沒有升級時要答對幾題」來設計：一般怪約 2.5 題、頭目約 12 題。
// 關卡與區域越後面越硬，所以升級攻擊力仍然有意義；Combo 與魔王題倍率可以大幅縮短。
export const HITS_TO_KILL = { normal: 2.5, boss: 12 };

export function monsterGrowth(stageIdx: number, levelIdx: number): number {
  return (1 + stageIdx * 0.02) * (1 + levelIdx * 0.3);
}

export function monsterMaxHp(stageIdx: number, levelIdx: number, isBoss: boolean): number {
  const hits = isBoss ? HITS_TO_KILL.boss : HITS_TO_KILL.normal;
  return Math.round(BASE_DAMAGE * hits * monsterGrowth(stageIdx, levelIdx));
}

export const monsterAttack = (isBoss: boolean, levelIdx = 0) => Math.round((isBoss ? 15 : 10) * (1 + levelIdx * 0.2));

// 怪物屬性：依區域與關卡輪替，讓玩家有機會換隊伍打剋制
const ELEMENT_ORDER: Element[] = ['wood', 'water', 'fire', 'earth', 'metal', 'light', 'dark'];
export function monsterElement(stageIdx: number, levelIdx: number, isRevenge = false): Element {
  if (isRevenge) return 'dark';
  return ELEMENT_ORDER[(levelIdx * 2 + Math.floor(stageIdx / 3)) % ELEMENT_ORDER.length];
}

// ---------- 金幣 ----------
export const GOLD = {
  correct: 2,
  kill: 10,
  bossKill: 30,
  revengeKill: 50,
  levelClear: 100,
};

export function goldWithBonus(amount: number, stats: PlayerStats): number {
  return Math.round(amount * stats.goldMult);
}

// ---------- 間隔重複（SRS，Leitner 盒子） ----------
// 答錯 → 第 0 盒，下一個 Boss 就會複習；之後每答對一次升一盒，間隔拉長；第 5 次答對視為熟練
const DAY = 24 * 60 * 60 * 1000;
export const SRS_INTERVALS = [0, 1 * DAY, 3 * DAY, 7 * DAY, 14 * DAY];
export const SRS_MASTERED_BOX = SRS_INTERVALS.length;

// ---------- 圖鑑熟練度 ----------
export function masteryStars(correct: number): number {
  return correct >= 5 ? 3 : correct >= 3 ? 2 : correct >= 1 ? 1 : 0;
}
