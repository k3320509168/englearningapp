// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import QuizRunner from '../components/QuizRunner';
import { DEFAULT_CHARACTER } from './character';
import { initialSave, useSaveStore } from '../store/saveStore';
import { readLearningEvidence } from './learningEvidence';
import type { Question } from './types';
import { useLearningEvidenceLifecycle } from '../components/useLearningEvidenceLifecycle';
const mock = vi.hoisted(() => ({ supported: false, say: vi.fn(), result: null as null | ((t: string[]) => void) }));
vi.mock('../components/useSpeak', () => ({ useSpeak: () => mock.say }));
vi.mock('./sfx', () => ({ sfx: { click: vi.fn(), coin: vi.fn(), wrong: vi.fn() } }));
vi.mock('./speech', () => ({
  isSpeechRecognitionSupported: () => mock.supported,
  createRecognizer: (h: { onResult: (t: string[]) => void }) => { mock.result = h.onResult; return { start: vi.fn(), stop: vi.fn() }; },
}));
let root: Root;
const voice: Question = { type: 'voice', desc: '請唸出：蘋果', ans: 'APPLE', speak: 'apple', skill: 'speaking' };
const choice: Question = { type: 'choice', desc: '聽後選擇', speak: 'Where is the station?', options: ['A. Near the bank', 'B. Yesterday'], ans: 'A', skill: 'listening' };
async function click(text: string) {
  const button = [...document.querySelectorAll('button')].find(b => b.textContent?.includes(text));
  expect(button).toBeTruthy();
  await act(async () => button!.click());
}
async function submit(text: string) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(document.querySelector('input'), text);
    document.querySelector('input')!.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await act(async () => document.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
}
async function render(qs: Question[], props: Partial<React.ComponentProps<typeof QuizRunner>> = {}) {
  await act(async () => root.render(<GameHarness><QuizRunner questions={qs} label={i => `第${i + 1}題`} onAnswer={vi.fn()} {...props} /></GameHarness>));
}
function GameHarness({ children }: { children?: React.ReactNode }) {
  useLearningEvidenceLifecycle();
  return children;
}
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  localStorage.clear(); mock.supported = false; mock.say.mockClear(); mock.result = null;
  useSaveStore.setState({ ...structuredClone(initialSave), character: { ...DEFAULT_CHARACTER }, settings: { ...initialSave.settings, autoSpeak: false } });
  document.body.innerHTML = '<div id="root"></div>'; root = createRoot(document.getElementById('root')!);
});
afterEach(async () => { await act(async () => root.unmount()); });
it('實際口說改鍵盤，記作typed，不冒稱口說通過；結果後示範不回填提示', async () => {
  await render([voice]);
  await submit('apple');
  expect(document.body.textContent).toContain('✔ 正確');
  expect(readLearningEvidence().entries[0]).toMatchObject({ skill: 'speaking', mode: 'typed', voiceFallback: true, outcome: 'correct', modelAudioRequested: false });
  await click('聽發音');
  expect(readLearningEvidence().entries[0].modelAudioRequested).toBe(false);
});
it('實際聽力自動播放、慢速請求與固定選項答題都有記錄', async () => {
  useSaveStore.setState({ settings: { ...initialSave.settings, autoSpeak: true } });
  await render([choice]);
  await click('慢速'); await click('Near the bank');
  expect(readLearningEvidence().entries[0]).toMatchObject({ mode: 'choice', outcome: 'correct', listeningPlaysRequested: 2, slowAudioRequested: true, modelAudioRequested: false });
});
it('示範後語音只記一次固定答案辨識，不保存逐字稿', async () => {
  mock.supported = true;
  await render([voice]); await click('聽發音');
  await act(async () => { mock.result!(['apple']); mock.result!(['apple']); });
  expect(readLearningEvidence().entries).toHaveLength(1);
  expect(readLearningEvidence().entries[0]).toMatchObject({ mode: 'speech', modelAudioRequested: true, task: 'fixed-answer', context: 'unknown' });
  expect(JSON.stringify(readLearningEvidence())).not.toContain('apple');
});
it('盲測跳過麥克風記unverified而非答錯口說；匯入hydrate清除sidecar', async () => {
  mock.supported = true;
  await render([voice], { blind: true }); await click('跳過口說');
  expect(readLearningEvidence().entries[0]).toMatchObject({ mode: 'skipped', outcome: 'unverified', source: 'blind' });
  await act(async () => { await useSaveStore.persist.rehydrate(); });
  expect(readLearningEvidence().entries).toEqual([]);
});
it('重置主角清除本機證據，與舊備份不混成同一玩家', async () => {
  await render([voice], { review: true }); await submit('apple');
  expect(readLearningEvidence().entries[0].source).toBe('review');
  await act(async () => useSaveStore.getState().resetProgress());
  expect(readLearningEvidence().entries).toEqual([]);
});

it('離開測驗視窗後匯入或重置，Game層仍清掉本機證據', async () => {
  await render([voice]); await submit('apple');
  await act(async () => root.render(<GameHarness />));
  expect(readLearningEvidence().entries).toHaveLength(1);
  await act(async () => { await useSaveStore.persist.rehydrate(); });
  expect(readLearningEvidence().entries).toEqual([]);
});
