// 關卡配置的常數（沒有其他依賴，題庫、區域、數值都可以引用，避免循環引用）
export const MAP_SIZE = 20;
// 各區的三星關卡數：A1、A2 各 5 張，往後逐步增加，C2 9 張
export const REGION_CHAPTERS = [5, 5, 6, 6, 7, 7, 8, 8, 9];
export const chapterCount = (levelIdx: number) => REGION_CHAPTERS[Math.min(Math.max(0, levelIdx), REGION_CHAPTERS.length - 1)];
// 區域總關卡數：三星關卡 × 20 ＋ 區域最終魔王 1 關
export const regionStageCount = (levelIdx: number) => chapterCount(levelIdx) * MAP_SIZE + 1;
// 小關在三星關卡裡的位置（1～20）
export const stageInMap = (stageIdx: number) => (stageIdx % MAP_SIZE) + 1;


// ---------- 每種小關的最低答題數（docs/STAGE_PLAN.md 第 2 節） ----------
// 傷害再高也一定要答完的題數：一般關把怪打光還不夠就再來一波；首領提前打到 0 血就進入「終結連擊」把題目答完。
// 依序：一般、菁英、寶箱、小 BOSS（第 15 關）、大 BOSS（第 20 關）、區域最終魔王
export type StageRole = 'normal' | 'elite' | 'treasure' | 'gate' | 'boss' | 'final';
const ROLE_INDEX: Record<StageRole, number> = { normal: 0, elite: 1, treasure: 2, gate: 3, boss: 4, final: 5 };
export const MIN_ANSWERS: number[][] = [
  [6, 9, 6, 12, 16, 24],   // A1
  [6, 9, 6, 12, 16, 26],   // A2
  [7, 10, 7, 13, 17, 28],  // A2+
  [7, 10, 7, 13, 17, 30],  // B1
  [8, 11, 8, 14, 18, 32],  // B1+
  [8, 11, 8, 14, 18, 34],  // B2
  [9, 12, 9, 15, 19, 36],  // B2+
  [9, 12, 9, 15, 19, 38],  // C1
  [10, 13, 10, 16, 20, 40], // C2
];
// 小關在區域裡的角色
export function stageRole(levelIdx: number, stageIdx: number): StageRole {
  if (stageIdx >= regionStageCount(levelIdx) - 1) return 'final';
  const n = stageInMap(stageIdx);
  return n === 20 ? 'boss' : n === 15 ? 'gate' : n === 5 || n === 10 ? 'elite' : n === 7 ? 'treasure' : 'normal';
}

// ---------- 新手上手（A1 第 1 張關卡，docs/STAGE_PLAN.md 第 7 節） ----------
// 第 1 張：讓玩家覺得自己很強；題數從 3 題慢慢加，前幾關不計時、敵人不主動攻擊，題型由選擇、聽力慢慢加到拼寫、口說
export const ONBOARDING_MIN = [3, 4, 5, 5, 6, 6, 5, 6, 6, 8, 7, 7, 8, 8, 12, 8, 8, 8, 9, 16];
const onboarding = (levelIdx: number, stageIdx: number) => levelIdx === 0 && stageIdx < MAP_SIZE;

export function minAnswers(levelIdx: number, stageIdx: number): number {
  if (onboarding(levelIdx, stageIdx)) return ONBOARDING_MIN[stageIdx];
  const row = MIN_ANSWERS[Math.min(Math.max(0, levelIdx), MIN_ANSWERS.length - 1)];
  return row[ROLE_INDEX[stageRole(levelIdx, stageIdx)]];
}

// 一般關一開始放幾隻怪（新手前幾關少一點，打完不夠最低題數再補一波）
export const startWaves = (levelIdx: number, stageIdx: number, normalWaves: number) =>
  (onboarding(levelIdx, stageIdx) ? Math.min(normalWaves, ONBOARDING_MIN[stageIdx]) : normalWaves);

// A1 1-1～1-7 不計時（只有 combo 的快答加成，不會超時）
export const untimedStage = (levelIdx: number, stageIdx: number) => levelIdx === 0 && stageIdx < 7;

// 敵人行動條速度倍率（0 = 不主動攻擊）：1-1～1-10 關閉，1-11～1-14 50%、1-15～1-19 70%、1-20 80%，第 2 張從 80% 慢慢回到 100%
export function gaugeScale(levelIdx: number, stageIdx: number): number {
  if (levelIdx !== 0 || stageIdx >= MAP_SIZE * 2) return 1;
  if (stageIdx < 10) return 0;
  if (stageIdx < 14) return 0.5;
  if (stageIdx < 19) return 0.7;
  if (stageIdx < MAP_SIZE) return 0.8;
  return 0.8 + 0.2 * ((stageIdx - MAP_SIZE) / (MAP_SIZE - 1));
}

// 這一關可以出哪些題型：1-1～1-10 只有選擇題（看字選意思、聽力），1-11 開始拼寫與填空，1-13 開始口說
export function allowedTypes(levelIdx: number, stageIdx: number): string[] | null {
  if (levelIdx !== 0) return null;
  if (stageIdx < 10) return ['choice'];
  if (stageIdx < 12) return ['choice', 'spell', 'fill'];
  return null;
}
