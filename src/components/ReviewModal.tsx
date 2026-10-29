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

// 今日複習：到期的錯題清單。複習方式不變——這些字會在戰鬥中以魔王題、復仇魔王出現；
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
      {total > 0 && (
        <button className="btn btn-primary shard-quiz-btn" onMouseDown={keepFocus} onClick={startTraining}>
          🥋 錯題修煉場：連對 {SWEEP_STREAK} 題送 3 張掃蕩券（持有 🎟️ {sweepTickets}）
        </button>
      )}
      {due.length === 0 ? (
        <p>今天沒有到期的錯題 🎉 {total > 0 ? `錯題本裡還有 ${total} 個字，會在之後幾天陸續回來考你。` : '繼續冒險，遇到不會的字也不用怕。'}</p>
      ) : (
        <>
          <p className="muted">這 {due.length} 個字今天該複習了。先看一眼、聽一次發音，它們會在戰鬥中以「魔王題」出現——在不同的三天各答對一次（間隔 1 天 → 3 天 → 7 天）就會離開錯題本。</p>
          <ul className="mistake-list">
            {due.map(m => {
              const l = answerLabel(m.question);
              return (
                <li key={questionKey(m.question)}>
                  <button className="btn btn-ghost btn-small" onMouseDown={keepFocus} onClick={() => say(l.audio)} aria-label="播放發音" disabled={!l.audio}>🔊</button>
                  <span className="mistake-text">{l.text}</span>
                  <span className="mistake-meaning">{l.meaning}{m.wrongCount > 1 ? `・答錯 ${m.wrongCount} 次` : ''}</span>
                  {vocabKey(m.question) && VOCAB[vocabKey(m.question)!] && (
                    <button className="btn btn-ghost btn-small" onMouseDown={keepFocus} onClick={() => useUiStore.getState().openStudy(vocabKey(m.question)!)} aria-label="打開單字學習">📖</button>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
      <div className="tutorial-actions">
        <button className="btn btn-ghost" onMouseDown={keepFocus} onClick={closeModal}>關閉</button>
        <button className="btn btn-primary" onMouseDown={keepFocus} onClick={() => { closeModal(); continueJourney(); }}>⚔️ 去戰鬥中複習</button>
      </div>
    </Modal>
  );
}
