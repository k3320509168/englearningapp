import { useMemo, useState } from 'react';
import Modal from './Modal';
import { dueMistakes, useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { answerLabel } from '../game/answerLabel';
import { questionKey } from '../game/battle';
import { continueJourney } from '../game/startLevel';
import { useSpeak } from './useSpeak';
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

  return (
    <Modal title="📌 今日複習" onClose={closeModal}>
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
