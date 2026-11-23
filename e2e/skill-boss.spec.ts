import { expect, test, type Page } from '@playwright/test';
import { DEFAULT_CHARACTER } from '../src/game/character';
import type { useBattleStore } from '../src/store/battleStore';

type GameWindow = Window & { __battle: typeof useBattleStore };

const readQuestion = (page: Page) =>
  page.evaluate(() => (window as GameWindow).__battle.getState().question);
const readSave = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('english-rpg-save')!).state);
const bossCard = (page: Page, name: string) => page.locator('.skill-boss').filter({ hasText: name });

async function openBosses(page: Page) {
  await page.getByRole('button', { name: /副本與挑戰/ }).click();
  await page.getByRole('button', { name: /迎戰魔王/ }).click();
}

async function setupPlayer(page: Page, voiceAsSpelling: boolean) {
  await page.addInitScript(({ character, voiceAsSpelling }) => {
    if (!voiceAsSpelling) {
      // 透過瀏覽器語音 API 送入轉錄，仍由遊戲判定答案。
      class TestRecognition {
        onstart?: () => void;
        onresult?: (event: { resultIndex: number; results: { transcript: string }[][] }) => void;
        onend?: () => void;
        start() {
          const transcript = (window as GameWindow).__battle.getState().question?.ans ?? '';
          queueMicrotask(() => {
            this.onstart?.();
            this.onresult?.({ resultIndex: 0, results: [[{ transcript }]] });
          });
        }
        stop() { queueMicrotask(() => this.onend?.()); }
      }
      Object.defineProperty(window, 'SpeechRecognition', { value: TestRecognition });
    }
    if (localStorage.getItem('english-rpg-save')) return;
    localStorage.setItem('english-rpg-save', JSON.stringify({ version: 26, state: {
      character, tutorialDone: true, prologueDone: true, unlockedIndex: 8, tickets: 0,
      settings: { volume: 0, musicVolume: 0, sfxVolume: 0, autoSpeak: false, voiceAsSpelling, showLessons: false },
    } }));
  }, { character: DEFAULT_CHARACTER, voiceAsSpelling });
  await page.goto('/englearningapp/');
}

async function defeatBoss(page: Page, name: string, type: 'choice' | 'spell' | 'voice') {
  const title = page.getByText(`⚔️ 擊敗${name}！`, { exact: true });
  for (let i = 0; i < 30; i++) {
    await page.waitForFunction(() => {
      const state = (window as GameWindow).__battle?.getState();
      return state && ['answering', 'levelClear'].includes(state.phase);
    });
    if (await title.isVisible()) return;
    const question = await readQuestion(page);
    expect(question?.type).toBe(type);
    if (type === 'choice') {
      await expect(page.locator('.answer-panel .option-btn')).toHaveCount(4);
      await page.locator('.answer-panel .option-btn').filter({ hasText: new RegExp(`^${question!.ans}`) }).click();
    } else if (type === 'spell') {
      await page.keyboard.type(question!.ans);
      await page.getByRole('button', { name: '送出 ⏎', exact: true }).click();
    } else {
      await page.getByRole('button', { name: /點我開始說/ }).click();
    }
  }
  await expect(title).toBeVisible();
}

for (const [width, height] of [[375, 812], [1366, 768], [1920, 1080]]) {
  test(`C2 魔音魔王首勝與再勝 ${width}x${height}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height });
    await setupPlayer(page, true);
    const card = (boss: string) => bossCard(page, boss);

    await openBosses(page);
    await expect(page.locator('.skill-boss')).toHaveCount(4);
    await expect(card('咒文魔王')).toContainText('只出單字拼寫');
    await expect(card('鬼嘴魔王').getByRole('button')).toBeDisabled();
    await expect(card('魔音魔王')).toContainText(/題目 [1-9]\d+ 題/);
    await page.screenshot({ path: testInfo.outputPath('skill-boss.png'), animations: 'disabled', timeout: 3000 });
    await card('魔音魔王').getByRole('button', { name: '挑戰', exact: true }).click();
    await expect(page.getByRole('button', { name: /再聽一次/ })).toBeVisible();
    await defeatBoss(page, '魔音魔王', 'choice');
    expect(await readSave(page)).toMatchObject({ tickets: 5, skillBossCleared: ['listening'] });

    await page.getByRole('button', { name: /回到世界地圖/ }).click();
    await page.reload();
    await openBosses(page);
    await expect(card('魔音魔王')).toContainText('已獲得「千里順風耳」');
    await card('魔音魔王').getByRole('button', { name: '再次挑戰', exact: true }).click();
    await defeatBoss(page, '魔音魔王', 'choice');
    expect(await readSave(page)).toMatchObject({ tickets: 5, skillBossCleared: ['listening'] });
  });
}

test('閱讀答錯有回饋且可重試，閱讀與拼寫各自發首勝券', async ({ page }) => {
  test.setTimeout(70_000);
  await page.setViewportSize({ width: 1366, height: 768 });
  await setupPlayer(page, true);
  await openBosses(page);
  await bossCard(page, '魔眼魔王').getByRole('button').click();
  await expect(page.locator('.answer-panel .option-btn')).toHaveCount(4);
  const first = await readQuestion(page);
  const wrong = first?.ans === 'A' ? 'B' : 'A';
  await page.locator('.answer-panel .option-btn').filter({ hasText: new RegExp(`^${wrong}`) }).click();
  await expect(page.locator('.feedback')).toContainText('正確答案');
  expect((await readSave(page)).tickets).toBe(0);
  await page.getByRole('button', { name: /記住了，再試一次/ }).click();
  await defeatBoss(page, '魔眼魔王', 'choice');
  expect(await readSave(page)).toMatchObject({ tickets: 5, skillBossCleared: ['reading'] });
  expect((await readSave(page)).titles).toContain('博覽群書者');

  await page.getByRole('button', { name: /回到世界地圖/ }).click();
  await openBosses(page);
  await bossCard(page, '咒文魔王').getByRole('button').click();
  await defeatBoss(page, '咒文魔王', 'spell');
  expect(await readSave(page)).toMatchObject({ tickets: 10, skillBossCleared: ['reading', 'writing'] });
  expect((await readSave(page)).titles).toContain('咒文大師');
});

test('口說魔王先用拼寫首勝，重載以轉錄通關才補稱號', async ({ page }) => {
  test.setTimeout(70_000);
  await page.setViewportSize({ width: 375, height: 812 });
  await setupPlayer(page, false);
  await openBosses(page);
  await bossCard(page, '鬼嘴魔王').getByRole('button').click();
  const permission = page.getByRole('dialog', { name: /開啟麥克風/ });
  await permission.getByRole('button', { name: '本場改用拼寫', exact: true }).click();
  await defeatBoss(page, '鬼嘴魔王', 'spell');
  await expect(page.getByText(/本次以拼寫備援通關，口說未驗證/)).toBeVisible();
  expect(await readSave(page)).toMatchObject({ tickets: 5, skillBossCleared: ['speaking'] });
  expect((await readSave(page)).titles).not.toContain('雄辯之聲');
  expect((await readSave(page)).settings.voiceAsSpelling).toBe(false);

  await page.getByRole('button', { name: /回到世界地圖/ }).click();
  await page.reload();
  await openBosses(page);
  await bossCard(page, '鬼嘴魔王').getByRole('button', { name: '再次挑戰' }).click();
  await defeatBoss(page, '鬼嘴魔王', 'voice');
  expect((await readSave(page)).titles).toContain('雄辯之聲');
  expect(await readSave(page)).toMatchObject({ tickets: 5, skillBossCleared: ['speaking'] });
});

for (const [width, height] of [[375, 812], [1366, 768], [1920, 1080]]) {
  test(`關閉麥克風提示後，遲到的拒絕不會把戰鬥切成拼寫 ${width}x${height}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height });
    await page.addInitScript(() => {
      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
        value: () => new Promise((_resolve, reject) => {
          window.addEventListener('qa-deny-mic', () => reject(new DOMException('Denied', 'NotAllowedError')), { once: true });
        }),
      });
    });
    await setupPlayer(page, false);
    await openBosses(page);
    await bossCard(page, '鬼嘴魔王').getByRole('button').click();
    const permission = page.getByRole('dialog', { name: /開啟麥克風/ });
    await expect(permission.getByRole('button', { name: '本場改用拼寫' })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('mic-permission.png'), animations: 'disabled', timeout: 3000 });
    await permission.getByRole('button', { name: /允許麥克風/ }).click();
    await expect(permission.getByRole('button', { name: /請在瀏覽器視窗中選擇/ })).toBeDisabled();
    await permission.getByRole('button', { name: '關閉', exact: true }).click();
    await page.evaluate(async () => {
      window.dispatchEvent(new Event('qa-deny-mic'));
      await new Promise(requestAnimationFrame);
    });
    await expect(page.getByRole('button', { name: /點我開始說/ })).toBeVisible();
    expect((await readQuestion(page))?.type).toBe('voice');
  });
}
