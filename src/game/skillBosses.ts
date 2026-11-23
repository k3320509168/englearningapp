import type { Question } from './types';
import type { Element } from './character';
import { QUESTION_POOL, LEVELS, questionSkill } from './QuestionData';
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
  { id: 'writing', name: '咒文魔王', skill: '寫作', icon: '✍️', element: 'water', desc: '只出單字拼寫：看中文提示寫出英文。', title: '咒文大師' },
  { id: 'listening', name: '魔音魔王', skill: '聽力', icon: '🎧', element: 'dark', desc: '題目只有聲音：聽發音選出正確的意思。', title: '千里順風耳' },
  { id: 'reading', name: '魔眼魔王', skill: '閱讀', icon: '📖', element: 'wood', desc: '只出句子選擇題：讀懂句子選出正確答案。', title: '博覽群書者' },
  { id: 'speaking', name: '鬼嘴魔王', skill: '口說', icon: '🗣️', element: 'fire', desc: '只出口說題：對著麥克風唸出英文。', title: '雄辯之聲' },
];

export const skillBossDef = (id: string) => SKILL_BOSSES.find(b => b.id === id);
export const SKILL_BOSS_FIRST_TICKETS = 5;
export const SKILL_BOSS_HITS = 15; // 沒有 combo 時約需答對幾題

// 玩家到達過的區域的所有題目；至少包含前兩個區域，避免題目太少一直重複
export const skillBossRegionCount = (unlockedIndex: number) => Math.min(LEVELS.length, Math.max(2, unlockedIndex + 1));
export const SKILL_BOSS_MIN_QUESTIONS = 4;

function reachablePool(unlockedIndex: number): Question[] {
  return LEVELS.slice(0, skillBossRegionCount(unlockedIndex))
    .flatMap(l => [...(QUESTION_POOL[l]?.normal ?? []), ...(QUESTION_POOL[l]?.boss ?? [])]);
}

// 題目裡的單字（拼寫、填空、口說題）與它的中文意思
function wordsOf(pool: Question[]): { word: string; meaning: string }[] {
  const seen = new Map<string, { word: string; meaning: string }>();
  for (const q of pool) {
    const v = vocabFor(q);
    if (v && /^[a-zA-Z]+$/.test(v.display.trim()) && v.meaning.trim()) {
      const word = v.display.trim();
      seen.set(word.toUpperCase(), { word, meaning: v.meaning });
    }
  }
  return [...seen.values()];
}

// 口說和拼寫只顯示中文。可達題庫有同提示的不同英文字時，這兩種模式不抽該提示。
const clueKey = (text: string) => text.normalize('NFKC').trim().replace(/\s+/g, ' ');
function unambiguousWords(words: ReturnType<typeof wordsOf>) {
  const counts = new Map<string, number>();
  for (const word of words) {
    const clue = clueKey(word.meaning);
    counts.set(clue, (counts.get(clue) ?? 0) + 1);
  }
  return words.filter(word => counts.get(clueKey(word.meaning)) === 1);
}

const isReading = (q: Question) => q.type === 'choice' && questionSkill(q) === 'reading' && !q.desc.startsWith('🎧');

export function prepareSkillBossPool(unlockedIndex: number) {
  const pool = reachablePool(unlockedIndex);
  const words = wordsOf(pool);
  return { words, unambiguous: unambiguousWords(words), reading: pool.filter(isReading) };
}

export type SkillBossPool = ReturnType<typeof prepareSkillBossPool>;

export function skillBossCounts(pool: SkillBossPool): Record<SkillBossId, number> {
  return {
    writing: pool.unambiguous.length, speaking: pool.unambiguous.length,
    listening: pool.words.length, reading: pool.reading.length,
  };
}

function sampleMeanings(meanings: string[], correctIndex: number | undefined, rand: () => number): string[] {
  const used = correctIndex === undefined ? [] : [correctIndex];
  const wrong: string[] = [];
  // 抽未使用索引的名次，再略過已用位置。每次至多掃四個索引，無須洗整份詞庫。
  while (wrong.length < 3 && used.length < meanings.length) {
    let index = Math.floor(rand() * (meanings.length - used.length));
    for (const excluded of used) {
      if (index >= excluded) index++;
    }
    wrong.push(meanings[index]);
    used.push(index);
    used.sort((a, b) => a - b);
  }
  return wrong;
}

export function skillBossQuestions(id: SkillBossId, pool: SkillBossPool, rand: () => number = Math.random): Question[] {
  switch (id) {
    case 'reading':
      return pool.reading;
    case 'writing':
      return pool.unambiguous.map(w => ({ type: 'spell', desc: `請拼出：${w.meaning}`, ans: w.word.toUpperCase(), speak: w.word }));
    case 'speaking':
      return pool.unambiguous.map(w => ({ type: 'voice', desc: `請唸出單字：${w.meaning}`, ans: w.word.toUpperCase(), speak: w.word }));
    case 'listening': {
      // 聽發音選意思：錯誤選項取自其他單字的中文
      const meanings = [...new Set(Object.values(VOCAB).map(v => v.meaning))];
      const indices = new Map(meanings.map((meaning, index) => [meaning, index]));
      return pool.words.map(w => {
        const wrong = sampleMeanings(meanings, indices.get(w.meaning), rand);
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
