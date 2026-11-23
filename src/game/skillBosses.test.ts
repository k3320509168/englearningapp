import { beforeAll, describe, expect, it } from 'vitest';
import { loadBank } from './questions/bank/loader';
import { isBankLoaded, LEVELS, questionSkill } from './QuestionData';
import { prepareSkillBossPool, skillBossCounts, skillBossQuestions } from './skillBosses';

describe('四大魔王正式題庫', () => {
  beforeAll(async () => {
    for (const index of LEVELS.keys()) await loadBank(index);
  });

  it.each(LEVELS.map((level, index) => ({ level, index })))('$level 的入口題數、出題種類與唯一中文提示一致', ({ index }) => {
    expect(isBankLoaded(index)).toBe(true);
    const pool = prepareSkillBossPool(index);
    const counts = skillBossCounts(pool);
    const writing = skillBossQuestions('writing', pool);
    const speaking = skillBossQuestions('speaking', pool);
    const listening = skillBossQuestions('listening', pool);
    const reading = skillBossQuestions('reading', pool);

    expect(Math.min(...Object.values(counts))).toBeGreaterThanOrEqual(4);
    expect(writing).toHaveLength(counts.writing);
    expect(speaking).toHaveLength(counts.speaking);
    expect(listening).toHaveLength(counts.listening);
    expect(reading).toHaveLength(counts.reading);
    for (const questions of [writing, speaking]) {
      const clues = questions.map(q => q.desc.normalize('NFKC').trim().replace(/\s+/g, ' '));
      expect(new Set(clues).size).toBe(questions.length);
      expect(new Set(questions.map(q => q.ans)).size).toBe(questions.length);
      expect(questions.some(q => q.desc.endsWith('：學生') || q.desc.endsWith('：吃'))).toBe(false);
    }
    expect(reading.every(q => q.type === 'choice' && questionSkill(q) === 'reading')).toBe(true);
    expect(listening.every(q => q.type === 'choice' && q.speak && new Set(q.options).size === 4)).toBe(true);
    expect(listening.some(q => q.speak?.toUpperCase() === 'STUDENT')).toBe(true);
  });
});
