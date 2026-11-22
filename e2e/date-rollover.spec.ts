import { expect, test } from '@playwright/test';
import { DEFAULT_CHARACTER } from '../src/game/character';

test.use({ timezoneId: 'Asia/Taipei', viewport: { width: 375, height: 812 } });

test('週一午夜更新開著的任務視窗，簽到獎勵只能領一次', async ({ page }) => {
  const beforeMidnight = new Date('2026-11-22T23:59:55+08:00');
  await page.clock.install({ time: beforeMidnight });
  await page.addInitScript(character => {
    if (localStorage.getItem('english-rpg-save')) return;
    localStorage.setItem('english-rpg-save', JSON.stringify({ version: 26, state: {
      character, prologueDone: true, tutorialDone: true, gold: 1234,
      daily: { date: '2026-11-21', streak: 1, tasks: [] },
      shardQuizDay: new Date().toDateString(),
      settings: { musicVolume: 0, sfxVolume: 0, volume: 0, autoSpeak: false },
    } }));
  }, DEFAULT_CHARACTER);
  await page.goto('/englearningapp/');
  await page.getByRole('button', { name: /任務/ }).click();
  await expect(page.getByRole('dialog')).toContainText('2026-11-16 起');
  await expect(page.getByRole('dialog')).toContainText('今天已完成');

  await page.clock.fastForward(61_000);
  await expect(page.getByRole('dialog')).toContainText('2026-11-23 起');
  await expect(page.getByRole('dialog')).not.toContainText('今天已完成');
  await page.getByRole('dialog').getByLabel('關閉').click();
  const streak = page.getByTitle(/連續登入 3 天/);
  await streak.click();
  const reward = page.locator('.milestone-btn:not([disabled])');
  await expect(reward).toHaveCount(1);
  await reward.click();
  const save = () => page.evaluate(() => JSON.parse(localStorage.getItem('english-rpg-save')!).state);
  expect(await save()).toMatchObject({ gold: 1334, daily: { streak: 3 } });
  await page.reload();
  await streak.click();
  await expect(reward).toHaveCount(0);
  expect(await save()).toMatchObject({ gold: 1334, daily: { streak: 3 } });
});
