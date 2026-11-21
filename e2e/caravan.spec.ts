import { test, expect } from '@playwright/test';
import { DEFAULT_CHARACTER } from '../src/game/character';
import { mkdir } from 'node:fs/promises';

// 真瀏覽器、新 context、獨立存檔；不接管使用者 Chrome profile。
for (const [width, height] of [[1366, 768], [1920, 1080], [375, 812]]) {
  test(`商隊真實入口、錯誤修正、重載續接與結局 ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(character => {
      if (!localStorage.getItem('english-rpg-save')) localStorage.setItem('english-rpg-save', JSON.stringify({
        version: 26, state: {
          character, prologueDone: true, tutorialDone: true, unlockedIndex: 3,
          gold: 1234, tickets: 7, weaponTickets: 3, storySeen: [],
          settings: { musicVolume: 0, sfxVolume: 0, volume: 0, autoSpeak: false, voiceAsSpelling: true },
        },
      }));
    }, { ...DEFAULT_CHARACTER, name: '情境驗收' });
    await page.goto('/englearningapp/');
    const open = async () => {
      await page.getByRole('button', { name: /副本與挑戰/ }).click();
      await page.getByRole('button', { name: '護送商隊 🛒', exact: true }).click();
    };
    const pick = async (name: string, value: string) => page.locator(`input[name="${name}"][value="${value}"]`).check();
    const noOverflow = async () => {
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      expect(await page.locator('.modal').evaluate(e => e.scrollWidth <= e.clientWidth + 1)).toBe(true);
    };
    const save = () => page.evaluate(() => JSON.parse(localStorage.getItem('english-rpg-save')!).state);
    const screenshotDir = 'docs/question-bank-qa/learning-20261122';
    await mkdir(screenshotDir, { recursive: true });
    await open();
    await expect(page.getByRole('heading', { name: '第一節：選最快的安全路線' })).toBeVisible();
    await noOverflow();
    await page.screenshot({ path: `${screenshotDir}/caravan-${width}x${height}-read.png`, animations: 'disabled' });
    await pick('read-route', 'forest');
    await pick('read-reason', 'under-limit');
    await page.getByRole('button', { name: '確認安排', exact: true }).click();
    await expect(page.locator('.caravan-feedback')).toContainText('再想一下');
    await pick('read-route', 'bridge');
    await page.getByRole('button', { name: '確認安排', exact: true }).click();
    await page.getByRole('button', { name: '下一節', exact: true }).click();
    await page.reload();
    await open();
    await expect(page.getByRole('heading', { name: '第二節：商人帶來新消息' })).toBeVisible();
    await page.getByText('查看原始公告與出發清單', { exact: true }).click();
    await expect(page.getByText(/The stone bridge carries/)).toBeVisible();
    await page.getByRole('button', { name: '顯示字幕（文字輔助）', exact: true }).click();
    await expect(page.locator('.caravan-support')).toContainText('文字輔助');
    await pick('listen-weight', '2.8');
    await pick('listen-route', 'forest');
    await page.getByRole('button', { name: '確認安排', exact: true }).click();
    await page.getByRole('button', { name: '下一節', exact: true }).click();
    await noOverflow();
    await page.locator('.modal-body').evaluate(e => e.scrollTo(0, 0));
    await page.screenshot({ path: `${screenshotDir}/caravan-${width}x${height}-respond.png`, animations: 'disabled' });
    await pick('respond-stance', 'forest');
    await pick('respond-reason', 'over-limit');
    await pick('respond-alternative', 'call');
    await page.getByRole('button', { name: '確認安排', exact: true }).click();
    await expect(page.locator('.caravan-feedback')).toContainText('call the customer');
    await page.getByRole('button', { name: '查看故事結局', exact: true }).click();
    await expect(page.getByRole('heading', { name: '商隊安全抵達！' })).toBeVisible();
    await expect(page.locator('.caravan-complete')).toContainText('文字輔助練習');
    await noOverflow();
    await page.screenshot({ path: `${screenshotDir}/caravan-${width}x${height}-complete.png`, animations: 'disabled' });
    const completed = await save();
    expect(completed).toMatchObject({ gold: 1234, tickets: 7, weaponTickets: 3, unlockedIndex: 3 });
    expect(completed.storySeen).toContain('scenario:caravan:v1:done:respond');
    await page.getByRole('button', { name: '重玩三節（無額外獎勵）', exact: true }).click();
    await expect(page.getByRole('heading', { name: '第一節：選最快的安全路線' })).toBeVisible();
    expect(await save()).toEqual(completed);

    // 從實際塔作答入口確認證據有落地；不讀主控台 store 或注入標準答案。
    await page.getByRole('button', { name: '關閉', exact: true }).click();
    await page.getByRole('button', { name: /副本與挑戰/ }).click();
    await page.getByRole('button', { name: '攀登時空塔 🗼', exact: true }).click();
    await page.getByRole('button', { name: /開始挑戰第 1 層/ }).click();
    await expect(page.locator('.quiz')).toBeVisible();
    const input = page.getByRole('textbox', { name: '輸入答案', exact: true });
    if (await input.count()) {
      await input.fill('ZZZZ');
      await page.getByRole('button', { name: '確認 ⏎', exact: true }).click();
    } else await page.locator('.quiz .option-btn').first().click();
    await expect(page.locator('.trial-result')).toBeVisible();
    const evidence = await page.evaluate(() => JSON.parse(localStorage.getItem('english-rpg-learning-evidence')!));
    expect(evidence.entries).toHaveLength(1);
    expect(evidence.entries[0]).toMatchObject({ task: 'fixed-answer', context: 'unknown' });
    expect(['typed', 'choice']).toContain(evidence.entries[0].mode);

    // 離開測驗再由設定匯入，不能把本機證據誤接到另一份存檔。
    await page.getByRole('button', { name: '關閉', exact: true }).click();
    await page.getByRole('button', { name: /更多/ }).click();
    await page.getByRole('menuitem', { name: '⚙️ 設定', exact: true }).click();
    await page.locator('.settings-tab').filter({ hasText: '存檔帳號' }).click();
    await page.getByLabel('選擇備份檔').setInputFiles({
      name: 'isolated-caravan-test.json', mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({ state: completed, version: 26 })),
    });
    await page.getByRole('button', { name: '確定讀取', exact: true }).click();
    await expect(page.getByText('讀取完成！', { exact: true })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('english-rpg-learning-evidence'))).toBeNull();
    expect((await save()).storySeen).toContain('scenario:caravan:v1:done:respond');
    await page.getByRole('button', { name: '關閉', exact: true }).click();
    await open();
    await page.getByRole('button', { name: '新情境挑戰', exact: true }).click();
    await page.getByRole('button', { name: /Move the meeting downstairs/ }).click();
    await page.getByRole('button', { name: /Start with silent blocking/ }).click();
    await page.getByRole('button', { name: /Water the seedlings from the rain barrel/ }).click();
    await expect(page.getByRole('heading', { name: '三種情境練習完成' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '展覽手冊' })).toHaveCount(0);
    // 模擬經過七天，保留真正遊戲存檔並走正常重入入口。
    const completedAt = Date.now();
    await page.clock.install({ time: new Date(completedAt) });
    await page.clock.fastForward(7 * 24 * 60 * 60 * 1000 + 1000);
    await expect(page.getByRole('heading', { name: '展覽手冊' })).toBeVisible();
    await noOverflow();
    await page.getByRole('button', { name: /Send the current layout/ }).click();
    await page.reload();
    await open();
    await page.getByRole('button', { name: '新情境挑戰', exact: true }).click();
    await expect(page.getByRole('heading', { name: '工作坊教材' })).toBeVisible();
    await page.getByRole('button', { name: /Share the exercise sheet alongside/ }).click();
    await expect(page.getByRole('heading', { name: '延後檢核完成' })).toBeVisible();
    await expect(page.getByText('首次作答答對 1 / 2 題。')).toBeVisible();
    await noOverflow();
    await page.screenshot({ path: `${screenshotDir}/transfer-${width}x${height}-complete.png`, animations: 'disabled' });
    expect(errors).toEqual([]);
  });
}
