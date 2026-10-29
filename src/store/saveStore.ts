import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { StateStorage } from 'zustand/middleware';
import type { Question } from '../game/types';
import { questionKey } from '../game/battle';
import { ITEMS, SRS_INTERVALS, SRS_MASTERED_BOX, UPGRADES, upgradeCost } from '../game/progression';
import type { ItemId, UpgradeId } from '../game/progression';
import {
  DUPLICATE_SHARDS, MAX_STARS, SPARK_COST, STAR_COSTS, STAR_GOLD, STARTER_TICKETS, TICKET_GOLD_PRICE, TIER_UP_GOLD, TIER_UP_SHARDS,
  currentRarity, heroDef, isHeroId, summon,
} from '../game/heroes';
import type { HeroId, SummonCounter, SummonResult } from '../game/heroes';
import { STAR_TICKETS, mergeStars } from '../game/stars';
import { HERO_LEVEL_CAPS, MAX_LEVEL, addXp, canAdvance, classNode, nextOptions, playerLevelCap, xpScale } from '../game/growth';
import { MAX_GRADE, SELL_RATE, enhanceChance, enhanceCost, equipDef, gradeMaterial, gradeOf, gradeRefund, maxPlus, resolveCost, sellValue } from '../game/equipment';
import type { OwnedEquip, Slot } from '../game/equipment';
import { TIER_UP_TRIALS, TRIAL_COUNT, TRIAL_SHARDS, trialsDone } from '../game/trueName';
import { applyDailyEvent, claimableMilestones, dailyDef, localDate, refreshDaily, refreshWeekly, streakMilestone, weeklyDef } from '../game/daily';
import type { DailyEvent, DailyState, WeeklyState } from '../game/daily';
import { normalizeCharacter } from '../game/character';
import { ALL_HINTS } from '../game/hints';
import { MAP_SIZE, REGIONS } from '../game/regions';
import { clearStoryId, regionStoryId } from '../game/story';
import type { Character } from '../game/character';
import { PARTY_MAX } from '../game/party';
import type { MemberId } from '../game/party';

// 玩家存檔（存在瀏覽器 localStorage）。
// 修改資料結構時：SAVE_VERSION +1，並在 migrateSave 補上舊版轉換，避免舊存檔壞掉。
export const SAVE_VERSION = 15;

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

interface SaveData {
  // 玩家自創的主角；null 代表還沒建立（第一次進入遊戲會先開角色創建）
  character: Character | null;
  unlockedIndex: number;
  // 每個區域目前打到第幾關（stage index），離開後回來從這裡繼續
  levelProgress: Record<string, number>;
  micAsked: boolean;
  mistakes: Record<string, MistakeRecord>;
  codex: Record<string, CodexEntry>;
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
  heroShards: Record<HeroId, number>;
  heroStars: Record<HeroId, number>; // SSR 升星（0～4 星）
  wishShards: number;                // 願望碎片：任何英雄都能用來補不足的碎片
  shardQuizDay: string;              // 每日碎片英文題最後完成的日期（一天一次）
  heroTier: Record<HeroId, number>;
  // 世界：每張地圖的最佳三星紀錄（key 為 regionId#mapIdx）、每個區域打到過的最遠關卡、看過的劇情
  mapStars: Record<string, boolean[]>;
  bestStage: Record<string, number>;
  storySeen: string[];
  // 成長：主角等級與轉職路線、英雄等級、素材、裝備
  player: { level: number; xp: number; classPath: string[] };
  heroLevel: Record<HeroId, number>;
  materials: Record<string, number>;
  equipment: OwnedEquip[];
  equipped: Partial<Record<Slot, string>>;
  // 真名考驗：每位英雄五項考驗是否完成
  trueName: Record<HeroId, boolean[]>;
  // 黃金之路最多通過幾關（全部通關為關卡總數）、獲得的稱號
  goldenBest: number;
  titles: string[];
  // 每日任務與連續登入；擴充魔王（聽說讀寫）的通關紀錄
  daily: DailyState | null;
  weekly: WeeklyState | null; // 每週任務
  skillBossCleared: string[];
  // 戰鬥中已看過的情境提示
  hintsSeen: string[];
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
  recordAnswer: (q: Question, correct: boolean, review: boolean) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setTutorialDone: (done: boolean) => void;
  addGold: (amount: number) => void;
  buyUpgrade: (id: UpgradeId) => boolean;
  buyItem: (id: ItemId) => boolean;
  consumeItem: (id: ItemId) => boolean;
  addTickets: (n: number) => void;
  buyTicket: () => boolean;
  summonHeroes: (count: number, rand?: () => number) => SummonOutcome[] | null;
  exchangeSpark: (id: HeroId) => SummonOutcome | null;
  tierUp: (id: HeroId) => boolean;
  starUp: (id: HeroId) => boolean;
  finishShardQuiz: (correct: number) => number; // 回傳得到的願望碎片
  // 記錄地圖星星，回傳這次新拿到幾顆（每顆送召喚券）
  recordMapStars: (key: string, stars: boolean[]) => number;
  markStorySeen: (id: string) => void;
  gainXp: (n: number) => number; // 回傳升了幾級
  advanceClass: (nodeId: string) => boolean;
  addMaterials: (drops: Record<string, number>) => void;
  forge: (defId: string) => boolean;
  enhance: (uid: string, holy?: boolean, rand?: () => number) => 'ok' | 'fail' | false; // 失敗只扣材料
  sellEquip: (uid: string) => boolean;
  gradeUp: (uid: string) => boolean;
  sellHero: (id: HeroId) => number; // 回傳得到的金幣，不能賣時回傳 0
  equip: (uid: string) => void;
  unequip: (slot: Slot) => void;
  trainHero: (id: HeroId) => boolean;
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
  clearParty: () => void; // 一鍵撤下：只留主角當隊長
  resetProgress: () => void; // 全部歸零，從建立主角重新開始
}

export const initialSave: SaveData = {
  character: null,
  unlockedIndex: 0,
  levelProgress: {},
  micAsked: false,
  mistakes: {},
  codex: {},
  settings: { speechRate: 0.9, volume: 1, sfxVolume: 0.7, autoSpeak: true, showLessons: true, voiceAsSpelling: false, musicVolume: 0.35, reduceMotion: false, textScale: 1 },
  tutorialDone: false,
  gold: 0,
  upgrades: { hp: 0, atk: 0, combo: 0, gold: 0 },
  items: { potion: 0, hint: 0, shield: 0 },
  heroes: ['knight'],
  party: ['player', 'knight'],
  tickets: STARTER_TICKETS,
  summonCounter: { sinceSsr: 0, spark: 0 },
  heroShards: {},
  heroStars: {},
  wishShards: 0,
  shardQuizDay: '',
  heroTier: {},
  mapStars: {},
  bestStage: {},
  storySeen: [],
  player: { level: 1, xp: 0, classPath: [] },
  heroLevel: {},
  materials: {},
  equipment: [],
  equipped: {},
  trueName: {},
  goldenBest: 0,
  titles: [],
  daily: null,
  weekly: null,
  skillBossCleared: [],
  hintsSeen: [],
};

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
function grantHero(s: SaveData, r: SummonResult): { patch: Pick<SaveData, 'heroes' | 'party' | 'heroShards'>; outcome: SummonOutcome } {
  if (!s.heroes.includes(r.id)) {
    return {
      patch: { heroes: [...s.heroes, r.id], party: s.party.length < PARTY_MAX ? [...s.party, r.id] : s.party, heroShards: s.heroShards },
      outcome: { ...r, isNew: true, shards: 0 },
    };
  }
  const shards = DUPLICATE_SHARDS[heroDef(r.id).rarity];
  return {
    patch: { heroes: s.heroes, party: s.party, heroShards: { ...s.heroShards, [r.id]: (s.heroShards[r.id] ?? 0) + shards } },
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
    tutorialDone: version >= 1 ? (version < 2 ? true : data.tutorialDone ?? true) : (data.tutorialDone ?? false),
  };
  // 型別檢查：壞掉的欄位改回預設值（每日任務可以是 null，其他物件要長得對）
  Object.assign(migrated, conform(initialSave, migrated));
  if (migrated.daily !== null && !(isPlainObject(migrated.daily) && Array.isArray(migrated.daily.tasks))) migrated.daily = null;
  if (migrated.weekly !== null && !(isPlainObject(migrated.weekly) && Array.isArray(migrated.weekly.tasks))) migrated.weekly = null;
  // 數量類的紀錄：去掉不是數字的項目，負數改成 0；等級至少 1
  const counts = (rec: Record<string, number>, min = 0) => Object.fromEntries(Object.entries(rec)
    .filter(([, v]) => typeof v === 'number' && Number.isFinite(v)).map(([k, v]) => [k, Math.max(min, v)]));
  migrated.materials = counts(migrated.materials);
  migrated.heroShards = counts(migrated.heroShards);
  migrated.heroTier = counts(migrated.heroTier);
  migrated.heroStars = counts(migrated.heroStars);
  migrated.heroLevel = counts(migrated.heroLevel, 1);
  migrated.levelProgress = counts(migrated.levelProgress);
  if (version >= 1 && version < 15) migrated.unlockedIndex = OLD_REGION_TO_NEW[Math.min(6, Math.max(0, Math.floor(migrated.unlockedIndex)))];
  migrated.bestStage = counts(migrated.bestStage);
  migrated.player = { ...migrated.player, level: Math.min(MAX_LEVEL, Math.max(1, Math.floor(migrated.player.level))) };
  if (!data.hintsSeen) migrated.hintsSeen = version >= 1 && migrated.tutorialDone ? [...ALL_HINTS] : [];
  migrated.mistakes = Object.fromEntries(Object.entries(migrated.mistakes)
    .filter(([, m]) => isPlainObject(m) && isPlainObject(m.question))
    .map(([key, m]) => [key, { ...m, box: m.box ?? 0, dueAt: m.dueAt ?? m.lastWrongAt ?? 0 }]));
  migrated.codex = Object.fromEntries(Object.entries(migrated.codex).filter(([, c]) => isPlainObject(c) && isPlainObject(c.question)));
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
        setCharacter: (c) => set({ character: normalizeCharacter(c) }),
        unlockLevel: (index) => set(s => ({ unlockedIndex: Math.max(s.unlockedIndex, index) })),
        skipRegions: (count) => set(s => {
          const n = Math.min(count, REGIONS.length - 1);
          if (n <= s.unlockedIndex) return {};
          const bestStage = { ...s.bestStage };
          const storySeen = new Set(s.storySeen);
          for (let i = 0; i < n; i++) {
            const r = REGIONS[i];
            bestStage[r.id] = Math.max(bestStage[r.id] ?? 0, r.maps.length * MAP_SIZE - 1);
            storySeen.add(regionStoryId(i)).add(clearStoryId(i));
          }
          return { unlockedIndex: n, bestStage, storySeen: [...storySeen] };
        }),
        setLevelProgress: (levelKey, stageIdx) => set(s => ({
          levelProgress: { ...s.levelProgress, [levelKey]: stageIdx },
          bestStage: { ...s.bestStage, [levelKey]: Math.max(s.bestStage[levelKey] ?? 0, stageIdx) },
        })),
        setMicAsked: () => set({ micAsked: true }),

        recordAnswer: (q, correct, review) => {
          let reviewed = false;
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
          return { codex, mistakes };
        });
        if (reviewed) get().trackDaily('review');
      },

        updateSettings: (patch) => set(s => ({ settings: { ...s.settings, ...patch } })),
        setTutorialDone: (done) => set({ tutorialDone: done }),
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

        gainXp: (n) => {
          const p = get().player;
          const r = addXp(p.level, p.xp, n, playerLevelCap(p.classPath.length));
          set({ player: { ...p, level: r.level, xp: r.xp } });
          if (r.levelsGained > 0) get().trackDaily('levelup', r.levelsGained);
          return r.levelsGained;
        },

        // 轉職：必須是目前路線的下一階，且達到等級與通關條件
        advanceClass: (nodeId) => {
          const s = get();
          const n = classNode(nodeId);
          if (!n || !s.character) return false;
          const options = nextOptions(s.character.classId, s.player.classPath);
          if (!options.some(o => o.id === nodeId) || !canAdvance(n.tier, s.player.level, s.unlockedIndex)) return false;
          set({ player: { ...s.player, classPath: [...s.player.classPath, nodeId] } });
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
          set({
            trueName: { ...s.trueName, [id]: next },
            heroShards: { ...s.heroShards, [id]: (s.heroShards[id] ?? 0) + TRIAL_SHARDS },
          });
          get().trackDaily('trial');
          return true;
        },

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
        buyTicket: () => purchase(TICKET_GOLD_PRICE, s => ({ tickets: s.tickets + 1 })),

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
          set({ tickets: state.tickets, summonCounter: state.summonCounter, heroes: state.heroes, party: state.party, heroShards: state.heroShards });
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
      merge: (persisted, current) => ({ ...current, ...migrateSave(persisted, SAVE_VERSION) }),
      partialize: (s) => ({
        character: s.character,
        unlockedIndex: s.unlockedIndex, levelProgress: s.levelProgress, micAsked: s.micAsked, mistakes: s.mistakes, codex: s.codex, settings: s.settings,
        tutorialDone: s.tutorialDone, gold: s.gold, upgrades: s.upgrades, items: s.items, heroes: s.heroes, party: s.party,
        tickets: s.tickets, summonCounter: s.summonCounter, heroShards: s.heroShards, heroTier: s.heroTier,
        heroStars: s.heroStars, wishShards: s.wishShards, shardQuizDay: s.shardQuizDay,
        mapStars: s.mapStars, bestStage: s.bestStage, storySeen: s.storySeen,
        player: s.player, heroLevel: s.heroLevel, materials: s.materials, equipment: s.equipment, equipped: s.equipped,
        trueName: s.trueName, goldenBest: s.goldenBest, titles: s.titles, daily: s.daily, weekly: s.weekly, skillBossCleared: s.skillBossCleared, hintsSeen: s.hintsSeen,
      }),
    },
  ),
);
