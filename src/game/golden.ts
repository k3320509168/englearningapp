import type { Stage } from './types';
import type { Decks } from './QuestionData';
import { LEVELS, createDecks } from './QuestionData';
import { BASE_DAMAGE } from './battle';
import { REGIONS } from './regions';

// 黃金之路：只用初始角色（Lv 1、沒有轉職、沒有裝備、沒有夥伴）挑戰。
// 題目從第一個區域一路升到最後一個區域，每個區域 5 關（最後一關是守門頭目），終點是沉默魔王。
// 不能答錯、不能超時；combo 與魔王題倍率一路累乘，英文夠強才能打出擊倒魔王的數億傷害。

export const GOLDEN_STAGES_PER_TIER = 5;
export const GOLDEN_TIERS = LEVELS.length;
export const GOLDEN_STAGE_COUNT = GOLDEN_STAGES_PER_TIER * GOLDEN_TIERS;
export const GOLDEN_LEVEL_KEY = 'golden-road';
export const GOLDEN_FINAL_HP = 200_000_000; // 沉默魔王：兩億

export const goldenTier = (stageIdx: number) => Math.min(GOLDEN_TIERS - 1, Math.floor(stageIdx / GOLDEN_STAGES_PER_TIER));

export function createGoldenDecks(): Decks[] {
  return LEVELS.map(level => createDecks(level));
}

export function generateGoldenStages(decks: Decks[]): Stage[] {
  const stages: Stage[] = [];
  for (let i = 0; i < GOLDEN_STAGE_COUNT; i++) {
    const tier = goldenTier(i);
    const d = decks[tier];
    const isGate = i % GOLDEN_STAGES_PER_TIER === GOLDEN_STAGES_PER_TIER - 1;
    const isFinal = i === GOLDEN_STAGE_COUNT - 1;
    const region = REGIONS[tier]?.name ?? '';
    if (isFinal) stages.push({ name: `第 ${i + 1} 關：沉默魔王`, bossMode: true, kind: 'final', questions: [d.boss()] });
    else if (isGate) stages.push({ name: `第 ${i + 1} 關：${region}守門者`, bossMode: true, questions: [d.boss()] });
    else stages.push({ name: `第 ${i + 1} 關：${region}試煉`, bossMode: false, questions: [d.normal()] });
  }
  return stages;
}

// 怪物血量：越後面成長越快，沒有 combo 與魔王題倍率根本打不倒
export function goldenMonsterHp(stageIdx: number, stage: Stage): number {
  if (stage.kind === 'final') return GOLDEN_FINAL_HP;
  const tier = goldenTier(stageIdx);
  return Math.round(stage.bossMode ? BASE_DAMAGE * 12 * 4 ** tier : BASE_DAMAGE * 2.5 * 1.7 ** tier);
}

export const GOLDEN_TITLE = '掌握古代咒語的超時空勇者';
export const MAIN_TITLE = '語言守護者';
export const GOLDEN_CLEAR_TICKETS = 10;
