import type { Question } from './types';
import { questionDifficulty, questionSkill } from './QuestionData';
// 三星評價：每張三星關卡（20 小關）在第 20 關結算時評分。
// 條件刻意引導好的學習行為（穩定答對、複習錯題），不只比速度。

export interface MapRunStats {
  answered: number;
  correct: number;
  maxCombo: number;
  maxStreak: number;          // 真的連續答對幾題（不受困難題 Bonus 乘法影響）
  knockouts: number;          // 這張地圖中倒下的隊員數
  bossQuestionsCorrect: number;
  eligibleCorrectAnswers: number;
  fastCorrectAnswers: number;
  correctTimeMs: number;      // 答對題目花的總時間
  hpRatio: number;            // 結算時隊伍 HP 比例
  bossFlawless: boolean;      // 頭目戰沒有答錯
  earlyFinish?: boolean;      // 處決提早結算（有剩餘加成題未答）
}

export const emptyRunStats = (): MapRunStats => ({
  answered: 0, correct: 0, eligibleCorrectAnswers: 0, fastCorrectAnswers: 0, maxCombo: 0, maxStreak: 0, knockouts: 0, bossQuestionsCorrect: 0, correctTimeMs: 0, hpRatio: 1, bossFlawless: true,
});

export interface StarCondition {
  label: string;
  met: (s: MapRunStats) => boolean;
}

const accuracy = (s: MapRunStats) => (s.answered ? s.correct / s.answered : 0);
const TYPE_BASE_MS = { listening: 6000, reading: 5000, speaking: 5000, writing: 9000 };
export function fastReferenceMs(q: Question): number {
  const skill = q.type === 'spell' || q.type === 'fill' ? 'writing' : questionSkill(q);
  const text = q.speak ?? q.ans;
  // 長口說每超過5個詞加350ms；長拼寫每超過8字母加300ms。
  // 這是作答預算，不含TTS播放或辨識處理時間。
  const lengthMs = skill === 'speaking' ? Math.max(0, text.trim().split(/\s+/).length - 5) * 350
    : skill === 'writing' ? Math.max(0, text.replace(/[^a-z]/gi, '').length - 8) * 300 : 0;
  return TYPE_BASE_MS[skill] + 1500 * (questionDifficulty(q) - 1) + lengthMs;
}
export const isFastAnswer = (q: Question, activeAnswerMs: number) =>
  Number.isFinite(activeAnswerMs) && activeAnswerMs >= 0 && activeAnswerMs <= fastReferenceMs(q) * 0.7;
export const fastRoutePassed = (s: MapRunStats) => s.eligibleCorrectAnswers >= 12 &&
  s.fastCorrectAnswers >= Math.max(3, Math.ceil(s.eligibleCorrectAnswers * 0.10));

// 第四輪（和 Gemini 討論）：原本的條件太容易拿滿。改成三個方向各一顆：
// 生存、英文準度85%、動態真實連對或至少10%有效答對達快答。
// C4：連對門檻依整張實際作答數調整，並以區域門檻封頂；困難題 Bonus 不影響真實連對。
// 第二十一輪：首領處決提早結算時，為維持彩色三星挑戰性，要求正確率 ≥95%、真實連對 ≥12。
export const STAR_COMBO = [8, 10, 12, 15, 18, 20, 25, 30, 35];
export const STAR_ACCURACY = 0.85;
export const STAR_EARLY_ACCURACY = 0.95;
export const STAR_EARLY_STREAK = 12;

export function requiredStreak(regionIdx: number, actualAnswers: number): number {
  const regionRequirement = STAR_COMBO[Math.min(Math.max(0, regionIdx), STAR_COMBO.length - 1)];
  return Math.min(regionRequirement, Math.max(8, Math.ceil(Math.min(Math.max(0, actualAnswers), 90) * 0.15)));
}

export function starConditions(regionIdx: number, actualAnswers = 90, earlyFinish = false): StarCondition[] {
  if (earlyFinish) {
    return [
      { label: '通關且沒有隊員倒下', met: s => s.knockouts === 0 },
      { label: `處決提早結算：正確率 ${Math.round(STAR_EARLY_ACCURACY * 100)}% 以上（未達可繼續追擊）`, met: s => accuracy(s) >= STAR_EARLY_ACCURACY },
      { label: `處決提早結算：連續答對 ${STAR_EARLY_STREAK} 題以上`, met: s => s.maxStreak >= STAR_EARLY_STREAK },
    ];
  }
  const combo = requiredStreak(regionIdx, actualAnswers);
  return [
    { label: '通關且沒有隊員倒下', met: s => s.knockouts === 0 },
    { label: `正確率 ${Math.round(STAR_ACCURACY * 100)}% 以上`, met: s => accuracy(s) >= STAR_ACCURACY },
    { label: `連續答對 ${combo} 題，或有效答對至少12題且快答達10%（至少3題）`, met: s => s.maxStreak >= requiredStreak(regionIdx, s.answered) || fastRoutePassed(s) },
  ];
}

export function evaluateStars(regionIdx: number, stats: MapRunStats): boolean[] {
  return starConditions(regionIdx, stats.answered, !!stats.earlyFinish).map(c => c.met(stats));
}

// 每顆新拿到的星星：+1 召喚券
export const STAR_TICKETS = 1;

export const countStars = (stars: boolean[] | undefined) => (stars ?? []).filter(Boolean).length;

// 合併最佳紀錄：每個條件只要達成過一次就保留
export const mergeStars = (prev: boolean[] | undefined, next: boolean[]) => next.map((v, i) => v || (prev?.[i] ?? false));
