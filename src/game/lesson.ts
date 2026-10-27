import type { Question, Stage, VocabEntry } from './types';
import { vocabFor } from './vocab';
import { completedSentence, questionKey } from './battle';

// 戰前預習與結算的資料整理（純函式）。
// 關卡以 10 關為一個區段（第 10、20… 關是 Boss），預習與結算都以區段為單位。

export const SEGMENT_SIZE = 10;

export function segmentRange(stageIdx: number, stageCount: number): [number, number] {
  const start = stageIdx - (stageIdx % SEGMENT_SIZE);
  return [start, Math.min(start + SEGMENT_SIZE, stageCount)];
}

export type LessonWord = VocabEntry & { key: string; display: string };

export interface LessonGrammar {
  desc: string;
  sentence: string;
  explain: string;
}

export interface Lesson {
  words: LessonWord[];
  grammar: LessonGrammar[];
}

export function buildLesson(stages: Stage[], stageIdx: number): Lesson {
  const [start, end] = segmentRange(stageIdx, stages.length);
  const questions = stages.slice(start, end).flatMap(s => s.questions);
  const words = new Map<string, LessonWord>();
  const grammar = new Map<string, LessonGrammar>();
  for (const q of questions) {
    const v = vocabFor(q);
    if (v) words.set(v.key, v);
    if (q.type === 'choice' && q.explain) {
      grammar.set(q.desc, { desc: q.desc, sentence: completedSentence(q), explain: q.explain });
    }
  }
  return { words: [...words.values()], grammar: [...grammar.values()] };
}

export interface AnswerRecord {
  stageIdx: number;
  question: Question;
  correct: boolean;
}

export interface Summary {
  total: number;
  correct: number;
  accuracy: number; // 0~100
  mastered: Question[]; // 一次就答對的題目
  mistakes: Question[]; // 這段期間答錯過的題目（不重複）
}

export function summarize(answers: AnswerRecord[], fromStage: number, toStage: number): Summary {
  const inRange = answers.filter(a => a.stageIdx >= fromStage && a.stageIdx <= toStage);
  const correct = inRange.filter(a => a.correct).length;
  const wrongKeys = new Set(inRange.filter(a => !a.correct).map(a => questionKey(a.question)));
  const uniq = (list: AnswerRecord[]) => [...new Map(list.map(a => [questionKey(a.question), a.question])).values()];
  return {
    total: inRange.length,
    correct,
    accuracy: inRange.length ? Math.round((correct / inRange.length) * 100) : 0,
    mastered: uniq(inRange.filter(a => a.correct && !wrongKeys.has(questionKey(a.question)))),
    mistakes: uniq(inRange.filter(a => !a.correct)),
  };
}
