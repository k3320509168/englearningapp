// 一題共用一個時間帳：事件只能操作建立時的帳，不會延用到下一題。
export class AnswerTiming {
  private plays = 0;
  private audio = 0;
  private waiting = false;
  private waitBudget = 15_000;
  startAudio(estimatedDurationMs: number): () => void {
    const free = this.plays++ < 2;
    const token = ++this.token;
    // Web Speech 沒有預先可讀的音檔時長，以文字/語速估算作故障上限；正常 onend 立即解除。
    this.audio = free ? Math.min(60_000, 1.3 * estimatedDurationMs + 2000) : 0;
    return () => { if (token === this.token) this.audio = 0; };
  }
  private token = 0;
  setWaiting(waiting: boolean) { this.waiting = waiting; }
  advance(ms: number): number {
    const audioPause = Math.min(ms, this.audio);
    this.audio = Math.max(0, this.audio - ms);
    const waitPause = this.waiting ? Math.min(ms, this.waitBudget) : 0;
    this.waitBudget -= waitPause;
    return Math.max(audioPause, waitPause);
  }
}
let scope: object | null = null;
let sequence = -1;
let current = new AnswerTiming();
export function answerTiming(question: object | null, seq: number): AnswerTiming {
  if (question !== scope || seq !== sequence) {
    scope = question; sequence = seq; current = new AnswerTiming();
  }
  return current;
}
