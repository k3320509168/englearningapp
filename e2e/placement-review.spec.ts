import { expect, test } from '@playwright/test';
import { DEFAULT_CHARACTER } from '../src/game/character';
import { ADVANCED_REVIEW_READING } from '../src/game/placementReviewReading';

for (const [width, height] of [[1366, 768], [1920, 1080], [375, 812]]) {
  test(`無麥克風的 B2+ 複測可完整作答並保存題目 ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.addInitScript(character => {
      if (localStorage.getItem('english-rpg-save')) return;
      const at = Date.now() - 8 * 86_400_000;
      localStorage.setItem('english-rpg-save', JSON.stringify({ version: 26, state: {
        character, prologueDone: true, tutorialDone: true, unlockedIndex: 6,
        settings: { musicVolume: 0, sfxVolume: 0, volume: 0, autoSpeak: false, voiceAsSpelling: true },
        placement: { level: 7, region: 6, at, verifiedAt: at, verified: true, speakingVerified: false,
          confidence: 'ok', weak: [], placementQuestionKeys: ['previous-test-item'] },
      } }));
    }, { ...DEFAULT_CHARACTER, name: '複測驗收' });
    await page.goto('/englearningapp/');
    await page.getByRole('button', { name: /7 天回顧到期/ }).click();
    await page.getByRole('button', { name: /立即開始 7 天回顧檢查/ }).click();
    let foundAdvanced = false;
    for (let i = 1; i <= 9; i++) {
      await expect(page.locator('.quiz-count')).toContainText(`第 ${i} / 9 題`);
      const question = await page.locator('.q-desc').textContent();
      foundAdvanced ||= question?.includes(ADVANCED_REVIEW_READING[7]![0].desc) ?? false;
      const input = page.getByRole('textbox', { name: '輸入答案' });
      if (await input.count()) {
        await input.fill('ZZZZ');
        await page.getByRole('button', { name: '確認 ⏎', exact: true }).click();
      } else {
        await expect(page.locator('.quiz .option-btn')).not.toHaveCount(0);
        await page.locator('.quiz .option-btn').first().click();
      }
    }
    expect(foundAdvanced).toBe(true);
    await expect(page.getByRole('dialog')).toContainText('口說：0 / 0 題');
    await expect(page.getByRole('dialog')).toContainText('未驗證');
    expect(await page.locator('.modal').evaluate(e => e.scrollWidth <= e.clientWidth + 1)).toBe(true);
    await page.getByRole('button', { name: '知道了', exact: true }).click();
    await page.reload();
    const placement = await page.evaluate(() => JSON.parse(localStorage.getItem('english-rpg-save')!).state.placement);
    expect(placement.reviewPassed).toBe(false);
    expect(placement.placementQuestionKeys).toHaveLength(10);
    expect(placement.placementQuestionKeys).toContain('previous-test-item');
    expect(placement.placementQuestionKeys).toContain(`choice|${ADVANCED_REVIEW_READING[7]![0].desc}|`);
    await expect(page.getByRole('button', { name: /7 天回顧到期/ })).toHaveCount(0);
  });
}
