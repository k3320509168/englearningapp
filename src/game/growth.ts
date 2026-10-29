import type { ClassId } from './character';

// 主角成長：等級與經驗值、轉職樹、被動效果（Mods）。
// 轉職條件 = 等級 + 「突破」（通關指定區域）。每個職業一轉二選一，之後再二選一，最後覺醒。

// ---------- 被動效果 ----------
// 所有加成用「加總」合併：hp / atk / crit 是比例加成，其餘依各自說明
export interface Mods {
  hp: number;          // HP +%
  atk: number;         // 攻擊 +%
  crit: number;        // 暴擊率 +
  critDmg: number;     // 暴擊傷害倍率 +（基本 ×2）
  elementBonus: number; // 屬性剋制時倍率 +（基本 ×1.5）
  timeMs: number;      // 每題 combo 計時 +毫秒（隊伍共用）
  firstHit: number;    // 每關第一擊傷害倍率 +
  lowHp: number;       // 隊伍 HP 低於一半時傷害 +%
  guardEvery: number;  // 每 N combo 得到一次守護（答錯不扣血、不斷 combo）；0 代表沒有
}

export const NO_MODS: Mods = { hp: 0, atk: 0, crit: 0, critDmg: 0, elementBonus: 0, timeMs: 0, firstHit: 0, lowHp: 0, guardEvery: 0 };

export function combineMods(...list: Partial<Mods>[]): Mods {
  return list.reduce<Mods>((acc, m) => ({
    hp: acc.hp + (m.hp ?? 0),
    atk: acc.atk + (m.atk ?? 0),
    crit: acc.crit + (m.crit ?? 0),
    critDmg: acc.critDmg + (m.critDmg ?? 0),
    elementBonus: acc.elementBonus + (m.elementBonus ?? 0),
    timeMs: acc.timeMs + (m.timeMs ?? 0),
    firstHit: acc.firstHit + (m.firstHit ?? 0),
    lowHp: acc.lowHp + (m.lowHp ?? 0),
    // 守護取最短的間隔
    guardEvery: m.guardEvery ? (acc.guardEvery ? Math.min(acc.guardEvery, m.guardEvery) : m.guardEvery) : acc.guardEvery,
  }), { ...NO_MODS });
}

// 把效果寫成玩家看得懂的說明
export function describeMods(m: Partial<Mods>): string[] {
  const out: string[] = [];
  const pct = (v: number) => `${Math.round(v * 100)}%`;
  if (m.hp) out.push(`HP +${pct(m.hp)}`);
  if (m.atk) out.push(`攻擊 +${pct(m.atk)}`);
  if (m.crit) out.push(`暴擊率 +${pct(m.crit)}`);
  if (m.critDmg) out.push(`暴擊傷害 +${pct(m.critDmg)}`);
  if (m.elementBonus) out.push(`屬性剋制傷害 +${pct(m.elementBonus)}`);
  if (m.timeMs) out.push(`每題時間 +${m.timeMs / 1000} 秒`);
  if (m.firstHit) out.push(`每關第一擊傷害 +${pct(m.firstHit)}`);
  if (m.lowHp) out.push(`隊伍 HP 低於一半時傷害 +${pct(m.lowHp)}`);
  if (m.guardEvery) out.push(`每 ${m.guardEvery} combo 獲得一次守護`);
  return out;
}

// ---------- 等級 ----------
export const MAX_LEVEL = 60;
export const LEVEL_STAT = 0.03; // 每級 HP 與攻擊 +3%

// Lv 1～9 每級需求接近（約 100），前期不會一張地圖連升好幾級；
// Lv 1→10 的總量與原本相同（1035），一轉的時間點不變。Lv 10 以後維持 40 + 15×Lv
export const xpToNext = (level: number) => (level < 10 ? 100 + level * 3 : 40 + level * 15);

// 全螢幕慶祝只留給里程碑等級（每 5 級），其他升級在戰鬥畫面跳字就好
export const isMilestoneLevel = (level: number) => level % 5 === 0;

export function levelMods(level: number): Partial<Mods> {
  return { hp: (level - 1) * LEVEL_STAT, atk: (level - 1) * LEVEL_STAT };
}

// 加經驗值，處理連續升級；滿級後不再累積
export function addXp(level: number, xp: number, gained: number): { level: number; xp: number; levelsGained: number } {
  let lv = level;
  let cur = xp + gained;
  while (lv < MAX_LEVEL && cur >= xpToNext(lv)) {
    cur -= xpToNext(lv);
    lv += 1;
  }
  if (lv >= MAX_LEVEL) cur = 0;
  return { level: lv, xp: cur, levelsGained: lv - level };
}

// 戰鬥中獲得的經驗：答對、擊倒；後面的區域給更多
export const XP = { correct: 4, kill: 10, elite: 25, boss: 40 };
export const xpScale = (regionIdx: number) => 1 + regionIdx * 0.5;

// ---------- 轉職樹 ----------
export interface ClassNode {
  id: string;
  name: string;
  en: string;
  tier: 1 | 2 | 3;
  parent: string;       // 上一階：一轉的 parent 是基礎職業 id
  desc: string;
  mods: Partial<Mods>;
}

// 每一階的基礎能力加成
const TIER_STATS: Record<1 | 2 | 3, Partial<Mods>> = {
  1: { hp: 0.15, atk: 0.15 },
  2: { hp: 0.15, atk: 0.15 },
  3: { hp: 0.2, atk: 0.2 },
};

type Branch = [id: string, name: string, en: string, desc: string, mods: Partial<Mods>];

const TREE: Record<ClassId, { first: Branch; second: [Branch, Branch] }[]> = {
  mage: [
    { first: ['elementalist', '元素魔法師', 'Elementalist', '擅長屬性相剋的爆發', { elementBonus: 0.3 }],
      second: [['archmage', '大魔導士', 'Archmage', '純粹的魔力，傷害最高', { atk: 0.2, elementBonus: 0.1 }],
        ['element_lord', '元素領主', 'Element Lord', '把屬性相剋發揮到極致', { elementBonus: 0.4 }]] },
    { first: ['chronomancer', '時空術士', 'Chronomancer', '延長全隊的思考時間', { timeMs: 3000 }],
      second: [['time_sage', '時之賢者', 'Time Sage', '時間的主宰', { timeMs: 3000 }],
        ['astrologer', '星象師', 'Astrologer', '看見未來，攻擊更準', { timeMs: 1000, crit: 0.15 }]] },
  ],
  swordsman: [
    { first: ['squire', '見習騎士', 'Squire', '每累積 5 combo 得到一次守護', { guardEvery: 5 }],
      second: [['paladin', '聖騎士', 'Paladin', '守護更頻繁', { guardEvery: 4, hp: 0.1 }],
        ['dragoon', '龍騎士', 'Dragoon', '攻守兼備', { atk: 0.15, hp: 0.1 }]] },
    { first: ['blade_dancer', '劍舞者', 'Blade Dancer', '高暴擊的連擊手', { crit: 0.1 }],
      second: [['sword_saint', '劍聖', 'Sword Saint', '暴擊傷害極高', { critDmg: 0.6 }],
        ['phantom', '幻影劍客', 'Phantom', '暴擊率極高', { crit: 0.15 }]] },
  ],
  warrior: [
    { first: ['berserker', '狂野戰士', 'Berserker', '血越少越強', { lowHp: 0.4 }],
      second: [['berserker_king', '狂戰士', 'Berserker King', '瀕死時爆發', { lowHp: 0.6 }],
        ['war_god', '戰神', 'War God', '穩定的高攻擊', { atk: 0.2, lowHp: 0.1 }]] },
    { first: ['vanguard', '鐵壁戰士', 'Vanguard', '血量極厚', { hp: 0.3 }],
      second: [['guardian', '守護者', 'Guardian', '更厚的血量與守護', { hp: 0.3, guardEvery: 8 }],
        ['fortress', '要塞巨人', 'Fortress', '能攻能守', { hp: 0.2, atk: 0.15 }]] },
  ],
  archer: [
    { first: ['hunter', '狩獵射手', 'Hunter', '暴擊傷害提高', { critDmg: 0.5 }],
      second: [['sharpshooter', '神射手', 'Sharpshooter', '百發百中', { crit: 0.15, critDmg: 0.2 }],
        ['demon_hunter', '獵魔人', 'Demon Hunter', '對強敵一擊必殺', { critDmg: 0.6 }]] },
    { first: ['ranger', '森林遊俠', 'Ranger', '先制攻擊、多一點時間', { firstHit: 1, timeMs: 2000 }],
      second: [['elf_ranger', '精靈遊俠', 'Elf Ranger', '森林賜予的時間', { timeMs: 2000, firstHit: 0.5 }],
        ['wind_bard', '風之詩人', 'Wind Bard', '開場的一箭最致命', { firstHit: 1.5 }]] },
  ],
};

const node = ([id, name, en, desc, mods]: Branch, tier: 1 | 2, parent: string): ClassNode => ({
  id, name, en, desc, tier, parent, mods: combineMods(TIER_STATS[tier], mods),
});

export const CLASS_NODES: ClassNode[] = (Object.keys(TREE) as ClassId[]).flatMap(cls =>
  TREE[cls].flatMap(({ first, second }) => {
    const t1 = node(first, 1, cls);
    const t2 = second.map(b => node(b, 2, t1.id));
    // 覺醒：該路線的最終形態，再強化一次同樣的特色
    const t3 = t2.map(n => ({
      id: `${n.id}_awake`, name: `覺醒・${n.name}`, en: `Awakened ${n.en}`, tier: 3 as const, parent: n.id,
      desc: `${n.name}的最終形態`, mods: combineMods(TIER_STATS[3], second.find(b => b[0] === n.id)![4]),
    }));
    return [t1, ...t2, ...t3];
  }),
);

export const classNode = (id: string) => CLASS_NODES.find(n => n.id === id);
export const childrenOf = (parent: string) => CLASS_NODES.filter(n => n.parent === parent);

// 轉職條件：等級＋通關區域數（unlockedIndex = 已通關的區域數）
export const ADVANCE_REQ: Record<1 | 2 | 3, { level: number; regionsCleared: number; label: string }> = {
  1: { level: 10, regionsCleared: 1, label: 'Lv 10＋通關第 1 個區域' },
  2: { level: 30, regionsCleared: 3, label: 'Lv 30＋通關第 3 個區域' },
  3: { level: 60, regionsCleared: 6, label: 'Lv 60＋通關第 6 個區域' },
};

// 目前路線的下一階選項（已到覺醒則為空）
export function nextOptions(classId: ClassId, path: string[]): ClassNode[] {
  return childrenOf(path.length ? path[path.length - 1] : classId);
}

export function canAdvance(tier: 1 | 2 | 3, level: number, regionsCleared: number): boolean {
  const req = ADVANCE_REQ[tier];
  return level >= req.level && regionsCleared >= req.regionsCleared;
}

// 目前的職業名稱（例如「元素魔法師」），沒有轉職就是基礎職業名
export function currentClassName(baseName: string, path: string[]): string {
  return path.length ? classNode(path[path.length - 1])?.name ?? baseName : baseName;
}

export const pathMods = (path: string[]) => combineMods(...path.map(id => classNode(id)?.mods ?? {}));
