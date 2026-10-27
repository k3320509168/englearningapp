import { describe, expect, it } from 'vitest';
import { addToPool, buildPrompt, parseBatch, reviewBatch, reviewReport } from './questionPipeline';
import { QUESTION_POOL, mergePools } from './QuestionData';

const existing = Object.values(QUESTION_POOL).flatMap(p => [...p.normal, ...p.boss]);

describe('question pipeline', () => {
  it('builds a prompt that lists existing questions to avoid duplicates', () => {
    const p = buildPrompt('A1', 5, ['請拼出：書本']);
    expect(p).toContain('A1');
    expect(p).toContain('請拼出：書本');
  });

  it('parses JSON even inside a code block', () => {
    const b = parseBatch('```json\n{"normal":[{"type":"spell","desc":"x","ans":"X"}],"boss":[]}\n```');
    expect(b.normal).toHaveLength(1);
    expect(b.vocab).toEqual({});
  });

  it('keeps valid questions and drops broken or duplicate ones', () => {
    const batch = {
      normal: [
        { type: 'spell' as const, desc: '請拼出：測試字', ans: 'TESTWORD', speak: 'testword' },
        { type: 'spell' as const, desc: '請拼出：壞掉', ans: 'bad word', speak: 'bad' },
        existing[0],
      ],
      boss: [{ type: 'choice' as const, desc: 'Pick ___ one.', options: ['A. a', 'B. b', 'C. c'], ans: 'A', explain: 'x' }],
      vocab: { TESTWORD: { pos: 'n.', meaning: '測試字', example: 'Test.', exampleZh: '測試。' } },
    };
    const r = reviewBatch(batch, existing);
    expect(r.accepted.map(a => a.question.ans)).toEqual(['TESTWORD']);
    expect(r.accepted[0].warnings).toEqual([]);
    expect(r.rejected).toHaveLength(3);
    expect(reviewReport('A1', r)).toContain('TESTWORD');
  });

  it('merges generated questions into the game pools', () => {
    const r = reviewBatch({ normal: [{ type: 'spell', desc: '請拼出：新字', ans: 'NEWWORD', speak: 'newword' }], boss: [], vocab: {} }, existing);
    const extra = addToPool({}, 'A1', r.accepted);
    const merged = mergePools({ A1: { normal: [], boss: [] } }, extra);
    expect(merged.A1.normal.map(q => q.ans)).toEqual(['NEWWORD']);
  });
});
