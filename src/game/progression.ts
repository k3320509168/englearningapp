import type { Question } from './types';
import { BASE_DAMAGE, PLAYER_MAX_HP } from './battle';

// 成長系統的數值設定（純資料＋純函式）：永久升級、道具、英雄、三選一 Buff、怪物強度、金幣、SRS 間隔。
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
  tint: number; // 暫用素材時以顏色區分英雄
}

export const HEROES: HeroDef[] = [
  { id: 'knight', icon: '🛡️', name: '騎士', desc: '最大 HP +20，適合新手', cost: 0, tint: 0xffffff },
  { id: 'archer', icon: '🏹', name: '弓箭手', desc: '拼寫、填空題傷害 +30%', cost: 300, tint: 0x9cff9c },
  { id: 'mage', icon: '🔮', name: '法師', desc: '選擇題答錯時 Combo 不會中斷', cost: 300, tint: 0xb9a0ff },
  { id: 'bard', icon: '🎵', name: '吟遊詩人', desc: '口說題傷害 ×2', cost: 300, tint: 0xffd36b },
];

export const heroDef = (id: HeroId) => HEROES.find(h => h.id === id) ?? HEROES[0];

// ---------- 三選一 Buff（只在這一趟冒險有效） ----------
export type BuffId = 'power' | 'speller' | 'sniper' | 'voice' | 'heal' | 'guard' | 'fortune' | 'ember';

export interface BuffDef {
  id: BuffId;
  icon: string;
  name: string;
  desc: string;
  instant?: boolean; // 立即生效、不會留在 Buff 列表
}

export const BUFFS: BuffDef[] = [
  { id: 'power', icon: '💪', name: '力量', desc: '所有傷害 +15%' },
  { id: 'speller', icon: '✍️', name: '拼字專家', desc: '拼寫、填空題傷害 +30%' },
  { id: 'sniper', icon: '🎯', name: '神射手', desc: '選擇題傷害 +30%' },
  { id: 'voice', icon: '🎤', name: '好嗓子', desc: '口說題傷害 +40%' },
  { id: 'heal', icon: '❤️', name: '生命湧泉', desc: '立即回復 40 HP', instant: true },
  { id: 'guard', icon: '🛡️', name: '守護', desc: '立即獲得一次護盾', instant: true },
  { id: 'fortune', icon: '🪙', name: '招財', desc: '金幣 +25%' },
  { id: 'ember', icon: '🕯️', name: '不滅之火', desc: '答錯時 Combo 只減半，不會歸零' },
];

export const buffDef = (id: BuffId) => BUFFS.find(b => b.id === id)!;
export const BUFF_EVERY = 3; // 每打倒 3 隻怪（非 Boss）選一次
export const BUFF_HEAL = 40;

// 已擁有的被動 Buff 仍可再次出現（效果疊加），三個選項彼此不重複
export function rollBuffChoices(random: () => number = Math.random): BuffId[] {
  const pool = BUFFS.map(b => b.id);
  const picked: BuffId[] = [];
  while (picked.length < 3 && picked.length < pool.length) {
    const id = pool[Math.floor(random() * pool.length)];
    if (!picked.includes(id)) picked.push(id);
  }
  return picked;
}

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

const count = (buffs: BuffId[], id: BuffId) => buffs.filter(b => b === id).length;

// Combo 加成：每層 +10%，上限由升級決定
export function comboMultiplier(combo: number, cap = 2): number {
  return Math.min(cap, 1 + 0.1 * Math.max(0, combo - 1));
}

export function computeDamage(q: Question, combo: number, stats: PlayerStats, hero: HeroId, buffs: BuffId[]): number {
  const isTyping = q.type === 'spell' || q.type === 'fill';
  let mult = stats.atkMult * comboMultiplier(combo, stats.comboCap);
  mult *= 1 + 0.15 * count(buffs, 'power');
  if (isTyping) mult *= 1 + 0.3 * count(buffs, 'speller') + (hero === 'archer' ? 0.3 : 0);
  if (q.type === 'choice') mult *= 1 + 0.3 * count(buffs, 'sniper');
  if (q.type === 'voice') mult *= (1 + 0.4 * count(buffs, 'voice')) * (hero === 'bard' ? 2 : 1);
  return Math.round(BASE_DAMAGE * mult);
}

// 答錯後的 Combo：法師答錯選擇題不中斷；不滅之火讓 Combo 減半
export function comboAfterWrong(q: Question, combo: number, hero: HeroId, buffs: BuffId[]): number {
  if (hero === 'mage' && q.type === 'choice') return combo;
  if (buffs.includes('ember')) return Math.floor(combo / 2);
  return 0;
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

export function goldWithBonus(amount: number, stats: PlayerStats, buffs: BuffId[]): number {
  return Math.round(amount * stats.goldMult * (1 + 0.25 * count(buffs, 'fortune')));
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
