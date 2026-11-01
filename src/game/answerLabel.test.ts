import { expect, it } from 'vitest';
import { answerLabel } from './answerLabel';
import { voiceFallback } from './battle';
it('shows the English target after a phrase spelling answer rather than repeating the Chinese prompt', () => {
  const q = voiceFallback({ type: 'voice', desc: '請唸出：請稍等', ans: 'WAIT A MINUTE', speak: 'wait a minute' });
  expect(q.desc).toContain('請先聽發音');
  expect(answerLabel(q).text.toUpperCase()).toBe('WAIT A MINUTE');
  expect(answerLabel({ type: 'spell', ans: 'QWERTY', desc: '鍵盤排列' }).text).toBe('QWERTY');
});
