import { useState } from 'react';
import Modal from './Modal';
import QuizRunner from './QuizRunner';
import { SHARD_QUIZ_COUNT, SHARD_QUIZ_MAX, SHARD_QUIZ_PER, useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { LEVELS, getPool } from '../game/QuestionData';
import { shuffleArray } from '../game/battle';
import type { Question } from '../game/types';
import { keepFocus } from './keepFocus';

// 每日碎片英文題：從目前最前線區域出 5 題，每答對一題得到 2 片願望碎片（任何英雄升星、升品階都能用）
function pickQuestions(levelIdx: number): Question[] {
  const pool = getPool(LEVELS[Math.min(levelIdx, LEVELS.length - 1)]);
  return shuffleArray([...pool.normal, ...pool.boss]).slice(0, SHARD_QUIZ_COUNT);
}

export default function ShardQuizModal() {
  const closeModal = useUiStore(s => s.closeModal);
  const { unlockedIndex, shardQuizDay, wishShards, finishShardQuiz } = useSaveStore();
  const doneToday = shardQuizDay === new Date().toDateString();
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [score, setScore] = useState({ answered: 0, correct: 0 });
  const [gained, setGained] = useState<number | null>(null);

  const onAnswer = (correct: boolean) => {
    const s = { answered: score.answered + 1, correct: score.correct + (correct ? 1 : 0) };
    setScore(s);
    if (questions && s.answered >= questions.length) {
      const g = finishShardQuiz(s.correct);
      setGained(g);
      if (g > 0) useUiStore.getState().celebrate({ icon: '💎', title: `願望碎片 +${g}`, sub: '可以用在任何英雄的升星與升品階', color: '#7fe8ff' });
    }
  };

  return (
    <Modal title="💎 每日碎片英文題" onClose={closeModal}>
      {!questions && (
        <>
          <p>每天一次，從目前的冒險區域出 {SHARD_QUIZ_COUNT} 題。每答對一題得到 {SHARD_QUIZ_PER} 片「願望碎片」（最多 {SHARD_QUIZ_MAX} 片），
            可以補任何英雄升星、升品階時不夠的碎片。</p>
          <p className="muted">目前有願望碎片 💎 {wishShards}</p>
          <button className="btn btn-primary" onMouseDown={keepFocus} disabled={doneToday}
            onClick={() => { setQuestions(pickQuestions(unlockedIndex)); setScore({ answered: 0, correct: 0 }); setGained(null); }}>
            {doneToday ? '今天已完成，明天再來' : '開始作答'}
          </button>
        </>
      )}
      {questions && gained === null && (
        <QuizRunner questions={questions} label={i => `第 ${i + 1} / ${questions.length} 題`} onAnswer={onAnswer} />
      )}
      {gained !== null && (
        <>
          <p>答對 {score.correct} / {questions?.length} 題，得到 💎 {gained} 片願望碎片（目前 {wishShards} 片）。</p>
          <button className="btn btn-primary" onMouseDown={keepFocus} onClick={closeModal}>完成</button>
        </>
      )}
    </Modal>
  );
}
