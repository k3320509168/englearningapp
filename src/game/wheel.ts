// 獎勵轉盤（第十一輪，和 ChatGPT 討論後定案）：每張三星地圖第一次破第 5、10、15、20 關，各轉一次。
// 重打不再給（避免刷券）；轉盤機會沒轉完會保留，回地圖也可以轉。
// 期望值：召喚券約 1.1 張＋掃蕩券 0.14 張／次；一張地圖 4 次，加上首領與三星，大約每張地圖 9～10 張召喚券。
// 連續 2 次銘謝惠顧後，下一次一定有獎。答題表現不影響機率（不然英文好的人越抽越多，差距拉大）。

export interface WheelPrize {
  id: string;
  label: string;
  icon: string;
  color: string;
  weight: number;
  tickets?: number;
  sweep?: number;
  gold?: number;
}

export const WHEEL_PRIZES: WheelPrize[] = [
  { id: 'none', label: '銘謝惠顧', icon: '🍀', color: '#334155', weight: 18, gold: 50 },
  { id: 't1', label: '召喚券 ×1', icon: '🎫', color: '#0284c7', weight: 50, tickets: 1 },
  { id: 'sweep', label: '掃蕩券 ×1', icon: '🎟️', color: '#059669', weight: 14, sweep: 1 },
  { id: 't3', label: '召喚券 ×3', icon: '🎫', color: '#8b5cf6', weight: 15, tickets: 3 },
  { id: 't5', label: '召喚券 ×5', icon: '💎', color: '#f59e0b', weight: 3, tickets: 5 },
];

// 每張地圖的哪幾關破完可以轉（地圖內第幾關，1 起算）
export const WHEEL_CHECKPOINTS = [5, 10, 15, 20];
// 連續幾次銘謝惠顧後，下一次保證有獎
export const WHEEL_EMPTY_PITY = 2;

export const wheelKey = (levelKey: string, stageIdx: number) => `${levelKey}#${stageIdx}`;

// 抽一次：dry＝目前連續銘謝惠顧幾次
export function rollWheel(rand: () => number, dry: number): number {
  const pool = WHEEL_PRIZES.map((p, i) => ({ i, w: dry >= WHEEL_EMPTY_PITY && p.id === 'none' ? 0 : p.weight }));
  const total = pool.reduce((s, p) => s + p.w, 0);
  let x = rand() * total;
  for (const p of pool) {
    if (x < p.w) return p.i;
    x -= p.w;
  }
  return pool.findLast(p => p.w > 0)!.i;
}

export const wheelExpectedTickets = () => {
  const total = WHEEL_PRIZES.reduce((s, p) => s + p.weight, 0);
  return WHEEL_PRIZES.reduce((s, p) => s + (p.tickets ?? 0) * p.weight, 0) / total;
};
