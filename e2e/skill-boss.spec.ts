import { expect, test, type Page } from '@playwright/test';
import { DEFAULT_CHARACTER } from '../src/game/character';
import type { useBattleStore } from '../src/store/battleStore';

type GameWindow = Window & { __battle: typeof useBattleStore };

async function defeatListeningBoss(page: Page) {
  const title = page.getByText('⚔️ 擊敗魔音魔王！', { exact: true });
  for (let i = 0; i < 30; i++) {
    await page.waitForFunction(() => {
      const state = (window as GameWindow).__battle?.getState();
      return state && ['answering', 'levelClear'].includes(state.phase);
    });
    if (await title.isVisible()) return;
    const question = await page.evaluate(() => (window as GameWindow).__battle.getState().question);
    expect(question?.type).toBe('choice');
    await expect(page.locator('.answer-panel .option-btn')).toHaveCount(4);
    const choice = page.locator('.answer-panel .option-btn').filter({ hasText: new RegExp(`^${question!.ans}`) });
    await choice.click();
  }
  await expect(title).toBeVisible();
}

for (const [width, height] of [[375, 812], [1366, 768], [1920, 1080]]) {
  test(`C2 魔音魔王首勝與再勝 ${width}x${height}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height });
    await page.addInitScript(character => {
      if (localStorage.getItem('english-rpg-save')) return;
      localStorage.setItem('english-rpg-save', JSON.stringify({ version: 26, state: {
        character, tutorialDone: true, prologueDone: true, unlockedIndex: 8, tickets: 0,
        settings: { volume: 0, musicVolume: 0, sfxVolume: 0, autoSpeak: false, voiceAsSpelling: true, showLessons: false },
      } }));
    }, DEFAULT_CHARACTER);
    await page.goto('/englearningapp/');
    const open = async () => {
      await page.getByRole('button', { name: /副本與挑戰/ }).click();
      await page.getByRole('button', { name: /迎戰魔王/ }).click();
    };
    const card = (boss: string) => page.locator('.skill-boss').filter({ hasText: boss });
    const readSave = () => page.evaluate(() => JSON.parse(localStorage.getItem('english-rpg-save')!).state);

    await open();
    await expect(page.locator('.skill-boss')).toHaveCount(4);
    await expect(card('咒文魔王')).toContainText('只出單字拼寫');
    await expect(card('鬼嘴魔王').getByRole('button')).toBeDisabled();
    await expect(card('魔音魔王')).toContainText(/題目 [1-9]\d+ 題/);
    await page.screenshot({ path: testInfo.outputPath('skill-boss.png'), animations: 'disabled', timeout: 3000 });
    await card('魔音魔王').getByRole('button', { name: '挑戰', exact: true }).click();
    await expect(page.getByRole('button', { name: /再聽一次/ })).toBeVisible();
    await defeatListeningBoss(page);
    expect(await readSave()).toMatchObject({ tickets: 5, skillBossCleared: ['listening'] });

    await page.getByRole('button', { name: /回到世界地圖/ }).click();
    await page.reload();
    await open();
    await expect(card('魔音魔王')).toContainText('已獲得「千里順風耳」');
    await card('魔音魔王').getByRole('button', { name: '再次挑戰', exact: true }).click();
    await defeatListeningBoss(page);
    expect(await readSave()).toMatchObject({ tickets: 5, skillBossCleared: ['listening'] });
  });
}
