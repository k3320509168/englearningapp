// 關卡配置的常數（沒有其他依賴，題庫、區域、數值都可以引用，避免循環引用）
export const MAP_SIZE = 20;
// 各區的三星關卡數：A1、A2 各 5 張，往後逐步增加，C2 9 張
export const REGION_CHAPTERS = [5, 5, 6, 6, 7, 7, 8, 8, 9];
export const chapterCount = (levelIdx: number) => REGION_CHAPTERS[Math.min(Math.max(0, levelIdx), REGION_CHAPTERS.length - 1)];
// 區域總關卡數：三星關卡 × 20 ＋ 區域最終魔王 1 關
export const regionStageCount = (levelIdx: number) => chapterCount(levelIdx) * MAP_SIZE + 1;
// 小關在三星關卡裡的位置（1～20）
export const stageInMap = (stageIdx: number) => (stageIdx % MAP_SIZE) + 1;


// ---------- 每種小關的練習參考題數（v2.0） ----------
// 不限制擊殺或補怪；菁英／首領提早倒下時，剩餘數量提供自選追擊練習。
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

// ---------- 前置區域「失語邊境」（Pre-A1，1 張 × 10 小關，docs/STORY.md v1.6） ----------
// 新手教學都在這裡：題數從 3 題慢慢加，前幾關不計時、敵人不主動攻擊，題型由選擇、聽力慢慢加到拼寫、口說。
// A1 從第一關就是正式規則。戰鬥數值沿用 A1（levelIdx 0），用關卡代號 PROLOGUE_KEY 區分。
export const PROLOGUE_KEY = 'PRE';
export const PROLOGUE_MIN = [3, 4, 5, 5, 5, 5, 6, 5, 6, 9];
export const PROLOGUE_STAGES = PROLOGUE_MIN.length;
export const PROLOGUE_ELITE = 4;  // P-5 第一次菁英（打倒後免費召喚）
export const isPrologue = (levelKey?: string) => levelKey === PROLOGUE_KEY;
// 前置區域的敵人傷害倍率：還沒召喚夥伴前（P-1～P-6）只有 50%，之後 70%，追獵隊長 80%（模擬：75% 正確率單人不會一直倒）
const PROLOGUE_GUARD = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.7, 0.7, 0.7, 0.8];
export const prologueGuard = (levelKey: string | undefined, stageIdx: number) =>
  (isPrologue(levelKey) ? PROLOGUE_GUARD[Math.min(stageIdx, PROLOGUE_STAGES - 1)] : 1);
// 經驗校準：90% 正確率打完 10 關約從 Lv1 升到 Lv5（需要 500 經驗；原始經驗約 430）
export const PROLOGUE_XP = 1.2;

export function minAnswers(levelIdx: number, stageIdx: number, levelKey?: string): number {
  if (isPrologue(levelKey)) return PROLOGUE_MIN[Math.min(stageIdx, PROLOGUE_STAGES - 1)];
  const row = MIN_ANSWERS[Math.min(Math.max(0, levelIdx), MIN_ANSWERS.length - 1)];
  return row[ROLE_INDEX[stageRole(levelIdx, stageIdx)]];
}

// 一般關一開始放幾隻怪（前置區域少一點，不因題數不足補怪）
export const startWaves = (_levelIdx: number, stageIdx: number, normalWaves: number, levelKey?: string) =>
  (isPrologue(levelKey) ? Math.min(normalWaves, PROLOGUE_MIN[stageIdx] ?? normalWaves) : normalWaves);

// 前置區域 P-1～P-9 不計時（只有 combo 的快答加成，不會超時）；最終 BOSS 才正常計時
export const untimedStage = (_levelIdx: number, stageIdx: number, levelKey?: string) =>
  isPrologue(levelKey) && stageIdx < PROLOGUE_STAGES - 1;

// 敵人行動條速度倍率（0 = 不主動攻擊）：前置區域 P-1～P-6 關閉、P-7、P-8 30%、P-9 60%、最終 BOSS 70%；正式區域 100%
const PROLOGUE_GAUGE = [0, 0, 0, 0, 0, 0, 0.3, 0.3, 0.6, 0.7];
export function gaugeScale(_levelIdx: number, stageIdx: number, levelKey?: string): number {
  return isPrologue(levelKey) ? PROLOGUE_GAUGE[Math.min(stageIdx, PROLOGUE_STAGES - 1)] : 1;
}

// 這一關可以出哪些題型：前置區域 P-1～P-5 只有選擇題（看圖選字、聽力），P-6 開始拼寫與填空，P-8 開始口說
export function allowedTypes(_levelIdx: number, stageIdx: number, levelKey?: string): string[] | null {
  if (!isPrologue(levelKey)) return null;
  if (stageIdx < 5) return ['choice'];
  if (stageIdx < 7) return ['choice', 'spell', 'fill'];
  return null;
}
