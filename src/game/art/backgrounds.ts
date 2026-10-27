import Phaser from 'phaser';

// 像素風背景：以 200x120 的低解析度繪製（每格放大 4 倍成 800x480），分成多層做視差捲動。
// 地形用整數頻率的正弦波疊加，所以左右可以無縫循環。

export const LOW_W = 200;
export const LOW_H = 120;
export const PIXEL = 4;
export const GROUND_ROW = 94; // 地面在低解析度的第 94 列（畫面 y = 376）
export const GROUND_Y = GROUND_ROW * PIXEL;

type Terrain = 'hills' | 'pines' | 'dunes' | 'peaks' | 'volcano';

interface Theme {
  name: string;
  sky: string[];
  sun?: { x: number; y: number; r: number; color: string; glow: string };
  stars?: number;
  cloud?: string;
  far: string;
  farCap?: string;
  near: string;
  nearShade: string;
  terrain: Terrain;
  groundTop: string;
  groundEdge: string;
  ground: string;
  groundDark: string;
  speck: string;
}

export const THEMES: Theme[] = [
  {
    name: '翠綠草原', terrain: 'hills',
    sky: ['#3f8cff', '#5aa2ff', '#78b8ff', '#9dcdff', '#c6e4ff'],
    sun: { x: 160, y: 22, r: 9, color: '#fff6b0', glow: '#ffe57a' }, cloud: '#ffffff',
    far: '#8fb0e0', near: '#4bb563', nearShade: '#33914d',
    groundTop: '#8be05a', groundEdge: '#5fb83f', ground: '#8c5a3c', groundDark: '#6a422c', speck: '#a8724d',
  },
  {
    name: '迷霧森林', terrain: 'pines',
    sky: ['#1f5f84', '#2e7aa0', '#4b98b8', '#78b9c8', '#b4dcd8'],
    sun: { x: 40, y: 26, r: 7, color: '#fff9e0', glow: '#d9f2e6' }, cloud: '#e6f4f2',
    far: '#3c6e78', near: '#1f4f3e', nearShade: '#163a2e',
    groundTop: '#4fb36a', groundEdge: '#358c50', ground: '#5c3f2c', groundDark: '#43301f', speck: '#74533a',
  },
  {
    name: '黃金沙漠', terrain: 'dunes',
    sky: ['#ff6f5a', '#ff8c5f', '#ffab6b', '#ffca85', '#ffe6b0'],
    sun: { x: 140, y: 30, r: 14, color: '#fff3c4', glow: '#ffd98a' },
    far: '#d9824a', near: '#e8a35c', nearShade: '#cc8646',
    groundTop: '#f6cf86', groundEdge: '#e0ad62', ground: '#d69c58', groundDark: '#b97f44', speck: '#e9b876',
  },
  {
    name: '極光雪嶺', terrain: 'peaks',
    sky: ['#1c1d52', '#2e2d72', '#4d4596', '#7a62b4', '#b88ccc'],
    sun: { x: 50, y: 20, r: 6, color: '#f4f6ff', glow: '#c9cdf5' }, stars: 40,
    far: '#6f72c4', farCap: '#eef1ff', near: '#4c4f9c', nearShade: '#3b3d80',
    groundTop: '#f4f7ff', groundEdge: '#c9d3f2', ground: '#8e9fd0', groundDark: '#7383b8', speck: '#b3c1e8',
  },
  {
    name: '熔岩魔域', terrain: 'volcano',
    sky: ['#12060f', '#2a0b17', '#4a1222', '#74202d', '#a83a32'],
    stars: 18,
    far: '#2e1424', farCap: '#ff7a3d', near: '#241019', nearShade: '#180a10',
    groundTop: '#5a2b2b', groundEdge: '#ff7a3d', ground: '#2c171c', groundDark: '#1e0f13', speck: '#ff5a2a',
  },
  {
    // 王城：黃昏下的尖塔群，金色塔頂
    name: '王城', terrain: 'peaks',
    sky: ['#1a0f2e', '#2e1a4a', '#4a2a6a', '#7a3f7a', '#c26a6a'],
    sun: { x: 150, y: 34, r: 11, color: '#ffd9a0', glow: '#ff9a6a' }, stars: 30,
    far: '#3a2f5a', farCap: '#ffcd4b', near: '#2a2440', nearShade: '#1e1a30',
    groundTop: '#8a84a0', groundEdge: '#5a5570', ground: '#3a3548', groundDark: '#2a2638', speck: '#7a7490',
  },
];

function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 週期為 LOW_W 的平滑雜訊（-1 ~ 1）
function periodicNoise(seed: number, freqs: number[]) {
  const r = rng(seed);
  const waves = freqs.map(f => ({ f, phase: r() * Math.PI * 2, amp: 1 / f }));
  const total = waves.reduce((s, w) => s + w.amp, 0);
  return (x: number) => waves.reduce((s, w) => s + w.amp * Math.sin((2 * Math.PI * w.f * x) / LOW_W + w.phase), 0) / total;
}

type Ctx = CanvasRenderingContext2D;
const px = (ctx: Ctx, x: number, y: number, color: string, w = 1, h = 1) => { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); };

function drawSky(ctx: Ctx, t: Theme, seed: number) {
  const bandH = GROUND_ROW / t.sky.length;
  for (let y = 0; y < LOW_H; y++) {
    const band = Math.min(t.sky.length - 1, Math.floor(y / bandH));
    const next = Math.min(t.sky.length - 1, band + 1);
    const inBlend = y >= (band + 1) * bandH - 3;
    for (let x = 0; x < LOW_W; x++) {
      // 色帶交界處用棋盤格混色（dither），保留像素風
      const color = inBlend && (x + y) % 2 === 0 ? t.sky[next] : t.sky[band];
      px(ctx, x, y, color);
    }
  }
  const r = rng(seed);
  for (let i = 0; i < (t.stars ?? 0); i++) {
    const x = Math.floor(r() * LOW_W), y = Math.floor(r() * 50);
    px(ctx, x, y, r() > 0.7 ? '#ffffff' : '#c9c4ff');
  }
  if (t.sun) {
    const { x: cx, y: cy, r: rad, color, glow } = t.sun;
    for (let y = -rad - 3; y <= rad + 3; y++) {
      for (let x = -rad - 3; x <= rad + 3; x++) {
        const d = Math.sqrt(x * x + y * y);
        if (d <= rad) px(ctx, cx + x, cy + y, color);
        else if (d <= rad + 2 && (x + y) % 2 === 0) px(ctx, cx + x, cy + y, glow);
      }
    }
  }
}

function drawClouds(ctx: Ctx, t: Theme, seed: number) {
  if (!t.cloud) return;
  const r = rng(seed + 7);
  for (let i = 0; i < 5; i++) {
    const cx = Math.floor((i / 5) * LOW_W + r() * 20);
    const cy = Math.floor(10 + r() * 30);
    const w = 14 + Math.floor(r() * 14);
    for (let k = 0; k < 3; k++) {
      const bw = Math.floor(w * (k === 1 ? 1 : 0.6));
      const bx = cx + (k === 0 ? 0 : k === 1 ? 4 : w - 6);
      const by = cy - (k === 1 ? 3 : 0);
      for (let x = 0; x < bw; x++) {
        const h = Math.round(4 * Math.sin((Math.PI * x) / bw)) + 2;
        px(ctx, (bx + x) % LOW_W, by - h + 4, t.cloud, 1, h);
      }
    }
  }
}

function drawFar(ctx: Ctx, t: Theme, seed: number) {
  const noise = periodicNoise(seed, t.terrain === 'dunes' ? [1, 2, 3] : [2, 3, 5, 7]);
  const base = t.terrain === 'dunes' ? 76 : t.terrain === 'hills' ? 66 : 54;
  const amp = t.terrain === 'dunes' ? 6 : t.terrain === 'peaks' ? 18 : 12;
  for (let x = 0; x < LOW_W; x++) {
    let top = Math.round(base + amp * noise(x));
    if (t.terrain === 'peaks') top = Math.round(base + amp * -Math.abs(noise(x)) + 6);
    px(ctx, x, top, t.far, 1, GROUND_ROW - top);
    // 雪頂／熔岩頂
    if (t.farCap && t.terrain === 'peaks') px(ctx, x, top, t.farCap, 1, 3);
  }
  if (t.terrain === 'volcano') {
    // 一座火山：梯形山體 + 發光火口
    const cx = 120;
    for (let y = 30; y < GROUND_ROW; y++) {
      const half = Math.floor((y - 30) * 0.9) + 6;
      px(ctx, cx - half, y, t.far, half * 2, 1);
    }
    px(ctx, cx - 6, 29, t.farCap!, 12, 2);
    for (let i = 0; i < 6; i++) px(ctx, cx - 3 + i, 31 + (i % 3) * 3, t.farCap!, 1, 2);
  }
}

function drawNear(ctx: Ctx, t: Theme, seed: number) {
  const r = rng(seed + 3);
  if (t.terrain === 'pines') {
    for (let i = 0; i < 14; i++) {
      const cx = Math.floor((i / 14) * LOW_W + r() * 8);
      const h = 22 + Math.floor(r() * 16);
      const top = GROUND_ROW - h;
      for (let y = 0; y < h - 4; y++) {
        const half = Math.floor(y * 0.35) + 1;
        for (let x = -half; x <= half; x++) px(ctx, (cx + x + LOW_W) % LOW_W, top + y, x < 0 ? t.nearShade : t.near);
      }
      px(ctx, cx, GROUND_ROW - 4, '#3a2a20', 1, 4);
    }
    return;
  }
  const noise = periodicNoise(seed + 11, [3, 4, 6]);
  const base = t.terrain === 'dunes' ? 86 : 82;
  const amp = t.terrain === 'dunes' ? 4 : 6;
  for (let x = 0; x < LOW_W; x++) {
    const top = Math.round(base + amp * noise(x));
    const slope = noise((x + 1) % LOW_W) - noise(x);
    px(ctx, x, top, slope > 0 ? t.nearShade : t.near, 1, GROUND_ROW - top);
  }
}

function drawGround(ctx: Ctx, t: Theme, seed: number) {
  const r = rng(seed + 5);
  px(ctx, 0, GROUND_ROW, t.groundTop, LOW_W, 2);
  px(ctx, 0, GROUND_ROW + 2, t.groundEdge, LOW_W, 1);
  px(ctx, 0, GROUND_ROW + 3, t.ground, LOW_W, LOW_H - GROUND_ROW - 3);
  for (let x = 0; x < LOW_W; x += 2) {
    // 草葉／沙紋
    if (r() > 0.55) px(ctx, x, GROUND_ROW - 1, t.groundTop);
  }
  for (let i = 0; i < 160; i++) {
    const x = Math.floor(r() * LOW_W), y = GROUND_ROW + 5 + Math.floor(r() * (LOW_H - GROUND_ROW - 6));
    px(ctx, x, y, r() > 0.5 ? t.speck : t.groundDark, r() > 0.7 ? 2 : 1, 1);
  }
  // 磚塊感的分隔線，讓地面捲動時看得出移動
  for (let x = 0; x < LOW_W; x += 25) px(ctx, x, GROUND_ROW + 4, t.groundDark, 1, 6);
}

export type BgLayer = 'sky' | 'clouds' | 'far' | 'near' | 'ground';
export const BG_LAYERS: { layer: BgLayer; speed: number }[] = [
  { layer: 'sky', speed: 0 },
  { layer: 'clouds', speed: 0.08 },
  { layer: 'far', speed: 0.2 },
  { layer: 'near', speed: 0.5 },
  { layer: 'ground', speed: 1 },
];

export const bgKey = (region: number, layer: BgLayer) => `bg_${region}_${layer}`;

export function registerBackground(scene: Phaser.Scene, region: number) {
  const theme = THEMES[region] ?? THEMES[0];
  const draws: Record<BgLayer, (ctx: Ctx) => void> = {
    sky: ctx => drawSky(ctx, theme, region),
    clouds: ctx => drawClouds(ctx, theme, region),
    far: ctx => drawFar(ctx, theme, region * 13 + 1),
    near: ctx => drawNear(ctx, theme, region * 17 + 2),
    ground: ctx => drawGround(ctx, theme, region * 19 + 3),
  };
  (Object.keys(draws) as BgLayer[]).forEach(layer => {
    const key = bgKey(region, layer);
    if (scene.textures.exists(key)) return;
    const small = document.createElement('canvas');
    small.width = LOW_W; small.height = LOW_H;
    draws[layer](small.getContext('2d')!);
    const tex = scene.textures.createCanvas(key, LOW_W * PIXEL, LOW_H * PIXEL);
    if (!tex) return;
    const ctx = tex.getContext();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(small, 0, 0, LOW_W * PIXEL, LOW_H * PIXEL);
    tex.refresh();
    tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
  });
}

export const themeName = (region: number) => (THEMES[region] ?? THEMES[0]).name;
