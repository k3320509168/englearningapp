// v2.0：處決只是高Combo致命一擊的視覺成就，不改傷害、HP或通關條件。
export type ExecuteKind = 'elite' | 'mini' | 'big' | 'region' | 'silentKing';

export const EXECUTE_RULES: Record<ExecuteKind, { combo: number }> = {
  elite: { combo: 300 }, mini: { combo: 1000 }, big: { combo: 3000 },
  region: { combo: 100 }, silentKing: { combo: 300 },
};
// 自選追擊：每題 +4 金幣，一場最多 60，不重發通關獎勵。
export const BONUS_GOLD = 4;
export const BONUS_GOLD_CAP = 60;
export interface ExecuteInput { combo: number; lethal: boolean }
export function canExecute(kind: ExecuteKind, b: ExecuteInput): boolean {
  return b.lethal && b.combo >= EXECUTE_RULES[kind].combo;
}

// 這一關的處決種類：菁英、小 BOSS（第 15 關）、大 BOSS（第 20 關）、區域魔王、沉默君王；其他（普通關、寶箱、復仇魔王）沒有
export function executeKindOf(opts: { bossMode: boolean; kind?: string; revenge?: boolean; final: boolean; inMap: number; lastRegion: boolean }): ExecuteKind | null {
  if (opts.revenge || opts.kind === 'treasure') return null;
  if (opts.kind === 'elite') return 'elite';
  if (!opts.bossMode) return null;
  if (opts.final) return opts.lastRegion ? 'silentKing' : 'region';
  return opts.inMap === 20 ? 'big' : 'mini';
}
