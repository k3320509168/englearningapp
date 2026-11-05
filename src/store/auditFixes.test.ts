import { beforeEach, expect, it } from 'vitest';
import { initialSave, migrateSave, SAVE_VERSION, useSaveStore } from './saveStore';
import { DEFAULT_CHARACTER } from '../game/character';
import { useBattleStore } from './battleStore';
import { WEAPON_SUMMON_RATES } from '../game/weapons';
const S = () => useSaveStore.getState();
beforeEach(() => useSaveStore.setState({ ...structuredClone(initialSave), character: DEFAULT_CHARACTER }));
it('v24將舊素材別名加回既有素材；保存再載入不重複增加', () => {
  const migrated = migrateSave({ ...initialSave, materials: { ore: 10, core: 2, dragon: 4, magic_core: 3, dragon_crystal: 1 } }, 23);
  expect(migrated.materials).toEqual({ ore: 10, core: 5, dragon: 5 });
  expect(migrateSave(migrated, SAVE_VERSION).materials).toEqual(migrated.materials);
});
it('召喚魔核龍晶立即可用於正式鍛造配方', () => {
  useSaveStore.setState({ weaponTickets: 5, gold: 10000, materials: { ore: 100 }, unlockedIndex: 8 });
  for (const seq of [[.5, .1, .9, .1], [.5, .1, .9, .1], [.5, .1, .9, .1], [.5, .1, .1]]) {
    let i = 0; S().summonWeapons(1, () => seq[i++] ?? .9);
  }
  expect(S().materials.core).toBe(3); expect(S().materials.dragon).toBe(1);
  expect(S().forge('blade_legend')).toBe(true);
  expect(S().materials.core).toBe(0);
});
it('舊補發標記能持久化，普通存檔再載入不重補', () => {
  const old = migrateSave({ ...initialSave, weaponTickets: 0, bossDown: [3, 4] }, 23);
  expect(old.weaponTickets).toBe(5);
  useSaveStore.setState(old);
  const data = useSaveStore.persist.getOptions().partialize!(S());
  expect(data).toHaveProperty('_weaponBossBackfilled', true);
  expect(migrateSave(data, SAVE_VERSION).weaponTickets).toBe(5);
  expect(migrateSave(data, 23).weaponTickets).toBe(5);
});
it('新版正常通關的券不再走歷史補發', () => {
  expect(migrateSave({ ...initialSave, weaponTickets: 15, bossDown: [3, 4] }, SAVE_VERSION).weaponTickets).toBe(15);
});
it('機率表揭露現行不含保底的分配，沒有減少稀有素材收益', () => {
  expect(WEAPON_SUMMON_RATES.map(r => r.rate)).toEqual([5, 19, 28.5, 47.5]);
  expect(WEAPON_SUMMON_RATES.reduce((sum, r) => sum + r.rate, 0)).toBe(100);
});
it('黃金之路不能消耗無效護盾，正常戰鬥仍可使用', () => {
  const B = useBattleStore.getState;
  B().startGoldenRoad(); if (B().phase === 'lesson') B().startBattle();
  useSaveStore.setState({ items: { ...S().items, shield: 3 } });
  B().consumeItem('shield'); expect(S().items.shield).toBe(3); expect(B().shield).toBe(false);
  B().exitToMap();
});

it('v25更新已存的舊歧義題，合併新舊key保留成績並可安全重載', async () => {
  const { questionKey } = await import('../game/battle');
  const old = { type: 'choice', skill: 'reading' as const, difficulty: 1 as const, desc: '【時態】The express train ___ from PLATFORM 3 at 9:15 AM.', options: ['A. departs', 'B. departed', 'C. has departed', 'D. departing'], ans: 'A', explain: '舊解析' };
  const { revisedQuestion } = await import('../game/questionRevisions'); const fixed = revisedQuestion(old);
  const data = { ...initialSave, codex: {
    [questionKey(old)]: { question: old, correct: 2, wrong: 1, firstSeenAt: 5 },
    [questionKey(fixed)]: { question: fixed, correct: 3, wrong: 2, firstSeenAt: 10 },
  }, mistakes: { [questionKey(old)]: { question: old, wrongCount: 1, box: 1, dueAt: 100, lastWrongAt: 1 } } };
  const saved = migrateSave(data, 24);
  expect(Object.keys(saved.codex)).toEqual([questionKey(fixed)]);
  expect(saved.codex[questionKey(fixed)]).toMatchObject({ correct: 5, wrong: 3, firstSeenAt: 5 });
  expect(saved.mistakes[questionKey(fixed)]).toMatchObject({ box: 1, dueAt: 100, wrongCount: 1 });
  expect(saved.mistakes[questionKey(fixed)].question.desc).toContain('current timetable');
  expect(migrateSave(saved, SAVE_VERSION).codex).toEqual(saved.codex);
});

it('38位SSR升UR的四種不足條件不扣資源，合法晉升僅扣一次', async () => {
  const { HEROES, currentRarity } = await import('../game/heroes');
  const ssrs = HEROES.filter(h => h.rarity === 'SSR'); expect(ssrs).toHaveLength(38);
  for (const hero of ssrs) {
    const id = hero.id;
    for (const missing of ['stars', 'trials', 'shards', 'gold', 'none']) {
      useSaveStore.setState({ heroes: [id], heroTier: {}, wishShards: 0, gold: missing === 'gold' ? 1499 : 1500, heroStars: { [id]: missing === 'stars' ? 3 : 4 }, heroShards: { [id]: missing === 'shards' ? 149 : 150 }, trueName: { [id]: missing === 'trials' ? [true, true] : [true, true, true, true, true] } });
      const beforeGold = S().gold, beforeShards = S().heroShards[id];
      expect(S().tierUp(id), `${id}/${missing}`).toBe(missing === 'none');
      if (missing !== 'none') { expect(S().gold).toBe(beforeGold); expect(S().heroShards[id]).toBe(beforeShards); }
      else {
        expect(currentRarity(hero, S().heroTier[id])).toBe('UR'); expect(S().gold).toBe(0); expect(S().heroShards[id]).toBe(0);
        expect(S().tierUp(id)).toBe(false); expect(S().gold).toBe(0);
      }
    }
  }
});

it('口說魔王備援首通保留5券，之後全口說重打補稱號不重發券', () => {
  const play = () => {
    for (let i = 0; i < 500 && useBattleStore.getState().phase !== 'levelClear'; i++) {
      const b = useBattleStore.getState();
      if (b.phase === 'lesson') b.startBattle();
      else if (b.phase === 'feedback') b.continueAfterFeedback();
      else if (b.phase === 'answering') {
        // 集中驗證原戰鬥完成/發獎流程，壓低敵方HP，非平衡通關率測試。
        useBattleStore.setState({ monsterHp: 1 });
        const q = b.question!;
        if (q.type === 'voice') b.submitVoice(q.ans);
        else if (q.type === 'choice') b.chooseOption(q.ans);
        else { for (const ch of q.ans.slice(b.typed.length)) b.inputLetter(ch); b.submitTyped(); }
      } else throw new Error(`未預期戰鬥狀態 ${b.phase}`);
    }
    expect(useBattleStore.getState().phase).toBe('levelClear');
  };
  useSaveStore.setState({ settings: { ...S().settings, showLessons: false }, hintsSeen: ['boss', 'skill'], unlockedIndex: 0 });
  const tickets = S().tickets;
  useBattleStore.getState().startSkillBoss('speaking');
  if (useBattleStore.getState().phase === 'lesson') useBattleStore.getState().startBattle();
  useBattleStore.getState().switchToSpelling();
  expect(useBattleStore.getState().skillVoiceFallback).toBe(true);
  play();
  expect(S().tickets).toBe(tickets + 5);
  expect(S().skillBossCleared).toContain('speaking');
  expect(S().titles).not.toContain('雄辯之聲');
  useBattleStore.getState().startSkillBoss('speaking');
  expect(useBattleStore.getState().skillVoiceFallback).toBe(false);
  play();
  expect(S().titles).toContain('雄辯之聲');
  expect(S().tickets).toBe(tickets + 5);
  useBattleStore.getState().switchToSpelling();
  expect(useBattleStore.getState().skillVoiceFallback).toBe(false);
});
