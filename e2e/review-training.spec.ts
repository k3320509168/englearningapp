import { expect, test, type Page } from '@playwright/test';
import { DEFAULT_CHARACTER } from '../src/game/character';

const WORDS = ['APPLE', 'BOOK', 'CLOUD', 'DOOR', 'EARTH', 'FOREST', 'GARDEN', 'HOUSE', 'ISLAND', 'JACKET'];
const DAY = 86_400_000;

async function openTraining(page: Page, masterLast = false) {
  await page.clock.install({ time: new Date('2026-11-23T12:00:00+08:00') });
  await page.addInitScript(({ character, words, masterLast, day }) => {
    if (localStorage.getItem('english-rpg-save')) return;
    const now = Date.now();
    const mistakes = Object.fromEntries((masterLast ? words.slice(0, 1) : words).map((word, index) => [
      `spell:${word}`, {
        question: { type: 'spell', desc: `請拼出：測試詞 [${word}]`, ans: word, speak: word.toLowerCase() },
        wrongCount: 1, lastWrongAt: now - day, box: masterLast ? 2 : 0, dueAt: now - day + index,
      },
    ]));
    localStorage.setItem('english-rpg-save', JSON.stringify({ version: 26, state: {
      character, tutorialDone: true, prologueDone: true, mistakes, gold: 1000, sweepTickets: 0,
      settings: { volume: 0, musicVolume: 0, sfxVolume: 0, autoSpeak: false, voiceAsSpelling: true },
    } }));
  }, { character: DEFAULT_CHARACTER, words: WORDS, masterLast, day: DAY });
  await page.goto('/englearningapp/');
  await page.getByRole('button', { name: /副本與挑戰/ }).click();
  await page.getByRole('button', { name: /進入修煉/ }).click();
  await page.getByRole('button', { name: /進入修煉場/ }).click();
}

async function answer(page: Page, correct = true) {
  const topic = await page.locator('.quiz .q-desc').textContent();
  const word = topic?.match(/\[([A-Z]+)\]/)?.[1];
  expect(word).toBeTruthy();
  await page.getByRole('textbox', { name: '輸入答案' }).fill(correct ? word! : 'WRONGANSWER');
  await page.getByRole('button', { name: /確認/ }).click();
  await expect(page.locator('.trial-result')).toHaveClass(correct ? /is-correct/ : /is-wrong/);
  await page.getByRole('button', { name: /下一題|看結算/ }).click();
}

const readSave = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('english-rpg-save')!).state);

test.use({ timezoneId: 'Asia/Taipei' });

for (const [width, height] of [[375, 812], [1366, 768], [1920, 1080]]) {
  test(`錯題修煉的獎勵每日上限、同日複習和重載 ${width}x${height}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height });
    await openTraining(page);
    const dialog = page.getByRole('dialog', { name: /錯題修煉場/ });
    await expect(dialog).toContainText('每天上限 5 張');
    await page.screenshot({ path: testInfo.outputPath('training.png'), animations: 'disabled', timeout: 3000 });
    for (let i = 0; i < 10; i++) await answer(page);
    await expect(dialog).toContainText('答對 10 / 10 題（最高連對 10）');
    await expect(dialog).toContainText('目前沒有到期題');
    const afterFirst = await readSave(page);
    expect(afterFirst).toMatchObject({ gold: 1100, sweepTickets: 5, trainingGiven: 5, trainingGoldCount: 10 });
    for (const word of WORDS) expect(afterFirst.mistakes[`spell:${word}`].box).toBe(1);

    await dialog.getByRole('button', { name: /再修煉一組/ }).click();
    for (let i = 0; i < 10; i++) await answer(page);
    const afterSecond = await readSave(page);
    expect(afterSecond).toMatchObject({ gold: 1200, sweepTickets: 5, trainingGiven: 5, trainingGoldCount: 20 });
    expect(afterSecond.mistakes).toEqual(afterFirst.mistakes);

    await dialog.getByLabel('關閉').click();
    await page.getByRole('button', { name: /副本與挑戰/ }).click();
    await expect(page.getByRole('dialog')).toContainText('錯題本有 10 題，可自由修煉');
    await page.getByRole('button', { name: /進入修煉/ }).click();
    await page.getByRole('button', { name: /自由修煉錯題/ }).click();
    await answer(page);
    await answer(page, false);
    expect(await readSave(page)).toMatchObject({ gold: 1200, trainingGoldCount: 20, sweepTickets: 5 });
    await dialog.getByRole('button', { name: '回到清單' }).click();
    await expect(page.getByRole('dialog', { name: /今日複習/ })).toContainText('待複習重點（1）');
    await page.reload();
    await page.getByRole('button', { name: /副本與挑戰/ }).click();
    await page.getByRole('button', { name: /進入修煉/ }).click();
    await expect(page.getByRole('dialog', { name: /今日複習/ })).toContainText('持有掃蕩券 🎟️ 5');
  });
}

test('最後一題掌握後可以返回空清單', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await openTraining(page, true);
  await answer(page);
  const dialog = page.getByRole('dialog', { name: /錯題修煉場/ });
  await expect(dialog).toContainText('答對 1 / 1 題');
  await expect(dialog.getByRole('button', { name: /再修煉一組/ })).toHaveCount(0);
  expect((await readSave(page)).mistakes).toEqual({});
  await dialog.getByRole('button', { name: /返回錯題清單/ }).click();
  await expect(page.getByRole('dialog', { name: /今日複習/ })).toContainText('今天沒有到期的複習題目');
});
