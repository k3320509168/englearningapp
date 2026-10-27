import { create } from 'zustand';
import type { Question, Stage } from '../game/types';
import { LEVELS, generateStages } from '../game/QuestionData';
import {
  BASE_DAMAGE, PLAYER_MAX_HP, WRONG_ANSWER_DAMAGE,
  applyLetter, attackDamage, checkChoice, checkVoice, shuffleChoice,
} from '../game/battle';
import { useSaveStore } from './saveStore';

// 戰鬥進行中的狀態（不存檔）。React 負責作答介面，Phaser 訂閱 event 播放動畫。

export type BattlePhase = 'answering' | 'feedback' | 'monsterDown' | 'levelClear' | 'gameOver';

export interface BattleEvent {
  id: number;
  kind: 'attack' | 'hurt' | 'stage';
  amount?: number;
}

export interface Feedback {
  question: Question;
  given: string;
}

interface BattleState {
  active: boolean;
  levelKey: string;
  stages: Stage[];
  stageIdx: number;
  qIdx: number;
  question: Question | null;
  questionSeq: number;
  typed: string;
  combo: number;
  playerHp: number;
  monsterHp: number;
  monsterMaxHp: number;
  phase: BattlePhase;
  feedback: Feedback | null;
  event: BattleEvent | null;

  startLevel: (levelKey: string, transform?: (q: Question) => Question) => void;
  inputLetter: (letter: string) => void;
  backspace: () => void;
  chooseOption: (letter: string) => void;
  submitVoice: (transcript: string) => void;
  continueAfterFeedback: () => void;
  nextStage: () => void;
  retryLevel: () => void;
  exitToMap: () => void;
}

let eventId = 0;
const nextEvent = (kind: BattleEvent['kind'], amount?: number): BattleEvent => ({ id: ++eventId, kind, amount });

// 開始關卡時可傳入題目轉換（例如不支援語音辨識時把語音題改成拼寫題）
let questionTransform: (q: Question) => Question = q => q;

export const useBattleStore = create<BattleState>()((set, get) => {
  const prepare = (q: Question) => shuffleChoice(questionTransform(q));

  const loadStage = (stages: Stage[], stageIdx: number) => {
    const stage = stages[stageIdx];
    const maxHp = stage.questions.length * BASE_DAMAGE;
    set(s => ({
      stageIdx,
      qIdx: 0,
      question: prepare(stage.questions[0]),
      questionSeq: s.questionSeq + 1,
      typed: '',
      monsterHp: maxHp,
      monsterMaxHp: maxHp,
      phase: 'answering',
      feedback: null,
      event: nextEvent('stage'),
    }));
  };

  const onCorrect = () => {
    const s = get();
    const combo = s.combo + 1;
    const damage = attackDamage(combo);
    const monsterHp = Math.max(0, s.monsterHp - damage);
    const event = nextEvent('attack', damage);

    if (monsterHp > 0) {
      const questions = s.stages[s.stageIdx].questions;
      const qIdx = (s.qIdx + 1) % questions.length;
      set({ combo, monsterHp, event, qIdx, question: prepare(questions[qIdx]), questionSeq: s.questionSeq + 1, typed: '' });
      return;
    }
    const isLastStage = s.stageIdx + 1 >= s.stages.length;
    if (isLastStage) useSaveStore.getState().unlockLevel(LEVELS.indexOf(s.levelKey) + 1);
    set({ combo, monsterHp, event, typed: '', phase: isLastStage ? 'levelClear' : 'monsterDown' });
  };

  const onWrong = (given: string) => {
    const s = get();
    if (!s.question) return;
    useSaveStore.getState().recordMistake(s.question);
    const playerHp = Math.max(0, s.playerHp - WRONG_ANSWER_DAMAGE);
    set({
      combo: 0,
      playerHp,
      event: nextEvent('hurt', WRONG_ANSWER_DAMAGE),
      phase: playerHp <= 0 ? 'gameOver' : 'feedback',
      feedback: { question: s.question, given },
    });
  };

  const canAnswer = () => get().phase === 'answering' && get().question !== null;

  return {
    active: false,
    levelKey: '',
    stages: [],
    stageIdx: 0,
    qIdx: 0,
    question: null,
    questionSeq: 0,
    typed: '',
    combo: 0,
    playerHp: PLAYER_MAX_HP,
    monsterHp: 0,
    monsterMaxHp: 0,
    phase: 'answering',
    feedback: null,
    event: null,

    startLevel: (levelKey, transform) => {
      questionTransform = transform ?? (q => q);
      const stages = generateStages(levelKey);
      set({ active: true, levelKey, stages, combo: 0, playerHp: PLAYER_MAX_HP });
      loadStage(stages, 0);
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
      set(s => ({ typed: s.typed.slice(0, -1) }));
    },

    chooseOption: (letter) => {
      const { question } = get();
      if (!canAnswer() || !question || question.type !== 'choice') return;
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

    // 看完正確答案後，同一題重新作答一次（選項重新洗牌，避免只記位置）
    continueAfterFeedback: () => {
      const s = get();
      if (s.phase !== 'feedback') return;
      const original = s.stages[s.stageIdx].questions[s.qIdx];
      set({ phase: 'answering', feedback: null, typed: '', question: prepare(original), questionSeq: s.questionSeq + 1 });
    },

    nextStage: () => {
      const s = get();
      if (s.phase !== 'monsterDown') return;
      loadStage(s.stages, s.stageIdx + 1);
    },

    retryLevel: () => get().startLevel(get().levelKey, questionTransform),

    exitToMap: () => set({ active: false, question: null }),
  };
});
