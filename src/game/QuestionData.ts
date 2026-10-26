import { Question, Stage } from './types';

export const LEVELS = [
  "A1 入門 (120-224分)", "A2 初級 (225-549分)", "B1 中級 (550-784分)", 
  "B2 中高級 (785-944分)", "C1 高級 (945分以上)"
];

// 全域解鎖進度
export let globalUnlockedIndex = 0;

export function unlockNextLevel(currentLevelKey: string) {
  const currentLevelIndex = LEVELS.indexOf(currentLevelKey);
  if (currentLevelIndex === globalUnlockedIndex && globalUnlockedIndex < LEVELS.length - 1) {
    globalUnlockedIndex++;
  }
}

const QUESTION_POOL: Record<string, { normal: Question[], boss: Question[] }> = {
  "A1 入門 (120-224分)": {
    normal: [
      { type: "spell", desc: "請拼出：書本", ans: "BOOK", speak: "book" },
      { type: "spell", desc: "請拼出：蘋果", ans: "APPLE", speak: "apple" },
      { type: "choice", desc: "【基礎文法】I ___ a student.", options: ["A. am", "B. is", "C. are", "D. be"], ans: "A" }
    ],
    boss: [
      { type: "voice", desc: "請唸出單字：開始", ans: "START", speak: "start", accept: ["STAR"] }
    ]
  },
  "B1 中級 (550-784分)": {
    normal: [
      { type: "fill", desc: "填空題：B U D G _ T (預算)", ans: "E", speak: "budget" },
      { type: "choice", desc: "【多益文法】The manager has ___ it.", options: ["A. approve", "B. approves", "C. approved", "D. approving"], ans: "C" }
    ],
    boss: [
      { type: "voice", desc: "請唸出單字：專案", ans: "PROJECT", speak: "project", accept: ["PROTECT"] }
    ]
  }
};

function shuffleArray<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

export function generateStages(levelKey: string): Stage[] {
  const pool = QUESTION_POOL[levelKey] || QUESTION_POOL["A1 入門 (120-224分)"];
  const generatedStages: Stage[] = [];
  let normalDeck = shuffleArray(pool.normal);
  let bossDeck = shuffleArray(pool.boss);

  const drawCard = (deck: Question[], original: Question[]) => {
    if (deck.length === 0) deck.push(...shuffleArray(original));
    return deck.pop()!;
  };

  for (let i = 1; i <= 50; i++) {
    if (i === 50) {
      generatedStages.push({ name: `第 ${i} 關：星球最終試煉`, bossMode: true, questions: [drawCard(bossDeck, pool.boss), drawCard(bossDeck, pool.boss)] });
    } else if (i % 10 === 0) {
      generatedStages.push({ name: `第 ${i} 關：守門菁英`, bossMode: true, questions: [drawCard(bossDeck, pool.boss)] });
    } else {
      generatedStages.push({ name: `第 ${i} 關：持續推進`, bossMode: false, questions: [drawCard(normalDeck, pool.normal)] });
    }
  }
  return generatedStages;
}