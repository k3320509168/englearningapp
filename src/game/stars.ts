// 三星評價：每張三星關卡（20 小關）在第 20 關結算時評分。
// 條件刻意引導好的學習行為（穩定答對、複習錯題），不只比速度。

export interface MapRunStats {
  answered: number;
  correct: number;
  maxCombo: number;
  maxStreak: number;          // 真的連續答對幾題（不受困難題 Bonus 乘法影響）
  knockouts: number;          // 這張地圖中倒下的隊員數
  bossQuestionsCorrect: number;
  correctTimeMs: number;      // 答對題目花的總時間
  hpRatio: number;            // 結算時隊伍 HP 比例
  bossFlawless: boolean;      // 頭目戰沒有答錯
}

export const emptyRunStats = (): MapRunStats => ({
  answered: 0, correct: 0, maxCombo: 0, maxStreak: 0, knockouts: 0, bossQuestionsCorrect: 0, correctTimeMs: 0, hpRatio: 1, bossFlawless: true,
});

export interface StarCondition {
  label: string;
  met: (s: MapRunStats) => boolean;
}

const accuracy = (s: MapRunStats) => (s.answered ? s.correct / s.answered : 0);
const avgMs = (s: MapRunStats) => (s.correct ? s.correctTimeMs / s.correct : Infinity);

// 第四輪（和 Gemini 討論）：原本的條件太容易拿滿。改成三個方向各一顆：
// 生存（沒有隊員倒下）、英文準度（正確率 85%）、爽度與極限（連續答對達到該區門檻，或答對平均 3.5 秒內）。
// 連對門檻每區提高，讓三星一直有挑戰性；看的是真的連續答對題數，抽到困難題 Bonus ×10 不會直接達成。
export const STAR_COMBO = [8, 10, 12, 15, 18, 20, 25, 30, 35];
export const STAR_ACCURACY = 0.85;
export const STAR_FAST_MS = 3_500;

export function starConditions(regionIdx: number): StarCondition[] {
  const combo = STAR_COMBO[Math.min(Math.max(0, regionIdx), STAR_COMBO.length - 1)];
  return [
    { label: '通關且沒有隊員倒下', met: s => s.knockouts === 0 },
    { label: `正確率 ${Math.round(STAR_ACCURACY * 100)}% 以上`, met: s => accuracy(s) >= STAR_ACCURACY },
    { label: `連續答對 ${combo} 題，或答對平均 ${STAR_FAST_MS / 1000} 秒內`, met: s => s.maxStreak >= combo || avgMs(s) <= STAR_FAST_MS },
  ];
}

export function evaluateStars(regionIdx: number, stats: MapRunStats): boolean[] {
  return starConditions(regionIdx).map(c => c.met(stats));
}

// 每顆新拿到的星星：+1 召喚券
export const STAR_TICKETS = 1;

export const countStars = (stars: boolean[] | undefined) => (stars ?? []).filter(Boolean).length;

// 合併最佳紀錄：每個條件只要達成過一次就保留
export const mergeStars = (prev: boolean[] | undefined, next: boolean[]) => next.map((v, i) => v || (prev?.[i] ?? false));
