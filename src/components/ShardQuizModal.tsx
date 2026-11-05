import { useState } from 'react';
import Modal from './Modal';
import QuizRunner from './QuizRunner';
import { SHARD_QUIZ_COUNT, SHARD_QUIZ_MAX, SHARD_QUIZ_PER, useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { LEVELS, getPool } from '../game/QuestionData';
import { shuffleArray, voiceFallback } from '../game/battle';
import type { Question } from '../game/types';
import { sfx } from '../game/sfx';
import { keepFocus } from './keepFocus';

// 每日碎片英文題：從目前最前線區域出 5 題，每答對一題得到 2 片願望碎片（任何英雄升星、升品階都能用）
function pickQuestions(levelIdx: number): Question[] {
  const pool = getPool(LEVELS[Math.min(levelIdx, LEVELS.length - 1)]);
  return shuffleArray([...pool.normal, ...pool.boss].map(voiceFallback)).slice(0, SHARD_QUIZ_COUNT);
}

export default function ShardQuizModal() {
  const closeModal = useUiStore(s => s.closeModal);
  const openModal = useUiStore(s => s.openModal);
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
      if (g > 0) {
        sfx.victory();
        useUiStore.getState().celebrate({
          icon: '💎',
          title: `願望碎片 +${g}`,
          sub: '可以用在任何英雄的升星與升品階',
          color: '#7fe8ff',
        });
      } else {
        sfx.wrong();
      }
    }
  };

  return (
    <Modal title="💎 每日碎片英文題" onClose={closeModal}>
      <p className="muted">此副本的口說題改用拼寫練習，不驗證口說能力；獎勵不受影響。</p>
      {!questions && (
        <div className="shard-quiz-panel">
          <div className="shard-quiz-hero-card">
            <span className="shard-giant-icon">💎</span>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: 16 }}>萬能願望碎片挑戰</h3>
              <p className="muted" style={{ margin: 0, fontSize: 12.5 }}>
                每天一次，從目前前線區域抽測 {SHARD_QUIZ_COUNT} 題。每答對 1 題贈送 {SHARD_QUIZ_PER} 片萬能碎片！
              </p>
            </div>
          </div>

          <div className="shard-quiz-stats">
            <div className="shard-stat-item">
              <small>目前持有</small>
              <b>💎 {wishShards} 片</b>
            </div>
            <div className="shard-stat-item">
              <small>今日最高可得</small>
              <b style={{ color: 'var(--accent, #ffd15c)' }}>+{SHARD_QUIZ_MAX} 片</b>
            </div>
            <div className="shard-stat-item">
              <small>挑戰狀態</small>
              <b style={{ color: doneToday ? 'var(--muted, #a9b0ce)' : 'var(--good, #6ee7a8)' }}>
                {doneToday ? '✔ 今日已領' : '⚡ 待挑戰'}
              </b>
            </div>
          </div>

          <p className="shard-quiz-tip">
            💡 願望碎片是極其珍貴的萬能資源，任何英雄升星時碎片不足皆可 1:1 自動折抵！
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
            <button
              className="btn btn-primary"
              style={{ width: '100%', maxWidth: 300, padding: 12 }}
              onMouseDown={keepFocus}
              disabled={doneToday}
              onClick={() => {
                setQuestions(pickQuestions(unlockedIndex));
                setScore({ answered: 0, correct: 0 });
                setGained(null);
                sfx.click();
              }}
            >
              {doneToday ? '今日已完成，明日 00:00 刷新' : '⚔️ 開始每日碎片挑戰'}
            </button>
          </div>
        </div>
      )}

      {questions && gained === null && (
        <QuizRunner
          questions={questions}
          label={i => `每日碎片題・第 ${i + 1} / ${questions.length} 題`}
          onAnswer={onAnswer}
        />
      )}

      {gained !== null && (
        <div className="shard-result-card">
          <div className={`tower-result-header ${gained > 0 ? 'is-victory' : 'is-defeat'}`}>
            <span className="tower-result-icon">{gained > 0 ? '💎' : '😅'}</span>
            <h3>{gained > 0 ? '挑戰完成！' : '再接再厲！'}</h3>
            <p>答對 {score.correct} / {questions?.length} 題</p>
          </div>

          <div className="shard-result-reward-box">
            <small>本次獲得獎勵：</small>
            <div className="shard-gain-display">
              <span>💎 願望碎片</span>
              <b style={{ color: 'var(--accent, #ffd15c)', fontSize: 18 }}>+{gained}</b>
            </div>
            <small className="muted">累計持有：💎 {wishShards} 片</small>
          </div>

          <div className="tower-actions-row">
            <button
              className="btn btn-primary"
              onMouseDown={keepFocus}
              onClick={() => {
                closeModal();
                openModal('heroes');
              }}
            >
              ⭐ 前往英雄升星
            </button>
            <button
              className="btn btn-secondary"
              onMouseDown={keepFocus}
              onClick={closeModal}
            >
              關閉
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
