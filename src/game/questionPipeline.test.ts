import { describe, expect, it } from 'vitest';
import { addToPool, buildPrompt, buildSkillPrompt, cleanVocab, countSkill, parseBatch, reviewBatch, reviewReport, tagBatch } from './questionPipeline';
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

describe('CEFR 題庫', () => {
  it('每項技能的提示詞都要求標註 skill 與 difficulty，並附上多詞性的單字資料', () => {
    const p = buildSkillPrompt('A1 入門 (120-224分)', 'listening', 40, ['請拼出：書本'], ['BOOK']);
    expect(p).toContain('"skill": "listening"');
    expect(p).toContain('🎧');
    expect(p).toContain('senses');
    expect(p).toContain('BOOK');
  });

  it('補上分類、改正不合法的難度，壞掉的 senses 會被丟掉', () => {
    const batch = tagBatch({
      normal: [{ type: 'spell', desc: '請拼出：測試', ans: 'TESTWORD', speak: 'testword', difficulty: 7 as 1, skill: 'reading' }],
      boss: [],
      vocab: { testword: { pos: 'n.', meaning: '測試', example: 'A test.', exampleZh: '測試。', senses: [{ pos: 'n.', meaning: '測試', examples: [{ en: 'x' }] }] } as never },
    }, 'writing');
    expect(batch.normal[0]).toMatchObject({ skill: 'writing', difficulty: 2 });
    expect(batch.vocab.TESTWORD.senses).toBeUndefined();
    expect(countSkill({ normal: batch.normal, boss: [] }, 'writing')).toBe(1);
    expect(Object.keys(cleanVocab({ '': { pos: '', meaning: '', example: '', exampleZh: '' } }))).toHaveLength(0);
  });

  it('聽力題沒有聲音會被擋下', () => {
    const r = reviewBatch({ normal: [{ type: 'choice', skill: 'listening', desc: '🎧 聽一聽', options: ['A. 一', 'B. 二', 'C. 三', 'D. 四'], ans: 'A', explain: 'x' }], boss: [], vocab: {} }, []);
    expect(r.accepted).toHaveLength(0);
  });
});
