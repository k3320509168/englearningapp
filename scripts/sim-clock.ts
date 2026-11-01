// 對齊useBattleClock的50ms步進；一次tick數秒會丟失敵人行動條溢出及多次出手。
export function advanceAnswerTime(get: () => { phase: string; questionSeq: number; tick: (ms: number) => void }, ms: number) {
  const seq = get().questionSeq;
  for (let left = ms; left > 0 && get().phase === 'answering' && get().questionSeq === seq;) {
    const step = Math.min(50, left);
    get().tick(step);
    left -= step;
  }
}
