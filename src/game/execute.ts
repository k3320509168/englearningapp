// 首領處決（第二十一輪 B，docs/gpt/round21.md）：combo 很高、真的連續答對、答題量與正確率夠了，
// 下一擊直接打倒菁英／首領（不管剩多少血），關卡提早結算；原本還沒答完的最低題數變成可選的「繼續追擊」加成題。
// 普通關不開放（它們是主線英文練習量的主體）。困難題 Bonus 的隨機倍數不能單獨觸發：還要看真的連對與答題量。

export type ExecuteKind = 'elite' | 'mini' | 'big' | 'region' | 'silentKing';

export const EXECUTE_RULES: Record<ExecuteKind, { combo: number; ratio: number; streak: number }> = {
  elite: { combo: 300, ratio: 0.6, streak: 5 },
  mini: { combo: 1000, ratio: 0.6, streak: 7 },
  big: { combo: 3000, ratio: 0.6, streak: 8 },
  // 區域魔王是獨立戰鬥，combo 不一定從地圖延續，所以門檻低很多
  region: { combo: 100, ratio: 0.65, streak: 10 },
  silentKing: { combo: 300, ratio: 0.65, streak: 12 },
};
export const EXECUTE_ACCURACY = 0.85;
// 加成題：每題 +4 金幣，一場最多 60
export const BONUS_GOLD = 4;
export const BONUS_GOLD_CAP = 60;

export interface ExecuteInput {
  combo: number;
  streak: number;    // 真的連續答對（不受困難題 Bonus 影響）
  answered: number;  // 這一關已作答（含這一題）
  correct: number;   // 這一關答對（含這一題）
  minAnswers: number;
}

export function canExecute(kind: ExecuteKind, b: ExecuteInput): boolean {
  const r = EXECUTE_RULES[kind];
  return b.combo >= r.combo
    && b.streak >= r.streak
    && b.answered >= Math.ceil(b.minAnswers * r.ratio)
    && b.correct / Math.max(1, b.answered) >= EXECUTE_ACCURACY;
}

// 這一關的處決種類：菁英、小 BOSS（第 15 關）、大 BOSS（第 20 關）、區域魔王、沉默君王；其他（普通關、寶箱、復仇魔王）沒有
export function executeKindOf(opts: { bossMode: boolean; kind?: string; revenge?: boolean; final: boolean; inMap: number; lastRegion: boolean }): ExecuteKind | null {
  if (opts.revenge || opts.kind === 'treasure') return null;
  if (opts.kind === 'elite') return 'elite';
  if (!opts.bossMode) return null;
  if (opts.final) return opts.lastRegion ? 'silentKing' : 'region';
  return opts.inMap === 20 ? 'big' : 'mini';
}
