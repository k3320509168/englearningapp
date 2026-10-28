import { describe, expect, it } from 'vitest';
import { RELAY, advanceChain, chainMultiplier, relayFor } from './synergy';

describe('職業合作', () => {
  it('接力加成只給下一位「別的」隊員', () => {
    expect(relayFor({ classId: 'swordsman', by: 'player' }, 'knight')).toBe(RELAY.swordsman);
    expect(relayFor({ classId: 'swordsman', by: 'player' }, 'player')).toBeNull();
    expect(relayFor(null, 'player')).toBeNull();
  });

  it('所有站著的隊員輪過一次就觸發連攜，之後重新計算', () => {
    const alive = ['player', 'knight', 'apple'];
    let s = advanceChain([], 'player', alive);
    expect(s).toEqual({ chain: ['player'], triggered: false });
    s = advanceChain(s.chain, 'knight', alive);
    s = advanceChain(s.chain, 'apple', alive);
    expect(s).toEqual({ chain: [], triggered: true });
    // 同一位隊員連續出手（例如魔王題由隊長出手）就重新開始
    expect(advanceChain(['player', 'knight'], 'player', alive)).toEqual({ chain: ['player'], triggered: false });
    // 只有一位隊員時不會觸發
    expect(advanceChain([], 'player', ['player']).triggered).toBe(false);
  });

  it('連攜傷害隨人數增加', () => {
    expect(chainMultiplier(2)).toBeCloseTo(1.25);
    expect(chainMultiplier(4)).toBeCloseTo(1.75);
  });
});
