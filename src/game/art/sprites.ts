import Phaser from 'phaser';
import type { HeroId } from '../progression';
import type { Character } from '../character';
import { OUTLINE } from './palette';
import { avatarKey, composeAvatar } from './avatar';
import type { AvatarFrame } from './avatar';

// 像素美術：所有角色與怪物都以文字點陣繪製，再依調色盤上色、註冊成 Phaser 貼圖。
// 不依賴外部圖檔，換色（英雄、各區域怪物）只需要換調色盤。
// 每張圖同時產生一張純白版本（key + '_flash'），被擊中時閃白用。

type Palette = Record<string, string>;



// ---------- 英雄（24x16，面向右；idle 與 attack 兩格） ----------
const HERO_IDLE = [
  '......KKKKK...K.........',
  '.....KHHHHHK.KWK........',
  '....KHHHHHHHKKWK........',
  '....KHHHHHHHKKWK........',
  '....KHSSSSSSKKWK........',
  '....KSSESSESKKWK........',
  '....KSSSSSSsKKWK........',
  '.....KSSssSK.KWK........',
  '....KKAAAAAKKKWK........',
  '...KCAALLAAAKGGK........',
  '...KCAAAAAAASSK.........',
  '...KCAAGGGAAKK..........',
  '...KCcAAAAAAK...........',
  '....KKBBKBBKK...........',
  '....KBBK.KBBK...........',
  '....KKK...KKK...........',
];

const HERO_ATTACK = [
  '........................',
  '.......KKKKK............',
  '......KHHHHHK...........',
  '.....KHHHHHHHK..........',
  '.....KHSSSSSSK..........',
  '.....KSSESSESK..........',
  '.....KSSSSSSsK..........',
  '......KSSssSK...........',
  '.....KKAAAAAKK..........',
  '....KCAALLAAAKGKKKKKKKKK',
  '...KCCAAAAAAASGWWWWWWWWK',
  '...KCAAGGGAAKKGKKKKKKKK.',
  '...KCcAAAAAAK...........',
  '...KKBBK.KBBKK..........',
  '..KBBK.....KBBK.........',
  '..KKK.......KKK.........',
];

const HERO_BASE: Palette = {
  K: OUTLINE, S: '#f4c7a1', s: '#d08f6a', E: '#1a1226', H: '#5b3a29',
  W: '#eef5ff', G: '#ffcd4b', B: '#3b2d4f', c: '#7a1f2e',
};

// 英雄換色：盔甲 A/L 與披風 C
export const HERO_PALETTES: Record<HeroId, Palette> = {
  knight: { ...HERO_BASE, A: '#5b7bd5', L: '#a9c1ff', C: '#d6404f' },
  archer: { ...HERO_BASE, A: '#3f9e5a', L: '#9be3a8', C: '#8a5a2b', H: '#c9862f' },
  mage: { ...HERO_BASE, A: '#7d4fd1', L: '#c9a8ff', C: '#2e2a6b', H: '#e8e8f0' },
  bard: { ...HERO_BASE, A: '#e08a2e', L: '#ffd28a', C: '#2b8a8a', H: '#2a2030' },
};

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

export type MonsterKind = 'slime' | 'bat' | 'mushroom' | 'king' | 'ghost';

const MONSTER_ART: Record<MonsterKind, string[]> = {
  slime: SLIME, bat: BAT, mushroom: MUSHROOM, king: KING_SLIME, ghost: GHOST,
};

// 每個區域的怪物配色（M 主色、L 亮部、m 暗部）
export const REGION_MONSTER_COLORS: { M: string; L: string; m: string }[] = [
  { M: '#5fd36b', L: '#b6f5a8', m: '#2f8a4a' }, // A1 草原
  { M: '#4fb3e8', L: '#b0e6ff', m: '#2a6fa8' }, // A2 森林湖畔
  { M: '#e8a64f', L: '#ffe0a3', m: '#a8642a' }, // B1 沙漠
  { M: '#9aa8ff', L: '#e3e7ff', m: '#5a62b8' }, // B2 雪山
  { M: '#e8505b', L: '#ffb0a8', m: '#8f2a3a' }, // C1 火山
];

const MONSTER_FIXED: Palette = {
  K: OUTLINE, W: '#ffffff', D: '#3a1530', R: '#ffe14d', G: '#ffcd4b', T: '#f3e2c4', t: '#c9a988',
};

export const GHOST_COLORS = { M: '#a77bf0', L: '#e2ccff', m: '#5e3aa8' };

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

export const heroDataUrl = (hero: HeroId, scale = 6) => pixelDataUrl(HERO_IDLE, HERO_PALETTES[hero], scale, 16);

export const heroKey =(hero: HeroId, frame: 'idle' | 'attack') => `hero_${hero}_${frame}`;
export const monsterKey = (kind: MonsterKind, region: number) => `mon_${kind}_${region}`;

export function registerSprites(scene: Phaser.Scene) {
  (Object.keys(HERO_PALETTES) as HeroId[]).forEach(hero => {
    register(scene, heroKey(hero, 'idle'), HERO_IDLE, HERO_PALETTES[hero]);
    register(scene, heroKey(hero, 'attack'), HERO_ATTACK, HERO_PALETTES[hero]);
  });
  REGION_MONSTER_COLORS.forEach((colors, region) => {
    (['slime', 'bat', 'mushroom', 'king'] as MonsterKind[]).forEach(kind => {
      register(scene, monsterKey(kind, region), MONSTER_ART[kind], { ...MONSTER_FIXED, ...colors });
    });
    register(scene, monsterKey('ghost', region), GHOST, { ...MONSTER_FIXED, ...GHOST_COLORS });
  });
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

// 一般關卡輪流出現三種怪物，Boss 是史萊姆王，復仇魔王是幽靈
export function monsterKindFor(stageIdx: number, isBoss: boolean, isRevenge: boolean): MonsterKind {
  if (isRevenge) return 'ghost';
  if (isBoss) return 'king';
  return (['slime', 'bat', 'mushroom'] as MonsterKind[])[stageIdx % 3];
}

export const MONSTER_NAMES: Record<MonsterKind, string> = {
  slime: '史萊姆', bat: '夜蝠', mushroom: '毒菇怪', king: '史萊姆王', ghost: '復仇魔王',
};

export function registerAvatar(scene: Phaser.Scene, c: Character) {
  (['idle', 'attack'] as AvatarFrame[]).forEach(frame => {
    const { rows, palette } = composeAvatar(c, frame);
    register(scene, avatarKey(c, frame), rows, palette);
  });
}

export function avatarDataUrl(c: Character, frame: AvatarFrame = 'idle', scale = 6): string {
  const { rows, palette } = composeAvatar(c, frame);
  return pixelDataUrl(rows, palette, scale);
}
