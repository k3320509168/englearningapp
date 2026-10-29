// Combo 大招（第四輪）：combo 達到 20／50／100／300／1000 時，攻擊換成職業專屬的大招特效。
// 只影響畫面，不影響傷害；1000 以上每多 1000 再多一層回響光環，沒有上限。
import type { ClassId } from './character';

export const ULTIMATE_THRESHOLDS = [20, 50, 100, 300, 1000];

export const ULTIMATE_NAMES: Record<ClassId, string[]> = {
  swordsman: ['月牙劍氣', '天降巨劍斬', '勝利聖劍', '萬劍齊射', '一刀斬斷天地'],
  warrior: ['震地衝擊波', '隕石墜擊', '泰坦巨錘', '地裂山崩', '諸神黃昏'],
  archer: ['三連穿雲箭', '漫天箭雨', '阿波羅太陽神之箭', '流星群箭', '銀河貫穿之弓'],
  mage: ['第三位階・元素彈幕', '第五位階・魔法陣召喚', '第七位階・禁咒', '第九位階・天體隕石', '第十位階・創世魔法'],
  monk: ['聖光祝禱', '天使降臨', '神聖審判', '諸神庇護', '創世之光'],
};

// 0 = 還沒有大招；1～5 對應上面的門檻
export function ultimateTier(combo: number): number {
  let t = 0;
  ULTIMATE_THRESHOLDS.forEach((min, i) => { if (combo >= min) t = i + 1; });
  return t;
}

// 1000 以上的回響層數（1000 = 0 層、2000 = 1 層 …，最多 5 層，避免畫面太亂）
export const ultimateEchoes = (combo: number) => Math.min(5, Math.max(0, Math.floor(combo / 1000) - 1));

export const ultimateName = (classId: ClassId, tier: number) => (tier > 0 ? ULTIMATE_NAMES[classId][tier - 1] : '');
