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

for (const [width, height] of viewports) {
  test(`雲端存檔版本變動提示和兩份比較卡 ${width}x${height}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height });
    await page.addInitScript(character => {
      if (localStorage.getItem('english-rpg-save')) return;
      localStorage.setItem('english-rpg-save', JSON.stringify({ version: 27, state: {
        character, prologueDone: true, tutorialDone: true,
        settings: { musicVolume: 0, sfxVolume: 0, volume: 0, autoSpeak: false, voiceAsSpelling: true },
      } }));
    }, DEFAULT_CHARACTER);
    await page.goto('/englearningapp/');
    await page.evaluate(async () => {
      const entry = document.querySelector<HTMLScriptElement>('script[type="module"][src*="/src/main.tsx"]');
      if (!entry) throw Error('找不到 Vite 遊戲入口');
      const modulePath = new URL('./cloud/cloudSave.ts', entry.src).href;
      const { useCloudStore } = await import(modulePath);
      const updatedAt = '2026-11-27T08:12:30.000Z';
      const data = { state: { character: { name: '雲端測試勇者' } }, version: 27 };
      useCloudStore.setState({ status: 'conflict', conflict: {
        local: { name: '本機測試勇者', level: 17, regions: 1, gold: 450 },
        cloud: { name: '雲端測試勇者', level: 121, regions: 6, gold: 2200, updatedAt },
        snapshot: { data, updatedAt }, notice: '雲端已有更新，請重新比較兩份存檔。',
      } });
    });
    const dialog = page.getByRole('dialog', { name: '選擇要保留的存檔' });
    await expect(dialog.getByRole('status')).toContainText('重新比較');
    await expect(dialog.getByRole('button', { name: /雲端的存檔.*2200/ })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /這台裝置的存檔.*450/ })).toBeVisible();
    expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('cloud-conflict.png'), animations: 'disabled', timeout: 5000 });
  });
}
