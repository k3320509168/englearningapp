// 三星評價：每張地圖（10 關）結算時評分，條件依區域難度分三級。
// 條件刻意引導好的學習行為（穩定答對、複習錯題），不只比速度。

export interface MapRunStats {
  answered: number;
  correct: number;
  maxCombo: number;
  knockouts: number;          // 這張地圖中倒下的隊員數
  bossQuestionsCorrect: number;
  correctTimeMs: number;      // 答對題目花的總時間
  hpRatio: number;            // 結算時隊伍 HP 比例
  bossFlawless: boolean;      // 頭目戰沒有答錯
}

export const emptyRunStats = (): MapRunStats => ({
  answered: 0, correct: 0, maxCombo: 0, knockouts: 0, bossQuestionsCorrect: 0, correctTimeMs: 0, hpRatio: 1, bossFlawless: true,
});

export interface StarCondition {
  label: string;
  met: (s: MapRunStats) => boolean;
}

const accuracy = (s: MapRunStats) => (s.answered ? s.correct / s.answered : 0);
const avgMs = (s: MapRunStats) => (s.correct ? s.correctTimeMs / s.correct : Infinity);

// 初級：建立信心
const EASY: StarCondition[] = [
  { label: '通關這張地圖', met: () => true },
  { label: '打出 5 combo 以上', met: s => s.maxCombo >= 5 },
  { label: '正確率 70% 以上', met: s => accuracy(s) >= 0.7 },
];
// 中級：複習與熟練
const MEDIUM: StarCondition[] = [
  { label: '沒有隊員倒下', met: s => s.knockouts === 0 },
  { label: '答對 2 題魔王題（錯題複習）', met: s => s.bossQuestionsCorrect >= 2 },
  { label: '答對的題目平均 5 秒內完成', met: s => avgMs(s) <= 5_000 },
];
// 高級：精確
const HARD: StarCondition[] = [
  { label: '結算時隊伍 HP 50% 以上', met: s => s.hpRatio >= 0.5 },
  { label: '正確率 100%', met: s => s.answered > 0 && s.correct === s.answered },
  { label: '頭目戰一題都沒答錯', met: s => s.bossFlawless },
];

export function starConditions(regionIdx: number): StarCondition[] {
  if (regionIdx <= 1) return EASY;
  if (regionIdx <= 3) return MEDIUM;
  return HARD;
}

export function evaluateStars(regionIdx: number, stats: MapRunStats): boolean[] {
  return starConditions(regionIdx).map(c => c.met(stats));
}

// 每顆新拿到的星星：+1 召喚券
export const STAR_TICKETS = 1;

export const countStars = (stars: boolean[] | undefined) => (stars ?? []).filter(Boolean).length;

// 合併最佳紀錄：每個條件只要達成過一次就保留
export const mergeStars = (prev: boolean[] | undefined, next: boolean[]) => next.map((v, i) => v || (prev?.[i] ?? false));
