import { allowance, allowanceCap, catchupXp, frontierRecommendedLevel, isCatchupSource } from '../game/xpCatchup';
import { firstClearXp, learningXp } from '../game/experiencePool';
import { emptyMapMastery, masteryReady, recordMastery, MASTERY_PACKS } from '../game/mapMastery';
import type { MapMastery } from '../game/mapMastery';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { StateStorage } from 'zustand/middleware';
import type { Question } from '../game/types';
import { questionKey } from '../game/battle';
import { WHEEL_PRIZES, rollWheel } from '../game/wheel';
import { STABLE_GAP, STRICT_TRIALS_PER_DAY, knowledgeKey, updateKnowledge } from '../game/knowledge';
import type { KnowledgeRecord } from '../game/knowledge';
import { REGION_LEVELS } from '../game/progression';
// v18 換算等級時用的推薦等級表（之後 A1 改從 Lv5 起，但舊存檔照當時的規則換算）
const V18_REGION_LEVELS: [number, number][] = [[1, 20], [21, 40], [41, 60], [61, 80], [81, 100], [101, 120], [121, 145], [146, 170], [171, 200]];
import { ITEMS, SRS_INTERVALS, SRS_MASTERED_BOX, UPGRADES, upgradeCost } from '../game/progression';
import type { ItemId, UpgradeId } from '../game/progression';
import {
  DUPLICATE_SHARDS, MAX_STARS, SPARK_COST, STAR_COSTS, STAR_GOLD, STARTER_TICKETS, TICKET_GOLD_PRICE, TIER_UP_GOLD, TIER_UP_SHARDS,
  currentRarity, heroDef, isHeroId, summon,
} from '../game/heroes';
import type { HeroId, SummonCounter, SummonResult } from '../game/heroes';
import { STAR_TICKETS, mergeStars } from '../game/stars';
import { towerReward } from '../game/modes';
import { BADGE_COST, HERO_LEVEL_CAPS, MAX_LEVEL, addXp, bestTier, canAdvance, classNode, cumulativeXpAtLevel, nextOptions, pathBadgeCost, playerLevelCap, xpScale, xpToNext } from '../game/growth';
import { MAX_GRADE, SELL_RATE, enhanceChance, enhanceCost, equipDef, rollDrops, gradeMaterial, gradeOf, gradeRefund, maxPlus, resolveCost, sellValue } from '../game/equipment';
import type { OwnedEquip, Slot } from '../game/equipment';
import { TIER_UP_TRIALS, TRIAL_COUNT, TRIAL_SHARDS, TRUE_NAME_REWARD, trialsDone } from '../game/trueName';
import { applyDailyEvent, claimableMilestones, dailyDef, localDate, refreshDaily, refreshWeekly, streakMilestone, weeklyDef } from '../game/daily';
import type { DailyEvent, DailyState, WeeklyState } from '../game/daily';
import { ELEMENTS, normalizeCharacter } from '../game/character';
import { ALL_HINTS } from '../game/hints';
import { MAP_SIZE, REGIONS, regionStageCount } from '../game/regions';

// v15 以前：每區 5 張地圖 × 10 關
const OLD_MAP_SIZE = 10;
const OLD_STAGES_PER_REGION = 50;
import { clearStoryId, regionStoryId } from '../game/story';
import type { Character, ClassId } from '../game/character';
import { PARTY_MAX } from '../game/party';
import type { MemberId } from '../game/party';
import {
  WEAPON_DUPE_SHARDS,
  WEAPON_SPARK_COST,
  WEAPON_TICKET_BUY_WEEKLY,
  WEAPON_TICKET_GOLD_PRICE,
  WEAPON_UNLOCK_REGION,
  rollWeaponSummon,
  weaponForHero,
  weaponUpgradeCost,
} from '../game/weapons';
import type { WeaponSummonDrop } from '../game/weapons';

// 玩家存檔（存在瀏覽器 localStorage）。
// 修改資料結構時：SAVE_VERSION +1，並在 migrateSave 補上舊版轉換，避免舊存檔壞掉。
export const SAVE_VERSION = 23;

// 錯題本＝間隔重複（SRS）的複習清單：box 越高，下次複習間隔越長
export interface MistakeRecord {
  question: Question;
  wrongCount: number;
  lastWrongAt: number;
  box: number;
  dueAt: number;
}

// 圖鑑：遇過的每一題
export interface CodexEntry {
  question: Question;
  correct: number;
  wrong: number;
  firstSeenAt: number;
}

export interface Settings {
  speechRate: number;
  volume: number;
  sfxVolume: number;    // 打擊音效
  autoSpeak: boolean;   // 出題時自動播放發音
  showLessons: boolean; // 每 10 關開始前自動顯示戰前預習
  voiceAsSpelling: boolean; // 不方便用麥克風時，口說題改成拼寫題
  musicVolume: number;      // 背景音樂
  reduceMotion: boolean;    // 減少動態效果：不震動、不閃光
  textScale: number;        // 文字大小（1 = 標準）
  voiceName?: string;       // 發音用的語音（空白 = 自動選最清楚的）
  slowRate?: number;        // 慢速按鈕的語速（和正常語速分開設定）
}

export interface PlacementRecord {
  level: number;            // 0 Pre-A1 … 9 C2
  region: number;           // 推薦的區域（level − 1）
  at: number;
  speakingVerified: boolean;
  confidence: 'ok' | 'low';
  weak: string[];
  verified: boolean;        // 通過推薦區域的區域試煉
  verifiedAt?: number;      // 通過區域試煉時間戳
  lastReviewAt?: number;    // 上次回顧時間戳
  reviewPassed?: boolean;   // 7天回顧是否通過
  reviewWeak?: string[];    // 回顧未通過時的弱項
}

interface SaveData {
  // 玩家自創的主角；null 代表還沒建立（第一次進入遊戲會先開角色創建）
  character: Character | null;
  unlockedIndex: number;
  // 前置區域「失語邊境」打完了沒（或程度測驗直接跳過）；沒打完時「踏上征途」先去那裡
  prologueDone: boolean;
  // 程度測驗 v1.6 的結果：跳級的玩家在該區（含之後）戰鬥時至少以該區最低推薦等級計算，通過區域試煉才正式補等級
  placement: PlacementRecord | null;
  // 每個區域目前打到第幾關（stage index），離開後回來從這裡繼續
  levelProgress: Record<string, number>;
  micAsked: boolean;
  mistakes: Record<string, MistakeRecord>;
  codex: Record<string, CodexEntry>;
  // 知識點：哪幾天無提示答對（跨日穩定、守門人封印用，見 game/knowledge.ts）
  knowledge: Record<string, KnowledgeRecord>;
  mapMastery: Record<string, MapMastery>;
  firstClearXpClaimed: Record<string, boolean>;
  learningXpDay: Record<string, string>;
  xpLedger: Record<string, number>;
  // 打倒過區域最終魔王的區域（之後要完成守門人封印＋區域試煉才開下一區）
  bossDown: number[];
  // 高標準區域試煉（封印未完成或跳級）的挑戰時間，每區 24 小時內最多 2 次
  strictTrials: Record<string, number[]>;
  settings: Settings;
  tutorialDone: boolean;
  gold: number;
  upgrades: Record<UpgradeId, number>;
  items: Record<ItemId, number>;
  heroes: HeroId[];
  // 出戰隊伍（第一位是隊長），'player' 代表主角
  party: MemberId[];
  // 召喚（抽卡）：召喚券、保底與累積點數、重複英雄轉成的碎片、已升品階的英雄
  tickets: number;
  summonCounter: SummonCounter;
  // 專武系統（STAGE_PLAN.md 第 15 節）：SSR 英雄與主角專武
  weaponTickets: number;
  weapons: Record<string, { level: number; unlocked: boolean }>;
  weaponShards: Record<string, number>;
  weaponCounter: { sinceSsr: number; spark: number };
  heroShards: Record<HeroId, number>;
  heroStars: Record<HeroId, number>; // SSR 升星（0～4 星）
  wishShards: number;                // 願望碎片：任何英雄都能用來補不足的碎片
  shardQuizDay: string;              // 每日碎片英文題最後完成的日期（一天一次）
  rushDay: string;                   // 每日素材本：今天的日期與已挑戰次數
  rushRuns: number;
  xpAllowanceDay: string;
  xpAllowanceGold: number;
  xpAllowanceRemainder: number;
  towerFloor: number;                // 英雄時空之塔：已通過的最高層
  sweepTickets: number;              // 掃蕩券：三星地圖直接領獎勵（錯題修煉場、獎勵轉盤取得）
  // 獎勵轉盤：已經給過轉盤的關卡（只有第一次破關給）、還沒轉的次數、連續銘謝惠顧幾次
  wheelClaimed: string[];
  // 金幣買召喚券的本週數量；錯題修煉場今天已經給了幾題的金幣
  ticketBuys: { week: string; count: number };
  weaponTicketBuys: { week: string; count: number };
  trainingGoldDay: string;
  trainingGoldCount: number;
  wheelPending: number;
  wheelDry: number;
  trainingDay: string;               // 錯題修煉場今天已送出的掃蕩券數（每天上限）
  trainingGiven: number;
  heroTier: Record<HeroId, number>;
  // 世界：每張地圖的最佳三星紀錄（key 為 regionId#mapIdx）、每個區域打到過的最遠關卡、看過的劇情
  mapStars: Record<string, boolean[]>;
  bestStage: Record<string, number>;
  storySeen: string[];
  storyRewardClaimed: string[];
  // 成長：主角等級與轉職路線、英雄等級、素材、裝備
  player: { level: number; xp: number; classPath: string[] };
  // 主角換職業：每個職業各自的轉職路線（目前職業的路線也同步在 player.classPath）、創角時的職業、職業徽章
  classPaths: Record<string, string[]>;
  homeClass: ClassId | null;
  classBadges: number;
  heroLevel: Record<HeroId, number>;
  materials: Record<string, number>;
  equipment: OwnedEquip[];
  equipped: Partial<Record<Slot, string>>;
  // 真名考驗：每位英雄五項考驗是否完成
  trueName: Record<HeroId, boolean[]>;
  // 已經領過「真名考驗全部完成」獎勵的英雄（賣掉再抽回來也不重領）
  trueNameRewarded: HeroId[];
  // 黃金之路最多通過幾關（全部通關為關卡總數）、獲得的稱號
  goldenBest: number;
  titles: string[];
  // 每日任務與連續登入；擴充魔王（聽說讀寫）的通關紀錄
  daily: DailyState | null;
  weekly: WeeklyState | null; // 每週任務
  skillBossCleared: string[];
  // 戰鬥中已看過的情境提示
  hintsSeen: string[];
  _weaponBossBackfilled?: boolean;
}

// 一次召喚的結果：新英雄，或重複時得到的碎片數
export interface SummonOutcome extends SummonResult {
  isNew: boolean;
  shards: number;
}

interface SaveActions {
  setCharacter: (c: Character) => void;
  unlockLevel: (index: number) => void;
  // 跳級（程度測驗或守門試煉）：前面 count 個區域視為通關，地圖全部開放（之後可以回去拿星星），劇情可在劇情回顧補看
  skipRegions: (count: number) => void;
  setLevelProgress: (levelKey: string, stageIdx: number) => void;
  setMicAsked: () => void;
  // review：這次作答是否算一次 SRS 複習（看完正確答案後的重答不算）
  // counted：算不算知識點的無提示成功（預設同 review）。回傳 true＝這次是跨日成功（封印能量）
  recordMapLearning: (map: string, q: Question, fallback: boolean) => void;
  recordMapStage: (map: string, stageInMap: number) => void;
  claimMapMastery: (region: number, mapIdx: number) => boolean;
  recordAnswer: (q: Question, correct: boolean, review: boolean, counted?: boolean) => boolean;
  defeatRegionBoss: (regionIdx: number) => void;
  // 第一次破這一關：給一次轉盤（回傳有沒有給）
  grantWheel: (key: string) => boolean;
  // 轉一次：回傳抽中的獎品序號（沒有轉盤機會時是 -1）
  spinWheel: (rand?: () => number) => number;
  recordStrictTrial: (regionIdx: number, at: number) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setTutorialDone: (done: boolean) => void;
  finishPrologue: () => void;
  setPlacement: (rec: PlacementRecord) => void;
  verifyPlacement: (regionIdx: number, speakingVerified?: boolean) => void;
  recordPlacementReview: (passed: boolean, weak: string[]) => void;
  addGold: (amount: number) => void;
  buyUpgrade: (id: UpgradeId) => boolean;
  buyItem: (id: ItemId) => boolean;
  consumeItem: (id: ItemId) => boolean;
  addTickets: (n: number) => void;
  buyTicket: () => boolean;
  buyWeaponTicket: () => boolean;
  earnTrainingGold: () => number;
  summonHeroes: (count: number, rand?: () => number) => SummonOutcome[] | null;
  exchangeSpark: (id: HeroId) => SummonOutcome | null;
  addWeaponTickets: (n: number) => void;
  summonWeapons: (count: number, rand?: () => number) => WeaponSummonDrop[] | null;
  upgradeWeapon: (weaponId: string) => boolean;
  exchangeWeaponSpark: (weaponId: string) => boolean;
  unlockWeapon: (weaponId: string) => void;
  tierUp: (id: HeroId) => boolean;
  starUp: (id: HeroId) => boolean;
  finishShardQuiz: (correct: number) => number; // 回傳得到的願望碎片
  startRush: () => void;
  grantRush: (reward: { gold: number; xp: number; ore: number }) => { gold: number; xp: number; ore: number; bonus: number; allowanceGold: number };
  clearTowerFloor: (floor: number, heroId: HeroId | null) => { shards: number; gold: number; xp: number; bonus: number; allowanceGold: number } | null; // 第一次通過才有獎勵
  earnSweepTickets: () => number;    // 修煉場連對 5 題：回傳實際拿到的張數（每天上限）
  sweepMap: (regionIdx: number, rand?: () => number) => { gold: number; xp: number; drops: Record<string, number> } | null;
  // 記錄地圖星星，回傳這次新拿到幾顆（每顆送召喚券）
  recordMapStars: (key: string, stars: boolean[]) => number;
  markStorySeen: (id: string) => void;
  claimStoryReward: (id: string) => { rewardType: 'ticket' | 'sweep'; amount: number } | null;
  claimStageXp: (region: number, stage: number) => { xp: number; levels: number };
  grantLearningXp: (region: number, q: Question, eligible: boolean, replay?: boolean) => { xp: number; levels: number; allowanceGold: number; bonus: number };
  awardXp: (n: number, source?: string) => { xp: number; levels: number; bonus: number; allowanceGold: number };
  gainXp: (n: number, source?: string) => number; // 回傳升了幾級
  advanceClass: (nodeId: string) => boolean;
  // 換職業（戰鬥外、免費）；重置目前職業的路線（退回徽章）
  switchClass: (classId: ClassId) => boolean;
  resetClassPath: () => boolean;
  addMaterials: (drops: Record<string, number>) => void;
  forge: (defId: string) => boolean;
  enhance: (uid: string, holy?: boolean, rand?: () => number) => 'ok' | 'fail' | false; // 失敗只扣材料
  sellEquip: (uid: string) => boolean;
  gradeUp: (uid: string) => boolean;
  sellHero: (id: HeroId) => number; // 回傳得到的金幣，不能賣時回傳 0
  equip: (uid: string) => void;
  unequip: (slot: Slot) => void;
  trainHero: (id: HeroId) => boolean;
  // 一鍵訓練：金幣夠就一直升，直到上限；回傳升了幾級
  trainHeroMax: (id: HeroId) => number;
  // 完成一項真名考驗，第一次完成時送碎片；回傳是否第一次完成
  completeTrial: (id: HeroId, trialIdx: number) => boolean;
  recordGolden: (stagesReached: number) => void;
  ensureDaily: () => void;
  trackDaily: (event: DailyEvent, amount?: number) => void;
  claimDaily: (id: string) => boolean;
  claimStreak: (days: number) => boolean;
  claimWeekly: (id: string) => boolean;
  recordSkillBoss: (id: string) => boolean; // 第一次通關回傳 true
  markHint: (id: string) => void;
  addTitle: (title: string) => boolean;
  toggleMember: (id: MemberId) => void;
  setLeader: (id: MemberId) => void;
  placeMember: (id: MemberId, slot: number) => void; // 拖拉英雄到第 slot 格（0 = 隊長）：換位、替換或補上空位
  clearParty: () => void; // 一鍵撤下：只留主角當隊長
  resetProgress: () => void; // 全部歸零，從建立主角重新開始
}

export const initialSave: SaveData = {
  character: null,
  unlockedIndex: 0,
  prologueDone: false,
  placement: null,
  levelProgress: {},
  micAsked: false,
  mistakes: {},
  codex: {},
  knowledge: {},
  mapMastery: {},
  firstClearXpClaimed: {},
  learningXpDay: {},
  xpLedger: {},
  bossDown: [],
  strictTrials: {},
  settings: { speechRate: 0.9, volume: 1, sfxVolume: 0.7, autoSpeak: true, showLessons: true, voiceAsSpelling: false, musicVolume: 0.35, reduceMotion: false, textScale: 1 },
  tutorialDone: false,
  gold: 0,
  upgrades: { hp: 0, atk: 0, combo: 0, gold: 0 },
  items: { potion: 0, hint: 0, shield: 0 },
  heroes: ['knight'],
  party: ['player', 'knight'],
  tickets: STARTER_TICKETS,
  summonCounter: { sinceSsr: 0, spark: 0 },
  weaponTickets: 0,
  weapons: {},
  weaponShards: {},
  weaponCounter: { sinceSsr: 0, spark: 0 },
  heroShards: {},
  heroStars: {},
  wishShards: 0,
  shardQuizDay: '',
  rushDay: '',
  rushRuns: 0,
  xpAllowanceDay: '', xpAllowanceGold: 0, xpAllowanceRemainder: 0,
  towerFloor: 0,
  sweepTickets: 0,
  wheelClaimed: [],
  ticketBuys: { week: '', count: 0 },
  weaponTicketBuys: { week: '', count: 0 },
  trainingGoldDay: '',
  trainingGoldCount: 0,
  wheelPending: 0,
  wheelDry: 0,
  trainingDay: '',
  trainingGiven: 0,
  heroTier: {},
  mapStars: {},
  bestStage: {},
  storySeen: [],
  storyRewardClaimed: [],
  player: { level: 1, xp: 0, classPath: [] },
  classPaths: {},
  homeClass: null,
  classBadges: 0,
  heroLevel: {},
  materials: {},
  equipment: [],
  equipped: {},
  trueName: {},
  trueNameRewarded: [],
  goldenBest: 0,
  titles: [],
  daily: null,
  weekly: null,
  skillBossCleared: [],
  hintsSeen: [],
};

export const TICKET_BUY_WEEKLY = 5;
export const TRAINING_GOLD = 10;
export const TRAINING_GOLD_MAX = 20;

// 英雄訓練的金幣：等級越高、稀有度越高越貴
export const trainCost = (level: number, rarityIdx: number) => 30 * level * (rarityIdx + 1);

// 送別英雄（賣掉）：依稀有度的基本金幣＋訓練與升品階投入金幣的 65%。
// 只退金幣，不退召喚券或累積點數，避免「抽了再賣」刷召喚；該英雄的碎片保留。
export const HERO_SELL_BASE: Record<string, number> = { N: 50, R: 100, SR: 250, SSR: 600, UR: 1500 };
export function heroSellValue(id: HeroId, level: number, tier: number): number {
  const rarity = heroDef(id).rarity;
  const rarityIdx = ['N', 'R', 'SR', 'SSR'].indexOf(rarity);
  let invested = 0;
  for (let l = 1; l < level; l++) invested += trainCost(l, rarityIdx);
  if (tier > 0) invested += TIER_UP_GOLD[rarity];
  return HERO_SELL_BASE[rarity] + Math.floor(invested * SELL_RATE);
}

// 把召喚到的英雄加進存檔：新英雄直接擁有（隊伍有空位就加入），重複的轉成碎片
function grantHero(s: SaveData, r: SummonResult): { patch: Pick<SaveData, 'heroes' | 'party' | 'heroShards' | 'heroLevel'>; outcome: SummonOutcome } {
  if (!s.heroes.includes(r.id)) {
    return {
      patch: {
        heroes: [...s.heroes, r.id], party: s.party.length < PARTY_MAX ? [...s.party, r.id] : s.party, heroShards: s.heroShards,
        heroLevel: s.heroLevel,
      },
      outcome: { ...r, isNew: true, shards: 0 },
    };
  }
  const shards = DUPLICATE_SHARDS[heroDef(r.id).rarity];
  return {
    patch: { heroes: s.heroes, party: s.party, heroShards: { ...s.heroShards, [r.id]: (s.heroShards[r.id] ?? 0) + shards }, heroLevel: s.heroLevel },
    outcome: { ...r, isNew: false, shards },
  };
}

const isPlainObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

// 依預設值的型別檢查存檔欄位：型別不對（例如 heroes: null、gold: "abc"）就用預設值，
// 避免壞掉的存檔（匯入的存檔碼、手動修改、資料損毀）讓整個遊戲白畫面
export function conform<T>(fallback: T, value: unknown): T {
  if (Array.isArray(fallback)) return (Array.isArray(value) ? value : fallback) as T;
  // 存檔裡的數字（金幣、召喚券、等級、音量…）都不會是負數
  if (typeof fallback === 'number') return (typeof value === 'number' && Number.isFinite(value) ? (fallback >= 0 ? Math.max(0, value) : value) : fallback) as T;
  if (typeof fallback === 'string' || typeof fallback === 'boolean') return (typeof value === typeof fallback ? value : fallback) as T;
  if (isPlainObject(fallback)) {
    if (!isPlainObject(value)) return fallback;
    // 動態 key 的紀錄（錯題、圖鑑、各區進度…）只要求是物件
    if (Object.keys(fallback).length === 0) return value as T;
    const out: Record<string, unknown> = { ...value };
    for (const k of Object.keys(fallback)) out[k] = conform((fallback as Record<string, unknown>)[k], value[k]);
    return out as T;
  }
  return value as T;
}

// 第四輪之前的 6 個區域在新順序中的位置（第 6 個 = 全部通關）
const OLD_REGION_TO_NEW = [0, 1, 3, 5, 7, 8, 9];

// 付碎片：先用這位英雄自己的碎片，不夠的用願望碎片補；付不起回傳 null
function payShards(s: SaveData, id: HeroId, need: number): Partial<SaveData> | null {
  const own = s.heroShards[id] ?? 0;
  const fromWish = Math.max(0, need - own);
  if (fromWish > s.wishShards) return null;
  return { heroShards: { ...s.heroShards, [id]: own - (need - fromWish) }, wishShards: s.wishShards - fromWish };
}
export const SWEEP_PER_STREAK = 3;
export const SWEEP_STREAK = 5;
export const SWEEP_DAILY_MAX = 5;
export const SHARD_QUIZ_COUNT = 5;
export const SHARD_QUIZ_PER = 2;
export const SHARD_QUIZ_MAX = 10;

export function migrateSave(persisted: unknown, version: number): SaveData {
  const data = (isPlainObject(persisted) ? persisted : {}) as Partial<SaveData> & { hero?: HeroId };
  // 每次升級都只「新增欄位」，所以用預設值補齊即可。
  // v1 → v2：舊玩家已經玩過，視為看過新手引導。
  // v2 → v3：錯題補上 SRS 欄位（立即可複習）。
  // v3 → v4：新增音效音量設定（預設值補齊）。
  // v4 → v5：新增各區域關卡進度與麥克風詢問紀錄。
  // v5 → v6：新增自創主角（舊玩家也要先建立角色）。
  // v6 → v7：單一出戰英雄改為 4 人隊伍（主角＋原本選的英雄）。
  // v7 → v8：英雄改為 50 位＋召喚；舊英雄保留，並贈送起始召喚券。
  // v8 → v9：地圖三星、最遠關卡、劇情紀錄；舊玩家的最遠關卡以目前進度補上，並視為看過序章。
  // v9 → v10：主角等級／轉職、英雄等級、素材、裝備（預設值補齊）。
  // v10 → v11：真名考驗進度（預設值補齊）。
  // v11 → v12：黃金之路紀錄與稱號（預設值補齊）。
  // v12 → v13：每日任務、背景音樂音量、擴充魔王紀錄（預設值補齊）。
  // v13 → v14：戰鬥情境提示、動態效果與文字大小設定；已看過新手引導的舊玩家視為看過全部提示。
  // v14 → v15：區域從 6 個變 9 個（插入 A2+、B1+、B2+），unlockedIndex 換成新順序的位置；
  //   新插入、還沒玩過的區域一併開放（不讓老玩家倒退）。關卡進度與星星以區域名稱為 key，不受影響。
  // v15 → v16：每張地圖從 10 關變 20 關、每區的地圖數依區域不同、區域最終魔王獨立一關。
  //   關卡進度換算成新位置：第 m 張地圖的第 s 關 → 第 m 張的第 2s 關；打到舊的最後一關（區域魔王）→ 新的區域魔王。地圖星星的 key 不變
  // 物件欄位先確認真的是物件再合併（不然字串會被展開成 {"0": …, "1": …}）
  const obj = <K extends keyof SaveData>(k: K) => (isPlainObject(data[k]) ? data[k] : {}) as Partial<SaveData[K]>;
  const migrated: SaveData = {
    ...initialSave,
    ...data,
    settings: { ...initialSave.settings, ...obj('settings') },
    upgrades: { ...initialSave.upgrades, ...obj('upgrades') },
    items: { ...initialSave.items, ...obj('items') },
    character: normalizeCharacter(data.character),
    party: data.party ?? ['player', data.hero ?? 'knight'],
    summonCounter: { ...initialSave.summonCounter, ...obj('summonCounter') },
    bestStage: data.bestStage ?? { ...data.levelProgress },
    player: { ...initialSave.player, ...obj('player') },
    storySeen: data.storySeen ?? (version >= 1 && version < 9 ? ['prologue'] : []),
    storyRewardClaimed: data.storyRewardClaimed ?? [],
    tutorialDone: version >= 1 ? (version < 2 ? true : data.tutorialDone ?? true) : (data.tutorialDone ?? false),
  };
  // 型別檢查：壞掉的欄位改回預設值（每日任務可以是 null，其他物件要長得對）
  Object.assign(migrated, conform(initialSave, migrated));
  if (migrated.daily !== null && !(isPlainObject(migrated.daily) && Array.isArray(migrated.daily.tasks))) migrated.daily = null;
  if (migrated.placement !== null && !(isPlainObject(migrated.placement) && Number.isFinite(migrated.placement.region))) migrated.placement = null;
  if (migrated.weekly !== null && !(isPlainObject(migrated.weekly) && Array.isArray(migrated.weekly.tasks))) migrated.weekly = null;
  // 數量類的紀錄：去掉不是數字的項目，負數改成 0；等級至少 1
  const counts = (rec: Record<string, number>, min = 0) => Object.fromEntries(Object.entries(rec)
    .filter(([, v]) => typeof v === 'number' && Number.isFinite(v)).map(([k, v]) => [k, Math.max(min, v)]));
  migrated.xpAllowanceGold = Math.min(allowanceCap(migrated.unlockedIndex), Math.max(0, Math.floor(migrated.xpAllowanceGold)));
  migrated.xpAllowanceRemainder = Math.min(7, Math.max(0, Math.floor(migrated.xpAllowanceRemainder)));
  migrated.materials = counts(migrated.materials);
  migrated.heroShards = counts(migrated.heroShards);
  migrated.heroTier = counts(migrated.heroTier);
  migrated.heroStars = counts(migrated.heroStars);
  migrated.heroLevel = counts(migrated.heroLevel, 1);
  migrated.weaponShards = counts(migrated.weaponShards);
  migrated.weapons = Object.fromEntries(
    Object.entries(migrated.weapons ?? {}).filter(([, wp]) => isPlainObject(wp) && typeof wp.level === 'number' && typeof wp.unlocked === 'boolean')
  );
  if (!isPlainObject(migrated.weaponCounter)) migrated.weaponCounter = { sinceSsr: 0, spark: 0 };
  else {
    migrated.weaponCounter = {
      sinceSsr: Math.max(0, Number(migrated.weaponCounter.sinceSsr) || 0),
      spark: Math.max(0, Number(migrated.weaponCounter.spark) || 0),
    };
  }
  migrated.levelProgress = counts(migrated.levelProgress);
  if (version >= 1 && version < 15) migrated.unlockedIndex = OLD_REGION_TO_NEW[Math.min(6, Math.max(0, Math.floor(migrated.unlockedIndex)))];
  migrated.bestStage = counts(migrated.bestStage);
  if (version >= 1 && version < 16) {
    const remap = (rec: Record<string, number>) => Object.fromEntries(Object.entries(rec).map(([id, p]) => {
      const last = regionStageCount(Math.max(0, REGIONS.findIndex(r => r.id === id))) - 1;
      return [id, p >= OLD_STAGES_PER_REGION - 1 ? last : Math.min(last, Math.floor(p / OLD_MAP_SIZE) * MAP_SIZE + (p % OLD_MAP_SIZE) * 2)];
    }));
    migrated.levelProgress = remap(migrated.levelProgress);
    migrated.bestStage = remap(migrated.bestStage);
  }
  // v17 → v18：等級從 1～100（每區約 11 級）改成 1～200（第十三輪）：依區域換算，不超過目前所在區域的通關等級
  if (version >= 1 && version < 18) {
    const REGION_LEVELS = V18_REGION_LEVELS;
    const frontier = REGION_LEVELS[Math.min(REGION_LEVELS.length - 1, Math.max(0, Math.floor(migrated.unlockedIndex)))][1];
    const remap = (old: number) => {
      const r = Math.min(REGION_LEVELS.length - 1, Math.floor((old - 1) / 11));
      const frac = Math.min(1, ((old - 1) - 11 * r) / 11);
      const [from, to] = REGION_LEVELS[r];
      return Math.max(1, Math.min(frontier, Math.round(from + frac * (to - from))));
    };
    const playerLevel = remap(Math.floor(migrated.player.level || 1));
    migrated.player = { ...migrated.player, level: playerLevel, xp: 0 };
    migrated.heroLevel = Object.fromEntries(Object.entries(migrated.heroLevel).map(([id, lv]) => [id, Math.min(playerLevel, remap(lv))]));
  }
  migrated.player = { ...migrated.player, level: Math.min(MAX_LEVEL, Math.max(1, Math.floor(migrated.player.level))) };
  // 換職業：舊存檔把目前的職業當成第一個職業
  if (migrated.character) {
    if (!migrated.homeClass) migrated.homeClass = migrated.character.classId;
    migrated.classPaths = { ...migrated.classPaths, [migrated.character.classId]: migrated.player.classPath };
  }
  // v18 → v19：新增前置區域；已經開始冒險的舊玩家不用再打
  if (version >= 1 && version < 19) {
    migrated.prologueDone = migrated.tutorialDone || migrated.unlockedIndex > 0
      || Object.keys(migrated.levelProgress).length > 0 || Object.keys(migrated.codex).length > 0;
  }
  if (!data.hintsSeen) migrated.hintsSeen = version >= 1 && migrated.tutorialDone ? [...ALL_HINTS] : [];
  migrated.mistakes = Object.fromEntries(Object.entries(migrated.mistakes)
    .filter(([, m]) => isPlainObject(m) && isPlainObject(m.question))
    .map(([key, m]) => [key, { ...m, box: m.box ?? 0, dueAt: m.dueAt ?? m.lastWrongAt ?? 0 }]));
  migrated.codex = Object.fromEntries(Object.entries(migrated.codex).filter(([, c]) => isPlainObject(c) && isPlainObject(c.question)));
  migrated.knowledge = Object.fromEntries(Object.entries(migrated.knowledge)
    .filter(([, r]) => isPlainObject(r) && Array.isArray(r.wins) && r.wins.every(Number.isFinite) && Number.isFinite(r.dueAt)
      && (r.items === undefined || (Array.isArray(r.items) && r.items.every(i => typeof i === 'string')))));
  // v17 之前沒有知識點：圖鑑裡答對過的都算「已學」（第一次見到的時間算一次成功）；已開放的區域視為打倒過魔王
  if (version >= 1 && version < 17) {
    for (const c of Object.values(migrated.codex)) {
      const k = knowledgeKey(c.question);
      if (c.correct > 0 && !migrated.knowledge[k]) migrated.knowledge[k] = { wins: [c.firstSeenAt ?? 0], dueAt: (c.firstSeenAt ?? 0) + STABLE_GAP };
    }
    migrated.bossDown = Array.from({ length: Math.max(0, Math.floor(migrated.unlockedIndex)) }, (_, i) => i);
  }
  migrated.bossDown = migrated.bossDown.filter(n => Number.isInteger(n) && n >= 0);
  // 專武券補發：如果舊存檔已打倒 B1 或之後的魔王，但當時尚未配置全額專武券
  if (Array.isArray(migrated.bossDown) && migrated.bossDown.includes(WEAPON_UNLOCK_REGION)) {
    const passedAfterB1 = migrated.bossDown.filter(r => r > WEAPON_UNLOCK_REGION);
    if (passedAfterB1.length > 0 && !migrated._weaponBossBackfilled) {
      let extra = 0;
      for (const r of passedAfterB1) extra += r === 8 ? 10 : 5;
      migrated.weaponTickets = (migrated.weaponTickets ?? 0) + extra;
      migrated._weaponBossBackfilled = true;
    }
  }
  // 舊玩家補發已打過關卡的經驗值（每關約 20，後面的區域較多）
  if (version >= 1 && version < 10 && !data.player) {
    const regionIds = Object.keys(migrated.bestStage);
    const xp = regionIds.reduce((sum, id, i) => sum + (migrated.bestStage[id] ?? 0) * 20 * xpScale(i), 0);
    const r = addXp(1, 0, Math.round(xp));
    migrated.player = { ...migrated.player, level: r.level, xp: r.xp };
  }
  migrated.heroes = migrated.heroes.filter(isHeroId);
  if (migrated.heroes.length === 0) migrated.heroes = ['knight'];
  migrated.party = migrated.party.filter(id => id === 'player' || migrated.heroes.includes(id));
  if (migrated.party.length === 0) migrated.party = [migrated.character ? 'player' : migrated.heroes[0]];
  migrated.equipment = migrated.equipment.filter(e => isPlainObject(e) && typeof e.uid === 'string' && !!equipDef(e.defId));
  migrated.equipped = Object.fromEntries(Object.entries(migrated.equipped).filter(([, uid]) => migrated.equipment.some(e => e.uid === uid)));
  // v21：舊版已通關或跳級略過的主線不重發新首通池；不撤銷任何進度。
  if (version < 21) {
    migrated.firstClearXpClaimed = { ...migrated.firstClearXpClaimed };
    REGIONS.forEach((r, idx) => {
      const best = Math.min(regionStageCount(idx) - 1, migrated.bestStage[r.id] ?? 0);
      for (let stage = 0; stage < best; stage++) migrated.firstClearXpClaimed[`${r.id}:${stage}`] = true;
      Object.keys(migrated.mapStars).forEach(key => {
        if (!key.startsWith(`${r.id}#`)) return;
        const map = Number(key.slice(r.id.length + 1));
        if (Number.isInteger(map) && map >= 0 && map < r.maps.length - 1) migrated.firstClearXpClaimed[`${r.id}:${map * 20 + 19}`] = true;
      });
      if (migrated.bossDown.includes(idx)) migrated.firstClearXpClaimed[`${r.id}:${regionStageCount(idx) - 1}`] = true;
    });
  }
  return migrated;
}

// 到期的錯題：越不熟（答對次數越少）的越先考，一樣熟的再看誰比較早到期
export const byLeastKnown = (a: MistakeRecord, b: MistakeRecord) => a.box - b.box || a.dueAt - b.dueAt;

export function dueMistakes(mistakes: Record<string, MistakeRecord>, now: number, limit: number): MistakeRecord[] {
  return Object.values(mistakes)
    .filter(m => m.dueAt <= now)
    .sort(byLeastKnown)
    .slice(0, limit);
}

// 讀檔時存檔不是合法的 JSON（資料損毀）：先把原始內容備份到另一個 key 並記下來，
// 而不是默默開新檔把舊資料覆蓋掉；遊戲會提示玩家（見 SaveRecoveryNotice）
export const SAVE_RECOVERY_KEY = 'english-rpg-save-recovery';
const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      const raw = localStorage.getItem(name);
      if (raw === null) return null;
      try { JSON.parse(raw); return raw; } catch {
        const backupKey = `${name}-corrupt-${Date.now()}`;
        localStorage.setItem(backupKey, raw);
        localStorage.setItem(SAVE_RECOVERY_KEY, backupKey);
        return null;
      }
    } catch { return null; } // 無痕模式等無法使用 localStorage
  },
  setItem: (name, value) => { try { localStorage.setItem(name, value); } catch { /* 空間不足等 */ } },
  removeItem: (name) => { try { localStorage.removeItem(name); } catch { /* 略過 */ } },
};

export const useSaveStore = create<SaveData & SaveActions>()(
  persist(
    (set, get) => {
      // 扣金幣並套用變更；金幣不足時不動作
      const purchase = (cost: number, apply: (s: SaveData) => Partial<SaveData>): boolean => {
        if (get().gold < cost) return false;
        set(s => ({ gold: s.gold - cost, ...apply(s) }));
        return true;
      };

      return {
        ...initialSave,
        setCharacter: (c) => set(s => { const character = normalizeCharacter(c); return { character, homeClass: s.homeClass ?? character?.classId ?? null }; }),
        unlockLevel: (index) => set(s => ({ unlockedIndex: Math.max(s.unlockedIndex, index) })),
        skipRegions: (count) => set(s => {
          const n = Math.min(count, REGIONS.length - 1);
          if (n <= s.unlockedIndex) return {};
          const bestStage = { ...s.bestStage };
          const storySeen = new Set(s.storySeen);
          for (let i = 0; i < n; i++) {
            const r = REGIONS[i];
            bestStage[r.id] = Math.max(bestStage[r.id] ?? 0, regionStageCount(i) - 1);
            storySeen.add(regionStoryId(i)).add(clearStoryId(i));
          }
          return { unlockedIndex: n, prologueDone: true, bestStage, storySeen: [...storySeen] };
        }),
        setLevelProgress: (levelKey, stageIdx) => set(s => ({
          levelProgress: { ...s.levelProgress, [levelKey]: stageIdx },
          bestStage: { ...s.bestStage, [levelKey]: Math.max(s.bestStage[levelKey] ?? 0, stageIdx) },
        })),
        setMicAsked: () => set({ micAsked: true }),

        recordMapLearning: (map, q, fallback) => set(s => {
          const day = localDate(), key = knowledgeKey(q), item = `${q.type}|${q.desc}|${q.speak ?? ''}`;
          const today = Object.values(s.mapMastery).filter(m => m.day === day);
          if (today.reduce((n, m) => n + (m.dailyKnowledge[key] ?? 0), 0) >= 2 || today.some(m => m.dailyItems.includes(item))) return {};
          return { mapMastery: { ...s.mapMastery, [map]: recordMastery(s.mapMastery[map], q, day, fallback) } };
        }),
        recordMapStage: (map, stageInMap) => set(s => {
          if (!Number.isInteger(stageInMap) || stageInMap < 0 || stageInMap >= 20) return {};
          const rec = s.mapMastery[map] ?? emptyMapMastery();
          return { mapMastery: { ...s.mapMastery, [map]: { ...rec, cleared: rec.cleared | (1 << stageInMap) } } };
        }),
        claimMapMastery: (region, mapIdx) => {
          const s = get(), r = REGIONS[region];
          if (!r || !Number.isInteger(mapIdx) || mapIdx < 0 || mapIdx >= r.maps.length - 1) return false;
          const key = `${r.id}#${mapIdx}`, rec = s.mapMastery[key];
          if (!masteryReady(region, rec) || rec.claimed) return false;
          const packs = MASTERY_PACKS[region];
          const crystal = `crystal_${s.character?.element ?? 'fire'}`;
          set({ gold: s.gold + 80 + 20 * region, materials: { ...s.materials, ore: (s.materials.ore ?? 0) + 2 * packs, [crystal]: (s.materials[crystal] ?? 0) + packs }, mapMastery: { ...s.mapMastery, [key]: { ...rec, claimed: true } } });
          return true;
        },
        recordAnswer: (q, correct, review, counted = review) => {
          let reviewed = false;
          let crossDay = false;
          set(s => {
          const key = questionKey(q);
          const now = Date.now();
          const prevCodex = s.codex[key];
          const codex = {
            ...s.codex,
            [key]: {
              question: q,
              correct: (prevCodex?.correct ?? 0) + (correct ? 1 : 0),
              wrong: (prevCodex?.wrong ?? 0) + (correct ? 0 : 1),
              firstSeenAt: prevCodex?.firstSeenAt ?? now,
            },
          };

          const mistakes = { ...s.mistakes };
          const prev = mistakes[key];
          if (!correct) {
            mistakes[key] = { question: q, wrongCount: (prev?.wrongCount ?? 0) + 1, lastWrongAt: now, box: 0, dueAt: now };
          } else if (prev && review && prev.dueAt <= now) {
            reviewed = true;
            // 答錯的同一天就答對：是很好的立即複習，但還不算記住，明天再考一次
            const sameDay = prev.box === 0 && localDate(new Date(prev.lastWrongAt)) === localDate(new Date(now));
            const box = sameDay ? 0 : prev.box + 1;
            if (box >= SRS_MASTERED_BOX) delete mistakes[key];
            else mistakes[key] = { ...prev, box, dueAt: now + SRS_INTERVALS[box + 1] };
          }
          const kKey = knowledgeKey(q);
          const k = updateKnowledge(s.knowledge[kKey], correct, counted, now, kKey.startsWith('g:') ? key : undefined);
          crossDay = !!k?.crossDay;
          return { codex, mistakes, ...(k ? { knowledge: { ...s.knowledge, [kKey]: k.rec } } : {}) };
        });
        if (reviewed) get().trackDaily('review');
        return crossDay;
      },
        recordStrictTrial: (regionIdx, at) => set(s => ({ strictTrials: { ...s.strictTrials, [regionIdx]: [...(s.strictTrials[regionIdx] ?? []), at].slice(-STRICT_TRIALS_PER_DAY) } })),
        grantWheel: (key) => {
          if (get().wheelClaimed.includes(key)) return false;
          set(s => ({ wheelClaimed: [...s.wheelClaimed, key], wheelPending: s.wheelPending + 1 }));
          return true;
        },
        spinWheel: (rand = Math.random) => {
          const s = get();
          if (s.wheelPending <= 0) return -1;
          const idx = rollWheel(rand, s.wheelDry);
          const prize = WHEEL_PRIZES[idx];
          set({
            wheelPending: s.wheelPending - 1,
            wheelDry: prize.id === 'none' ? s.wheelDry + 1 : 0,
            tickets: s.tickets + (prize.tickets ?? 0),
            sweepTickets: s.sweepTickets + (prize.sweep ?? 0),
            gold: s.gold + (prize.gold ?? 0),
          });
          return idx;
        },
        defeatRegionBoss: (regionIdx) => set(s => {
          if (s.bossDown.includes(regionIdx)) return {};
          const patch: Partial<SaveData> = { bossDown: [...s.bossDown, regionIdx] };
          if (regionIdx === WEAPON_UNLOCK_REGION) {
            patch.weaponTickets = (s.weaponTickets ?? 0) + 10;
          } else if (regionIdx > WEAPON_UNLOCK_REGION) {
            // 後續區域魔王擊敗獎勵：B1+~C1 各送 5 張，C2 終王送 10 張
            const grant = regionIdx === 8 ? 10 : 5;
            patch.weaponTickets = (s.weaponTickets ?? 0) + grant;
          }
          return patch;
        }),

        updateSettings: (patch) => set(s => ({ settings: { ...s.settings, ...patch } })),
        setTutorialDone: (done) => set({ tutorialDone: done }),
        finishPrologue: () => set({ prologueDone: true }),
        setPlacement: (rec) => set({ placement: rec }),
        // 通過推薦區域（或之後）的區域試煉：跳級驗證完成，主角一次補到推薦區域的最低推薦等級
        verifyPlacement: (regionIdx, speakingVerified) => set(s => {
          const p = s.placement;
          if (!p || p.verified || regionIdx < p.region) return {};
          const floor = REGION_LEVELS[Math.min(REGION_LEVELS.length - 1, p.region)][0];
          const level = Math.max(s.player.level, floor);
          const before = cumulativeXpAtLevel(s.player.level) + s.player.xp;
          const grant = Math.max(0, cumulativeXpAtLevel(level) - before);
          const updatedVerified = speakingVerified !== undefined ? speakingVerified : (p.speakingVerified ?? true);
          return { placement: { ...p, verified: true, verifiedAt: Date.now(), speakingVerified: updatedVerified }, player: { ...s.player, level, xp: before + grant - cumulativeXpAtLevel(level) },
            xpLedger: { ...s.xpLedger,
              'offered:placement': (s.xpLedger['offered:placement'] ?? 0) + grant,
              'accepted:placement': (s.xpLedger['accepted:placement'] ?? 0) + grant,
            } };
        }),
        recordPlacementReview: (passed: boolean, weak: string[]) => set(s => {
          if (!s.placement) return {};
          return {
            placement: {
              ...s.placement,
              lastReviewAt: Date.now(),
              reviewPassed: passed,
              reviewWeak: weak,
            },
          };
        }),
        addGold: (amount) => set(s => ({ gold: s.gold + amount })),

        buyUpgrade: (id) => {
          const def = UPGRADES.find(u => u.id === id)!;
          const level = get().upgrades[id];
          if (level >= def.maxLevel) return false;
          return purchase(upgradeCost(def, level), s => ({ upgrades: { ...s.upgrades, [id]: level + 1 } }));
        },

        buyItem: (id) => {
          const def = ITEMS.find(i => i.id === id)!;
          return purchase(def.cost, s => ({ items: { ...s.items, [id]: s.items[id] + 1 } }));
        },

        consumeItem: (id) => {
          if (get().items[id] <= 0) return false;
          set(s => ({ items: { ...s.items, [id]: s.items[id] - 1 } }));
          return true;
        },

        addTickets: (n) => set(s => ({ tickets: s.tickets + n })),

        recordMapStars: (key, stars) => {
          const prev = get().mapStars[key];
          const merged = mergeStars(prev, stars);
          const gained = merged.filter(Boolean).length - (prev ?? []).filter(Boolean).length;
          set(s => ({ mapStars: { ...s.mapStars, [key]: merged }, tickets: s.tickets + gained * STAR_TICKETS }));
          if (gained > 0) get().trackDaily('star', gained);
          return gained;
        },

        markHint: (id) => set(s => (s.hintsSeen.includes(id) ? {} : { hintsSeen: [...s.hintsSeen, id] })),

        markStorySeen: (id) => set(s => (s.storySeen.includes(id) ? {} : { storySeen: [...s.storySeen, id] })),

        claimStoryReward: (id) => {
          const s = get();
          const claimed = s.storyRewardClaimed ?? [];
          if (claimed.includes(id)) return null;
          const isMajor = id.includes('clear') || id.includes('boss') || id === 'prologue';
          const rewardType: 'ticket' | 'sweep' = isMajor ? 'ticket' : 'sweep';
          const amount = 1;
          set(state => ({
            storyRewardClaimed: [...(state.storyRewardClaimed ?? []), id],
            tickets: rewardType === 'ticket' ? state.tickets + amount : state.tickets,
            sweepTickets: rewardType === 'sweep' ? state.sweepTickets + amount : state.sweepTickets,
          }));
          return { rewardType, amount };
        },

        claimStageXp: (region, stage) => {
          const r = REGIONS[region], amount = firstClearXp(region, stage);
          if (!r || amount <= 0) return { xp: 0, levels: 0 };
          const key = `${r.id}:${stage}`;
          if (get().firstClearXpClaimed[key]) return { xp: 0, levels: 0 };
          set(s => ({ firstClearXpClaimed: { ...s.firstClearXpClaimed, [key]: true } }));
          return get().awardXp(amount, 'firstClear');
        },
        grantLearningXp: (region, q, eligible, replay = false) => {
          if (!Number.isInteger(region) || region < 0 || region >= REGIONS.length) return { xp: 0, levels: 0, allowanceGold: 0, bonus: 0 };
          const key = knowledgeKey(q), day = localDate();
          const st = get();
          const cap = playerLevelCap(bestTier({ ...st.classPaths, current: st.player.classPath }));
          const room = !replay || (st.player.level < Math.min(cap, frontierRecommendedLevel(st) + 13) && st.player.xp < xpToNext(st.player.level));
          const subsidy = eligible && room && get().learningXpDay[key] !== day;
          if (subsidy) set(s => ({ learningXpDay: { ...s.learningXpDay, [key]: day } }));
          const base = learningXp(region, false), total = learningXp(region, subsidy);
          const a = get().awardXp(base, replay ? 'replay' : 'learningBase');
          const b = total > base ? get().awardXp(total - base, replay ? 'replay' : 'learningSubsidy') : { xp: 0, levels: 0, allowanceGold: 0, bonus: 0 };
          return { xp: a.xp + b.xp, levels: a.levels + b.levels, allowanceGold: a.allowanceGold + b.allowanceGold, bonus: a.bonus + b.bonus };
        },
        gainXp: (n, source = 'other') => get().awardXp(n, source).levels,
        awardXp: (n, source = 'other') => {
          const st = get(), p = st.player;
          const raw = Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
          const cap = playerLevelCap(bestTier({ ...st.classPaths, current: p.classPath }));
          const nonMainline = isCatchupSource(source);
          const damped = nonMainline ? catchupXp(p.level, p.xp, raw, cap, frontierRecommendedLevel(st)) : null;
          const r = damped ?? addXp(p.level, p.xp, raw, cap);
          const accepted = Math.max(0, cumulativeXpAtLevel(r.level) + r.xp - cumulativeXpAtLevel(p.level) - p.xp);
          const bonus = damped?.bonus ?? 0;
          const deducted = damped?.deducted ?? 0;
          const day = localDate(), sameDay = st.xpAllowanceDay === day;
          const coins = allowance(deducted, sameDay ? st.xpAllowanceGold : 0, sameDay ? st.xpAllowanceRemainder : 0, allowanceCap(st.unlockedIndex));
          set(s => ({ player: { ...p, level: r.level, xp: r.xp }, gold: s.gold + coins.gold,
            xpAllowanceDay: day, xpAllowanceGold: coins.used, xpAllowanceRemainder: coins.remainder,
            xpLedger: { ...s.xpLedger,
              [`offered:${source}`]: (s.xpLedger[`offered:${source}`] ?? 0) + raw,
              [`accepted:${source}`]: (s.xpLedger[`accepted:${source}`] ?? 0) + accepted,
              [`bonus:${source}`]: (s.xpLedger[`bonus:${source}`] ?? 0) + bonus,
              [`deducted:${source}`]: (s.xpLedger[`deducted:${source}`] ?? 0) + deducted,
              [`overflow:${source}`]: (s.xpLedger[`overflow:${source}`] ?? 0) + (nonMainline ? 0 : Math.max(0, raw - accepted)),
              [`allowanceGold:${source}`]: (s.xpLedger[`allowanceGold:${source}`] ?? 0) + coins.gold,
            } }));
          if (r.levelsGained > 0) get().trackDaily('levelup', r.levelsGained);
          return { xp: accepted, levels: r.levelsGained, bonus, allowanceGold: coins.gold };
        },

        // 轉職：必須是目前路線的下一階，且達到等級與通關條件
        advanceClass: (nodeId) => {
          const s = get();
          const n = classNode(nodeId);
          if (!n || !s.character) return false;
          const options = nextOptions(s.character.classId, s.player.classPath);
          if (!options.some(o => o.id === nodeId) || !canAdvance(n.tier, s.player.level)) return false;
          const cost = s.character.classId === (s.homeClass ?? s.character.classId) ? 0 : BADGE_COST[n.tier];
          if (s.classBadges < cost) return false;
          const classPath = [...s.player.classPath, nodeId];
          set({ player: { ...s.player, classPath }, classPaths: { ...s.classPaths, [s.character.classId]: classPath }, classBadges: s.classBadges - cost });
          get().gainXp(0, 'classUnlock');
          return true;
        },
        switchClass: (classId) => {
          const s = get();
          if (!s.character || s.character.classId === classId) return false;
          const classPaths = { ...s.classPaths, [s.character.classId]: s.player.classPath };
          set({
            character: { ...s.character, classId },
            classPaths,
            homeClass: s.homeClass ?? s.character.classId,
            player: { ...s.player, classPath: classPaths[classId] ?? [] },
          });
          get().gainXp(0, 'classUnlock');
          return true;
        },
        resetClassPath: () => {
          const s = get();
          if (!s.character || !s.player.classPath.length) return false;
          const refund = s.character.classId === (s.homeClass ?? s.character.classId) ? 0 : pathBadgeCost(s.player.classPath);
          set({ player: { ...s.player, classPath: [] }, classPaths: { ...s.classPaths, [s.character.classId]: [] }, classBadges: s.classBadges + refund });
          return true;
        },

        addMaterials: (drops) => set(s => {
          const materials = { ...s.materials };
          for (const [k, v] of Object.entries(drops)) materials[k] = (materials[k] ?? 0) + v;
          return { materials };
        }),

        forge: (defId) => {
          const s = get();
          const def = equipDef(defId);
          if (!def || !s.character) return false;
          if ((def.requires?.regionsCleared ?? 0) > s.unlockedIndex) return false;
          if ((def.requires?.classTier ?? 0) > s.player.classPath.length) return false;
          const need = resolveCost(def, s.character.element);
          if (Object.entries(need).some(([k, v]) => (s.materials[k] ?? 0) < v)) return false;
          return purchase(def.cost.gold, st => {
            const materials = { ...st.materials };
            for (const [k, v] of Object.entries(need)) materials[k] -= v;
            const item: OwnedEquip = { uid: `${defId}-${Date.now().toString(36)}-${st.equipment.length}`, defId, plus: 0 };
            // 該欄位還空著就直接裝上
            const equipped = st.equipped[def.slot] ? st.equipped : { ...st.equipped, [def.slot]: item.uid };
            return { materials, equipment: [...st.equipment, item], equipped };
          });
        },

        // 強化：有成功率；holy（神聖鍛造，答對 3 題英文）一定成功並得到神聖加護
        enhance: (uid, holy = false, rand = Math.random) => {
          const s = get();
          const item = s.equipment.find(e => e.uid === uid);
          if (!item || item.plus >= maxPlus(item)) return false;
          const cost = enhanceCost(item);
          if ((s.materials.ore ?? 0) < cost.ore || s.gold < cost.gold) return false;
          const success = holy || rand() < enhanceChance(item);
          purchase(cost.gold, st => ({
            materials: { ...st.materials, ore: st.materials.ore - cost.ore },
            equipment: success ? st.equipment.map(e => (e.uid === uid ? { ...e, plus: e.plus + 1, ...(holy ? { blessed: true } : {}) } : e)) : st.equipment,
          }));
          return success ? 'ok' : 'fail';
        },

        // 送別英雄：不在隊伍中、而且至少留下一位；等級、品階與真名進度一併清除
        sellHero: (id) => {
          const s = get();
          if (!s.heroes.includes(id) || s.party.includes(id) || s.heroes.length <= 1) return 0;
          const value = heroSellValue(id, s.heroLevel[id] ?? 1, s.heroTier[id] ?? 0);
          const omit = <T,>(rec: Record<HeroId, T>) => Object.fromEntries(Object.entries(rec).filter(([k]) => k !== id)) as Record<HeroId, T>;
          set({
            gold: s.gold + value,
            heroes: s.heroes.filter(h => h !== id),
            heroLevel: omit(s.heroLevel),
            heroTier: omit(s.heroTier),
            trueName: omit(s.trueName),
          });
          return value;
        },

        // 升品階：吃掉一件沒穿在身上的同名裝備，素材件強化過的礦石退還 65%
        gradeUp: (uid) => {
          const s = get();
          const item = s.equipment.find(e => e.uid === uid);
          if (!item || gradeOf(item) >= MAX_GRADE) return false;
          const material = gradeMaterial(item, s.equipment, Object.values(s.equipped).filter((u): u is string => !!u));
          if (!material) return false;
          const refund = gradeRefund(material);
          set({
            equipment: s.equipment.filter(e => e.uid !== material.uid).map(e => (e.uid === uid ? { ...e, grade: gradeOf(e) + 1 } : e)),
            materials: refund > 0 ? { ...s.materials, ore: (s.materials.ore ?? 0) + refund } : s.materials,
          });
          return true;
        },

        // 賣掉沒穿在身上的裝備，退還部分金幣與素材
        sellEquip: (uid) => {
          const s = get();
          const item = s.equipment.find(e => e.uid === uid);
          if (!item || !s.character || Object.values(s.equipped).includes(uid)) return false;
          const back = sellValue(item, s.character.element);
          const materials = { ...s.materials };
          for (const [k, v] of Object.entries(back.materials)) materials[k] = (materials[k] ?? 0) + v;
          set({ gold: s.gold + back.gold, materials, equipment: s.equipment.filter(e => e.uid !== uid) });
          return true;
        },

        equip: (uid) => set(s => {
          const item = s.equipment.find(e => e.uid === uid);
          const def = item && equipDef(item.defId);
          return def ? { equipped: { ...s.equipped, [def.slot]: uid } } : {};
        }),

        unequip: (slot) => set(s => {
          const equipped = { ...s.equipped };
          delete equipped[slot];
          return { equipped };
        }),

        completeTrial: (id, trialIdx) => {
          const s = get();
          if (!s.heroes.includes(id) || trialIdx < 0 || trialIdx >= TRIAL_COUNT) return false;
          const prev = s.trueName[id] ?? Array<boolean>(TRIAL_COUNT).fill(false);
          if (prev[trialIdx]) return false;
          const next = prev.map((v, i) => v || i === trialIdx);
          // 五項全部完成（第二十一輪 D4）：看英雄原生稀有度，SSR 送召喚券 ×3、SR 送掃蕩券 ×3，每位英雄只領一次
          const reward = trialsDone(next) >= TRIAL_COUNT && !s.trueNameRewarded.includes(id) ? TRUE_NAME_REWARD[heroDef(id).rarity] : undefined;
          const heroWp = weaponForHero(id);
          const wpPatch = (heroDef(id).rarity === 'SSR' && trialsDone(next) >= TRIAL_COUNT && heroWp && !s.weapons[heroWp.id]?.unlocked)
            ? { weapons: { ...s.weapons, [heroWp.id]: { level: 0, unlocked: true } } }
            : {};
          set({
            trueName: { ...s.trueName, [id]: next },
            heroShards: { ...s.heroShards, [id]: (s.heroShards[id] ?? 0) + TRIAL_SHARDS },
            ...wpPatch,
            ...(reward ? {
              trueNameRewarded: [...s.trueNameRewarded, id],
              tickets: s.tickets + (reward.tickets ?? 0),
              sweepTickets: s.sweepTickets + (reward.sweep ?? 0),
            } : {}),
          });
          get().trackDaily('trial');
          return true;
        },

        addWeaponTickets: (n: number) => set(s => ({ weaponTickets: Math.max(0, (s.weaponTickets ?? 0) + n) })),

        summonWeapons: (count: number, rand?: () => number) => {
          const s = get();
          if (s.weaponTickets < count) return null;
          const { drops, nextCounter } = rollWeaponSummon(count, s.weaponCounter, s.weapons, rand);
          const nextWeapons = { ...s.weapons };
          const nextShards = { ...s.weaponShards };
          let addedWish = 0;
          const nextMaterials = { ...s.materials };

          for (const d of drops) {
            if (d.kind === 'weapon' && d.weaponId) {
              if (!nextWeapons[d.weaponId]?.unlocked) {
                nextWeapons[d.weaponId] = { level: 0, unlocked: true };
              } else {
                nextShards[d.weaponId] = (nextShards[d.weaponId] ?? 0) + WEAPON_DUPE_SHARDS;
              }
            } else if (d.kind === 'shards') {
              addedWish += d.amount;
            } else if (d.kind === 'rare_mat') {
              const matKey = d.name === '龍晶' ? 'dragon_crystal' : 'magic_core';
              nextMaterials[matKey] = (nextMaterials[matKey] ?? 0) + d.amount;
            } else if (d.kind === 'mat') {
              nextMaterials['ore'] = (nextMaterials['ore'] ?? 0) + d.amount;
            }
          }

          set({
            weaponTickets: s.weaponTickets - count,
            weaponCounter: nextCounter,
            weapons: nextWeapons,
            weaponShards: nextShards,
            wishShards: s.wishShards + addedWish,
            materials: nextMaterials,
          });
          return drops;
        },

        upgradeWeapon: (weaponId: string) => {
          const s = get();
          const wp = s.weapons[weaponId];
          if (!wp || !wp.unlocked) return false;
          const cost = weaponUpgradeCost(wp.level);
          if (!cost) return false;
          const ownShards = s.weaponShards[weaponId] ?? 0;
          if (ownShards < cost.shards || s.gold < cost.gold) return false;

          set({
            gold: s.gold - cost.gold,
            weaponShards: { ...s.weaponShards, [weaponId]: ownShards - cost.shards },
            weapons: { ...s.weapons, [weaponId]: { ...wp, level: wp.level + 1 } },
          });
          return true;
        },

        exchangeWeaponSpark: (weaponId: string) => {
          const s = get();
          if (s.weaponCounter.spark < WEAPON_SPARK_COST) return false;
          const nextWeapons = { ...s.weapons };
          const nextShards = { ...s.weaponShards };
          if (!nextWeapons[weaponId]?.unlocked) {
            nextWeapons[weaponId] = { level: 0, unlocked: true };
          } else {
            nextShards[weaponId] = (nextShards[weaponId] ?? 0) + WEAPON_DUPE_SHARDS;
          }
          set({
            weaponCounter: { ...s.weaponCounter, spark: s.weaponCounter.spark - WEAPON_SPARK_COST },
            weapons: nextWeapons,
            weaponShards: nextShards,
          });
          return true;
        },

        unlockWeapon: (weaponId: string) => set(s => {
          if (s.weapons[weaponId]?.unlocked) return {};
          return {
            weapons: { ...s.weapons, [weaponId]: { level: 0, unlocked: true } },
          };
        }),

        // 每日任務：換日時重新抽任務、計算連續登入
        ensureDaily: () => {
          const today = localDate();
          const prev = get().daily;
          const next = refreshDaily(prev ?? undefined, today);
          const prevWeekly = get().weekly;
          const weekly = refreshWeekly(prevWeekly, today);
          if (next !== prev || weekly !== prevWeekly) set({ daily: next, weekly });
          // 新的一天第一次上線（或這週的任務剛建立）：每週任務的「上線天數」+1。
          // 同一週只是補上新任務時不算，避免重複加
          if (next !== prev || weekly.week !== prevWeekly?.week) set(s => ({ weekly: s.weekly ? applyDailyEvent(s.weekly, 'login', 1) : s.weekly }));
        },

        trackDaily: (event, amount = 1) => {
          get().ensureDaily();
          set(s => ({
            daily: s.daily ? applyDailyEvent(s.daily, event, amount) : s.daily,
            weekly: s.weekly ? applyDailyEvent(s.weekly, event, amount) : s.weekly,
          }));
        },

        claimWeekly: (id) => {
          get().ensureDaily();
          const s = get();
          const task = s.weekly?.tasks.find(t => t.id === id);
          const def = weeklyDef(id);
          if (!task || !def || task.claimed || task.progress < def.goal) return false;
          set({
            gold: s.gold + def.reward.gold,
            tickets: s.tickets + def.reward.tickets,
            classBadges: s.classBadges + (def.reward.badges ?? 0),
            weekly: { ...s.weekly!, tasks: s.weekly!.tasks.map(t => (t.id === id ? { ...t, claimed: true } : t)) },
          });
          return true;
        },

        claimDaily: (id) => {
          get().ensureDaily();
          const s = get();
          const task = s.daily?.tasks.find(t => t.id === id);
          const def = dailyDef(id);
          if (!task || !def || task.claimed || task.progress < def.goal) return false;
          set({
            gold: s.gold + def.reward.gold,
            tickets: s.tickets + def.reward.tickets,
            daily: { ...s.daily!, tasks: s.daily!.tasks.map(t => (t.id === id ? { ...t, claimed: true } : t)) },
          });
          return true;
        },

        claimStreak: (days) => {
          get().ensureDaily();
          const s = get();
          const m = streakMilestone(days);
          if (!m || !s.daily || !claimableMilestones(s.daily).includes(m)) return false;
          set({
            gold: s.gold + m.gold,
            tickets: s.tickets + m.tickets,
            daily: { ...s.daily, milestones: [...(s.daily.milestones ?? []), days] },
          });
          return true;
        },

        recordSkillBoss: (id) => {
          if (get().skillBossCleared.includes(id)) return false;
          set(s => ({ skillBossCleared: [...s.skillBossCleared, id] }));
          return true;
        },

        recordGolden: (stagesReached) => set(s => ({ goldenBest: Math.max(s.goldenBest, stagesReached) })),

        addTitle: (title) => {
          if (get().titles.includes(title)) return false;
          set(s => ({ titles: [...s.titles, title] }));
          return true;
        },

        // 英雄訓練：花金幣升一級，最高到主角的等級
        trainHero: (id) => {
          const s = get();
          if (!s.heroes.includes(id)) return false;
          const level = s.heroLevel[id] ?? 1;
          if (level >= Math.min(HERO_LEVEL_CAPS[currentRarity(heroDef(id), s.heroTier[id] ?? 0)] ?? MAX_LEVEL, s.player.level)) return false;
          const rarityIdx = ['N', 'R', 'SR', 'SSR'].indexOf(heroDef(id).rarity);
          const ok = purchase(trainCost(level, rarityIdx), st => ({ heroLevel: { ...st.heroLevel, [id]: level + 1 } }));
          if (ok) get().trackDaily('levelup');
          return ok;
        },
        trainHeroMax: (id) => {
          let n = 0;
          while (n < 200 && get().trainHero(id)) n++;
          return n;
        },
        // 金幣買召喚券：每週最多 TICKET_BUY_WEEKLY 張（第十三輪：不讓金幣副本變成無限抽卡）
        buyTicket: () => {
          get().ensureDaily();
          const week = get().weekly?.week ?? '';
          const bought = get().ticketBuys.week === week ? get().ticketBuys.count : 0;
          if (bought >= TICKET_BUY_WEEKLY) return false;
          return purchase(TICKET_GOLD_PRICE, s => ({ tickets: s.tickets + 1, ticketBuys: { week, count: bought + 1 } }));
        },
        // 金幣買專武券：每週最多 WEAPON_TICKET_BUY_WEEKLY 張
        buyWeaponTicket: () => {
          get().ensureDaily();
          const week = get().weekly?.week ?? '';
          const buys = get().weaponTicketBuys ?? { week: '', count: 0 };
          const bought = buys.week === week ? buys.count : 0;
          if (bought >= WEAPON_TICKET_BUY_WEEKLY) return false;
          return purchase(WEAPON_TICKET_GOLD_PRICE, s => ({
            weaponTickets: (s.weaponTickets ?? 0) + 1,
            weaponTicketBuys: { week, count: bought + 1 },
          }));
        },
        // 錯題修煉場：每天前 TRAINING_GOLD_MAX 題答對，每題 TRAINING_GOLD 金幣
        earnTrainingGold: () => {
          const s = get();
          const today = new Date().toDateString();
          const n = s.trainingGoldDay === today ? s.trainingGoldCount : 0;
          if (n >= TRAINING_GOLD_MAX) return 0;
          set({ gold: s.gold + TRAINING_GOLD, trainingGoldDay: today, trainingGoldCount: n + 1 });
          return TRAINING_GOLD;
        },

        // 召喚：每抽 1 張券；有保底與累積點數
        summonHeroes: (count, rand) => {
          const s = get();
          if (s.tickets < count) return null;
          const { results, counter } = summon(count, s.summonCounter, rand);
          let state: SaveData = { ...s, tickets: s.tickets - count, summonCounter: counter };
          const outcomes = results.map(r => {
            const { patch, outcome } = grantHero(state, r);
            state = { ...state, ...patch };
            return outcome;
          });
          set({ tickets: state.tickets, summonCounter: state.summonCounter, heroes: state.heroes, party: state.party, heroShards: state.heroShards, heroLevel: state.heroLevel });
          get().trackDaily('summon');
          return outcomes;
        },

        // 累積點數滿了：任選一位 SSR
        exchangeSpark: (id) => {
          const s = get();
          const def = heroDef(id);
          if (s.summonCounter.spark < SPARK_COST || def.id !== id || def.rarity !== 'SSR') return null;
          const { patch, outcome } = grantHero(s, { id, rarity: 'SSR' });
          set({ ...patch, summonCounter: { ...s.summonCounter, spark: s.summonCounter.spark - SPARK_COST } });
          return outcome;
        },

        // 升品階：每位英雄最多升一階（例如 SSR → UR）；SSR 要先升到四星
        tierUp: (id) => {
          const s = get();
          const rarity = heroDef(id).rarity;
          const need = TIER_UP_SHARDS[rarity];
          if (!s.heroes.includes(id) || (s.heroTier[id] ?? 0) >= 1) return false;
          if (rarity === 'SSR' && (s.heroStars[id] ?? 0) < MAX_STARS) return false;
          const pay = payShards(s, id, need);
          if (!pay) return false;
          // 升品階也需要真名進度：至少完成幾項考驗
          if (trialsDone(s.trueName[id]) < TIER_UP_TRIALS) return false;
          return purchase(TIER_UP_GOLD[rarity], () => ({ ...pay, heroTier: { ...get().heroTier, [id]: 1 } }));
        },

        // SSR 升星：一星～四星，碎片不夠時用願望碎片補
        starUp: (id) => {
          const s = get();
          const stars = s.heroStars[id] ?? 0;
          if (!s.heroes.includes(id) || heroDef(id).rarity !== 'SSR' || (s.heroTier[id] ?? 0) >= 1 || stars >= MAX_STARS) return false;
          const pay = payShards(s, id, STAR_COSTS[stars]);
          if (!pay) return false;
          return purchase(STAR_GOLD(stars), () => ({ ...pay, heroStars: { ...get().heroStars, [id]: stars + 1 } }));
        },

        // 每日素材本：一天 3 次
        startRush: () => set(s => {
          const today = new Date().toDateString();
          return { rushDay: today, rushRuns: (s.rushDay === today ? s.rushRuns : 0) + 1 };
        }),
        grantRush: (reward) => {
          get().addGold(reward.gold);
          get().addMaterials({ ore: reward.ore });
          const a = get().awardXp(reward.xp, 'rush');
          return { ...reward, xp: a.xp, gold: reward.gold + a.allowanceGold, bonus: a.bonus, allowanceGold: a.allowanceGold };
        },

        // 英雄時空之塔：照順序往上爬，第一次通過的那一層才給獎勵
        clearTowerFloor: (floor, heroId) => {
          const s = get();
          if (floor !== s.towerFloor + 1) return null;
          const reward = towerReward(floor);
          set(st => ({
            towerFloor: floor,
            classBadges: st.classBadges + reward.badges,
            ...(heroId ? { heroShards: { ...st.heroShards, [heroId]: (st.heroShards[heroId] ?? 0) + reward.shards } } : { wishShards: st.wishShards + reward.shards }),
          }));
          get().addGold(reward.gold);
          const a = get().awardXp(reward.xp, 'tower');
          return { ...reward, xp: a.xp, gold: reward.gold + a.allowanceGold, bonus: a.bonus, allowanceGold: a.allowanceGold };
        },

        // 錯題修煉場：連續答對 5 題送 3 張掃蕩券（每天最多 5 張）
        earnSweepTickets: () => {
          const s = get();
          const today = new Date().toDateString();
          const given = s.trainingDay === today ? s.trainingGiven : 0;
          const n = Math.max(0, Math.min(SWEEP_PER_STREAK, SWEEP_DAILY_MAX - given));
          if (n > 0) set({ sweepTickets: s.sweepTickets + n, trainingDay: today, trainingGiven: given + n });
          return n;
        },

        // 掃蕩：用一張掃蕩券直接拿到一張三星地圖的獎勵（金幣、經驗、素材），不用再手動打一次
        sweepMap: (regionIdx, rand = Math.random) => {
          const s = get();
          if (s.sweepTickets <= 0) return null;
          const gold = Math.round(400 * (1 + regionIdx * 0.3));
          const xp = Math.round(150 * xpScale(regionIdx));
          const drops = rollDrops('boss', ELEMENTS[Math.floor(rand() * ELEMENTS.length)].id, rand, regionIdx);
          drops.ore = (drops.ore ?? 0) + 5;
          set({ sweepTickets: s.sweepTickets - 1 });
          get().addGold(gold);
          get().addMaterials(drops);
          const a = get().awardXp(xp, 'sweep');
          return { gold: gold + a.allowanceGold, xp: a.xp, drops };
        },

        // 每日碎片英文題：每答對一題 2 片願望碎片（一天一次，最多 10 片）
        finishShardQuiz: (correct) => {
          const today = new Date().toDateString();
          if (get().shardQuizDay === today) return 0;
          const gained = Math.min(SHARD_QUIZ_MAX, correct * SHARD_QUIZ_PER);
          set(st => ({ wishShards: st.wishShards + gained, shardQuizDay: today }));
          return gained;
        },

        // 加入或移出隊伍：最多 4 人、至少留 1 人
        toggleMember: (id) => set(s => {
          if (s.party.includes(id)) return s.party.length > 1 ? { party: s.party.filter(m => m !== id) } : {};
          const owned = id === 'player' ? s.character !== null : s.heroes.includes(id);
          return owned && s.party.length < PARTY_MAX ? { party: [...s.party, id] } : {};
        }),

        setLeader: (id) => set(s => (s.party.includes(id) ? { party: [id, ...s.party.filter(m => m !== id)] } : {})),

        // 隊伍裡的英雄拖到另一格：兩人交換（拖到空格就排到最後）；
        // 隊伍外的英雄拖到有人的格子：替換那位；拖到空格：加入隊伍
        placeMember: (id, slot) => set(s => {
          const owned = id === 'player' ? s.character !== null : s.heroes.includes(id);
          if (!owned || slot < 0 || slot >= PARTY_MAX) return {};
          const party = [...s.party];
          const from = party.indexOf(id);
          if (from >= 0) {
            if (slot >= party.length) party.push(...party.splice(from, 1));
            else [party[from], party[slot]] = [party[slot], party[from]];
          } else if (slot < party.length) party[slot] = id;
          else if (party.length < PARTY_MAX) party.push(id);
          else return {};
          return { party };
        }),

        // 隊伍至少要有一人：有主角就留主角，否則留目前的隊長
        clearParty: () => set(s => ({ party: s.character ? ['player'] : s.party.slice(0, 1) })),

        // 只保留設定、新手引導進度與主角
        // 重置：全部歸零（主角、劇情、提示、設定都清掉），回到建立主角
        resetProgress: () => set({ ...initialSave }),
      };
    },
    {
      name: 'english-rpg-save',
      version: SAVE_VERSION,
      storage: createJSONStorage(() => safeStorage),
      migrate: migrateSave,
      // 版本相同時也做型別檢查（migrate 只在版本不同時才會執行）
      // 沒有存檔（新玩家）時 persisted 是 undefined：直接用預設值，不能當成舊存檔轉換（不然會被當成看過新手引導與全部提示）
      merge: (persisted, current) => (isPlainObject(persisted) ? { ...current, ...migrateSave(persisted, SAVE_VERSION) } : current),
      partialize: (s) => ({
        character: s.character,
        unlockedIndex: s.unlockedIndex, prologueDone: s.prologueDone, placement: s.placement, levelProgress: s.levelProgress, micAsked: s.micAsked, mistakes: s.mistakes, codex: s.codex, knowledge: s.knowledge, mapMastery: s.mapMastery, firstClearXpClaimed: s.firstClearXpClaimed, learningXpDay: s.learningXpDay, xpLedger: s.xpLedger, bossDown: s.bossDown, strictTrials: s.strictTrials, settings: s.settings,
        tutorialDone: s.tutorialDone, gold: s.gold, upgrades: s.upgrades, items: s.items, heroes: s.heroes, party: s.party,
        tickets: s.tickets, summonCounter: s.summonCounter, weaponTickets: s.weaponTickets, weapons: s.weapons, weaponShards: s.weaponShards, weaponCounter: s.weaponCounter, heroShards: s.heroShards, heroTier: s.heroTier,
        heroStars: s.heroStars, wishShards: s.wishShards, shardQuizDay: s.shardQuizDay, rushDay: s.rushDay, rushRuns: s.rushRuns, xpAllowanceDay: s.xpAllowanceDay, xpAllowanceGold: s.xpAllowanceGold, xpAllowanceRemainder: s.xpAllowanceRemainder, towerFloor: s.towerFloor,
        sweepTickets: s.sweepTickets, wheelClaimed: s.wheelClaimed, ticketBuys: s.ticketBuys, weaponTicketBuys: s.weaponTicketBuys, trainingGoldDay: s.trainingGoldDay, trainingGoldCount: s.trainingGoldCount, wheelPending: s.wheelPending, wheelDry: s.wheelDry, trainingDay: s.trainingDay, trainingGiven: s.trainingGiven,
        mapStars: s.mapStars, bestStage: s.bestStage, storySeen: s.storySeen, storyRewardClaimed: s.storyRewardClaimed,
        player: s.player, classPaths: s.classPaths, homeClass: s.homeClass, classBadges: s.classBadges, heroLevel: s.heroLevel, materials: s.materials, equipment: s.equipment, equipped: s.equipped,
        trueName: s.trueName, trueNameRewarded: s.trueNameRewarded, goldenBest: s.goldenBest, titles: s.titles, daily: s.daily, weekly: s.weekly, skillBossCleared: s.skillBossCleared, hintsSeen: s.hintsSeen,
      }),
    },
  ),
);
