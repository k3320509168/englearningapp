// Combo 分級特效：只決定「看起來多華麗」，不影響傷害或任何規則。
// combo 越高，斬擊、殘影、震波、粒子與音效層層疊加；稱號沿用 5／10／20，再往上加兩級給長連擊的玩家。

export interface ComboFx {
  tier: number;          // 0~5
  label: string;
  color: string;         // 稱號與 combo 數字的顏色
  slashColor: number;    // 斬擊軌跡的主色
  afterimages: number;   // 衝刺殘影數
  slashes: number;       // 斬擊道數（1 弧、2 十字、3 以上交錯）
  shockwave: boolean;    // 命中震波環
  flames: boolean;       // 隊伍身上持續的鬥氣
  lightning: boolean;    // 天降雷擊
  pillar: boolean;       // 光柱
  particles: number;     // 命中粒子數的倍率
}

const TIERS: Omit<ComboFx, 'tier'>[] = [
  { label: '', color: '#ffffff', slashColor: 0xffffff, afterimages: 0, slashes: 1, shockwave: false, flames: false, lightning: false, pillar: false, particles: 1 },
  { label: 'GREAT!', color: '#ffcd4b', slashColor: 0xffe27a, afterimages: 1, slashes: 1, shockwave: true, flames: false, lightning: false, pillar: false, particles: 1.3 },
  { label: 'AWESOME!', color: '#ff7a3d', slashColor: 0xff9a4d, afterimages: 2, slashes: 2, shockwave: true, flames: true, lightning: false, pillar: false, particles: 1.6 },
  { label: 'UNSTOPPABLE!', color: '#ff5af0', slashColor: 0xff8af5, afterimages: 3, slashes: 2, shockwave: true, flames: true, lightning: true, pillar: false, particles: 2 },
  { label: 'LEGENDARY!', color: '#7fe8ff', slashColor: 0x9ff0ff, afterimages: 3, slashes: 3, shockwave: true, flames: true, lightning: true, pillar: true, particles: 2.3 },
  { label: 'GODLIKE!', color: '#fff36b', slashColor: 0xfff9c0, afterimages: 4, slashes: 4, shockwave: true, flames: true, lightning: true, pillar: true, particles: 2.6 },
];

const THRESHOLDS = [0, 5, 10, 20, 30, 50];

export function comboTierOf(combo: number): number {
  let t = 0;
  THRESHOLDS.forEach((min, i) => { if (combo >= min) t = i; });
  return t;
}

export function comboFx(combo: number): ComboFx {
  const tier = comboTierOf(combo);
  return { tier, ...TIERS[tier] };
}

// 拼寫題的蓄力顏色：依拼寫進度白 → 藍 → 紫 → 金
const CHARGE_COLORS = [0xffffff, 0x6fc3ff, 0xc77dff, 0xffcd4b];
export function chargeColor(progress: number): number {
  const i = Math.min(CHARGE_COLORS.length - 1, Math.floor(Math.max(0, progress) * CHARGE_COLORS.length));
  return CHARGE_COLORS[i];
}

// 打擊音的音高：每 combo 升半音，最多升一個八度，避免刺耳
export const hitPitch = (combo: number) => 2 ** (Math.min(Math.max(0, combo), 12) / 12);
