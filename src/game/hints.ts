// 戰鬥中的情境提示：取代開場一長串說明頁，遇到才教、每則只出現一次。
// 已經玩過的舊存檔視為全部看過（見 saveStore 的 migrate）。

export type HintId = 'choice' | 'typing' | 'voice' | 'combo' | 'timer' | 'boss' | 'skill';

export const HINTS: Record<HintId, { icon: string; text: string }> = {
  choice: { icon: '👆', text: '點選正確答案（或按鍵盤 A～D），隊員就會衝上去攻擊！' },
  typing: { icon: '⌨️', text: '用鍵盤或下方按鍵拼出單字，拼完自動出手；按空白鍵可以再聽一次發音。' },
  voice: { icon: '🎤', text: '口說題：按麥克風按鈕，對著麥克風唸出單字就能攻擊。' },
  combo: { icon: '🔥', text: '連續答對會累積 Combo，傷害越來越高，特效也會越來越華麗！' },
  timer: { icon: '⏱️', text: 'Combo 計時條：每題 20 秒內答對才能延續 Combo，5 秒內答對傷害還有加成。' },
  boss: { icon: '😈', text: '魔王題！答對傷害倍率大增。以前答錯的字也會在這裡出現，讓你複習。' },
  skill: { icon: '✨', text: '隊員的能量滿了！按下方的技能按鈕（電腦可按數字鍵 1～4）就能施放，施放前有 5 秒可以確認。' },
};

export const ALL_HINTS = Object.keys(HINTS) as HintId[];

export interface HintContext {
  questionType: string;
  combo: number;
  isBossQuestion: boolean;
  skillReady: boolean;
}

// 依目前戰況挑一則還沒看過的提示；優先教「怎麼答題」
export function pickHint(ctx: HintContext, seen: string[]): HintId | null {
  const order: [HintId, boolean][] = [
    ['choice', ctx.questionType === 'choice'],
    ['typing', ctx.questionType === 'spell' || ctx.questionType === 'fill'],
    ['voice', ctx.questionType === 'voice'],
    ['boss', ctx.isBossQuestion],
    ['combo', ctx.combo >= 2],
    ['timer', ctx.combo >= 3],
    ['skill', ctx.skillReady],
  ];
  return order.find(([id, ok]) => ok && !seen.includes(id))?.[0] ?? null;
}
