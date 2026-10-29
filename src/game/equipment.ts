import type { ClassId, Element } from './character';
import { ELEMENTS } from './character';
import type { Mods } from './growth';
import type { Rarity } from './heroes';
import { RARITIES } from './heroes';

// 裝備與鍛造：主角有武器、防具、飾品三個欄位。
// 素材從怪物掉落：一般怪掉礦石、菁英怪／頭目掉屬性結晶、頭目掉魔核，第 4 區以後的菁英與頭目掉龍晶。
// 素材＋金幣鍛造裝備，金幣＋礦石強化（最高 +10）；同名裝備可以拿來升品階（效果提高、強化上限提高，稀有度不變）。

export type Slot = 'weapon' | 'armor' | 'accessory';
export const SLOTS: { id: Slot; name: string; icon: string }[] = [
  { id: 'weapon', name: '武器', icon: '⚔️' },
  { id: 'armor', name: '防具', icon: '🛡️' },
  { id: 'accessory', name: '飾品', icon: '💍' },
];

// ---------- 素材 ----------
export type MaterialId = 'ore' | 'core' | 'dragon' | `crystal_${Element}`;

export const crystalOf = (el: Element): MaterialId => `crystal_${el}`;

export function materialName(id: string): string {
  if (id === 'ore') return '礦石';
  if (id === 'core') return '魔核';
  if (id === 'dragon') return '龍晶';
  const el = ELEMENTS.find(e => `crystal_${e.id}` === id);
  return el ? `${el.name}之結晶` : id;
}

export function materialIcon(id: string): string {
  if (id === 'ore') return '🪨';
  if (id === 'core') return '🔮';
  if (id === 'dragon') return '🐉';
  return '💎';
}

// 龍晶：極光雪嶺（regionIdx 5）以後才會掉
export const DRAGON_REGION = 5;

// 打倒怪物的掉落（rand 讓測試可以固定）
export function rollDrops(kind: 'normal' | 'elite' | 'boss' | 'treasure', el: Element, rand: () => number, regionIdx = 0): Record<string, number> {
  const drops: Record<string, number> = {};
  const add = (id: string, n: number) => { if (n > 0) drops[id] = (drops[id] ?? 0) + n; };
  switch (kind) {
    case 'normal': add('ore', rand() < 0.6 ? 1 : 0); break;
    case 'elite': add('ore', 2); add(crystalOf(el), 1); break;
    case 'boss': add('ore', 3); add(crystalOf(el), 2); add('core', 1); break;
    case 'treasure': add('ore', 4); add(crystalOf(ELEMENTS[Math.floor(rand() * ELEMENTS.length)].id), 2); break;
  }
  if (regionIdx >= DRAGON_REGION) {
    if (kind === 'boss') add('dragon', 1);
    if (kind === 'elite' && rand() < 0.35) add('dragon', 1);
  }
  return drops;
}

// ---------- 裝備 ----------
export interface EquipDef {
  id: string;
  name: string;
  slot: Slot;
  rarity: Rarity;
  desc: string;
  mods: Partial<Mods>;
  // 'own' 代表主角屬性的結晶
  cost: { gold: number; materials: Partial<Record<MaterialId | 'crystal_own', number>> };
  requires?: { regionsCleared?: number; classTier?: number };
}

// 專屬武器：依職業不同名字，需要二轉
const SIGNATURE: Record<ClassId, string> = {
  mage: '古代咒語法杖', swordsman: '誓約之劍', warrior: '破城巨斧', archer: '風神長弓', monk: '聖光權杖',
};
export const signatureName = (cls: ClassId) => SIGNATURE[cls];

// 屬性護符（飾品）：讓主角屬性以外的結晶也有用途
const AMULET_MODS: Record<Element, [string, Partial<Mods>]> = {
  metal: ['鋒利的金之力，暴擊更容易', { crit: 0.12 }],
  wood: ['森林的耐心，思考時間更長', { timeMs: 2500 }],
  water: ['流水的韌性，血量更厚', { hp: 0.25 }],
  fire: ['烈火的氣勢，攻擊更強', { atk: 0.2 }],
  earth: ['大地的守護，定期擋下傷害', { guardEvery: 10 }],
  light: ['光明的祝福，攻守兼備', { hp: 0.12, atk: 0.1 }],
  dark: ['暗影的一擊，暴擊傷害更高', { critDmg: 0.4 }],
};
const AMULETS: EquipDef[] = ELEMENTS.map(el => ({
  id: `amulet_${el.id}`, name: `${el.name}之護符`, slot: 'accessory', rarity: 'SR', desc: AMULET_MODS[el.id][0], mods: AMULET_MODS[el.id][1],
  cost: { gold: 600, materials: { ore: 6, [crystalOf(el.id)]: 4 } }, requires: { regionsCleared: 1 },
}));

export const EQUIPMENT: EquipDef[] = [
  // 武器
  { id: 'blade_training', name: '見習之刃', slot: 'weapon', rarity: 'N', desc: '剛入門的武器', mods: { atk: 0.1 }, cost: { gold: 100, materials: { ore: 3 } } },
  { id: 'blade_steel', name: '精鋼武器', slot: 'weapon', rarity: 'R', desc: '可靠的精鋼打造', mods: { atk: 0.2 }, cost: { gold: 300, materials: { ore: 8 } }, requires: { regionsCleared: 1 } },
  { id: 'blade_element', name: '元素之刃', slot: 'weapon', rarity: 'SR', desc: '注入你的屬性，剋制時更強', mods: { atk: 0.3, elementBonus: 0.1 }, cost: { gold: 800, materials: { ore: 10, crystal_own: 3 } }, requires: { regionsCleared: 3 } },
  { id: 'blade_legend', name: '傳說武器', slot: 'weapon', rarity: 'SSR', desc: '以魔核鍛造的傳說之刃', mods: { atk: 0.55 }, cost: { gold: 2000, materials: { ore: 15, core: 3 } }, requires: { regionsCleared: 5 } },
  { id: 'signature', name: '專屬武器', slot: 'weapon', rarity: 'UR', desc: '只有二轉後的勇者才能駕馭', mods: { atk: 0.8, crit: 0.1 }, cost: { gold: 5000, materials: { core: 5, crystal_own: 5 } }, requires: { classTier: 2 } },
  // 防具
  { id: 'armor_cloth', name: '旅人布甲', slot: 'armor', rarity: 'N', desc: '輕便的布甲', mods: { hp: 0.1 }, cost: { gold: 100, materials: { ore: 3 } } },
  { id: 'armor_chain', name: '鎖子甲', slot: 'armor', rarity: 'R', desc: '鍊環編成的護甲', mods: { hp: 0.2 }, cost: { gold: 300, materials: { ore: 8 } }, requires: { regionsCleared: 1 } },
  { id: 'armor_mithril', name: '秘銀甲', slot: 'armor', rarity: 'SR', desc: '輕巧又堅固', mods: { hp: 0.35 }, cost: { gold: 800, materials: { ore: 10, crystal_own: 3 } }, requires: { regionsCleared: 3 } },
  { id: 'armor_dragon', name: '龍鱗甲', slot: 'armor', rarity: 'SSR', desc: '冰龍的鱗片打造', mods: { hp: 0.55 }, cost: { gold: 2000, materials: { ore: 15, core: 3 } }, requires: { regionsCleared: 5 } },
  // 飾品
  { id: 'acc_charm', name: '幸運符', slot: 'accessory', rarity: 'N', desc: '帶來一點好運', mods: { crit: 0.05 }, cost: { gold: 150, materials: { ore: 3 } } },
  { id: 'acc_hourglass', name: '時之沙漏', slot: 'accessory', rarity: 'R', desc: '讓思考的時間變長', mods: { timeMs: 2000 }, cost: { gold: 400, materials: { ore: 8 } }, requires: { regionsCleared: 1 } },
  { id: 'acc_elf', name: '精靈耳環', slot: 'accessory', rarity: 'SR', desc: '精靈的祝福', mods: { crit: 0.1, timeMs: 2000 }, cost: { gold: 900, materials: { ore: 10, crystal_own: 3 } }, requires: { regionsCleared: 3 } },
  { id: 'acc_king', name: '王者之戒', slot: 'accessory', rarity: 'SSR', desc: '古代國王的戒指', mods: { atk: 0.2, crit: 0.1 }, cost: { gold: 2500, materials: { ore: 15, core: 3 } }, requires: { regionsCleared: 5 } },
  // 後期區域：用龍晶打造
  { id: 'blade_star', name: '星辰之刃', slot: 'weapon', rarity: 'SSR', desc: '極光雪嶺的星光凝成的刀刃', mods: { atk: 0.7 }, cost: { gold: 3500, materials: { ore: 20, core: 4, dragon: 3 } }, requires: { regionsCleared: 7 } },
  { id: 'armor_star', name: '星辰鎧甲', slot: 'armor', rarity: 'SSR', desc: '映著極光的鎧甲', mods: { hp: 0.7 }, cost: { gold: 3500, materials: { ore: 20, core: 4, dragon: 3 } }, requires: { regionsCleared: 7 } },
  { id: 'acc_star', name: '星辰耳墜', slot: 'accessory', rarity: 'SSR', desc: '聽得見星星的低語', mods: { atk: 0.25, crit: 0.12 }, cost: { gold: 3500, materials: { ore: 20, core: 4, dragon: 3 } }, requires: { regionsCleared: 7 } },
  { id: 'blade_flame', name: '熔岩魔劍', slot: 'weapon', rarity: 'UR', desc: '在熔岩魔域鍛造的魔劍', mods: { atk: 0.9, critDmg: 0.2 }, cost: { gold: 6000, materials: { ore: 25, core: 6, dragon: 6 } }, requires: { regionsCleared: 5 } },
  { id: 'armor_flame', name: '熔岩戰甲', slot: 'armor', rarity: 'UR', desc: '連魔王的火焰都擋得住', mods: { hp: 0.9, guardEvery: 12 }, cost: { gold: 6000, materials: { ore: 25, core: 6, dragon: 6 } }, requires: { regionsCleared: 5 } },
  { id: 'acc_flame', name: '熔岩之心', slot: 'accessory', rarity: 'UR', desc: '還在跳動的熔岩結晶', mods: { atk: 0.3, crit: 0.15, timeMs: 1000 }, cost: { gold: 6000, materials: { ore: 25, core: 6, dragon: 6 } }, requires: { regionsCleared: 5 } },
  // 屬性護符：用各屬性的結晶打造，每種屬性一個特色
  ...AMULETS,
];

export const equipDef = (id: string) => EQUIPMENT.find(e => e.id === id);

export interface OwnedEquip {
  uid: string;
  defId: string;
  plus: number;
  grade?: number; // 品階 0～3：用同名裝備提升，稀有度不變
}

export const MAX_PLUS = 10;
export const MAX_GRADE = 3;
export const GRADE_BONUS = 0.2;      // 每一品階效果 +20%
export const GRADE_PLUS = 2;         // 每一品階強化上限 +2
export const gradeOf = (item: OwnedEquip) => item.grade ?? 0;
export const maxPlus = (item: OwnedEquip) => MAX_PLUS + gradeOf(item) * GRADE_PLUS;

// 強化：每 +1 讓裝備效果再 +10%；品階再乘上 +20%／階
export function equipMods(item: OwnedEquip): Partial<Mods> {
  const def = equipDef(item.defId);
  if (!def) return {};
  const scale = (1 + item.plus * 0.1) * (1 + gradeOf(item) * GRADE_BONUS);
  // 守護是「每 N combo」，不能放大，維持原值
  return Object.fromEntries(Object.entries(def.mods).map(([k, v]) => [k, k === 'guardEvery' ? v : (v as number) * scale]));
}

export function enhanceCost(item: OwnedEquip): { gold: number; ore: number } {
  const def = equipDef(item.defId);
  const r = def ? RARITIES.indexOf(def.rarity) + 1 : 1;
  return { gold: 50 * (item.plus + 1) * r, ore: item.plus + 1 };
}

// 把配方的「主角屬性結晶」換成實際的結晶
export function resolveCost(def: EquipDef, element: Element): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(def.cost.materials)) {
    const id = k === 'crystal_own' ? crystalOf(element) : k;
    out[id] = (out[id] ?? 0) + (v ?? 0);
  }
  return out;
}

// 升品階的素材：沒穿在身上的同名裝備，優先用品階與強化最低的那件
export function gradeMaterial(item: OwnedEquip, all: OwnedEquip[], equippedUids: string[]): OwnedEquip | undefined {
  return all
    .filter(e => e.uid !== item.uid && e.defId === item.defId && !equippedUids.includes(e.uid))
    .sort((a, b) => gradeOf(a) - gradeOf(b) || a.plus - b.plus)[0];
}

// 素材件強化過的礦石，退還 65%
export function gradeRefund(material: OwnedEquip): number {
  let ore = 0;
  for (let p = 0; p < material.plus; p++) ore += enhanceCost({ ...material, plus: p }).ore;
  return Math.floor(ore * SELL_RATE);
}

export function displayName(def: EquipDef, cls: ClassId): string {
  return def.id === 'signature' ? signatureName(cls) : def.name;
}

// ---------- 賣出 ----------
// 沒有裝備在身上的裝備可以賣掉，退還打造與強化時投入的 65%（金幣與素材都退）
export const SELL_RATE = 0.65;

export function sellValue(item: OwnedEquip, element: Element): { gold: number; materials: Record<string, number> } {
  const def = equipDef(item.defId);
  if (!def) return { gold: 0, materials: {} };
  // 升品階時用掉的同名裝備也算投入（只算打造成本）
  const copies = 1 + gradeOf(item);
  let gold = def.cost.gold * copies;
  const materials = Object.fromEntries(Object.entries(resolveCost(def, element)).map(([k, v]) => [k, v * copies]));
  for (let p = 0; p < item.plus; p++) {
    const c = enhanceCost({ ...item, plus: p });
    gold += c.gold;
    materials.ore = (materials.ore ?? 0) + c.ore;
  }
  const back = Object.fromEntries(Object.entries(materials).map(([k, v]) => [k, Math.floor(v * SELL_RATE)]).filter(([, v]) => (v as number) > 0));
  return { gold: Math.floor(gold * SELL_RATE), materials: back };
}
