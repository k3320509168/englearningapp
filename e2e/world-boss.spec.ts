import { expect, test } from '@playwright/test';
import { DEFAULT_CHARACTER } from '../src/game/character';

test.use({ timezoneId: 'Asia/Taipei' });

for (const [width, height] of [[375, 812], [1366, 768], [1920, 1080]]) {
  test(`世界王鍵盤模式、逾時重試、同週再勝及週一首勝 ${width}x${height}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height });
    const sunday = new Date('2026-11-22T12:00:00+08:00');
    await page.clock.install({ time: sunday });
    await page.addInitScript(character => {
      // 瀏覽器有 API，仍須遵守玩家選擇的文字模式。
      class UnexpectedRecognition {
        constructor() { throw Error('keyboard mode requested speech recognition'); }
      }
      Object.defineProperty(window, 'SpeechRecognition', { value: UnexpectedRecognition });
      if (localStorage.getItem('english-rpg-save')) return;
      localStorage.setItem('english-rpg-save', JSON.stringify({ version: 26, state: {
        character, prologueDone: true, tutorialDone: true, gold: 1000, weaponTickets: 0,
        settings: { volume: 0, sfxVolume: 0, musicVolume: 0, autoSpeak: false, voiceAsSpelling: true },
      } }));
    }, DEFAULT_CHARACTER);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/englearningapp/');
    const open = async () => {
      await page.getByRole('button', { name: /副本與挑戰/ }).click();
      await page.getByRole('button', { name: /開啟詠唱突襲/ }).click();
      await page.getByRole('button', { name: /開始詠唱破盾突襲/ }).click();
    };
    const keyword = page.getByRole('textbox', { name: '拼寫關鍵詞' });
    const spell = async (answer: string) => { await keyword.fill(answer); await keyword.press('Enter'); };
    const win = async () => {
      for (const answer of ['SACRED', 'GUARDIANS', 'ETERNITY', 'RESOLVE', 'DRAGONS']) await spell(answer);
      await expect(page.getByRole('heading', { name: '世界王討伐大獲全勝！' })).toBeVisible();
    };
    const save = () => page.evaluate(() => JSON.parse(localStorage.getItem('english-rpg-save')!).state);

    await open();
    await expect(page.getByRole('button', { name: /開始朗讀/ })).toHaveCount(0);
    await spell('INCORRECT');
    await expect(page.getByText(/拼寫未吻合/)).toBeVisible();
    for (const answer of ['SACRED', 'GUARDIANS', 'ETERNITY', 'RESOLVE']) await spell(answer);
    await keyword.fill('DRAGONS');
    await page.screenshot({ path: testInfo.outputPath('world-boss.png'), timeout: 3000 });
    await page.clock.setSystemTime((await page.evaluate(() => Date.now())) + 61_000);
    await page.locator('form').evaluate(form => (form as HTMLFormElement).requestSubmit());
    await page.clock.fastForward(1200);
    await expect(page.getByRole('heading', { name: /末日審判降臨/ })).toBeVisible();
    expect(await save()).toMatchObject({ gold: 1000, weaponTickets: 0 });

    await page.getByRole('button', { name: /再次發起挑戰/ }).click();
    await win();
    expect(await save()).toMatchObject({ gold: 4000, weaponTickets: 2 });
    await page.getByRole('button', { name: '收下獎勵並返回' }).click();
    await page.reload();
    await open();
    await win();
    expect(await save()).toMatchObject({ gold: 4150, weaponTickets: 2 });

    await page.getByRole('button', { name: '收下獎勵並返回' }).click();
    await page.clock.setSystemTime(sunday.getTime() + 86_400_000);
    await page.reload();
    await open();
    await win();
    expect(await save()).toMatchObject({ gold: 7150, weaponTickets: 4 });
    expect(errors).toEqual([]);
  });
}
