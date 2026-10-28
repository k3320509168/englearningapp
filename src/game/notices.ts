import type { Character } from './character';
import { canAdvance, nextOptions } from './growth';
import { EQUIPMENT, MAX_GRADE, gradeMaterial, gradeOf, resolveCost } from './equipment';
import type { OwnedEquip } from './equipment';
import { SPARK_COST, TEN_PULL, TIER_UP_GOLD, TIER_UP_SHARDS, heroDef } from './heroes';
import type { HeroId, SummonCounter } from './heroes';
import { TIER_UP_TRIALS, trialsDone } from './trueName';
import { claimableMilestones, dailyDef } from './daily';
import type { DailyState } from './daily';
import { REGIONS } from './regions';
import { regionStoryId } from './story';

// 地圖畫面的提醒：哪些入口有事可做（紅點），以及「繼續征途」該去哪裡、下一步建議做什麼。
// 只讀存檔、不改任何規則，所以放在純邏輯層方便測試。

export interface NoticeInput {
  character: Character | null;
  unlockedIndex: number;
  levelProgress: Record<string, number>;
  storySeen: string[];
  gold: number;
  tickets: number;
  summonCounter: SummonCounter;
  player: { level: number; classPath: string[] };
  materials: Record<string, number>;
  equipment: OwnedEquip[];
  equipped: Partial<Record<string, string>>;
  heroes: HeroId[];
  heroShards: Record<HeroId, number>;
  heroTier: Record<HeroId, number>;
  trueName: Record<HeroId, boolean[]>;
  daily: DailyState | null;
  mistakes: Record<string, { dueAt: number }>;
}

export interface Notices {
  classAdvance: boolean; // 可以轉職
  forge: boolean;        // 有還沒擁有、而且材料與金幣都夠的裝備
  gradeUp: boolean;      // 有裝備可以用同名裝備升品階
  tierUp: boolean;       // 有英雄可以升品階
  summon: boolean;       // 召喚券夠十連，或累積點數可以兌換
  daily: boolean;        // 有每日任務獎勵可以領
  dueMistakes: number;   // 到期該複習的錯題數
}

export function computeNotices(s: NoticeInput, now = Date.now()): Notices {
  const tier = (s.player.classPath.length + 1) as 1 | 2 | 3;
  const classAdvance = !!s.character && tier <= 3
    && nextOptions(s.character.classId, s.player.classPath).length > 0
    && canAdvance(tier, s.player.level, s.unlockedIndex);

  const owned = new Set(s.equipment.map(e => e.defId));
  const forge = !!s.character && EQUIPMENT.some(def => {
    if (owned.has(def.id) || s.gold < def.cost.gold) return false;
    if ((def.requires?.regionsCleared ?? 0) > s.unlockedIndex) return false;
    if ((def.requires?.classTier ?? 0) > s.player.classPath.length) return false;
    return Object.entries(resolveCost(def, s.character!.element)).every(([k, v]) => (s.materials[k] ?? 0) >= v);
  });

  const worn = Object.values(s.equipped).filter((u): u is string => !!u);
  const gradeUp = s.equipment.some(e => gradeOf(e) < MAX_GRADE && worn.includes(e.uid) && !!gradeMaterial(e, s.equipment, worn));

  const tierUp = s.heroes.some(id => {
    const r = heroDef(id).rarity;
    return (s.heroTier[id] ?? 0) < 1 && TIER_UP_SHARDS[r] > 0
      && (s.heroShards[id] ?? 0) >= TIER_UP_SHARDS[r] && s.gold >= TIER_UP_GOLD[r]
      && trialsDone(s.trueName[id]) >= TIER_UP_TRIALS;
  });

  return {
    classAdvance,
    forge,
    gradeUp,
    tierUp,
    summon: s.tickets >= TEN_PULL || s.summonCounter.spark >= SPARK_COST,
    daily: (s.daily?.tasks.some(t => !t.claimed && t.progress >= (dailyDef(t.id)?.goal ?? Infinity)) ?? false) || claimableMilestones(s.daily).length > 0,
    dueMistakes: Object.values(s.mistakes).filter(m => m.dueAt <= now).length,
  };
}

// 「繼續征途」：目前最前線的區域；全部通關後改去黃金之路
export type ContinueTarget =
  | { kind: 'region'; regionIdx: number; stage: number; needsStory: boolean }
  | { kind: 'golden' };

export function continueTarget(s: Pick<NoticeInput, 'unlockedIndex' | 'levelProgress' | 'storySeen'>): ContinueTarget {
  if (s.unlockedIndex >= REGIONS.length) return { kind: 'golden' };
  const regionIdx = Math.max(0, s.unlockedIndex);
  const region = REGIONS[regionIdx];
  return {
    kind: 'region',
    regionIdx,
    stage: s.levelProgress[region.id] ?? 0,
    // 第一次進入這個區域要先看開場劇情，交給區域地圖處理
    needsStory: !s.storySeen.includes(regionStoryId(regionIdx)),
  };
}

// 下一步建議：一次只給一件最值得做的事，避免玩家被一排選項淹沒
export type NextStepAction = 'daily' | 'growth' | 'summon' | 'heroes' | 'review' | 'continue';
export interface NextStep { icon: string; text: string; action: NextStepAction }

export function nextStep(n: Notices): NextStep {
  if (n.daily) return { icon: '🎁', text: '有每日獎勵可以領取', action: 'daily' };
  if (n.classAdvance) return { icon: '✨', text: '你可以轉職了！選擇新的職業路線', action: 'growth' };
  if (n.summon) return { icon: '🔮', text: '召喚券夠十連了，去召喚新英雄', action: 'summon' };
  if (n.forge) return { icon: '⚒️', text: '材料夠了，可以鍛造新裝備', action: 'growth' };
  if (n.gradeUp) return { icon: '★', text: '有同名裝備，可以幫身上的裝備升品階', action: 'growth' };
  if (n.tierUp) return { icon: '🌟', text: '有英雄可以升品階了', action: 'heroes' };
  if (n.dueMistakes > 0) return { icon: '📌', text: `${n.dueMistakes} 個錯題該複習了，先看一眼再出發`, action: 'review' };
  return { icon: '⚔️', text: '繼續冒險，往下一張地圖前進', action: 'continue' };
}
