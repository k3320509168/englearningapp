import type { ClassId } from './character';

// 職業合作：答對時隊員輪流出手，每個職業出手後會給「下一位」隊員一個接力加成；
// 所有站著的隊員連續輪過一次（中間沒有答錯）就觸發「連攜攻擊」。戰士會替隊友擋攻擊。
// 只影響傷害與敵人攻擊的目標，作答規則不變。

export interface RelayDef {
  icon: string;
  name: string;
  desc: string;
  dmg: number;          // 傷害 +%
  crit: number;         // 暴擊率 +
  ignoreWeak: boolean;  // 不受屬性被剋制的減傷
}

export const RELAY: Record<ClassId, RelayDef> = {
  swordsman: { icon: '⚔️', name: '劍氣接力', desc: '下一位隊員的攻擊 +25%', dmg: 0.25, crit: 0, ignoreWeak: false },
  archer: { icon: '🎯', name: '瞄準', desc: '下一位隊員的暴擊率 +25%', dmg: 0, crit: 0.25, ignoreWeak: false },
  mage: { icon: '🔮', name: '元素共鳴', desc: '下一位隊員的攻擊 +15%，而且不會因為屬性被剋制而減傷', dmg: 0.15, crit: 0, ignoreWeak: true },
  warrior: { icon: '📣', name: '戰吼', desc: '下一位隊員的攻擊 +15%', dmg: 0.15, crit: 0, ignoreWeak: false },
};

// 連攜攻擊：站著的隊員每多一位，傷害再 +25%
export const CHAIN_BONUS = 0.25;
export const chainMultiplier = (alive: number) => 1 + CHAIN_BONUS * Math.max(0, alive - 1);

// 戰士的挑釁：敵人有 70% 的機會改打站著的戰士，戰士受到的這一擊傷害 -25%
export const TAUNT_CHANCE = 0.7;
export const TAUNT_REDUCTION = 0.25;

export interface Relay { classId: ClassId; by: string }

// 接力加成只給「別人」：自己接自己（只剩一位隊員時）沒有加成
export const relayFor = (relay: Relay | null, attackerId: string): RelayDef | null =>
  relay && relay.by !== attackerId ? RELAY[relay.classId] : null;

// 更新連攜進度：同一位隊員又出手就重新開始；所有站著的隊員都出手過（至少 2 位）就觸發
export function advanceChain(chain: string[], attackerId: string, aliveIds: string[]): { chain: string[]; triggered: boolean } {
  const next = chain.includes(attackerId) ? [attackerId] : [...chain, attackerId];
  const triggered = aliveIds.length >= 2 && aliveIds.every(id => next.includes(id));
  return { chain: triggered ? [] : next, triggered };
}
