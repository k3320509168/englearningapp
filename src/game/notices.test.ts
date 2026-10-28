import { describe, expect, it } from 'vitest';
import { computeNotices, continueTarget, nextStep } from './notices';
import type { NoticeInput } from './notices';
import { REGIONS } from './regions';

const base = (): NoticeInput => ({
  character: { name: '測試', classId: 'mage', element: 'fire', gender: 'f', hair: 0, skin: 0, outfit: 0 } as unknown as NoticeInput['character'],
  unlockedIndex: 0,
  levelProgress: {},
  storySeen: [],
  gold: 0,
  tickets: 0,
  summonCounter: { sinceSsr: 0, spark: 0 },
  player: { level: 1, classPath: [] },
  materials: {},
  equipment: [],
  heroes: ['knight'],
  heroShards: {},
  heroTier: {},
  trueName: {},
  daily: null,
  mistakes: {},
});

describe('地圖提醒', () => {
  it('新玩家沒有任何紅點，下一步是繼續冒險', () => {
    const n = computeNotices(base());
    expect(n).toMatchObject({ classAdvance: false, forge: false, tierUp: false, summon: false, daily: false, dueMistakes: 0 });
    expect(nextStep(n).action).toBe('continue');
  });

  it('達到等級與突破條件時提醒轉職', () => {
    expect(computeNotices({ ...base(), player: { level: 10, classPath: [] }, unlockedIndex: 1 }).classAdvance).toBe(true);
    expect(computeNotices({ ...base(), player: { level: 10, classPath: [] }, unlockedIndex: 0 }).classAdvance).toBe(false);
  });

  it('材料與金幣夠、而且還沒擁有時才提醒鍛造', () => {
    const s = { ...base(), gold: 100, materials: { ore: 3 } };
    expect(computeNotices(s).forge).toBe(true);
    // 兩件入門裝備都有了就不再提醒
    const owned = [{ uid: 'a', defId: 'blade_training', plus: 0 }, { uid: 'b', defId: 'armor_cloth', plus: 0 }];
    expect(computeNotices({ ...s, equipment: owned }).forge).toBe(false);
  });

  it('召喚券夠十連才提醒召喚', () => {
    expect(computeNotices({ ...base(), tickets: 9 }).summon).toBe(false);
    expect(computeNotices({ ...base(), tickets: 10 }).summon).toBe(true);
  });

  it('只計算到期的錯題', () => {
    const q = { dueAt: 0 };
    const n = computeNotices({ ...base(), mistakes: { a: q, b: { dueAt: Date.now() + 1e9 } } });
    expect(n.dueMistakes).toBe(1);
  });
});

describe('繼續征途', () => {
  it('第一次進入區域要先看劇情，之後直接從進度繼續', () => {
    expect(continueTarget(base())).toEqual({ kind: 'region', regionIdx: 0, stage: 0, needsStory: true });
    const seen = { ...base(), storySeen: ['region-0'], levelProgress: { [REGIONS[0].id]: 13 } };
    expect(continueTarget(seen)).toEqual({ kind: 'region', regionIdx: 0, stage: 13, needsStory: false });
  });

  it('全部區域通關後前往黃金之路', () => {
    expect(continueTarget({ ...base(), unlockedIndex: REGIONS.length }).kind).toBe('golden');
  });
});
