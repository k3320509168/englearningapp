import { HEROES, heroDef, heroWord } from './heroes';
import type { HeroId } from './heroes';
import { HERO_LORE } from './heroLore';
import { shuffleArray } from './battle';

// 真名機制：英雄的名字一開始是空白的刻痕，完成五項考驗把字母一格格填滿。
// 五項全部完成 → 「真名英雄」，基礎能力 +50%。每完成一項送該英雄碎片。

export const TRIALS = [
  { id: 'spell', name: '拼寫與意義', icon: '✏️' },
  { id: 'usage', name: '用法', icon: '📝' },
  { id: 'form', name: '詞性變化', icon: '🔀' },
  { id: 'voice', name: '發音', icon: '🎤' },
  { id: 'lore', name: '典故與俗語', icon: '📜' },
] as const;
export const TRIAL_COUNT = TRIALS.length;

export const TRUE_NAME_BONUS = 0.5;
export const TRIAL_SHARDS = 3;
export const TIER_UP_TRIALS = 3; // 升品階至少要完成幾項考驗

export interface TrialQuestion {
  kind: 'type' | 'choice' | 'voice';
  prompt: string;
  sub?: string;      // 補充說明（例如例句的中文）
  answer: string;
  options?: string[];
  speak?: string;    // 可以播放的發音
}

export const trialsDone = (progress: boolean[] | undefined) => (progress ?? []).filter(Boolean).length;
export const isTrueName = (progress: boolean[] | undefined) => trialsDone(progress) >= TRIAL_COUNT;

// 名字顯示：完成幾項就露出相對比例的字母，其餘是空白刻痕
export function revealedName(id: HeroId, progress: boolean[] | undefined): string[] {
  const word = heroWord(heroDef(id));
  const shown = Math.ceil((word.length * trialsDone(progress)) / TRIAL_COUNT);
  return [...word].map((ch, i) => (i < shown ? ch : ''));
}

export function trialQuestion(id: HeroId, trialIdx: number, rand: () => number = Math.random): TrialQuestion {
  const h = heroDef(id);
  const word = heroWord(h);
  const lore = HERO_LORE[id];
  switch (TRIALS[trialIdx].id) {
    case 'spell':
      return { kind: 'type', prompt: `請拼出這個字：${h.meaning}`, answer: word, speak: id };
    case 'usage':
      return { kind: 'type', prompt: lore.usage.en, sub: lore.usage.zh, answer: word, speak: lore.usage.en.replace('___', id) };
    case 'form':
      return { kind: 'choice', prompt: lore.form.q, answer: lore.form.answer, options: shuffleArray([lore.form.answer, ...lore.form.wrong], rand) };
    case 'voice':
      return { kind: 'voice', prompt: `請唸出：${id}`, sub: h.meaning, answer: word, speak: id };
    default: {
      // 錯誤選項取自其他英雄同類型（俗語／字源）的答案
      const others = shuffleArray(
        HEROES.filter(o => o.id !== id && HERO_LORE[o.id]?.lore.type === lore.lore.type).map(o => HERO_LORE[o.id].lore.answer),
        rand,
      ).slice(0, 3);
      return { kind: 'choice', prompt: lore.lore.q, answer: lore.lore.answer, options: shuffleArray([lore.lore.answer, ...others], rand) };
    }
  }
}

// 打字作答：不分大小寫、忽略前後空白
export const checkTyped = (answer: string, input: string) => input.trim().toUpperCase() === answer.trim().toUpperCase();
