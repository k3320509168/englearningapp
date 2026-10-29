// 被動天賦（第四輪，和 Gemini 討論定案）：每位角色除了主動技能，還有一個常駐的被動天賦。
// 數值隨稀有度成長：N 是 low，UR 是 high（主角依轉職階段成長）。
import type { ClassId } from './character';

export type TalentId =
  | 'berserk' | 'resonance' | 'giantSlayer'      // 輸出
  | 'ironWill' | 'rebirth'                        // 防禦
  | 'lifesteal' | 'energySpring'                  // 治療／續航
  | 'insight' | 'luckyStar';                      // 英文輔助（答題速度與時機）

export interface TalentDef {
  id: TalentId;
  icon: string;
  name: string;
  low: number;
  high: number;
  desc: (v: number) => string;
}

const pct = (v: number) => `${Math.round(v * 100)}%`;

export const TALENTS: Record<TalentId, TalentDef> = {
  berserk: { id: 'berserk', icon: '🔥', name: '殘血狂化', low: 0.2, high: 0.5, desc: v => `自己的生命低於 30% 時，攻擊 +${pct(v)}` },
  resonance: { id: 'resonance', icon: '🎵', name: 'Combo 共鳴', low: 0.05, high: 0.15, desc: v => `每 10 combo，攻擊 +${pct(v)}（最多 +100%）` },
  giantSlayer: { id: 'giantSlayer', icon: '🗡️', name: '巨人殺手', low: 0.15, high: 0.35, desc: v => `對首領的傷害 +${pct(v)}` },
  ironWill: { id: 'ironWill', icon: '🪨', name: '鋼鐵意志', low: 0.1, high: 0.3, desc: v => `被攻擊時有 ${pct(v)} 機率傷害減半` },
  rebirth: { id: 'rebirth', icon: '🕊️', name: '不死鳥之羽', low: 0.1, high: 0.3, desc: v => `倒下時有 ${pct(v)} 機率以 30% 生命站起來（每關一次）` },
  lifesteal: { id: 'lifesteal', icon: '🩸', name: '吸血', low: 0.05, high: 0.15, desc: v => `把造成傷害的 ${pct(v)} 轉為自己的生命（每擊最多回復 10%）` },
  energySpring: { id: 'energySpring', icon: '⚡', name: '能量泉源', low: 1, high: 3, desc: v => `每次出戰，技能能量先有 ${Math.round(v)} 點` },
  insight: { id: 'insight', icon: '💡', name: '靈光一閃', low: 1, high: 2, desc: v => `2 秒內答對，combo 額外 +${Math.round(v)}` },
  luckyStar: { id: 'luckyStar', icon: '🍀', name: '運氣大師', low: 0.2, high: 0.5, desc: v => `最後 3 秒才答對時，有 ${pct(v)} 機率技能能量直接集滿` },
};

// 主角的天賦依職業固定
export const CLASS_TALENT: Record<ClassId, TalentId> = {
  swordsman: 'resonance', warrior: 'ironWill', archer: 'insight', mage: 'giantSlayer', monk: 'lifesteal',
};

// 英雄的天賦依名字固定抽一個（和技能一樣，每次開遊戲都相同）
const HERO_POOL: TalentId[] = ['berserk', 'resonance', 'giantSlayer', 'ironWill', 'rebirth', 'lifesteal', 'energySpring', 'insight', 'luckyStar'];
export function heroTalent(id: string): TalentId {
  let h = 7;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return HERO_POOL[h % HERO_POOL.length];
}

// 技能威力（N 1.0 … UR 1.9；主角 1.15 … 1.75）換算成天賦數值
export function talentValue(id: TalentId, power: number): number {
  const t = TALENTS[id];
  const k = Math.min(1, Math.max(0, (power - 1) / 0.9));
  return t.low + (t.high - t.low) * k;
}

export const talentDesc = (id: TalentId, power: number) => TALENTS[id].desc(talentValue(id, power));
