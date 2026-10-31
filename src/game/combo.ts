// Combo 規則（全盤平衡最終規格 v2.0，docs/gpt/balance-r5-final-spec.md）
// - 顯示的 combo＝原生 combo（答對＋困難題 Bonus）＋技能 combo（技能加的，不參與之後的 Bonus 乘法，避免複利暴漲）
// - 困難題 Bonus 照原本 ×1／2／3／5／10 抽，但只乘原生 combo，單次最多 +15 萬
// - 技能加的 combo：每 8 題（這張地圖的實際作答數）合計最多 +40
// - 答錯：保留 50%（女神祝福 70%、守護 100%，互斥不疊乘）；真實連對另外歸零

export const BONUS_GAIN_CAP = 150_000;
export const SKILL_COMBO_WINDOW = 8;
export const SKILL_COMBO_CAP = 40;
export const WRONG_COMBO_KEEP = 0.5;

// 困難題 Bonus：回傳新的原生 combo 與實際增加量（畫面顯示「幸運 ×10｜Combo +150,000」）
export function applyHardBonus(organic: number, mult: number): { organic: number; gain: number } {
  const gain = Math.floor(Math.min(BONUS_GAIN_CAP, Math.max(0, organic * (mult - 1))));
  return { organic: organic + gain, gain };
}

// 技能加 combo：同一個 8 題視窗內合計最多 +40
export function grantSkillCombo(windowGain: number, requested: number): number {
  return Math.max(0, Math.min(requested, SKILL_COMBO_CAP - windowGain));
}

// 第幾個 8 題視窗（換視窗時技能 combo 額度重算）
export const skillWindowOf = (runAnswers: number) => Math.floor(runAnswers / SKILL_COMBO_WINDOW);

// 答錯：原生與技能 combo 用同一個保留率
export function decayCombo(combo: number, skill: number, keep: number): { combo: number; skill: number } {
  const organic = Math.floor(Math.max(0, combo - skill) * keep);
  const s = Math.floor(skill * keep);
  return { combo: organic + s, skill: s };
}
