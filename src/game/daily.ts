// 每日任務：每天從任務池抽 3 項，完成後領取金幣與召喚券。
// 也記錄連續登入天數（之後的個人排行榜會用到）。

export type DailyEvent = 'correct' | 'review' | 'boss' | 'star' | 'trial' | 'summon' | 'combo';

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
}

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
  const streak = prev && prev.date === dayBefore(today) ? prev.streak + 1 : 1;
  return { date: today, tasks: pickDaily(today), streak };
}

// combo 類任務記錄最大值，其他累加
export function applyDailyEvent(state: DailyState, event: DailyEvent, amount: number): DailyState {
  return {
    ...state,
    tasks: state.tasks.map(t => {
      const def = dailyDef(t.id);
      if (!def || def.event !== event || t.claimed) return t;
      const progress = event === 'combo' ? Math.max(t.progress, amount) : t.progress + amount;
      return { ...t, progress: Math.min(def.goal, progress) };
    }),
  };
}
