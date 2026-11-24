import { expect, test, type Page } from '@playwright/test';
import { DEFAULT_CHARACTER } from '../src/game/character';
import { ALL_HINTS } from '../src/game/hints';
import type { useBattleStore } from '../src/store/battleStore';

type GameWindow = Window & { __battle: typeof useBattleStore };
const viewports = [[375, 812], [1366, 768], [1920, 1080]];

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

async function seedGoldenPlayer(page: Page, withMistake = false) {
  await page.addInitScript(({ character, hintsSeen, withMistake }) => {
    if (localStorage.getItem('english-rpg-save')) return;
    const question = { type: 'spell', desc: '錯題本驗收專用提示', ans: 'SENTINEL' };
    const mistakes = withMistake ? {
      'spell:SENTINEL': { question, wrongCount: 1, lastWrongAt: 1, box: 0, dueAt: 1 },
    } : {};
    localStorage.setItem('english-rpg-save', JSON.stringify({ version: 26, state: {
      character, prologueDone: true, tutorialDone: true, gold: 1000, tickets: 2, mistakes, hintsSeen,
      settings: { volume: 0, musicVolume: 0, sfxVolume: 0, autoSpeak: false, voiceAsSpelling: true, showLessons: false, reduceMotion: true },
    } }));
  }, { character: DEFAULT_CHARACTER, hintsSeen: ALL_HINTS, withMistake });
}

for (const [width, height] of viewports) {
  test(`黃金之路取消冷載入、答錯止步、重新挑戰及重載 ${width}x${height}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height });
    await seedGoldenPlayer(page);
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

for (const [width, height] of viewports) {
  test(`黃金之路連打 45 關、播放特殊結局並跨重載保留首勝 ${width}x${height}`, async ({ page }, testInfo) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await seedGoldenPlayer(page, true);
    await page.goto('/englearningapp/');
    const open = async () => {
      await page.getByRole('button', { name: /副本與挑戰/ }).click();
      await page.getByRole('button', { name: /踏上黃金之路/ }).click();
    };
    await open();
    await page.getByRole('dialog', { name: '👑 黃金之路' }).getByRole('button', { name: '踏上黃金之路', exact: true }).click();
    const visited: number[] = [];
    const hardQuestionStages = new Set<number>();
    let sentinelAnswer = false;
    const next = page.getByRole('button', { name: /前往下一關/ });
    const ending = page.getByRole('button', { name: /回到世界地圖/ });

    for (let step = 0; step < 300; step++) {
      const reached = await page.waitForFunction(() => {
        const state = (window as GameWindow).__battle?.getState();
        if (!state?.active || state.mode !== 'golden') return null;
        if (!['answering', 'monsterDown', 'levelClear', 'gameOver'].includes(state.phase)) return null;
        return {
          phase: state.phase, stage: state.stageIdx + 1, hard: state.isBossQuestion,
          sentinel: state.original?.ans === 'SENTINEL',
        };
      });
      const current = await reached.jsonValue();
      if (current.phase === 'levelClear') { visited.push(current.stage); break; }
      if (current.phase === 'gameOver') throw Error(`黃金之路第 ${current.stage} 關提前結束`);
      if (current.phase === 'monsterDown') {
        visited.push(current.stage);
        await next.click();
      } else {
        if (current.hard) hardQuestionStages.add(current.stage);
        sentinelAnswer ||= current.sentinel;
        await answer(page, true);
      }
    }
    expect(visited).toEqual(Array.from({ length: 45 }, (_, i) => i + 1));
    expect(hardQuestionStages.size).toBeGreaterThan(1);
    expect(sentinelAnswer).toBe(false);
    await expect(page.getByText(/黃金之路通關！/)).toBeVisible();
    expect(await readSave(page)).toMatchObject({ goldenBest: 45, tickets: 12, player: { xp: 0 } });
    await page.screenshot({ path: testInfo.outputPath('golden-first-clear.png'), animations: 'disabled' });
    await ending.click();
    const story = page.getByRole('dialog', { name: '故事' });
    await expect(story).toContainText('你站在了沉默魔王面前');
    await expect(story.getByText('點一下繼續', { exact: true })).toBeVisible();
    for (let i = 0; i < 4; i++) await story.getByRole('button', { name: /下一句/ }).click();
    await expect(story).toContainText('【特殊結局】');
    await page.screenshot({ path: testInfo.outputPath('golden-ending.png'), animations: 'disabled' });
    await story.getByRole('button', { name: '繼續', exact: true }).click();

    await page.reload();
    await open();
    await expect(page.getByRole('dialog', { name: '👑 黃金之路' })).toContainText('已通關');
    const saved = await readSave(page);
    expect(saved).toMatchObject({ goldenBest: 45, tickets: 12 });
    expect(saved.titles).toContain('掌握古代咒語的超時空勇者');
    expect(saved.storySeen).toContain('golden-ending');
  });
}
