import { create } from 'zustand';
import type { Question, Stage } from '../game/types';
import { LEVELS, createDecks, generateStages } from '../game/QuestionData';
import type { Decks } from '../game/QuestionData';
import {
  ASSIST_STREAK, BASE_DAMAGE, CAST_CONFIRM_TIME, QUESTION_LIMIT, shuffleArray,
  applyLetter, buildAssist, checkChoice, easeOrder, checkVoice, isLenientStage, questionKey, shuffleChoice, speedMultiplier,
} from '../game/battle';
import type { Assist } from '../game/battle';
import { SEGMENT_SIZE } from '../game/lesson';
import type { AnswerRecord } from '../game/lesson';
import {
  BOSS_QUESTION_EVERY, ELITE_HP_MULT, ELITE_SHIELD, GOLD, POTION_HEAL, TICKETS, TREASURE_HITS, TREASURE_TIME,
  bossStep, computeDamage, goldWithBonus, monsterAttack, monsterElement, monsterGrowth, monsterMaxHp, playerStats,
} from '../game/progression';
import type { ItemId, PlayerStats, SkillId } from '../game/progression';
import { elementMultiplier } from '../game/character';
import type { Element } from '../game/character';
import { buildMember, buildParty, gainEnergy, isAlive, leaderIndex, nextAlive, partyHp, skillReady, teamGuardEvery, teamTimeBonus } from '../game/party';
import type { PartyOptions } from '../game/party';
import type { Member, MemberId } from '../game/party';
import { dueMistakes, useSaveStore } from './saveStore';
import { ADVANCE_REQ, XP, canAdvance, xpScale } from '../game/growth';
import { rollDrops } from '../game/equipment';
import { MAP_SIZE, mapIndexOf, mapKey, regionOf } from '../game/regions';
import { useUiStore } from './uiStore';
import { emptyRunStats, evaluateStars } from '../game/stars';
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
  kind: 'attack' | 'hurt' | 'stage' | 'assist' | 'shield' | 'heal' | 'guard' | 'skill' | 'overtime' | 'shieldHit' | 'escape';
  amount?: number;
  gold?: number;
  crit?: boolean;
  fast?: number;           // 快答加成倍率（> 1 時顯示 FAST!）
  member?: MemberId;       // 出手或受傷的隊員
  bossQuestion?: boolean;  // 這一擊來自魔王題
  skill?: SkillId;
  levelUp?: number;                 // 主角升到第幾級
  guardGained?: boolean;            // 被動守護觸發
  drops?: Record<string, number>;   // 擊倒後的素材
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
export const FOCUS_BONUS = 5_000;
export const HASTE_BONUS = 10_000;
export const AMPLIFY_HITS = 3;
export const COMBO_GOLD_STEP = 10; // 每 10 combo 金幣 +10%，最多 +100%

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
  questionCount: number;     // 這趟出過幾題（決定魔王題時機）
  isBossQuestion: boolean;
  typed: string;
  retrying: boolean; // 看完正確答案後的重答，不算 SRS 複習
  combo: number;
  maxCombo: number;
  bossMult: number;  // 魔王題累積倍率（連乘）
  bossChain: number; // 連續答對幾題魔王題
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
  focus: boolean;       // 專注：這一關每題多 5 秒
  questionLimit: number;
  questionLeft: number;
  overtime: boolean;    // 這題已超過 20 秒（前 25 關）：答對不加 combo
  phaseLeft: number;    // 施法確認剩餘時間
  casting: number | null; // 正在確認施放技能的隊員
  stats: PlayerStats;
  runGold: number;
  mapStats: MapRunStats; // 這張地圖的戰績（三星評價用）
  mapResult: MapResult | null;
  runXp: number;
  runDrops: Record<string, number>;
  stageHits: number; // 這一關打出的攻擊數（每關第一擊加成用）

  // fromStage 未指定時，從存檔記錄的進度繼續
  startLevel: (levelKey: string, transform?: (q: Question) => Question, fromStage?: number) => void;
  startGoldenRoad: (transform?: (q: Question) => Question) => void;
  startSkillBoss: (id: SkillBossId) => void;
  startBattle: () => void;
  openLesson: () => void;
  tick: (ms: number) => void;
  inputLetter: (letter: string) => void;
  backspace: () => void;
  chooseOption: (letter: string) => void;
  submitVoice: (transcript: string) => void;
  continueAfterFeedback: () => void;
  requestSkill: (memberIdx: number) => void;
  confirmSkill: () => void;
  cancelSkill: () => void;
  consumeItem: (id: ItemId) => void;
  nextStage: () => void;
  retryLevel: () => void;
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
const takeEasy = (stage: Stage) => (stage.bossMode || stage.revenge || stage.kind ? undefined : easyQueue.shift());
// 暴擊與敵人攻擊目標用的亂數（測試可替換）
let random: () => number = Math.random;
export const setBattleRandom = (fn: () => number) => { random = fn; };

const save = () => useSaveStore.getState();

// 升級慶祝：剛好達到轉職等級時一起提醒
function celebrateLevelUp(level: number) {
  const { character, player, unlockedIndex } = save();
  const tier = (player.classPath.length + 1) as 1 | 2 | 3;
  const canClass = !!character && tier <= 3 && ADVANCE_REQ[tier].level === level && canAdvance(tier, level, unlockedIndex);
  useUiStore.getState().celebrate({
    icon: '⬆️', title: `LEVEL UP!  Lv ${level}`,
    sub: canClass ? '可以轉職了！到「成長」選擇新的職業路線' : 'HP 與攻擊力提升了',
    color: '#7fe8ff',
  });
}

// 第 10、20、30、40 關：如果有到期的錯題，守門 Boss 換成「復仇魔王」
function withRevenge(stage: Stage, stageIdx: number, stageCount: number): Stage {
  const isFinal = stageIdx === stageCount - 1;
  if (!stage.bossMode || isFinal) return stage;
  const due = dueMistakes(save().mistakes, Date.now(), REVENGE_MAX_QUESTIONS);
  if (due.length === 0) return stage;
  return { name: `第 ${stageIdx + 1} 關：復仇魔王`, bossMode: true, revenge: true, questions: due.map(m => m.question) };
}

// 魔王題：優先出到期的錯題，其次任何錯題，都沒有就出這個區域的 Boss 題
function pickBossQuestion(exclude: Question | null): Question {
  const skip = exclude ? questionKey(exclude) : '';
  const mistakes = Object.values(save().mistakes).filter(m => questionKey(m.question) !== skip);
  const due = mistakes.filter(m => m.dueAt <= Date.now());
  const pool = due.length > 0 ? due : mistakes;
  if (pool.length > 0) return pool[Math.floor(random() * pool.length)].question;
  return decks!.boss();
}

// 從存檔組出隊伍的成長資料（英雄品階與等級、主角等級／轉職／裝備）
function partyOptions(): PartyOptions {
  const sv = save();
  return {
    tiers: sv.heroTier,
    heroLevels: sv.heroLevel,
    trueName: sv.trueName,
    growth: {
      level: sv.player.level,
      classPath: sv.player.classPath,
      equipped: Object.values(sv.equipped).map(uid => sv.equipment.find(e => e.uid === uid)).filter(e => e !== undefined),
    },
  };
}

// 主角升級：用新能力重算，保留已受的傷害
function refreshPlayer(party: Member[]): Member[] {
  return party.map(m => {
    if (m.id !== 'player') return m;
    const fresh = buildMember('player', save().character, playerStats({ upgrades: save().upgrades }), partyOptions());
    return { ...fresh, hp: Math.max(0, Math.min(fresh.maxHp, m.hp + (fresh.maxHp - m.maxHp))), energy: m.energy };
  });
}

const mergeDrops = (a: Record<string, number>, b: Record<string, number>) => {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = (out[k] ?? 0) + v;
  return out;
};

const withTotals = (party: Member[]) => {
  const { hp, maxHp } = partyHp(party);
  return { party, playerHp: hp, playerMaxHp: maxHp };
};

export const useBattleStore = create<BattleState>()((set, get) => {
  const prepare = (q: Question) => shuffleChoice(questionTransform(q));

  // 新題目的計時：20 秒，專注技能每題再多 5 秒
  const freshTimer = (focus: boolean) => {
    const limit = QUESTION_LIMIT + (focus ? FOCUS_BONUS : 0) + teamTimeBonus(get().party);
    return { questionLimit: limit, questionLeft: limit, overtime: false };
  };

  const loadStage = (stageIdx: number, isFirst = false) => {
    const s = get();
    const golden = s.mode === 'golden';
    if (golden) decks = goldenDecks![goldenTier(stageIdx)];
    else if (s.mode === 'normal') save().setLevelProgress(s.levelKey, stageIdx);
    const stage = s.mode === 'normal' ? withRevenge(s.stages[stageIdx], stageIdx, s.stages.length) : s.stages[stageIdx];
    const stages = s.stages.map((st, i) => (i === stageIdx ? stage : st));
    // 復仇魔王：每答對一題扣固定血量，要把到期的錯題全部答對才會倒下
    const maxHp = stage.revenge
      ? stage.questions.length * BASE_DAMAGE * 2
      : stage.kind === 'treasure'
        ? Math.round(BASE_DAMAGE * TREASURE_HITS * monsterGrowth(stageIdx, s.levelIdx))
        : golden ? goldenMonsterHp(stageIdx, stage)
        : s.mode === 'skill' ? Math.round(BASE_DAMAGE * SKILL_BOSS_HITS * monsterGrowth(25, s.levelIdx))
        : Math.round(monsterMaxHp(stageIdx, s.levelIdx, stage.bossMode) * (stage.kind === 'elite' ? ELITE_HP_MULT : stage.kind === 'final' ? 3 : 1));
    // 區段開頭，或從中途繼續時，先預習這一段的內容
    const showLesson = !golden && s.mode !== 'skill' && (stageIdx % SEGMENT_SIZE === 0 || isFirst) && save().settings.showLessons;
    // 新地圖：combo 與戰績重新計算（combo 只在同一張地圖內延續）
    const newMap = isFirst || (!golden && stageIdx % MAP_SIZE === 0);
    // 每第 5 題是魔王題：剛好輪到這一關的第一題時也要出（之後再出這關準備好的題目）
    const questionCount = s.questionCount + 1;
    const isBossQuestion = !stage.revenge && stage.kind !== 'treasure' && questionCount % BOSS_QUESTION_EVERY === 0;
    const original = isBossQuestion ? (s.mode === 'skill' ? decks!.boss() : pickBossQuestion(null)) : takeEasy(stage) ?? stage.questions[0];
    set({
      ...(newMap ? { combo: 0, bossMult: 1, bossChain: 0, mapStats: emptyRunStats(), mapResult: null } : {}),
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
      treasureLeft: stage.kind === 'treasure' ? TREASURE_TIME : 0,
      phase: showLesson ? 'lesson' : 'answering',
      feedback: null,
      assist: null,
      assistSource: null,
      focus: false,
      ...freshTimer(false),
      casting: null,
      event: nextEvent('stage'),
    });
  };

  // 下一題：每第 5 題是魔王題（復仇魔王、寶箱怪不另外出）；
  // 其他時候先出這一關準備好的題目，出完再從題庫繼續抽
  const nextQuestion = () => {
    const s = get();
    const stage = s.stages[s.stageIdx];
    const questionCount = s.questionCount + 1;
    const isBossQuestion = !stage.revenge && stage.kind !== 'treasure' && questionCount % BOSS_QUESTION_EVERY === 0;
    let qIdx = s.qIdx;
    let original: Question;
    if (isBossQuestion) {
      original = s.mode === 'skill' ? decks!.boss() : pickBossQuestion(s.original);
    } else {
      qIdx += 1;
      original = takeEasy(stage)
        ?? (qIdx < stage.questions.length ? stage.questions[qIdx] : (stage.bossMode ? decks!.boss() : decks!.normal()));
    }
    return {
      qIdx, original, question: prepare(original), questionSeq: s.questionSeq + 1, questionCount, isBossQuestion,
      retrying: false, ...freshTimer(s.focus),
    };
  };

  // 敵人攻擊隨機一位站著的隊員；全滅則戰敗
  const enemyStrike = (party: Member[]) => {
    const s = get();
    const alive = party.map((m, i) => (isAlive(m) ? i : -1)).filter(i => i >= 0);
    const target = alive[Math.floor(random() * alive.length)];
    const damage = monsterAttack(s.stages[s.stageIdx].bossMode, s.levelIdx);
    const hurt = party.map((m, i) => (i === target ? { ...m, hp: Math.max(0, m.hp - damage) } : m));
    const wiped = hurt.every(m => !isAlive(m));
    const knockedOut = isAlive(party[target]) && !isAlive(hurt[target]);
    const attackerIdx = isAlive(hurt[s.attackerIdx] ?? hurt[0]) ? s.attackerIdx : nextAlive(hurt, s.attackerIdx);
    return {
      ...withTotals(hurt),
      attackerIdx: Math.max(0, attackerIdx),
      wiped,
      mapStats: { ...s.mapStats, knockouts: s.mapStats.knockouts + (knockedOut ? 1 : 0) },
      event: nextEvent('hurt', { amount: damage, member: party[target].id }),
    };
  };

  const earn = (amount: number, combo: number) => {
    const comboBonus = Math.min(1, Math.floor(combo / COMBO_GOLD_STEP) * 0.1);
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
    // 地圖最後一關（頭目）：三星評價
    if (stage.bossMode || isLastStage) {
      const merged = { ...s, ...patch };
      const stats = { ...merged.mapStats, hpRatio: merged.playerHp / Math.max(1, merged.playerMaxHp) };
      const stars = evaluateStars(s.levelIdx, stats);
      const mapIdx = mapIndexOf(s.stageIdx);
      const gained = save().recordMapStars(mapKey(s.levelKey, mapIdx), stars);
      patch = { ...patch, mapStats: stats, mapResult: { mapIdx, stars, gained } };
      if (gained > 0 && stars.every(Boolean)) {
        useUiStore.getState().celebrate({ icon: '⭐', title: '三星通關！', sub: `「${regionOf(s.levelKey).maps[mapIdx] ?? ''}」全部條件達成`, color: '#ffcd4b' });
      }
    }
    if (isLastStage) {
      save().unlockLevel(s.levelIdx + 1);
      save().setLevelProgress(s.levelKey, 0); // 全區通關，下次從第 1 關重玩
      set({ ...patch, phase: 'levelClear' });
      return;
    }
    set({ ...patch, phase: stage.bossMode ? 'summary' : 'monsterDown' });
  };

  const onCorrect = () => {
    const s = get();
    if (!s.original || !s.question) return;
    save().recordAnswer(s.original, true, !s.retrying);
    const stage = s.stages[s.stageIdx];
    // 超過 20 秒才答對：這題不累積 combo
    const combo = s.overtime ? 0 : s.combo + 1;
    const elapsed = s.questionLimit - s.questionLeft;
    const speed = s.overtime ? 1 : speedMultiplier(elapsed);

    // 魔王題由隊長出手，其他題目隊伍輪流
    const attackerIdx = s.isBossQuestion ? Math.max(0, leaderIndex(s.party)) : s.attackerIdx;
    const attacker = s.party[attackerIdx];
    const amplify = s.amplifyLeft > 0;
    const bossMult = s.isBossQuestion && !s.overtime ? s.bossMult * bossStep(s.bossChain) * (amplify ? 2 : 1) : s.bossMult;
    const bossChain = s.isBossQuestion && !s.overtime ? s.bossChain + 1 : s.bossChain;
    const crit = random() < attacker.crit;
    const regionScale = xpScale(s.levelIdx);
    let party = gainEnergy(s.party);
    save().trackDaily('correct');
    save().trackDaily('combo', combo);
    const mapStats = {
      ...s.mapStats,
      answered: s.mapStats.answered + 1,
      correct: s.mapStats.correct + 1,
      maxCombo: Math.max(s.mapStats.maxCombo, combo),
      bossQuestionsCorrect: s.mapStats.bossQuestionsCorrect + (s.isBossQuestion && !s.overtime ? 1 : 0),
      correctTimeMs: s.mapStats.correctTimeMs + elapsed,
    };
    // 見習騎士系的被動：每 N combo 得到一次守護
    const guardEvery = teamGuardEvery(party);
    const guardGained = guardEvery > 0 && combo > 0 && combo % guardEvery === 0 && !s.comboGuard;
    const base = {
      mapStats,
      attackerIdx: s.isBossQuestion ? s.attackerIdx : Math.max(0, nextAlive(party, attackerIdx + 1)),
      combo, maxCombo: Math.max(s.maxCombo, combo), bossMult, bossChain,
      amplifyLeft: Math.max(0, s.amplifyLeft - 1),
      answers: [...s.answers, { stageIdx: s.stageIdx, question: s.original, correct: true }],
      wrongStreak: 0, assist: null, assistSource: null, typed: '', isBossQuestion: false,
      ...(guardGained ? { shield: true, comboGuard: true } : {}),
    };

    // 經驗值：每答對一題都有，擊倒另外加；升級時主角能力立刻更新
    const gainXp = (killedKind: 'none' | 'kill' | 'elite' | 'boss') => {
      if (s.mode === 'golden') return { xp: 0, levelUp: undefined };
      const xp = Math.round((XP.correct + (killedKind === 'none' ? 0 : XP[killedKind])) * regionScale);
      const levels = save().gainXp(xp);
      if (levels > 0) {
        party = refreshPlayer(party);
        celebrateLevelUp(save().player.level);
      }
      return { xp, levelUp: levels > 0 ? save().player.level : undefined };
    };

    // 菁英怪：護盾還在時，答對只會削掉一層護盾
    if (s.monsterShield > 0) {
      const monsterShield = s.monsterShield - 1;
      const gold = earn(GOLD.correct, combo);
      const { xp, levelUp } = gainXp('none');
      set({
        ...base, ...withTotals(party), ...nextQuestion(), monsterShield, runGold: s.runGold + gold, runXp: s.runXp + xp,
        event: nextEvent('shieldHit', { amount: monsterShield, member: attacker.id, gold, bossQuestion: s.isBossQuestion, levelUp, guardGained }),
      });
      return;
    }

    // 被動倍率：每關第一擊、隊伍低血量
    const firstHit = s.stageHits === 0 ? 1 + attacker.mods.firstHit : 1;
    const lowHp = s.playerHp / Math.max(1, s.playerMaxHp) < 0.5 ? 1 + attacker.mods.lowHp : 1;
    const em = stage.kind === 'treasure' ? 1 : elementMultiplier(attacker.element, s.monsterElement);
    const damage = stage.revenge
      ? BASE_DAMAGE * 2
      : computeDamage({
        atk: attacker.atk, combo, comboStep: s.stats.comboStep, bossMult, speed, crit, amplify,
        element: em > 1 ? em + attacker.mods.elementBonus : em,
        critMult: 2 + attacker.mods.critDmg,
        extra: firstHit * lowHp,
      });
    const monsterHp = Math.max(0, s.monsterHp - damage);
    const killed = monsterHp <= 0;
    const isLastStage = s.stageIdx + 1 >= s.stages.length;

    let goldBase = stage.kind === 'treasure' ? GOLD.treasureHit : GOLD.correct;
    if (killed) goldBase += stage.revenge ? GOLD.revengeKill : stage.bossMode ? GOLD.bossKill : stage.kind === 'treasure' ? GOLD.treasureOpen : GOLD.kill;
    if (killed && isLastStage) goldBase += GOLD.levelClear;
    const gold = earn(goldBase, combo);
    // 打倒頭目、通關可以拿到召喚券
    const tickets = !killed ? 0 : (stage.revenge ? TICKETS.revengeKill : stage.bossMode ? TICKETS.bossKill : 0) + (isLastStage ? TICKETS.levelClear : 0);
    if (tickets > 0 && s.mode === 'normal') save().addTickets(tickets);

    // 擊倒：經驗值與素材掉落
    const dropKind = stage.bossMode ? 'boss' : stage.kind === 'elite' ? 'elite' : stage.kind === 'treasure' ? 'treasure' : 'normal';
    const { xp, levelUp } = gainXp(!killed ? 'none' : stage.bossMode ? 'boss' : stage.kind === 'elite' ? 'elite' : 'kill');
    const drops = killed && s.mode !== 'golden' ? rollDrops(dropKind, s.monsterElement, random) : {};
    if (killed) save().addMaterials(drops);
    if (killed && stage.bossMode && s.mode !== 'golden') save().trackDaily('boss');

    const common = {
      ...base, ...withTotals(party), monsterHp, runGold: s.runGold + gold, runXp: s.runXp + xp,
      runDrops: mergeDrops(s.runDrops, drops), stageHits: s.stageHits + 1,
      event: nextEvent('attack', {
        amount: damage, gold, crit, fast: speed > 1 ? speed : undefined, member: attacker.id, bossQuestion: s.isBossQuestion,
        levelUp, guardGained, drops: killed ? drops : undefined,
      }),
    };
    if (!killed) {
      set({ ...common, ...nextQuestion() });
      return;
    }
    finishStage(common);
  };

  const onWrong = (given: string, timeout = false) => {
    const s = get();
    if (!s.question || !s.original) return;
    save().recordAnswer(s.original, false, false);
    const guarded = s.comboGuard;
    const stage = s.stages[s.stageIdx];
    const base = {
      combo: guarded ? s.combo : 0,
      bossMult: guarded ? s.bossMult : 1,
      bossChain: guarded ? s.bossChain : 0,
      comboGuard: false,
      // 菁英怪的護盾在答錯時恢復
      monsterShield: stage.kind === 'elite' && s.monsterShield > 0 ? ELITE_SHIELD : s.monsterShield,
      answers: [...s.answers, { stageIdx: s.stageIdx, question: s.original, correct: false }],
      wrongStreak: s.wrongStreak + 1,
      feedback: { question: s.question, given, timeout },
      mapStats: { ...s.mapStats, answered: s.mapStats.answered + 1, bossFlawless: s.mapStats.bossFlawless && !stage.bossMode },
    };

    // 黃金之路：答錯或超時，挑戰立刻結束
    if (s.mode === 'golden') {
      save().recordGolden(s.stageIdx);
      set({ ...base, phase: 'gameOver' });
      return;
    }

    // 護盾（援軍、道具或技能），或不會攻擊的寶箱怪：不受傷
    if (s.shield || stage.kind === 'treasure') {
      set({ ...base, shield: stage.kind === 'treasure' ? s.shield : false, phase: 'feedback', event: nextEvent('shield') });
      return;
    }
    const strike = enemyStrike(s.party);
    set({
      ...base,
      mapStats: { ...base.mapStats, knockouts: strike.mapStats.knockouts },
      ...withTotals(strike.party),
      attackerIdx: strike.attackerIdx,
      event: strike.event,
      phase: strike.wiped ? 'gameOver' : 'feedback',
    });
  };

  const canAnswer = () => get().phase === 'answering' && get().question !== null;

  const applySkill = (skill: SkillId) => {
    const s = get();
    switch (skill) {
      case 'guard': return { shield: true, comboGuard: true };
      case 'haste': return { questionLeft: s.questionLeft + HASTE_BONUS, questionLimit: s.questionLimit + HASTE_BONUS, overtime: false };
      case 'focus': return { focus: true, questionLeft: s.questionLeft + FOCUS_BONUS, questionLimit: s.questionLimit + FOCUS_BONUS, overtime: false };
      case 'amplify': return { amplifyLeft: AMPLIFY_HITS };
    }
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
    maxCombo: 0,
    bossMult: 1,
    bossChain: 0,
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
    focus: false,
    questionLimit: QUESTION_LIMIT,
    questionLeft: QUESTION_LIMIT,
    overtime: false,
    phaseLeft: 0,
    casting: null,
    stats: playerStats({ upgrades: { hp: 0, atk: 0, combo: 0, gold: 0 } }),
    runGold: 0,
    mapStats: emptyRunStats(),
    mapResult: null,
    runXp: 0,
    runDrops: {},
    stageHits: 0,

    startLevel: (levelKey, transform, fromStage) => {
      questionTransform = transform ?? (q => q);
      decks = createDecks(levelKey);
      const { upgrades, party: ids, character, heroes } = save();
      const stats = playerStats({ upgrades });
      const party = buildParty(ids, heroes, character, stats, partyOptions());
      set({
        active: true, mode: 'normal', skillBoss: null, levelKey, levelIdx: Math.max(0, LEVELS.indexOf(levelKey)), stages: generateStages(levelKey, decks),
        combo: 0, maxCombo: 0, bossMult: 1, bossChain: 0, questionCount: 0,
        stats, ...withTotals(party), attackerIdx: 0,
        answers: [], wrongStreak: 0, shield: false, comboGuard: false, amplifyLeft: 0, runGold: 0, runXp: 0, runDrops: {},
      });
      const saved = save().levelProgress[levelKey] ?? 0;
      const start = Math.min(Math.max(0, fromStage ?? saved), get().stages.length - 1);
      // 人生第一場戰鬥（圖鑑還是空的）：前幾題從題庫挑最簡單的
      easyQueue = Object.keys(save().codex).length === 0
        ? easeOrder(Array.from({ length: 12 }, () => decks!.normal())).slice(0, EASY_START)
        : [];
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
        combo: 0, maxCombo: 0, bossMult: 1, bossChain: 0, questionCount: 0,
        stats, ...withTotals(party), attackerIdx: 0,
        answers: [], wrongStreak: 0, shield: false, comboGuard: false, amplifyLeft: 0, runGold: 0, runXp: 0, runDrops: {},
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
      const questions = shuffleArray(skillBossQuestions(id, reachablePool(unlockedIndex)));
      let i = 0;
      const draw = () => questions[i++ % questions.length];
      decks = { normal: draw, boss: draw };
      const stats = playerStats({ upgrades });
      const party = buildParty(ids, heroes, character, stats, partyOptions());
      set({
        active: true, mode: 'skill', skillBoss: id, levelKey: `skill-${id}`, levelIdx,
        stages: [{ name: def.name, bossMode: true, kind: 'final', questions: [draw()] }],
        combo: 0, maxCombo: 0, bossMult: 1, bossChain: 0, questionCount: 0,
        stats, ...withTotals(party), attackerIdx: 0,
        answers: [], wrongStreak: 0, shield: false, comboGuard: false, amplifyLeft: 0, runGold: 0, runXp: 0, runDrops: {},
      });
      loadStage(0, true);
    },

    // 預習結束（或跳過）開始作答；questionSeq +1 讓介面播放題目發音
    startBattle: () => {
      const s = get();
      if (s.phase !== 'lesson') return;
      set({ phase: 'answering', questionSeq: s.questionSeq + 1, ...freshTimer(s.focus) });
    },

    openLesson: () => {
      if (get().phase !== 'answering') return;
      set({ phase: 'lesson' });
    },

    // 由介面定時呼叫。只有作答與施法確認時計時，其他畫面（預習、解說、結算）都暫停
    tick: (ms) => {
      const s = get();
      if (!s.active || ms <= 0) return;
      if (s.phase === 'answering') {
        // 寶箱怪：時間到就帶著寶物逃走
        if (s.treasureLeft > 0) {
          const treasureLeft = s.treasureLeft - ms;
          if (treasureLeft <= 0) {
            finishStage({ treasureLeft: 0, event: nextEvent('escape') });
            return;
          }
          set({ treasureLeft });
        }
        if (s.overtime) return;
        const questionLeft = Math.max(0, s.questionLeft - ms);
        if (questionLeft > 0) { set({ questionLeft }); return; }
        if (s.mode !== 'golden' && isLenientStage(s.stageIdx)) {
          // 前 25 關：超時不算答錯，只是 combo 中斷，繼續作答同一題
          set({ questionLeft: 0, overtime: true, combo: 0, bossMult: 1, bossChain: 0, event: nextEvent('overtime') });
        } else {
          set({ questionLeft: 0 });
          onWrong('', true);
        }
      } else if (s.phase === 'casting') {
        const phaseLeft = s.phaseLeft - ms;
        if (phaseLeft > 0) set({ phaseLeft });
        else get().cancelSkill();
      }
    },

    inputLetter: (letter) => {
      const { question, typed } = get();
      if (!canAnswer() || !question || (question.type !== 'spell' && question.type !== 'fill')) return;
      const result = applyLetter(question, typed, letter);
      if (result.status === 'wrong') return onWrong(typed + letter.toUpperCase());
      set({ typed: result.typed });
      if (result.status === 'correct') onCorrect();
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

    submitVoice: (transcript) => {
      const { question } = get();
      if (!canAnswer() || !question || question.type !== 'voice') return;
      if (checkVoice(question, transcript)) return onCorrect();
      onWrong(transcript);
    },

    // 看完正確答案後，同一題重新作答一次（選項重新洗牌，避免只記位置）。
    // 連續答錯達門檻時，援軍登場：給提示並附上一次護盾
    continueAfterFeedback: () => {
      const s = get();
      if (s.phase !== 'feedback' || !s.original) return;
      const question = prepare(s.original);
      const base = {
        phase: 'answering' as const, feedback: null, question, questionSeq: s.questionSeq + 1, retrying: true,
        isBossQuestion: false, ...freshTimer(s.focus),
      };
      if (s.wrongStreak >= ASSIST_STREAK) {
        const assist = buildAssist(question);
        set({ ...base, assist, assistSource: 'helper', typed: assist.revealed, wrongStreak: 0, shield: true, event: nextEvent('assist') });
        return;
      }
      set({ ...base, typed: '', assist: null, assistSource: null });
    },

    // 點隊員頭像：能量滿時打開 5 秒確認視窗（計時暫停）
    requestSkill: (memberIdx) => {
      const s = get();
      const m = s.party[memberIdx];
      if (s.phase !== 'answering' || !m || !skillReady(m)) return;
      set({ phase: 'casting', casting: memberIdx, phaseLeft: CAST_CONFIRM_TIME });
    },

    confirmSkill: () => {
      const s = get();
      if (s.phase !== 'casting' || s.casting === null) return;
      const m = s.party[s.casting];
      const party = s.party.map((p, i) => (i === s.casting ? { ...p, energy: 0 } : p));
      set({
        phase: 'answering', casting: null, phaseLeft: 0, party, ...applySkill(m.skill),
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
        set({ shield: true, event: nextEvent('guard') });
      } else {
        if (s.assist) return;
        const assist = buildAssist(s.question);
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

    exitToMap: () => set({ active: false, question: null }),
  };
});
