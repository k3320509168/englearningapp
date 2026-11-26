import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { DEFAULT_CHARACTER } from '../src/game/character';
import { ALL_HINTS } from '../src/game/hints';
import { STORIES, bossStoryId, clearStoryId, mapStoryId, regionStoryId } from '../src/game/story';
import { regionStageCount } from '../src/game/stageLayout';
import { wheelKey } from '../src/game/wheel';
import type { Question } from '../src/game/types';
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

async function answerCurrentQuestion(page: Page, wrong = false) {
  const question = await page.evaluate(() => (window as GameWindow).__battle.getState().question);
  if (!question) throw Error('戰鬥沒有提供題目');
  if (question.type === 'choice') {
    const letter = wrong ? (question.ans === 'A' ? 'B' : 'A') : question.ans;
    await page.locator('.answer-panel .option-btn').filter({ hasText: new RegExp(`^${letter}`) }).click();
  } else {
    await page.keyboard.type(wrong ? `Z${question.ans}` : question.ans);
    await page.getByRole('button', { name: '送出 ⏎', exact: true }).click();
  }
}

async function fightUntilResult(page: Page, result: 'levelClear' | 'summary' | 'monsterDown', leaveResultStoryOpen = false) {
  for (let i = 0; i < 180; i++) {
    const ready = await page.waitForFunction(({ target, leaveResultStoryOpen }) => {
      const state = (window as GameWindow).__battle?.getState();
      if (leaveResultStoryOpen && state?.phase === target) return target;
      if (document.querySelector('[role="dialog"][aria-label="故事"]')) return 'story';
      if (document.querySelector('.celebrate')) return 'celebrate';
      if (!state?.active || !['answering', 'feedback', 'gameOver', target].includes(state.phase)) return null;
      return state.modChoice ? 'reflect' : state.phase;
    }, { target: result, leaveResultStoryOpen });
    const step = await ready.jsonValue();
    if (step === 'story') {
      await page.getByRole('dialog', { name: '故事' }).getByRole('button', { name: /略過整段/ }).click();
    } else if (step === 'celebrate') {
      await page.locator('.celebrate').click();
    } else if (step === 'reflect') {
      await page.getByRole('group', { name: '選擇反射的題型' }).getByRole('button').first().click();
    } else if (step === result) {
      return;
    } else if (step === 'gameOver') {
      throw Error('主線驗收戰敗');
    } else if (step === 'feedback') {
      await page.getByRole('button', { name: /記住了，再試一次/ }).click();
    } else {
      await answerCurrentQuestion(page);
    }
  }
  throw Error('主線戰鬥尚未結算');
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
    await answerCurrentQuestion(page);
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

// 存檔區域鍵沿用歷史字串，測試以對應最終關索引準備獨立存檔。
const bossLevelKeys = [
  'A1 入門 (120-224分)', 'A2 初級 (225-549分)', 'A2+ 初級進階',
  'B1 中級 (550-784分)', 'B1+ 中級進階', 'B2 中高級 (785-944分)',
  'B2+ 中高級進階', 'C1 高級 (945分以上)', 'C2 精通 (母語程度)',
];
const bossPlayerLevels = [35, 55, 75, 96, 110, 128, 150, 170, 190];
async function seedAdvancedPlayer(page: Page, region: number, stage: number, playerLevel: number, storySeen: string[], extras = {}) {
  const levelKey = bossLevelKeys[region];
  await page.addInitScript(({ character, region, stage, levelKey, level, storySeen, hintsSeen, extras }) => {
    if (localStorage.getItem('english-rpg-save')) return;
    const unlockedTiers = [30, 80, 120, 160].filter(required => level >= required).length;
    const classPath = ['squire', 'paladin', 'crusader_lord', 'crusader_lord_awake'].slice(0, unlockedTiers);
    localStorage.setItem('english-rpg-save', JSON.stringify({ version: 26, state: {
      character, prologueDone: true, tutorialDone: true, unlockedIndex: region, storySeen, hintsSeen,
      levelProgress: { [levelKey]: stage }, bestStage: { [levelKey]: stage }, weaponTickets: 0,
      player: { level, xp: 0, classPath }, classPaths: { swordsman: classPath },
      heroes: ['knight', 'mage', 'castle', 'bard'], party: ['player', 'mage', 'castle', 'bard'],
      heroLevel: { knight: level, mage: level, castle: level, bard: level },
      ...extras,
      settings: { volume: 0, musicVolume: 0, sfxVolume: 0, autoSpeak: false, voiceAsSpelling: true, showLessons: false, reduceMotion: true },
    } }));
  }, { character: DEFAULT_CHARACTER, region, stage, levelKey, level: playerLevel, storySeen, hintsSeen: ALL_HINTS, extras });
}

for (const [region, levelKey] of bossLevelKeys.entries()) {
  const [width, height] = viewports[region % viewports.length];
  test(`區域魔王首勝、結局與重載 ${levelKey.split(' ')[0]}`, async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height });
    const stage = regionStageCount(region) - 1;
    await seedAdvancedPlayer(page, region, stage, bossPlayerLevels[region], [regionStoryId(region), bossStoryId(region)]);
    await page.goto('/englearningapp/');
    await journey(page).click();
    await fightUntilResult(page, 'levelClear');
    await expect(page.getByRole('button', { name: /回到世界地圖/ })).toBeVisible();
    const weaponTickets = region === 3 || region === 8 ? 10 : region > 3 ? 5 : 0;
    expect(await readSave(page)).toMatchObject({
      bossDown: [region], unlockedIndex: region === 8 ? 9 : region,
      levelProgress: { [levelKey]: 0 }, weaponTickets,
    });
    await page.screenshot({ path: testInfo.outputPath('region-boss-clear.png'), animations: 'disabled' });
    if (region === 8) await page.keyboard.press('Escape');
    else if (region === 0) await page.getByRole('button', { name: /回到世界地圖/ }).click();
    else await page.keyboard.press('Enter');
    await page.getByRole('dialog', { name: '故事' }).getByRole('button', { name: /略過整段/ }).click();
    if (region === 8) expect((await readSave(page)).titles).toContain('語言守護者');
    await page.reload();
    const restored = await readSave(page);
    expect(restored.storySeen).toContain(clearStoryId(region));
    expect(restored.weaponTickets).toBe(weaponTickets);
    if (region < 8) {
      await page.getByRole('button', { name: /守門人的考驗/ }).click();
      await expect(page.getByRole('dialog').getByRole('button', { name: /挑戰區域試煉/ })).toBeVisible();
    } else {
      await page.getByRole('button', { name: /挑戰黃金之路/ }).click();
      await expect(page.getByRole('dialog', { name: '👑 黃金之路' })).toBeVisible();
    }
  });
}

const activeStage = (page: Page) => page.evaluate(() => (window as GameWindow).__battle.getState().stageIdx);
const wheelDialog = (page: Page) => page.getByRole('dialog', { name: '獎勵轉盤' });
const deferWheel = (page: Page) => wheelDialog(page).getByRole('button', { name: /稍後再轉/ }).click();

for (const [region, levelKey] of bossLevelKeys.entries()) {
  const [width, height] = viewports[region % viewports.length];
  test(`第 ${region + 1} 區 ${levels[region + 1]} 小 BOSS 至跨地圖續接`, async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height });
    await seedAdvancedPlayer(page, region, 14, bossPlayerLevels[region], [regionStoryId(region)]);
    await page.goto('/englearningapp/');
    await journey(page).click();
    await fightUntilResult(page, 'summary');
    const summary = page.locator('.summary');
    await expect(summary.locator('.result-title')).toContainText('擊敗小 BOSS');
    await expect(summary.locator('.result-title')).not.toContainText('通關');
    await expect(summary.getByRole('region', { name: '三星評價' })).toHaveCount(0);
    const gateSave = await readSave(page);
    expect(gateSave.levelProgress[levelKey]).toBe(15);
    expect(gateSave.wheelClaimed).toEqual([wheelKey(levelKey, 14)]);
    expect(gateSave.wheelPending).toBe(1);

    // 未按「繼續冒險」就關頁，下一次應接已解鎖的下一關。
    await page.reload();
    await expect(journey(page)).toHaveAccessibleName(/1-16/);
    await deferWheel(page);
    await journey(page).click();
    for (let stage = 15; stage < 19; stage++) {
      await expect.poll(() => activeStage(page)).toBe(stage);
      if (region === 0 && stage === 16) {
        await expect(page.locator('.answer-panel')).toBeVisible();
        await answerCurrentQuestion(page, true);
        await expect(page.locator('.feedback')).toContainText('正確答案');
        expect((await readSave(page)).levelProgress[levelKey]).toBe(stage);
      }
      await fightUntilResult(page, 'monsterDown');
      await page.getByRole('button', { name: /前往下一關/ }).click();
    }
    await expect.poll(() => activeStage(page)).toBe(19);
    const interruptStory = region === 0;
    await fightUntilResult(page, 'summary', interruptStory);
    if (interruptStory) await expect(page.getByRole('dialog', { name: '故事' })).toBeVisible();
    await expect(summary.locator('.result-title')).toContainText('通關');
    await expect(summary.getByRole('region', { name: '三星評價' })).toBeVisible();
    const chapterSave = await readSave(page);
    expect(chapterSave.levelProgress[levelKey]).toBe(20);
    expect(chapterSave.wheelClaimed).toEqual([wheelKey(levelKey, 14), wheelKey(levelKey, 19)]);
    expect(chapterSave.wheelPending).toBe(2);
    expect(chapterSave.mapStars[`${levelKey}#0`]).toHaveLength(3);
    if (STORIES[mapStoryId(region, 0, 'clear')]) expect(chapterSave.storySeen).toContain(mapStoryId(region, 0, 'clear'));
    if (!interruptStory) await deferWheel(page);
    await page.screenshot({ path: testInfo.outputPath('chapter-clear.png'), animations: 'disabled', timeout: 5000 });
    if (region % 2 === 0) {
      await page.reload();
      await expect(journey(page)).toHaveAccessibleName(/2-1/);
      await deferWheel(page);
      if (interruptStory) {
        await page.getByRole('button', { name: /更多/ }).click();
        await page.getByRole('menuitem', { name: /劇情回顧/ }).click();
        await page.getByRole('dialog', { name: /劇情回顧/ }).getByRole('button', { name: /新手村・通關/ }).click();
        const replay = page.getByRole('dialog', { name: '故事' });
        await expect(replay).toContainText('雜貨店的招牌回來了');
        await replay.getByRole('button', { name: /略過整段/ }).click();
        await page.getByText('首次重溫劇情獎勵！', { exact: true }).click();
        expect((await readSave(page)).storyRewardClaimed).toContain(mapStoryId(region, 0, 'clear'));
      }
      await journey(page).click();
    } else {
      await summary.getByRole('button', { name: /繼續冒險/ }).click();
    }
    await expect.poll(() => activeStage(page)).toBe(20);
    const restored = await readSave(page);
    expect(restored.wheelClaimed).toEqual(chapterSave.wheelClaimed);
    expect(restored.mapStars).toEqual(chapterSave.mapStars);
  });
}

for (const [viewport, region] of [0, 5, 8].entries()) {
  const [width, height] = viewports[viewport];
  const levelKey = bossLevelKeys[region];
  test(`第 ${region + 1} 區 ${levels[region + 1]} 菁英與寶箱第 5 至 10 關`, async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height });
    await seedAdvancedPlayer(page, region, 4, bossPlayerLevels[region], [regionStoryId(region)]);
    await page.goto('/englearningapp/');
    await journey(page).click();
    for (let stage = 4; stage <= 9; stage++) {
      await expect.poll(() => activeStage(page)).toBe(stage);
      if (stage === 4 || stage === 9) {
        const shield = () => page.evaluate(() => (window as GameWindow).__battle.getState().monsterShield);
        const layers = await shield();
        expect(layers).toBeGreaterThan(0);
        await answerCurrentQuestion(page);
        await expect.poll(shield).toBe(layers - 1);
      }
      if (stage === 6) await expect(page.getByText(/寶箱逃走倒數/)).toBeVisible();
      await fightUntilResult(page, 'monsterDown');
      const saved = await readSave(page);
      expect(saved.levelProgress[levelKey]).toBe(stage + 1);
      expect(saved.wheelClaimed).toEqual((stage === 9 ? [4, 9] : [4]).map(i => wheelKey(levelKey, i)));
      if (stage === 4 || stage === 9) await deferWheel(page);
      if (stage === 6) {
        await expect(page.getByText('💰 打開寶箱！', { exact: true })).toBeVisible();
        await page.screenshot({ path: testInfo.outputPath('treasure-open.png'), animations: 'disabled', timeout: 5000 });
      }
      await page.getByRole('button', { name: /前往下一關/ }).click();
    }
    await expect.poll(() => activeStage(page)).toBe(10);
  });
}

test('寶箱倒數歸零仍需作答，逃走後保存下一關', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.clock.install();
  await seedAdvancedPlayer(page, 0, 6, bossPlayerLevels[0], [regionStoryId(0)]);
  await page.goto('/englearningapp/');
  await journey(page).click();
  await expect(page.getByText(/寶箱逃走倒數/)).toBeVisible();
  await page.clock.runFor(31_000);
  await expect(page.getByText(/寶箱逃走倒數/)).toHaveCount(0);
  await expect(page.locator('.answer-panel')).toBeVisible();
  const before = await readSave(page);
  expect(before.levelProgress[bossLevelKeys[0]]).toBe(6);

  await answerCurrentQuestion(page);
  await fightUntilResult(page, 'monsterDown');
  await expect(page.getByText('💰 寶箱逃走了', { exact: true })).toBeVisible();
  const after = await readSave(page);
  expect(after.levelProgress[bossLevelKeys[0]]).toBe(7);
  expect(after.materials).toEqual(before.materials);
  expect(after.wheelClaimed).toEqual(before.wheelClaimed);
  await page.screenshot({ path: testInfo.outputPath('treasure-escaped.png'), animations: 'disabled', timeout: 5000 });
  await page.reload();
  await expect(journey(page)).toHaveAccessibleName(/1-8/);
});

async function openGrassland(page: Page, expectIntro = false) {
  const canvas = page.locator('.game-canvas canvas');
  const dialog = page.getByRole('dialog', { name: /翠綠草原/ });
  await expect(async () => {
    const bounds = await canvas.boundingBox();
    if (!bounds) throw Error('世界地圖 Canvas 尚未顯示');
    // Phaser 地圖為 800×480，第一面旗幟的點擊中心為 (70, 324)。
    await canvas.click({ position: { x: bounds.width * 70 / 800, y: bounds.height * 324 / 480 }, timeout: 1500 });
    await expect(expectIntro ? page.getByRole('dialog', { name: '故事' }) : dialog).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 10_000 });
  return dialog;
}

for (const [width, height] of viewports) {
  test(`重打舊地圖、掃蕩與續接前線 ${width}x${height}`, async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height });
    const levelKey = bossLevelKeys[0];
    const wheelClaimed = [4, 9, 14, 19].map(i => wheelKey(levelKey, i));
    const firstClearXpClaimed = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`${levelKey}:${i}`, true]));
    await seedAdvancedPlayer(page, 0, 24, bossPlayerLevels[0], [
      regionStoryId(0), ...(['intro', 'mini', 'big', 'clear'] as const).map(part => mapStoryId(0, 0, part)),
    ], { wheelClaimed, firstClearXpClaimed, mapStars: { [`${levelKey}#0`]: [true, true, true] }, sweepTickets: 1 });
    await page.goto('/englearningapp/');
    const dialog = await openGrassland(page);
    const firstMap = dialog.locator('.route-node').filter({ has: page.getByRole('button', { name: '新手村', exact: true }) });
    const sweep = firstMap.getByRole('button', { name: /掃蕩/ });
    const before = await readSave(page);
    await sweep.click();
    await expect(firstMap.getByRole('status')).toContainText('掃蕩「新手村」成功');
    const swept = await readSave(page);
    expect(swept.sweepTickets).toBe(0);
    expect(swept.gold).toBeGreaterThan(before.gold);
    expect(swept.materials.ore).toBeGreaterThanOrEqual((before.materials.ore ?? 0) + 5);
    expect(swept.mapStars).toEqual(before.mapStars);
    await expect(sweep).toBeDisabled();
    await page.screenshot({ path: testInfo.outputPath('swept-map.png'), animations: 'disabled', timeout: 5000 });

    await firstMap.getByRole('button', { name: '新手村', exact: true }).click();
    await expect(page.locator('.answer-panel')).toBeVisible();
    expect(await activeStage(page)).toBe(0);
    expect((await readSave(page)).levelProgress[levelKey]).toBe(24);
    const replayThrough = width === 375 ? 19 : 4;
    for (let stage = 0; stage <= replayThrough; stage++) {
      const isBoss = stage === 14 || stage === 19;
      await expect.poll(() => activeStage(page)).toBe(stage);
      await fightUntilResult(page, isBoss ? 'summary' : 'monsterDown');
      if (stage < replayThrough) await page.getByRole('button', { name: isBoss ? /繼續冒險/ : /前往下一關/ }).click();
    }
    if (replayThrough === 19) {
      await expect(page.getByRole('region', { name: '三星評價' })).toBeVisible();
      await expect(page.locator('.star-gain')).toHaveCount(0);
    }
    const replay = await readSave(page);
    expect(replay.mapStars).toEqual(before.mapStars);
    expect(replay.wheelClaimed).toEqual(wheelClaimed);
    expect(replay.wheelPending).toBe(0);
    expect(replay.firstClearXpClaimed).toEqual(firstClearXpClaimed);
    expect(replay.levelProgress[levelKey]).toBe(24);
    await page.reload();
    await expect(journey(page)).toHaveAccessibleName(/2-5/);
    await journey(page).click();
    await expect.poll(() => activeStage(page)).toBe(24);
  });
}

test('區域最終魔王即使三星也沒有掃蕩，正常地圖仍可掃蕩', async ({ page }) => {
  const levelKey = bossLevelKeys[0];
  const finalStage = regionStageCount(0) - 1;
  await seedAdvancedPlayer(page, 0, finalStage, bossPlayerLevels[0], [regionStoryId(0)], {
    bossDown: [0], sweepTickets: 1, mapStars: { [`${levelKey}#0`]: [true, true, true], [`${levelKey}#5`]: [true, true, true] },
  });
  await page.goto('/englearningapp/');
  await page.getByRole('button', { name: /守門人的考驗/ }).click();
  const dialog = page.getByRole('dialog', { name: /翠綠草原/ });
  const sweep = dialog.getByRole('button', { name: /掃蕩/ });
  await expect(sweep).toHaveCount(1);
  await expect(sweep).toBeEnabled();
});


const diagnostics = JSON.parse(readFileSync(new URL('../src/game/questions/bank/diag.json', import.meta.url), 'utf8')) as (Question & { level: string })[];

for (const [width, height] of viewports) {
  test(`程度測驗跳到 B2+ 後回 A1 首通並續接前線 ${width}x${height}`, async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height });
    await seedPlayer(page, 0, true);
    await page.goto('/englearningapp/');
    await page.getByRole('button', { name: /程度測驗/ }).click();
    const quiz = page.getByRole('dialog', { name: /程度測驗/ });
    await quiz.getByRole('button', { name: '不錯', exact: true }).click();
    await quiz.getByRole('button', { name: '開始測驗' }).click();

    let firstB2 = true;
    let answered = 0;
    const result = quiz.getByText('你的程度：B2+', { exact: true });
    for (let i = 0; i < 36 && !await result.isVisible(); i++) {
      await expect(quiz.locator('.quiz-count')).toContainText(`第 ${i + 1} 題`);
      const prompt = await quiz.locator('.q-desc').evaluate(el => el.firstChild?.textContent);
      const options = await quiz.locator('.option-btn').allTextContents();
      const [q] = diagnostics.filter(q => q.desc === prompt &&
        (q.type === 'choice' ? q.options?.every((o, i) => o[0] + o.slice(2) === options[i]) : options.length === 0));
      if (!q) throw Error(`找不到程度測驗題：${prompt}`);
      if (q.type === 'choice') {
        const wrong = q.level === 'C1' || q.level === 'C2' || (q.level === 'B2' && firstB2);
        if (q.level === 'B2') firstB2 = false;
        const letter = wrong ? (q.ans === 'A' ? 'B' : 'A') : q.ans;
        await quiz.locator('.option-btn').filter({ hasText: new RegExp(`^${letter}`) }).click();
      } else {
        await quiz.getByRole('textbox', { name: '輸入答案' }).fill(q.ans);
        await quiz.getByRole('button', { name: '確認 ⏎', exact: true }).click();
      }
      answered++;
    }
    await expect(result).toBeVisible();
    await expect(quiz).toContainText('口說未驗證');
    expect(answered).toBeGreaterThan(10);
    await quiz.getByRole('button', { name: '從「雷鳴高原」出發' }).click();
    const story = page.getByRole('dialog', { name: '故事' });
    await story.getByRole('button', { name: /略過整段/ }).click();
    await page.getByRole('dialog', { name: /雷鳴高原/ }).getByRole('button', { name: '關閉' }).click();

    const jumped = await readSave(page);
    expect(jumped).toMatchObject({
      unlockedIndex: 6, bossDown: [], mapStars: {}, firstClearXpClaimed: {}, player: { level: 1 },
      placement: { region: 6, verified: false, speakingVerified: false },
    });
    expect(jumped.storySeen).not.toContain(clearStoryId(0));
    expect(jumped.storySeen).not.toContain(regionStoryId(0));
    const oldRegion = await openGrassland(page, true);
    await story.getByRole('button', { name: /略過整段/ }).click();
    await expect(oldRegion).toBeVisible();
    await oldRegion.getByRole('button', { name: '新手村', exact: true }).click();
    await fightUntilResult(page, 'monsterDown');
    const cleared = await readSave(page);
    expect(cleared.firstClearXpClaimed[`${bossLevelKeys[0]}:0`]).toBe(true);
    expect(cleared.xpLedger['accepted:firstClear']).toBeGreaterThan(0);
    expect(cleared.levelProgress[bossLevelKeys[0]]).toBe(1);
    expect(cleared.unlockedIndex).toBe(6);
    await page.reload();
    await expect(journey(page)).toHaveAccessibleName(/雷鳴高原.*1-1/);
    await page.screenshot({ path: testInfo.outputPath('placement-frontier.png'), animations: 'disabled', timeout: 5000 });
  });
}

test('舊跳級存檔補打 A1 魔王才開通關劇情並領重溫券', async ({ page }) => {
  test.setTimeout(90_000);
  const levelKey = bossLevelKeys[0];
  const frontierKey = bossLevelKeys[6];
  const clear = clearStoryId(0);
  const bossStage = regionStageCount(0) - 1;
  await seedAdvancedPlayer(page, 0, 0, bossPlayerLevels[0], [regionStoryId(0), clear, regionStoryId(6)], {
    unlockedIndex: 6, bestStage: { [levelKey]: bossStage }, levelProgress: { [frontierKey]: 24 },
  });
  await page.goto('/englearningapp/');
  await page.getByRole('button', { name: /更多/ }).click();
  await page.getByRole('menuitem', { name: /劇情回顧/ }).click();
  const storyLog = page.getByRole('dialog', { name: /劇情回顧/ });
  await expect(storyLog.getByRole('button', { name: /通關/ })).toHaveCount(0);
  expect((await readSave(page)).storySeen).not.toContain(clear);
  await storyLog.getByRole('button', { name: '關閉' }).click();

  const oldRegion = await openGrassland(page);
  await oldRegion.getByRole('button', { name: '巨樹之心', exact: true }).click();
  await fightUntilResult(page, 'levelClear');
  await page.getByRole('button', { name: /回到世界地圖/ }).click();
  await page.getByRole('dialog', { name: '故事' }).getByRole('button', { name: /略過整段/ }).click();
  const won = await readSave(page);
  expect(won).toMatchObject({ unlockedIndex: 6, bossDown: [0], levelProgress: { [frontierKey]: 24 } });
  expect(won.storySeen).toContain(clear);
  expect(won.storyRewardClaimed).not.toContain(clear);
  await page.getByRole('button', { name: /更多/ }).click();
  await page.getByRole('menuitem', { name: /劇情回顧/ }).click();
  await storyLog.getByRole('button', { name: /通關/ }).click();
  await page.getByRole('dialog', { name: '故事' }).getByRole('button', { name: /略過整段/ }).click();
  await page.getByText('首次重溫劇情獎勵！', { exact: true }).click();
  await page.reload();
  const restored = await readSave(page);
  expect(restored.storyRewardClaimed).toContain(clear);
  expect(restored.tickets).toBe(won.tickets + 1);
  await expect(journey(page)).toHaveAccessibleName(/雷鳴高原.*2-5/);
  await page.getByRole('button', { name: /更多/ }).click();
  await page.getByRole('menuitem', { name: /劇情回顧/ }).click();
  await expect(storyLog.getByRole('button', { name: /通關/ })).toContainText('已領取');
});
