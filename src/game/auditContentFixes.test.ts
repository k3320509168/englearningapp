import { expect, it } from 'vitest';
import r2 from './questions/bank/r2.json';
import r5 from './questions/bank/r5.json';
import r7 from './questions/bank/r7.json';
import r8 from './questions/bank/r8.json';
import v7 from './questions/bank/vocab-r7.json';
import v8 from './questions/bank/vocab-r8.json';
import { quickSpellingExtra } from './questionHelp';
import { voiceFallback } from './battle';
import { rushReward } from './modes';
import { codexItems } from './codex';
import { addBankVocab } from './vocab';
import { getPool, LEVELS } from './QuestionData';

it('同中文提示的名詞與動詞都有可區分字數與詞性', () => {
  const noun = voiceFallback({ type: 'voice', desc: '請唸出：補償', ans: 'COMPENSATION', explain: 'compensation (n.)：補償' });
  const verb = voiceFallback({ type: 'voice', desc: '請唸出：補償', ans: 'COMPENSATE', explain: 'compensate (v.)：補償' });
  expect(quickSpellingExtra(noun)).toContain('名詞'); expect(quickSpellingExtra(noun)).toContain('12 個字母');
  expect(quickSpellingExtra(verb)).toContain('動詞'); expect(quickSpellingExtra(verb)).toContain('10 個字母');
});
it('前兩次素材保底，第三次仍依表現；大量答對收益不減少', () => {
  expect(rushReward(0, 0, 0, 0).ore).toBe(1); expect(rushReward(2, 2, 0, 1).ore).toBe(1);
  expect(rushReward(0, 0, 0, 2).ore).toBe(0); expect(rushReward(9, 9, 8, 0).ore).toBe(3);
});
it('時態題明示當前時刻表與例行行程，選項位置保持不變', () => {
  expect(r2.normal[708].desc).toContain('current timetable'); expect(r2.normal[708].desc).toContain('every weekday');
  expect(r2.normal[708].ans).toBe('A');
});
it('修掉詞彙題大小寫提示但保留I；comprehend干擾項有閱讀語境可排除', () => {
  for (const q of [...r5.normal, ...r5.boss]) if (q.type === 'choice') {
    const options = q.options!; const ans = options[q.ans.charCodeAt(0) - 65].slice(3);
    expect(/^[A-Z]{2,}$/.test(ans) && options.filter((_, i) => i !== q.ans.charCodeAt(0) - 65).every(o => /^[a-z]+$/.test(o.slice(3)))).toBe(false);
  }
  expect(r2.normal[725].options![2]).toBe('C. cancel');
  expect(r5.normal[1005].desc).toContain('did not understand');
});
it('兩個失真詞條與別名保持忠實，例句不留挖空', () => {
  for (const key of ['SUPREMACY', 'R7:SUPREMACY'] as const) {
    expect(v7[key].meaning).toBe('優勢地位；支配地位'); expect(v7[key].example).not.toContain('___');
  }
  expect(v8['BIOLOGICAL WEAPONS NON PROLIFERATION VERIFICATION'].meaning).toBe('生物武器不擴散核查');
  expect(v8['R8:BIOLOGICAL WEAPONS NON PROLIFERATION VERIFICATION'].exampleZh).not.toMatch(/炭疽|聯合國|銷毀|數十米/);
});
it('指定領域題改成題內可推導，無需靠外部定義答題', () => {
  expect(r7.normal.find(q => q.desc.includes('An editor says'))).toBeTruthy();
  expect(r7.boss.find(q => q.desc.includes('Which claim exceeds'))).toBeTruthy();
  expect(r8.normal.find(q => q.speak?.includes('attribution as an isolated causal finding'))).toBeTruthy();
});
it('未知詞性留白，不用解析全文當字義；cogent人工核對為adj.', () => {
  const pool = getPool(LEVELS[8]);
  const size = pool.normal.length;
  // 使用獨立測試區題池；不依靠全域詞典載入時序。
  pool.normal.push({ type: 'spell', desc: '請拼出：測試詞', ans: 'XYLOAUDIT', explain: '選項A是動詞、選項B是名詞。' }, { type: 'spell', desc: '請拼出：有說服力的', ans: 'COGENT' });
  try {
    const entries = codexItems(LEVELS[8], {}, {});
    expect(entries.find(e => e.title === 'xyloaudit')?.pos).toBe('');
    expect(entries.find(e => e.title === 'xyloaudit')?.subtitle).toBe('測試詞');
    expect(entries.find(e => e.title === 'cogent')?.pos).toBe('adj.');
  } finally { pool.normal.splice(size); }
});

it('中文指令不作英文單字列入圖鑑', () => {
  addBankVocab({ '站起來': { pos: 'n.', meaning: '指令', example: '', exampleZh: '' } }, 7);
  expect(codexItems(LEVELS[7], {}, {}).some(item => item.kind === 'word' && item.title === '站起來')).toBe(false);
});

it('兩道本批C1改寫題含選項不超過60個英文詞，避免修語意時反而拉長讀題', () => {
  for (const q of [r7.normal[1413], r7.boss[572]]) {
    expect(q.options).toHaveLength(4);
    const text = [q.desc, ...(q.options ?? []).map(o => o.replace(/^[A-D]\.\s*/, ''))].join(' ');
    expect((text.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g) ?? []).length).toBeLessThanOrEqual(60);
  }
});
