// 額外模式（第四輪，和 Gemini 討論定案）：每日素材本（60 秒狂熱快答）與英雄時空之塔。
import type { Question } from './types';
import { LEVELS, getPool } from './QuestionData';
import { shuffleArray, voiceFallback } from './battle';
import { xpScale } from './growth';

// ---------- 每日素材本 ----------
export const RUSH_SECONDS = 60;
export const RUSH_PER_DAY = 3;

// 只出學過（圖鑑裡有）的題目；學過的太少時，用目前區域最簡單的題目補
export function rushQuestions(codex: Record<string, { question: Question }>, regionIdx: number, rand: () => number = Math.random): Question[] {
  const learned = Object.values(codex).map(c => voiceFallback(c.question));
  const pool = getPool(LEVELS[Math.min(regionIdx, LEVELS.length - 1)]);
  const easy = pool.normal.filter(q => (q.difficulty ?? 1) <= 1).map(voiceFallback);
  const all = learned.length >= 30 ? learned : [...learned, ...easy];
  return shuffleArray(all, rand).slice(0, 80);
}

export interface RushReward { gold: number; xp: number; ore: number }
export function rushReward(correct: number, bestCombo: number, regionIdx: number, runIndex = 0): RushReward {
  const scale = 1 + regionIdx * 0.3;
  // 前 2 次保底 150 金幣＋素材，第 3 次純依表現結算
  const baseGold = runIndex < 2 ? 150 : 0;
  return {
    gold: baseGold + Math.round((correct * 15 + bestCombo * 5) * scale),
    xp: Math.round(correct * 8 * xpScale(regionIdx)),
    ore: Math.max(runIndex < 2 ? 1 : 0, Math.floor(correct / 3)),
  };
}

// ---------- 英雄時空之塔與無盡之塔 ----------
// 前 30 層為標準時空之塔，每 3 層換一個 CEFR 區域的題目；每層 5 題、答對 4 題通過。
// 30 層通關後開啟「無盡之塔」，層數無上限攀爬，每 5 層為頭目關並額外贈送 1 張召喚券！
export const TOWER_FLOORS = 30;
export const TOWER_QUESTIONS = 5;
export const TOWER_PASS = 4;
export const isEndlessFloor = (floor: number) => floor > TOWER_FLOORS;
export const towerRegion = (floor: number) => {
  if (floor <= TOWER_FLOORS) return Math.min(LEVELS.length - 1, Math.floor((floor - 1) / 3));
  return (floor - 31) % LEVELS.length;
};
// 每一層第一次通過：碎片、金幣，和職業徽章；無盡層每 5 層贈送召喚券
export const towerReward = (floor: number) => {
  const isEndless = floor > TOWER_FLOORS;
  const shards = floor % 5 === 0 ? (isEndless ? 20 : 15) : (isEndless ? 8 : 5);
  const gold = isEndless ? 300 + floor * 15 : 100 * floor;
  const badges = isEndless && floor % 5 === 0 ? 4 : 2;
  const tickets = isEndless && floor % 5 === 0 ? 1 : 0;
  const xp = Math.round(120 * xpScale(towerRegion(floor)) * (floor % 5 === 0 ? 1.5 : 1));
  return { shards, gold, badges, tickets, xp };
};

export function towerQuestions(floor: number, rand: () => number = Math.random): Question[] {
  const pool = getPool(LEVELS[towerRegion(floor)]);
  const isEndless = floor > TOWER_FLOORS;
  const hard = isEndless ? (floor % 5 === 0) : (floor % 3 === 0);
  return shuffleArray((hard ? pool.boss : pool.normal).map(voiceFallback), rand).slice(0, TOWER_QUESTIONS);
}

// 今日主角英雄：從擁有的英雄中每天輪一位（稀有度高的優先，碎片最有用）
export function featuredHero<T extends string>(owned: T[], dayIndex: number): T | null {
  if (!owned.length) return null;
  return owned[dayIndex % owned.length];
}
export const dayIndex = (date = new Date()) => Math.floor(date.getTime() / 86_400_000);
