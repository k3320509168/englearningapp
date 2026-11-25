import { expect, test, type Locator, type Page } from '@playwright/test';
import { DEFAULT_CHARACTER } from '../src/game/character';
import type { Question } from '../src/game/types';

const day = 86_400_000;
const startTime = new Date('2026-11-25T12:00:00+08:00');
const readSave = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('english-rpg-save')!).state);

async function setup(page: Page, withQuota: boolean) {
  await page.clock.install({ time: startTime });
  await page.addInitScript(({ character, withQuota, day }) => {
    if (localStorage.getItem('english-rpg-save')) return;
    const now = Date.now();
    localStorage.setItem('english-rpg-save', JSON.stringify({ version: 26, state: {
      character, tutorialDone: true, prologueDone: true, bossDown: [0], storySeen: ['region-0', 'clear-0'],
      strictTrials: withQuota ? { 0: [now - day + 240_000, now - day + 480_000] } : {},
      placement: { level: 1, region: 0, at: now, verified: false, speakingVerified: true, confidence: 'ok', weak: [] },
      settings: { volume: 0, musicVolume: 0, sfxVolume: 0, autoSpeak: false, voiceAsSpelling: true },
    } }));
  }, { character: DEFAULT_CHARACTER, withQuota, day });
  await page.goto('/englearningapp/');
}

async function openTrial(page: Page) {
  await page.getByRole('button', { name: /守門人的考驗/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: /挑戰區域試煉/ }).click();
  return page.getByRole('dialog', { name: /守門人：/ });
}

async function playTrial(dialog: Locator, count: number, pass: boolean) {
  await expect(dialog.locator('.quiz-count')).toContainText(`第 1 / ${count} 題`);
  const questions = await dialog.page().evaluate(async (): Promise<{ q: Question; speech: boolean }[]> => {
    const knowledgePath = '/src/game/knowledge.ts';
    const battlePath = '/src/game/battle.ts';
    const { regionIndex } = await import(knowledgePath);
    const { voiceFallback } = await import(battlePath);
    return [...regionIndex(0).values()].flat().map((q: Question) => ({ q: voiceFallback(q), speech: q.type === 'voice' }));
  });
  let speakingErrors = 0;
  for (let i = 0; i < count; i++) {
    await expect(dialog.locator('.quiz-count')).toContainText(`第 ${i + 1} / ${count} 題`);
    const prompt = await dialog.locator('.q-desc').evaluate(el => el.firstChild?.textContent);
    const options = await dialog.locator('.option-btn').allTextContents();
    const answer = questions.find(({ q }) => q.desc.replace(/^【[^】]*試煉】/, '') === prompt &&
      (q.type === 'choice' ? q.options?.every((o, index) => o[0] + o.slice(2) === options[index]) : options.length === 0));
    if (!answer) throw Error(`找不到試煉題：${prompt}`);
    const { q, speech } = answer;
    const wrong = !pass && speech && speakingErrors < 3;
    if (wrong) speakingErrors++;
    if (q.type === 'choice') {
      await dialog.locator('.option-btn').filter({ hasText: new RegExp(`^${q.ans}`) }).click();
    } else {
      await dialog.getByRole('textbox', { name: '輸入答案' }).fill(wrong ? 'WRONGANSWER' : q.ans);
      await dialog.getByRole('button', { name: /確認/ }).click();
    }
    await expect(dialog.locator('.trial-result')).toHaveClass(wrong ? /is-wrong/ : /is-correct/);
    await dialog.getByRole('button', { name: i + 1 === count ? /看結果/ : /下一題/ }).click();
  }
  expect(speakingErrors).toBe(pass ? 0 : 3);
}

async function verifyUnlock(page: Page, trial: Locator) {
  await expect(trial).toContainText('試煉通過！');
  await expect(trial).toContainText('本次使用拼寫備援，口說未驗證');
  await trial.getByRole('button', { name: /前往「迷霧森林」/ }).click();
  await page.getByRole('dialog', { name: '故事' }).getByRole('button', { name: /略過整段/ }).click();
  await page.reload();
  expect(await readSave(page)).toMatchObject({ unlockedIndex: 1, placement: { verified: true, speakingVerified: false } });
  await expect(page.getByRole('button', { name: /踏上征途.*迷霧森林/ })).toBeVisible();
}

test('高標準試煉在開著的視窗解除 24 小時上限並通關', async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 375, height: 812 });
  await setup(page, true);
  const trial = await openTrial(page);
  await expect(trial).toContainText('每 24 小時最多挑戰 2 次');
  const start = trial.getByRole('button', { name: '開始試煉' });
  await expect(start).toBeDisabled();
  await page.screenshot({ path: testInfo.outputPath('strict-wait.png'), animations: 'disabled' });
  await page.clock.fastForward(241_000);
  await expect(start).toBeEnabled();
  await start.click();
  await playTrial(trial, 40, true);
  expect((await readSave(page)).strictTrials['0']).toHaveLength(2);
  await verifyUnlock(page, trial);
});

for (const [width, height] of [[1366, 768], [1920, 1080]]) {
  test(`封印完成後 24 題試煉，分項未達標可重試 ${width}x${height}`, async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height });
    await setup(page, false);
    await page.evaluate(async (day) => {
      const loaderPath = '/src/game/questions/bank/loader.ts';
      const knowledgePath = '/src/game/knowledge.ts';
      const battlePath = '/src/game/battle.ts';
      const { loadBank } = await import(loaderPath);
      const { regionIndex } = await import(knowledgePath);
      const { questionKey } = await import(battlePath);
      await loadBank(0);
      const now = Date.now();
      const save = JSON.parse(localStorage.getItem('english-rpg-save')!);
      save.state.knowledge = Object.fromEntries([...regionIndex(0)].map(([key, questions]) => [key, {
        wins: [now - 3 * day, now - 2 * day, now - day], dueAt: now + day,
        ...(key.startsWith('g:') ? { items: [...new Set(questions.map(questionKey))].slice(0, 2) } : {}),
      }]));
      localStorage.setItem('english-rpg-save', JSON.stringify(save));
    }, day);
    await page.reload();
    const trial = await openTrial(page);
    await expect(trial).toContainText('封印已經重建');
    await page.screenshot({ path: testInfo.outputPath('seal-ready.png'), animations: 'disabled' });
    await trial.getByRole('button', { name: '開始試煉' }).click();
    await playTrial(trial, 24, false);
    await expect(trial).toContainText('試煉未通過');
    await expect(trial).toContainText('21 / 24 題');
    expect((await readSave(page)).unlockedIndex).toBe(0);
    await trial.getByRole('button', { name: '再挑戰一次' }).click();
    await playTrial(trial, 24, true);
    expect((await readSave(page)).strictTrials).toEqual({});
    await verifyUnlock(page, trial);
  });
}
