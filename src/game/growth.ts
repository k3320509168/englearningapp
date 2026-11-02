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
// 等級（第十三輪，和 ChatGPT 討論）：主角最高 Lv 200，每轉職一次上限提高（未轉職 40、一轉 80、二轉 120、三轉 160、覺醒 200）；
// 英雄最高 180（UR 200），也不能超過主角。每級 HP 與攻擊 +0.65%（線性，Lv 200 約 ×2.29）——
// 等級讓人有感，但不會比英文（combo）更重要
export const MAX_LEVEL = 200;
export const PLAYER_LEVEL_CAPS = [40, 80, 120, 160, 200];
export const playerLevelCap = (classTier: number) => PLAYER_LEVEL_CAPS[Math.min(Math.max(0, classTier), PLAYER_LEVEL_CAPS.length - 1)];
export const HERO_LEVEL_CAPS: Record<string, number> = { N: 180, R: 180, SR: 180, SSR: 180, UR: 200 };
export const LEVEL_STAT = 0.0065;
export const levelMult = (level: number) => 1 + (level - 1) * LEVEL_STAT;

// 升級需求：100 + 10×Lv（Lv 1→20 共 3,800、Lv 1→200 共 218,900）
export const xpToNext = (level: number) => 100 + 10 * level;
export const cumulativeXpAtLevel = (level: number) => (level - 1) * (100 + 5 * level);

// 全螢幕慶祝只留給里程碑等級（每 5 級），其他升級在戰鬥畫面跳字就好
export const isMilestoneLevel = (level: number) => level % 5 === 0;

export function levelMods(level: number): Partial<Mods> {
  return { hp: (level - 1) * LEVEL_STAT, atk: (level - 1) * LEVEL_STAT };
}

// 轉職上限暫存最多十級的實際需求；重設路線不降低已取得的等級或清掉銀行EXP。
export function classBufferLimit(level: number, cap: number): number {
  if (cap >= MAX_LEVEL || level >= MAX_LEVEL) return 0;
  let sum = 0;
  for (let lv = level; lv < Math.min(MAX_LEVEL, cap + 10); lv++) sum += xpToNext(lv);
  return sum;
}

// 加經驗值，處理連續升級；只有真正Lv200不再累積，轉職上限保留有界暫存。
export function addXp(level: number, xp: number, gained: number, cap = MAX_LEVEL): { level: number; xp: number; levelsGained: number } {
  let lv = level;
  let cur = xp + gained;
  while (lv < cap && cur >= xpToNext(lv)) {
    cur -= xpToNext(lv);
    lv += 1;
  }
  if (lv >= cap) {
    let consumed = 0;
    for (let n = level; n < lv; n++) consumed += xpToNext(n);
    const protectedExisting = Math.max(0, xp - consumed);
    cur = lv >= MAX_LEVEL ? 0 : Math.max(protectedExisting, Math.min(cur, classBufferLimit(lv, cap)));
  }
  return { level: lv, xp: cur, levelsGained: lv - level };
}

// 戰鬥中獲得的經驗：答對、擊倒。每區一個固定的校準係數（依模擬：90% 正確率的玩家打完一區，
// 主線大約給到推薦等級需求的 85%，其餘靠副本），讓實際等級貼近推薦等級
export const XP = { correct: 3, kill: 6, elite: 15, boss: 30 };
// A1 從 Lv5 開始（前置區域打完約 Lv5）：Lv5→20 需要 3300，比原本 Lv1→20 的 3800 少，係數 0.65 × 3300/3800 ≈ 0.56
export const REGION_XP = [0.56, 1.3, 1.45, 1.95, 1.95, 2.3, 2.7, 3.1, 3.5];
export const xpScale = (regionIdx: number) => REGION_XP[Math.min(Math.max(0, regionIdx), REGION_XP.length - 1)];

// ---------- 轉職樹 ----------
export interface ClassNode {
  id: string;
  name: string;
  en: string;
  tier: 1 | 2 | 3 | 4;
  parent: string;       // 上一階：一轉的 parent 是基礎職業 id
  desc: string;
  mods: Partial<Mods>;
}

// 每一階的基礎能力加成
// 梯度提升：一轉 8% / 二轉 10% / 三轉 12% / 覺醒 15%
const TIER_STATS: Record<1 | 2 | 3 | 4, Partial<Mods>> = {
  1: { hp: 0.08, atk: 0.08 },
  2: { hp: 0.1, atk: 0.1 },
  3: { hp: 0.12, atk: 0.12 },
  4: { hp: 0.15, atk: 0.15 },
};

type Branch = [id: string, name: string, en: string, desc: string, mods: Partial<Mods>];
type SecondWithThird = [second: Branch, third: Branch];

const TREE: Record<ClassId, { first: Branch; second: [SecondWithThird, SecondWithThird] }[]> = {
  mage: [
    {
      first: ['elementalist', '元素魔法師', 'Elementalist', '擅長屬性相剋的爆發', { elementBonus: 0.3 }],
      second: [
        [
          ['archmage', '大魔導士', 'Archmage', '純粹的魔力，傷害最高', { atk: 0.2, elementBonus: 0.1 }],
          ['arcane_master', '秘術法皇', 'Arcane Sovereign', '掌控純粹秘法奧術魔力', { atk: 0.28, elementBonus: 0.15 }],
        ],
        [
          ['element_lord', '元素領主', 'Element Lord', '把屬性相剋發揮到極致', { elementBonus: 0.4 }],
          ['cataclysm_lord', '天變神君', 'Cataclysm Sovereign', '呼喚天地萬象元素風暴', { elementBonus: 0.55 }],
        ],
      ],
    },
    {
      first: ['chronomancer', '時空術士', 'Chronomancer', '延長全隊的思考時間', { timeMs: 3000 }],
      second: [
        [
          ['time_sage', '時之賢者', 'Time Sage', '時間的主宰', { timeMs: 3000 }],
          ['chronos_ruler', '永劫支配者', 'Chronos Ruler', '時間流速完全掌握在指尖', { timeMs: 4500 }],
        ],
        [
          ['astrologer', '星象師', 'Astrologer', '看見未來，攻擊更準', { timeMs: 1000, crit: 0.15 }],
          ['star_prophet', '星宿司辰', 'Star Prophet', '洞悉群星宿命軌跡', { timeMs: 2000, crit: 0.2 }],
        ],
      ],
    },
  ],
  swordsman: [
    {
      first: ['squire', '見習騎士', 'Squire', '每累積 5 combo 得到一次守護', { guardEvery: 5 }],
      second: [
        [
          ['paladin', '聖騎士', 'Paladin', '守護更頻繁', { guardEvery: 4, hp: 0.1 }],
          ['crusader_lord', '十字聖裁領主', 'Crusader Lord', '光芒萬丈的神聖騎士長', { guardEvery: 3, hp: 0.15 }],
        ],
        [
          ['dragoon', '龍騎士', 'Dragoon', '攻守兼備', { atk: 0.15, hp: 0.1 }],
          ['dragon_emperor', '天龍劍聖', 'Dragon Emperor', '融合巨龍威儀與絕世劍術', { atk: 0.22, hp: 0.15 }],
        ],
      ],
    },
    {
      first: ['blade_dancer', '劍舞者', 'Blade Dancer', '高暴擊的連擊手', { crit: 0.1 }],
      second: [
        [
          ['sword_saint', '劍聖', 'Sword Saint', '暴擊傷害極高', { critDmg: 0.6 }],
          ['sword_emperor', '無雙萬劍皇', 'Sword Emperor', '心劍合一，斬破一切虛妄', { critDmg: 0.85 }],
        ],
        [
          ['phantom', '幻影劍客', 'Phantom', '暴擊率極高', { crit: 0.15 }],
          ['shadow_assassin', '幽冥影煞', 'Shadow Assassin', '疾風魅影，殺人無形', { crit: 0.22, critDmg: 0.2 }],
        ],
      ],
    },
  ],
  warrior: [
    {
      first: ['berserker', '狂野戰士', 'Berserker', '血越少越強', { lowHp: 0.4 }],
      second: [
        [
          ['berserker_king', '狂戰士', 'Berserker King', '瀕死時爆發', { lowHp: 0.6 }],
          ['blood_slayer', '血戮死狂', 'Blood Slayer', '鮮血燃盡之際無堅不摧', { lowHp: 0.85 }],
        ],
        [
          ['war_god', '戰神', 'War God', '穩定的高攻擊', { atk: 0.2, lowHp: 0.1 }],
          ['asura', '鬥神阿修羅', 'Asura', '橫掃千軍不屈戰皇', { atk: 0.28, lowHp: 0.2 }],
        ],
      ],
    },
    {
      first: ['vanguard', '鐵壁戰士', 'Vanguard', '血量極厚', { hp: 0.3 }],
      second: [
        [
          ['guardian', '守護者', 'Guardian', '更厚的血量與守護', { hp: 0.3, guardEvery: 8 }],
          ['titan_shield', '泰坦神盾領主', 'Titan Shield', '如巍峨神山守護眾生', { hp: 0.45, guardEvery: 6 }],
        ],
        [
          ['fortress', '要塞巨人', 'Fortress', '能攻能守', { hp: 0.2, atk: 0.15 }],
          ['dreadnought', '無畏鋼鐵霸主', 'Dreadnought', '固若金湯的攻城重要塞', { hp: 0.3, atk: 0.22 }],
        ],
      ],
    },
  ],
  archer: [
    {
      first: ['hunter', '狩獵射手', 'Hunter', '暴擊傷害提高', { critDmg: 0.5 }],
      second: [
        [
          ['sharpshooter', '神射手', 'Sharpshooter', '百發百中', { crit: 0.15, critDmg: 0.2 }],
          ['deadeye_sniper', '死眼鷹皇', 'Deadeye Sniper', '萬里穿雲，例無虛發', { crit: 0.2, critDmg: 0.35 }],
        ],
        [
          ['demon_hunter', '獵魔人', 'Demon Hunter', '對強敵一擊必殺', { critDmg: 0.6 }],
          ['abyss_hunter', '極夜獵魔尊', 'Abyss Hunter', '專獵傳奇深淵魔神', { critDmg: 0.85 }],
        ],
      ],
    },
    {
      first: ['ranger', '森林遊俠', 'Ranger', '先制攻擊、多一點時間', { firstHit: 1, timeMs: 2000 }],
      second: [
        [
          ['elf_ranger', '精靈遊俠', 'Elf Ranger', '森林賜予的時間', { timeMs: 2000, firstHit: 0.5 }],
          ['forest_arbiter', '森羅大仲裁', 'Forest Arbiter', '萬木生靈皆為其號令', { timeMs: 3000, firstHit: 0.8 }],
        ],
        [
          ['wind_bard', '風之詩人', 'Wind Bard', '開場的一箭最致命', { firstHit: 1.5 }],
          ['gale_strider', '踏風追日者', 'Gale Strider', '呼嘯狂風中的雷霆首擊', { firstHit: 2.2 }],
        ],
      ],
    },
  ],
  monk: [
    {
      first: ['priest', '牧師', 'Priest', '守護更頻繁、血量更厚', { hp: 0.2, guardEvery: 6 }],
      second: [
        [
          ['bishop', '主教', 'Bishop', '全隊的堅實後盾', { hp: 0.3, guardEvery: 5 }],
          ['cardinal', '天國樞機卿', 'Cardinal', '神明代言人，神聖守護', { hp: 0.35, guardEvery: 4 }],
        ],
        [
          ['saint', '聖徒', 'Saint', '神聖守護幾乎不間斷', { hp: 0.15, guardEvery: 4 }],
          ['arch_saint', '聖域大主教', 'Arch Saint', '光輝灑落之處萬物復甦', { hp: 0.25, guardEvery: 3 }],
        ],
      ],
    },
    {
      first: ['bard', '吟遊詩人', 'Bard', '歌聲讓隊伍思考更從容', { timeMs: 2500 }],
      second: [
        [
          ['prophet', '先知', 'Prophet', '預見答案，時間更充裕', { timeMs: 3000, crit: 0.05 }],
          ['all_seeing', '至高全知者', 'All-Seeing', '過去現在未來歷歷在目', { timeMs: 4000, crit: 0.08 }],
        ],
        [
          ['oracle', '神諭者', 'Oracle', '神諭讓攻擊更精準', { timeMs: 1500, crit: 0.15 }],
          ['divine_voice', '天啟真音', 'Divine Voice', '字字珠璣化為神聖審判', { timeMs: 2500, crit: 0.22 }],
        ],
      ],
    },
  ],
};

const node = ([id, name, en, desc, mods]: Branch, tier: 1 | 2 | 3, parent: string): ClassNode => ({
  id, name, en, desc, tier, parent, mods: combineMods(TIER_STATS[tier], mods),
});

export const CLASS_NODES: ClassNode[] = (Object.keys(TREE) as ClassId[]).flatMap(cls =>
  TREE[cls].flatMap(({ first, second }) => {
    const t1 = node(first, 1, cls);
    const t2List: ClassNode[] = [];
    const t3List: ClassNode[] = [];
    const t4List: ClassNode[] = [];

    for (const [secBranch, thirdBranch] of second) {
      const t2 = node(secBranch, 2, t1.id);
      t2List.push(t2);
      const t3 = node(thirdBranch, 3, t2.id);
      t3List.push(t3);
      // 覺醒：三轉後的最終極限形態
      const t4: ClassNode = {
        id: `${t3.id}_awake`,
        name: `覺醒・${t3.name}`,
        en: `Awakened ${t3.en}`,
        tier: 4,
        parent: t3.id,
        desc: `${t3.name}的終極覺醒形態`,
        mods: combineMods(TIER_STATS[4], thirdBranch[4]),
      };
      t4List.push(t4);
    }
    return [t1, ...t2List, ...t3List, ...t4List];
  }),
);

export const classNode = (id: string) => CLASS_NODES.find(n => n.id === id);
export const childrenOf = (parent: string) => CLASS_NODES.filter(n => n.parent === parent);

// 轉職條件：一轉 Lv30、二轉 Lv80、三轉 Lv120、覺醒 Lv160
export const ADVANCE_REQ: Record<1 | 2 | 3 | 4, { level: number; label: string }> = {
  1: { level: 30, label: 'Lv 30' },
  2: { level: 80, label: 'Lv 80' },
  3: { level: 120, label: 'Lv 120' },
  4: { level: 160, label: 'Lv 160' },
};

// 主角換職業（第十三輪）：五種職業共用等級，轉職路線各自保留；戰鬥外免費切換。
// 創角時選的第一個職業轉職不用徽章；其他職業點亮轉職要職業徽章（時空之塔、每週任務取得，不能抽）
export const BADGE_COST: Record<1 | 2 | 3 | 4, number> = { 1: 10, 2: 25, 3: 40, 4: 60 };
// 已花在這條路線上的徽章（重置時退回）
export const pathBadgeCost = (path: string[]) => path.reduce((sum, id) => sum + (BADGE_COST[classNode(id)?.tier ?? 1] ?? 0), 0);
// 等級上限看所有職業裡轉得最高的那一個
export const bestTier = (paths: Record<string, string[]>) => Math.max(0, ...Object.values(paths).map(p => p.length));

// 目前路線的下一階選項（已到覺醒則為空）
export function nextOptions(classId: ClassId, path: string[]): ClassNode[] {
  return childrenOf(path.length ? path[path.length - 1] : classId);
}

export function canAdvance(tier: 1 | 2 | 3 | 4, level: number): boolean {
  return level >= ADVANCE_REQ[tier].level;
}

// 目前的職業名稱（例如「元素魔法師」），沒有轉職就是基礎職業名
export function currentClassName(baseName: string, path: string[]): string {
  return path.length ? classNode(path[path.length - 1])?.name ?? baseName : baseName;
}

export const pathMods = (path: string[]) => combineMods(...path.map(id => classNode(id)?.mods ?? {}));


// 只提示能提高全職業共享上限的路線；副職也能免費切回主職突破。
export function classAdvanceOffer(classId: ClassId | undefined, player: { level: number; classPath: string[] }, paths: Record<string, string[]>, homeClass: ClassId | null, badges: number): { targetClass: ClassId; free: boolean; message: string } | null {
  if (!classId || player.level >= MAX_LEVEL) return null;
  const tier = bestTier({ ...paths, current: player.classPath });
  const cap = playerLevelCap(tier);
  if (cap >= MAX_LEVEL || player.level < cap - 3) return null;
  const home = homeClass ?? classId;
  const candidates: ClassId[] = [...new Set<ClassId>([home, classId, 'swordsman', 'mage', 'warrior', 'archer', 'monk'])];
  for (const targetClass of candidates) {
    const path = targetClass === classId ? player.classPath : paths[targetClass] ?? [];
    const free = targetClass === home;
    const available = nextOptions(targetClass, path).some(n => n.tier > tier && canAdvance(n.tier, player.level) && (free || badges >= BADGE_COST[n.tier]));
    if (!available) continue;
    const message = free ? targetClass === classId ? '可免費轉職突破上限' : '切回主職以免費轉職突破上限'
      : targetClass === classId ? '可轉職突破等級上限' : '切換職業以轉職突破上限';
    return { targetClass, free, message };
  }
  return null;
}
export const classAdvanceMessage = (classId: ClassId | undefined, player: { level: number; classPath: string[] }, paths: Record<string, string[]>, homeClass: ClassId | null, badges: number) =>
  classAdvanceOffer(classId, player, paths, homeClass, badges)?.message ?? null;
