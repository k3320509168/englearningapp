import { expect, test, type Page } from '@playwright/test';
import { DEFAULT_CHARACTER } from '../src/game/character';
import { ALL_HINTS } from '../src/game/hints';
import { mapStoryId, regionStoryId } from '../src/game/story';
import type { useBattleStore } from '../src/store/battleStore';

type GameWindow = Window & { __battle: typeof useBattleStore };
const levels = ['Pre-A1', 'A1', 'A2', 'A2+', 'B1', 'B1+', 'B2', 'B2+', 'C1', 'C2'];
const viewports = [[375, 812], [1366, 768], [1920, 1080]];
const readSave = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('english-rpg-save')!).state);
const journey = (page: Page) => page.getByRole('button', { name: /踏上征途|繼續征途/ });

async function seedPlayer(page: Page, region: number, showIntro = false) {
  const storySeen = region < 0 || showIntro ? [] : [regionStoryId(region), mapStoryId(region, 0, 'intro')];
  await page.addInitScript(({ character, region, storySeen, hintsSeen }) => {
    if (localStorage.getItem('english-rpg-save')) return;
    localStorage.setItem('english-rpg-save', JSON.stringify({ version: 26, state: {
      character, prologueDone: region >= 0, tutorialDone: true, unlockedIndex: Math.max(0, region), storySeen, hintsSeen,
      settings: { volume: 0, musicVolume: 0, sfxVolume: 0, autoSpeak: false, voiceAsSpelling: true, showLessons: false, reduceMotion: true },
    } }));
  }, { character: DEFAULT_CHARACTER, region, storySeen, hintsSeen: ALL_HINTS });
}

async function fightFirstStage(page: Page) {
  for (let i = 0; i < 35; i++) {
    const ready = await page.waitForFunction(() => {
      const state = (window as GameWindow).__battle?.getState();
      return state?.active && ['answering', 'monsterDown', 'gameOver'].includes(state.phase) ? state.phase : null;
    });
    const phase = await ready.jsonValue();
    if (phase === 'monsterDown') return;
    if (phase === 'gameOver') throw Error('玩家在首關答題途中戰敗');
    const question = await page.evaluate(() => (window as GameWindow).__battle.getState().question);
    if (!question) throw Error('戰鬥沒有提供題目');
    if (question.type === 'choice') {
      await page.locator('.answer-panel .option-btn').filter({ hasText: new RegExp(`^${question.ans}`) }).click();
    } else {
      await page.keyboard.type(question.ans);
      await page.getByRole('button', { name: '送出 ⏎', exact: true }).click();
    }
  }
  throw Error('首關尚未結算');
}

for (const [width, height] of viewports) {
  for (const [offset, level] of levels.entries()) {
    test(`主線首關、撤退續接與重載 ${level} ${width}x${height}`, async ({ page }, testInfo) => {
      const region = offset - 1;
      await page.setViewportSize({ width, height });
      await seedPlayer(page, region);
      await page.goto('/englearningapp/');
      await journey(page).click();
      if (region < 0) await page.getByRole('button', { name: /略過整段/ }).click();
      await expect(page.locator('.answer-panel')).toBeVisible();
      const levelKey = await page.evaluate(() => (window as GameWindow).__battle.getState().levelKey);
      if (region < 0) expect(levelKey).toBe('PRE');
      else expect(levelKey.split(' ')[0]).toBe(level);
      await fightFirstStage(page);
      const next = page.getByRole('button', { name: /前往下一關/ });
      await expect(next).toBeVisible();
      if (region < 0 || region === 8) {
        await page.screenshot({ path: testInfo.outputPath('mainline-clear.png'), animations: 'disabled', timeout: 3000 });
      }
      await next.click();
      await expect(page.locator('.answer-panel')).toBeVisible();
      expect((await readSave(page)).levelProgress[levelKey]).toBe(1);
      await page.getByRole('button', { name: '撤退回地圖' }).click();
      await page.getByRole('dialog', { name: '確定撤退' }).getByRole('button', { name: /撤退/ }).click();
      await page.reload();
      await journey(page).click();
      await expect(page.locator('.answer-panel')).toBeVisible();
      const resumed = await page.evaluate(() => {
        const s = (window as GameWindow).__battle.getState();
        return { level: s.levelKey, stage: s.stageIdx, mode: s.mode };
      });
      expect(resumed).toEqual({ level: levelKey, stage: 1, mode: 'normal' });
    });
  }
}

test('主線題庫遲到時，已開啟的副本介面保留控制權', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await seedPlayer(page, 8);
  let releaseBank = () => {};
  const blocked = new Promise<void>(resolve => { releaseBank = resolve; });
  await page.route(/\/r8\.json(?:\?|$)/, async route => {
    await blocked;
    await route.continue();
  });
  await page.goto('/englearningapp/');
  await journey(page).click();
  await expect(page.getByRole('button', { name: /載入區域題庫/ })).toBeDisabled();
  await page.getByRole('button', { name: /副本與挑戰/ }).click();
  const adventures = page.getByRole('dialog', { name: /冒險副本與地下城挑戰/ });
  await expect(adventures).toBeVisible();
  releaseBank();
  await page.evaluate(async () => {
    const path = '/src/game/questions/bank/loader.ts';
    const { loadBank } = await import(path);
    await loadBank(8);
  });
  expect(await page.evaluate(() => (window as GameWindow).__battle.getState().active)).toBe(false);
  await expect(adventures).toBeVisible();
  await adventures.getByRole('button', { name: '關閉' }).click();
  await journey(page).click();
  await expect(page.locator('.answer-panel')).toBeVisible();
});

test('關閉區域地圖會取消尚未完成的行走開戰', async ({ page }) => {
  await seedPlayer(page, 0, true);
  await page.clock.install();
  await page.goto('/englearningapp/');
  await journey(page).click();
  await page.getByRole('button', { name: /略過整段/ }).click();
  const region = page.getByRole('dialog', { name: /翠綠草原/ });
  await region.getByRole('button', { name: '新手村', exact: true }).click();
  await region.getByRole('button', { name: '關閉', exact: true }).click();
  await page.clock.fastForward(1000);
  await expect(journey(page)).toBeVisible();
  expect(await page.evaluate(() => (window as GameWindow).__battle.getState().active)).toBe(false);
});

test('Pre-A1 內建題庫不需等待 A1 下載', async ({ page }) => {
  await seedPlayer(page, -1);
  let releaseBank = () => {};
  const blocked = new Promise<void>(resolve => { releaseBank = resolve; });
  await page.route(/\/r0\.json(?:\?|$)/, async route => {
    await blocked;
    await route.continue();
  });
  try {
    await page.goto('/englearningapp/');
    await journey(page).click();
    await page.getByRole('button', { name: /略過整段/ }).click();
    await expect(page.locator('.answer-panel')).toBeVisible();
    expect(await page.evaluate(() => (window as GameWindow).__battle.getState().levelKey)).toBe('PRE');
  } finally {
    releaseBank();
  }
});
