import { create } from 'zustand';
import type { Question, Stage } from '../game/types';
import { LEVELS, generateStages } from '../game/QuestionData';
import {
  ASSIST_STREAK, BASE_DAMAGE, PLAYER_MAX_HP, WRONG_ANSWER_DAMAGE,
  applyLetter, attackDamage, buildAssist, checkChoice, checkVoice, shuffleChoice,
} from '../game/battle';
import type { Assist } from '../game/battle';
import { SEGMENT_SIZE } from '../game/lesson';
import type { AnswerRecord } from '../game/lesson';
import { useSaveStore } from './saveStore';

// 戰鬥進行中的狀態（不存檔）。React 負責作答介面，Phaser 訂閱 event 播放動畫。

// lesson：戰前預習；summary：Boss 後的區段結算
export type BattlePhase = 'lesson' | 'answering' | 'feedback' | 'monsterDown' | 'summary' | 'levelClear' | 'gameOver';

export interface BattleEvent {
  id: number;
  kind: 'attack' | 'hurt' | 'stage' | 'assist' | 'shield';
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
  maxCombo: number;
  playerHp: number;
  monsterHp: number;
  monsterMaxHp: number;
  phase: BattlePhase;
  feedback: Feedback | null;
  event: BattleEvent | null;
  answers: AnswerRecord[];
  wrongStreak: number;
  assist: Assist | null;
  shield: boolean;

  startLevel: (levelKey: string, transform?: (q: Question) => Question) => void;
  startBattle: () => void;
  openLesson: () => void;
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
    const showLesson = stageIdx % SEGMENT_SIZE === 0 && useSaveStore.getState().settings.showLessons;
    set(s => ({
      stageIdx,
      qIdx: 0,
      question: prepare(stage.questions[0]),
      questionSeq: s.questionSeq + 1,
      typed: '',
      monsterHp: maxHp,
      monsterMaxHp: maxHp,
      phase: showLesson ? 'lesson' : 'answering',
      feedback: null,
      assist: null,
      event: nextEvent('stage'),
    }));
  };

  const record = (correct: boolean) => {
    const s = get();
    const original = s.stages[s.stageIdx].questions[s.qIdx];
    return [...s.answers, { stageIdx: s.stageIdx, question: original, correct }];
  };

  const onCorrect = () => {
    const s = get();
    const combo = s.combo + 1;
    const damage = attackDamage(combo);
    const monsterHp = Math.max(0, s.monsterHp - damage);
    const common = {
      combo, maxCombo: Math.max(s.maxCombo, combo), monsterHp, answers: record(true),
      wrongStreak: 0, assist: null, typed: '', event: nextEvent('attack', damage),
    };

    if (monsterHp > 0) {
      const questions = s.stages[s.stageIdx].questions;
      const qIdx = (s.qIdx + 1) % questions.length;
      set({ ...common, qIdx, question: prepare(questions[qIdx]), questionSeq: s.questionSeq + 1 });
      return;
    }
    const isLastStage = s.stageIdx + 1 >= s.stages.length;
    if (isLastStage) useSaveStore.getState().unlockLevel(LEVELS.indexOf(s.levelKey) + 1);
    const isBoss = s.stages[s.stageIdx].bossMode;
    set({ ...common, phase: isLastStage ? 'levelClear' : isBoss ? 'summary' : 'monsterDown' });
  };

  const onWrong = (given: string) => {
    const s = get();
    if (!s.question) return;
    useSaveStore.getState().recordMistake(s.stages[s.stageIdx].questions[s.qIdx]);
    const base = { combo: 0, answers: record(false), wrongStreak: s.wrongStreak + 1, feedback: { question: s.question, given } };

    // 援軍的護盾：擋下這次傷害
    if (s.shield) {
      set({ ...base, shield: false, phase: 'feedback', event: nextEvent('shield') });
      return;
    }
    const playerHp = Math.max(0, s.playerHp - WRONG_ANSWER_DAMAGE);
    set({
      ...base,
      playerHp,
      event: nextEvent('hurt', WRONG_ANSWER_DAMAGE),
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
    question: null,
    questionSeq: 0,
    typed: '',
    combo: 0,
    maxCombo: 0,
    playerHp: PLAYER_MAX_HP,
    monsterHp: 0,
    monsterMaxHp: 0,
    phase: 'answering',
    feedback: null,
    event: null,
    answers: [],
    wrongStreak: 0,
    assist: null,
    shield: false,

    startLevel: (levelKey, transform) => {
      questionTransform = transform ?? (q => q);
      const stages = generateStages(levelKey);
      set({
        active: true, levelKey, stages, combo: 0, maxCombo: 0, playerHp: PLAYER_MAX_HP,
        answers: [], wrongStreak: 0, shield: false,
      });
      loadStage(stages, 0);
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
      // 援軍預先填好的字母不能刪
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
      if (s.phase !== 'feedback') return;
      const question = prepare(s.stages[s.stageIdx].questions[s.qIdx]);
      const base = { phase: 'answering' as const, feedback: null, question, questionSeq: s.questionSeq + 1 };
      if (s.wrongStreak >= ASSIST_STREAK) {
        const assist = buildAssist(question);
        set({ ...base, assist, typed: assist.revealed, wrongStreak: 0, shield: true, event: nextEvent('assist') });
        return;
      }
      set({ ...base, typed: '', assist: null });
    },

    nextStage: () => {
      const s = get();
      if (s.phase !== 'monsterDown' && s.phase !== 'summary') return;
      loadStage(s.stages, s.stageIdx + 1);
    },

    retryLevel: () => get().startLevel(get().levelKey, questionTransform),

    exitToMap: () => set({ active: false, question: null }),
  };
});
