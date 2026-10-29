// 主角（玩家自創角色）：職業、屬性、外觀與名字。
// 外觀只存「選項編號」，像素圖在 art/avatar.ts 依編號分層組合出來。

export type ClassId = 'mage' | 'swordsman' | 'warrior' | 'archer' | 'monk';
export type Element = 'metal' | 'wood' | 'water' | 'fire' | 'earth' | 'light' | 'dark';
export type Gender = 'male' | 'female';

export interface Character {
  name: string;
  classId: ClassId;
  element: Element;
  gender: Gender;
  face: number;      // 0~4
  body: number;      // 0~4
  skin: number;      // 0~4
  hair: number;      // 0~19
  hairColor: number; // 0~7
}

export const NAME_MAX_LENGTH = 10;
export const DEFAULT_NAME = '勇者'; // 名字留空時的預設（不用屬性名，避免頂部顯示成「光・劍士」像重複）

export interface ClassDef {
  id: ClassId;
  name: string;
  weapon: string;
  role: string;
  desc: string;
  // 基礎能力倍率（P2 戰鬥改版時套用）。三項相乘約等於 1，維持職業平衡
  stats: { hp: number; atk: number; crit: number };
}

export const CLASSES: ClassDef[] = [
  { id: 'mage', name: '魔法師', weapon: '法杖', role: '爆發輸出', desc: '傷害最高、血量最低。擅長用屬性相剋打出大爆發。', stats: { hp: 0.8, atk: 1.3, crit: 0.05 } },
  { id: 'swordsman', name: '劍士', weapon: '長劍', role: '攻守平衡', desc: '各項能力平均，適合第一次玩的人。', stats: { hp: 1.0, atk: 1.0, crit: 0.1 } },
  { id: 'warrior', name: '戰士', weapon: '戰斧', role: '耐打坦克', desc: '血量最厚，答錯也撐得住，傷害穩定。', stats: { hp: 1.3, atk: 0.85, crit: 0.05 } },
  { id: 'archer', name: '弓箭手', weapon: '長弓', role: '暴擊射手', desc: '暴擊率最高，連續答對時常常打出會心一擊。', stats: { hp: 0.9, atk: 0.95, crit: 0.2 } },
  // 第四輪新增：補血與增益，攻擊較低但讓隊伍更不容易倒
  { id: 'monk', name: '僧侶', weapon: '聖杖', role: '治療增益', desc: '會補血、給隊友增益並保住 combo，攻擊較低但讓隊伍很難倒下。', stats: { hp: 1.1, atk: 0.75, crit: 0.05 } },
];

export interface ElementDef {
  id: Element;
  name: string;
  color: string;  // 主色（光環、寶石）
  light: string;  // 亮色
}

export const ELEMENTS: ElementDef[] = [
  { id: 'metal', name: '金', color: '#e8c23a', light: '#fff1a8' },
  { id: 'wood', name: '木', color: '#4fbf5f', light: '#b8f5b0' },
  { id: 'water', name: '水', color: '#3f9fe8', light: '#b0e2ff' },
  { id: 'fire', name: '火', color: '#ff5a3d', light: '#ffc0a0' },
  { id: 'earth', name: '土', color: '#b07a3e', light: '#e8c99a' },
  { id: 'light', name: '光', color: '#fff0a0', light: '#ffffff' },
  { id: 'dark', name: '暗', color: '#8a4fd1', light: '#d2b4ff' },
];

// 五行相剋：金剋木、木剋土、土剋水、水剋火、火剋金；光暗互剋
const BEATS: Partial<Record<Element, Element[]>> = {
  metal: ['wood'], wood: ['earth'], earth: ['water'], water: ['fire'], fire: ['metal'],
  light: ['dark'], dark: ['light'],
};

export const ADVANTAGE_MULTIPLIER = 1.5;
export const DISADVANTAGE_MULTIPLIER = 0.75;

export function beats(attacker: Element, defender: Element): boolean {
  return BEATS[attacker]?.includes(defender) ?? false;
}

// 攻擊方對防守方的屬性傷害倍率。光暗互剋時雙方都算「剋制」
export function elementMultiplier(attacker: Element, defender: Element): number {
  if (beats(attacker, defender)) return ADVANTAGE_MULTIPLIER;
  if (beats(defender, attacker)) return DISADVANTAGE_MULTIPLIER;
  return 1;
}

// 屬性說明文字，例如「剋 木｜被 火 剋」
export function elementRelation(el: Element): string {
  const name = (id: Element) => ELEMENTS.find(e => e.id === id)!.name;
  const strong = BEATS[el] ?? [];
  const weak = (Object.keys(BEATS) as Element[]).filter(k => BEATS[k]!.includes(el));
  if (weak.length === 1 && strong.length === 1 && weak[0] === strong[0]) return `與 ${name(strong[0])} 互剋`;
  return `剋 ${strong.map(name).join('、')}｜被 ${weak.map(name).join('、')} 剋`;
}

export const FACE_NAMES = ['圓眼', '大眼', '笑眼', '銳利', '沉著'];
export const BODY_NAMES = ['纖細', '標準', '健壯', '圓潤', '高挑'];
export const SKIN_TONES = [
  { name: '白皙', base: '#fbe0cc', shade: '#e0b39a' },
  { name: '自然', base: '#f4c7a1', shade: '#d08f6a' },
  { name: '小麥', base: '#dca577', shade: '#b07a50' },
  { name: '古銅', base: '#b77a4f', shade: '#8c5636' },
  { name: '深棕', base: '#7c4a30', shade: '#5a3220' },
];
export const HAIR_NAMES = [
  '短髮', '刺蝟頭', '中分', '西瓜頭', '長直髮', '馬尾', '雙馬尾', '丸子頭', '莫西干', '側分',
  '呆毛', '大波浪', '鮑伯頭', '平頭', '狼尾', '公主切', '辮子', '飛機頭', '光頭', '武士髻',
];
export const HAIR_COLORS = [
  { name: '黑', base: '#2a2030', shade: '#150f1c' },
  { name: '棕', base: '#6b4229', shade: '#45281a' },
  { name: '金', base: '#f2c94c', shade: '#c08a2a' },
  { name: '紅', base: '#d6453d', shade: '#8f2626' },
  { name: '銀', base: '#d8dce8', shade: '#9aa0b4' },
  { name: '藍', base: '#4a7fe0', shade: '#2c4f9e' },
  { name: '粉', base: '#f59ac8', shade: '#c8649a' },
  { name: '綠', base: '#4fbf7a', shade: '#2e8050' },
];

export const DEFAULT_CHARACTER: Character = {
  name: DEFAULT_NAME, classId: 'swordsman', element: 'light', gender: 'male',
  face: 0, body: 1, skin: 1, hair: 0, hairColor: 1,
};

export const classDef = (id: ClassId) => CLASSES.find(c => c.id === id)!;
export const elementDef = (id: Element) => ELEMENTS.find(e => e.id === id)!;

// 名字：去掉頭尾空白、限制長度；空白名字用預設名
export function cleanName(name: string): string {
  const trimmed = [...name.trim()].slice(0, NAME_MAX_LENGTH).join('');
  return trimmed || DEFAULT_NAME;
}

export function randomCharacter(rand: () => number = Math.random): Character {
  const pick = <T,>(list: readonly T[]) => list[Math.floor(rand() * list.length)];
  const index = (n: number) => Math.floor(rand() * n);
  return {
    name: DEFAULT_NAME,
    classId: pick(CLASSES).id,
    element: pick(ELEMENTS).id,
    gender: rand() < 0.5 ? 'male' : 'female',
    face: index(FACE_NAMES.length),
    body: index(BODY_NAMES.length),
    skin: index(SKIN_TONES.length),
    hair: index(HAIR_NAMES.length),
    hairColor: index(HAIR_COLORS.length),
  };
}

// 讀存檔時修正超出範圍的編號（之後選項變少或存檔被改壞時不會當掉）
export function normalizeCharacter(c: Partial<Character> | null | undefined): Character | null {
  if (!c) return null;
  const clamp = (v: unknown, n: number) => (typeof v === 'number' && v >= 0 && v < n ? Math.floor(v) : 0);
  return {
    name: cleanName(c.name ?? ''),
    classId: CLASSES.some(x => x.id === c.classId) ? c.classId! : DEFAULT_CHARACTER.classId,
    element: ELEMENTS.some(x => x.id === c.element) ? c.element! : DEFAULT_CHARACTER.element,
    gender: c.gender === 'female' ? 'female' : 'male',
    face: clamp(c.face, FACE_NAMES.length),
    body: clamp(c.body, BODY_NAMES.length),
    skin: clamp(c.skin, SKIN_TONES.length),
    hair: clamp(c.hair, HAIR_NAMES.length),
    hairColor: clamp(c.hairColor, HAIR_COLORS.length),
  };
}
