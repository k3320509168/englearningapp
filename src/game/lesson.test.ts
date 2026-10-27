import { describe, expect, it } from 'vitest';
import { buildLesson, segmentRange, summarize } from './lesson';
import { generateStages, LEVELS } from './QuestionData';
import type { Question } from './types';

describe('segmentRange', () => {
  it('groups stages by 10', () => {
    expect(segmentRange(0, 50)).toEqual([0, 10]);
    expect(segmentRange(19, 50)).toEqual([10, 20]);
    expect(segmentRange(45, 50)).toEqual([40, 50]);
  });
});

describe('buildLesson', () => {
  it('collects unique words and grammar for the segment', () => {
    const stages = generateStages(LEVELS[2]);
    const lesson = buildLesson(stages, 0);
    expect(lesson.words.length + lesson.grammar.length).toBeGreaterThan(0);
    const keys = lesson.words.map(w => w.key);
    expect(new Set(keys).size).toBe(keys.length);
    lesson.words.forEach(w => expect(w.meaning).toBeTruthy());
    lesson.grammar.forEach(g => expect(g.explain).toBeTruthy());
  });
});

describe('summarize', () => {
  const a: Question = { type: 'spell', desc: '請拼出：書本', ans: 'BOOK' };
  const b: Question = { type: 'spell', desc: '請拼出：蘋果', ans: 'APPLE' };
  it('computes accuracy and separates first-try words from mistakes', () => {
    const s = summarize([
      { stageIdx: 0, question: a, correct: true },
      { stageIdx: 1, question: b, correct: false },
      { stageIdx: 1, question: b, correct: true },
      { stageIdx: 20, question: a, correct: false }, // 不在範圍內
    ], 0, 9);
    expect(s.total).toBe(3);
    expect(s.accuracy).toBe(67);
    expect(s.mastered.map(q => q.ans)).toEqual(['BOOK']);
    expect(s.mistakes.map(q => q.ans)).toEqual(['APPLE']);
  });
});
