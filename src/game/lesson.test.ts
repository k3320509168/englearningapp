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

  it('builds listening, speaking, and spelling cards correctly', () => {
    const mockStages = [
      {
        name: '測試關卡',
        bossMode: false,
        questions: [
          {
            type: 'choice',
            skill: 'listening' as const,
            desc: '🎧 聽一聽，選出正確的意思',
            speak: 'resolve',
            ans: 'B',
            options: ['A. 保留', 'B. 解決', 'C. 旋轉'],
            explain: '聽力原字為 resolve (v.) 解決。',
          },
          {
            type: 'voice',
            skill: 'speaking' as const,
            desc: '請唸出：I love learning English',
            speak: 'I love learning English',
            ans: 'I love learning English',
            explain: '口說練習請大聲清楚朗讀。',
          },
          {
            type: 'spelling',
            skill: 'writing' as const,
            desc: '請拼出：SWORD',
            ans: 'SWORD',
            speak: 'sword',
            explain: '拼寫單字 sword 劍。',
          },
        ],
      },
    ];

    const lesson = buildLesson(mockStages, 0);
    const tags = lesson.grammar.map(g => g.tag);
    expect(tags).toContain('聽力');
    expect(tags).toContain('口說');
    expect(tags).toContain('拼寫');

    const listenCard = lesson.grammar.find(g => g.tag === '聽力');
    expect(listenCard?.sentence).toBe('resolve');
    expect(listenCard?.audio).toBe('resolve');
    expect(listenCard?.explain).toContain('resolve');
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
