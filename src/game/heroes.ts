import { BODY_NAMES, FACE_NAMES, HAIR_COLORS, HAIR_NAMES, SKIN_TONES, classDef } from './character';
import type { Character, ClassId, Element, Gender } from './character';
import { CLASS_SKILLS, RARITY_POWER } from './progression';
import type { SkillId } from './progression';

// 夥伴英雄：50 位，名字都是英文單字（真名機制的基礎），稀有度對應單字難度。
// 外觀用主角的分層像素系統產生：職業、屬性、性別手動指定，其餘依單字固定亂數決定。
// 取得方式：遊戲內召喚券抽卡（不付費），有保底與累積兌換。

export type HeroId = string;
export type Rarity = 'N' | 'R' | 'SR' | 'SSR' | 'UR';
export const RARITIES: Rarity[] = ['N', 'R', 'SR', 'SSR', 'UR'];

export const RARITY_INFO: Record<Rarity, { color: string; statMult: number; cefr: string }> = {
  N: { color: '#b8bcc8', statMult: 1.0, cefr: 'A1' },
  R: { color: '#5fb3ff', statMult: 1.12, cefr: 'A2' },
  SR: { color: '#c98aff', statMult: 1.25, cefr: 'B1' },
  SSR: { color: '#ffcd4b', statMult: 1.45, cefr: 'B2～C1' },
  UR: { color: '#ff5af0', statMult: 1.65, cefr: 'C1～C2' },
};

export interface HeroDef {
  id: HeroId;          // 英文單字（小寫）
  meaning: string;     // 中文意思
  rarity: Rarity;      // 初始稀有度（升品階後最多再高一階）
  classId: ClassId;
  element: Element;
  look: Pick<Character, 'gender' | 'face' | 'body' | 'skin' | 'hair' | 'hairColor'>;
}

type Entry = [word: string, meaning: string, rarity: Rarity, classId: ClassId, element: Element, gender?: Gender];

// 第四輪：牛奶、書、吟遊詩人、蠟燭、和諧、燈籠、聖域、寧靜改為僧侶（補血與增益）
const ROSTER: Entry[] = [
  // N（A1 單字）
  ['knight', '騎士', 'N', 'swordsman', 'light', 'male'],
  ['apple', '蘋果', 'N', 'swordsman', 'wood'],
  ['bread', '麵包', 'N', 'warrior', 'earth'],
  ['cat', '貓', 'N', 'archer', 'dark', 'female'],
  ['dog', '狗', 'N', 'warrior', 'earth', 'male'],
  ['sun', '太陽', 'N', 'mage', 'fire', 'male'],
  ['moon', '月亮', 'N', 'mage', 'dark', 'female'],
  ['tree', '樹', 'N', 'warrior', 'wood'],
  ['fish', '魚', 'N', 'archer', 'water'],
  ['bird', '鳥', 'N', 'archer', 'wood', 'female'],
  ['book', '書', 'N', 'monk', 'light'],
  ['milk', '牛奶', 'N', 'monk', 'light', 'female'],
  ['star', '星星', 'N', 'mage', 'light', 'female'],
  ['rain', '雨', 'N', 'archer', 'water', 'female'],
  ['rose', '玫瑰', 'N', 'swordsman', 'wood', 'female'],
  ['egg', '蛋', 'N', 'warrior', 'metal'],
  // R（A2 單字）
  ['archer', '弓箭手', 'R', 'archer', 'wood', 'male'],
  ['mage', '法師', 'R', 'mage', 'fire', 'female'],
  ['bard', '吟遊詩人', 'R', 'monk', 'water', 'male'],
  ['river', '河流', 'R', 'swordsman', 'water'],
  ['forest', '森林', 'R', 'archer', 'wood'],
  ['island', '島嶼', 'R', 'warrior', 'water'],
  ['castle', '城堡', 'R', 'warrior', 'metal'],
  ['garden', '花園', 'R', 'mage', 'wood', 'female'],
  ['winter', '冬天', 'R', 'swordsman', 'water', 'female'],
  ['shadow', '影子', 'R', 'archer', 'dark'],
  ['silver', '白銀', 'R', 'swordsman', 'metal'],
  ['hunter', '獵人', 'R', 'archer', 'earth', 'male'],
  ['candle', '蠟燭', 'R', 'monk', 'fire'],
  ['ocean', '海洋', 'R', 'mage', 'water'],
  // SR（B1 單字）
  ['dragon', '龍', 'SR', 'warrior', 'fire', 'male'],
  ['thunder', '雷霆', 'SR', 'swordsman', 'metal'],
  ['crystal', '水晶', 'SR', 'mage', 'light', 'female'],
  ['warrior', '戰士', 'SR', 'warrior', 'earth'],
  ['journey', '旅程', 'SR', 'archer', 'wood'],
  ['courage', '勇氣', 'SR', 'swordsman', 'fire'],
  ['harmony', '和諧', 'SR', 'monk', 'water', 'female'],
  ['volcano', '火山', 'SR', 'warrior', 'fire'],
  ['glacier', '冰河', 'SR', 'archer', 'water'],
  ['compass', '羅盤', 'SR', 'archer', 'metal'],
  ['lantern', '燈籠', 'SR', 'monk', 'light'],
  ['guardian', '守護者', 'SR', 'warrior', 'light'],
  // SSR（B2～C1 單字）
  ['phoenix', '鳳凰', 'SSR', 'mage', 'fire', 'female'],
  ['eclipse', '日蝕', 'SSR', 'swordsman', 'dark'],
  ['tempest', '暴風', 'SSR', 'archer', 'water'],
  ['sanctuary', '聖域', 'SSR', 'monk', 'light', 'female'],
  ['valor', '英勇', 'SSR', 'warrior', 'metal', 'male'],
  ['serenity', '寧靜', 'SSR', 'monk', 'water', 'female'],
  ['labyrinth', '迷宮', 'SSR', 'archer', 'earth'],
  ['aurora', '極光', 'SSR', 'mage', 'light', 'female'],
];

// 依單字產生固定的亂數（每次開遊戲外觀都一樣）
function seeded(word: string): () => number {
  let h = 2166136261;
  for (const ch of word) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export const HEROES: HeroDef[] = ROSTER.map(([id, meaning, rarity, classId, element, gender]) => {
  const rand = seeded(id);
  const pick = (n: number) => Math.floor(rand() * n);
  return {
    id, meaning, rarity, classId, element,
    look: {
      gender: gender ?? (rand() < 0.5 ? 'male' : 'female'),
      face: pick(FACE_NAMES.length), body: pick(BODY_NAMES.length), skin: pick(SKIN_TONES.length),
      hair: pick(HAIR_NAMES.length), hairColor: pick(HAIR_COLORS.length),
    },
  };
});

const BY_ID = new Map(HEROES.map(h => [h.id, h]));
export const heroDef = (id: HeroId): HeroDef => BY_ID.get(id) ?? HEROES[0];
export const isHeroId = (id: string) => BY_ID.has(id);

// 稱號，例如「蘋果劍士」；名字本身就是職業時（ARCHER 弓箭手）不重複
export function heroTitle(h: HeroDef): string {
  const cls = classDef(h.classId).name;
  return h.meaning === cls ? cls : `${h.meaning}${cls}`;
}
export const heroWord = (h: HeroDef) => h.id.toUpperCase();
// SSR 英雄的專屬技
const SIGNATURE: Record<HeroId, SkillId> = {
  phoenix: 'rebirth', eclipse: 'eclipse', tempest: 'storm', sanctuary: 'sanctum',
  valor: 'valor', serenity: 'calm', labyrinth: 'maze', aurora: 'aurora',
};

// 英雄的技能：SSR 用專屬技，其他依名字固定分到職業技能池的其中一種（同職業的英雄技能不一定一樣）
export function heroSkill(h: HeroDef): SkillId {
  if (SIGNATURE[h.id]) return SIGNATURE[h.id];
  const pool = CLASS_SKILLS[h.classId];
  let n = 0;
  for (const ch of h.id) n = (n * 31 + ch.charCodeAt(0)) >>> 0;
  return pool[n % pool.length];
}

// 技能威力看目前的稀有度（升品階後變強）
export const heroSkillPower = (h: HeroDef, tier: number) => RARITY_POWER[currentRarity(h, tier)];

// 目前的稀有度：升過品階就高一階
export function currentRarity(h: HeroDef, tier: number): Rarity {
  return RARITIES[Math.min(RARITIES.indexOf(h.rarity) + (tier > 0 ? 1 : 0), RARITIES.length - 1)];
}

export function heroStats(h: HeroDef, tier = 0) {
  const cls = classDef(h.classId).stats;
  const mult = RARITY_INFO[currentRarity(h, tier)].statMult;
  return { hp: cls.hp * mult, atk: cls.atk * mult, crit: cls.crit };
}

// 給像素繪圖用的角色資料
export function heroCharacter(h: HeroDef): Character {
  return { name: heroWord(h), classId: h.classId, element: h.element, ...h.look };
}

// ---------- 召喚（抽卡） ----------
export const SUMMON_RATES: { rarity: Rarity; weight: number }[] = [
  { rarity: 'SSR', weight: 3 },
  { rarity: 'SR', weight: 12 },
  { rarity: 'R', weight: 35 },
  { rarity: 'N', weight: 50 },
];
export const PITY_SSR = 50;        // 第 50 抽內必出 SSR
export const SPARK_COST = 100;     // 每抽累積 1 點，100 點任選一位 SSR
export const TEN_PULL = 10;        // 十連至少一位 SR 以上
export const STARTER_TICKETS = 10;
export const TICKET_GOLD_PRICE = 200;

// 重複抽到：轉成該英雄的碎片；碎片＋金幣可以升一個品階
export const DUPLICATE_SHARDS: Record<Rarity, number> = { N: 5, R: 8, SR: 15, SSR: 30, UR: 30 };
export const TIER_UP_SHARDS: Record<Rarity, number> = { N: 20, R: 30, SR: 45, SSR: 60, UR: 0 };
export const TIER_UP_GOLD: Record<Rarity, number> = { N: 200, R: 400, SR: 800, SSR: 1500, UR: 0 };

export interface SummonCounter {
  sinceSsr: number; // 距離上次 SSR 已經抽了幾次
  spark: number;    // 累積點數
}

export interface SummonResult {
  id: HeroId;
  rarity: Rarity;
}

export function rollRarity(rand: () => number): Rarity {
  const total = SUMMON_RATES.reduce((s, r) => s + r.weight, 0);
  let x = rand() * total;
  for (const r of SUMMON_RATES) {
    if (x < r.weight) return r.rarity;
    x -= r.weight;
  }
  return 'N';
}

export function summon(count: number, counter: SummonCounter, rand: () => number = Math.random): { results: SummonResult[]; counter: SummonCounter } {
  let { sinceSsr, spark } = counter;
  const results: SummonResult[] = [];
  for (let i = 0; i < count; i++) {
    let rarity = sinceSsr + 1 >= PITY_SSR ? 'SSR' : rollRarity(rand);
    // 十連的最後一抽：前面都沒有 SR 以上就保證 SR
    const isLastOfTen = count >= TEN_PULL && i === count - 1;
    if (isLastOfTen && (rarity === 'N' || rarity === 'R') && results.every(r => r.rarity === 'N' || r.rarity === 'R')) rarity = 'SR';
    const pool = HEROES.filter(h => h.rarity === rarity);
    const hero = pool[Math.floor(rand() * pool.length)];
    results.push({ id: hero.id, rarity });
    sinceSsr = rarity === 'SSR' ? 0 : sinceSsr + 1;
    spark += 1;
  }
  return { results, counter: { sinceSsr, spark } };
}
