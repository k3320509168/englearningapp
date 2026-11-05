// @vitest-environment jsdom
import React, { act, StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useSaveStore, initialSave } from '../src/store/saveStore';
import { useUiStore } from '../src/store/uiStore';
import { setSfxVolume } from '../src/game/sfx';
import WorldBoss from '../src/components/WorldBossModal';
import TrueName from '../src/components/TrueNameModal';
import Gate from '../src/components/GateTrialModal';
import '../scripts/loadBanks';
import * as K from '../src/game/knowledge';
import { questionKey, voiceFallback } from '../src/game/battle';
import { speak } from '../src/game/speech';
import WordStudy from '../src/components/WordStudy';
import { VOCAB } from '../src/game/vocab';
import MapLevelBar from '../src/components/MapLevelBar';
import ReviewModal from '../src/components/ReviewModal';
import HeroModal from '../src/components/HeroModal';
import EnemyStatus from '../src/components/EnemyStatus';
import TicketWheel from '../src/components/TicketWheel';
import { useBattleStore } from '../src/store/battleStore';
vi.mock('../src/game/art/sprites', () => ({ heroDataUrl: () => 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', avatarDataUrl: () => 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==' }));
vi.mock('../src/game/questions/bank/loader', () => ({ loadBank: async () => undefined }));
vi.mock('../src/game/speech', async importOriginal => ({ ...await importOriginal<typeof import('../src/game/speech')>(), speak: vi.fn(), isSpeechRecognitionSupported: () => false }));
let root: Root;
const click = async (text: string) => act(async () => {
  const button = [...document.querySelectorAll('button')].find(b => b.textContent?.trim() === text);
  expect(button, text).toBeTruthy(); button!.click();
});
async function typeAndSubmit(value: string) {
  const input = document.querySelector('input')!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await act(async () => { document.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
}
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  document.body.innerHTML = '<div id="root"></div>';
  root = createRoot(document.getElementById('root')!);
  setSfxVolume(0);
  useSaveStore.setState({ ...structuredClone(initialSave), settings: { ...initialSave.settings, volume: 0, musicVolume: 0, sfxVolume: 0, autoSpeak: false } });
});
afterEach(async () => { await act(async () => root.unmount()); vi.useRealTimers(); });
it('世界王在StrictMode逐題推進，勝利只發一次3000金幣與2專武券', async () => {
  await act(async () => root.render(<StrictMode><WorldBoss /></StrictMode>));
  await click('⚔️ 開始詠唱破盾突襲！');
  const before = useSaveStore.getState();
  const keywords = ['SACRED', 'GUARDIANS', 'ETERNITY', 'RESOLVE', 'DRAGONS'];
  for (const word of keywords) {
    expect(document.querySelector('input')?.placeholder).toContain(word);
    await typeAndSubmit(word);
  }
  expect(document.body.textContent).toContain('世界王討伐大獲全勝');
  expect(useSaveStore.getState().gold - before.gold).toBe(3000);
  expect(useSaveStore.getState().weaponTickets - before.weaponTickets).toBe(2);
});
it('世界王示範遵守玩家發音音量', async () => {
  vi.mocked(speak).mockClear();
  await act(async () => root.render(<WorldBoss />));
  await click('⚔️ 開始詠唱破盾突襲！');
  const demo = [...document.querySelectorAll('button')].find(b => b.textContent?.includes('示範'))!;
  expect(demo).toBeTruthy(); await act(async () => demo.click());
  expect(vi.mocked(speak).mock.calls.at(-1)?.[2]).toBe(0);
});
it('真名完成第一項後立即開下一項，不會被900ms舊回呼關閉', async () => {
  useSaveStore.setState({ heroes: ['phoenix'] }); useUiStore.setState({ heroId: 'phoenix' });
  await act(async () => root.render(<TrueName />)); vi.useFakeTimers();
  await click('挑戰'); await typeAndSubmit('PHOENIX'); await click('挑戰');
  const next = document.querySelector('.trial-prompt')?.textContent;
  expect(next).toBeTruthy(); await act(async () => vi.advanceTimersByTime(901));
  expect(document.querySelector('.trial-prompt')?.textContent).toBe(next);
});
it('高標準試煉途中封印完成，40/40仍按開局規則解鎖', async () => {
  const seeded = () => { let n = 53; return () => ((n = n * 16807 % 2147483647) / 2147483647); };
  const batch = K.trialQuestions(1, () => false, seeded(), true);
  const keys = [...K.regionIndex(1).keys()], words = keys.filter(k => k.startsWith('w:'));
  const target = K.knowledgeKey(batch.find(q => K.knowledgeKey(q).startsWith('w:'))!);
  const count = K.sealTargets(1, words.length).learn - 1;
  const knowledge = Object.fromEntries([...words.filter(k => k !== target).slice(0, count), ...keys.filter(k => k.startsWith('g:'))].map(k => [k, { wins: [1, 100000000, 200000000], dueAt: 0, items: ['x', 'y'] }]));
  useSaveStore.setState({ bossDown: [0, 1], unlockedIndex: 1, player: { level: 30, xp: 0, classPath: [] }, knowledge, settings: { ...useSaveStore.getState().settings, voiceAsSpelling: true } });
  useUiStore.setState({ regionIdx: 1 });
  expect(K.regionMastery(1, knowledge).sealMet).toBe(false);
  await act(async () => root.render(<Gate />));
  const rng = vi.spyOn(Math, 'random').mockImplementation(seeded());
  await click('開始試煉'); rng.mockRestore();
  for (const original of batch) {
    const q = voiceFallback(original);
    if (q.type === 'choice') {
      const button = [...document.querySelectorAll<HTMLButtonElement>('.option-btn')].find(b => b.textContent?.startsWith(q.ans))!;
      await act(async () => button.click());
    } else await typeAndSubmit(q.ans);
    await act(async () => document.querySelector<HTMLButtonElement>('.trial-result button')!.click());
  }
  expect(K.regionMastery(1, useSaveStore.getState().knowledge).sealMet).toBe(true);
  expect(useSaveStore.getState().unlockedIndex).toBe(2);
  expect(document.body.textContent).toContain('試煉通過');
  expect(Object.keys(useSaveStore.getState().codex).length).toBeGreaterThan(0);
  expect(questionKey(batch[0])).toBeTruthy();
}, 30000);

it('學習卡在mount後新載入詞彙，導航與choice統計正常', async () => {
  useUiStore.setState({ studyWord: null });
  await act(async () => root.render(<WordStudy />));
  VOCAB.ZZZAUDIT = { ...VOCAB.BREAD, word: 'zzzaudit' };
  const question = { type: 'choice' as const, desc: '詞彙統計回歸', ans: 'A', vocabId: 'ZZZAUDIT', speak: 'zzzaudit', options: ['A. bread', 'B. milk'] };
  await act(async () => {
    useSaveStore.getState().recordAnswer(question, false);
    useUiStore.getState().openStudy('ZZZAUDIT');
  });
  expect(document.body.textContent).toContain('答錯 1 次');
  const previous = [...document.querySelectorAll('button')].find(b => b.textContent?.includes('上一個詞'));
  expect(previous).toBeTruthy(); expect(previous!.disabled).toBe(false);
  delete VOCAB.ZZZAUDIT;
});
it('後期角色仍可進程度測驗，到期時標示七天回顧', async () => {
  useSaveStore.setState({ unlockedIndex: 7, prologueDone: true, placement: { level: 8, region: 7, at: 1, verified: true, verifiedAt: 1 } });
  await act(async () => root.render(<MapLevelBar />));
  await click('📋 7 天回顧到期');
  expect(useUiStore.getState().modal).toBe('placement');
});

it('正式匯入daily:null存檔立即初始化每日與每週資料', async () => {
  const { importSave } = await import('../src/cloud/cloudSave');
  await act(async () => importSave({ state: { ...structuredClone(initialSave), daily: null, weekly: null }, version: 24 }));
  expect(useSaveStore.getState().daily?.tasks.length).toBeGreaterThan(0);
  expect(useSaveStore.getState().weekly?.tasks.length).toBeGreaterThan(0);
});

it('錯題修煉使用原voice題更新SRS，重開同題數也可重新作答', async () => {
  const q = { type: 'voice', desc: '請唸出：蘋果', ans: 'APPLE', speak: 'apple' };
  const key = questionKey(q);
  useSaveStore.setState({ mistakes: { [key]: { question: q, wrongCount: 1, lastWrongAt: Date.now() - 86400000 * 2, box: 0, dueAt: 0 } } });
  await act(async () => root.render(<ReviewModal />));
  const entry = [...document.querySelectorAll('button')].find(b => b.textContent?.includes('進入修煉場'))!;
  await act(async () => entry.click()); await typeAndSubmit('APPLE');
  expect(useSaveStore.getState().mistakes[key].box).toBe(1);
  expect(Object.keys(useSaveStore.getState().mistakes)).toEqual([key]);
  await click('看結算 ⏎');
  const retry = [...document.querySelectorAll('button')].find(b => b.textContent?.includes('再修煉一組'))!;
  await act(async () => retry.click());
  expect(document.querySelector('input')?.disabled).toBe(false);
  await typeAndSubmit('APPLE');
  expect(useSaveStore.getState().mistakes[key].box).toBe(1); // 尚未到期，不可同日刷box
});
it('英雄點數值會把詳情捲回可見範圍', async () => {
  const scroll = vi.fn();
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', { value: scroll, configurable: true });
  useSaveStore.setState({ heroes: ['phoenix', 'knight'], party: ['knight', 'phoenix'] });
  await act(async () => root.render(<HeroModal />));
  const button = [...document.querySelectorAll('button')].find(b => b.textContent?.includes('📊 數值'))!;
  await act(async () => button.click());
  expect(scroll).toHaveBeenCalledWith({ top: 0, behavior: 'auto' });
});
it('敵方HTML資訊與戰鬥store的HP同步，不依賴畫布縮放', async () => {
  const B = useBattleStore.getState;
  B().startGoldenRoad(); if (B().phase === 'lesson') B().startBattle();
  await act(async () => root.render(<EnemyStatus />));
  expect(document.body.textContent).toContain(`HP ${B().monsterHp.toLocaleString()} / ${B().monsterMaxHp.toLocaleString()}`);
  await act(async () => useBattleStore.setState({ monsterHp: 7 }));
  expect(document.body.textContent).toContain('HP 7 /');
  B().exitToMap();
});

it('修煉中再次答錯的題，結算後仍列為到期而非誤稱今天全做完', async () => {
  const q = { type: 'spell', desc: '請拼出：蘋果', ans: 'APPLE', speak: 'apple' };
  const key = questionKey(q); const before = Date.now();
  vi.spyOn(Date, 'now').mockReturnValue(before);
  useSaveStore.setState({ mistakes: { [key]: { question: q, wrongCount: 1, lastWrongAt: before - 86400000, box: 0, dueAt: 0 } } });
  await act(async () => root.render(<ReviewModal />));
  await act(async () => [...document.querySelectorAll('button')].find(b => b.textContent?.includes('進入修煉場'))!.click());
  vi.mocked(Date.now).mockReturnValue(before + 1000);
  await typeAndSubmit('ZZZ'); await click('看結算 ⏎'); await click('返回錯題清單');
  expect(document.body.textContent).toContain('待複習重點（1）');
  expect(document.body.textContent).not.toContain('今天沒有到期');
  vi.mocked(Date.now).mockRestore();
});

it('轉盤稍後再轉保留次數，重開及跳過動畫不重複發獎', async () => {
  useUiStore.setState({ modal: null, celebrations: [], wheelHidden: false });
  useBattleStore.setState({ active: false });
  useSaveStore.setState({ wheelPending: 2, tickets: 10 });
  await act(async () => root.render(<StrictMode><TicketWheel /></StrictMode>));
  await click('稍後再轉（保留次數）');
  expect(useSaveStore.getState().wheelPending).toBe(2);
  expect(document.querySelector('.wheel-card')).toBeNull();
  await act(async () => useUiStore.getState().setWheelHidden(false));
  vi.useFakeTimers(); const random = vi.spyOn(Math, 'random').mockReturnValue(.2);
  await click('🎯 開始轉盤！');
  expect(useSaveStore.getState().wheelPending).toBe(1); expect(useSaveStore.getState().tickets).toBe(11);
  await click('點擊跳過 ⏭'); await click('再轉一次（剩餘 1 次）'); await click('🎯 開始轉盤！');
  await act(async () => vi.advanceTimersByTime(3401));
  expect(useSaveStore.getState().tickets).toBe(12); expect(useSaveStore.getState().wheelPending).toBe(0);
  await click('開心收下 ⏎'); expect(document.querySelector('.wheel-card')).toBeNull(); random.mockRestore();
});
it('SSR滿星與真名/碎片/金幣條件達成，可經原英雄介面晉升UR且只扣一次', async () => {
  useUiStore.setState({ modal: null, celebrations: [] });
  useSaveStore.setState({ heroes: ['phoenix'], party: ['phoenix'], gold: 1500, heroStars: { phoenix: 4 }, heroShards: { phoenix: 150 }, trueName: { phoenix: [true, true, true, true, true] } });
  await act(async () => root.render(<HeroModal />));
  await act(async () => [...document.querySelectorAll('button')].find(b => b.textContent?.trim().startsWith('養成'))!.click());
  await click('升品階');
  expect(useSaveStore.getState().heroTier.phoenix).toBe(1);
  expect(useSaveStore.getState().gold).toBe(0); expect(useSaveStore.getState().heroShards.phoenix).toBe(0);
  expect(document.body.textContent).toContain('已升品階（UR）');
  expect(useSaveStore.getState().tierUp('phoenix')).toBe(false);
});
