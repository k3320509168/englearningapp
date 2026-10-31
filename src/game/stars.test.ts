import { describe, expect, it } from 'vitest';
import { emptyRunStats, evaluateStars, mergeStars, starConditions } from './stars';
import { REGIONS, chapterCount, mapName, regionStageCount, stageLabel } from './regions';
import { STORIES, clearStoryId, regionStoryId } from './story';
import { initialSave, migrateSave, useSaveStore } from '../store/saveStore';
import { setBattleRandom, useBattleStore } from '../store/battleStore';
import { DEFAULT_CHARACTER } from './character';
import { BOSS_QUESTION_EVERY } from './progression';

describe('regions and maps', () => {
  it('splits each region into three-star maps of 20 stages plus the region boss', () => {
    REGIONS.forEach((r, i) => expect(r.maps).toHaveLength(chapterCount(i) + 1));
    expect(REGIONS[0].maps).toHaveLength(6);
    expect(REGIONS[8].maps).toHaveLength(10);
    expect(mapName(REGIONS[0].id, 0)).toBe('新手村');
    expect(mapName(REGIONS[0].id, 24)).toBe('風車丘');
    expect(stageLabel(24)).toBe('2-5');
    expect(stageLabel(regionStageCount(0) - 1, 0)).toBe('魔王');
  });

  it('has an intro and a clear story for every region', () => {
    REGIONS.forEach((_, i) => {
      expect(STORIES[regionStoryId(i)]?.length).toBeGreaterThan(0);
      expect(STORIES[clearStoryId(i)]?.length).toBeGreaterThan(0);
    });
    expect(STORIES.prologue.length).toBeGreaterThan(0);
  });
});

describe('three-star rating', () => {
  it('raises the combo goal in later regions', () => {
    expect(starConditions(0)[2].label).toContain('連續答對 8 題');
    expect(starConditions(8)[2].label).toContain('連續答對 35 題');
  });

  it('evaluates a run: survive, 85% accuracy, combo or speed', () => {
    const good = { ...emptyRunStats(), answered: 20, correct: 18, maxStreak: 9, correctTimeMs: 18 * 6000 };
    expect(evaluateStars(0, good)).toEqual([true, true, true]);
    expect(evaluateStars(0, { ...good, correct: 16, maxStreak: 2, knockouts: 1 })).toEqual([false, false, false]);
    // 連對不夠，但答得很快也能拿第三顆
    expect(evaluateStars(0, { ...good, maxStreak: 2, correctTimeMs: 18 * 3000 })[2]).toBe(true);
    // 困難題 Bonus 把 combo 乘很大也不算：看的是真的連續答對
    expect(evaluateStars(0, { ...good, maxStreak: 2, maxCombo: 500 })[2]).toBe(false);
  });

  it('keeps the best record per condition', () => {
    expect(mergeStars([true, false, true], [false, true, false])).toEqual([true, true, true]);
  });

  it('gives a summon ticket for each newly earned star', () => {
    useSaveStore.setState({ ...initialSave });
    const tickets = useSaveStore.getState().tickets;
    expect(useSaveStore.getState().recordMapStars('r#0', [true, false, true])).toBe(2);
    expect(useSaveStore.getState().recordMapStars('r#0', [true, true, false])).toBe(1);
    expect(useSaveStore.getState().tickets).toBe(tickets + 3);
  });
});

describe('maps in battle', () => {
  const st = () => useBattleStore.getState();
  const answer = () => {
    const q = st().question!;
    if (q.type === 'choice') st().chooseOption(q.ans);
    else if (q.type === 'voice') st().submitVoice(q.ans);
    else { q.ans.slice(st().typed.length).split('').forEach(c => st().inputLetter(c)); st().submitTyped(); }
  };

  it('rates the map at its 20th-stage boss (not the 15th), then resets combo on the next map', () => {
    setBattleRandom(() => 0.99);
    useSaveStore.setState({ ...initialSave, character: DEFAULT_CHARACTER, settings: { ...initialSave.settings, showLessons: false } });
    st().startLevel(REGIONS[0].id);
    for (let i = 0; i < 2000 && !st().mapResult; i++) {
      if (st().phase === 'monsterDown' || st().phase === 'summary') st().nextStage(); else answer();
    }
    expect(st().stageIdx).toBe(19);
    expect(st().mapResult?.mapIdx).toBe(0);
    expect(st().mapResult?.stars[0]).toBe(true);
    expect(useSaveStore.getState().mapStars[`${REGIONS[0].id}#0`]).toBeTruthy();
    expect(st().combo).toBeGreaterThan(0);
    st().nextStage();
    expect(st().combo).toBe(0);
    expect(useSaveStore.getState().bestStage[REGIONS[0].id]).toBe(20);
  });

  it('every 8th question is a boss question, even at the start of a stage', () => {
    setBattleRandom(() => 0.99);
    useSaveStore.setState({ ...initialSave, character: DEFAULT_CHARACTER, settings: { ...initialSave.settings, showLessons: false } });
    st().startLevel(REGIONS[0].id);
    const seen: boolean[] = [];
    for (let i = 0; i < 60; i++) {
      if (st().phase === 'monsterDown' || st().phase === 'summary') { st().nextStage(); continue; }
      const stage = st().stages[st().stageIdx];
      if (st().questionCount % BOSS_QUESTION_EVERY === 0 && !stage.revenge && stage.kind !== 'treasure') seen.push(st().isBossQuestion);
      answer();
    }
    expect(seen.length).toBeGreaterThan(3);
    expect(seen.every(Boolean)).toBe(true);
  });
});

describe('save v9 migration', () => {
  it('fills best stage from progress and treats old players as having seen the prologue', () => {
    const m = migrateSave({ levelProgress: { a: 12 } }, 8);
    // 舊的第 2 張地圖第 3 關（12）→ 新的每張 20 關：第 2 張第 5 關（24）
    expect(m.bestStage).toEqual({ a: 24 });
    expect(m.storySeen).toContain('prologue');
    expect(migrateSave(undefined, 0).storySeen).toEqual([]);
  });
});
