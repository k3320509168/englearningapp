import { create } from 'zustand';
import type { Question, Stage } from '../game/types';
import { LEVELS, createDecks, generateStages } from '../game/QuestionData';
import type { Decks } from '../game/QuestionData';
import {
  ASSIST_STREAK, BASE_DAMAGE,
  applyLetter, buildAssist, checkChoice, checkVoice, shuffleChoice,
} from '../game/battle';
import type { Assist } from '../game/battle';
import { SEGMENT_SIZE } from '../game/lesson';
import type { AnswerRecord } from '../game/lesson';
import {
  GOLD, POTION_HEAL, comboAfterWrong, computeDamage,
  goldWithBonus, monsterAttack, monsterMaxHp, playerStats,
} from '../game/progression';
import type { HeroId, ItemId, PlayerStats } from '../game/progression';
import { dueMistakes, useSaveStore } from './saveStore';

// 戰鬥進行中的狀態（不存檔）。React 負責作答介面，Phaser 訂閱 event 播放動畫。

// lesson：戰前預習；summary：Boss 後的區段結算
export type BattlePhase = 'lesson' | 'answering' | 'feedback' | 'monsterDown' | 'summary' | 'levelClear' | 'gameOver';

export interface BattleEvent {
  id: number;
  kind: 'attack' | 'hurt' | 'stage' | 'assist' | 'shield' | 'heal' | 'guard';
  amount?: number;
  gold?: number;
}

export interface Feedback {
  question: Question;
  given: string;
}

export const REVENGE_MAX_QUESTIONS = 5;

interface BattleState {
  active: boolean;
  levelKey: string;
  stages: Stage[];
  stageIdx: number;
  qIdx: number;
  original: Question | null; // 題庫中的原題（未洗牌），用於紀錄與重答
  question: Question | null; // 顯示用（選項已洗牌）
  questionSeq: number;
  typed: string;
  retrying: boolean; // 看完正確答案後的重答，不算 SRS 複習
  combo: number;
  maxCombo: number;
  playerHp: number;
  playerMaxHp: number;
  monsterHp: number;
  monsterMaxHp: number;
  phase: BattlePhase;
  feedback: Feedback | null;
  event: BattleEvent | null;
  answers: AnswerRecord[];
  wrongStreak: number;
  assist: Assist | null;
  assistSource: 'helper' | 'item' | null;
  shield: boolean;
  stats: PlayerStats;
  hero: HeroId;
  runGold: number;

  startLevel: (levelKey: string, transform?: (q: Question) => Question) => void;
  startBattle: () => void;
  openLesson: () => void;
  inputLetter: (letter: string) => void;
  backspace: () => void;
  chooseOption: (letter: string) => void;
  submitVoice: (transcript: string) => void;
  continueAfterFeedback: () => void;
  consumeItem: (id: ItemId) => void;
  nextStage: () => void;
  retryLevel: () => void;
  exitToMap: () => void;
}

let eventId = 0;
const nextEvent = (kind: BattleEvent['kind'], amount?: number, gold?: number): BattleEvent => ({ id: ++eventId, kind, amount, gold });

// 開始關卡時可傳入題目轉換（例如不支援語音辨識時把語音題改成拼寫題）
let questionTransform: (q: Question) => Question = q => q;
let decks: Decks | null = null;

const save = () => useSaveStore.getState();

// 第 10、20、30、40 關：如果有到期的錯題，守門 Boss 換成「復仇魔王」
function withRevenge(stage: Stage, stageIdx: number, stageCount: number): Stage {
  const isFinal = stageIdx === stageCount - 1;
  if (!stage.bossMode || isFinal) return stage;
  const due = dueMistakes(save().mistakes, Date.now(), REVENGE_MAX_QUESTIONS);
  if (due.length === 0) return stage;
  return { name: `第 ${stageIdx + 1} 關：復仇魔王`, bossMode: true, revenge: true, questions: due.map(m => m.question) };
}

export const useBattleStore = create<BattleState>()((set, get) => {
  const prepare = (q: Question) => shuffleChoice(questionTransform(q));

  const loadStage = (stageIdx: number) => {
    const s = get();
    const stage = withRevenge(s.stages[stageIdx], stageIdx, s.stages.length);
    const stages = s.stages.map((st, i) => (i === stageIdx ? stage : st));
    // 復仇魔王：每答對一題扣固定血量，要把到期的錯題全部答對才會倒下
    const maxHp = stage.revenge
      ? stage.questions.length * BASE_DAMAGE * 2
      : monsterMaxHp(stageIdx, LEVELS.indexOf(s.levelKey), stage.bossMode);
    const showLesson = stageIdx % SEGMENT_SIZE === 0 && save().settings.showLessons;
    const original = stage.questions[0];
    set({
      stages,
      stageIdx,
      qIdx: 0,
      original,
      question: prepare(original),
      questionSeq: s.questionSeq + 1,
      typed: '',
      retrying: false,
      monsterHp: maxHp,
      monsterMaxHp: maxHp,
      phase: showLesson ? 'lesson' : 'answering',
      feedback: null,
      assist: null,
      assistSource: null,
      event: nextEvent('stage'),
    });
  };

  // 怪物還沒倒下：先出這一關準備好的題目，出完再從題庫繼續抽
  const nextQuestion = () => {
    const s = get();
    const stage = s.stages[s.stageIdx];
    const qIdx = s.qIdx + 1;
    const original = qIdx < stage.questions.length
      ? stage.questions[qIdx]
      : (stage.bossMode ? decks!.boss() : decks!.normal());
    return { qIdx, original, question: prepare(original), questionSeq: s.questionSeq + 1, retrying: false };
  };

  const earn = (amount: number) => {
    const s = get();
    const gold = goldWithBonus(amount, s.stats);
    save().addGold(gold);
    return gold;
  };

  const onCorrect = () => {
    const s = get();
    if (!s.original || !s.question) return;
    save().recordAnswer(s.original, true, !s.retrying);
    const stage = s.stages[s.stageIdx];
    const combo = s.combo + 1;
    const damage = stage.revenge ? BASE_DAMAGE * 2 : computeDamage(s.question, combo, s.stats, s.hero);
    const monsterHp = Math.max(0, s.monsterHp - damage);
    const killed = monsterHp <= 0;
    const isLastStage = s.stageIdx + 1 >= s.stages.length;

    let goldBase = GOLD.correct;
    if (killed) goldBase += stage.revenge ? GOLD.revengeKill : stage.bossMode ? GOLD.bossKill : GOLD.kill;
    if (killed && isLastStage) goldBase += GOLD.levelClear;
    const gold = earn(goldBase);

    const common = {
      combo, maxCombo: Math.max(s.maxCombo, combo), monsterHp,
      answers: [...s.answers, { stageIdx: s.stageIdx, question: s.original, correct: true }],
      wrongStreak: 0, assist: null, assistSource: null, typed: '',
      runGold: s.runGold + gold, event: nextEvent('attack', damage, gold),
    };

    if (!killed) {
      set({ ...common, ...nextQuestion() });
      return;
    }
    if (isLastStage) {
      save().unlockLevel(LEVELS.indexOf(s.levelKey) + 1);
      set({ ...common, phase: 'levelClear' });
      return;
    }
    set({ ...common, phase: stage.bossMode ? 'summary' : 'monsterDown' });
  };

  const onWrong = (given: string) => {
    const s = get();
    if (!s.question || !s.original) return;
    save().recordAnswer(s.original, false, false);
    const base = {
      combo: comboAfterWrong(s.question, s.combo, s.hero),
      answers: [...s.answers, { stageIdx: s.stageIdx, question: s.original, correct: false }],
      wrongStreak: s.wrongStreak + 1,
      feedback: { question: s.question, given },
    };

    // 護盾（援軍或道具）：擋下這次傷害
    if (s.shield) {
      set({ ...base, shield: false, phase: 'feedback', event: nextEvent('shield') });
      return;
    }
    const damage = monsterAttack(s.stages[s.stageIdx].bossMode);
    const playerHp = Math.max(0, s.playerHp - damage);
    set({
      ...base,
      playerHp,
      event: nextEvent('hurt', damage),
      phase: playerHp <= 0 ? 'gameOver' : 'feedback',
    });
  };

  const canAnswer = () => get().phase === 'answering' && get().question !== null;

  return {
    active: false,
    levelKey: '',
    stages: [],
    stageIdx: 0,
    qIdx: 0,
    original: null,
    question: null,
    questionSeq: 0,
    typed: '',
    retrying: false,
    combo: 0,
    maxCombo: 0,
    playerHp: 0,
    playerMaxHp: 0,
    monsterHp: 0,
    monsterMaxHp: 0,
    phase: 'answering',
    feedback: null,
    event: null,
    answers: [],
    wrongStreak: 0,
    assist: null,
    assistSource: null,
    shield: false,
    stats: playerStats({ upgrades: { hp: 0, atk: 0, combo: 0, gold: 0 }, hero: 'knight' }),
    hero: 'knight',
    runGold: 0,

    startLevel: (levelKey, transform) => {
      questionTransform = transform ?? (q => q);
      decks = createDecks(levelKey);
      const { upgrades, hero } = save();
      const stats = playerStats({ upgrades, hero });
      set({
        active: true, levelKey, stages: generateStages(levelKey, decks), combo: 0, maxCombo: 0,
        stats, hero, playerHp: stats.maxHp, playerMaxHp: stats.maxHp,
        answers: [], wrongStreak: 0, shield: false, runGold: 0,
      });
      loadStage(0);
    },

    // 預習結束（或跳過）開始作答；questionSeq +1 讓介面播放題目發音
    startBattle: () => {
      if (get().phase !== 'lesson') return;
      set(s => ({ phase: 'answering', questionSeq: s.questionSeq + 1 }));
    },

    openLesson: () => {
      if (get().phase !== 'answering') return;
      set({ phase: 'lesson' });
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
      const base = { phase: 'answering' as const, feedback: null, question, questionSeq: s.questionSeq + 1, retrying: true };
      if (s.wrongStreak >= ASSIST_STREAK) {
        const assist = buildAssist(question);
        set({ ...base, assist, assistSource: 'helper', typed: assist.revealed, wrongStreak: 0, shield: true, event: nextEvent('assist') });
        return;
      }
      set({ ...base, typed: '', assist: null, assistSource: null });
    },

    consumeItem: (id) => {
      const s = get();
      if (!canAnswer() || !s.question) return;
      if (id === 'potion') {
        if (s.playerHp >= s.playerMaxHp || !save().consumeItem('potion')) return;
        const healed = Math.min(s.playerMaxHp, s.playerHp + POTION_HEAL);
        set({ playerHp: healed, event: nextEvent('heal', healed - s.playerHp) });
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

    retryLevel: () => get().startLevel(get().levelKey, questionTransform),

    exitToMap: () => set({ active: false, question: null }),
  };
});
