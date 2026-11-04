import { describe, expect, it } from 'vitest';
import { codexItems } from './codex';
import { LEVELS } from './QuestionData';
import { addBankVocab, getRegionVocab } from './vocab';

describe('冒險圖鑑（Codex）', () => {
  it('正確將分區 CEFR 詞庫納入該區域圖鑑，單字數量完整充足', () => {
    // 模擬載入 R4 (B1+ 赤岩峽谷) 詞庫
    const mockR4Vocab = {
      AGENDA: { pos: 'n.', meaning: '議程', example: 'The meeting agenda is ready.', exampleZh: '會議議程準備好了。' },
      POSTPONE: { pos: 'v.', meaning: '延期', example: 'We have to postpone the match.', exampleZh: '我們必須延期比賽。' },
      IMPLEMENT: { pos: 'v.', meaning: '實施；執行', example: 'We will implement the plan.', exampleZh: '我們將實施這項計畫。' },
      LOOK_FORWARD_TO: { pos: 'phr.', meaning: '期待', example: 'I look forward to seeing you.', exampleZh: '我期待見到你。' },
    };

    addBankVocab(mockR4Vocab, 4);
    expect(getRegionVocab(4)).toBeDefined();

    const r4Key = LEVELS[4];
    const items = codexItems(r4Key, {}, {});

    const agendaItem = items.find(it => it.vocabKey === 'AGENDA');
    expect(agendaItem).toBeDefined();
    expect(agendaItem?.title).toBe('agenda');
    expect(agendaItem?.kind).toBe('word');
    expect(agendaItem?.subtitle).toBe('議程');

    const phraseItem = items.find(it => it.vocabKey === 'LOOK_FORWARD_TO');
    expect(phraseItem).toBeDefined();
    expect(phraseItem?.kind).toBe('phrase');
  });

  it('正確累積戰鬥紀錄與解鎖星級', () => {
    addBankVocab({
      FOCUS: { pos: 'v.', meaning: '專注', example: 'Focus on your work.', exampleZh: '專注在你的工作上。' },
    }, 4);

    const r4Key = LEVELS[4];
    const mockCodex = {
      'spell:FOCUS': { correct: 5, wrong: 1 },
      'voice:FOCUS': { correct: 2, wrong: 0 },
    };

    const items = codexItems(r4Key, mockCodex, {});
    const focusItem = items.find(it => it.vocabKey === 'FOCUS');

    expect(focusItem).toBeDefined();
    expect(focusItem?.correct).toBe(7);
    expect(focusItem?.wrong).toBe(1);
    expect(focusItem?.seen).toBe(true);
    expect(focusItem?.stars).toBeGreaterThan(0);
  });
});
