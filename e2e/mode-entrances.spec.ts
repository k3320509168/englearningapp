import { expect, test } from '@playwright/test';
import { DEFAULT_CHARACTER } from '../src/game/character';

const entrances: [RegExp, RegExp][] = [
  [/護送商隊/, /護送商隊/], [/極速挑戰/, /每日素材本/],
  [/進入修煉/, /今日複習/], [/攀登時空塔/, /時空之塔/],
  [/迎戰魔王/, /魔王挑戰/], [/踏上黃金之路/, /黃金之路/],
  [/開啟詠唱突襲/, /世界王突襲/],
];

test.describe.configure({ mode: 'parallel' });
const playerRegions = [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8];
const viewports = [[375, 812], [1366, 768], [1920, 1080]];
for (const [width, height, region] of viewports.flatMap(([width, height]) =>
  playerRegions.map(region => [width, height, region]))) {
  test(`副本入口、結束返回及版面 R${region} ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(({ character, region }) => {
      if (localStorage.getItem('english-rpg-save')) return;
      localStorage.setItem('english-rpg-save', JSON.stringify({ version: 26, state: {
        character, prologueDone: region >= 0, tutorialDone: true, unlockedIndex: Math.max(0, region),
        settings: { musicVolume: 0, sfxVolume: 0, volume: 0, autoSpeak: false, voiceAsSpelling: true },
      } }));
    }, { character: { ...DEFAULT_CHARACTER, name: '矩陣驗收' }, region });
    await page.goto('/englearningapp/');
    const adventure = page.getByRole('button', { name: /副本與挑戰/ });
    for (const [entry, name] of entrances) {
      await adventure.click();
      await page.getByRole('button', { name: entry }).click();
      const dialog = page.getByRole('dialog', { name });
      await expect(dialog).toBeVisible();
      expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
      await dialog.getByLabel('關閉', { exact: true }).click();
      await expect(adventure).toBeVisible();
    }
    expect(errors).toEqual([]);
  });
}
