import type { Question } from './types';
import type { Element } from './character';
import { QUESTION_POOL, LEVELS } from './QuestionData';
import { VOCAB, vocabFor } from './vocab';
import { CHOICE_LETTERS, shuffleArray } from './battle';

// 擴充魔王：聽、說、讀、寫四位魔王，各自只用一種能力的題目。
// 題目從玩家已經到達的區域題庫轉換而來，所以難度跟著進度成長。

export type SkillBossId = 'writing' | 'listening' | 'reading' | 'speaking';

export interface SkillBossDef {
  id: SkillBossId;
  name: string;
  skill: string;
  icon: string;
  element: Element;
  desc: string;
  title: string;      // 第一次擊敗獲得的稱號
}

export const SKILL_BOSSES: SkillBossDef[] = [
  { id: 'writing', name: '咒文魔王', skill: '寫作', icon: '✍️', element: 'water', desc: '只出拼寫與填空：看中文寫出英文。', title: '咒文大師' },
  { id: 'listening', name: '魔音魔王', skill: '聽力', icon: '🎧', element: 'dark', desc: '題目只有聲音：聽發音選出正確的意思。', title: '千里順風耳' },
  { id: 'reading', name: '魔眼魔王', skill: '閱讀', icon: '📖', element: 'wood', desc: '只出句子選擇題：讀懂句子選出正確答案。', title: '博覽群書者' },
  { id: 'speaking', name: '鬼嘴魔王', skill: '口說', icon: '🗣️', element: 'fire', desc: '只出口說題：對著麥克風唸出英文。', title: '雄辯之聲' },
];

export const skillBossDef = (id: string) => SKILL_BOSSES.find(b => b.id === id);
export const SKILL_BOSS_FIRST_TICKETS = 5;
export const SKILL_BOSS_HITS = 15; // 沒有 combo 時約需答對幾題

// 玩家到達過的區域的所有題目；至少包含前兩個區域，避免題目太少一直重複
export function reachablePool(unlockedIndex: number): Question[] {
  return LEVELS.slice(0, Math.min(LEVELS.length, Math.max(2, unlockedIndex + 1)))
    .flatMap(l => [...(QUESTION_POOL[l]?.normal ?? []), ...(QUESTION_POOL[l]?.boss ?? [])]);
}

// 題目裡的單字（拼寫、填空、口說題）與它的中文意思
function wordsOf(pool: Question[]): { word: string; meaning: string }[] {
  const seen = new Map<string, string>();
  for (const q of pool) {
    const v = vocabFor(q);
    if (v && !v.display.includes(' ')) seen.set(v.display, v.meaning);
  }
  return [...seen].map(([word, meaning]) => ({ word, meaning }));
}

export function skillBossQuestions(id: SkillBossId, pool: Question[], rand: () => number = Math.random): Question[] {
  const words = wordsOf(pool);
  switch (id) {
    case 'writing':
      return words.map(w => ({ type: 'spell', desc: `請拼出：${w.meaning}`, ans: w.word.toUpperCase(), speak: w.word }));
    case 'speaking':
      return words.map(w => ({ type: 'voice', desc: `請唸出單字：${w.meaning}`, ans: w.word.toUpperCase(), speak: w.word }));
    case 'reading':
      return pool.filter(q => q.type === 'choice');
    case 'listening': {
      // 聽發音選意思：錯誤選項取自其他單字的中文
      const meanings = [...new Set(Object.values(VOCAB).map(v => v.meaning))];
      return words.map(w => {
        const wrong = shuffleArray(meanings.filter(m => m !== w.meaning), rand).slice(0, 3);
        const options = shuffleArray([w.meaning, ...wrong], rand);
        return {
          type: 'choice' as const,
          desc: '🎧 聽發音，選出正確的意思（可以按 🔊 再聽一次）',
          options: options.map((o, i) => `${CHOICE_LETTERS[i]}. ${o}`),
          ans: CHOICE_LETTERS[options.indexOf(w.meaning)],
          speak: w.word,
          explain: `${w.word}：${w.meaning}`,
        };
      });
    }
  }
}
