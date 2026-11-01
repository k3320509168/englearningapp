// 一題共用一個時間帳：事件只能操作建立時的帳，不會延用到下一題。
export class AnswerTiming {
  private plays = 0;
  private audio = 0;
  private activeAudio = 0;
  private waiting = false;
  private waitBudget = 15_000;
  startAudio(estimatedDurationMs: number): () => void {
    const free = this.plays++ < 2;
    const token = ++this.token;
    // Web Speech 沒有預先可讀的音檔時長，以文字/語速估算作故障上限；正常 onend 立即解除。
    this.activeAudio = Math.min(60_000, 1.3 * estimatedDurationMs + 2000);
    this.audio = free ? this.activeAudio : 0;
    return () => { if (token === this.token) { this.audio = 0; this.activeAudio = 0; } };
  }
  private token = 0;
  setWaiting(waiting: boolean) { this.waiting = waiting; }
  advance(ms: number): number { return this.step(ms).systemPauseMs; }
  step(ms: number): { systemPauseMs: number; activePauseMs: number } {
    const audioPause = Math.min(ms, this.audio);
    this.audio = Math.max(0, this.audio - ms);
    const activeAudioPause = Math.min(ms, this.activeAudio);
    this.activeAudio = Math.max(0, this.activeAudio - ms);
    const waitPause = this.waiting ? Math.min(ms, this.waitBudget) : 0;
    this.waitBudget -= waitPause;
    return { systemPauseMs: Math.max(audioPause, waitPause), activePauseMs: Math.max(activeAudioPause, waitPause) };
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
