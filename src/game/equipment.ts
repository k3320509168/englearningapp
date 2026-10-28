import type { ClassId, Element } from './character';
import { ELEMENTS } from './character';
import type { Mods } from './growth';
import type { Rarity } from './heroes';
import { RARITIES } from './heroes';

// 裝備與鍛造：主角有武器、防具、飾品三個欄位。
// 素材從怪物掉落：一般怪掉礦石、菁英怪／頭目掉屬性結晶、頭目掉魔核。素材＋金幣鍛造裝備，金幣＋礦石強化（最高 +10）。

export type Slot = 'weapon' | 'armor' | 'accessory';
export const SLOTS: { id: Slot; name: string; icon: string }[] = [
  { id: 'weapon', name: '武器', icon: '⚔️' },
  { id: 'armor', name: '防具', icon: '🛡️' },
  { id: 'accessory', name: '飾品', icon: '💍' },
];

// ---------- 素材 ----------
export type MaterialId = 'ore' | 'core' | `crystal_${Element}`;

export const crystalOf = (el: Element): MaterialId => `crystal_${el}`;

export function materialName(id: string): string {
  if (id === 'ore') return '礦石';
  if (id === 'core') return '魔核';
  const el = ELEMENTS.find(e => `crystal_${e.id}` === id);
  return el ? `${el.name}之結晶` : id;
}

export function materialIcon(id: string): string {
  if (id === 'ore') return '🪨';
  if (id === 'core') return '🔮';
  return '💎';
}

// 打倒怪物的掉落（rand 讓測試可以固定）
export function rollDrops(kind: 'normal' | 'elite' | 'boss' | 'treasure', el: Element, rand: () => number): Record<string, number> {
  const drops: Record<string, number> = {};
  const add = (id: string, n: number) => { if (n > 0) drops[id] = (drops[id] ?? 0) + n; };
  switch (kind) {
    case 'normal': add('ore', rand() < 0.6 ? 1 : 0); break;
    case 'elite': add('ore', 2); add(crystalOf(el), 1); break;
    case 'boss': add('ore', 3); add(crystalOf(el), 2); add('core', 1); break;
    case 'treasure': add('ore', 4); add(crystalOf(ELEMENTS[Math.floor(rand() * ELEMENTS.length)].id), 2); break;
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
  mage: '古代咒語法杖', swordsman: '誓約之劍', warrior: '破城巨斧', archer: '風神長弓',
};
export const signatureName = (cls: ClassId) => SIGNATURE[cls];

export const EQUIPMENT: EquipDef[] = [
  // 武器
  { id: 'blade_training', name: '見習之刃', slot: 'weapon', rarity: 'N', desc: '剛入門的武器', mods: { atk: 0.1 }, cost: { gold: 100, materials: { ore: 3 } } },
  { id: 'blade_steel', name: '精鋼武器', slot: 'weapon', rarity: 'R', desc: '可靠的精鋼打造', mods: { atk: 0.2 }, cost: { gold: 300, materials: { ore: 8 } }, requires: { regionsCleared: 1 } },
  { id: 'blade_element', name: '元素之刃', slot: 'weapon', rarity: 'SR', desc: '注入你的屬性，剋制時更強', mods: { atk: 0.3, elementBonus: 0.1 }, cost: { gold: 800, materials: { ore: 10, crystal_own: 3 } }, requires: { regionsCleared: 2 } },
  { id: 'blade_legend', name: '傳說武器', slot: 'weapon', rarity: 'SSR', desc: '以魔核鍛造的傳說之刃', mods: { atk: 0.55 }, cost: { gold: 2000, materials: { ore: 15, core: 3 } }, requires: { regionsCleared: 3 } },
  { id: 'signature', name: '專屬武器', slot: 'weapon', rarity: 'UR', desc: '只有二轉後的勇者才能駕馭', mods: { atk: 0.8, crit: 0.1 }, cost: { gold: 5000, materials: { core: 5, crystal_own: 5 } }, requires: { classTier: 2 } },
  // 防具
  { id: 'armor_cloth', name: '旅人布甲', slot: 'armor', rarity: 'N', desc: '輕便的布甲', mods: { hp: 0.1 }, cost: { gold: 100, materials: { ore: 3 } } },
  { id: 'armor_chain', name: '鎖子甲', slot: 'armor', rarity: 'R', desc: '鍊環編成的護甲', mods: { hp: 0.2 }, cost: { gold: 300, materials: { ore: 8 } }, requires: { regionsCleared: 1 } },
  { id: 'armor_mithril', name: '秘銀甲', slot: 'armor', rarity: 'SR', desc: '輕巧又堅固', mods: { hp: 0.35 }, cost: { gold: 800, materials: { ore: 10, crystal_own: 3 } }, requires: { regionsCleared: 2 } },
  { id: 'armor_dragon', name: '龍鱗甲', slot: 'armor', rarity: 'SSR', desc: '冰龍的鱗片打造', mods: { hp: 0.55 }, cost: { gold: 2000, materials: { ore: 15, core: 3 } }, requires: { regionsCleared: 3 } },
  // 飾品
  { id: 'acc_charm', name: '幸運符', slot: 'accessory', rarity: 'N', desc: '帶來一點好運', mods: { crit: 0.05 }, cost: { gold: 150, materials: { ore: 3 } } },
  { id: 'acc_hourglass', name: '時之沙漏', slot: 'accessory', rarity: 'R', desc: '讓思考的時間變長', mods: { timeMs: 2000 }, cost: { gold: 400, materials: { ore: 8 } }, requires: { regionsCleared: 1 } },
  { id: 'acc_elf', name: '精靈耳環', slot: 'accessory', rarity: 'SR', desc: '精靈的祝福', mods: { crit: 0.1, timeMs: 2000 }, cost: { gold: 900, materials: { ore: 10, crystal_own: 3 } }, requires: { regionsCleared: 2 } },
  { id: 'acc_king', name: '王者之戒', slot: 'accessory', rarity: 'SSR', desc: '古代國王的戒指', mods: { atk: 0.2, crit: 0.1 }, cost: { gold: 2500, materials: { ore: 15, core: 3 } }, requires: { regionsCleared: 3 } },
];

export const equipDef = (id: string) => EQUIPMENT.find(e => e.id === id);

export interface OwnedEquip {
  uid: string;
  defId: string;
  plus: number;
}

export const MAX_PLUS = 10;

// 強化：每 +1 讓裝備效果再 +10%
export function equipMods(item: OwnedEquip): Partial<Mods> {
  const def = equipDef(item.defId);
  if (!def) return {};
  const scale = 1 + item.plus * 0.1;
  return Object.fromEntries(Object.entries(def.mods).map(([k, v]) => [k, (v as number) * scale]));
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

export function displayName(def: EquipDef, cls: ClassId): string {
  return def.id === 'signature' ? signatureName(cls) : def.name;
}

// ---------- 賣出 ----------
// 沒有裝備在身上的裝備可以賣掉，退還打造與強化時投入的 65%（金幣與素材都退）
export const SELL_RATE = 0.65;

export function sellValue(item: OwnedEquip, element: Element): { gold: number; materials: Record<string, number> } {
  const def = equipDef(item.defId);
  if (!def) return { gold: 0, materials: {} };
  let gold = def.cost.gold;
  const materials = resolveCost(def, element);
  for (let p = 0; p < item.plus; p++) {
    const c = enhanceCost({ ...item, plus: p });
    gold += c.gold;
    materials.ore = (materials.ore ?? 0) + c.ore;
  }
  const back = Object.fromEntries(Object.entries(materials).map(([k, v]) => [k, Math.floor(v * SELL_RATE)]).filter(([, v]) => (v as number) > 0));
  return { gold: Math.floor(gold * SELL_RATE), materials: back };
}
