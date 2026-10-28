import { describe, expect, it } from 'vitest';
import { pickHint } from './hints';
import { easeOrder } from './battle';
import { migrateSave } from '../store/saveStore';

const ctx = { questionType: 'choice', combo: 0, isBossQuestion: false, skillReady: false };

describe('戰鬥情境提示', () => {
  it('先教怎麼答題，看過就換下一則', () => {
    expect(pickHint(ctx, [])).toBe('choice');
    expect(pickHint(ctx, ['choice'])).toBeNull();
    expect(pickHint({ ...ctx, combo: 3 }, ['choice'])).toBe('combo');
    expect(pickHint({ ...ctx, combo: 3 }, ['choice', 'combo'])).toBe('timer');
    expect(pickHint({ ...ctx, questionType: 'spell' }, ['choice'])).toBe('typing');
  });

  it('舊玩家視為看過全部提示，新玩家從頭開始', () => {
    expect(migrateSave({ tutorialDone: true }, 13).hintsSeen.length).toBeGreaterThan(5);
    expect(migrateSave({}, 0).hintsSeen).toEqual([]);
  });
});

describe('第一場戰鬥由易到難', () => {
  it('選擇題優先，再依單字長度', () => {
    const q = (type: string, ans: string) => ({ type, ans, desc: '' });
    expect(easeOrder([q('spell', 'APPLE'), q('choice', 'B'), q('spell', 'CAT'), q('voice', 'HI')]).map(x => x.ans))
      .toEqual(['B', 'CAT', 'APPLE', 'HI']);
  });
});
