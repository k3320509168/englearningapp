import type { Question } from './types';
import { BASE_DAMAGE, PLAYER_MAX_HP } from './battle';

// 成長系統的數值設定（純資料＋純函式）：永久升級、道具、英雄、怪物強度、金幣、SRS 間隔。
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
  { id: 'combo', icon: '🔥', name: 'Combo 上限', desc: l => `Combo 最高倍率 ${(2 + l * 0.2).toFixed(1)} 倍`, maxLevel: 3, baseCost: 80 },
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
  { id: 'potion', icon: '🧪', name: '回復藥水', desc: '立即回復 30 HP', cost: 40 },
  { id: 'hint', icon: '💡', name: '提示卷軸', desc: '刪掉兩個錯誤選項，或提示第一個字母、顯示口說單字', cost: 30 },
  { id: 'shield', icon: '🛡️', name: '護盾', desc: '擋下下一次答錯的傷害', cost: 35 },
];

export const POTION_HEAL = 30;

// ---------- 英雄 ----------
export type HeroId = 'knight' | 'archer' | 'mage' | 'bard';

export interface HeroDef {
  id: HeroId;
  icon: string;
  name: string;
  desc: string;
  cost: number;
}

export const HEROES: HeroDef[] = [
  { id: 'knight', icon: '🛡️', name: '騎士', desc: '最大 HP +20，適合新手', cost: 0 },
  { id: 'archer', icon: '🏹', name: '弓箭手', desc: '拼寫、填空題傷害 +30%', cost: 300 },
  { id: 'mage', icon: '🔮', name: '法師', desc: '選擇題答錯時 Combo 不會中斷', cost: 300 },
  { id: 'bard', icon: '🎵', name: '吟遊詩人', desc: '口說題傷害 ×2', cost: 300 },
];

export const heroDef = (id: HeroId) => HEROES.find(h => h.id === id) ?? HEROES[0];

// ---------- 玩家能力 ----------
export interface Loadout {
  upgrades: Record<UpgradeId, number>;
  hero: HeroId;
}

export interface PlayerStats {
  maxHp: number;
  atkMult: number;
  comboCap: number;
  goldMult: number;
}

export function playerStats({ upgrades, hero }: Loadout): PlayerStats {
  return {
    maxHp: PLAYER_MAX_HP + upgrades.hp * 10 + (hero === 'knight' ? 20 : 0),
    atkMult: 1 + upgrades.atk * 0.1,
    comboCap: 2 + upgrades.combo * 0.2,
    goldMult: 1 + upgrades.gold * 0.1,
  };
}

// Combo 加成：每層 +10%，上限由升級決定
export function comboMultiplier(combo: number, cap = 2): number {
  return Math.min(cap, 1 + 0.1 * Math.max(0, combo - 1));
}

export function computeDamage(q: Question, combo: number, stats: PlayerStats, hero: HeroId): number {
  const isTyping = q.type === 'spell' || q.type === 'fill';
  let mult = stats.atkMult * comboMultiplier(combo, stats.comboCap);
  if (isTyping && hero === 'archer') mult *= 1.3;
  if (q.type === 'voice' && hero === 'bard') mult *= 2;
  return Math.round(BASE_DAMAGE * mult);
}

// 答錯後的 Combo：法師答錯選擇題不中斷，其他情況歸零
export function comboAfterWrong(q: Question, combo: number, hero: HeroId): number {
  return hero === 'mage' && q.type === 'choice' ? combo : 0;
}

// ---------- 怪物強度 ----------
// 關卡越後面怪物越硬：第 1 關一下打倒，後段需要 3~4 下（靠 Combo 與升級可以更快）
export function monsterMaxHp(stageIdx: number, levelIdx: number, isBoss: boolean): number {
  const base = 50 + stageIdx * 3;
  return Math.round(base * (1 + levelIdx * 0.15) * (isBoss ? 2 : 1));
}

export const monsterAttack = (isBoss: boolean) => (isBoss ? 15 : 10);

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
