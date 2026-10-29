import { describe, expect, it } from 'vitest';
import { emptyRunStats, evaluateStars, mergeStars, starConditions } from './stars';
import { REGIONS, mapName, stageLabel } from './regions';
import { STORIES, clearStoryId, regionStoryId } from './story';
import { initialSave, migrateSave, useSaveStore } from '../store/saveStore';
import { setBattleRandom, useBattleStore } from '../store/battleStore';
import { DEFAULT_CHARACTER } from './character';

describe('regions and maps', () => {
  it('splits each region into 5 named maps of 10 stages', () => {
    REGIONS.forEach(r => expect(r.maps).toHaveLength(5));
    expect(mapName(REGIONS[0].id, 0)).toBe('新手村');
    expect(mapName(REGIONS[0].id, 14)).toBe('風車丘');
    expect(stageLabel(14)).toBe('2-5');
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
    expect(starConditions(0)[2].label).toContain('combo 達 8');
    expect(starConditions(8)[2].label).toContain('combo 達 35');
  });

  it('evaluates a run: survive, 85% accuracy, combo or speed', () => {
    const good = { ...emptyRunStats(), answered: 20, correct: 18, maxCombo: 9, correctTimeMs: 18 * 6000 };
    expect(evaluateStars(0, good)).toEqual([true, true, true]);
    expect(evaluateStars(0, { ...good, correct: 16, maxCombo: 2, knockouts: 1 })).toEqual([false, false, false]);
    // combo 不夠，但答得很快也能拿第三顆
    expect(evaluateStars(0, { ...good, maxCombo: 2, correctTimeMs: 18 * 3000 })[2]).toBe(true);
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

  it('rates the map at its boss, then resets combo on the next map', () => {
    setBattleRandom(() => 0.99);
    useSaveStore.setState({ ...initialSave, character: DEFAULT_CHARACTER, settings: { ...initialSave.settings, showLessons: false } });
    st().startLevel(REGIONS[0].id);
    for (let i = 0; i < 500 && st().phase !== 'summary'; i++) {
      if (st().phase === 'monsterDown') st().nextStage(); else answer();
    }
    expect(st().mapResult?.mapIdx).toBe(0);
    expect(st().mapResult?.stars[0]).toBe(true);
    expect(useSaveStore.getState().mapStars[`${REGIONS[0].id}#0`]).toBeTruthy();
    expect(st().combo).toBeGreaterThan(0);
    st().nextStage();
    expect(st().combo).toBe(0);
    expect(useSaveStore.getState().bestStage[REGIONS[0].id]).toBe(10);
  });

  it('every 5th question is a boss question, even at the start of a stage', () => {
    setBattleRandom(() => 0.99);
    useSaveStore.setState({ ...initialSave, character: DEFAULT_CHARACTER, settings: { ...initialSave.settings, showLessons: false } });
    st().startLevel(REGIONS[0].id);
    const seen: boolean[] = [];
    for (let i = 0; i < 60; i++) {
      if (st().phase === 'monsterDown' || st().phase === 'summary') { st().nextStage(); continue; }
      const stage = st().stages[st().stageIdx];
      if (st().questionCount % 5 === 0 && !stage.revenge && stage.kind !== 'treasure') seen.push(st().isBossQuestion);
      answer();
    }
    expect(seen.length).toBeGreaterThan(3);
    expect(seen.every(Boolean)).toBe(true);
  });
});

describe('save v9 migration', () => {
  it('fills best stage from progress and treats old players as having seen the prologue', () => {
    const m = migrateSave({ levelProgress: { a: 12 } }, 8);
    expect(m.bestStage).toEqual({ a: 12 });
    expect(m.storySeen).toContain('prologue');
    expect(migrateSave(undefined, 0).storySeen).toEqual([]);
  });
});
