import { expect, test, type Locator } from '@playwright/test';
import { DEFAULT_CHARACTER } from '../src/game/character';
import type { Question } from '../src/game/types';

async function answerFloor(dialog: Locator, floor: number, correctCount: number) {
  await expect(dialog.locator('.quiz-count')).toContainText(`第 ${floor} 層・第 1 / 5 題`);
  const region = floor === 30 ? 8 : floor - 31;
  const questions = await dialog.page().evaluate(async (region): Promise<Question[]> => {
    // 本測試走 Vite 開發伺服器。從該區題庫讀核對資料，作答仍走可見的按鈕與欄位。
    const questionModule = '/src/game/QuestionData.ts';
    const battleModule = '/src/game/battle.ts';
    const { getPool, isBankLoaded, LEVELS } = await import(questionModule);
    const { voiceFallback } = await import(battleModule);
    if (!isBankLoaded(region)) throw Error(`區域題庫 ${region} 尚未載入`);
    const pool = getPool(LEVELS[region]);
    return [...pool.normal, ...pool.boss].map(voiceFallback);
  }, region);
  for (let i = 0; i < 5; i++) {
    await expect(dialog.locator('.quiz-count')).toContainText(`第 ${floor} 層・第 ${i + 1} / 5 題`);
    const prompt = await dialog.locator('.q-desc').evaluate(el => el.firstChild?.textContent);
    const options = await dialog.locator('.option-btn').allTextContents();
    const answer = questions.find(q =>
      q.desc.replace(/^【[^】]*試煉】/, '') === prompt &&
      (q.type === 'choice'
        ? q.options?.map(o => o[0] + o.slice(2)).every((o, index) => o === options[index])
        : options.length === 0));
    if (!answer) throw Error(`第 ${floor} 層題目須出自對應區域：${prompt}`);
    const correct = i < correctCount;
    if (answer.type === 'choice') {
      const letter = correct ? answer.ans : answer.ans === 'A' ? 'B' : 'A';
      await dialog.locator('.option-btn').filter({ hasText: new RegExp(`^${letter}`) }).click();
    } else {
      await dialog.getByRole('textbox', { name: '輸入答案' }).fill(correct ? answer.ans : 'WRONGANSWER');
      await dialog.getByRole('button', { name: /確認/ }).click();
    }
    await expect(dialog.locator('.trial-result')).toHaveClass(correct ? /is-correct/ : /is-wrong/);
    await dialog.getByRole('button', { name: i === 4 ? /看結果/ : /下一題/ }).click();
  }
}

for (const [width, height] of [[375, 812], [1366, 768], [1920, 1080]]) {
  test(`時空之塔標準與無盡首領的預覽、重試與獎勵 ${width}x${height}`, async ({ page }, testInfo) => {
    const floor = width === 1920 ? 35 : 30;
    await page.setViewportSize({ width, height });
    await page.addInitScript(({ character, floor }) => {
      if (localStorage.getItem('english-rpg-save')) return;
      localStorage.setItem('english-rpg-save', JSON.stringify({ version: 26, state: {
        character, tutorialDone: true, prologueDone: true, towerFloor: floor - 1, gold: 1000,
        tickets: 0, classBadges: 0, heroShards: {}, heroes: ['knight'],
        settings: { volume: 0, sfxVolume: 0, musicVolume: 0, autoSpeak: false, voiceAsSpelling: true },
      } }));
    }, { character: DEFAULT_CHARACTER, floor });
    let releaseBank: (() => void) | undefined;
    if (width === 375) {
      const ready = new Promise<void>(resolve => { releaseBank = resolve; });
      await page.route(/\/r8\.json(?:\?|$)/, async route => {
        await ready;
        await route.continue();
      });
    }
    await page.goto('/englearningapp/');
    const open = async () => {
      await page.getByRole('button', { name: /副本與挑戰/ }).click();
      await page.getByRole('button', { name: /攀登時空塔/ }).click();
    };
    const dialog = page.getByRole('dialog', { name: /時空之塔/ });
    const readSave = () => page.evaluate(() => JSON.parse(localStorage.getItem('english-rpg-save')!).state);
    const initial = { towerFloor: floor - 1, gold: 1000, tickets: 0, classBadges: 0, heroShards: {} };
    await open();
    await expect(dialog.locator('.tower-floor-num')).toContainText(`第 ${floor} 層`);
    await expect(dialog.locator('.tower-boss-pill')).toBeVisible();
    await expect(dialog.locator('.tower-rewards-grid')).toContainText(floor === 30 ? '+15' : '+20');
    await expect(dialog.getByText('英雄召喚券', { exact: true })).toHaveCount(floor === 30 ? 0 : 1);
    const baseXp = floor === 30 ? 630 : 351;
    await expect(dialog.locator('.tower-rewards-grid')).toContainText(`+${baseXp}`);
    await page.screenshot({ path: testInfo.outputPath('tower.png'), animations: 'disabled', timeout: 3000 });
    await dialog.getByRole('button', { name: /開始挑戰/ }).click();
    if (releaseBank) {
      await expect(dialog.getByRole('button', { name: '載入本層題目…' })).toBeDisabled();
      await expect(dialog.locator('.quiz-count')).toHaveCount(0);
      releaseBank();
    }
    await answerFloor(dialog, floor, 3);
    await expect(dialog.getByRole('heading', { name: '再接再厲！' })).toBeVisible();
    const failed = await readSave();
    expect(failed).toMatchObject(initial);
    expect(failed.heroShards).toEqual({});
    expect(failed.xpLedger['offered:tower']).toBeUndefined();

    await dialog.getByRole('button', { name: /重新挑戰/ }).click();
    await answerFloor(dialog, floor, 4);
    await expect(dialog.getByRole('heading', { name: /挑戰成功/ })).toBeVisible();
    let earned = floor === 30
      ? { towerFloor: 30, gold: 4000, tickets: 0, classBadges: 2, heroShards: { knight: 15 } }
      : { towerFloor: 35, gold: 1825, tickets: 1, classBadges: 4, heroShards: { knight: 20 } };
    expect(await readSave()).toMatchObject({ ...earned, xpLedger: { 'offered:tower': baseXp } });
    if (floor === 30) {
      await expect(dialog).toHaveAccessibleName(/英雄時空之塔/);
      await dialog.getByRole('button', { name: /查看塔樓總覽/ }).click();
      await expect(dialog).toHaveAccessibleName(/無盡時空之塔/);
      await expect(dialog.locator('.tower-floor-num')).toContainText('第 31 層');
      await expect(dialog.locator('.tower-rewards-grid')).toContainText('+8');
      await expect(dialog.getByText('英雄召喚券', { exact: true })).toHaveCount(0);
      await dialog.getByRole('button', { name: /開始挑戰第 31 層/ }).click();
      await expect(dialog.locator('.quiz-count')).toContainText('無盡 第 31 層');
      await answerFloor(dialog, 31, 5);
      await expect(dialog.getByRole('heading', { name: /挑戰成功/ })).toBeVisible();
      earned = { towerFloor: 31, gold: 4765, tickets: 0, classBadges: 4, heroShards: { knight: 23 } };
      expect(await readSave()).toMatchObject(earned);
    }
    await page.reload();
    await open();
    await expect(dialog.locator('.tower-floor-num')).toContainText(`第 ${earned.towerFloor + 1} 層`);
    expect(await readSave()).toMatchObject(earned);
  });
}
