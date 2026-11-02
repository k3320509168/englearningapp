import { useMemo, useState } from 'react';
import Modal from './Modal';
import { dueMistakes, useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { VOCAB, vocabKey } from '../game/vocab';
import { answerLabel } from '../game/answerLabel';
import { questionKey } from '../game/battle';
import { continueJourney } from '../game/startLevel';
import { useSpeak } from './useSpeak';
import QuizRunner from './QuizRunner';
import { SWEEP_STREAK, SWEEP_DAILY_MAX } from '../store/saveStore';
import { voiceFallback } from '../game/battle';
import type { Question } from '../game/types';
import { keepFocus } from './keepFocus';

// 今日複習：到期的錯題清單。複習方式不變——這些字會在戰鬥中以困難題、復仇魔王出現；
// 這裡讓玩家先看一眼、聽一次發音，再一鍵出發。
export default function ReviewModal() {
  const closeModal = useUiStore(s => s.closeModal);
  const mistakes = useSaveStore(s => s.mistakes);
  const say = useSpeak();
  // 打開視窗當下的時間（同一次查看清單不會變動）
  const [now] = useState(() => Date.now());
  const due = useMemo(() => dueMistakes(mistakes, now, 50), [mistakes, now]);
  const total = Object.keys(mistakes).length;
  const sweepTickets = useSaveStore(s => s.sweepTickets);
  // 修煉場：直接在這裡練錯題，連續答對 5 題送 3 張掃蕩券
  const [training, setTraining] = useState<Question[] | null>(null);
  const [streak, setStreak] = useState(0);
  const startTraining = () => {
    const list = (due.length ? due : Object.values(mistakes)).slice(0, 10).map(m => voiceFallback(m.question));
    setTraining(list);
    setStreak(0);
  };
  const onTrain = (correct: boolean) => {
    if (correct) useSaveStore.getState().earnTrainingGold();
    const next = correct ? streak + 1 : 0;
    setStreak(next);
    if (next > 0 && next % SWEEP_STREAK === 0) {
      const got = useSaveStore.getState().earnSweepTickets();
      useUiStore.getState().celebrate(got > 0
        ? { icon: '🎟️', title: `掃蕩券 +${got}`, sub: '三星通關的地圖可以直接掃蕩領獎勵', color: '#ffcd4b' }
        : { icon: '🎟️', title: '今天的掃蕩券領滿了', sub: `每天最多 ${SWEEP_DAILY_MAX} 張，明天再來`, color: '#8a8494' });
    }
  };

  if (training) {
    return (
      <Modal title="🥋 錯題修煉場" onClose={closeModal}>
        <p className="muted">連續答對 {SWEEP_STREAK} 題送 3 張掃蕩券・目前連對 {streak}・持有 🎟️ {sweepTickets}</p>
        <QuizRunner key={training.length} questions={training} label={i => `第 ${i + 1} / ${training.length} 題`} onAnswer={onTrain} lastLabel="完成" />
        <div className="tutorial-actions">
          <button className="btn btn-ghost" onMouseDown={keepFocus} onClick={() => setTraining(null)}>回到清單</button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="📌 今日複習" onClose={closeModal}>
      {/* 頂部極簡引導與錯題修煉場按鈕 */}
      <div className="review-header-row">
        <p className="review-lead">💡 戰鬥中將化為「困難題」登場，答對 3 次即可掌握畢業。</p>
        {total > 0 && (
          <button className="btn btn-secondary btn-small review-train-btn" onMouseDown={keepFocus} onClick={startTraining} title="進入修煉連續答對 5 題贈 3 張掃蕩券">
            🥋 進入修煉場 <span className="train-reward-badge">🎟️+3</span>
          </button>
        )}
      </div>

      {due.length === 0 ? (
        <div className="review-empty">
          <p>🎉 今天沒有到期的複習題目！</p>
          <span className="muted">{total > 0 ? `錯題本中尚有 ${total} 題，會在後續冒險中陸續安排溫習。` : '持續探索新區域，累積更多冒險詞彙吧！'}</span>
        </div>
      ) : (
        <div className="review-list-wrap">
          <div className="review-section-header">
            <span className="review-badge">待複習重點（{due.length}）</span>
            {sweepTickets > 0 && <span className="review-ticket-hint">持有掃蕩券 🎟️ {sweepTickets}</span>}
          </div>
          <ul className="mistake-list">
            {due.map(m => {
              const l = answerLabel(m.question);
              const q = m.question;
              const displayText = q.desc || l.text;
              const displayExplain = q.explain || l.meaning;
              const audioTarget = l.audio || q.speak || l.text;

              return (
                <li key={questionKey(q)} className="review-item-card">
                  <div className="review-item-top">
                    <button
                      className="btn btn-ghost btn-small review-sound-btn"
                      onMouseDown={keepFocus}
                      onClick={() => say(audioTarget)}
                      aria-label="播放發音"
                      disabled={!audioTarget}
                    >
                      🔊
                    </button>
                    <div className="review-item-text">
                      <p className="mistake-text">{displayText}</p>
                    </div>
                    {vocabKey(q) && VOCAB[vocabKey(q)!] && (
                      <button
                        className="btn btn-ghost btn-small review-book-btn"
                        onMouseDown={keepFocus}
                        onClick={() => useUiStore.getState().openStudy(vocabKey(q)!)}
                        aria-label="打開單字字典"
                        title="查看單字詳情"
                      >
                        📖
                      </button>
                    )}
                  </div>
                  {displayExplain && (
                    <div className="review-item-bottom">
                      <p className="mistake-explain">
                        {displayExplain}
                        {m.wrongCount > 1 && <span className="mistake-count-tag">（累計錯 {m.wrongCount} 次）</span>}
                      </p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="tutorial-actions review-actions">
        <button className="btn btn-ghost" onMouseDown={keepFocus} onClick={closeModal}>關閉</button>
        <button className="btn btn-primary" onMouseDown={keepFocus} onClick={() => { closeModal(); continueJourney(); }}>⚔️ 去戰鬥中複習</button>
      </div>
    </Modal>
  );
}
