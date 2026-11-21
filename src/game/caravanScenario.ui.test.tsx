// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import CaravanModal from '../components/CaravanModal';
import AdventureModal from '../components/AdventureModal';
import { useSaveStore, initialSave } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { DEFAULT_CHARACTER } from './character';
import { CARAVAN_UPDATE, caravanFlag } from './caravanScenario';
const mock = vi.hoisted(() => ({ say: vi.fn() }));
vi.mock('../components/useSpeak', () => ({ useSpeak: () => mock.say }));
let root: Root;
async function click(text: string) {
  const button = [...document.querySelectorAll('button')].find(b => b.textContent?.includes(text));
  expect(button, text).toBeTruthy();
  await act(async () => button!.click());
}
async function card(name: string, value: string) {
  const input = document.querySelector<HTMLInputElement>(`input[name="${name}"][value="${value}"]`);
  expect(input).toBeTruthy(); await act(async () => input!.click());
}
async function render(key = 'first') { await act(async () => root.render(<CaravanModal key={key} />)); }
const resources = () => {
  const s = useSaveStore.getState();
  return { gold: s.gold, tickets: s.tickets, weaponTickets: s.weaponTickets, player: s.player, unlockedIndex: s.unlockedIndex, materials: s.materials, knowledge: s.knowledge };
};
async function first() {
  await card('read-route', 'bridge'); await card('read-reason', 'under-limit'); await click('確認安排'); await click('下一節');
}
async function second() {
  await card('listen-weight', '2.8'); await card('listen-route', 'forest'); await click('確認安排'); await click('下一節');
}
async function third(alt = 'message') {
  await card('respond-stance', 'forest'); await card('respond-reason', 'over-limit'); await card('respond-alternative', alt); await click('確認安排'); await click('查看故事結局');
}
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  localStorage.clear(); mock.say.mockClear();
  useSaveStore.setState({ ...structuredClone(initialSave), character: { ...DEFAULT_CHARACTER }, gold: 1234 });
  useUiStore.setState({ modal: 'caravan' });
  document.body.innerHTML = '<div id="root"></div>'; root = createRoot(document.getElementById('root')!);
});
afterEach(async () => { await act(async () => root.unmount()); });
it('可由真實Adventure入口開啟三節，完整通關無麥克風且不更動資源或主線', async () => {
  function Entry() { return useUiStore(s => s.modal) === 'caravan' ? <CaravanModal /> : <AdventureModal />; }
  useUiStore.setState({ modal: 'adventure' });
  await act(async () => root.render(<Entry />)); await click('護送商隊 🛒');
  const before = structuredClone(resources());
  expect(mock.say).not.toHaveBeenCalled();
  await first(); await click('播放商人消息');
  expect(mock.say).toHaveBeenCalledWith(CARAVAN_UPDATE);
  await second(); await third();
  expect(document.body.textContent).toContain('商隊安全抵達');
  expect(document.body.textContent).toContain('尚不能據此確認獨立聽力能力');
  expect(resources()).toEqual(before);
  expect(useSaveStore.getState().storySeen).toContain(caravanFlag('done:respond'));
});
it('錯誤可調整，提示與字幕輔助保存，回看原公告不洩漏新增消息', async () => {
  await render(); await card('read-route', 'bridge'); await card('read-reason', 'shortest-only'); await click('確認安排');
  expect(document.body.textContent).toContain('再想一下');
  expect(useSaveStore.getState().storySeen).not.toContain(caravanFlag('done:read'));
  await click('需要提示'); await card('read-reason', 'under-limit'); await click('確認安排'); await click('下一節');
  expect(document.querySelector('.caravan-reference')?.textContent).not.toContain('0.6');
  await click('顯示字幕');
  expect(document.body.textContent).toContain(CARAVAN_UPDATE);
  expect(mock.say).not.toHaveBeenCalled();
  await card('listen-weight', '2.2'); await card('listen-route', 'bridge'); await click('確認安排');
  expect(document.body.textContent).toContain('消息已說明更新後總重');
  await card('listen-weight', '2.8'); await card('listen-route', 'forest'); await click('確認安排'); await click('下一節');
  await card('respond-stance', 'forest'); await card('respond-reason', 'hurry'); await card('respond-alternative', 'ignore'); await click('確認安排');
  expect(document.body.textContent).toContain('趕時間不會改變限重');
  await card('respond-reason', 'over-limit'); await card('respond-alternative', 'call'); await click('確認安排');
  expect(document.body.textContent).toContain('call the customer and confirm a later arrival time'); await click('查看故事結局');
  expect(document.body.textContent).toContain('選路曾使用提示');
  expect(document.body.textContent).toContain('文字輔助練習');
  expect(useSaveStore.getState().storySeen).toContain(caravanFlag('listen:subtitles'));
});
it('每節確認即保存，閉窗重入及主存檔rehydrate仍從第二節繼續', async () => {
  function Entry() { return useUiStore(s => s.modal) === 'caravan' ? <CaravanModal /> : <AdventureModal />; }
  await act(async () => root.render(<Entry />)); await first();
  await click('✕');
  expect(document.body.textContent).toContain('冒險副本與地下城挑戰');
  const backup = localStorage.getItem('english-rpg-save')!;
  await act(async () => useSaveStore.setState({ storySeen: [] }));
  localStorage.setItem('english-rpg-save', backup);
  await act(async () => { await useSaveStore.persist.rehydrate(); });
  await click('護送商隊 🛒');
  expect(document.querySelector('h3')?.textContent).toContain('第二節');
  expect(mock.say).not.toHaveBeenCalled();
  await click('回看上一節'); expect(document.querySelector('h3')?.textContent).toContain('第一節');
  expect(useSaveStore.getState().storySeen).toContain(caravanFlag('done:read'));
});
it('完成後重播不重獎，舊存檔沒有scenario欄位也能開始', async () => {
  const old = { ...structuredClone(initialSave), character: { ...DEFAULT_CHARACTER }, gold: 1234 } as Record<string, unknown>;
  delete old.storySeen;
  localStorage.setItem('english-rpg-save', JSON.stringify({ state: old, version: 15 }));
  await act(async () => { await useSaveStore.persist.rehydrate(); });
  await render(); expect(document.querySelector('h3')?.textContent).toContain('第一節');
  await first(); await second(); await third();
  const before = structuredClone(resources());
  await click('重玩三節'); await first(); await second(); await third();
  expect(resources()).toEqual(before);
  expect(useSaveStore.getState().storySeen.filter(s => s === caravanFlag('done:respond'))).toHaveLength(1);
  await render('completed'); expect(document.body.textContent).toContain('商隊安全抵達');
});
