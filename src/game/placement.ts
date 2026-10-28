import type { Question } from './types';
import { LEVELS, getPool } from './QuestionData';
import { shuffleArray, shuffleChoice, voiceFallback } from './battle';

// 跳級：程度測驗（新玩家看完序章時可選）與守門試煉（隨時挑戰目前的區域，答對 8/10 直接通關）。
// 不送等級；守門試煉需要主角達到一定等級才能挑戰。最後一個區域（王城）有主線結局，不能跳過。

// 守門試煉的等級門檻（依區域順序）；王城沒有試煉
export const GATE_LEVEL = [5, 10, 20, 25, 30];
export const GATE_QUESTIONS = 10;
export const GATE_PASS = 8;
export const SKIPPABLE_REGIONS = LEVELS.length - 1;

export const canChallengeGate = (regionIdx: number, level: number) =>
  regionIdx < SKIPPABLE_REGIONS && level >= (GATE_LEVEL[regionIdx] ?? Infinity);

// 測驗只用不需要麥克風的題型：口說題改成拼寫，句子型口說題不用
function quizable(q: Question): Question | null {
  const t = voiceFallback(q);
  return t.type === 'voice' ? null : shuffleChoice(t);
}

function draw(regionIdx: number, bossCount: number, normalCount: number, rand: () => number): Question[] {
  const pool = getPool(LEVELS[regionIdx]);
  const pick = (list: Question[], n: number) => shuffleArray(list.map(quizable).filter((q): q is Question => q !== null), rand).slice(0, n);
  return shuffleArray([...pick(pool.boss, bossCount), ...pick(pool.normal, normalCount)], rand);
}

// 守門試煉：這一區頭目題 4 題＋一般題 6 題
export const gateQuestions = (regionIdx: number, rand: () => number = Math.random) => draw(regionIdx, 4, GATE_QUESTIONS - 4, rand);

// 程度測驗：從第一區開始，每區 3 題；答對 2 題以上就往下一區，否則停在這一區。
// 最多測到能跳過的最後一區，所以最多 15 題
export const PLACEMENT_PER_LEVEL = 3;
export const PLACEMENT_PASS = 2;
export const placementQuestions = (regionIdx: number, rand: () => number = Math.random) => draw(regionIdx, 1, PLACEMENT_PER_LEVEL - 1, rand);

// 判斷作答：拼寫比對整個字；填空可以只填空格的字母，也可以打完整個字
export function checkQuizAnswer(q: Question, input: string): boolean {
  const given = input.trim().toUpperCase().replace(/[^A-Z]/g, '');
  if (q.type === 'choice') return input === q.ans;
  if (q.type === 'fill') return given === q.ans || (!!q.speak && given === q.speak.toUpperCase().replace(/[^A-Z]/g, ''));
  return given === q.ans;
}
