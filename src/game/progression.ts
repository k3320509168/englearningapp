import { BASE_DAMAGE, PLAYER_MAX_HP } from './battle';
import { LEVEL_STAT } from './growth';
import { regionStageCount } from './stageLayout';
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
  | 'prayer' | 'blessing' | 'angelWing'  // 僧侶
  | 'rebirth' | 'eclipse' | 'storm' | 'sanctum' | 'valor' | 'calm' | 'maze' | 'aurora' | 'tenacity'; // SSR 專屬

// 技能效果的組成（數值已經套用威力）
export interface SkillEffect {
  shield?: boolean;     // 下一次答錯不扣血，Combo 不中斷
  heal?: number;        // 全隊回復最大 HP 的 %
  revive?: boolean;     // 倒下的隊員復活（回復 heal %）
  timeThis?: number;    // 這一題多幾秒
  timeStage?: number;   // 這一關每題多幾秒
  amplify?: number;     // 接下來幾次攻擊傷害翻倍
  charge?: number;      // 下一次答對的傷害倍率
  bossCharge?: boolean; // 頭目關時 charge 再 ×1.5
  crits?: number;       // 接下來幾次攻擊必定暴擊
  combo?: number;       // Combo 直接增加
  bossStep?: boolean;   // 下一次困難題 Bonus 保底
  breakShield?: number; // 削掉菁英怪幾層護盾
}

export interface SkillDef {
  id: SkillId;
  icon: string;
  name: string;
  signature?: boolean; // SSR 專屬技
  cost: number;        // 技能 CD：答對幾題能量才集滿（每位隊員答對一題全隊各 +1）
  opening?: boolean;   // 搶攻：出戰時能量就是滿的，一開場就能施放
  effect: (power: number) => SkillEffect;
}

const r = Math.round;
const r1 = (n: number) => Math.round(n * 10) / 10;

// 技能 CD 的原則：輔助型 3～4 題、攻擊型 4～5 題、治療復活與 SSR 專屬 5～7 題；
// 搶攻型（戰意高昂、專注、英勇號令、寧靜之心）開場就能放，放完才進 CD
export const SKILLS: Record<SkillId, SkillDef> = {
  guard: { id: 'guard', icon: '🛡️', name: '守護之盾', cost: 4, effect: p => ({ shield: true, heal: r(8 * p) }) },
  slash: { id: 'slash', icon: '⚔️', name: '劍氣斬', cost: 4, effect: p => ({ charge: r1(1.5 + 1.5 * p) }) },
  rally: { id: 'rally', icon: '📯', name: '戰意高昂', cost: 4, opening: true, effect: p => ({ combo: r(5 * p) }) },
  focus: { id: 'focus', icon: '🎯', name: '專注', cost: 5, opening: true, effect: p => ({ timeStage: r(4 * p) }) },
  arrowRain: { id: 'arrowRain', icon: '🏹', name: '箭雨', cost: 4, effect: p => ({ crits: r(2 * p) }) },
  pierce: { id: 'pierce', icon: '🪡', name: '破甲箭', cost: 4, effect: p => ({ breakShield: p >= 1.35 ? 3 : 2, charge: r1(1 + 0.5 * p) }) },
  amplify: { id: 'amplify', icon: '✨', name: '魔力增幅', cost: 4, effect: p => ({ amplify: r(2.5 * p) }) },
  heal: { id: 'heal', icon: '💚', name: '治癒之光', cost: 5, effect: p => ({ heal: r(25 * p) }) },
  fireball: { id: 'fireball', icon: '🔥', name: '元素爆裂', cost: 5, effect: p => ({ charge: r1(1.2 + 1.5 * p), crits: 1 }) },
  haste: { id: 'haste', icon: '⏩', name: '加速之歌', cost: 3, effect: p => ({ timeThis: r(8 * p) }) },
  quake: { id: 'quake', icon: '🪨', name: '大地震擊', cost: 5, effect: p => ({ charge: r1(1 + 1.2 * p), bossCharge: true }) },
  fortify: { id: 'fortify', icon: '🧱', name: '鋼鐵意志', cost: 5, effect: p => ({ shield: true, heal: r(15 * p) }) },
  prayer: { id: 'prayer', icon: '🙏', name: '祈禱', cost: 5, effect: p => ({ shield: true, heal: r(22 * p) }) },
  blessing: { id: 'blessing', icon: '🌟', name: '聖光祝福', cost: 4, effect: p => ({ amplify: r(2 * p), combo: r(2 * p) }) },
  angelWing: { id: 'angelWing', icon: '👼', name: '天使之翼', cost: 6, effect: p => ({ revive: true, heal: r(18 * p), timeThis: 5 }) },
  rebirth: { id: 'rebirth', icon: '🐦‍🔥', name: '浴火重生', signature: true, cost: 7, effect: p => ({ revive: true, heal: r(30 * p) }) },
  eclipse: { id: 'eclipse', icon: '🌑', name: '日蝕斬', signature: true, cost: 6, effect: p => ({ charge: r1(2 + 2 * p) }) },
  storm: { id: 'storm', icon: '🌪️', name: '暴風連射', signature: true, cost: 5, effect: p => ({ crits: r(2 * p) + 1, charge: r1(1 + 0.4 * p) }) },
  sanctum: { id: 'sanctum', icon: '⛪', name: '聖域結界', signature: true, cost: 6, effect: p => ({ shield: true, heal: r(25 * p), timeThis: 5 }) },
  valor: { id: 'valor', icon: '🎖️', name: '英勇號令', signature: true, cost: 6, opening: true, effect: p => ({ combo: r(12 * p), bossStep: true }) },
  calm: { id: 'calm', icon: '🍃', name: '寧靜之心', signature: true, cost: 6, opening: true, effect: p => ({ timeStage: r(5 * p), heal: r(12 * p) }) },
  maze: { id: 'maze', icon: '🌀', name: '迷宮困敵', signature: true, cost: 5, effect: p => ({ breakShield: 3, charge: r1(1 + p) }) },
  aurora: { id: 'aurora', icon: '🌌', name: '極光祝福', signature: true, cost: 6, effect: p => ({ heal: r(25 * p), amplify: 3 }) },
  // 堅韌（第二十二輪）：攻守兼備的土屬性劍士——下一擊 ×3.6（SSR）並得到一次守護（答錯不扣血、不斷 combo）
  tenacity: { id: 'tenacity', icon: '🪨', name: '磐岩誓斬', signature: true, cost: 6, effect: p => ({ charge: r1(1.2 + 1.5 * p), shield: true }) },
};

// 各職業的技能池；第一個是主角的技能
export const CLASS_SKILLS: Record<ClassId, SkillId[]> = {
  swordsman: ['guard', 'slash', 'rally'],
  archer: ['focus', 'arrowRain', 'pierce'],
  mage: ['amplify', 'heal', 'fireball'],
  warrior: ['haste', 'quake', 'fortify'],
  monk: ['prayer', 'blessing', 'angelWing'],
};
export const CLASS_SKILL: Record<ClassId, SkillId> = {
  mage: 'amplify', swordsman: 'guard', warrior: 'haste', archer: 'focus', monk: 'prayer',
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
  if (e.amplify) parts.push(`接下來 ${e.amplify} 次攻擊傷害翻倍`);
  if (e.combo) parts.push(`Combo +${e.combo}`);
  if (e.bossStep) parts.push(`下一次困難題 Bonus 保底 ×${BOSS_BONUS_FLOOR}`);
  if (e.breakShield) parts.push(e.breakShield >= ELITE_SHIELD ? '菁英怪護盾全破' : `菁英怪護盾 -${e.breakShield} 層`);
  if (e.timeThis) parts.push(`這一題多 ${e.timeThis} 秒`);
  if (e.timeStage) parts.push(`這一關每題多 ${e.timeStage} 秒`);
  return parts.join('，');
}

// 每答對一題，全隊每人 +1 能量；集滿（技能的 CD）就能施放技能。SKILL_ENERGY 是一般技能的 CD
export const SKILL_ENERGY = 4;
export const skillCost = (id: SkillId) => SKILLS[id].cost;
// 技能的 CD 說明，例如「CD 答對 4 題・開場就能施放」
export const skillTiming = (id: SkillId) => `CD 答對 ${SKILLS[id].cost} 題${SKILLS[id].opening ? '・開場就能施放（搶攻）' : ''}`;

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

// Combo 加成（第二十一輪，0～100 萬）：在錨點之間做對數插值，combo 越高永遠越痛，但不會爆炸。
// 沒有升級時：10 ×2.0、20 ×2.8、50 ×4.2、100 ×5.4、300 ×7.5、1000 ×9.8、1 萬 ×14.5、10 萬 ×21、100 萬 ×28。
// 高 combo 的爽度主要交給 12 階招式演出與首領處決，而不是讓數值失控（含升級最多 ×40）
export const COMBO_POINTS: readonly [number, number][] = [
  [0, 1], [10, 2], [20, 2.8], [50, 4.2], [100, 5.4], [300, 7.5], [1000, 9.8], [3000, 11.8],
  [10000, 14.5], [30000, 17.2], [100000, 21], [300000, 24.5], [1000000, 28],
];
export const COMBO_MULT_CAP = 40;
function baseComboMultiplier(combo: number): number {
  const c = Math.max(0, combo);
  for (let i = 1; i < COMBO_POINTS.length; i++) {
    const [x1, y1] = COMBO_POINTS[i];
    if (c > x1) continue;
    const [x0, y0] = COMBO_POINTS[i - 1];
    const t = x0 === 0 ? c / x1 : Math.log(c / x0) / Math.log(x1 / x0);
    return y0 + (y1 - y0) * t;
  }
  return 28 + 1.5 * Math.log10(c / 1000000);
}
// step：每層加成（0.1，商店 Combo 升級每級 +0.02）。升級照原本的比例放大 combo 加成，已買的升級不會變弱
export function comboMultiplier(combo: number, step = 0.1): number {
  return Math.min(COMBO_MULT_CAP, 1 + (baseComboMultiplier(combo) - 1) * (step / 0.1));
}

// 困難題 Bonus：每 8 題出一題困難題（優先出你答錯過的題目），答對時「目前的 combo × 隨機倍數」。
// ×1、×2 最常見，×10 很稀有（期望值約 ×2.4）；倍數只加在 combo 上，傷害由上面的遞減曲線控制
export const BOSS_QUESTION_EVERY = 8;
export const BOSS_BONUS_TABLE: { mult: number; weight: number }[] = [
  { mult: 1, weight: 34 },
  { mult: 2, weight: 33 },
  { mult: 3, weight: 20 },
  { mult: 5, weight: 10 },
  { mult: 10, weight: 3 },
];
// floor：英勇號令等技能保底的最低倍數（只從 ≥ floor 的倍數裡抽）
export function rollBossBonus(rand: () => number, floor = 1): number {
  const table = BOSS_BONUS_TABLE.filter(b => b.mult >= floor);
  const total = table.reduce((sum, b) => sum + b.weight, 0);
  let x = rand() * total;
  for (const b of table) {
    x -= b.weight;
    if (x < 0) return b.mult;
  }
  return table[table.length - 1].mult;
}
export const BOSS_BONUS_FLOOR = 3;

export interface DamageInput {
  atk: number;
  combo: number;
  comboStep: number;
  element: number; // 屬性相剋倍率
  amplify: boolean;
  crit: boolean;
  speed?: number;    // 快答加成
  critMult?: number; // 暴擊倍率（基本 ×2，轉職可提高）
  extra?: number;    // 其他被動倍率（每關第一擊、低血量加成…）
}

export function computeDamage(d: DamageInput): number {
  const mult = comboMultiplier(d.combo, d.comboStep) * d.element * (d.amplify ? 2 : 1) * (d.crit ? d.critMult ?? 2 : 1) * (d.speed ?? 1) * (d.extra ?? 1);
  return Math.max(1, Math.round(d.atk * mult));
}

// ---------- 怪物強度 ----------
// 以「區域第一關、沒有 Combo、沒有升級時要答對幾題」來設計：一般怪約 3 題、頭目約 14 題。
// 怪物的數值以「同等級英雄」為基底：英雄每級 +3%、裝備每區約 +12%（和遊戲裡加總能力的方式一樣）；
// 怪物用自己的等級（菁英 +2、守門頭目 +3、區域魔王 +5）套同一個公式，再乘上「比單一英雄更強一點」的係數，
// 這個係數每區 +8%：A1、A2 和英雄差不多，越後面越需要 combo、轉職、天賦和技能才打得動。
// 第九輪平衡（製作人：正確率 90% 以上、combo 接得好，就要能過關）：怪物改以「推薦等級、裝備只跟上一半」的英雄為基準，
// 每區的「更強一點」係數也降低。裝備、轉職、天賦是讓英文還不夠好的玩家也能過關的加分，不是必備
export const HITS_TO_KILL = { normal: 3, boss: 14 };
// 第十三輪：等級改成 200 級、每級 +0.65%。怪物 = 同等級英雄 ×（1 + 每區一點點）——比沒穿裝備的英雄強一點，
// 裝備跟上的英雄就輕鬆（裝備每區約 +EQUIP_PER_REGION）
export const HERO_LEVEL_STAT = LEVEL_STAT;
export const EQUIP_PER_REGION = 0.06;
export const MONSTER_EDGE_PER_REGION = 0.015;
export type FoeKind = 'elite' | 'gate' | 'boss' | 'final';

// 推薦等級、跟上裝備的英雄，能力是 Lv 1 的幾倍（progress = 區域 + 區內進度，例如 B1 中段 = 3.5）
export const heroScale = (level: number, progress: number) =>
  (1 + HERO_LEVEL_STAT * (level - 1)) * (1 + EQUIP_PER_REGION * progress);
export const regionProgress = (levelIdx: number, stageIdx: number) => levelIdx + stageIdx / regionStageCount(levelIdx);

export function monsterGrowth(stageIdx: number, levelIdx: number, kind?: FoeKind): number {
  const progress = regionProgress(levelIdx, stageIdx);
  return (1 + HERO_LEVEL_STAT * (monsterLevel(levelIdx, stageIdx, kind) - 1)) * (1 + MONSTER_EDGE_PER_REGION * progress);
}

// ---------- 關卡長度、首領、祝福（第四輪與 Gemini、第五輪與 ChatGPT 討論後定案） ----------
// 一般關：連續 WAVES 隻怪物，每隻約 1～2 擊。combo 高時一擊一隻、一路秒殺很爽；
// 程度還不夠時每隻多打一兩下，一關大約 5～8 題。
export const NORMAL_WAVES = 5;
export const WAVE_HITS = 1.3;
export const waveMaxHp = (stageIdx: number, levelIdx: number) =>
  Math.round(BASE_DAMAGE * WAVE_HITS * monsterGrowth(stageIdx, levelIdx));

// 首領沒有統一的護盾（第五輪和 ChatGPT 定案）：不同首領靠各自的技能變化（bossSkills.ts），
// 傷害再高也要答完最低題數（stageLayout.ts），提前打到 0 血就進入終結連擊。
// 首領的血量：以「打到這裡時一般玩家的 combo」打 hits 擊來設計（小 BOSS 12、大 BOSS 16、區域魔王 22）。
// combo 從整張地圖延續進首領戰，參考 combo 每區提高（區域魔王用全額、大 BOSS 8 成、小 BOSS 6 成）
export const REGION_BOSS_COMBO = [15, 22, 30, 40, 50, 60, 72, 85, 100];
export const BOSS_HITS = { gate: 12, boss: 16, final: 22 };
export type BossRole = keyof typeof BOSS_HITS;
export const bossReferenceCombo = (levelIdx: number, role: BossRole) => {
  const full = REGION_BOSS_COMBO[Math.min(levelIdx, REGION_BOSS_COMBO.length - 1)];
  // 區域魔王是新的一張地圖，從 0 combo 開打，所以參考 combo 比大 BOSS 低（第九輪）
  return Math.round(full * (role === 'final' ? 0.8 : role === 'boss' ? 0.8 : 0.6));
};
// 大 BOSS 平衡（第六輪：模擬發現答對率較低的玩家在 B1+ 以後的大 BOSS 突然撞牆）：
// 大 BOSS 與區域魔王的血量與攻擊照下表打折，小 BOSS 只打一半的折扣。一般怪不變
const BOSS_HP_SCALE = [1, 1, 0.95, 0.92, 0.88, 0.9, 0.82, 0.8, 0.78];
const BOSS_ATK_SCALE = [1, 1, 0.95, 0.9, 0.85, 0.88, 0.88, 0.85, 0.82];
const regionScale = (table: number[], levelIdx: number, role: BossRole) => {
  const v = table[Math.min(Math.max(0, levelIdx), table.length - 1)];
  return role === 'gate' ? 1 - (1 - v) / 2 : v;
};
export function bossMaxHp(stageIdx: number, levelIdx: number, role: BossRole): number {
  const ref = bossReferenceCombo(levelIdx, role);
  let units = 0;
  for (let k = 0; k < BOSS_HITS[role]; k++) units += comboMultiplier(ref + k);
  return Math.round(BASE_DAMAGE * units * monsterGrowth(stageIdx, levelIdx, role) * regionScale(BOSS_HP_SCALE, levelIdx, role));
}
// 魔王祝福：首領戰（以及觸發祝福的一般關）答錯時 combo 只扣 30%，不會歸零
export const BLESSED_COMBO_KEEP = 0.7;
export const BLESSING_DAMAGE = 1.2; // 一般關失敗後的祝福：全隊傷害 +20%
// 同一關失敗幾次後有多少機率得到祝福：失敗 1 次 50%、2 次以上必定
export const blessingChance = (fails: number) => (fails >= 2 ? 1 : fails === 1 ? 0.5 : 0);

// ---------- 敵人等級與推薦戰力（第四輪） ----------
// 第十三輪：九區的推薦等級（入區 → 通關），區內越後面越高；菁英 +2、小 BOSS +3、大 BOSS +4、區域魔王 +5
// A1 從 Lv5 開始：Lv1～5 是前置區域「失語邊境」
export const REGION_LEVELS: [number, number][] = [[5, 20], [21, 40], [41, 60], [61, 80], [81, 100], [101, 120], [121, 145], [146, 170], [171, 200]];
export const recommendedLevel = (levelIdx: number, stageIdx: number) => {
  const [from, to] = REGION_LEVELS[Math.min(Math.max(0, levelIdx), REGION_LEVELS.length - 1)];
  return Math.min(200, from + Math.floor((stageIdx / regionStageCount(levelIdx)) * (to - from)));
};
export function monsterLevel(levelIdx: number, stageIdx: number, kind?: FoeKind): number {
  return recommendedLevel(levelIdx, stageIdx) + (kind === 'final' ? 5 : kind === 'boss' ? 4 : kind === 'gate' ? 3 : kind === 'elite' ? 2 : 0);
}

// 戰力：每位隊員「攻擊 × 10 ＋ 生命」，隊伍加總
export const memberPower = (m: { atk: number; maxHp: number }) => Math.round(m.atk * 10 + m.maxHp);
export const teamPower = (party: { atk: number; maxHp: number }[]) => party.reduce((sum, m) => sum + memberPower(m), 0);
// 推薦戰力：4 位隊員都在推薦等級、裝備跟上區域進度時的戰力
export function recommendedPower(levelIdx: number, stageIdx: number): number {
  const member = (BASE_DAMAGE * 10 + PLAYER_MAX_HP) * heroScale(recommendedLevel(levelIdx, stageIdx), regionProgress(levelIdx, stageIdx));
  return Math.round(member * 4);
}
// 戰力比較：綠色（輕鬆）、黃色（有挑戰）、紅色（很吃力）
export const powerVerdict = (mine: number, recommended: number) =>
  (mine >= recommended ? 'easy' : mine >= recommended * 0.75 ? 'fair' : 'hard') as 'easy' | 'fair' | 'hard';

// 關卡變化：菁英怪有護盾，要答對 ELITE_SHIELD 題打破才會受傷（答錯會恢復一層）；
// 寶箱怪不會攻擊，限時內每次命中都掉金幣，打開寶箱有大獎，時間到就逃走
export const ELITE_SHIELD = 3;
export const ELITE_HP_MULT = 1.5;
export const TREASURE_TIME = 30_000;
export const TREASURE_HITS = 6;

export function monsterMaxHp(stageIdx: number, levelIdx: number, isBoss: boolean, kind?: FoeKind): number {
  const hits = isBoss ? HITS_TO_KILL.boss : HITS_TO_KILL.normal;
  return Math.round(BASE_DAMAGE * hits * monsterGrowth(stageIdx, levelIdx, kind));
}

// 打倒頭目可得到召喚券（抽英雄用）
export const TICKETS = { bossKill: 1, revengeKill: 2, levelClear: 5 };

// 怪物攻擊（答錯或行動條集滿時打隊員）：和血量用同一個成長。
// 一般怪一擊約同等級英雄生命的 20%、首領 30%；每區的「更強一點」係數讓後期一擊越來越痛
export const monsterAttack = (isBoss: boolean, levelIdx = 0, stageIdx = 0, kind?: FoeKind) =>
  Math.round((isBoss ? 30 : 20) * monsterGrowth(stageIdx, levelIdx, kind)
    * (isBoss && (kind === 'gate' || kind === 'boss' || kind === 'final') ? regionScale(BOSS_ATK_SCALE, levelIdx, kind) : 1));

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
// 錯題本畢業：在「不同的三天」各答對一次（間隔 1 天 → 3 天 → 7 天）就離開錯題本。
// 間隔提取比同一天連續答對記得更牢（間隔效應、提取練習）；同一天答對只算當下的複習，不累積次數，
// 答錯就從頭開始。box = 已經在不同天答對的次數；SRS_INTERVALS[box + 1] 是下一次該複習的間隔
export const SRS_INTERVALS = [0, 1 * DAY, 3 * DAY, 7 * DAY];
export const SRS_MASTERED_BOX = 3;

// ---------- 圖鑑熟練度 ----------
export function masteryStars(correct: number): number {
  return correct >= 5 ? 3 : correct >= 3 ? 2 : correct >= 1 ? 1 : 0;
}
