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
  { id: 'shield', icon: '🛡️', name: '護盾', desc: '擋下下一次答錯或超時：不扣血、combo 不中斷', cost: 35 },
];

export const POTION_HEAL = 30;

// ---------- 技能 ----------
// 每個職業有 3 種技能，英雄依名字固定分到其中一種；SSR 英雄有自己的專屬技。
// 技能強度看「技能威力」：稀有度越高（升品階也算）越強，主角則隨轉職變強。
export type SkillId =
  | 'guard' | 'slash' | 'rally'          // 劍士
  | 'focus' | 'arrowRain' | 'pierce'     // 弓箭手
  | 'amplify' | 'heal' | 'fireball'      // 魔法師
  | 'haste' | 'quake' | 'fortify'        // 戰士
  | 'rebirth' | 'eclipse' | 'storm' | 'sanctum' | 'valor' | 'calm' | 'maze' | 'aurora'; // SSR 專屬

// 技能效果的組成（數值已經套用威力）
export interface SkillEffect {
  shield?: boolean;     // 下一次答錯不扣血，Combo 不中斷
  heal?: number;        // 全隊回復最大 HP 的 %
  revive?: boolean;     // 倒下的隊員復活（回復 heal %）
  timeThis?: number;    // 這一題多幾秒
  timeStage?: number;   // 這一關每題多幾秒
  amplify?: number;     // 接下來幾次攻擊傷害與魔王題倍率翻倍
  charge?: number;      // 下一次答對的傷害倍率
  bossCharge?: boolean; // 頭目關時 charge 再 ×1.5
  crits?: number;       // 接下來幾次攻擊必定暴擊
  combo?: number;       // Combo 直接增加
  bossStep?: boolean;   // 魔王題倍率直接進一階
  breakShield?: number; // 削掉菁英怪幾層護盾
}

export interface SkillDef {
  id: SkillId;
  icon: string;
  name: string;
  signature?: boolean; // SSR 專屬技
  effect: (power: number) => SkillEffect;
}

const r = Math.round;
const r1 = (n: number) => Math.round(n * 10) / 10;

export const SKILLS: Record<SkillId, SkillDef> = {
  guard: { id: 'guard', icon: '🛡️', name: '守護之盾', effect: p => ({ shield: true, heal: r(8 * p) }) },
  slash: { id: 'slash', icon: '⚔️', name: '劍氣斬', effect: p => ({ charge: r1(1.5 + 1.5 * p) }) },
  rally: { id: 'rally', icon: '📯', name: '戰意高昂', effect: p => ({ combo: r(2 * p) }) },
  focus: { id: 'focus', icon: '🎯', name: '專注', effect: p => ({ timeStage: r(4 * p) }) },
  arrowRain: { id: 'arrowRain', icon: '🏹', name: '箭雨', effect: p => ({ crits: r(2 * p) }) },
  pierce: { id: 'pierce', icon: '🪡', name: '破甲箭', effect: p => ({ breakShield: p >= 1.35 ? 3 : 2, charge: r1(1 + 0.5 * p) }) },
  amplify: { id: 'amplify', icon: '✨', name: '魔力增幅', effect: p => ({ amplify: r(2.5 * p) }) },
  heal: { id: 'heal', icon: '💚', name: '治癒之光', effect: p => ({ heal: r(25 * p) }) },
  fireball: { id: 'fireball', icon: '🔥', name: '元素爆裂', effect: p => ({ charge: r1(1.2 + 1.5 * p), crits: 1 }) },
  haste: { id: 'haste', icon: '⏩', name: '加速之歌', effect: p => ({ timeThis: r(8 * p) }) },
  quake: { id: 'quake', icon: '🪨', name: '大地震擊', effect: p => ({ charge: r1(1 + 1.2 * p), bossCharge: true }) },
  fortify: { id: 'fortify', icon: '🧱', name: '鋼鐵意志', effect: p => ({ shield: true, heal: r(15 * p) }) },
  rebirth: { id: 'rebirth', icon: '🐦‍🔥', name: '浴火重生', signature: true, effect: p => ({ revive: true, heal: r(30 * p) }) },
  eclipse: { id: 'eclipse', icon: '🌑', name: '日蝕斬', signature: true, effect: p => ({ charge: r1(2 + 2 * p) }) },
  storm: { id: 'storm', icon: '🌪️', name: '暴風連射', signature: true, effect: p => ({ crits: r(2 * p) + 1, charge: r1(1 + 0.4 * p) }) },
  sanctum: { id: 'sanctum', icon: '⛪', name: '聖域結界', signature: true, effect: p => ({ shield: true, heal: r(25 * p), timeThis: 5 }) },
  valor: { id: 'valor', icon: '🎖️', name: '英勇號令', signature: true, effect: p => ({ combo: r(3 * p), bossStep: true }) },
  calm: { id: 'calm', icon: '🍃', name: '寧靜之心', signature: true, effect: p => ({ timeStage: r(5 * p), heal: r(12 * p) }) },
  maze: { id: 'maze', icon: '🌀', name: '迷宮困敵', signature: true, effect: p => ({ breakShield: 3, charge: r1(1 + p) }) },
  aurora: { id: 'aurora', icon: '🌌', name: '極光祝福', signature: true, effect: p => ({ heal: r(25 * p), amplify: 3 }) },
};

// 各職業的技能池；第一個是主角的技能
export const CLASS_SKILLS: Record<ClassId, SkillId[]> = {
  swordsman: ['guard', 'slash', 'rally'],
  archer: ['focus', 'arrowRain', 'pierce'],
  mage: ['amplify', 'heal', 'fireball'],
  warrior: ['haste', 'quake', 'fortify'],
};
export const CLASS_SKILL: Record<ClassId, SkillId> = {
  mage: 'amplify', swordsman: 'guard', warrior: 'haste', archer: 'focus',
};

// 技能威力：N 最弱，UR 最強
export const RARITY_POWER = { N: 1, R: 1.15, SR: 1.35, SSR: 1.6, UR: 1.9 } as const;
// 主角：轉職一次威力 +0.2
export const playerSkillPower = (classTier: number) => r1(1.15 + 0.2 * classTier);

export const skillEffect = (id: SkillId, power: number) => SKILLS[id].effect(power);

// 技能說明（依威力算出實際數值）
export function skillDesc(id: SkillId, power: number): string {
  const e = skillEffect(id, power);
  const parts: string[] = [];
  if (e.revive) parts.push('倒下的隊員復活');
  if (e.shield) parts.push('下一次答錯不扣血、Combo 不中斷');
  if (e.heal) parts.push(`全隊回復 ${e.heal}% HP`);
  if (e.charge) parts.push(`下一次答對傷害 ×${e.charge}${e.bossCharge ? '（頭目再 ×1.5）' : ''}`);
  if (e.crits) parts.push(`接下來 ${e.crits} 次攻擊必定暴擊`);
  if (e.amplify) parts.push(`接下來 ${e.amplify} 次攻擊傷害與魔王題倍率翻倍`);
  if (e.combo) parts.push(`Combo +${e.combo}`);
  if (e.bossStep) parts.push('魔王題倍率直接進一階');
  if (e.breakShield) parts.push(e.breakShield >= ELITE_SHIELD ? '菁英怪護盾全破' : `菁英怪護盾 -${e.breakShield} 層`);
  if (e.timeThis) parts.push(`這一題多 ${e.timeThis} 秒`);
  if (e.timeStage) parts.push(`這一關每題多 ${e.timeStage} 秒`);
  return parts.join('，');
}

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
  speed?: number;    // 快答加成
  critMult?: number; // 暴擊倍率（基本 ×2，轉職可提高）
  extra?: number;    // 其他被動倍率（每關第一擊、低血量加成…）
}

export function computeDamage(d: DamageInput): number {
  const mult = comboMultiplier(d.combo, d.comboStep) * d.bossMult * d.element * (d.amplify ? 2 : 1) * (d.crit ? d.critMult ?? 2 : 1) * (d.speed ?? 1) * (d.extra ?? 1);
  return Math.max(1, Math.round(d.atk * mult));
}

// ---------- 怪物強度 ----------
// 以「區域第一關、沒有 Combo、沒有升級時要答對幾題」來設計：一般怪約 3 題、頭目約 14 題。
// 之後每一關都比前一關硬一點，打完一整個區域（50 關）強度 ×1.4，下一個區域再接著往上。
// 主角升級只能追上一部分，越後面越需要升級攻擊力、裝備、轉職、技能與 Combo 才打得動。
export const HITS_TO_KILL = { normal: 3, boss: 14 };
export const REGION_GROWTH = 1.4;
export const STAGES_PER_REGION = 50;

export function monsterGrowth(stageIdx: number, levelIdx: number): number {
  return REGION_GROWTH ** (levelIdx + stageIdx / STAGES_PER_REGION);
}

// 關卡變化：菁英怪有護盾，要答對 ELITE_SHIELD 題打破才會受傷（答錯會恢復一層）；
// 寶箱怪不會攻擊，限時內每次命中都掉金幣，打開寶箱有大獎，時間到就逃走
export const ELITE_SHIELD = 3;
export const ELITE_HP_MULT = 1.5;
export const TREASURE_TIME = 30_000;
export const TREASURE_HITS = 6;

export function monsterMaxHp(stageIdx: number, levelIdx: number, isBoss: boolean): number {
  const hits = isBoss ? HITS_TO_KILL.boss : HITS_TO_KILL.normal;
  return Math.round(BASE_DAMAGE * hits * monsterGrowth(stageIdx, levelIdx));
}

// 打倒頭目可得到召喚券（抽英雄用）
export const TICKETS = { bossKill: 1, revengeKill: 2, levelClear: 5 };

// 怪物攻擊（答錯時打一位隊員）：同樣隨區域與關卡變強。
// 第一區約 20 次答錯才會全滅（4 人隊伍），最後一區沒升級生命時約 9 次，所以生命升級與藥水越後面越重要
export const ATTACK_GROWTH = 1.35;
export const monsterAttack = (isBoss: boolean, levelIdx = 0, stageIdx = 0) =>
  Math.round((isBoss ? 30 : 20) * ATTACK_GROWTH ** (levelIdx + stageIdx / STAGES_PER_REGION));

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
  treasureHit: 4,
  treasureOpen: 60,
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
