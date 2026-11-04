import { retryAid } from '../game/retryAid';
import { create } from 'zustand';
import type { Question, QuestionSkill, Stage } from '../game/types';
import {
  BOMB_DAMAGE, BOMB_QUESTIONS, FROST_BLOCK_COMBO, FROST_LIMIT, FROST_QUESTIONS, MIRAGE_QUESTIONS, QUAKE_QUESTIONS, REGROW_BLOCK_COMBO, REGROW_HEAL,
  SEAL_BREAK_COMBO, SEAL_BREAK_TOTAL, STATIC_STEP, bossSkillFor,
  BERSERK_FOE_MULT, HARD_SHELL_DAMAGE, REFRACTION_DAMAGE, TIME_THIEF_MS, VAMPIRE_HEAL, foeSkillFor, refractionImmune,
} from '../game/bossSkills';
import type { BossSkillId, FoeSkillId } from '../game/bossSkills';
import { LEVELS, createDecks, generateStages, getPool, questionSkill } from '../game/QuestionData';
import type { Decks } from '../game/QuestionData';
import {
  ASSIST_STREAK, BASE_DAMAGE, QUESTION_LIMIT, shuffleArray,
  applyLetter, buildAssist, checkChoice, checkTypedAnswer, easeOrder, voiceFallback, checkVoice, isLenientStage, questionKey, shuffleChoice, speedMultiplier,
} from '../game/battle';
import type { Assist } from '../game/battle';
import { SEGMENT_SIZE } from '../game/lesson';
import type { AnswerRecord } from '../game/lesson';
import {
  BOSS_QUESTION_EVERY, ELITE_HP_MULT, ELITE_SHIELD, GOLD, POTION_HEAL, TICKETS, TREASURE_HITS, TREASURE_TIME,
  BOSS_BONUS_FLOOR, rollBossBonus, computeDamage, goldWithBonus, skillEffect, monsterAttack, monsterElement, monsterGrowth, monsterMaxHp, playerStats,
  BLESSED_COMBO_KEEP, BLESSING_DAMAGE, NORMAL_WAVES, blessingChance, bossMaxHp, waveMaxHp,
  REGION_LEVELS,
} from '../game/progression';
import type { FoeKind, ItemId, PlayerStats, SkillId } from '../game/progression';
import { elementMultiplier } from '../game/character';
import type { Element } from '../game/character';
import { buildMember, buildParty, gainEnergy, isAlive, leaderIndex, nextAlive, partyHp, skillReady, teamGuardEvery, teamTimeBonus } from '../game/party';
import type { PartyOptions } from '../game/party';
import type { Member, MemberId } from '../game/party';
import { talentValue } from '../game/talents';
import {
  ELITE_POWER, FAST_STAGGER, POISON_TURNS, STAGGER, WEAKEN_TURNS, gaugeSeconds, monkHeal, monsterKindFor, patternOf,
} from '../game/enemyPatterns';
import type { EnemyMove, MonsterKind } from '../game/enemyPatterns';
import type { TalentId } from '../game/talents';
import { FINISHERS, TAUNT_CHANCE, TAUNT_REDUCTION, advanceChain, finisherMultiplier, relayFor } from '../game/synergy';
import type { Relay } from '../game/synergy';
import { dueMistakes, useSaveStore } from './saveStore';
import { ADVANCE_REQ, XP, canAdvance, isMilestoneLevel, xpScale } from '../game/growth';
import { rollDrops } from '../game/equipment';
import { MAP_SIZE, mapIndexOf, mapKey, regionOf } from '../game/regions';
import { PROLOGUE_XP, allowedTypes, prologueGuard, gaugeScale, isPrologue, minAnswers, stageInMap, stageRole, startWaves, untimedStage } from '../game/stageLayout';
import { BONUS_GOLD, BONUS_GOLD_CAP, canExecute, executeKindOf } from '../game/execute';
import { WRONG_COMBO_KEEP, applyHardBonus, decayCombo, grantSkillCombo, skillWindowOf } from '../game/combo';
import { detectWordEvolution } from '../game/wordFamilies';
import type { WordEvolutionResult } from '../game/wordFamilies';
import { useUiStore } from './uiStore';
import { emptyRunStats, evaluateStars, isFastAnswer } from '../game/stars';
import { dueKnowledge, isLearned, knowledgeKey, needsSeal, regionIndex } from '../game/knowledge';
import { CHASE_FAST_MS, MOD_DEFS, afterAnswer, isActive, chooseReflect, modDamageMult, modGaugeMult, modPreference, modSealed, modsFor, skillName, startMods } from '../game/bossMods';
import type { ModContext, ModEffects, ModRole, ModState } from '../game/bossMods';
import { grammarName, primaryGrammar } from '../game/grammar';
import { WHEEL_CHECKPOINTS, wheelKey } from '../game/wheel';
import { PROLOGUE_STORY_AT, STORIES, bossStoryId, mapStoryId } from '../game/story';
import { SKILL_BOSS_FIRST_TICKETS, SKILL_BOSS_HITS, reachablePool, skillBossDef, skillBossQuestions } from '../game/skillBosses';
import type { SkillBossId } from '../game/skillBosses';
import {
  GOLDEN_CLEAR_TICKETS, GOLDEN_LEVEL_KEY, GOLDEN_STAGE_COUNT, GOLDEN_TITLE, createGoldenDecks, generateGoldenStages, goldenMonsterHp, goldenTier,
} from '../game/golden';
import type { MapRunStats } from '../game/stars';

// 戰鬥進行中的狀態（不存檔）。React 負責作答介面與計時（呼叫 tick），Phaser 訂閱 event 播放動畫。
//
// 每題有 20 秒的 combo 計時：時間內答對 combo +1，越快傷害越高。
// 敵人只在答錯時攻擊。前 25 關超時只讓 combo 歸零（可以繼續作答），第 26 關之後超時算答錯。

// lesson：戰前預習；casting：技能施放確認（計時暫停）；summary：Boss 後的區段結算
export type BattlePhase =
  | 'lesson' | 'answering' | 'casting' | 'feedback'
  | 'monsterDown' | 'summary' | 'levelClear' | 'gameOver';

export interface BattleEvent {
  id: number;
  kind: 'attack' | 'hurt' | 'enemyMove' | 'stage' | 'assist' | 'shield' | 'heal' | 'guard' | 'skill' | 'overtime' | 'shieldHit' | 'escape';
  amount?: number;
  gold?: number;
  crit?: boolean;
  fast?: number;           // 快答加成倍率（> 1 時顯示 FAST!）
  member?: MemberId;       // 出手或受傷的隊員
  bossQuestion?: boolean;  // 這一擊來自困難題
  bonus?: { mult: number; from: number; to: number; gain: number }; // 困難題 Bonus：抽中 ×mult，原生 combo 實際增加 gain（單次最多 +15 萬）
  skill?: SkillId;
  levelUp?: number;                 // 主角升到第幾級
  guardGained?: boolean;            // 被動守護觸發
  drops?: Record<string, number>;   // 擊倒後的素材
  relay?: string;                   // 這一擊吃到的接力加成（例如「⚔️ 劍氣接力」）
  chain?: number;                   // 觸發連攜攻擊：參與的隊員數
  taunt?: boolean;                  // 戰士挑釁，替隊友擋下這一擊
  waveKill?: boolean;               // 擊倒這一波，下一隻怪物馬上登場
  execution?: boolean;              // 勝利後自選追擊練習的演出
  slain?: boolean;                  // 高Combo的致命一擊特效，不額外改變傷害
  finisher?: string;                // 連攜技名稱（依最後出手的職業）
  move?: { icon: string; name: string; hits: { member: MemberId; amount: number }[] }; // 敵人依攻擊模式出招
}

// 地圖結算：這張地圖拿到的星星（與先前最佳紀錄合併前）、這次新拿到幾顆
export interface MapResult {
  mapIdx: number;
  stars: boolean[];
  gained: number;
}

export interface Feedback {
  question: Question;
  given: string;
  timeout: boolean;
}

export const REVENGE_MAX_QUESTIONS = 5;
export const COMBO_GOLD_STEP = 10; // 每連續答對 10 題金幣 +10%，最多 +100%（看真的連對數，困難題 Bonus 抽到 ×10 不會直接拿滿）

interface BattleState {
  active: boolean;
  levelKey: string;
  mode: 'normal' | 'golden' | 'skill'; // golden：黃金之路；skill：聽說讀寫擴充魔王
  skillBoss: SkillBossId | null;
  levelIdx: number;
  stages: Stage[];
  stageIdx: number;
  qIdx: number;
  original: Question | null; // 題庫中的原題（未洗牌），用於紀錄與重答
  question: Question | null; // 顯示用（選項已洗牌）
  questionSeq: number;
  questionCount: number;     // 這趟出過幾題（決定困難題時機）
  isBossQuestion: boolean;
  typed: string;
  retrying: boolean; // 看完正確答案後的重答，不算 SRS 複習
  combo: number;      // 顯示與傷害用的 combo＝原生 combo＋技能 combo（規格 v2.0）
  skillCombo: number; // 其中由技能加的部分：不參與困難題 Bonus 乘法
  skillWindow: number;     // 技能加 combo 的 8 題視窗編號
  skillWindowGain: number; // 這個視窗已經由技能加了多少
  runAnswers: number;      // 這張地圖（這趟冒險）實際作答幾題
  maxCombo: number;
  bossBoost: boolean; // 英勇號令：下一次困難題 Bonus 保底
  party: Member[];
  attackerIdx: number;
  playerHp: number;  // 全隊 HP 合計（畫面上方血條）
  playerMaxHp: number;
  monsterHp: number;
  monsterMaxHp: number;
  monsterElement: Element;
  monsterShield: number;    // 菁英怪剩餘護盾
  treasureLeft: number;     // 寶箱怪剩餘時間
  phase: BattlePhase;
  feedback: Feedback | null;
  event: BattleEvent | null;
  answers: AnswerRecord[];
  wrongStreak: number;
  assist: Assist | null;
  assistSource: 'helper' | 'item' | null;
  shield: boolean;
  comboGuard: boolean;  // 守護之盾：下一次答錯不中斷 combo
  amplifyLeft: number;  // 魔力增幅：剩幾次攻擊翻倍
  relay: Relay | null;  // 上一位出手隊員給下一位的接力加成
  chain: MemberId[];    // 連攜進度：這一輪已經出手過的隊員
  focusMs: number;      // 專注類技能：這一關每題多幾毫秒
  charge: number;       // 蓄力類技能：下一次答對的傷害倍率（1 = 沒有）
  critLeft: number;     // 箭雨類技能：接下來幾次攻擊必定暴擊
  questionLimit: number;
  questionLeft: number;
  activeAnswerMs: number;
  wordEvolution: WordEvolutionResult | null; // 詞族進化微特效
  overtime: boolean;    // 這題已超過 20 秒（前 25 關）：答對不加 combo
  phaseLeft: number;    // 施法確認剩餘時間
  casting: number | null; // 正在確認施放技能的隊員
  stats: PlayerStats;
  runGold: number;
  runRunes: number;      // 這次跨日複習答對幾個（封印能量）
  mapStats: MapRunStats; // 這張地圖的戰績（三星評價用）
  mapResult: MapResult | null;
  runXp: number;
  runDrops: Record<string, number>;
  stageHits: number; // 這一關打出的攻擊數（每關第一擊加成用）
  wave: number;       // 一般關：第幾隻怪物（1 起算）
  waves: number;      // 一般關：總共幾隻
  bossFight: boolean; // 首領戰（一般模式）：有魔王祝福，沒有女神祝福的傷害加成
  streak: number;     // 真的連續答對幾題（不受困難題 Bonus 乘法影響）：三星與首領技能的破解用
  stageSubmissions: number; // 真正提交的答案，不包含自動超時
  stageAnswers: number; // 這一關已經作答幾題（答對答錯都算）
  minAnswers: number;   // 勝利後追擊練習的參考題數（不限制擊殺）
  executing: boolean;   // 僅自選追擊練習時為 true
  bonusLeft: number;    // 首領／菁英倒下後，還可自選追擊的參考題數
  isReplayStage: boolean; // 載關時快照，勝利後追擊仍沿用原分類
  bonusRound: boolean;  // 正在做加成題（怪物已倒，不反擊、不影響結算）
  bonusGold: number;    // 這場加成題拿到的金幣（上限 BONUS_GOLD_CAP）
  bonusReturn: BattleState['phase'] | null; // 加成題做完回到哪個畫面
  // 同一關連敗援助，首領依v2.2第2/3/4/6戰逐階提供
  aidRevive: boolean;
  aidGuard: number;
  aidTimeMs: number;
  aidReviveRatio: number;
  aidSealTotal: number;
  blessed: boolean;   // 祝福：答錯 combo 只扣 30%（首領戰固定有；一般關失敗後有機率）
  enemyTurn: number;  // A2+ 敵人主動攻擊的計數（每題 +1）
  // 區域最終魔王的特殊技能（見 game/bossSkills.ts）
  bossSkill: BossSkillId | null;
  bossCast: { seq: number; text: string } | null; // 魔王剛發動技能／被破解的提示
  frostLeft: number;   // 極寒：剩幾題只有 8 秒
  blind: boolean;      // 視覺剝奪：這一題看不到題目文字
  mirageLeft: number;  // 海市蜃樓：剩幾題答錯會雙倍傷害
  mirageStreak: number;
  stunned: { member: MemberId; left: number } | null; // 大地碎裂：被震飛的隊員
  staticStacks: number; // 靜電標記：連續答錯幾次
  bombLeft: number;    // 灰燼炸彈：倒數
  sealed: boolean;     // 全知封印／技能封印：隊長的技能被封印
  sealTarget: MemberId | null; // 被封印的隊員（第九輪：只封一個人的技能）
  sealHits: number;    // 全知封印：累計答對幾題
  foeSkill: FoeSkillId | null; // 守門頭目／菁英怪的技能
  mods: ModState[];     // 首領的機制模組 M01～M11（見 game/bossMods.ts）
  modChoice: QuestionSkill[] | null; // M05 題型反射：等玩家選題型
  // 敵人攻擊模式（見 game/enemyPatterns.ts）
  monsterKind: MonsterKind;
  enemyGauge: number;   // 行動條 0～1，滿了就出招
  enemyMoveIdx: number; // 出到第幾招
  poison: { member: MemberId; left: number; dmg: number }[];
  weakenLeft: number;   // 虛弱：剩幾題全隊傷害降低
  weaken: number;
  slowNext: number;     // 減速：下一題少幾毫秒

  // fromStage 未指定時，從存檔記錄的進度繼續
  startLevel: (levelKey: string, transform?: (q: Question) => Question, fromStage?: number) => void;
  startGoldenRoad: (transform?: (q: Question) => Question) => void;
  startSkillBoss: (id: SkillBossId) => void;
  startBattle: () => void;
  openLesson: () => void;
  tick: (ms: number, systemPauseMs?: number, activePauseMs?: number) => void;
  inputLetter: (letter: string) => void;
  backspace: () => void;
  submitTyped: () => void;
  // 沒有麥克風或不方便說話：這場戰鬥的口說題都改成拼寫（眼前這題立刻轉換）
  switchToSpelling: () => void;
  chooseOption: (letter: string) => void;
  submitVoice: (transcripts: string | string[]) => void;
  continueAfterFeedback: () => void;
  startBonus: () => void;  // 處決後「繼續追擊」：把剩下的最低題數當加成題練
  endBonus: () => void;    // 結束加成題，回到結算畫面
  requestSkill: (memberIdx: number) => void;
  chooseModSkill: (skill: QuestionSkill) => void;
  confirmSkill: () => void;
  cancelSkill: () => void;
  consumeItem: (id: ItemId) => void;
  nextStage: () => void;
  retryLevel: () => void;
  retryWithWarmupBonus: () => void;
  exitToMap: () => void;
}

let eventId = 0;
const nextEvent = (kind: BattleEvent['kind'], extra: Omit<BattleEvent, 'id' | 'kind'> = {}): BattleEvent => ({ id: ++eventId, kind, ...extra });

// 開始關卡時可傳入題目轉換（例如不支援語音辨識時把語音題改成拼寫題）
let questionTransform: (q: Question) => Question = q => q;
let decks: Decks | null = null;
let goldenDecks: Decks[] | null = null; // 黃金之路：每個區域一份題庫，依關卡切換
// 新玩家第一場戰鬥的前幾題（由易到難），用完就回到正常出題
const EASY_START = 3;
let easyQueue: Question[] = [];
// 只用在一般關卡（頭目、菁英、寶箱、復仇魔王照常出題）
// 同一關失敗的次數（祝福觸發用）：key = 區域#關卡，通過那一關就清掉
const stageFails = new Map<string, number>();
// 離線獨立快照模擬用；一般遊戲重打保留原本記憶體內的連敗狀態。
export const snapshotRetryState = () => [...stageFails.entries()];
export function restoreRetryState(rows: readonly [string, number][]) {
  stageFails.clear();
  for (const [key, count] of rows) stageFails.set(key, count);
}
const failKey = (levelKey: string, stageIdx: number) => `${levelKey}#${stageIdx}`;

const takeEasy = (stage: Stage) => (stage.bossMode || stage.revenge || stage.kind ? undefined : easyQueue.shift());
// 暴擊與敵人攻擊目標用的亂數（測試可替換）
let random: () => number = Math.random;
export const setBattleRandom = (fn: () => number) => { random = fn; };

const save = () => useSaveStore.getState();

// 升級慶祝：只在里程碑等級或剛好可以轉職時全螢幕慶祝（其他升級只在戰鬥畫面跳字）
function celebrateLevelUp(level: number) {
  const { character, player } = save();
  const tier = (player.classPath.length + 1) as 1 | 2 | 3 | 4;
  const canClass = !!character && tier <= 4 && ADVANCE_REQ[tier]?.level === level && canAdvance(tier, level);
  if (!canClass && !isMilestoneLevel(level)) return;
  useUiStore.getState().celebrate({
    icon: '⬆️', title: `LEVEL UP!  Lv ${level}`,
    sub: canClass ? '可以轉職了！到「成長」選擇新的職業路線' : 'HP 與攻擊力提升了',
    color: '#7fe8ff',
  });
}

// 首領與一般關的連敗援助由retryAid依失敗次數分級。
const REVIVE_TEXT = '✨ 女神的祝福：全隊復活！';
// 答錯被反擊後，行動條最多停在這裡（不會同一題連續挨兩次）
const COUNTER_GAUGE_CAP = 0.6;
const reviveAll = (party: Member[], ratio: number) => party.map(m => ({ ...m, hp: Math.max(1, Math.round(m.maxHp * ratio)) }));

// 每張三星關卡的第 15 關（小 BOSS）：如果有到期的錯題，換成「復仇魔王」
function withRevenge(stage: Stage, stageIdx: number, levelIdx: number): Stage {
  if (!stage.bossMode || stageRole(levelIdx, stageIdx) !== 'gate') return stage;
  const due = dueMistakes(save().mistakes, Date.now(), REVENGE_MAX_QUESTIONS);
  if (due.length === 0) return stage;
  return { name: '復仇魔王', bossMode: true, revenge: true, questions: due.map(m => m.question) };
}

// 這一關的怪物強度（決定等級、攻擊與行動條速度）：菁英、小 BOSS（第 15 關）、大 BOSS（第 20 關）、區域魔王，一般怪是 undefined
export function foeKindOf(stage: Stage, stageIdx: number, stageCount: number): FoeKind | undefined {
  if (stage.bossMode) return stage.kind === 'final' || (stageIdx === stageCount - 1 && stage.kind !== 'gate') ? 'final' : stageInMap(stageIdx) === 20 ? 'boss' : 'gate';
  return stage.kind === 'elite' ? 'elite' : undefined;
}

// 困難題：優先出到期的錯題，其次任何錯題，都沒有就出這個區域的 Boss 題。
// 錯題中先考最不熟的（在不同天答對次數最少的），一樣不熟的隨機挑。
// stageIdx：一般模式的關卡，新手關只出開放的題型（題庫的 boss 抽題也會照題型篩）
function pickBossQuestion(exclude: Question | null, levelIdx: number, stageIdx?: number, levelKey?: string): Question {
  const skip = exclude ? questionKey(exclude) : '';
  const types = stageIdx === undefined ? null : allowedTypes(levelIdx, stageIdx, levelKey);
  const mistakes = Object.values(save().mistakes)
    .filter(m => questionKey(m.question) !== skip && (!types || types.includes(m.question.type)));
  const due = mistakes.filter(m => m.dueAt <= Date.now());
  const pool = due.length > 0 ? due : mistakes;
  if (pool.length > 0) {
    const least = Math.min(...pool.map(m => m.box));
    const weakest = pool.filter(m => m.box === least);
    return weakest[Math.floor(random() * weakest.length)].question;
  }
  return decks!.boss(stageIdx);
}

// 主線排題（和 ChatGPT 第四輪定案）：每 100 題約 35% 新題、52.5% 到期的跨日複習、12.5% 困難題 Bonus。
// 困難題以外的題目有 60% 機會換成到期的知識點（52.5 / 87.5）；沒有到期的就出新題，不虛構跨日紀錄。
// 到期的知識點換一種題型考（今天聽力、明天拼寫…），一樣不熟的先考
export const REVIEW_SHARE = 0.6;
let reviewIndex: Map<string, Question[]> = new Map();
function buildReviewIndex(levelIdx: number) {
  const index = new Map<string, Question[]>();
  const add = (q: Question) => {
    const k = knowledgeKey(q);
    const list = index.get(k);
    if (list) list.push(q); else index.set(k, [q]);
  };
  for (let i = 0; i <= levelIdx; i++) for (const list of regionIndex(i).values()) list.forEach(add);
  // 舊題庫或其他模式學過的字：從圖鑑找題目
  for (const c of Object.values(save().codex)) if (!index.has(knowledgeKey(c.question))) add(c.question);
  reviewIndex = index;
}
function pickDueReview(exclude: Question | null, types: string[] | null): Question | null {
  if (random() >= REVIEW_SHARE) return null;
  const skip = exclude ? knowledgeKey(exclude) : '';
  for (const key of dueKnowledge(save().knowledge, Date.now())) {
    if (key === skip) continue;
    const list = (reviewIndex.get(key) ?? []).filter(q => !types || types.includes(q.type));
    if (list.length) return list[Math.floor(random() * list.length)];
  }
  return null;
}
// 新題：抽到已經學過（而且還沒到期）的知識點就再抽幾次，讓主線一直帶來新東西
const NEW_TRIES = 4;
function preferNew(draw: (stageIdx?: number) => Question) {
  return (stageIdx?: number) => {
    const { knowledge } = save();
    let q = draw(stageIdx);
    for (let i = 0; i < NEW_TRIES && isLearned(knowledge[knowledgeKey(q)]); i++) q = draw(stageIdx);
    return q;
  };
}
// 新手引導（前置區域）：P-4 第一次技能、P-5 菁英打倒後第一次召喚（docs/STORY.md v1.6）
export const ONBOARD_SKILL_STAGE = 3;
export const ONBOARD_SUMMON_STAGE = 4;

// 跨日複習答對一次＝封印能量 +1，另外送金幣
export const RUNE_GOLD = 15;

// 從存檔組出隊伍的成長資料（英雄品階與等級、主角等級／轉職／裝備）
// 出戰前預覽目前隊伍（算戰力用），和開始關卡時組出的隊伍相同
export function previewParty(): Member[] {
  const { upgrades, party: ids, character, heroes } = save();
  return buildParty(ids, heroes, character, playerStats({ upgrades }), partyOptions());
}

// 程度測驗跳級、還沒通過區域試煉：在推薦區域（含之後）戰鬥時，主角和英雄至少以該區最低推薦等級計算（臨時戰力，不改存檔等級）
export function placementFloor(regionIdx: number | undefined): number {
  const p = save().placement;
  if (!p || p.verified || regionIdx === undefined || regionIdx < p.region || p.region <= 0) return 0;
  return REGION_LEVELS[Math.min(REGION_LEVELS.length - 1, p.region)][0];
}

function partyOptions(regionIdx?: number): PartyOptions {
  const sv = save();
  const floor = placementFloor(regionIdx);
  return {
    tiers: sv.heroTier,
    stars: sv.heroStars,
    heroLevels: floor ? Object.fromEntries(sv.heroes.map(id => [id, Math.max(floor, sv.heroLevel[id] ?? 1)])) : sv.heroLevel,
    trueName: sv.trueName,
    growth: {
      level: Math.max(floor, sv.player.level),
      classPath: sv.player.classPath,
      equipped: Object.values(sv.equipped).map(uid => sv.equipment.find(e => e.uid === uid)).filter(e => e !== undefined),
    },
    weapons: sv.weapons,
  };
}

// 主角升級：用新能力重算，保留已受的傷害
function refreshPlayer(party: Member[]): Member[] {
  return party.map(m => {
    if (m.id !== 'player') return m;
    const fresh = buildMember('player', save().character, playerStats({ upgrades: save().upgrades }), partyOptions(useBattleStore.getState().levelIdx));
    return { ...fresh, hp: Math.max(0, Math.min(fresh.maxHp, m.hp + (fresh.maxHp - m.maxHp))), energy: m.energy };
  });
}

const mergeDrops = (a: Record<string, number>, b: Record<string, number>) => {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = (out[k] ?? 0) + v;
  return out;
};

// 被動天賦：這位隊員有這個天賦時回傳數值，否則 0
const talentOf = (m: Member | undefined, id: TalentId) => (m && m.talent === id ? talentValue(id, m.skillPower) : 0);
// 不死鳥之羽：每關每位隊員最多發動一次
const rebirthUsed = new Set<string>();
// 能量泉源：出戰時技能能量先有幾點
const withSpring = (party: Member[]) => party.map(m => ({ ...m, energy: Math.min(m.energyMax, m.energy + Math.round(talentOf(m, 'energySpring'))) }));

const bossSkillState = (bossSkill: BossSkillId | null) => ({
  bossSkill, bossCast: null, frostLeft: 0, blind: false, mirageLeft: 0, mirageStreak: 0, stunned: null,
  staticStacks: 0, bombLeft: 0, sealed: bossSkill === 'seal', sealTarget: null as MemberId | null, sealHits: 0, foeSkill: null as FoeSkillId | null,
  mods: [] as ModState[], modChoice: null,
});

// 首領模組的環境：這一區（這一關開放的題型）有哪些題型、哪些文法考點
let modEnv: ModContext = { skills: [], grammarTags: [], rand: () => random() };
function buildModEnv(levelKey: string, levelIdx: number, stageIdx: number) {
  const types = allowedTypes(levelIdx, stageIdx, levelKey);
  const pool = getPool(levelKey);
  const all = [...pool.normal, ...pool.boss].filter(q => !types || types.includes(q.type));
  modEnv = {
    skills: [...new Set(all.map(questionSkill))],
    grammarTags: [...new Set(all.map(primaryGrammar).filter((g): g is string => !!g))],
    rand: () => random(),
  };
  return all;
}
let modPool: Question[] = [];
// 模組指定題型或文法考點時，下一題從這一區的題庫挑符合的
function pickPreferred(pref: { skill?: QuestionSkill; tag?: string }, exclude: Question | null): Question | null {
  const fit = modPool.filter(q => q !== exclude && (pref.tag ? primaryGrammar(q) === pref.tag : questionSkill(q) === pref.skill));
  return fit.length ? fit[Math.floor(random() * fit.length)] : null;
}
let castSeq = 0;
const cast = (text: string) => ({ seq: ++castSeq, text });

const withTotals = (party: Member[]) => {
  const { hp, maxHp } = partyHp(party);
  return { party, playerHp: hp, playerMaxHp: maxHp };
};

export const useBattleStore = create<BattleState>()((set, get) => {
  const prepare = (q: Question) => shuffleChoice(questionTransform(q), random);

  // 新題目的計時：基礎 20 秒，專注技能每題再多 5 秒；長口說題（>6 詞）依詞數彈性延長，避免長句朗讀超時
  const freshTimer = (focusMs: number, aidMs = get().aidTimeMs, q?: Question) => {
    let voiceBonusMs = 0;
    if (q?.type === 'voice' && q.speak) {
      const wordCount = q.speak.trim().split(/\s+/).length;
      if (wordCount > 6) {
        voiceBonusMs = Math.min(15000, (wordCount - 6) * 1500);
      }
    }
    const limit = QUESTION_LIMIT + focusMs + teamTimeBonus(get().party) + aidMs + voiceBonusMs;
    return { questionLimit: limit, questionLeft: limit, activeAnswerMs: 0, overtime: false };
  };

  const loadStage = (stageIdx: number, isFirst = false) => {
    const s = get();
    rebirthUsed.clear();
    const golden = s.mode === 'golden';
    if (golden) decks = goldenDecks![goldenTier(stageIdx)];
    else if (s.mode === 'normal') save().setLevelProgress(s.levelKey, stageIdx);
    const stage = s.mode === 'normal' ? withRevenge(s.stages[stageIdx], stageIdx, s.levelIdx) : s.stages[stageIdx];
    const stages = s.stages.map((st, i) => (i === stageIdx ? stage : st));
    // 首領戰（一般模式）：魔王祝福＋各自的技能（沒有統一的護盾）；一般關連續 NORMAL_WAVES 隻怪物（新手前幾關少一點）。
    // 這些規則說明會停住計時，等玩家點一下（blocking），不然一閃而過看不懂
    const isFinalBoss = stage.kind === 'final' || (stageIdx === s.stages.length - 1 && stage.kind !== 'gate');
    const bossFight = s.mode === 'normal' && stage.bossMode && !stage.revenge;
    const waves = s.mode === 'normal' && !stage.bossMode && !stage.revenge && !stage.kind ? startWaves(s.levelIdx, stageIdx, NORMAL_WAVES, s.levelKey) : 1;
    const fails = s.mode === 'normal' ? stageFails.get(failKey(s.levelKey, stageIdx)) ?? 0 : 0;
    const blessed = bossFight || (fails > 0 && random() < blessingChance(fails));
    const aid = retryAid(fails, bossFight);
    const aidRevive = aid.revive, aidGuard = aid.damage;
    const aidText = [aid.energy && '開場技能能量至少50%＋守護護盾', aid.timeMs > 0 && '思考時間＋2秒', aidRevive && '全滅時復活一次', aidGuard < 1 && `承受傷害 −${Math.round((1 - aidGuard) * 100)}%`].filter(Boolean).join('、');
    // 小 BOSS、大 BOSS 與菁英怪各帶一招共用技能（A2+ 開始，新手區不加難度）
    // 菁英怪帶一招共用技能（A2+ 開始）；首領改用機制模組（第八輪）
    const foe = s.mode === 'normal' && s.levelIdx >= 2 && !stage.revenge && stage.kind === 'elite' ? foeSkillFor(stageIdx) : null;
    const role: ModRole = isFinalBoss ? 'final' : stageInMap(stageIdx) === MAP_SIZE ? 'boss' : 'gate';
    // 沉默君王的全知封印就是技能封印，不再另外疊一個 M11
    const modIds = bossFight && !isPrologue(s.levelKey) ? modsFor(s.levelIdx, mapIndexOf(stageIdx), role).filter(id => !(isFinalBoss && bossSkillFor(s.levelIdx).id === 'seal' && id === 'M11')) : [];
    modPool = bossFight ? buildModEnv(s.levelKey, s.levelIdx, stageIdx) : [];
    const started = startMods(modIds, s.levelIdx, modEnv);
    const modText = modIds.map(id => `${MOD_DEFS[id].icon} ${MOD_DEFS[id].name}（${MOD_DEFS[id].trigger}）：${MOD_DEFS[id].counter}`).join('｜');
    if (bossFight && isFinalBoss) {
      const def = bossSkillFor(s.levelIdx);
      useUiStore.getState().celebrate({
        icon: def.icon, title: `區域魔王：${def.boss}`,
        sub: `${def.name}：${def.desc}｜破解：${def.id === 'seal' && aid.sealTotal === 8 ? def.counter.replace('10 題', '8 題') : def.counter}${modText ? `｜${modText}` : ''}｜魔王祝福：答錯 combo 只扣 30%${aidText ? `｜女神援助：${aidText}` : ''}`, color: '#ff8a8a', blocking: true,
      });
    } else if (bossFight) {
      const big = stageInMap(stageIdx) === 20;
      useUiStore.getState().celebrate({
        icon: big ? '👑' : '⚔️', title: isPrologue(s.levelKey) ? stage.name : big ? '關卡大 BOSS' : '小 BOSS',
        sub: `${modText ? `${modText}｜` : ''}魔王祝福：答錯 combo 只扣 30%${aidText ? `｜女神援助：${aidText}` : ''}`, color: '#ff8a8a', blocking: true,
      });
    } else if (blessed) {
      useUiStore.getState().celebrate({ icon: '✨', title: '女神的祝福', sub: `這一關答錯不會中斷 combo（只扣 30%），全隊傷害 +20%${aidText ? `，${aidText}` : ''}`, color: '#7fe8ff', blocking: true });
    }
    // 復仇魔王：每答對一題扣固定血量，要把到期的錯題全部答對才會倒下
    const maxHp = stage.revenge
      ? stage.questions.length * BASE_DAMAGE * 2
      : stage.kind === 'treasure'
        ? Math.round(BASE_DAMAGE * TREASURE_HITS * monsterGrowth(stageIdx, s.levelIdx))
        : golden ? goldenMonsterHp(stageIdx, stage)
        : s.mode === 'skill' ? Math.round(BASE_DAMAGE * SKILL_BOSS_HITS * monsterGrowth(25, s.levelIdx))
        : stage.bossMode ? bossMaxHp(stageIdx, s.levelIdx, isFinalBoss ? 'final' : stageInMap(stageIdx) === 20 ? 'boss' : 'gate')
        : stage.kind === 'elite' ? Math.round(monsterMaxHp(stageIdx, s.levelIdx, false, 'elite') * ELITE_HP_MULT)
        : waveMaxHp(stageIdx, s.levelIdx);
    // 區段開頭，或從中途繼續時，先預習這一段的內容
    const showLesson = !golden && s.mode !== 'skill' && (stageIdx % SEGMENT_SIZE === 0 || isFirst) && save().settings.showLessons;
    // 新地圖：combo 與戰績重新計算（combo 只在同一張地圖內延續）
    const newMap = isFirst || (!golden && stageIdx % MAP_SIZE === 0);
    // 每第 5 題是困難題：剛好輪到這一關的第一題時也要出（之後再出這關準備好的題目）
    const questionCount = s.questionCount + 1;
    const isBossQuestion = !stage.revenge && stage.kind !== 'treasure' && questionCount % BOSS_QUESTION_EVERY === 0;
    const original = isBossQuestion ? (s.mode === 'skill' ? decks!.boss() : pickBossQuestion(null, s.levelIdx, s.mode === 'normal' ? stageIdx : undefined, s.levelKey)) : takeEasy(stage) ?? stage.questions[0];

    // 劇情檢查提前：若有開場或 BOSS 登場台詞，先開啟劇情視窗，避免戰前情報搶先顯示或唸出發音
    let pendingStoryId = '';
    if (s.mode === 'normal' && isPrologue(s.levelKey)) {
      const storyId = PROLOGUE_STORY_AT[stageIdx];
      if (storyId && !save().storySeen.includes(storyId)) pendingStoryId = storyId;
    } else if (s.mode === 'normal') {
      const inMap = stageInMap(stageIdx);
      const part = inMap === 1 ? 'intro' : inMap === 15 ? 'mini' : inMap === 20 ? 'big' : null;
      const storyId = isFinalBoss ? bossStoryId(s.levelIdx) : part ? mapStoryId(s.levelIdx, mapIndexOf(stageIdx), part) : '';
      if (storyId && STORIES[storyId] && !save().storySeen.includes(storyId)) pendingStoryId = storyId;
    }
    if (pendingStoryId) useUiStore.getState().openStory(pendingStoryId);

    set({
      ...(newMap ? { combo: 0, skillCombo: 0, skillWindow: 0, skillWindowGain: 0, runAnswers: 0, streak: 0, mapStats: emptyRunStats(), mapResult: null } : {}),
      stages,
      stageIdx,
      qIdx: isBossQuestion ? -1 : 0,
      original,
      question: prepare(original),
      questionSeq: s.questionSeq + 1,
      questionCount,
      isBossQuestion,
      typed: '',
      retrying: false,
      monsterHp: maxHp,
      monsterMaxHp: maxHp,
      monsterElement: s.mode === 'skill' ? skillBossDef(s.skillBoss!)!.element
        : monsterElement(stageIdx, golden ? goldenTier(stageIdx) : s.levelIdx, stage.revenge || stage.kind === 'final'),
      monsterShield: stage.kind === 'elite' ? ELITE_SHIELD : 0,
      stageHits: 0,
      wave: 1, waves, bossFight, blessed, aidRevive, aidGuard, enemyTurn: 0,
      aidTimeMs: aid.timeMs, aidReviveRatio: aid.reviveRatio, aidSealTotal: aid.sealTotal,
      ...(aid.guard ? { shield: true, comboGuard: true } : {}),
      ...(aid.energy ? { party: s.party.map(m => ({ ...m, energy: Math.max(m.energy, Math.ceil(m.energyMax * .5)) })) } : {}),
      // 最低答題數：寶箱怪、復仇魔王、黃金之路與擴充魔王不限
      isReplayStage: !!save().firstClearXpClaimed[`${s.levelKey}:${stageIdx}`],
      stageAnswers: 0, stageSubmissions: 0, executing: false, bonusLeft: 0, bonusRound: false, bonusReturn: null,
      minAnswers: s.mode === 'normal' && !stage.revenge && stage.kind !== 'treasure' ? minAnswers(s.levelIdx, stageIdx, s.levelKey) : 0,
      monsterKind: monsterKindFor(stageIdx, stage.bossMode, !!stage.revenge, stage.kind === 'treasure', stage.kind === 'final'),
      // 一般關 5 隻怪共用行動條：只有換關才歸零
      enemyGauge: 0, enemyMoveIdx: 0, poison: [], weakenLeft: 0, weaken: 0, slowNext: 0,
      ...bossSkillState(s.mode === 'normal' && stage.bossMode && isFinalBoss && !stage.revenge ? bossSkillFor(s.levelIdx).id : null),
      ...(foe ? { foeSkill: foe.id, bossCast: cast(`${foe.icon} ${foe.name}：${foe.desc}`) } : {}),
      ...(modIds.length ? { mods: started.mods, sealed: modSealed(started.mods) || (isFinalBoss && bossSkillFor(s.levelIdx).id === 'seal') } : {}),
      ...(started.casts.length ? { bossCast: cast(started.casts.join('｜')) } : {}),
      treasureLeft: stage.kind === 'treasure' ? TREASURE_TIME : 0,
      phase: showLesson ? 'lesson' : 'answering',
      feedback: null,
      wordEvolution: null,
      assist: null,
      assistSource: null,
      focusMs: 0,
      ...freshTimer(foe?.id === 'timeThief' ? -TIME_THIEF_MS : 0, aid.timeMs, original),
      casting: null,
      event: nextEvent('stage'),
    });
    // 技能封印只封隊長一個人
    if (get().sealed && !get().sealTarget) set({ sealTarget: get().party[Math.max(0, leaderIndex(get().party))]?.id ?? null });
    // 前置區域 P-4：第一次技能——隊長的能量直接集滿，配合技能提示讓玩家試一次
    if (s.mode === 'normal' && isPrologue(s.levelKey) && stageIdx === ONBOARD_SKILL_STAGE && !save().hintsSeen.includes('skill')) {
      const party = get().party;
      const lead = Math.max(0, leaderIndex(party));
      set({ party: party.map((m, i) => (i === lead ? { ...m, energy: m.energyMax } : m)) });
    }
  };

  // 區域最終魔王：每出一題更新技能狀態，輪到時發動技能
  const bossTurn = (turn: number): Partial<BattleState> & { frostLeft: number } => {
    const s = get();
    const left = {
      frostLeft: Math.max(0, s.frostLeft - 1), blind: false, mirageLeft: Math.max(0, s.mirageLeft - 1),
      stunned: s.stunned && s.stunned.left > 1 ? { ...s.stunned, left: s.stunned.left - 1 } : null,
    };
    // 終結連擊中首領已經倒地：不再發動技能（例如樹精不會又長回血）
    if (!s.bossSkill || s.executing) return left;
    const def = bossSkillFor(s.levelIdx);
    if (!def.every || turn % def.every !== 0) return left;
    const head = `${def.icon} ${def.boss}發動「${def.name}」`;
    switch (s.bossSkill) {
      case 'regrow':
        if (s.streak >= REGROW_BLOCK_COMBO) return { ...left, bossCast: cast(`${head}，但被連續答對的火焰燒掉了！`) };
        return { ...left, monsterHp: Math.min(s.monsterMaxHp, s.monsterHp + Math.round(s.monsterMaxHp * REGROW_HEAL)), bossCast: cast(`${head}：回復 10% 生命`) };
      case 'blind':
        return { ...left, blind: true, bossCast: cast(`${head}：看不到題目，仔細聽！`) };
      case 'tsunami':
        if (s.shield) return { ...left, bossCast: cast(`${head}，被護盾擋下了！`) };
        return { ...left, party: s.party.map(m => ({ ...m, energy: 0 })), bossCast: cast(`${head}：全隊技能能量被沖走`) };
      case 'mirage':
        return { ...left, mirageLeft: MIRAGE_QUESTIONS, mirageStreak: 0, bossCast: cast(`${head}：接下來答錯會受到雙倍傷害`) };
      case 'quake': {
        const alive = s.party.filter(isAlive);
        if (alive.length < 2) return left;
        const target = alive[Math.floor(random() * alive.length)];
        return { ...left, stunned: { member: target.id, left: QUAKE_QUESTIONS }, bossCast: cast(`${head}：${target.name} 被震飛了！`) };
      }
      case 'frost':
        if (s.streak >= FROST_BLOCK_COMBO) return { ...left, bossCast: cast(`${head}，被連續答對的熱能抵消了！`) };
        return { ...left, frostLeft: FROST_QUESTIONS, bossCast: cast(`${head}：答題時間只剩 ${FROST_LIMIT / 1000} 秒`) };
      case 'bomb':
        // 限時追擊（M06）蓄力中不丟炸彈：兩個倒數不同時進行
        if (isActive(s.mods, 'M06')) return left;
        return { ...left, bombLeft: BOMB_QUESTIONS, bossCast: cast(`${head}：${BOMB_QUESTIONS} 題內不能答錯！`) };
      default:
        return left;
    }
  };

  // 下一題：每第 5 題是困難題（復仇魔王、寶箱怪不另外出）；
  // 其他時候先出這一關準備好的題目，出完再從題庫繼續抽
  const nextQuestion = () => {
    const s = get();
    const stage = s.stages[s.stageIdx];
    const questionCount = s.questionCount + 1;
    const isBossQuestion = !stage.revenge && stage.kind !== 'treasure' && questionCount % BOSS_QUESTION_EVERY === 0;
    let qIdx = s.qIdx;
    let original: Question;
    if (isBossQuestion) {
      original = s.mode === 'skill' ? decks!.boss() : pickBossQuestion(s.original, s.levelIdx, s.mode === 'normal' ? s.stageIdx : undefined, s.levelKey);
    } else {
      qIdx += 1;
      const pref = s.mode === 'normal' && !s.executing ? modPreference(s.mods) : null;
      const wanted = pref ? pickPreferred(pref, s.original) : null;
      const repeat = wanted ?? (s.mode === 'normal' && !stage.revenge && stage.kind !== 'treasure' ? pickDueReview(s.original, allowedTypes(s.levelIdx, s.stageIdx, s.levelKey)) : null);
      original = repeat ?? takeEasy(stage)
        ?? (qIdx < stage.questions.length ? stage.questions[qIdx] : (stage.bossMode ? decks!.boss(s.stageIdx) : decks!.normal(s.stageIdx)));
    }
    const enemyTurn = s.enemyTurn + 1;
    const statuses = tickStatuses();
    const boss = bossTurn(enemyTurn);
    const timer = freshTimer(s.focusMs - (s.foeSkill === 'timeThief' ? TIME_THIEF_MS : 0), s.aidTimeMs, original);
    return {
      qIdx, original, question: prepare(original), questionSeq: s.questionSeq + 1, questionCount, isBossQuestion,
      retrying: false, ...timer,
      ...(boss.frostLeft > 0 ? { questionLimit: FROST_LIMIT + s.aidTimeMs, questionLeft: FROST_LIMIT + s.aidTimeMs } : {}),
      // 減速：這一題少幾秒（最少留 6 秒）
      ...(s.slowNext > 0 ? { questionLimit: Math.max(6000 + s.aidTimeMs, timer.questionLimit - s.slowNext), questionLeft: Math.max(6000 + s.aidTimeMs, timer.questionLimit - s.slowNext), slowNext: 0 } : {}),
      enemyTurn, ...statuses,
      ...boss,
    };
  };

  // 敵人攻擊隨機一位站著的隊員；全滅則戰敗
  const enemyStrike = (party: Member[], mult = 1) => {
    const s = get();
    const alive = party.map((m, i) => (isAlive(m) ? i : -1)).filter(i => i >= 0);
    // 戰士挑釁：站著的戰士有機會替隊友擋下這一擊，而且受到的傷害較少
    const warriors = alive.filter(i => party[i].classId === 'warrior');
    const taunt = warriors.length > 0 && alive.length > 1 && random() < TAUNT_CHANCE;
    const target = taunt ? warriors[0] : alive[Math.floor(random() * alive.length)];
    const stage = s.stages[s.stageIdx];
    const baseDamage = s.mode === 'skill' ? monsterAttack(true, s.levelIdx, 25)
      : monsterAttack(stage.bossMode, s.levelIdx, s.stageIdx, foeKindOf(stage, s.stageIdx, s.stages.length));
    // 鋼鐵意志：有機率傷害減半
    const iron = random() < talentOf(party[target], 'ironWill') ? 0.5 : 1;
    const damage = Math.round((taunt ? baseDamage * (1 - TAUNT_REDUCTION) : baseDamage) * mult * iron * s.aidGuard * prologueGuard(s.levelKey, s.stageIdx));
    let hurt = party.map((m, i) => (i === target ? { ...m, hp: Math.max(0, m.hp - damage) } : m));
    // 不死鳥之羽：倒下時有機率以 30% 生命站起來（每關一次）
    const victim = hurt[target];
    if (!isAlive(victim) && !rebirthUsed.has(victim.id) && random() < talentOf(victim, 'rebirth')) {
      rebirthUsed.add(victim.id);
      hurt = hurt.map((m, i) => (i === target ? { ...m, hp: Math.round(m.maxHp * 0.3) } : m));
    }
    const wiped = hurt.every(m => !isAlive(m));
    const knockedOut = isAlive(party[target]) && !isAlive(hurt[target]);
    const attackerIdx = isAlive(hurt[s.attackerIdx] ?? hurt[0]) ? s.attackerIdx : nextAlive(hurt, s.attackerIdx);
    return {
      ...withTotals(hurt),
      attackerIdx: Math.max(0, attackerIdx),
      wiped,
      mapStats: { ...s.mapStats, knockouts: s.mapStats.knockouts + (knockedOut ? 1 : 0) },
      event: nextEvent('hurt', { amount: damage, member: party[target].id, taunt }),
    };
  };

  // ---------- 敵人攻擊模式 ----------
  // 行動條是否運作：一般模式、A2+、會攻擊的怪物（寶箱怪不攻擊）
  // 區域最終魔王用專屬的攻擊模式，其他依怪物種類
  const patternFor = (s: BattleState) => patternOf(s);
  // 新手關（A1 1-1～1-10）行動條關閉、之後慢慢加速；終結連擊中首領倒地，不會出招
  const gaugeActive = (s: BattleState) => s.mode === 'normal' && !!patternFor(s) && s.stages[s.stageIdx]?.kind !== 'treasure'
    && !s.executing && gaugeScale(s.levelIdx, s.stageIdx, s.levelKey) > 0;

  // 每出一題：中毒扣血（不會扣到倒下）、虛弱倒數
  const tickStatuses = (): Partial<BattleState> => {
    const s = get();
    if (!s.poison.length && !s.weakenLeft) return {};
    let party = s.party;
    for (const p of s.poison) party = party.map(m => (m.id === p.member && isAlive(m) ? { ...m, hp: Math.max(1, m.hp - p.dmg) } : m));
    return {
      ...withTotals(party),
      poison: s.poison.map(p => ({ ...p, left: p.left - 1 })).filter(p => p.left > 0),
      weakenLeft: Math.max(0, s.weakenLeft - 1),
    };
  };

  // 敵人出一招：依招式打一人、連擊或全體，附帶吸血、中毒、減速、虛弱、吸能量
  const performMove = (move: EnemyMove) => {
    const s = get();
    const stage = s.stages[s.stageIdx];
    const base = monsterAttack(stage.bossMode, s.levelIdx, s.stageIdx, foeKindOf(stage, s.stageIdx, s.stages.length)) * (stage.kind === 'elite' ? ELITE_POWER : 1) * prologueGuard(s.levelKey, s.stageIdx);
    // 護盾擋下這一招（不分單體或全體）
    if (s.shield) {
      set({ shield: false, enemyGauge: 0, enemyMoveIdx: s.enemyMoveIdx + 1, event: nextEvent('shield') });
      return;
    }
    let party = s.party;
    const hits: { member: MemberId; amount: number }[] = [];
    const alive = () => party.map((m, i) => (isAlive(m) ? i : -1)).filter(i => i >= 0);
    const hitOne = (idx: number, mult: number) => {
      const target = party[idx];
      const iron = random() < talentOf(target, 'ironWill') ? 0.5 : 1;
      const amount = Math.max(1, Math.round(base * mult * iron * s.aidGuard));
      party = party.map((m, i) => (i === idx ? { ...m, hp: Math.max(0, m.hp - amount) } : m));
      hits.push({ member: target.id, amount });
    };
    const targets = alive();
    if (!targets.length) return;
    if (move.kind === 'aoe') targets.forEach(i => hitOne(i, move.power));
    else if (move.kind === 'multi') {
      for (let k = 0; k < (move.hits ?? 2); k++) {
        const t = alive();
        if (t.length) hitOne(t[Math.floor(random() * t.length)], move.power);
      }
    } else {
      // 單體：戰士有機會挑釁、替隊友擋下
      const warriors = targets.filter(i => party[i].classId === 'warrior');
      const taunt = warriors.length > 0 && targets.length > 1 && random() < TAUNT_CHANCE;
      hitOne(taunt ? warriors[0] : targets[Math.floor(random() * targets.length)], move.power * (taunt ? 1 - TAUNT_REDUCTION : 1));
    }
    const hitIds = [...new Set(hits.map(h => h.member))];
    if (move.sapEnergy) party = party.map(m => (hitIds.includes(m.id) ? { ...m, energy: Math.max(0, m.energy - move.sapEnergy!) } : m));
    const poison = move.poison
      ? [...s.poison.filter(p => !hitIds.includes(p.member)),
        ...hitIds.map(id => ({ member: id, left: POISON_TURNS, dmg: Math.max(1, Math.round((party.find(m => m.id === id)?.maxHp ?? 0) * move.poison!)) }))]
      : s.poison;
    const knockouts = party.filter((m, i) => isAlive(s.party[i]) && !isAlive(m)).length;
    const rescued = party.every(m => !isAlive(m)) && s.aidRevive;
    if (rescued) party = reviveAll(party, s.aidReviveRatio);
    const wiped = party.every(m => !isAlive(m));
    const attackerIdx = isAlive(party[s.attackerIdx] ?? party[0]) ? s.attackerIdx : Math.max(0, nextAlive(party, s.attackerIdx));
    set({
      ...withTotals(party), attackerIdx, poison,
      monsterHp: move.drain ? Math.min(s.monsterMaxHp, s.monsterHp + Math.round(s.monsterMaxHp * move.drain)) : s.monsterHp,
      ...(move.slow ? { slowNext: move.slow } : {}),
      ...(move.weaken ? { weakenLeft: WEAKEN_TURNS, weaken: move.weaken } : {}),
      enemyGauge: 0, enemyMoveIdx: s.enemyMoveIdx + 1,
      mapStats: { ...s.mapStats, knockouts: s.mapStats.knockouts + knockouts },
      event: nextEvent('enemyMove', { move: { icon: move.icon, name: move.name, hits } }),
      ...(rescued ? { aidRevive: false, bossCast: cast(REVIVE_TEXT) } : {}),
      ...(wiped ? { phase: 'gameOver' as const } : {}),
    });
    if (wiped) {
      const key = failKey(s.levelKey, s.stageIdx);
      stageFails.set(key, (stageFails.get(key) ?? 0) + 1);
    }
  };

  // 下一招（給畫面預告用）
  const nextMove = (s: BattleState) => {
    const pattern = patternFor(s);
    return pattern ? pattern.moves[s.enemyMoveIdx % pattern.moves.length] : null;
  };

  const earn = (amount: number, streak: number) => {
    const comboBonus = Math.min(1, Math.floor(streak / COMBO_GOLD_STEP) * 0.1);
    const gold = goldWithBonus(Math.round(amount * (1 + comboBonus)), get().stats);
    save().addGold(gold);
    return gold;
  };

  // 怪物倒下（或寶箱逃走）後進入下一階段
  const finishStage = (patch: Partial<BattleState>) => {
    const s = get();
    const stage = s.stages[s.stageIdx];
    const isLastStage = s.stageIdx + 1 >= s.stages.length;
    // 黃金之路：沒有星星與進度；打倒沉默魔王就是特殊結局
    if (s.mode === 'golden') {
      if (isLastStage) {
        save().recordGolden(GOLDEN_STAGE_COUNT);
        if (save().addTitle(GOLDEN_TITLE)) save().addTickets(GOLDEN_CLEAR_TICKETS);
        set({ ...patch, phase: 'levelClear' });
      } else {
        save().recordGolden(s.stageIdx + 1);
        set({ ...patch, phase: 'monsterDown' });
      }
      return;
    }
    // 擴充魔王：第一次擊敗得到稱號與召喚券
    if (s.mode === 'skill') {
      const def = skillBossDef(s.skillBoss!)!;
      if (save().recordSkillBoss(def.id)) {
        save().addTitle(def.title);
        save().addTickets(SKILL_BOSS_FIRST_TICKETS);
      }
      set({ ...patch, phase: 'levelClear' });
      return;
    }
    // 前置區域：沒有三星與轉盤；打倒追獵隊長就完成，之後「踏上征途」前往翠綠草原
    if (isPrologue(s.levelKey)) {
      if (isLastStage) {
        save().finishPrologue();
        save().setLevelProgress(s.levelKey, 0);
        set({ ...patch, phase: 'levelClear' });
      } else set({ ...patch, phase: stage.bossMode ? 'summary' : 'monsterDown' });
      return;
    }
    if (s.mode === 'normal') {
      const award = save().claimStageXp(s.levelIdx, s.stageIdx);
      if (award.xp) {
        patch = { ...patch, runXp: (patch.runXp ?? s.runXp) + award.xp };
        if (award.levels > 0) {
          patch = { ...patch, ...withTotals(refreshPlayer(patch.party ?? s.party)) };
          celebrateLevelUp(save().player.level);
        }
      }
    }
    if (s.mode === 'normal' && !isLastStage) save().recordMapStage(mapKey(s.levelKey, mapIndexOf(s.stageIdx)), s.stageIdx % MAP_SIZE);
    // 獎勵轉盤：每張地圖第一次破第 5、10、15、20 關各轉一次
    if (s.mode === 'normal' && WHEEL_CHECKPOINTS.includes(stageInMap(s.stageIdx)) && save().grantWheel(wheelKey(s.levelKey, s.stageIdx))) useUiStore.getState().setWheelHidden(false);
    // 打完一張地圖（第 20 關）：播這張地圖的通關劇情
    if (s.mode === 'normal' && stageInMap(s.stageIdx) === MAP_SIZE) {
      const storyId = mapStoryId(s.levelIdx, mapIndexOf(s.stageIdx), 'clear');
      if (STORIES[storyId] && !save().storySeen.includes(storyId)) useUiStore.getState().openStory(storyId);
    }
    // 三星關卡的第 20 關（大 BOSS）或區域最終魔王：三星評價（第 15 關的小 BOSS 不結算）
    if (stageInMap(s.stageIdx) === MAP_SIZE || isLastStage) {
      const merged = { ...s, ...patch };
      const earlyFinish = (patch.bonusLeft ?? s.bonusLeft ?? 0) > 0;
      const stats = { ...merged.mapStats, hpRatio: merged.playerHp / Math.max(1, merged.playerMaxHp), earlyFinish };
      const stars = evaluateStars(s.levelIdx, stats);
      const mapIdx = mapIndexOf(s.stageIdx);
      const gained = save().recordMapStars(mapKey(s.levelKey, mapIdx), stars);
      patch = { ...patch, mapStats: stats, mapResult: { mapIdx, stars, gained } };
      if (gained > 0 && stars.every(Boolean)) {
        useUiStore.getState().celebrate({ icon: '⭐', title: '三星通關！', sub: `「${regionOf(s.levelKey).maps[mapIdx] ?? ''}」全部條件達成`, color: '#ffcd4b' });
      }
    }
    if (isLastStage) {
      // 打倒區域魔王；要開下一區還得完成守門人封印＋區域試煉（題庫還沒出的區域、最後一區不用）
      save().defeatRegionBoss(s.levelIdx);
      if (!needsSeal(s.levelIdx)) save().unlockLevel(s.levelIdx + 1);
      save().setLevelProgress(s.levelKey, 0); // 全區通關，下次從第 1 關重玩
      set({ ...patch, phase: 'levelClear' });
      return;
    }
    set({ ...patch, phase: stage.bossMode ? 'summary' : 'monsterDown' });
  };

  // 首領模組：作答後推進（先把新的模組狀態存起來，下一題才知道要指定什麼題型）
  const progressMods = (s: BattleState, correct: boolean, b: { streak: number; elapsed: number; hpRatio: number; answers: number; executing: boolean }) => {
    const q = s.original!;
    const r = afterAnswer(s.mods, {
      correct, skill: questionSkill(q), grammar: primaryGrammar(q), streak: b.streak,
      fast: correct && b.elapsed <= (CHASE_FAST_MS[q.type] ?? 8000),
    }, { hpRatio: b.hpRatio, answers: b.answers, executing: b.executing, levelIdx: s.levelIdx, charging: s.bombLeft > 0 }, modEnv, grammarName);
    set({ mods: r.mods, ...(r.fx.choice ? { modChoice: r.fx.choice } : {}), ...(b.executing ? { modChoice: null } : {}) });
    return { ...r.fx, mods: r.mods };
  };
  // 把模組的結果併進這一題的狀態：下一擊倍率取高的、技能封印、首領宣告
  const withModFx = (patch: Partial<BattleState>, fx: (ModEffects & { mods: ModState[] }) | null): Partial<BattleState> => {
    if (!fx) return patch;
    const s = get();
    const texts = [patch.bossCast?.text, ...fx.casts].filter(Boolean);
    return {
      ...patch,
      mods: fx.mods,
      ...(fx.charge > 1 ? { charge: Math.max(patch.charge ?? 1, fx.charge) } : {}),
      ...(s.bossSkill !== 'seal' ? { sealed: modSealed(fx.mods) } : {}),
      ...(texts.length ? { bossCast: cast(texts.join('｜')) } : {}),
    };
  };

  // 魔王技能：答對時的破解與倒數
  const nextAttacker = (party: Member[], from: number) => {
    const stunned = get().stunned?.member;
    const idx = Math.max(0, nextAlive(party, from));
    if (party[idx]?.id !== stunned) return idx;
    const after = nextAlive(party, idx + 1);
    return after >= 0 && after !== idx ? after : idx;
  };

  // streak：真的連續答對幾題（首領技能的破解看這個，困難題 Bonus 的倍數不算）
  const bossOnCorrect = (streak: number, chained: boolean): Partial<BattleState> => {
    const s = get();
    if (!s.bossSkill) return {};
    const patch: Partial<BattleState> = { staticStacks: 0 };
    const def = bossSkillFor(s.levelIdx);
    if (s.blind) Object.assign(patch, { charge: 2, bossCast: cast(`${def.icon} 聽懂了！${def.boss}破防，下一擊 ×2`) });
    if (s.mirageLeft > 0) {
      const streak = s.mirageStreak + 1;
      Object.assign(patch, streak >= 2 ? { mirageLeft: 0, mirageStreak: 0, bossCast: cast('🏜️ 看破分身！') } : { mirageStreak: streak });
    }
    if (s.bombLeft > 0) {
      const bombLeft = s.bombLeft - 1;
      Object.assign(patch, { bombLeft }, bombLeft === 0 ? { charge: 3, bossCast: cast('💣 炸彈反丟回去！下一擊 ×3') } : {});
    }
    if (s.stunned && chained) Object.assign(patch, { stunned: null, bossCast: cast('🔗 連攜攻擊把隊友拉回來了！') });
    if (s.bossSkill === 'seal' && s.sealed) {
      const sealHits = s.sealHits + 1;
      Object.assign(patch, streak >= SEAL_BREAK_COMBO || sealHits >= Math.min(SEAL_BREAK_TOTAL, s.aidSealTotal)
        ? { sealed: false, sealHits, charge: 2, bossCast: cast('🔓 封印解除！Fever：下一擊 ×2') }
        : { sealHits });
    }
    return patch;
  };

  // 輸出類天賦的傷害倍率
  const talentDamage = (m: Member, combo: number, boss: boolean) =>
    (1 + (m.hp / Math.max(1, m.maxHp) < 0.3 ? talentOf(m, 'berserk') : 0))
    * (1 + Math.min(1, Math.floor(combo / 10) * talentOf(m, 'resonance')))
    * (1 + (boss ? talentOf(m, 'giantSlayer') : 0));

  // 答對時行動條往後退
  const staggered = (elapsed: number) => Math.max(0, get().enemyGauge - (elapsed <= 3000 ? FAST_STAGGER : STAGGER));

  const onCorrect = () => {
    const s = get();
    if (!s.original || !s.question) return;
    const eligibleLearning = !s.retrying && !s.assist && !s.overtime;
    const previousKnowledge = save().knowledge[knowledgeKey(s.original)];
    const eligibleSubsidy = eligibleLearning && (!previousKnowledge?.wins.length || previousKnowledge.dueAt <= Date.now());
    if (save().recordAnswer(s.original, true, !s.retrying, eligibleLearning) && s.mode !== 'golden') {
      save().addGold(RUNE_GOLD);
      set({ runRunes: s.runRunes + 1 });
    }
    const stage = s.stages[s.stageIdx];
    // 加成題（勝利後自選追擊）：怪物已經倒了，只給經驗與少量金幣，不再結算關卡
    if (s.bonusRound) {
      const gold = Math.min(BONUS_GOLD, Math.max(0, BONUS_GOLD_CAP - s.bonusGold));
      if (gold > 0) save().addGold(gold);
      const xp = Math.round(XP.correct * (isPrologue(s.levelKey) ? PROLOGUE_XP : xpScale(s.levelIdx)));
      const award = save().awardXp(xp, s.mode === 'skill' ? 'skill' : s.isReplayStage ? 'replay' : 'bonus');
      const levels = award.levels;
      if (levels > 0) celebrateLevelUp(save().player.level);
      const levelUp = levels > 0 ? save().player.level : undefined;
      const bonusLeft = s.bonusLeft - 1;
      const patch = {
        combo: s.combo + 1, maxCombo: Math.max(s.maxCombo, s.combo + 1), streak: s.streak + 1,
        typed: '', assist: null, assistSource: null, retrying: false,
        bonusLeft, bonusGold: s.bonusGold + gold, runGold: s.runGold + gold + award.allowanceGold, runXp: s.runXp + award.xp,
        event: nextEvent('attack', { amount: 0, gold, member: s.party[s.attackerIdx]?.id, execution: true, levelUp }),
      };
      if (bonusLeft <= 0) {
        let extraPatch: Partial<BattleState> = {};
        const isMapBoss = stageInMap(s.stageIdx) === MAP_SIZE || (s.stageIdx + 1 >= s.stages.length);
        if (isMapBoss && s.mode === 'normal') {
          const stats = { ...s.mapStats, earlyFinish: false };
          const stars = evaluateStars(s.levelIdx, stats);
          const mapIdx = mapIndexOf(s.stageIdx);
          const gained = save().recordMapStars(mapKey(s.levelKey, mapIdx), stars);
          extraPatch = { mapStats: stats, mapResult: { mapIdx, stars, gained } };
          if (gained > 0 && stars.every(Boolean)) {
            useUiStore.getState().celebrate({ icon: '⭐', title: '三星通關！', sub: `「${regionOf(s.levelKey).maps[mapIdx] ?? ''}」全部條件達成`, color: '#ffcd4b' });
          }
        }
        set({ ...patch, ...extraPatch, bonusRound: false, executing: false, phase: s.bonusReturn ?? 'monsterDown', bonusReturn: null });
      } else set({ ...patch, ...nextQuestion() });
      return;
    }
    // 超過 20 秒才答對：這題不累積 combo
    const elapsed = s.questionLimit - s.questionLeft;
    const speed = s.overtime ? 1 : speedMultiplier(elapsed);

    // 困難題由隊長出手，其他題目隊伍輪流
    // 被大地碎裂震飛的隊員不能出手，輪到他時換下一位
    const attackerIdx = s.isBossQuestion ? Math.max(0, leaderIndex(s.party)) : s.party[s.attackerIdx]?.id === s.stunned?.member ? nextAttacker(s.party, s.attackerIdx + 1) : s.attackerIdx;
    const attacker = s.party[attackerIdx];
    // 靈光一閃：2 秒內答對，combo 額外增加
    const gain = 1 + (elapsed <= 2000 ? Math.round(talentOf(attacker, 'insight')) : 0);
    // 困難題 Bonus：答對時目前的 combo × 隨機倍數（英勇號令保底），再加上這一題
    // 第一次遇到困難題（情境提示還沒看過）固定 ×2，讓新玩家看懂這個玩法；之後照正常機率
    const firstBonus = !save().hintsSeen.includes('boss');
    const bonusMult = s.isBossQuestion && !s.overtime ? (firstBonus ? 2 : rollBossBonus(random, s.bossBoost ? BOSS_BONUS_FLOOR : 1)) : 0;
    // 困難題 Bonus 只乘原生 combo（技能加的不被乘），單次最多 +15 萬；超過 20 秒才答對：這題不累積 combo
    const organic = s.combo - s.skillCombo;
    const lucky = bonusMult ? applyHardBonus(organic, bonusMult) : null;
    const combo = s.overtime ? s.combo : (lucky ? lucky.organic : organic) + s.skillCombo + gain;
    const bonus = bonusMult ? { mult: bonusMult, from: s.combo, to: combo, gain: lucky?.gain ?? 0 } : undefined;
    // 真的連續答對幾題（超時答對不算）：三星與首領技能看這個，不會被 Bonus 一次乘上去
    const streak = s.overtime ? 0 : s.streak + 1;
    const stageAnswers = s.stageAnswers + 1;
    const amplify = s.amplifyLeft > 0;
    // 職業合作：上一位隊員給的接力加成、所有隊員輪過一次的連攜攻擊
    const relayFx = relayFor(s.relay, attacker.id);
    const aliveIds = s.party.filter(isAlive).map(m => m.id);
    const chainStep = advanceChain(s.chain, attacker.id, aliveIds);
    const crit = s.critLeft > 0 || (chainStep.triggered && !!FINISHERS[attacker.classId].crit) || random() < attacker.crit + (relayFx?.crit ?? 0);
    const regionScale = isPrologue(s.levelKey) ? PROLOGUE_XP : xpScale(s.levelIdx);
    // 前置區域 P-1～P-3 先不累積技能能量：一次只教一件事（P-2 combo、P-3 困難題、P-4 技能）
    const skillLocked = s.mode === 'normal' && isPrologue(s.levelKey) && s.stageIdx < ONBOARD_SKILL_STAGE && !save().hintsSeen.includes('skill');
    let party = skillLocked ? s.party : gainEnergy(s.party);
    // 僧侶出手：攻擊之外，全隊回血
    if (attacker.classId === 'monk') {
      const heal = monkHeal(attacker.skillPower);
      party = party.map(m => (isAlive(m) ? { ...m, hp: Math.min(m.maxHp, m.hp + Math.round(m.maxHp * heal)) } : m));
    }
    // 運氣大師：最後 3 秒才答對，有機率技能能量直接集滿
    if (!s.overtime && s.questionLeft <= 3000 && random() < talentOf(attacker, 'luckyStar')) {
      party = party.map((m, i) => (i === attackerIdx ? { ...m, energy: Math.max(m.energy, m.energyMax) } : m));
    }
    save().trackDaily('correct');
    save().trackDaily('combo', combo);
    const eligible = !s.retrying && !s.assist && !s.overtime;
    if (eligible && s.mode === 'normal' && !isPrologue(s.levelKey) && s.stageIdx < s.stages.length - 1) {
      save().recordMapLearning(mapKey(s.levelKey, mapIndexOf(s.stageIdx)), s.original, s.original.type === 'voice' && s.question.type !== 'voice');
    }
    const mapStats = {
      ...s.mapStats,
      eligibleCorrectAnswers: s.mapStats.eligibleCorrectAnswers + (eligible ? 1 : 0),
      fastCorrectAnswers: s.mapStats.fastCorrectAnswers + (eligible && isFastAnswer(s.question, s.activeAnswerMs) ? 1 : 0),
      answered: s.mapStats.answered + 1,
      correct: s.mapStats.correct + 1,
      maxCombo: Math.max(s.mapStats.maxCombo, combo),
      maxStreak: Math.max(s.mapStats.maxStreak, streak),
      bossQuestionsCorrect: s.mapStats.bossQuestionsCorrect + (s.isBossQuestion && !s.overtime ? 1 : 0),
      correctTimeMs: s.mapStats.correctTimeMs + s.activeAnswerMs,
    };
    // 見習騎士系的被動：每 N combo 得到一次守護
    const guardEvery = teamGuardEvery(party);
    const guardGained = guardEvery > 0 && combo > 0 && combo % guardEvery === 0 && !s.comboGuard;
    const wordEvolution = !s.overtime ? detectWordEvolution(s.original ?? s.question) : null;
    const base = {
      mapStats,
      wordEvolution,
      attackerIdx: s.isBossQuestion ? s.attackerIdx : nextAttacker(party, attackerIdx + 1),
      combo, streak, stageAnswers, stageSubmissions: s.stageSubmissions + 1, runAnswers: s.runAnswers + 1, maxCombo: Math.max(s.maxCombo, combo), bossBoost: bonusMult ? false : s.bossBoost,
      amplifyLeft: Math.max(0, s.amplifyLeft - 1),
      answers: [...s.answers, { stageIdx: s.stageIdx, question: s.original, correct: true }],
      wrongStreak: 0, assist: null, assistSource: null, typed: '', isBossQuestion: false,
      relay: { classId: attacker.classId, by: attacker.id }, chain: chainStep.chain,
      ...(guardGained ? { shield: true, comboGuard: true } : {}),
    };

    // 主線答對給學習EXP，首次通關池在finishStage發；其他模式保留原獎勵。升級立刻更新主角。
    const gainXp = (killedKind: 'none' | 'kill' | 'elite' | 'boss') => {
      if (s.mode === 'golden') return { xp: 0, levelUp: undefined, allowanceGold: 0 };
      const pooled = s.mode === 'normal' && !isPrologue(s.levelKey);
      const award = pooled ? save().grantLearningXp(s.levelIdx, s.original!, eligibleSubsidy, s.isReplayStage)
        : save().awardXp(Math.round((XP.correct + (killedKind === 'none' ? 0 : XP[killedKind])) * regionScale), s.mode === 'skill' ? 'skill' : 'prologue');
      const xp = award.xp, levels = award.levels;
      if (levels > 0) {
        party = refreshPlayer(party);
        celebrateLevelUp(save().player.level);
      }
      return { xp, levelUp: levels > 0 ? save().player.level : undefined, allowanceGold: award?.allowanceGold ?? 0 };
    };

    // 已逾時的寶箱只等一次真正作答後離場，不追加逾時後的擊倒獎勵。
    if (stage.kind === 'treasure' && s.treasureLeft <= 0) {
      const { xp, levelUp, allowanceGold } = gainXp('none');
      finishStage({ ...base, ...withTotals(party), treasureLeft: 0, runGold: s.runGold + allowanceGold, runXp: s.runXp + xp, event: nextEvent('escape', { levelUp }) });
      return;
    }

    // 菁英怪：護盾還在時，答對只會削掉一層護盾
    if (s.monsterShield > 0) {
      const monsterShield = s.monsterShield - 1;
      const gold = earn(GOLD.correct, streak);
      const { xp, levelUp, allowanceGold } = gainXp('none');
      set({
        ...base, ...withTotals(party), ...nextQuestion(), monsterShield, runGold: s.runGold + gold + allowanceGold, runXp: s.runXp + xp,
        enemyGauge: staggered(elapsed),
        event: nextEvent('shieldHit', { amount: monsterShield, member: attacker.id, gold, bossQuestion: s.isBossQuestion, bonus, levelUp, guardGained }),
      });
      return;
    }

    // 被動倍率：每關第一擊、隊伍低血量
    const firstHit = s.stageHits === 0 ? 1 + attacker.mods.firstHit : 1;
    const lowHp = s.playerHp / Math.max(1, s.playerMaxHp) < 0.5 ? 1 + attacker.mods.lowHp : 1;
    const rawEm = stage.kind === 'treasure' ? 1 : elementMultiplier(attacker.element, s.monsterElement);
    const em = relayFx?.ignoreWeak && rawEm < 1 ? 1 : rawEm;
    // 連攜技：依最後出手（就是這一擊）的職業發動大招
    const finisher = chainStep.triggered ? FINISHERS[attacker.classId] : null;
    // 神聖洗禮：全隊回血；絕對城壁：全隊護盾
    if (finisher?.heal) party = party.map(m => (isAlive(m) ? { ...m, hp: Math.min(m.maxHp, m.hp + Math.round(m.maxHp * finisher.heal!)) } : m));
    const teamwork = (1 + (relayFx?.dmg ?? 0)) * (finisher ? finisherMultiplier(finisher, aliveIds.length) : 1);
    // 首領的技能：硬化護甲只吃暴擊或剋制、屬性折射免疫某些屬性
    const armor = (s.foeSkill === 'hardShell' && !crit && em <= 1 ? HARD_SHELL_DAMAGE : 1)
      * (s.foeSkill === 'refraction' && refractionImmune(s.stageIdx).includes(attacker.element as never) ? REFRACTION_DAMAGE : 1)
      * modDamageMult(s.mods);
    const damage = stage.revenge
      ? BASE_DAMAGE * 2
      : computeDamage({
        atk: attacker.atk, combo, comboStep: s.stats.comboStep, speed, crit, amplify,
        element: em > 1 ? em + attacker.mods.elementBonus : em,
        critMult: 2 + attacker.mods.critDmg,
        extra: (s.weakenLeft > 0 ? 1 - s.weaken : 1) * firstHit * lowHp * teamwork * s.charge * armor * (s.blessed && !s.bossFight ? BLESSING_DAMAGE : 1) * talentDamage(attacker, combo, stage.bossMode),
      });
    // 處決僅附著於真正致命一擊；不再強制改HP或要求題數／連對。
    const execKind = s.mode === 'normal' ? executeKindOf({
      bossMode: stage.bossMode, kind: stage.kind, revenge: stage.revenge, inMap: stageInMap(s.stageIdx),
      final: stage.kind === 'final' || (s.stageIdx === s.stages.length - 1 && stage.kind !== 'gate'), lastRegion: s.levelIdx === LEVELS.length - 1,
    }) : null;
    const monsterHp = Math.max(0, s.monsterHp - damage);
    const slain = !!execKind && s.monsterHp > 0 && canExecute(execKind, { combo, lethal: monsterHp <= 0 });
    // 吸血：傷害的一部分轉為出手隊員的生命（每擊最多回復最大生命的 10%）
    const steal = talentOf(attacker, 'lifesteal');
    if (steal > 0) party = party.map((m, i) => (i === attackerIdx && isAlive(m) ? { ...m, hp: Math.min(m.maxHp, m.hp + Math.min(Math.round(damage * steal), Math.round(m.maxHp * 0.1))) } : m));
    const killed = monsterHp <= 0;
    // 一般關還有下一隻：只是這一波倒下，關卡繼續
    const waveKill = killed && s.wave < s.waves;
    // 固定敵群全部倒下就結算；參考題數只產生菁英／首領的自選追擊。
    const stageDone = killed && !waveKill;
    const bonusLeft = stageDone && execKind ? Math.max(0, s.minAnswers - stageAnswers) : 0;
    const kill = killed;
    const isLastStage = s.stageIdx + 1 >= s.stages.length;

    // 首領模組：推進破解進度、檢查新的觸發（倒地後全部取消）
    const modFx = s.mods.length ? progressMods(s, true, { streak, elapsed, hpRatio: monsterHp / Math.max(1, s.monsterMaxHp), answers: stageAnswers, executing: killed || s.executing }) : null;
    if (modFx?.partyHeal) party = party.map(m => (isAlive(m) ? { ...m, hp: Math.min(m.maxHp, m.hp + Math.round(m.maxHp * modFx.partyHeal)) } : m));

    let goldBase = stage.kind === 'treasure' ? GOLD.treasureHit : GOLD.correct;
    if (stageDone || (kill && !stage.bossMode && stage.kind !== 'treasure')) {
      goldBase += stage.revenge ? GOLD.revengeKill : stage.bossMode ? GOLD.bossKill : stage.kind === 'treasure' ? GOLD.treasureOpen : GOLD.kill;
    }
    if (stageDone && isLastStage) goldBase += GOLD.levelClear;
    const gold = earn(goldBase, streak);
    // 打倒頭目、通關可以拿到召喚券
    const tickets = !stageDone ? 0 : (stage.revenge ? TICKETS.revengeKill : stage.bossMode ? TICKETS.bossKill : 0) + (isLastStage ? TICKETS.levelClear : 0);
    if (tickets > 0 && s.mode === 'normal') save().addTickets(tickets);

    // 擊倒：經驗值與素材掉落
    const dropKind = stage.bossMode ? 'boss' : stage.kind === 'elite' ? 'elite' : stage.kind === 'treasure' ? 'treasure' : 'normal';
    const { xp, levelUp, allowanceGold } = gainXp(!(stageDone || kill) ? 'none' : stage.bossMode ? 'boss' : stage.kind === 'elite' ? 'elite' : 'kill');
    const drops = stageDone && s.mode !== 'golden' ? rollDrops(dropKind, s.monsterElement, random, s.mode === 'normal' ? s.levelIdx : 0) : {};
    if (stageDone) save().addMaterials(drops);
    if (stageDone && stage.bossMode && s.mode !== 'golden') save().trackDaily('boss');

    const common = {
      ...base, ...withTotals(party), monsterHp, runGold: s.runGold + gold + allowanceGold, runXp: s.runXp + xp,
      // 蓄力與必定暴擊在真正造成傷害時才用掉（打菁英怪護盾時保留）
      charge: 1, critLeft: Math.max(0, s.critLeft - 1),
      ...withModFx(bossOnCorrect(streak, chainStep.triggered), modFx),
      ...(finisher?.shield ? { shield: true, comboGuard: true } : {}),
      ...(finisher?.heal ? { stunned: null, mirageLeft: 0, staticStacks: 0, frostLeft: 0 } : {}),
      runDrops: mergeDrops(s.runDrops, drops), stageHits: s.stageHits + 1,
      event: nextEvent('attack', {
        amount: damage, gold, crit, fast: speed > 1 ? speed : undefined, member: attacker.id, bossQuestion: s.isBossQuestion, bonus,
        slain: slain || undefined,
        levelUp, guardGained, drops: stageDone ? drops : undefined, waveKill,
        relay: relayFx ? `${relayFx.icon} ${relayFx.name}` : undefined,
        chain: chainStep.triggered ? aliveIds.length : undefined,
        finisher: finisher ? `${finisher.icon} ${finisher.name}` : undefined,
      }),
    };
    // 答對打中：敵人的行動條往後退（快答退更多）
    const after = { ...common, enemyGauge: staggered(elapsed) };
    if (!killed) {
      set({ ...after, ...nextQuestion() });
      return;
    }
    if (waveKill) {
      // 下一隻怪物馬上登場（血量回滿），題目接著出
      set({ ...after, monsterHp: s.monsterMaxHp, wave: s.wave + 1, waves: s.waves, ...nextQuestion() });
      return;
    }
    if (s.mode === 'normal') stageFails.delete(failKey(s.levelKey, s.stageIdx));
    finishStage({ ...after, bonusLeft, bonusGold: 0 });
  };

  const onWrong = (given: string, timeout = false) => {
    const s = get();
    if (!s.question || !s.original) return;
    save().recordAnswer(s.original, false, false);
    // 守護之盾，或僧侶的「心靈祥和」接力：這一題答錯也保住 combo
    const guarded = s.comboGuard || !!relayFor(s.relay, s.party[s.attackerIdx]?.id ?? '')?.guard;
    const stage = s.stages[s.stageIdx];
    const base = {
      // 答錯：combo 保留 50%（女神祝福 70%、守護 100%，互斥不疊乘）；真實連對另外歸零
      ...decayCombo(s.combo, s.skillCombo, guarded ? 1 : s.blessed ? BLESSED_COMBO_KEEP : WRONG_COMBO_KEEP),
      runAnswers: s.runAnswers + 1,
      comboGuard: false,
      // 答錯：接力與連攜中斷（守護保住 combo 時也保住接力）
      relay: guarded ? s.relay : null,
      chain: guarded ? s.chain : [],
      // 菁英怪的護盾在答錯時恢復一層（以前是全部回滿，程度較弱的玩家會卡很久）
      monsterShield: stage.kind === 'elite' && s.monsterShield > 0 ? Math.min(ELITE_SHIELD, s.monsterShield + 1) : s.monsterShield,
      answers: [...s.answers, { stageIdx: s.stageIdx, question: s.original, correct: false }],
      wrongStreak: s.wrongStreak + 1,
      // 答錯：真的連續答對數歸零（祝福、護盾只保住 combo）；答錯也算作答過一題
      streak: 0,
      stageAnswers: s.stageAnswers + 1,
      stageSubmissions: s.stageSubmissions + (!timeout && given.trim() ? 1 : 0),
      feedback: { question: s.question, given, timeout },
      wordEvolution: null,
      mapStats: { ...s.mapStats, answered: s.mapStats.answered + 1, bossFlawless: s.mapStats.bossFlawless && !stage.bossMode },
    };

    // 黃金之路：答錯或超時，挑戰立刻結束
    if (s.mode === 'golden') {
      save().recordGolden(s.stageIdx);
      set({ ...base, phase: 'gameOver' });
      return;
    }

    // 首領模組：答錯也會推進（例如連答鎖被打斷、吸血開始）
    const modFx = s.mods.length && !s.executing
      ? progressMods(s, false, { streak: 0, elapsed: 0, hpRatio: s.monsterHp / Math.max(1, s.monsterMaxHp), answers: base.stageAnswers, executing: false })
      : null;
    const modPatch = modFx ? withModFx({}, modFx) : {};
    // 護盾（援軍、道具或技能）、不會攻擊的寶箱怪、終結連擊中倒地的首領：不受傷
    if (s.shield || stage.kind === 'treasure' || s.executing) {
      set({ ...base, ...modPatch, shield: stage.kind === 'treasure' ? s.shield : false, phase: 'feedback', event: nextEvent('shield') });
      return;
    }
    // 蓄力那一題答錯：吃到加倍的蓄力攻擊；魔王的分身與靜電再加倍
    const bossMultWrong = (s.mirageLeft > 0 ? 2 : 1) * (s.bossSkill === 'static' ? 1 + STATIC_STEP * s.staticStacks : 1)
      * (s.foeSkill === 'berserkFoe' && s.monsterHp < s.monsterMaxHp * 0.3 ? BERSERK_FOE_MULT : 1);
    let strike = enemyStrike(s.party, bossMultWrong);
    // 灰燼炸彈：倒數中答錯就爆炸，全隊各扣最大生命的 30%
    const exploded = s.bombLeft > 0;
    // 吸血鬼：攻擊隊員時回復生命
    const vampHeal = s.foeSkill === 'vampire' ? Math.round(s.monsterMaxHp * VAMPIRE_HEAL) : 0;
    if (exploded) {
      const blasted = strike.party.map(m => (isAlive(m) ? { ...m, hp: Math.max(0, m.hp - Math.round(m.maxHp * BOMB_DAMAGE)) } : m));
      strike = { ...strike, ...withTotals(blasted), wiped: blasted.every(m => !isAlive(m)) };
    }
    // 模組的懲罰（只取最重的一個）：加在被打的隊員身上
    if (modFx?.penalty) {
      const target = strike.event.member;
      const hurt = strike.party.map(m => (m.id === target && isAlive(m) ? { ...m, hp: Math.max(0, m.hp - Math.round(m.maxHp * modFx.penalty * s.aidGuard)) } : m));
      strike = { ...strike, ...withTotals(hurt), wiped: hurt.every(m => !isAlive(m)) };
    }
    // 連敗援助：這次全滅按援助比例讓全員站起來（每次挑戰一次）
    const rescued = strike.wiped && s.aidRevive;
    if (rescued) strike = { ...strike, ...withTotals(reviveAll(strike.party, s.aidReviveRatio)), wiped: false };
    set({
      ...base,
      mapStats: { ...base.mapStats, knockouts: strike.mapStats.knockouts },
      ...withTotals(strike.party),
      attackerIdx: strike.attackerIdx,
      mirageStreak: 0,
      staticStacks: s.bossSkill === 'static' ? s.staticStacks + 1 : 0,
      ...modPatch,
      ...(vampHeal || modFx?.bossHeal ? { monsterHp: Math.min(s.monsterMaxHp, s.monsterHp + vampHeal + Math.round(s.monsterMaxHp * (modFx?.bossHeal ?? 0))) } : {}),
      ...(exploded ? { bombLeft: 0, bossCast: cast('💥 灰燼炸彈爆炸了！全隊受到重創') } : {}),
      ...(rescued ? { aidRevive: false, bossCast: cast(REVIVE_TEXT) } : {}),
      // 答錯已經被反擊：行動條往後退一點，不會緊接著再挨一次主動攻擊
      enemyGauge: Math.min(s.enemyGauge, COUNTER_GAUGE_CAP),
      event: strike.event,
      phase: strike.wiped ? 'gameOver' : 'feedback',
    });
    if (strike.wiped && s.mode === 'normal') {
      const key = failKey(s.levelKey, s.stageIdx);
      stageFails.set(key, (stageFails.get(key) ?? 0) + 1);
    }
  };

  const canAnswer = () => get().phase === 'answering' && get().question !== null;

  // 技能效果：依技能與威力組合出這次要改的狀態
  const applySkill = (m: Member): Partial<BattleState> => {
    const s = get();
    const e = skillEffect(m.skill, m.skillPower);
    const patch: Partial<BattleState> = {};
    if (e.shield) Object.assign(patch, { shield: true, comboGuard: true });
    if (e.heal || e.revive) {
      // 施放者自己也一起回復；復活的隊員回復到 heal %
      const party = s.party.map(p => {
        if (!isAlive(p)) return e.revive ? { ...p, hp: Math.max(1, Math.round(p.maxHp * (e.heal ?? 30) / 100)) } : p;
        return { ...p, hp: Math.min(p.maxHp, p.hp + Math.round(p.maxHp * (e.heal ?? 0) / 100)) };
      });
      Object.assign(patch, withTotals(party));
    }
    const thisMs = (e.timeThis ?? 0) * 1000 + (e.timeStage ?? 0) * 1000;
    if (thisMs > 0) Object.assign(patch, { questionLeft: s.questionLeft + thisMs, questionLimit: s.questionLimit + thisMs, overtime: false });
    if (e.timeStage) patch.focusMs = Math.max(s.focusMs, e.timeStage * 1000);
    if (e.amplify) patch.amplifyLeft = Math.max(s.amplifyLeft, e.amplify);
    if (e.charge) patch.charge = Math.max(s.charge, e.charge * (e.bossCharge && s.stages[s.stageIdx]?.bossMode ? 1.5 : 1));
    if (e.crits) patch.critLeft = Math.max(s.critLeft, e.crits);
    // 技能加 combo：同一個 8 題視窗合計最多 +40，記在技能 combo（之後的困難題不會乘到）
    if (e.combo) {
      const win = skillWindowOf(s.runAnswers);
      const used = win === s.skillWindow ? s.skillWindowGain : 0;
      const add = grantSkillCombo(used, e.combo);
      Object.assign(patch, { combo: s.combo + add, skillCombo: s.skillCombo + add, skillWindow: win, skillWindowGain: used + add, maxCombo: Math.max(s.maxCombo, s.combo + add) });
    }
    if (e.bossStep) patch.bossBoost = true;
    if (e.breakShield && s.monsterShield > 0) patch.monsterShield = Math.max(0, s.monsterShield - e.breakShield);
    return patch;
  };

  return {
    active: false,
    levelKey: '',
    mode: 'normal',
    skillBoss: null,
    levelIdx: 0,
    stages: [],
    stageIdx: 0,
    qIdx: 0,
    original: null,
    question: null,
    questionSeq: 0,
    questionCount: 0,
    isBossQuestion: false,
    typed: '',
    retrying: false,
    combo: 0,
    skillCombo: 0,
    skillWindow: 0,
    skillWindowGain: 0,
    runAnswers: 0,
    maxCombo: 0,
    bossBoost: false,
    party: [],
    attackerIdx: 0,
    playerHp: 0,
    playerMaxHp: 0,
    monsterHp: 0,
    monsterMaxHp: 0,
    monsterElement: 'wood',
    monsterShield: 0,
    treasureLeft: 0,
    phase: 'answering',
    feedback: null,
    event: null,
    answers: [],
    wrongStreak: 0,
    assist: null,
    assistSource: null,
    shield: false,
    comboGuard: false,
    amplifyLeft: 0,
    relay: null,
    chain: [],
    focusMs: 0,
    charge: 1,
    critLeft: 0,
    questionLimit: QUESTION_LIMIT,
    questionLeft: QUESTION_LIMIT,
    activeAnswerMs: 0,
    wordEvolution: null,
    overtime: false,
    phaseLeft: 0,
    casting: null,
    stats: playerStats({ upgrades: { hp: 0, atk: 0, combo: 0, gold: 0 } }),
    runGold: 0,
    runRunes: 0,
    mapStats: emptyRunStats(),
    mapResult: null,
    runXp: 0,
    runDrops: {},
    stageHits: 0,
    enemyTurn: 0,
    ...bossSkillState(null),
    monsterKind: 'slime',
    enemyGauge: 0,
    enemyMoveIdx: 0,
    poison: [],
    weakenLeft: 0,
    weaken: 0,
    slowNext: 0,
    wave: 1,
    waves: 1,
    bossFight: false,
    streak: 0,
    stageAnswers: 0,
    stageSubmissions: 0,
    minAnswers: 0,
    executing: false,
    bonusLeft: 0,
    isReplayStage: false,
    bonusRound: false,
    bonusGold: 0,
    bonusReturn: null,
    aidRevive: false,
    aidGuard: 1,
    aidTimeMs: 0, aidReviveRatio: .3, aidSealTotal: SEAL_BREAK_TOTAL,
    blessed: false,

    startLevel: (levelKey, transform, fromStage) => {
      questionTransform = transform ?? (q => q);
      const base = createDecks(levelKey, random);
      decks = { normal: preferNew(base.normal), boss: preferNew(base.boss) };
      const { upgrades, party: ids, character, heroes } = save();
      const stats = playerStats({ upgrades });
      const party = withSpring(buildParty(ids, heroes, character, stats, partyOptions(LEVELS.indexOf(levelKey))));
      set({
        active: true, mode: 'normal', skillBoss: null, levelKey, levelIdx: Math.max(0, LEVELS.indexOf(levelKey)), stages: generateStages(levelKey, decks),
        combo: 0, skillCombo: 0, skillWindow: 0, skillWindowGain: 0, runAnswers: 0, maxCombo: 0, bossBoost: false, questionCount: 0,
        stats, ...withTotals(party), attackerIdx: 0,
        answers: [], wrongStreak: 0, shield: false, comboGuard: false, amplifyLeft: 0, charge: 1, critLeft: 0, relay: null, chain: [], runGold: 0, runRunes: 0, runXp: 0, runDrops: {},
      });
      const saved = save().levelProgress[levelKey] ?? 0;
      const start = Math.min(Math.max(0, fromStage ?? saved), get().stages.length - 1);
      // 人生第一場戰鬥（圖鑑還是空的）：前幾題從題庫挑最簡單的
      easyQueue = Object.keys(save().codex).length === 0
        ? easeOrder(Array.from({ length: 12 }, () => decks!.normal(0))).slice(0, EASY_START)
        : [];
      buildReviewIndex(get().levelIdx);
      loadStage(start, true);
    },

    // 黃金之路：只有主角（沒有主角時用第一位英雄），Lv 1、沒有轉職、沒有裝備、沒有商店升級
    startGoldenRoad: (transform) => {
      questionTransform = transform ?? (q => q);
      easyQueue = [];
      goldenDecks = createGoldenDecks();
      const { character, heroes } = save();
      const stats = playerStats({ upgrades: { hp: 0, atk: 0, combo: 0, gold: 0 } });
      const party = buildParty([character ? 'player' : heroes[0]], heroes, character, stats);
      set({
        active: true, mode: 'golden', skillBoss: null, levelKey: GOLDEN_LEVEL_KEY, levelIdx: 0, stages: generateGoldenStages(goldenDecks),
        combo: 0, skillCombo: 0, skillWindow: 0, skillWindowGain: 0, runAnswers: 0, maxCombo: 0, bossBoost: false, questionCount: 0,
        stats, ...withTotals(party), attackerIdx: 0,
        answers: [], wrongStreak: 0, shield: false, comboGuard: false, amplifyLeft: 0, charge: 1, critLeft: 0, relay: null, chain: [], runGold: 0, runRunes: 0, runXp: 0, runDrops: {},
      });
      loadStage(0, true);
    },

    // 擴充魔王：單一頭目戰，題目只來自一種能力；用正式隊伍（含成長）挑戰
    startSkillBoss: (id) => {
      const def = skillBossDef(id)!;
      questionTransform = q => q;
      easyQueue = [];
      const { upgrades, party: ids, character, heroes, unlockedIndex } = save();
      const levelIdx = Math.min(unlockedIndex, LEVELS.length - 1);
      const questions = shuffleArray(skillBossQuestions(id, reachablePool(unlockedIndex)), random);
      let i = 0;
      const draw = () => questions[i++ % questions.length];
      decks = { normal: draw, boss: draw };
      const stats = playerStats({ upgrades });
      const party = withSpring(buildParty(ids, heroes, character, stats, partyOptions()));
      set({
        active: true, mode: 'skill', skillBoss: id, levelKey: `skill-${id}`, levelIdx,
        stages: [{ name: def.name, bossMode: true, kind: 'final', questions: [draw()] }],
        combo: 0, skillCombo: 0, skillWindow: 0, skillWindowGain: 0, runAnswers: 0, maxCombo: 0, bossBoost: false, questionCount: 0,
        stats, ...withTotals(party), attackerIdx: 0,
        answers: [], wrongStreak: 0, shield: false, comboGuard: false, amplifyLeft: 0, charge: 1, critLeft: 0, relay: null, chain: [], runGold: 0, runRunes: 0, runXp: 0, runDrops: {},
      });
      loadStage(0, true);
    },

    // 預習結束（或跳過）開始作答；questionSeq +1 讓介面播放題目發音
    startBattle: () => {
      const s = get();
      if (s.phase !== 'lesson') return;
      set({ phase: 'answering', questionSeq: s.questionSeq + 1, ...freshTimer(s.focusMs) });
    },

    openLesson: () => {
      if (get().phase !== 'answering') return;
      set({ phase: 'lesson' });
    },

    // 由介面定時呼叫。只有作答與施法確認時計時，其他畫面（預習、解說、結算）都暫停
    tick: (ms, systemPauseMs = 0, activePauseMs = systemPauseMs) => {
      const s = get();
      if (!s.active || ms <= 0) return;
      if (s.phase === 'answering') {
        const activeMs = Math.max(0, ms - Math.min(ms, Math.max(0, activePauseMs)));
        const timerMs = Math.max(0, ms - Math.min(ms, Math.max(0, systemPauseMs)));
        set({ activeAnswerMs: s.activeAnswerMs + activeMs });
        // 寶箱倒數照常結束，但不能靠待機或自動超時零作答推進小關。
        if (s.stages[s.stageIdx]?.kind === 'treasure') {
          const treasureLeft = Math.max(0, s.treasureLeft - ms);
          if (treasureLeft === 0 && s.stageSubmissions > 0) {
            finishStage({ treasureLeft: 0, event: nextEvent('escape') });
            return;
          }
          set({ treasureLeft });
        }
        // 敵人行動條：集滿就依攻擊模式出招
        if (gaugeActive(s)) {
          const kind = foeKindOf(s.stages[s.stageIdx], s.stageIdx, s.stages.length) ?? 'normal';
          const writing = s.question?.type === 'spell' || s.question?.type === 'fill' || (s.question?.type === 'voice' && (s.question.speak?.split(/\s+/).length ?? 0) > 6);
          const gauge = s.enemyGauge + (timerMs * (writing ? 0.7 : 1) * gaugeScale(s.levelIdx, s.stageIdx, s.levelKey) * modGaugeMult(s.mods)) / (gaugeSeconds(patternFor(s)!, s.levelIdx, kind) * 1000);
          if (gauge >= 1) {
            const move = nextMove(s);
            if (move) performMove(move);
            if (get().phase !== 'answering') return;
          } else set({ enemyGauge: gauge });
        }
        if (s.overtime) return;
        const questionLeft = Math.max(0, s.questionLeft - timerMs);
        if (questionLeft > 0) { set({ questionLeft }); return; }
        // 新手關（A1 1-1～1-7）不計時：時間到也不中斷 combo，慢慢想
        if (s.mode === 'normal' && untimedStage(s.levelIdx, s.stageIdx, s.levelKey)) { set({ questionLeft: 0 }); return; }
        if (s.mode !== 'golden' && isLenientStage(s.stageIdx)) {
          // 前 25 關：超時不算答錯，只是 combo 中斷，繼續作答同一題。
          // 有守護（護盾、守護技能）時用掉守護，combo 保住
          if (s.comboGuard) set({ questionLeft: 0, overtime: true, comboGuard: false, shield: false, event: nextEvent('overtime') });
          else set({ questionLeft: 0, overtime: true, ...decayCombo(s.combo, s.skillCombo, s.blessed ? BLESSED_COMBO_KEEP : WRONG_COMBO_KEEP), event: nextEvent('overtime') });
        } else {
          set({ questionLeft: 0 });
          onWrong('', true);
        }
      }
      // casting：技能視窗開著時，題目計時與敵人行動條都暫停，直到按下施放或取消
    },

    inputLetter: (letter) => {
      const { question, typed } = get();
      if (!canAnswer() || !question || (question.type !== 'spell' && question.type !== 'fill')) return;
      set({ typed: applyLetter(question, typed, letter) });
    },

    switchToSpelling: () => {
      const prev = questionTransform;
      questionTransform = q => voiceFallback(prev(q));
      const s = get();
      if (s.phase !== 'answering' || !s.original || s.question?.type !== 'voice') return;
      const converted = prepare(s.original);
      // 句子型的口說題沒辦法改成拼寫：直接換下一題（不算答錯）
      if (converted.type === 'voice') { set({ ...nextQuestion(), typed: '', assist: null, assistSource: null }); return; }
      set({ question: converted, typed: '', assist: null, assistSource: null, questionSeq: s.questionSeq + 1, activeAnswerMs: 0 });
    },

    // 送出拼寫：按 Enter 或「送出」按鈕才判定
    submitTyped: () => {
      const { question, typed } = get();
      if (!canAnswer() || !question || (question.type !== 'spell' && question.type !== 'fill') || !typed) return;
      if (checkTypedAnswer(question, typed)) return onCorrect();
      onWrong(typed);
    },

    backspace: () => {
      if (!canAnswer()) return;
      // 提示預先填好的字母不能刪
      const keep = get().assist?.revealed.length ?? 0;
      set(s => ({ typed: s.typed.length > keep ? s.typed.slice(0, -1) : s.typed }));
    },

    chooseOption: (letter) => {
      const { question, assist } = get();
      if (!canAnswer() || !question || question.type !== 'choice') return;
      if (assist?.hiddenOptions.includes(letter.toUpperCase())) return;
      if (checkChoice(question, letter)) return onCorrect();
      const picked = question.options?.find(o => o.startsWith(`${letter.toUpperCase()}.`)) ?? letter;
      onWrong(picked);
    },

    submitVoice: (transcripts) => {
      const { question } = get();
      if (!canAnswer() || !question || question.type !== 'voice') return;
      if (checkVoice(question, transcripts)) return onCorrect();
      // 回饋畫面顯示最可能的那個辨識結果
      onWrong(Array.isArray(transcripts) ? transcripts[0] ?? '' : transcripts);
    },

    // 看完正確答案後，同一題重新作答一次（選項重新洗牌，避免只記位置）。
    // 連續答錯達門檻時，援軍登場：給提示並附上一次護盾
    startBonus: () => {
      const s = get();
      if (s.bonusLeft <= 0 || s.bonusRound || !['monsterDown', 'summary', 'levelClear'].includes(s.phase)) return;
      set({ bonusReturn: s.phase, bonusRound: true, executing: true, monsterHp: 0, enemyGauge: 0, phase: 'answering', ...nextQuestion() });
    },

    endBonus: () => {
      const s = get();
      if (!s.bonusRound) return;
      let extraPatch: Partial<BattleState> = {};
      const isMapBoss = stageInMap(s.stageIdx) === MAP_SIZE || (s.stageIdx + 1 >= s.stages.length);
      if (isMapBoss && s.mode === 'normal') {
        const stats = { ...s.mapStats, earlyFinish: true };
        const stars = evaluateStars(s.levelIdx, stats);
        const mapIdx = mapIndexOf(s.stageIdx);
        const gained = save().recordMapStars(mapKey(s.levelKey, mapIdx), stars);
        extraPatch = { mapStats: stats, mapResult: { mapIdx, stars, gained } };
        if (gained > 0 && stars.every(Boolean)) {
          useUiStore.getState().celebrate({ icon: '⭐', title: '三星通關！', sub: `「${regionOf(s.levelKey).maps[mapIdx] ?? ''}」全部條件達成`, color: '#ffcd4b' });
        }
      }
      set({ ...extraPatch, bonusRound: false, bonusLeft: 0, executing: false, phase: s.bonusReturn ?? 'monsterDown', bonusReturn: null, feedback: null });
    },

    continueAfterFeedback: () => {
      const s = get();
      if (s.phase !== 'feedback' || !s.original) return;
      const question = prepare(s.original);
      const base = {
        phase: 'answering' as const, feedback: null, question, questionSeq: s.questionSeq + 1, retrying: true,
        isBossQuestion: false, ...freshTimer(s.focusMs),
      };
      if (s.wrongStreak >= ASSIST_STREAK) {
        const assist = buildAssist(question, random);
        set({ ...base, assist, assistSource: 'helper', typed: assist.revealed, wrongStreak: 0, shield: true, event: nextEvent('assist') });
        return;
      }
      set({ ...base, typed: '', assist: null, assistSource: null });
    },

    // 點隊員（戰鬥畫面上的角色或下方隊伍列）：能量滿時打開技能視窗，計時暫停到按下施放或取消；
    // 取消不會用掉能量，之後隨時可以再放
    chooseModSkill: (skill) => {
      const s = get();
      if (!s.modChoice?.includes(skill)) return;
      const mods = chooseReflect(s.mods, skill);
      // 換成選好的題型，馬上就能反擊
      const q = pickPreferred({ skill }, s.original);
      set({ mods, modChoice: null, bossCast: cast(`🪞 題型反射：答對一題${skillName(skill)}題就反射回去！`), ...(q ? { original: q, question: prepare(q), questionSeq: s.questionSeq + 1, activeAnswerMs: 0, typed: '', assist: null, assistSource: null } : {}) });
    },

    requestSkill: (memberIdx) => {
      const s = get();
      const m = s.party[memberIdx];
      if (s.phase !== 'answering' || !m || !skillReady(m) || (s.sealed && (!s.sealTarget || m.id === s.sealTarget))) return;
      set({ phase: 'casting', casting: memberIdx, phaseLeft: 0 });
    },

    confirmSkill: () => {
      const s = get();
      if (s.phase !== 'casting' || s.casting === null) return;
      const m = s.party[s.casting];
      const effect = applySkill(m);
      const party = (effect.party ?? s.party).map((p, i) => (i === s.casting ? { ...p, energy: 0 } : p));
      set({
        ...effect, phase: 'answering', casting: null, phaseLeft: 0, ...withTotals(party),
        event: nextEvent('skill', { skill: m.skill, member: m.id }),
      });
    },

    cancelSkill: () => {
      if (get().phase !== 'casting') return;
      set({ phase: 'answering', casting: null, phaseLeft: 0 });
    },

    consumeItem: (id) => {
      const s = get();
      if (!canAnswer() || !s.question) return;
      if (id === 'potion') {
        if (s.playerHp >= s.playerMaxHp || !save().consumeItem('potion')) return;
        // 全隊（還站著的）各回復 POTION_HEAL
        const party = s.party.map(m => (isAlive(m) ? { ...m, hp: Math.min(m.maxHp, m.hp + POTION_HEAL) } : m));
        const totals = withTotals(party);
        set({ ...totals, event: nextEvent('heal', { amount: totals.playerHp - s.playerHp }) });
      } else if (id === 'shield') {
        if (s.shield || !save().consumeItem('shield')) return;
        // 護盾：下一次答錯（或超時）不扣血，combo 也不會中斷
        set({ shield: true, comboGuard: true, event: nextEvent('guard') });
      } else {
        if (s.assist) return;
        const assist = buildAssist(s.question, random);
        const useful = assist.hiddenOptions.length > 0 || assist.revealed !== '' || assist.showWord;
        if (!useful || !save().consumeItem('hint')) return;
        set({ assist, assistSource: 'item', typed: s.typed.length >= assist.revealed.length ? s.typed : assist.revealed });
      }
    },

    nextStage: () => {
      const s = get();
      if (s.phase !== 'monsterDown' && s.phase !== 'summary') return;
      loadStage(s.stageIdx + 1);
    },

    // 全隊倒下後重新挑戰：從倒下的那一關重來，不必從第 1 關打起
    retryLevel: () => {
      const s = get();
      if (s.mode === 'golden') s.startGoldenRoad(questionTransform);
      else if (s.mode === 'skill') s.startSkillBoss(s.skillBoss!);
      else s.startLevel(s.levelKey, questionTransform, s.stageIdx);
    },

    // 戰敗熱身：複習剛才的錯題後重新挑戰，獲得首擊傷害翻倍與神聖守護護盾
    retryWithWarmupBonus: () => {
      const s = get();
      if (s.mode === 'golden') s.startGoldenRoad(questionTransform);
      else if (s.mode === 'skill') s.startSkillBoss(s.skillBoss!);
      else s.startLevel(s.levelKey, questionTransform, s.stageIdx);
      set({ amplifyLeft: 1, shield: true, comboGuard: true });
    },

    exitToMap: () => set({ active: false, question: null }),
  };
});
