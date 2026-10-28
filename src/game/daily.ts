// 每日任務：每天從任務池抽 3 項，完成後領取金幣與召喚券。
// 也記錄連續登入天數（之後的個人排行榜會用到）。

export type DailyEvent = 'correct' | 'review' | 'boss' | 'star' | 'trial' | 'summon' | 'combo' | 'login' | 'levelup';

export interface DailyDef {
  id: string;
  event: DailyEvent;
  goal: number;
  label: string;
  reward: { gold: number; tickets: number };
}

export const DAILY_POOL: DailyDef[] = [
  { id: 'correct20', event: 'correct', goal: 20, label: '答對 20 題', reward: { gold: 80, tickets: 1 } },
  { id: 'correct50', event: 'correct', goal: 50, label: '答對 50 題', reward: { gold: 150, tickets: 1 } },
  { id: 'review3', event: 'review', goal: 3, label: '複習 3 個錯題（在魔王題或復仇魔王答對）', reward: { gold: 100, tickets: 1 } },
  { id: 'boss1', event: 'boss', goal: 1, label: '打倒 1 隻地圖頭目', reward: { gold: 100, tickets: 1 } },
  { id: 'star1', event: 'star', goal: 1, label: '拿到 1 顆新星星', reward: { gold: 80, tickets: 1 } },
  { id: 'trial1', event: 'trial', goal: 1, label: '完成 1 項英雄真名考驗', reward: { gold: 60, tickets: 1 } },
  { id: 'summon1', event: 'summon', goal: 1, label: '召喚 1 次英雄', reward: { gold: 50, tickets: 0 } },
  { id: 'combo10', event: 'combo', goal: 10, label: '打出 10 combo', reward: { gold: 100, tickets: 1 } },
];

export const DAILY_COUNT = 3;

export interface DailyTask {
  id: string;
  progress: number;
  claimed: boolean;
}

export interface DailyState {
  date: string;      // 本地日期 YYYY-MM-DD
  tasks: DailyTask[];
  streak: number;    // 連續登入天數
  milestones?: number[]; // 這一輪連續登入已領過的里程碑（天數）；中斷後重新累積
}

// 連續登入里程碑：中斷後重新計算，可以再領一次
export const STREAK_MILESTONES: { days: number; gold: number; tickets: number }[] = [
  { days: 3, gold: 100, tickets: 1 },
  { days: 7, gold: 200, tickets: 3 },
  { days: 14, gold: 300, tickets: 5 },
  { days: 30, gold: 1000, tickets: 10 },
];

export const streakMilestone = (days: number) => STREAK_MILESTONES.find(m => m.days === days);

// 可以領取的里程碑（達到天數、這一輪還沒領）
export const claimableMilestones = (state: DailyState | null | undefined) =>
  STREAK_MILESTONES.filter(m => state && state.streak >= m.days && !(state.milestones ?? []).includes(m.days));

// 下一個還沒達到的里程碑
export const nextMilestone = (streak: number) => STREAK_MILESTONES.find(m => m.days > streak);

export const dailyDef = (id: string) => DAILY_POOL.find(d => d.id === id);

export function localDate(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// 依日期決定當天的任務（同一天重新整理也一樣）
export function pickDaily(date: string): DailyTask[] {
  let h = 0;
  for (const ch of date) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const pool = [...DAILY_POOL];
  const picked: DailyTask[] = [];
  // 同一種事件只抽一次，避免同時出現「答對 20 題」和「答對 50 題」
  while (picked.length < DAILY_COUNT && pool.length) {
    h = (h * 1103515245 + 12345) >>> 0;
    const def = pool.splice(h % pool.length, 1)[0];
    if (picked.some(t => dailyDef(t.id)!.event === def.event)) continue;
    picked.push({ id: def.id, progress: 0, claimed: false });
  }
  return picked;
}

const dayBefore = (date: string) => {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() - 1);
  return localDate(d);
};

// 換日：重新抽任務；昨天有登入就延續連續天數
export function refreshDaily(prev: DailyState | undefined, today: string): DailyState {
  if (prev && prev.date === today) return prev;
  const continued = !!prev && prev.date === dayBefore(today);
  return { date: today, tasks: pickDaily(today), streak: continued ? prev.streak + 1 : 1, milestones: continued ? prev.milestones ?? [] : [] };
}

// ---------- 每週任務：每週一換新，目標比較大、獎勵比較多 ----------
// 每週固定 13 項，其中「答對」「升級」「打倒頭目」分成好幾階，越後面的階段獎勵越好
export const WEEKLY_POOL: DailyDef[] = [
  { id: 'w_days5', event: 'login', goal: 5, label: '本週有 5 天上線練習', reward: { gold: 500, tickets: 5 } },
  { id: 'w_correct100', event: 'correct', goal: 100, label: '本週答對 100 題', reward: { gold: 250, tickets: 2 } },
  { id: 'w_correct200', event: 'correct', goal: 200, label: '本週答對 200 題', reward: { gold: 400, tickets: 3 } },
  { id: 'w_correct300', event: 'correct', goal: 300, label: '本週答對 300 題', reward: { gold: 600, tickets: 5 } },
  { id: 'w_level5', event: 'levelup', goal: 5, label: '本週升級 5 次（主角升級或訓練英雄都算）', reward: { gold: 250, tickets: 2 } },
  { id: 'w_level10', event: 'levelup', goal: 10, label: '本週升級 10 次', reward: { gold: 400, tickets: 3 } },
  { id: 'w_level15', event: 'levelup', goal: 15, label: '本週升級 15 次', reward: { gold: 600, tickets: 5 } },
  { id: 'w_boss3', event: 'boss', goal: 3, label: '本週打倒 3 隻地圖頭目', reward: { gold: 250, tickets: 2 } },
  { id: 'w_boss8', event: 'boss', goal: 8, label: '本週打倒 8 隻地圖頭目', reward: { gold: 500, tickets: 4 } },
  { id: 'w_review15', event: 'review', goal: 15, label: '本週複習 15 個錯題', reward: { gold: 300, tickets: 3 } },
  { id: 'w_star6', event: 'star', goal: 6, label: '本週拿到 6 顆新星星', reward: { gold: 300, tickets: 3 } },
  { id: 'w_combo25', event: 'combo', goal: 25, label: '本週打出 25 combo', reward: { gold: 300, tickets: 3 } },
  { id: 'w_trial3', event: 'trial', goal: 3, label: '本週完成 3 項真名考驗', reward: { gold: 300, tickets: 2 } },
];
export const WEEKLY_COUNT = WEEKLY_POOL.length;

export interface WeeklyState {
  week: string;      // 這一週星期一的日期 YYYY-MM-DD
  tasks: DailyTask[];
}

export const weeklyDef = (id: string) => WEEKLY_POOL.find(d => d.id === id);
// 每日或每週任務的定義
export const taskDef = (id: string) => dailyDef(id) ?? weeklyDef(id);

// 這一週的星期一
export function weekStart(date: string): string {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return localDate(d);
}

// 每週任務是固定的一整組（不再抽籤）
export const pickWeekly = (): DailyTask[] => WEEKLY_POOL.map(d => ({ id: d.id, progress: 0, claimed: false }));

// 換週時重新開始；同一週但任務清單改版了（舊存檔只有 3 項），補上新任務並保留同名任務的進度
export function refreshWeekly(prev: WeeklyState | null | undefined, today: string): WeeklyState {
  const week = weekStart(today);
  if (prev && prev.week === week) {
    if (WEEKLY_POOL.every(d => prev.tasks.some(t => t.id === d.id))) return prev;
    return { week, tasks: pickWeekly().map(t => prev.tasks.find(p => p.id === t.id) ?? t) };
  }
  return { week, tasks: pickWeekly() };
}

export const claimable = (tasks: DailyTask[] | undefined) =>
  (tasks ?? []).some(t => !t.claimed && t.progress >= (taskDef(t.id)?.goal ?? Infinity));

// combo 類任務記錄最大值，其他累加（每日、每週共用）
export function applyDailyEvent<T extends { tasks: DailyTask[] }>(state: T, event: DailyEvent, amount: number): T {
  return {
    ...state,
    tasks: state.tasks.map(t => {
      const def = taskDef(t.id);
      if (!def || def.event !== event || t.claimed) return t;
      const progress = event === 'combo' ? Math.max(t.progress, amount) : t.progress + amount;
      return { ...t, progress: Math.min(def.goal, progress) };
    }),
  };
}
