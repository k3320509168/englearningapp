// Combo 招式（第二十一輪，0～100 萬）：12 階＝普通攻擊＋11 段大招。combo 達到門檻時，攻擊換成職業專屬的招式演出，
// 屬性決定顏色與粒子（見 ultimateFx.ts）。只影響畫面，不另外乘傷害（傷害由 comboMultiplier 決定）。
// 第 12 階（30 萬）之後每多一段再多一層回響光環；到 100 萬播一次「百萬 Combo」成就演出。
import type { ClassId } from './character';

export const ULTIMATE_THRESHOLDS = [10, 20, 50, 100, 300, 1000, 3000, 10000, 30000, 100000, 300000];
export const MILLION_COMBO = 1000000;

// 各階的稱號（招式名稱前的分級，顯示在招式名旁）
export const ULTIMATE_RANKS = ['初階技能', '戰技覺醒', '強化戰技', '奧義', '超奧義', '傳說技', '神話技', '領域技', '超領域', '神域降臨', '終極奧義'];

export const ULTIMATE_NAMES: Record<ClassId, string[]> = {
  swordsman: ['雙月斬', '月牙劍氣', '天降巨劍斬', '勝利聖劍', '萬劍齊射', '一刀斬斷天地', '十字天斷', '無盡劍域', '時空斬界', '萬象劍神', '斬斷因果'],
  warrior: ['破甲擊', '震地衝擊波', '隕石墜擊', '泰坦巨錘', '地裂山崩', '諸神黃昏', '巨神踐踏', '大地王權', '世界震擊', '不滅巨神', '開天闢地'],
  archer: ['雙重射擊', '三連穿雲箭', '漫天箭雨', '阿波羅太陽神之箭', '流星群箭', '銀河貫穿之弓', '蒼穹獵殺', '千星追獵', '天穹殲滅', '星河神射', '終焉之箭'],
  mage: ['星火散射', '第三位階・元素彈幕', '第五位階・魔法陣召喚', '第七位階・禁咒', '第九位階・天體隕石', '第十位階・創世魔法', '星界召喚', '元素星環', '永恆禁咒', '創世星海', '原初創世'],
  monk: ['靈光祈願', '聖光祝禱', '天使降臨', '神聖審判', '諸神庇護', '創世之光', '萬靈聖域', '生命聖殿', '天界敕令', '諸天神諭', '萬物新生'],
};

// 0 = 普通攻擊；1～11 對應上面的門檻
export function ultimateTier(combo: number): number {
  let t = 0;
  ULTIMATE_THRESHOLDS.forEach((min, i) => { if (combo >= min) t = i + 1; });
  return t;
}
export const MAX_ULTIMATE_TIER = ULTIMATE_THRESHOLDS.length;

// 30 萬以上的回響層數：每多 14 萬一層，最多 5 層（避免畫面太亂）
export const ultimateEchoes = (combo: number) => (combo < 300000 ? 0 : Math.min(5, 1 + Math.floor((combo - 300000) / 140000)));

export const ultimateName = (classId: ClassId, tier: number) => (tier > 0 ? ULTIMATE_NAMES[classId][tier - 1] : '');
export const ultimateRank = (tier: number) => (tier > 0 ? ULTIMATE_RANKS[tier - 1] : '');
