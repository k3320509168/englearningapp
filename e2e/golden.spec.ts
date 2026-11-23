import { expect, test, type Page } from '@playwright/test';
import { DEFAULT_CHARACTER } from '../src/game/character';
import { ALL_HINTS } from '../src/game/hints';
import type { useBattleStore } from '../src/store/battleStore';

type GameWindow = Window & { __battle: typeof useBattleStore };

const readSave = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('english-rpg-save')!).state);

async function answer(page: Page, correct: boolean) {
  const q = await page.evaluate(() => (window as GameWindow).__battle.getState().question);
  if (!q) throw Error('黃金之路應出現一題');
  if (q.type === 'choice') {
    const letter = correct ? q.ans : q.ans === 'A' ? 'B' : 'A';
    await page.locator('.answer-panel .option-btn').filter({ hasText: new RegExp(`^${letter}`) }).click();
  } else {
    await page.keyboard.type(correct ? q.ans : q.ans === 'Q' ? 'Z' : 'Q');
    await page.getByRole('button', { name: '送出 ⏎', exact: true }).click();
  }
}

for (const [width, height] of [[375, 812], [1366, 768], [1920, 1080]]) {
  test(`黃金之路取消冷載入、答錯止步、重新挑戰及重載 ${width}x${height}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height });
    await page.addInitScript(({ character, hintsSeen }) => {
      if (localStorage.getItem('english-rpg-save')) return;
      localStorage.setItem('english-rpg-save', JSON.stringify({ version: 26, state: {
        character, prologueDone: true, tutorialDone: true, gold: 1000, tickets: 2,
        hintsSeen,
        settings: { volume: 0, musicVolume: 0, sfxVolume: 0, autoSpeak: false, voiceAsSpelling: true, showLessons: false },
      } }));
    }, { character: DEFAULT_CHARACTER, hintsSeen: ALL_HINTS });
    let releaseBank = () => {};
    const blocked = new Promise<void>(resolve => { releaseBank = resolve; });
    await page.route(/\/r8\.json(?:\?|$)/, async route => {
      await blocked;
      await route.continue();
    });
    await page.goto('/englearningapp/');
    const open = async () => {
      await page.getByRole('button', { name: /副本與挑戰/ }).click();
      await page.getByRole('button', { name: /踏上黃金之路/ }).click();
    };
    const golden = page.getByRole('dialog', { name: '👑 黃金之路', exact: true });
    const begin = () => golden.getByRole('button', { name: '踏上黃金之路', exact: true }).click();
    await open();
    await expect(golden).toContainText('首次通關');
    await begin();
    await expect(golden.getByRole('button', { name: '載入九區題庫…' })).toBeDisabled();
    await page.screenshot({ path: testInfo.outputPath('golden-loading.png'), animations: 'disabled', timeout: 3000 });
    await golden.getByRole('button', { name: '取消載入' }).click();
    // 切到其他介面，確認遲到的載入不會把玩家拉進黃金之路。
    await page.getByRole('button', { name: /副本與挑戰/ }).click();
    const received = page.waitForResponse(response => /\/r8\.json(?:\?|$)/.test(response.url()) && response.ok());
    releaseBank();
    await received;
    await page.waitForFunction(async () => {
      const modulePath = '/src/game/QuestionData.ts';
      const { isBankLoaded } = await import(modulePath);
      return isBankLoaded(8);
    });
    await expect(page.getByRole('dialog', { name: /冒險副本與地下城挑戰/ })).toBeVisible();
    expect(await page.evaluate(() => (window as GameWindow).__battle.getState().active)).toBe(false);

    await page.getByRole('button', { name: /踏上黃金之路/ }).click();
    await begin();
    await expect(page.locator('.answer-panel')).toBeVisible();
    const next = page.getByRole('button', { name: /前往下一關/ });
    for (let i = 0; i < 8 && !await next.isVisible(); i++) {
      await answer(page, true);
    }
    await expect(next).toBeVisible();
    const stageGold = (await readSave(page)).gold;
    expect(stageGold).toBeGreaterThan(1000);
    await next.click();
    await expect(page.locator('.answer-panel')).toBeVisible();
    await answer(page, false);
    await expect(page.getByText(/黃金之路：在第 2 \/ 45 關止步/)).toBeVisible();
    expect(await readSave(page)).toMatchObject({ goldenBest: 1, gold: stageGold, tickets: 2, player: { xp: 0 } });
    await page.getByRole('button', { name: '重新挑戰', exact: true }).click();
    await expect(page.locator('.answer-panel')).toBeVisible();
    expect(await page.evaluate(() => (window as GameWindow).__battle.getState().stageIdx)).toBe(0);
    await page.getByRole('button', { name: '撤退回地圖' }).click();
    await page.getByRole('dialog', { name: '確定撤退' }).getByRole('button', { name: /撤退/ }).click();
    await page.reload();
    await open();
    await expect(golden).toContainText('最佳紀錄：通過 1 / 45 關');
  });
}
