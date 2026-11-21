// 人工編寫的引導式任務；固定選項／組卡不代表自由說寫或 CEFR 達標。
export const CARAVAN_PREFIX = 'scenario:caravan:v1:';
export const caravanFlag = (name: string) => `${CARAVAN_PREFIX}${name}`;
export const CARAVAN_STAGES = ['read', 'listen', 'respond'] as const;
export const CARAVAN_NOTICE = 'The stone bridge carries vehicles up to 2.5 tonnes. The forest road carries vehicles up to 6 tonnes, but adds ten minutes to the journey.';
export const CARAVAN_MANIFEST = 'Our caravan currently weighs 2.2 tonnes, including the wagon and all its cargo.';
export const CARAVAN_UPDATE = 'The merchant has added another 0.6 tonnes of supplies. This cargo is already on the wagon, so our caravan now weighs 2.8 tonnes in total. Please choose a safe route for this new weight.';
export const CARAVAN_EXAMPLE = 'I suggest taking the forest road because our wagon now weighs 2.8 tonnes, which exceeds the bridge limit. We can send a message ahead to explain the delay.';
export function caravanResume(seen: readonly string[]): number {
  return CARAVAN_STAGES.findIndex(stage => !seen.includes(caravanFlag(`done:${stage}`)));
}
export function caravanReadAnswer(route: string, reason: string): boolean {
  return route === 'bridge' && reason === 'under-limit';
}
export function caravanListenAnswer(route: string, weight: string): boolean {
  return route === 'forest' && weight === '2.8';
}
export function caravanResponseAnswer(stance: string, reason: string, alternative: string): boolean {
  return stance === 'forest' && reason === 'over-limit' && ['message', 'call'].includes(alternative);
}
