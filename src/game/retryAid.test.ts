import { expect, it } from 'vitest';
import { retryAid } from './retryAid';
import { setBattleRandom, snapshotRetryState, restoreRetryState, useBattleStore } from '../store/battleStore';
import { initialSave, useSaveStore } from '../store/saveStore';
import { DEFAULT_CHARACTER } from './character';
import { REGIONS } from './regions';

it('steps boss assistance at the second, third, fourth and sixth attempts', () => {
  expect(retryAid(0, true)).toMatchObject({ energy: false, guard: false, revive: false, damage: 1, timeMs: 0, sealTotal: 10 });
  expect(retryAid(1, true)).toMatchObject({ energy: true, guard: true, revive: false });
  expect(retryAid(2, true)).toMatchObject({ revive: true, reviveRatio: .4, damage: 1, sealTotal: 8 });
  expect(retryAid(3, true)).toMatchObject({ damage: .85, timeMs: 2000 });
  expect(retryAid(5, true)).toMatchObject({ damage: .75, timeMs: 2000 });
  expect(retryAid(2, false)).toMatchObject({ guard: false, revive: false, damage: 1, timeMs: 0 });
  expect(retryAid(3, false)).toMatchObject({ revive: true, reviveRatio: .3 });
});

it('actual boss retries seed energy and shield, revive once at 40%, then add two seconds', () => {
  setBattleRandom(() => .99);
  useSaveStore.setState({ ...structuredClone(initialSave), character: DEFAULT_CHARACTER,
    settings: { ...initialSave.settings, showLessons: false } });
  const b = () => useBattleStore.getState();
  const originalRetries = snapshotRetryState();
  const stage = 39; // separate stage from regular battle regressions
  const start = () => b().startLevel(REGIONS[0].id, undefined, stage);
  const wrong = () => {
    const q = b().question!;
    if (q.type === 'choice') b().chooseOption(['A','B','C','D'].find(x => x !== q.ans && !b().assist?.hiddenOptions.includes(x))!);
    else if (q.type === 'voice') b().submitVoice('zzzz');
    else { b().inputLetter('Z'); b().submitTyped(); }
  };
  const fragile = () => useBattleStore.setState({ party: b().party.map(m => ({ ...m, hp: m.hp > 0 ? 1 : 0 })), playerHp: b().party.length, shield: false, comboGuard: false });
  const die = () => {
    for (let i = 0; i < 12 && b().phase !== 'gameOver'; i++) {
      if (b().phase === 'feedback') b().continueAfterFeedback();
      fragile(); wrong();
    }
    expect(b().phase).toBe('gameOver');
  };
  start();
  const hp = b().monsterMaxHp, timer = b().questionLimit;
  die();
  const secondAttempt = snapshotRetryState();
  start();
  expect(b().party.every(m => m.energy >= Math.ceil(m.energyMax / 2))).toBe(true);
  expect(b().comboGuard).toBe(true);
  expect(b().aidRevive).toBe(false);
  expect(b().monsterMaxHp).toBe(hp);
  die(); start();
  for (let i = 0; i < 6 && b().aidRevive; i++) {
    if (b().phase === 'feedback') b().continueAfterFeedback();
    fragile(); wrong();
  }
  expect(b().phase).not.toBe('gameOver');
  expect(b().aidRevive).toBe(false);
  expect(b().party.map(m => m.hp)).toEqual(b().party.map(m => Math.max(1, Math.round(m.maxHp * .4))));
  if (b().phase === 'feedback') b().continueAfterFeedback();
  die(); start();
  expect(b().aidGuard).toBe(.85);
  expect(b().questionLimit).toBe(timer + 2000);
  expect(b().monsterMaxHp).toBe(hp);
  die(); start(); die(); start();
  expect(b().aidGuard).toBe(.75);
  expect(b().monsterMaxHp).toBe(hp);
  restoreRetryState(secondAttempt); start();
  expect(b().aidRevive).toBe(false);
  expect(b().aidGuard).toBe(1);
  expect(b().comboGuard).toBe(true);
  restoreRetryState(originalRetries);
  setBattleRandom(Math.random);
});


it('the aided seal releases on eight cumulative answers without requiring six in a row', () => {
  setBattleRandom(() => .99);
  useSaveStore.setState({ ...structuredClone(initialSave), character: DEFAULT_CHARACTER,
    settings: { ...initialSave.settings, showLessons: false } });
  const b = () => useBattleStore.getState();
  b().startLevel(REGIONS[0].id, undefined, 19);
  useBattleStore.setState({ bossSkill: 'seal', sealed: true, sealHits: 7, aidSealTotal: 8,
    streak: 0, monsterHp: 1e9, monsterMaxHp: 1e9 });
  const q = b().question!;
  if (q.type === 'choice') b().chooseOption(q.ans);
  else if (q.type === 'voice') b().submitVoice(q.ans);
  else { q.ans.split('').forEach(c => b().inputLetter(c)); b().submitTyped(); }
  expect(b().sealHits).toBe(8);
  expect(b().sealed).toBe(false);
  setBattleRandom(Math.random);
});
