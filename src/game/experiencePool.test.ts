import { useBattleStore, setBattleRandom } from '../store/battleStore';
import { beforeEach, describe, expect, it } from 'vitest';
import { firstClearXp, learningXp, regionXpBudget } from './experiencePool';
import { regionStageCount } from './stageLayout';
import { initialSave, migrateSave, useSaveStore } from '../store/saveStore';
import { REGIONS } from './regions';
import { DEFAULT_CHARACTER } from './character';
const word = { type: 'spell' as const, desc: '蘋果', ans: 'APPLE', speak: 'apple' };
describe('experience pools', () => {
  beforeEach(() => useSaveStore.setState({ ...structuredClone(initialSave), character: DEFAULT_CHARACTER }));
  it('reconciles every region first-clear pool exactly after rounding', () => {
    for (let r = 0; r < 9; r++) {
      let sum = 0;
      for (let stage = 0; stage < regionStageCount(r); stage++) {
        const reward = firstClearXp(r, stage);
        expect(reward).toBeGreaterThan(0); sum += reward;
      }
      expect(sum).toBe(Math.round(regionXpBudget(r) * 0.7));
    }
    expect(regionXpBudget(0)).toBe(2805);
    expect(firstClearXp(0, -1)).toBe(0);
  });
  it('includes every regional transition without changing the displayed level bands', () => {
    let budget = 0;
    for (let r = 0; r < 9; r++) budget += regionXpBudget(r);
    expect(budget).toBe(185640);
    expect(regionXpBudget(1)).toBe(6715); // Lv20→40，而非21→40
    expect(regionXpBudget(8)).toBe(49597.5); // Lv170→200
  });
  it('claims a stage once, never resets claims on replay, and records the XP source', () => {
    const s = useSaveStore.getState();
    expect(s.claimStageXp(0, 0).xp).toBe(firstClearXp(0, 0));
    expect(s.claimStageXp(0, 0).xp).toBe(0);
    expect(useSaveStore.getState().xpLedger['offered:firstClear']).toBe(firstClearXp(0, 0));
  });
  it('offers one knowledge subsidy per local day but always retains repeat base XP', () => {
    const s = useSaveStore.getState();
    expect(s.grantLearningXp(8, word, true).xp).toBe(learningXp(8, true));
    expect(s.grantLearningXp(8, word, true).xp).toBe(learningXp(8, false));
    expect(s.grantLearningXp(8, { ...word, ans: 'PEAR', speak: 'pear' }, false).xp).toBe(learningXp(8, false));
  });
  it('actual battle clear pays the pool once without an extra legacy kill reward', () => {
    setBattleRandom(() => 0.99);
    useSaveStore.setState({ settings: { ...initialSave.settings, showLessons: false } });
    useBattleStore.getState().startLevel(REGIONS[0].id);
    if (useBattleStore.getState().phase === 'lesson') useBattleStore.getState().startBattle();
    useBattleStore.setState({ monsterHp: 1, monsterShield: 0, waves: 1, wave: 1 });
    const q = useBattleStore.getState().question!;
    const b = useBattleStore.getState();
    if (q.type === 'choice') b.chooseOption(q.ans);
    else if (q.type === 'voice') b.submitVoice(q.ans);
    else { q.ans.split('').forEach(c => useBattleStore.getState().inputLetter(c)); useBattleStore.getState().submitTyped(); }
    expect(useBattleStore.getState().phase).toBe('monsterDown');
    expect(useBattleStore.getState().runXp).toBe(firstClearXp(0, 0) + learningXp(0, true));
    expect(useSaveStore.getState().xpLedger['offered:firstClear']).toBe(firstClearXp(0, 0));
    setBattleRandom(Math.random);
  });
  it('marks old cleared stages paid without granting new XP or gold', () => {
    const id = REGIONS[0].id;
    const m = migrateSave({ ...initialSave, bestStage: { [id]: 20 }, mapStars: { [`${id}#0`]: [true, true, true] } }, 20);
    expect(m.firstClearXpClaimed[`${id}:0`]).toBe(true);
    expect(m.firstClearXpClaimed[`${id}:19`]).toBe(true);
    expect(m.firstClearXpClaimed[`${id}:20`]).toBeUndefined();
    expect(m.player).toEqual(initialSave.player); expect(m.gold).toBe(initialSave.gold);
  });
  it('banks XP at a temporary class cap instead of losing it', () => {
    useSaveStore.setState({ player: { ...initialSave.player, level: 40, xp: 0 } });
    useSaveStore.getState().gainXp(500, 'capCheck');
    expect(useSaveStore.getState().xpLedger['offered:capCheck']).toBe(500);
    expect(useSaveStore.getState().xpLedger['accepted:capCheck']).toBe(500);
    expect(useSaveStore.getState().player.xp).toBe(500);
  });
});
