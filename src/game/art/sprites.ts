import Phaser from 'phaser';
import { heroCharacter, heroDef } from '../heroes';
import type { HeroId } from '../heroes';
import type { Character, Element } from '../character';
import { OUTLINE } from './palette';
import { avatarKey, composeAvatar } from './avatar';
import type { AvatarFrame } from './avatar';

// 像素美術：所有角色與怪物都以文字點陣繪製，再依調色盤上色、註冊成 Phaser 貼圖。
// 不依賴外部圖檔，換色（英雄、各區域怪物）只需要換調色盤。
// 每張圖同時產生一張純白版本（key + '_flash'），被擊中時閃白用。

type Palette = Record<string, string>;



// ---------- 怪物 ----------
const SLIME = [
  '................',
  '......KKKK......',
  '....KKLLMMKK....',
  '...KLLMMMMMMK...',
  '..KLMMMMMMMMMK..',
  '..KMMMMMMMMMMK..',
  '.KMMKKMMMMKKMMK.',
  '.KMMKWMMMMKWMMK.',
  '.KMMMMMMMMMMMMK.',
  '.KMMMMDKKDMMMMK.',
  '.KmMMMMMMMMMMmK.',
  '..KmmmmmmmmmmK..',
  '...KKKKKKKKKK...',
];

const KING_SLIME = [
  '.....G..G..G....',
  '.....GKGGKGG....',
  '.....GGRGGGG....',
  ...SLIME.slice(1),
];

const BAT = [
  '................',
  '.KK..........KK.',
  'KMMK..KKKK..KMMK',
  'KMMMKKMMMMKKMMMK',
  'KMmMMMMMMMMMMmMK',
  '.KmmMMRKKRMMmmK.',
  '..KmKMMMMMMKmK..',
  '...K.KMDDMK.K...',
  '......KMMK......',
  '.......KK.......',
];

const MUSHROOM = [
  '....KKKKKK....',
  '..KKMMLLMMKK..',
  '.KMMWWMMMWWMK.',
  'KMMMWWMMMMMMMK',
  'KMMMMMMMWWMMMK',
  'KmMMMMMMMMMMmK',
  '.KKKKKKKKKKKK.',
  '...KTTTTTTK...',
  '...KTKTTKTK...',
  '...KTTTTTTK...',
  '...KTTDDTTK...',
  '...KtTTTTtK...',
  '....KKKKKK....',
];

const GHOST = [
  '.....KKKKKK.....',
  '...KKMMMMMMKK...',
  '..KMMLLMMMMMMK..',
  '.KMLLMMMMMMMMMK.',
  '.KMMMMMMMMMMMMK.',
  'KMMMKKMMMMKKMMMK',
  'KMMMKRMMMMKRMMMK',
  'KMMMMMMMMMMMMMMK',
  'KMMMMMKDDKMMMMMK',
  'KMMMMMKDDKMMMMMK',
  'KmMMMMMKKMMMMMmK',
  'KmmMMMMMMMMMMmmK',
  'KmmmMMMMMMMMmmmK',
  'KmKmmMmmmmMmmKmK',
  'KK.KmKKmmKKmK.KK',
  '....K..KK..K....',
];

// 寶箱怪（擬態寶箱，蓋子縫裡露出眼睛）
const CHEST = [
  '..KKKKKKKKKKKK..',
  '.KBBBBBBBBBBBBK.',
  'KBBbBBBBBBBBbBBK',
  'KGGGGGGGGGGGGGGK',
  'KBBbBBBYYBBBbBBK',
  'KKKKKKKYYKKKKKKK',
  'KDWWDDDKKDDDWWDK',
  'KBBbBBBBBBBBbBBK',
  'KGGGGGGGGGGGGGGK',
  'KBBbBBBDDBBBbBBK',
  'KBBbBBBBBBBBbBBK',
  'KbbbbbbbbbbbbbbK',
  '.KKKKKKKKKKKKKK.',
];
const CHEST_COLORS = { B: '#b07a3e', b: '#7a5230', Y: '#fff3a0' };

// 沉默魔王：王城與黃金之路的最終頭目
const DEMON = [
  '...G...GG...G...',
  '...GG.GGGG.GG...',
  '...GGGGGGGGGG...',
  '..KMMMMMMMMMMK..',
  '.KMMMMMMMMMMMMK.',
  '.KMMRRMMMMRRMMK.',
  '.KMMMMMMMMMMMMK.',
  '..KMMMDDDDMMMK..',
  '...KMMMMMMMMK...',
  '.CCKAAAAAAAAKCC.',
  'CCKAAALLLLAAAKCC',
  'CKAAAALLLLAAAAKC',
  'CKAAAAAAAAAAAAKC',
  'CKAAAAAGGAAAAAKC',
  'CKAAAAAAAAAAAAKC',
  'CCKAAAAAAAAAAKCC',
  '.CCKAAA..AAAKCC.',
  '..CKAAK..KAAKC..',
  '..CKAAK..KAAKC..',
  '...KKK....KKK...',
];
const DEMON_COLORS = { M: '#2a1a3a', R: '#ff2a4a', D: '#120a18', G: '#ffcd4b', A: '#3a2a52', L: '#6a4fa0', C: '#8f1f2e' };

export type MonsterKind = 'slime' | 'bat' | 'mushroom' | 'king' | 'ghost' | 'chest' | 'demon';

const MONSTER_ART: Record<MonsterKind, string[]> = {
  slime: SLIME, bat: BAT, mushroom: MUSHROOM, king: KING_SLIME, ghost: GHOST, chest: CHEST, demon: DEMON,
};

// 每個區域的怪物配色（M 主色、L 亮部、m 暗部）
export const REGION_MONSTER_COLORS: { M: string; L: string; m: string }[] = [
  { M: '#5fd36b', L: '#b6f5a8', m: '#2f8a4a' }, // A1 草原
  { M: '#4fb3e8', L: '#b0e6ff', m: '#2a6fa8' }, // A2 森林湖畔
  { M: '#e8a64f', L: '#ffe0a3', m: '#a8642a' }, // B1 沙漠
  { M: '#9aa8ff', L: '#e3e7ff', m: '#5a62b8' }, // B2 雪山
  { M: '#e8505b', L: '#ffb0a8', m: '#8f2a3a' }, // C1 火山
  { M: '#b48aff', L: '#ffe08a', m: '#5a3a9a' }, // C2 王城
];

const MONSTER_FIXED: Palette = {
  K: OUTLINE, W: '#ffffff', D: '#3a1530', R: '#ffe14d', G: '#ffcd4b', T: '#f3e2c4', t: '#c9a988',
};

export const GHOST_COLORS = { M: '#a77bf0', L: '#e2ccff', m: '#5e3aa8' };

// ---------- 怪物屬性：每個屬性有自己的配色與頭上的配件 ----------
// 配件畫在怪物頭頂（最下面一列疊在怪物最上緣），A 主色、a 暗色
export const ELEMENT_MONSTER_COLORS: Record<Element, { M: string; L: string; m: string; A: string; a: string }> = {
  metal: { M: '#b8c2d0', L: '#eef2f8', m: '#6f7a8c', A: '#ffd34d', a: '#c0922a' },
  wood: { M: '#5fd36b', L: '#b6f5a8', m: '#2f8a4a', A: '#9cf06b', a: '#6b4626' },
  water: { M: '#4fb3e8', L: '#b0e6ff', m: '#2a6fa8', A: '#8fdcff', a: '#2a6fa8' },
  fire: { M: '#ff6b4a', L: '#ffc0a0', m: '#a8322a', A: '#ffcd4b', a: '#ff5a1f' },
  earth: { M: '#c08a4f', L: '#ead0a0', m: '#7a5230', A: '#a89a88', a: '#5c5248' },
  light: { M: '#fff0a8', L: '#ffffff', m: '#d0b050', A: '#ffe066', a: '#c9a020' },
  dark: { M: '#7a4fc1', L: '#c9a8ff', m: '#3e2470', A: '#4a3a5e', a: '#ff4a6e' },
};

const ACCESSORIES: Record<Element, string[]> = {
  // 鋼鐵頭盔＋尖刺
  metal: ['...KK...', '..KWAK..', '.KAAAaK.', 'KAAAAAaK'],
  // 兩片葉子的嫩芽
  wood: ['.KK..KK.', 'KAAKKAAK', '.KKaaKK.', '...KK...'],
  // 水滴
  water: ['...K....', '..KAK...', '.KAWaK..', '.KAaaK..', '..KKK...'],
  // 火焰
  fire: ['...K....', '..KAK.K.', '.KAaAKAK', 'KAaWaAaK'],
  // 岩石碎塊
  earth: ['..KK.KK.', '.KAAKAaK', 'KAAaKaaK'],
  // 光環（浮在頭上）
  light: ['.KKKKKK.', 'KAWWWWAK', '.KKKKKK.', '........'],
  // 惡魔角
  dark: ['K......K', 'KK....KK', 'KAK..KAK', '.KAK.KAK'],
};

// 把屬性配件疊到怪物點陣的頭頂，必要時往上加高
function withAccessory(rows: string[], el: Element): string[] {
  const acc = ACCESSORIES[el];
  const w = Math.max(...rows.map(r => r.length));
  const top = rows.findIndex(r => /[^.]/.test(r));
  const topRow = rows[top];
  const first = topRow.search(/[^.]/);
  const last = topRow.length - 1 - [...topRow].reverse().join('').search(/[^.]/);
  const pad = Math.max(0, acc.length - 1 - top);
  const grid = [...Array(pad).fill('.'.repeat(w)), ...rows.map(r => r.padEnd(w, '.'))].map(r => [...r]);
  const y0 = pad + top - (acc.length - 1);
  const x0 = Math.round((first + last) / 2) - 4;
  acc.forEach((row, dy) => [...row].forEach((ch, dx) => {
    const x = x0 + dx;
    if (ch !== '.' && x >= 0 && x < w) grid[y0 + dy][x] = ch;
  }));
  return grid.map(r => r.join(''));
}

// ---------- 小圖示 ----------
const SPARK = [
  '...W...',
  '...W...',
  '..WYW..',
  'WWYYYWW',
  '..WYW..',
  '...W...',
  '...W...',
];

const COIN = [
  '.KKKK.',
  'KGGYGK',
  'KGYGGK',
  'KGYGGK',
  'KGGGGK',
  '.KKKK.',
];

const HEART = [
  '.KK.KK.',
  'KRRKRRK',
  'KRWRRRK',
  'KRRRRRK',
  '.KRRRK.',
  '..KRK..',
  '...K...',
];

const ICON_FIXED: Palette = { K: OUTLINE, W: '#ffffff', Y: '#fff3a0', G: '#ffcd4b', R: '#ff5a6e' };

// ---------- 地圖用：區域旗幟、石台、鎖 ----------
const FLAG = [
  'KK..........',
  'KPKKKKKKKK..',
  'KPFFFFFFFFK.',
  'KPFLLFFFFFFK',
  'KPFLFFFFFFK.',
  'KPFFFFFFFK..',
  'KPKKKKKKK...',
  'KP..........',
  'KP..........',
  'KP..........',
  'KP..........',
  'KP..........',
  'KKK.........',
];

const PEDESTAL = [
  '..KKKKKKKKKK..',
  '.KSSSSSSSSSSK.',
  'KSSsSSSSSsSSSK',
  'KssssssssssssK',
  'KKKKKKKKKKKKKK',
];

const LOCK = [
  '..KKK..',
  '.K...K.',
  '.K...K.',
  'KKKKKKK',
  'KGGGGGK',
  'KGGKGGK',
  'KGGGGGK',
  'KKKKKKK',
];

export const flagKey = (region: number, locked: boolean) => `flag_${locked ? 'locked' : region}`;

// ---------- 註冊 ----------
function drawPixels(scene: Phaser.Scene, key: string, rows: string[], palette: Palette, flash = false) {
  if (scene.textures.exists(key)) return;
  const h = rows.length;
  const w = Math.max(...rows.map(r => r.length));
  const tex = scene.textures.createCanvas(key, w, h);
  if (!tex) return;
  const ctx = tex.getContext();
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const color = palette[ch];
      if (ch === '.' || !color) return;
      ctx.fillStyle = flash ? '#ffffff' : color;
      ctx.fillRect(x, y, 1, 1);
    });
  });
  tex.refresh();
  // 只有像素圖用「最近鄰」放大，文字仍保持平滑，畫面縮小時才看得清楚
  tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
}

function register(scene: Phaser.Scene, key: string, rows: string[], palette: Palette) {
  drawPixels(scene, key, rows, palette);
  drawPixels(scene, `${key}_flash`, rows, palette, true);
}

// React 介面用：把點陣圖轉成 data URL（例如角色預覽）；width 可只取左邊幾格
export function pixelDataUrl(rows: string[], palette: Palette, scale = 6, width?: number): string {
  const w = width ?? Math.max(...rows.map(r => r.length));
  const canvas = document.createElement('canvas');
  canvas.width = w * scale;
  canvas.height = rows.length * scale;
  const ctx = canvas.getContext('2d')!;
  rows.forEach((row, y) => [...row.slice(0, w)].forEach((ch, x) => {
    if (ch === '.' || !palette[ch]) return;
    ctx.fillStyle = palette[ch];
    ctx.fillRect(x * scale, y * scale, scale, scale);
  }));
  return canvas.toDataURL();
}

export const heroDataUrl = (hero: HeroId, scale = 3) => avatarDataUrl(heroCharacter(heroDef(hero)), 'idle', scale);

export const heroKey = (hero: HeroId, frame: AvatarFrame) => `hero_${hero}_${frame}`;
export const monsterKey = (kind: MonsterKind, el: Element) => `mon_${kind}_${el}`;

export function registerSprites(scene: Phaser.Scene) {
  (Object.keys(ELEMENT_MONSTER_COLORS) as Element[]).forEach(el => {
    const colors = ELEMENT_MONSTER_COLORS[el];
    (['slime', 'bat', 'mushroom', 'king'] as MonsterKind[]).forEach(kind => {
      register(scene, monsterKey(kind, el), withAccessory(MONSTER_ART[kind], el), { ...MONSTER_FIXED, ...colors });
    });
    // 寶箱怪沒有屬性配件，各屬性共用同一個外觀
    register(scene, monsterKey('chest', el), CHEST, { ...MONSTER_FIXED, ...CHEST_COLORS });
    register(scene, monsterKey('demon', el), DEMON, { ...MONSTER_FIXED, ...DEMON_COLORS });
  });
  // 復仇魔王固定是暗屬性的幽靈
  register(scene, monsterKey('ghost', 'dark'), withAccessory(GHOST, 'dark'), { ...MONSTER_FIXED, ...GHOST_COLORS, A: ELEMENT_MONSTER_COLORS.dark.A, a: ELEMENT_MONSTER_COLORS.dark.a });
  REGION_MONSTER_COLORS.forEach((c, region) => {
    register(scene, flagKey(region, false), FLAG, { K: OUTLINE, P: '#d8c8b4', F: c.M, L: c.L });
  });
  register(scene, flagKey(0, true), FLAG, { K: OUTLINE, P: '#8a8494', F: '#5c5868', L: '#7a7688' });
  register(scene, 'pedestal', PEDESTAL, { K: OUTLINE, S: '#9a94a8', s: '#6c667c' });
  register(scene, 'lock', LOCK, ICON_FIXED);
  register(scene, 'spark', SPARK, ICON_FIXED);
  register(scene, 'coin', COIN, ICON_FIXED);
  register(scene, 'heart', HEART, ICON_FIXED);
}

// 一般關卡輪流出現三種怪物，Boss 是史萊姆王，復仇魔王是幽靈，寶箱關是寶箱怪
export function monsterKindFor(stageIdx: number, isBoss: boolean, isRevenge: boolean, isTreasure = false, isFinal = false): MonsterKind {
  if (isFinal) return 'demon';
  if (isRevenge) return 'ghost';
  if (isTreasure) return 'chest';
  if (isBoss) return 'king';
  return (['slime', 'bat', 'mushroom'] as MonsterKind[])[stageIdx % 3];
}

export const MONSTER_NAMES: Record<MonsterKind, string> = {
  slime: '史萊姆', bat: '夜蝠', mushroom: '毒菇怪', king: '史萊姆王', ghost: '復仇魔王', chest: '寶箱怪', demon: '沉默魔王',
};

// 屬性怪物的名字前綴，例如「火焰史萊姆」
export const ELEMENT_PREFIX: Record<Element, string> = {
  metal: '鋼鐵', wood: '森林', water: '水靈', fire: '火焰', earth: '岩石', light: '聖光', dark: '暗影',
};

export function monsterName(kind: MonsterKind, el: Element): string {
  return kind === 'ghost' || kind === 'chest' || kind === 'demon' ? MONSTER_NAMES[kind] : `${ELEMENT_PREFIX[el]}${MONSTER_NAMES[kind]}`;
}

export function registerAvatar(scene: Phaser.Scene, c: Character, tier = 0) {
  (['idle', 'attack'] as AvatarFrame[]).forEach(frame => {
    const { rows, palette } = composeAvatar(c, frame, tier);
    register(scene, avatarKey(c, frame, tier), rows, palette);
  });
}

export function avatarDataUrl(c: Character, frame: AvatarFrame = 'idle', scale = 6, tier = 0): string {
  const { rows, palette } = composeAvatar(c, frame, tier);
  return pixelDataUrl(rows, palette, scale);
}

// 夥伴英雄的貼圖（用到時才畫）
export function registerHero(scene: Phaser.Scene, id: HeroId) {
  const c = heroCharacter(heroDef(id));
  (['idle', 'attack'] as AvatarFrame[]).forEach(frame => {
    const { rows, palette } = composeAvatar(c, frame);
    register(scene, heroKey(id, frame), rows, palette);
  });
}
