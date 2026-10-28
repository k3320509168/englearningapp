import { describe, expect, it } from 'vitest';
import { GOLDEN_STAGE_COUNT, GOLDEN_TITLE, MAIN_TITLE, createGoldenDecks, generateGoldenStages, goldenTier } from './golden';
import { LEVELS, generateStages } from './QuestionData';
import { REGIONS } from './regions';
import { STORIES } from './story';
import { initialSave, useSaveStore } from '../store/saveStore';
import { setBattleRandom, useBattleStore } from '../store/battleStore';
import { DEFAULT_CHARACTER } from './character';
import { finishRegion } from './startLevel';

const st = () => useBattleStore.getState();
const answer = () => {
  const q = st().question!;
  if (q.type === 'choice') st().chooseOption(q.ans);
  else if (q.type === 'voice') st().submitVoice(q.ans);
  else { q.ans.slice(st().typed.length).split('').forEach(c => st().inputLetter(c)); st().submitTyped(); }
};
const wrong = () => {
  const q = st().question!;
  if (q.type === 'choice') st().chooseOption(['A', 'B', 'C', 'D'].find(l => l !== q.ans)!);
  else if (q.type === 'voice') st().submitVoice('banana');
  else { st().inputLetter(q.ans[st().typed.length] === 'Q' ? 'Z' : 'Q'); st().submitTyped(); }
};

describe('final region', () => {
  it('adds the castle region with C2 questions and the Silent Demon Lord at the end', () => {
    expect(LEVELS).toHaveLength(6);
    expect(REGIONS[5].name).toBe('王城');
    const stages = generateStages(LEVELS[5]);
    expect(stages[49].kind).toBe('final');
    expect(generateStages(LEVELS[4])[49].kind).toBeUndefined();
    expect(STORIES['region-5'].length).toBeGreaterThan(0);
    expect(STORIES['clear-5'].length).toBeGreaterThan(0);
  });

  it('clearing the last region grants the main title', () => {
    useSaveStore.setState({ ...initialSave });
    finishRegion(LEVELS.length - 1);
    expect(useSaveStore.getState().titles).toContain(MAIN_TITLE);
  });
});

describe('golden road', () => {
  const start = (patch = {}) => {
    setBattleRandom(() => 0.99);
    useSaveStore.setState({ ...initialSave, character: DEFAULT_CHARACTER, settings: { ...initialSave.settings, showLessons: false }, ...patch });
    st().startGoldenRoad();
  };

  it('has 6 tiers of 5 stages each, ending with the Demon Lord', () => {
    const stages = generateGoldenStages(createGoldenDecks());
    expect(stages).toHaveLength(GOLDEN_STAGE_COUNT);
    expect(stages[4].bossMode).toBe(true);
    expect(stages.at(-1)!.kind).toBe('final');
    expect(goldenTier(29)).toBe(5);
  });

  it('uses the base protagonist only, ignoring levels, equipment, heroes and upgrades', () => {
    start({ player: { level: 40, xp: 0, classPath: ['elementalist'] }, upgrades: { hp: 5, atk: 5, combo: 3, gold: 3 } });
    expect(st().party.map(m => m.id)).toEqual(['player']);
    expect(st().party[0].maxHp).toBe(100);
    expect(st().party[0].atk).toBe(50);
  });

  it('ends on the first mistake and records the best stage, without giving EXP', () => {
    start();
    for (let i = 0; i < 300 && st().stageIdx < 6; i++) { if (st().phase === 'monsterDown') st().nextStage(); else answer(); }
    const combo = st().combo;
    expect(combo).toBeGreaterThan(5); // combo 不會在換區域時重置
    wrong();
    expect(st().phase).toBe('gameOver');
    expect(useSaveStore.getState().goldenBest).toBe(6);
    expect(useSaveStore.getState().player.xp).toBe(0);
  });

  it('a timeout also ends the run (no lenient stages)', () => {
    start();
    st().tick(st().questionLimit + 1);
    expect(st().phase).toBe('gameOver');
  });

  it('a perfect run defeats the Demon Lord and earns the special title', () => {
    start();
    let answers = 0;
    for (let i = 0; i < 3000 && st().phase !== 'levelClear'; i++) {
      if (st().phase === 'monsterDown') st().nextStage();
      else { answer(); answers++; }
    }
    expect(st().phase).toBe('levelClear');
    expect(useSaveStore.getState().titles).toContain(GOLDEN_TITLE);
    expect(useSaveStore.getState().goldenBest).toBe(GOLDEN_STAGE_COUNT);
    // 平衡檢查：完美通關不該需要太多題
    expect(answers).toBeLessThan(150);
  });
});
