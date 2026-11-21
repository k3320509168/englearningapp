// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { LEARNING_EVIDENCE_KEY, MAX_LEARNING_EVIDENCE, clearLearningEvidence, readLearningEvidence, recordLearningEvidence } from './learningEvidence';
import type { LearningEvidence } from './learningEvidence';
const sample = (id: number): LearningEvidence => ({
  attemptId: `run:${id}`, runId: 'run', itemId: 'item', at: id, task: 'fixed-answer', skill: 'speaking',
  mode: 'typed', outcome: 'correct', source: 'quiz', voiceFallback: true,
  modelAudioRequested: true, listeningPlaysRequested: 0, slowAudioRequested: false, context: 'unknown',
});
beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());
it('限定300筆、同一attempt僅寫一次，不會把固定作答升格為自由產出或CEFR', () => {
  for (let i = 0; i < 305; i++) expect(recordLearningEvidence(sample(i))).toBe(true);
  expect(recordLearningEvidence(sample(304))).toBe(false);
  const entries = readLearningEvidence().entries;
  expect(entries).toHaveLength(MAX_LEARNING_EVIDENCE);
  expect(entries[0].at).toBe(5);
  expect(entries.every(e => e.task === 'fixed-answer' && e.context === 'unknown')).toBe(true);
});
it('舊版、較新版、損壞資料不補造或升格歷史證據', () => {
  for (const data of ['broken', JSON.stringify({ version: 0, entries: [sample(1)] }), JSON.stringify({ version: 2, entries: [sample(1)] })]) {
    localStorage.setItem(LEARNING_EVIDENCE_KEY, data);
    expect(readLearningEvidence().entries).toEqual([]);
  }
  localStorage.setItem(LEARNING_EVIDENCE_KEY, JSON.stringify({ version: 1, entries: [null, { ...sample(1), mode: 'skipped', outcome: 'correct' }, sample(2)] }));
  expect(readLearningEvidence().entries).toEqual([sample(2)]);
});
it('不儲存意外夾帶的逐字稿或姓名欄位，並提供本機清除入口', () => {
  recordLearningEvidence({ ...sample(1), transcript: 'private words', name: 'private name' } as LearningEvidence);
  expect(localStorage.getItem(LEARNING_EVIDENCE_KEY)).not.toContain('private');
  clearLearningEvidence();
  expect(readLearningEvidence().entries).toEqual([]);
});
it('儲存被停用不阻止遊戲作答', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
  expect(recordLearningEvidence(sample(1))).toBe(false);
  expect(() => clearLearningEvidence()).not.toThrow();
});
