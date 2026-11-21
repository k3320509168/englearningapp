import { expect, it } from 'vitest';
import { CARAVAN_STAGES, caravanFlag, caravanListenAnswer, caravanReadAnswer, caravanResponseAnswer, caravanResume } from './caravanScenario';
it('選最快安全路線，並且必須指出實際限重依據', () => {
  expect(caravanReadAnswer('bridge', 'under-limit')).toBe(true);
  expect(caravanReadAnswer('bridge', 'shortest-only')).toBe(false);
  expect(caravanReadAnswer('forest', 'under-limit')).toBe(false);
});
it('新貨已上車，不能沿用出發重量或把新增重量當總重', () => {
  expect(caravanListenAnswer('forest', '2.8')).toBe(true);
  expect(caravanListenAnswer('bridge', '2.8')).toBe(false);
  expect(caravanListenAnswer('forest', '2.2')).toBe(false);
  expect(caravanListenAnswer('forest', '0.6')).toBe(false);
});
it('有限組卡接受兩個安全替代安排，不用關鍵字評自由寫作', () => {
  expect(caravanResponseAnswer('forest', 'over-limit', 'message')).toBe(true);
  expect(caravanResponseAnswer('forest', 'over-limit', 'call')).toBe(true);
  expect(caravanResponseAnswer('forest', 'hurry', 'message')).toBe(false);
  expect(caravanResponseAnswer('forest', 'over-limit', 'ignore')).toBe(false);
  expect(caravanResponseAnswer('bridge', 'over-limit', 'message')).toBe(false);
});
it('僅依本情境namespace完成旗標續接，舊劇情旗標不誤認完成', () => {
  expect(caravanResume(['prologue'])).toBe(0);
  expect(caravanResume([caravanFlag('done:read')])).toBe(1);
  expect(caravanResume(CARAVAN_STAGES.map(s => caravanFlag(`done:${s}`)))).toBe(-1);
});
