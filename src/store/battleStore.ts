import { create } from 'zustand';
import type { Question, Stage } from '../game/types';
import { LEVELS, createDecks, generateStages } from '../game/QuestionData';
import type { Decks } from '../game/QuestionData';
import {
  ASSIST_STREAK, BASE_DAMAGE, CAST_CONFIRM_TIME, ENEMY_TURN_TIME, TURN_TIME,
  applyLetter, buildAssist, checkChoice, checkVoice, questionKey, questionTime, shuffleChoice, timeScale,
} from '../game/battle';
import type { Assist } from '../game/battle';
import { SEGMENT_SIZE } from '../game/lesson';
import type { AnswerRecord } from '../game/lesson';
import {
  BOSS_QUESTION_EVERY, GOLD, POTION_HEAL, bossStep, computeDamage,
  goldWithBonus, monsterAttack, monsterElement, monsterMaxHp, playerStats,
} from '../game/progression';
import type { ItemId, PlayerStats, SkillId } from '../game/progression';
import { elementMultiplier } from '../game/character';
import type { Element } from '../game/character';
import { buildParty, gainEnergy, isAlive, leaderIndex, nextAlive, partyHp, skillReady } from '../game/party';
import type { Member, MemberId } from '../game/party';
import { dueMistakes, useSaveStore } from './saveStore';

// 戰鬥進行中的狀態（不存檔）。React 負責作答介面與計時（呼叫 tick），Phaser 訂閱 event 播放動畫。
//
// 回合制：每回合 TURN_TIME 內可以連續作答，每題有自己的時限。
// 答錯、超時 → 敵人攻擊並顯示正確答案；回合時間用完 → 敵人攻擊後開始新回合。

// lesson：戰前預習；enemyTurn：敵人攻擊的短暫停頓；casting：技能施放確認（計時暫停）；summary：Boss 後的區段結算
export type BattlePhase =
  | 'lesson' | 'answering' | 'enemyTurn' | 'casting' | 'feedback'
  | 'monsterDown' | 'summary' | 'levelClear' | 'gameOver';

export interface BattleEvent {
  id: number;
  kind: 'attack' | 'hurt' | 'stage' | 'assist' | 'shield' | 'heal' | 'guard' | 'skill';
  amount?: number;
  gold?: number;
  crit?: boolean;
  member?: MemberId;       // 出手或受傷的隊員
  bossQuestion?: boolean;  // 這一擊來自魔王題
  skill?: SkillId;
  turnEnd?: boolean;       // 回合時間到的敵人攻擊（不是答錯）
}

export interface Feedback {
  question: Question;
  given: string;
  timeout: boolean;
}

export const REVENGE_MAX_QUESTIONS = 5;
export const FOCUS_BONUS = 3_000;
export const HASTE_BONUS = 5_000;
export const COMBO_GOLD_STEP = 10; // 每 10 combo 金幣 +10%，最多 +100%

interface BattleState {
  active: boolean;
  levelKey: string;
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
  phase: BattlePhase;
  feedback: Feedback | null;
  event: BattleEvent | null;
  answers: AnswerRecord[];
  wrongStreak: number;
  assist: Assist | null;
  assistSource: 'helper' | 'item' | null;
  shield: boolean;
  comboGuard: boolean; // 守護之盾：下一次答錯不中斷 combo
  amplify: boolean;    // 魔力增幅：這回合傷害翻倍
  focus: boolean;      // 專注：這回合每題多 3 秒
  timeScale: number;
  turnLimit: number;
  turnLeft: number;
  questionLimit: number;
  questionLeft: number;
  phaseLeft: number;   // enemyTurn／casting 剩餘時間
  casting: number | null; // 正在確認施放技能的隊員
  stats: PlayerStats;
  runGold: number;

  // fromStage 未指定時，從存檔記錄的進度繼續
  startLevel: (levelKey: string, transform?: (q: Question) => Question, fromStage?: number) => void;
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
// 暴擊與敵人攻擊目標用的亂數（測試可替換）
let random: () => number = Math.random;
export const setBattleRandom = (fn: () => number) => { random = fn; };

const save = () => useSaveStore.getState();

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

const withTotals = (party: Member[]) => {
  const { hp, maxHp } = partyHp(party);
  return { party, playerHp: hp, playerMaxHp: maxHp };
};

export const useBattleStore = create<BattleState>()((set, get) => {
  const prepare = (q: Question) => shuffleChoice(questionTransform(q));

  // 題目時限：依題目長度、新手緩衝、專注技能
  const limitFor = (q: Question, focus: boolean, scale: number) => questionTime(q) * scale + (focus ? FOCUS_BONUS : 0);

  // 新回合：時間重置、回合限定的技能效果結束
  const freshTurn = (scale: number) => ({
    turnLimit: TURN_TIME * scale, turnLeft: TURN_TIME * scale, amplify: false, focus: false,
  });

  const loadStage = (stageIdx: number, isFirst = false) => {
    const s = get();
    save().setLevelProgress(s.levelKey, stageIdx);
    const stage = withRevenge(s.stages[stageIdx], stageIdx, s.stages.length);
    const stages = s.stages.map((st, i) => (i === stageIdx ? stage : st));
    // 復仇魔王：每答對一題扣固定血量，要把到期的錯題全部答對才會倒下
    const maxHp = stage.revenge
      ? stage.questions.length * BASE_DAMAGE * 2
      : monsterMaxHp(stageIdx, s.levelIdx, stage.bossMode);
    // 區段開頭，或從中途繼續時，先預習這一段的內容
    const showLesson = (stageIdx % SEGMENT_SIZE === 0 || isFirst) && save().settings.showLessons;
    const original = stage.questions[0];
    const question = prepare(original);
    const scale = timeScale(s.levelIdx, stageIdx);
    const limit = limitFor(question, false, scale);
    set({
      stages,
      stageIdx,
      qIdx: 0,
      original,
      question,
      questionSeq: s.questionSeq + 1,
      questionCount: s.questionCount + 1,
      isBossQuestion: false,
      typed: '',
      retrying: false,
      monsterHp: maxHp,
      monsterMaxHp: maxHp,
      monsterElement: monsterElement(stageIdx, s.levelIdx, stage.revenge),
      phase: showLesson ? 'lesson' : 'answering',
      feedback: null,
      assist: null,
      assistSource: null,
      timeScale: scale,
      ...freshTurn(scale),
      questionLimit: limit,
      questionLeft: limit,
      casting: null,
      event: nextEvent('stage'),
    });
  };

  // 下一題：每第 5 題是魔王題（復仇魔王關卡本身就是錯題，不另外出）；
  // 其他時候先出這一關準備好的題目，出完再從題庫繼續抽
  const nextQuestion = (focus: boolean) => {
    const s = get();
    const stage = s.stages[s.stageIdx];
    const questionCount = s.questionCount + 1;
    const isBossQuestion = !stage.revenge && questionCount % BOSS_QUESTION_EVERY === 0;
    let qIdx = s.qIdx;
    let original: Question;
    if (isBossQuestion) {
      original = pickBossQuestion(s.original);
    } else {
      qIdx += 1;
      original = qIdx < stage.questions.length
        ? stage.questions[qIdx]
        : (stage.bossMode ? decks!.boss() : decks!.normal());
    }
    const question = prepare(original);
    const limit = limitFor(question, focus, s.timeScale);
    return {
      qIdx, original, question, questionSeq: s.questionSeq + 1, questionCount, isBossQuestion,
      retrying: false, questionLimit: limit, questionLeft: limit,
    };
  };

  // 敵人攻擊隨機一位站著的隊員；全滅則戰敗
  const enemyStrike = (party: Member[], turnEnd: boolean) => {
    const s = get();
    const alive = party.map((m, i) => (isAlive(m) ? i : -1)).filter(i => i >= 0);
    const target = alive[Math.floor(random() * alive.length)];
    const damage = monsterAttack(s.stages[s.stageIdx].bossMode, s.levelIdx);
    const hurt = party.map((m, i) => (i === target ? { ...m, hp: Math.max(0, m.hp - damage) } : m));
    const wiped = hurt.every(m => !isAlive(m));
    const attackerIdx = isAlive(hurt[s.attackerIdx] ?? hurt[0]) ? s.attackerIdx : nextAlive(hurt, s.attackerIdx);
    return {
      ...withTotals(hurt),
      attackerIdx: Math.max(0, attackerIdx),
      wiped,
      event: nextEvent('hurt', { amount: damage, member: party[target].id, turnEnd }),
    };
  };

  const earn = (amount: number, combo: number) => {
    const comboBonus = Math.min(1, Math.floor(combo / COMBO_GOLD_STEP) * 0.1);
    const gold = goldWithBonus(Math.round(amount * (1 + comboBonus)), get().stats);
    save().addGold(gold);
    return gold;
  };

  const onCorrect = () => {
    const s = get();
    if (!s.original || !s.question) return;
    save().recordAnswer(s.original, true, !s.retrying);
    const stage = s.stages[s.stageIdx];
    const combo = s.combo + 1;

    // 魔王題由隊長出手，其他題目隊伍輪流
    const attackerIdx = s.isBossQuestion ? Math.max(0, leaderIndex(s.party)) : s.attackerIdx;
    const attacker = s.party[attackerIdx];
    const bossMult = s.isBossQuestion ? s.bossMult * bossStep(s.bossChain) * (s.amplify ? 2 : 1) : s.bossMult;
    const bossChain = s.isBossQuestion ? s.bossChain + 1 : s.bossChain;
    const crit = random() < attacker.crit;
    const damage = stage.revenge
      ? BASE_DAMAGE * 2
      : computeDamage({
        atk: attacker.atk, combo, comboStep: s.stats.comboStep, bossMult,
        element: elementMultiplier(attacker.element, s.monsterElement), amplify: s.amplify, crit,
      });
    const monsterHp = Math.max(0, s.monsterHp - damage);
    const killed = monsterHp <= 0;
    const isLastStage = s.stageIdx + 1 >= s.stages.length;

    let goldBase = GOLD.correct;
    if (killed) goldBase += stage.revenge ? GOLD.revengeKill : stage.bossMode ? GOLD.bossKill : GOLD.kill;
    if (killed && isLastStage) goldBase += GOLD.levelClear;
    const gold = earn(goldBase, combo);

    const party = gainEnergy(s.party);
    const common = {
      ...withTotals(party),
      attackerIdx: s.isBossQuestion ? s.attackerIdx : Math.max(0, nextAlive(party, attackerIdx + 1)),
      combo, maxCombo: Math.max(s.maxCombo, combo), monsterHp, bossMult, bossChain,
      answers: [...s.answers, { stageIdx: s.stageIdx, question: s.original, correct: true }],
      wrongStreak: 0, assist: null, assistSource: null, typed: '', isBossQuestion: false,
      runGold: s.runGold + gold,
      event: nextEvent('attack', { amount: damage, gold, crit, member: attacker.id, bossQuestion: s.isBossQuestion }),
    };

    if (!killed) {
      // 回合時間用完：敵人攻擊，停頓一下再開新回合
      if (s.turnLeft <= 0) {
        set({ ...common, ...nextQuestion(false) });
        const strike = enemyStrike(get().party, true);
        set({ ...withTotals(strike.party), attackerIdx: strike.attackerIdx, event: strike.event, phase: strike.wiped ? 'gameOver' : 'enemyTurn', phaseLeft: ENEMY_TURN_TIME });
        return;
      }
      set({ ...common, ...nextQuestion(s.focus) });
      return;
    }
    if (isLastStage) {
      save().unlockLevel(s.levelIdx + 1);
      save().setLevelProgress(s.levelKey, 0); // 全區通關，下次從第 1 關重玩
      set({ ...common, phase: 'levelClear' });
      return;
    }
    set({ ...common, phase: stage.bossMode ? 'summary' : 'monsterDown' });
  };

  const onWrong = (given: string, timeout = false) => {
    const s = get();
    if (!s.question || !s.original) return;
    save().recordAnswer(s.original, false, false);
    const guarded = s.comboGuard;
    const base = {
      combo: guarded ? s.combo : 0,
      bossMult: guarded ? s.bossMult : 1,
      bossChain: guarded ? s.bossChain : 0,
      comboGuard: false,
      answers: [...s.answers, { stageIdx: s.stageIdx, question: s.original, correct: false }],
      wrongStreak: s.wrongStreak + 1,
      feedback: { question: s.question, given, timeout },
    };

    // 護盾（援軍、道具或技能）：擋下這次傷害
    if (s.shield) {
      set({ ...base, shield: false, phase: 'feedback', event: nextEvent('shield') });
      return;
    }
    const strike = enemyStrike(s.party, false);
    set({
      ...base,
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
      case 'haste': return { turnLeft: s.turnLeft + HASTE_BONUS, turnLimit: s.turnLimit + HASTE_BONUS };
      case 'focus': return { focus: true, questionLeft: s.questionLeft + FOCUS_BONUS, questionLimit: s.questionLimit + FOCUS_BONUS };
      case 'amplify': return { amplify: true };
    }
  };

  return {
    active: false,
    levelKey: '',
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
    phase: 'answering',
    feedback: null,
    event: null,
    answers: [],
    wrongStreak: 0,
    assist: null,
    assistSource: null,
    shield: false,
    comboGuard: false,
    amplify: false,
    focus: false,
    timeScale: 1,
    turnLimit: TURN_TIME,
    turnLeft: TURN_TIME,
    questionLimit: 0,
    questionLeft: 0,
    phaseLeft: 0,
    casting: null,
    stats: playerStats({ upgrades: { hp: 0, atk: 0, combo: 0, gold: 0 } }),
    runGold: 0,

    startLevel: (levelKey, transform, fromStage) => {
      questionTransform = transform ?? (q => q);
      decks = createDecks(levelKey);
      const { upgrades, party: ids, character } = save();
      const stats = playerStats({ upgrades });
      const party = buildParty(ids, character, stats);
      set({
        active: true, levelKey, levelIdx: Math.max(0, LEVELS.indexOf(levelKey)), stages: generateStages(levelKey, decks),
        combo: 0, maxCombo: 0, bossMult: 1, bossChain: 0, questionCount: 0,
        stats, ...withTotals(party), attackerIdx: 0,
        answers: [], wrongStreak: 0, shield: false, comboGuard: false, runGold: 0,
      });
      const saved = save().levelProgress[levelKey] ?? 0;
      const start = Math.min(Math.max(0, fromStage ?? saved), get().stages.length - 1);
      loadStage(start, true);
    },

    // 預習結束（或跳過）開始作答；questionSeq +1 讓介面播放題目發音
    startBattle: () => {
      const s = get();
      if (s.phase !== 'lesson') return;
      const limit = limitFor(s.question!, false, s.timeScale);
      set({ phase: 'answering', questionSeq: s.questionSeq + 1, ...freshTurn(s.timeScale), questionLimit: limit, questionLeft: limit });
    },

    openLesson: () => {
      if (get().phase !== 'answering') return;
      set({ phase: 'lesson' });
    },

    // 由介面每一幀呼叫。只有作答、敵人回合、施法確認時會計時，其他畫面（預習、解說、結算）都暫停
    tick: (ms) => {
      const s = get();
      if (!s.active || ms <= 0) return;
      if (s.phase === 'answering') {
        const questionLeft = s.questionLeft - ms;
        set({ turnLeft: s.turnLeft - ms, questionLeft });
        if (questionLeft <= 0) onWrong('', true);
      } else if (s.phase === 'enemyTurn') {
        const phaseLeft = s.phaseLeft - ms;
        if (phaseLeft > 0) { set({ phaseLeft }); return; }
        const limit = limitFor(s.question!, false, s.timeScale);
        set({ phase: 'answering', phaseLeft: 0, ...freshTurn(s.timeScale), questionLimit: limit, questionLeft: limit, questionSeq: s.questionSeq + 1 });
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

    // 看完正確答案後開新回合，同一題重新作答一次（選項重新洗牌，避免只記位置）。
    // 連續答錯達門檻時，援軍登場：給提示並附上一次護盾
    continueAfterFeedback: () => {
      const s = get();
      if (s.phase !== 'feedback' || !s.original) return;
      const question = prepare(s.original);
      const limit = limitFor(question, false, s.timeScale);
      const base = {
        phase: 'answering' as const, feedback: null, question, questionSeq: s.questionSeq + 1, retrying: true,
        isBossQuestion: false, ...freshTurn(s.timeScale), questionLimit: limit, questionLeft: limit,
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
    retryLevel: () => get().startLevel(get().levelKey, questionTransform, get().stageIdx),

    exitToMap: () => set({ active: false, question: null }),
  };
});
