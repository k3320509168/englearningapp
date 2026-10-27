import type { Character, ClassId } from '../character';
import { HAIR_COLORS, SKIN_TONES, elementDef } from '../character';
import { OUTLINE } from './palette';

// 主角像素圖：依外觀選項「分層」組合出點陣（後髮 → 身體 → 頭 → 臉 → 頭髮 → 武器 → 前手），
// 最後自動描邊。只需畫各部位的填色，組合數再多也不用一張張手繪。

export type AvatarFrame = 'idle' | 'attack';

export const AVATAR_W = 32;
export const AVATAR_H = 27;
// 身體中心約在第 10 格（給 Phaser 設定原點用）
export const AVATAR_ORIGIN_X = 10 / AVATAR_W;

const CLASS_COLORS: Record<ClassId, { A: string; a: string }> = {
  mage: { A: '#3b3f9e', a: '#272a6b' },
  swordsman: { A: '#2f6fc4', a: '#1f4c8a' },
  warrior: { A: '#9c3b2e', a: '#6b2620' },
  archer: { A: '#3f8f4f', a: '#2a6236' },
};

const FIXED = {
  E: '#1a1226', W: '#ffffff', P: '#f08a9a', m: '#8a3b3b',
  T: '#ffcd4b', X: '#dfe6f0', x: '#8f9ab0', D: '#9a6a3a', d: '#6b4626',
  B: '#3b2d4f', b: '#291f38', F: '#5a3a28', K: OUTLINE,
};

// 身材：軀幹左右邊界、是否有小肚子、是否較高（腿較長）
const BODIES = [
  { l: 8, r: 11, belly: false, tall: false }, // 纖細
  { l: 7, r: 12, belly: false, tall: false }, // 標準
  { l: 6, r: 13, belly: false, tall: false }, // 健壯
  { l: 7, r: 12, belly: true, tall: false },  // 圓潤
  { l: 7, r: 12, belly: false, tall: true },  // 高挑
];

class Grid {
  cells: string[][] = Array.from({ length: AVATAR_H }, () => Array<string>(AVATAR_W).fill('.'));
  set(x: number, y: number, c: string) {
    if (x >= 0 && x < AVATAR_W && y >= 0 && y < AVATAR_H) this.cells[y][x] = c;
  }
  rect(x0: number, y0: number, x1: number, y1: number, c: string) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.set(x, y, c);
  }
  clear(x: number, y: number) { this.set(x, y, '.'); }
  // 所有填色格子旁邊的空格畫上外框
  outline() {
    const filled = (x: number, y: number) => x >= 0 && x < AVATAR_W && y >= 0 && y < AVATAR_H && this.cells[y][x] !== '.' && this.cells[y][x] !== 'K';
    const marks: [number, number][] = [];
    this.cells.forEach((row, y) => row.forEach((c, x) => {
      if (c === '.' && (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1))) marks.push([x, y]);
    }));
    marks.forEach(([x, y]) => this.set(x, y, 'K'));
  }
  rows() { return this.cells.map(r => r.join('')); }
}

// 以頭部左上角為原點的畫筆（頭 8x9，臉朝右）
type Pen = {
  dot: (dx: number, dy: number, c?: string) => void;
  rect: (dx0: number, dy0: number, dx1: number, dy1: number, c?: string) => void;
};

function pen(g: Grid, hx: number, hy: number): Pen {
  return {
    dot: (dx, dy, c = 'H') => g.set(hx + dx, hy + dy, c),
    rect: (dx0, dy0, dx1, dy1, c = 'H') => g.rect(hx + dx0, hy + dy0, hx + dx1, hy + dy1, c),
  };
}

// ---------- 髮型（20 種）：back 畫在身體後面，front 畫在頭上 ----------
type HairStyle = { back?: (p: Pen) => void; front: (p: Pen) => void };

const crown = (p: Pen) => { p.rect(1, -1, 6, -1); p.rect(0, 0, 7, 1); };
const fringe = (p: Pen) => { p.rect(0, 2, 7, 2); p.rect(0, 3, 3, 3); p.dot(7, 3); };
const sides = (p: Pen, rows: number) => { p.rect(0, 3, 1, 3 + rows, 'H'); p.rect(0, 3, 0, 3 + rows, 'h'); };
const short = (p: Pen) => { crown(p); fringe(p); sides(p, 2); };
const longBack = (p: Pen, bottom: number) => { p.rect(-1, 2, 1, bottom); p.rect(-1, 2, -1, bottom, 'h'); };

const HAIRSTYLES: HairStyle[] = [
  // 0 短髮
  { front: short },
  // 1 刺蝟頭
  { front: p => { short(p); [1, 3, 5].forEach(x => p.dot(x, -2)); p.dot(7, -1); p.dot(-1, 0); p.dot(-1, 2, 'h'); } },
  // 2 中分
  { front: p => { crown(p); p.rect(0, 2, 2, 2); p.rect(5, 2, 7, 2); p.rect(0, 3, 1, 3); p.dot(7, 3); sides(p, 2); } },
  // 3 西瓜頭
  { front: p => { crown(p); p.rect(0, 2, 7, 3); p.rect(-1, 1, -1, 5, 'h'); sides(p, 3); p.dot(7, 4); } },
  // 4 長直髮
  { back: p => longBack(p, 12), front: short },
  // 5 馬尾
  { back: p => { p.rect(-2, 1, -1, 2); p.rect(-3, 3, -2, 8); p.dot(-3, 9, 'h'); p.rect(-3, 3, -3, 8, 'h'); }, front: p => { short(p); p.dot(-1, 1, 'T'); } },
  // 6 雙馬尾
  { back: p => { p.rect(-3, 2, -1, 9); p.rect(-3, 2, -3, 9, 'h'); p.rect(8, 2, 9, 8); p.rect(9, 2, 9, 8, 'h'); },
    front: p => { short(p); p.dot(-1, 1, 'T'); p.dot(8, 1, 'T'); } },
  // 7 丸子頭
  { front: p => { short(p); p.rect(0, -3, 2, -2); p.dot(1, -4); p.dot(0, -2, 'h'); } },
  // 8 莫西干
  { front: p => { p.rect(2, -3, 5, 0); p.rect(2, -3, 2, 0, 'h'); p.rect(0, 1, 1, 3, 'h'); } },
  // 9 側分
  { front: p => { crown(p); p.rect(0, 2, 7, 2); p.rect(0, 3, 1, 3); p.rect(4, 3, 7, 3); sides(p, 2); } },
  // 10 呆毛
  { front: p => { short(p); p.dot(4, -2); p.dot(5, -3); p.dot(6, -3); } },
  // 11 大波浪
  { back: p => { p.rect(-2, 2, 1, 11); for (let y = 2; y <= 11; y += 2) p.dot(-2, y, 'h'); p.dot(-1, 12); p.dot(1, 12); },
    front: p => { short(p); p.dot(-1, 1); } },
  // 12 鮑伯頭
  { back: p => p.rect(-1, 2, 1, 7), front: p => { crown(p); fringe(p); sides(p, 4); p.rect(7, 3, 7, 6); p.dot(-1, 7, 'h'); } },
  // 13 平頭
  { front: p => { p.rect(1, -1, 6, -1, 'h'); p.rect(0, 0, 7, 0, 'h'); p.rect(0, 1, 2, 2, 'h'); } },
  // 14 狼尾
  { back: p => { p.rect(-1, 3, 0, 8); p.dot(-2, 4); p.dot(-2, 6); p.dot(-1, 9, 'h'); },
    front: p => { short(p); [2, 4, 6].forEach(x => p.dot(x, -2)); p.dot(7, -1); } },
  // 15 公主切
  { back: p => longBack(p, 12), front: p => { crown(p); p.rect(0, 2, 7, 3); sides(p, 3); p.rect(7, 4, 7, 7); } },
  // 16 辮子
  { back: p => { for (let y = 4; y <= 13; y++) p.dot(-1, y, y % 2 ? 'h' : 'H'); p.dot(-1, 14, 'T'); p.dot(-1, 15); },
    front: short },
  // 17 飛機頭
  { front: p => { crown(p); p.rect(4, -3, 8, -1); p.rect(8, -2, 8, -1, 'h'); p.rect(0, 2, 3, 2); sides(p, 2); } },
  // 18 光頭
  { front: p => { p.dot(2, 1, 'W'); } },
  // 19 武士髻
  { front: p => { crown(p); p.rect(0, 2, 2, 2); sides(p, 1); p.rect(1, -3, 2, -2); p.dot(1, -1, 'T'); p.dot(2, -1, 'T'); } },
];

// ---------- 臉型（5 種）：眼睛在 dx 4、6，嘴在 dy 7 ----------
const FACES: ((p: Pen, female: boolean) => void)[] = [
  // 圓眼
  (p, f) => { p.rect(4, 4, 4, 5, 'E'); p.rect(6, 4, 6, 5, 'E'); p.dot(6, 7, f ? 'P' : 'm'); if (f) p.dot(7, 4, 'E'); },
  // 大眼
  (p, f) => { p.dot(4, 4, 'W'); p.dot(6, 4, 'W'); p.rect(4, 5, 4, 6, 'E'); p.rect(6, 5, 6, 6, 'E'); p.dot(6, 7, f ? 'P' : 'm'); if (f) p.dot(7, 4, 'E'); },
  // 笑眼
  (p, f) => { p.rect(3, 5, 4, 5, 'E'); p.rect(6, 5, 7, 5, 'E'); p.rect(5, 7, 6, 7, f ? 'P' : 'm'); p.dot(3, 6, 'P'); p.dot(7, 6, 'P'); },
  // 銳利
  (p, f) => { p.rect(4, 3, 5, 3, 'h'); p.rect(6, 3, 7, 3, 'h'); p.dot(4, 5, 'E'); p.dot(6, 5, 'E'); p.dot(6, 7, f ? 'P' : 'm'); },
  // 沉著
  (p, f) => { p.dot(4, 4, 's'); p.dot(6, 4, 's'); p.dot(4, 5, 'E'); p.dot(6, 5, 'E'); p.rect(5, 7, 6, 7, f ? 'P' : 'm'); },
];

export function composeAvatar(c: Character, frame: AvatarFrame): { rows: string[]; palette: Record<string, string> } {
  const g = new Grid();
  const body = BODIES[c.body] ?? BODIES[1];
  const female = c.gender === 'female';
  const lift = body.tall ? 1 : 0;
  const { l, r } = body;
  const headX = 6, headY = 3 - lift;
  const ty0 = 13 - lift, ty1 = 19 - lift; // 軀幹上下
  const cx = Math.floor((l + r) / 2);
  const hp = pen(g, headX, headY);
  const hair = HAIRSTYLES[c.hair] ?? HAIRSTYLES[0];

  // 1. 背後：長髮、箭袋
  hair.back?.(hp);
  if (c.classId === 'archer') {
    g.rect(l - 2, ty0 - 2, l - 1, ty0 + 4, 'D');
    g.rect(l - 2, ty0 - 2, l - 2, ty0 + 4, 'd');
    g.set(l - 2, ty0 - 3, 'X'); g.set(l - 1, ty0 - 4, 'X');
  }

  // 2. 腿與靴子
  g.rect(l, ty1 + 1, l + 1, 23, 'b');
  g.rect(r - 1, ty1 + 1, r, 23, 'B');
  g.rect(l, 24, l + 1, 25, 'F');
  g.rect(r - 1, 24, r + 1, 25, 'F');

  // 3. 後手
  g.rect(l - 1, ty0 + 1, l - 1, ty0 + 4, 'a');
  g.set(l - 1, ty0 + 5, 's');

  // 4. 軀幹與職業服裝
  g.rect(l, ty0, r, ty1, 'A');
  g.rect(l, ty0, l, ty1, 'a');
  if (c.classId !== 'warrior') { g.clear(l, ty0); g.clear(r, ty0); }
  if (body.belly) g.rect(r + 1, ty0 + 3, r + 1, ty0 + 5, 'A');
  if (female && c.classId !== 'mage') { g.rect(l - 1, ty1 - 1, r + 1, ty1 + 1, 'A'); g.rect(l - 1, ty1 - 1, l - 1, ty1 + 1, 'a'); }
  switch (c.classId) {
    case 'mage':
      // 長袍蓋到腳踝，下襬與領口用屬性色
      g.rect(l, ty1, r, 23, 'A'); g.rect(l, ty1, l, 23, 'a');
      g.rect(l - 1, 21, r + 1, 23, 'A'); g.rect(l - 1, 21, l - 1, 23, 'a');
      g.rect(l - 1, 23, r + 1, 23, 'L');
      g.rect(l + 1, ty0, r - 1, ty0, 'L');
      g.set(cx, ty0 + 4, 'Q'); g.rect(cx, ty0 + 5, cx, ty1, 'L');
      break;
    case 'swordsman':
      g.rect(l + 1, ty0 + 1, r - 1, ty0 + 2, 'X'); g.rect(l + 1, ty0 + 1, l + 1, ty0 + 2, 'x');
      g.rect(l, ty0 + 4, r, ty0 + 4, 'T'); g.set(cx, ty0 + 4, 'Q');
      break;
    case 'warrior':
      g.rect(l, ty0 + 1, r, ty0 + 3, 'd');
      g.set(cx, ty0 + 2, 'A'); g.set(cx + 1, ty0 + 1, 'A');
      g.rect(l, ty0 + 4, r, ty0 + 5, 'T'); g.set(cx, ty0 + 4, 'Q'); g.set(cx, ty0 + 5, 'Q');
      break;
    case 'archer':
      g.rect(l + 1, ty0, r - 1, ty0, 'L');
      g.rect(l, ty0 + 4, r, ty0 + 4, 'd'); g.set(cx, ty0 + 4, 'Q');
      g.set(r - 1, ty0 + 1, 'D'); g.set(r - 2, ty0 + 2, 'D'); g.set(r - 3, ty0 + 3, 'D');
      break;
  }

  // 5. 脖子、頭、耳朵、臉
  g.rect(9, ty0 - 1, 10, ty0 - 1, 's');
  hp.rect(0, 0, 7, 8, 'S');
  hp.dot(0, 0, '.'); hp.dot(7, 0, '.'); hp.dot(0, 8, '.'); hp.dot(7, 8, '.');
  hp.rect(0, 6, 1, 7, 's');
  hp.rect(2, 5, 2, 6, 's');
  FACES[c.face]?.(hp, female);

  // 6. 頭髮
  hair.front(hp);

  // 7. 戰士的護肩
  if (c.classId === 'warrior') {
    g.rect(l - 2, ty0 - 1, l, ty0 + 1, 'X'); g.rect(l - 2, ty0 + 1, l, ty0 + 1, 'x');
    if (frame === 'idle') { g.rect(r, ty0 - 1, r + 2, ty0 + 1, 'X'); g.rect(r, ty0 + 1, r + 2, ty0 + 1, 'x'); }
  }

  // 8. 前手與武器
  if (frame === 'idle') {
    const hx = r + 1, hy = ty0 + 5, wx = hx + 1;
    drawIdleWeapon(g, c.classId, wx, hy);
    // 前手與軀幹之間加一道暗色，看得出是手臂
    g.rect(r, ty0 + 1, r, ty0 + 4, 'a');
    g.rect(hx, ty0 + 1, hx, ty0 + 4, 'A');
    if (c.classId === 'warrior') g.rect(hx, ty0 - 1, hx + 1, ty0 + 1, 'X');
    g.rect(hx, hy, wx, hy, 'S');
  } else {
    const hx = r + 4, hy = ty0 + 1;
    drawAttackWeapon(g, c.classId, hx, hy);
    g.rect(r + 1, hy, r + 3, hy, 'A');
    if (c.classId === 'warrior') g.rect(r, ty0 - 1, r + 2, ty0, 'X');
    g.set(hx, hy, 'S');
  }

  g.outline();

  const skin = SKIN_TONES[c.skin] ?? SKIN_TONES[1];
  const hairColor = HAIR_COLORS[c.hairColor] ?? HAIR_COLORS[0];
  const el = elementDef(c.element);
  const palette: Record<string, string> = {
    ...FIXED, ...CLASS_COLORS[c.classId],
    S: skin.base, s: skin.shade, H: hairColor.base, h: hairColor.shade,
    L: el.light, Q: el.color,
  };
  return { rows: g.rows(), palette };
}

function drawIdleWeapon(g: Grid, cls: ClassId, wx: number, hy: number) {
  switch (cls) {
    case 'mage':
      g.rect(wx, hy - 10, wx, hy + 5, 'D');
      g.rect(wx, hy - 13, wx + 1, hy - 11, 'Q'); g.set(wx + 1, hy - 13, 'L');
      g.set(wx + 1, hy - 10, 'T');
      break;
    case 'swordsman':
      g.rect(wx, hy - 10, wx, hy - 2, 'X'); g.rect(wx + 1, hy - 9, wx + 1, hy - 2, 'x');
      g.rect(wx - 1, hy - 1, wx + 2, hy - 1, 'T'); g.set(wx, hy + 1, 'Q');
      break;
    case 'warrior':
      g.rect(wx, hy - 9, wx, hy + 4, 'D');
      g.rect(wx + 1, hy - 9, wx + 1, hy - 5, 'X'); g.rect(wx + 2, hy - 10, wx + 3, hy - 4, 'X');
      g.rect(wx + 3, hy - 10, wx + 3, hy - 4, 'x'); g.set(wx + 2, hy - 7, 'L');
      g.rect(wx - 1, hy - 8, wx - 1, hy - 7, 'X');
      break;
    case 'archer':
      g.rect(wx - 1, hy - 6, wx - 1, hy + 6, 'W');
      g.rect(wx, hy - 2, wx, hy + 2, 'D');
      g.rect(wx + 1, hy - 5, wx + 1, hy - 3, 'D'); g.rect(wx + 1, hy + 3, wx + 1, hy + 5, 'D');
      g.set(wx, hy - 6, 'T'); g.set(wx, hy + 6, 'T'); g.set(wx, hy, 'Q');
      break;
  }
}

function drawAttackWeapon(g: Grid, cls: ClassId, hx: number, hy: number) {
  switch (cls) {
    case 'mage':
      g.rect(hx - 2, hy, hx + 8, hy, 'D');
      g.rect(hx + 9, hy - 1, hx + 11, hy + 1, 'Q'); g.set(hx + 10, hy - 1, 'L'); g.set(hx + 12, hy - 2, 'L');
      break;
    case 'swordsman':
      g.rect(hx + 2, hy, hx + 11, hy, 'X'); g.rect(hx + 2, hy + 1, hx + 10, hy + 1, 'x');
      g.rect(hx + 1, hy - 1, hx + 1, hy + 2, 'T'); g.set(hx - 1, hy, 'Q');
      break;
    case 'warrior':
      g.rect(hx - 2, hy, hx + 7, hy, 'D');
      g.rect(hx + 5, hy - 3, hx + 7, hy - 1, 'X'); g.rect(hx + 5, hy + 1, hx + 7, hy + 2, 'X');
      g.rect(hx + 8, hy - 3, hx + 8, hy + 2, 'x'); g.set(hx + 6, hy - 2, 'L');
      break;
    case 'archer':
      g.rect(hx, hy - 4, hx, hy + 4, 'W');
      g.rect(hx + 1, hy - 1, hx + 1, hy + 1, 'D');
      g.rect(hx + 2, hy - 4, hx + 2, hy - 2, 'D'); g.rect(hx + 2, hy + 2, hx + 2, hy + 4, 'D');
      g.set(hx + 1, hy - 5, 'T'); g.set(hx + 1, hy + 5, 'T');
      g.rect(hx - 3, hy, hx + 5, hy, 'd'); g.rect(hx + 6, hy, hx + 7, hy, 'X'); g.set(hx - 3, hy, 'Q');
      break;
  }
}

// 外觀改變時用不同的貼圖 key，不必刪除舊貼圖（其他場景可能還在用）
export function avatarKey(c: Character, frame: AvatarFrame): string {
  return `avatar_${c.classId}_${c.element}_${c.gender}_${c.face}_${c.body}_${c.skin}_${c.hair}_${c.hairColor}_${frame}`;
}

