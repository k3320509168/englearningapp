import { expect, test, type Locator, type Page } from '@playwright/test';
import { DEFAULT_CHARACTER } from '../src/game/character';
import { clearStoryId, regionStoryId } from '../src/game/story';
import type { Question } from '../src/game/types';

const day = 86_400_000;
const startTime = new Date('2026-11-25T12:00:00+08:00');
const readSave = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('english-rpg-save')!).state);

async function setup(page: Page, withQuota: boolean, region = 0) {
  await page.clock.install({ time: startTime });
  await page.addInitScript(({ character, withQuota, day, region, storySeen }) => {
    if (window.speechSynthesis) {
      // Capture the spoken cue without playing audio on the host.
      window.speechSynthesis.speak = utterance => {
        document.documentElement.setAttribute('data-test-utterance', utterance.text);
        queueMicrotask(() => {
          utterance.dispatchEvent(new Event('start'));
          utterance.dispatchEvent(new Event('end'));
        });
      };
    }
    if (localStorage.getItem('english-rpg-save')) return;
    const now = Date.now();
    localStorage.setItem('english-rpg-save', JSON.stringify({ version: 26, state: {
      character, tutorialDone: true, prologueDone: true, bossDown: [region], unlockedIndex: region, storySeen,
      strictTrials: withQuota ? { [region]: [now - day + 240_000, now - day + 480_000] } : {},
      placement: { level: region + 1, region, at: now, verified: false, speakingVerified: true, confidence: 'ok', weak: [] },
      settings: { volume: 0, musicVolume: 0, sfxVolume: 0, autoSpeak: false, voiceAsSpelling: true },
    } }));
  }, { character: DEFAULT_CHARACTER, withQuota, day, region, storySeen: [regionStoryId(region), clearStoryId(region)] });
  await page.goto('/englearningapp/');
}

async function openTrial(page: Page) {
  await page.getByRole('button', { name: /守門人的考驗/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: /挑戰區域試煉/ }).click();
  return page.getByRole('dialog', { name: /守門人：/ });
}

async function playTrial(dialog: Locator, count: number, pass: boolean, region = 0) {
  await expect(dialog.locator('.quiz-count')).toContainText(`第 1 / ${count} 題`);
  const questions = await dialog.page().evaluate(async (region): Promise<{ q: Question; speech: boolean; extra: string; utterance: string }[]> => {
    const knowledgePath = '/src/game/knowledge.ts';
    const battlePath = '/src/game/battle.ts';
    const { regionIndex } = await import(knowledgePath);
    const { voiceFallback } = await import(battlePath);
    const questionHelpPath = '/src/game/questionHelp.ts';
    const speechPath = '/src/game/speech.ts';
    const { spellingExtra } = await import(questionHelpPath);
    const { speakableText } = await import(speechPath);
    return [...regionIndex(region).values()].flat().map((raw: Question) => {
      const q = voiceFallback(raw);
      return { q, speech: raw.type === 'voice', extra: spellingExtra(q), utterance: q.speak ? speakableText(q.speak) : '' };
    });
  }, region);
  let speakingErrors = 0;
  for (let i = 0; i < count; i++) {
    await expect(dialog.locator('.quiz-count')).toContainText(`第 ${i + 1} / ${count} 題`);
    const prompt = await dialog.locator('.q-desc').evaluate(el => el.firstChild?.textContent);
    const options = await dialog.locator('.option-btn').allTextContents();
    const extra = await dialog.locator('.q-extra').allTextContents();
    let matches = questions.filter(({ q, extra: hint }) => (hint ? `（${hint}）` : undefined) === extra[0] && q.desc.replace(/^【[^】]*試煉】/, '') === prompt &&
      (q.type === 'choice' ? q.options?.every((o, index) => o[0] + o.slice(2) === options[index]) : options.length === 0));
    const replay = dialog.getByRole('button', { name: /再聽一次/ });
    if (await replay.count()) {
      await dialog.page().locator('html').evaluate(el => el.removeAttribute('data-test-utterance'));
      await dialog.page().clock.fastForward(1_000);
      await replay.click();
      const html = dialog.page().locator('html');
      await expect(html).toHaveAttribute('data-test-utterance', /[A-Za-z]/);
      const utterance = await html.getAttribute('data-test-utterance');
      matches = matches.filter(candidate => candidate.utterance === utterance);
    }
    const [answer] = matches;
    expect(answer, `找不到試煉題：${prompt} ${extra.join('')}`).toBeDefined();
    expect(new Set(matches.map(({ q }) => q.ans)).size, `題目提示對應多個答案：${prompt}`).toBe(1);
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

const regionNames = ['翠綠草原', '迷霧森林', '碧藍海岸', '黃金沙漠', '赤岩峽谷', '極光雪嶺', '雷鳴高原', '熔岩魔域', '王城'];

async function verifyUnlock(page: Page, trial: Locator, region = 0) {
  await expect(trial).toContainText('試煉通過！');
  await expect(trial).toContainText('本次使用拼寫備援，口說未驗證');
  await trial.getByRole('button', { name: `前往「${regionNames[region + 1]}」` }).click();
  await page.getByRole('dialog', { name: '故事' }).getByRole('button', { name: /略過整段/ }).click();
  await page.reload();
  expect(await readSave(page)).toMatchObject({ unlockedIndex: region + 1, placement: { verified: true, speakingVerified: false } });
  await expect(page.getByRole('button', { name: new RegExp(`踏上征途.*${regionNames[region + 1]}`) })).toBeVisible();
}

async function prepareSeal(page: Page, region: number) {
  await page.evaluate(async ({ day, region }) => {
    const loaderPath = '/src/game/questions/bank/loader.ts';
    const knowledgePath = '/src/game/knowledge.ts';
    const battlePath = '/src/game/battle.ts';
    const { loadBank } = await import(loaderPath);
    const { regionIndex } = await import(knowledgePath);
    const { questionKey } = await import(battlePath);
    await loadBank(region);
    const now = Date.now();
    const save = JSON.parse(localStorage.getItem('english-rpg-save')!);
    save.state.knowledge = Object.fromEntries([...regionIndex(region)].map(([key, questions]) => [key, {
      wins: [now - 3 * day, now - 2 * day, now - day], dueAt: now + day,
      ...(key.startsWith('g:') ? { items: [...new Set(questions.map(questionKey))].slice(0, 2) } : {}),
    }]));
    localStorage.setItem('english-rpg-save', JSON.stringify(save));
  }, { day, region });
  await page.reload();
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
    await prepareSeal(page, 0);
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

const extraViewports = [[375, 812], [1366, 768], [1920, 1080]];
for (let region = 1; region < 8; region++) {
  for (const strict of [false, true]) {
    const [width, height] = extraViewports[(region + Number(strict)) % extraViewports.length];
    test(`續驗 ${regionNames[region]} ${strict ? '高標準' : '普通'}試煉解鎖 ${width}x${height}`, async ({ page }, testInfo) => {
      test.setTimeout(90_000);
      await page.setViewportSize({ width, height });
      await setup(page, false, region);
      if (!strict) await prepareSeal(page, region);
      const trial = await openTrial(page);
      await expect(trial).toContainText(strict ? '高標準試煉（40題）' : '封印已經重建');
      await trial.getByRole('button', { name: '開始試煉' }).click();
      await playTrial(trial, strict ? 40 : 24, true, region);
      if (strict) expect((await readSave(page)).strictTrials[region]).toHaveLength(1);
      else expect((await readSave(page)).strictTrials).toEqual({});
      if (region >= 6) {
        await page.screenshot({ path: testInfo.outputPath('trial-passed.png'), animations: 'disabled' });
      }
      await verifyUnlock(page, trial, region);
    });
  }
}
