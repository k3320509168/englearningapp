import { expect, test } from '@playwright/test';
import { DEFAULT_CHARACTER } from '../src/game/character';

for (const [width, height] of [[375, 812], [1366, 768], [1920, 1080]]) {
  test(`素材本完整作答、逾時、獎勵與次數 ${width}x${height}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height });
    const startTime = new Date('2026-11-23T12:00:00+08:00');
    await page.clock.install({ time: startTime });
    await page.addInitScript(character => {
      if (localStorage.getItem('english-rpg-save')) return;
      const codex = Object.fromEntries(Array.from({ length: 30 }, (_, i) => [`fixture-${i}`, {
        correct: 1, wrong: 0, firstSeenAt: 1,
        question: { type: 'spell', desc: `請拼出：蘋果（練習 ${i + 1}）`, ans: 'APPLE', speak: 'apple' },
      }]));
      // 題庫圖鑑會合併相同知識的拼字；使用一組明確的不同答案。
      for (const [i, entry] of Object.values(codex).entries()) {
        const suffix = String.fromCharCode(65 + Math.floor(i / 26), 65 + i % 26);
        entry.question.ans = 'APPLE' + suffix;
        entry.question.speak = entry.question.ans.toLowerCase();
        entry.question.desc = `請拼出：練習 ${i + 1} [${entry.question.ans}]`;
      }
      localStorage.setItem('english-rpg-save', JSON.stringify({ version: 26, state: {
        character, tutorialDone: true, prologueDone: true, gold: 1000, codex,
        settings: { volume: 0, sfxVolume: 0, musicVolume: 0, autoSpeak: false, voiceAsSpelling: true },
      } }));
    }, DEFAULT_CHARACTER);
    await page.goto('/englearningapp/');
    const openRush = async () => {
      await page.getByRole('button', { name: /副本與挑戰/ }).click();
      await page.getByRole('button', { name: /極速挑戰/ }).click();
    };
    const begin = () => page.getByRole('button', { name: '開始！', exact: true }).click();
    const close = () => page.getByRole('dialog').getByLabel('關閉', { exact: true }).click();
    const getSave = () => page.evaluate(() => JSON.parse(localStorage.getItem('english-rpg-save')!).state);
    const answer = async (value?: string) => {
      const prompt = await page.locator('.q-desc').textContent();
      await page.getByRole('textbox', { name: '輸入答案' }).fill(value ?? prompt?.match(/\[(APPLE[A-Z]+)\]/)?.[1] ?? '');
      await page.getByRole('button', { name: '確認 ⏎' }).click();
    };

    await openRush();
    await begin();
    const initial = await page.locator('.q-desc').textContent();
    await answer('');
    await expect(page.locator('.q-desc')).toHaveText(initial!);
    await answer();
    await answer();
    await answer('WRONG');
    await expect(page.getByRole('status')).toContainText('上一個錯題');
    await expect(page.locator('.rush-score')).toContainText('✔ 2・🔥 0 combo');
    await page.screenshot({ path: testInfo.outputPath('rush.png'), timeout: 3000 });
    const lateAnswer = (await page.locator('.q-desc').textContent())?.match(/\[(APPLE[A-Z]+)\]/)?.[1];
    expect(lateAnswer).toBeTruthy();
    await page.getByRole('textbox', { name: '輸入答案' }).fill(lateAnswer!);
    // 跳日曆時間而不執行倒數 callback，模擬題面尚未刷新就收到送出。
    await page.clock.setSystemTime((await page.evaluate(() => Date.now())) + 61_000);
    await page.locator('form.trial-input').evaluate(form => (form as HTMLFormElement).requestSubmit());
    await page.clock.fastForward(200);
    await expect(page.getByRole('dialog')).toContainText('答對 2 題、最高 2 combo');
    expect(await getSave()).toMatchObject({ gold: 1190, rushRuns: 1, materials: { ore: 1 } });
    await page.clock.fastForward(120_000);
    expect((await getSave()).gold).toBe(1190);

    await page.getByRole('button', { name: '完成', exact: true }).click();
    await page.reload();
    await openRush();
    await expect(page.getByRole('dialog')).toContainText('2 / 3 次');
    await begin();
    await close();
    expect(await getSave()).toMatchObject({ gold: 1190, rushRuns: 2 });
    await openRush();
    await begin();
    await page.clock.fastForward(61_000);
    await expect(page.getByRole('dialog')).toContainText('得到 🪙 0、⭐ 經驗 0、🪨 礦石 0');
    await page.getByRole('button', { name: '完成', exact: true }).click();
    await page.reload();
    await openRush();
    await expect(page.getByRole('button', { name: '今天的次數用完了' })).toBeDisabled();
    expect(await getSave()).toMatchObject({ gold: 1190, rushRuns: 3, materials: { ore: 1 } });
    await close();
    await page.clock.setSystemTime(startTime.getTime() + 86_400_000);
    await openRush();
    await expect(page.getByRole('dialog')).toContainText('3 / 3 次');
    await begin();
    await page.clock.fastForward(61_000);
    await expect(page.getByRole('dialog')).toContainText('得到 🪙 150、⭐ 經驗 0、🪨 礦石 1');
    expect(await getSave()).toMatchObject({ gold: 1340, rushRuns: 1, materials: { ore: 2 } });
  });
}
