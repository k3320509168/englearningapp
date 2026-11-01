// 首領第2/3/4/6戰逐階援助；一般關沿用原本的連敗援助。
export function retryAid(fails: number, boss: boolean) {
  return {
    energy: boss && fails >= 1,
    guard: boss && fails >= 1,
    revive: fails >= (boss ? 2 : 3),
    reviveRatio: boss ? 0.4 : 0.3,
    damage: boss ? fails >= 5 ? .75 : fails >= 3 ? .85 : 1 : fails >= 5 ? .85 : 1,
    timeMs: boss && fails >= 3 ? 2000 : 0,
    sealTotal: boss && fails >= 2 ? 8 : 10,
  };
}
