import { useMemo, useState } from 'react';
import Modal from './Modal';
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { LEVELS } from '../game/QuestionData';
import { regionName } from '../game/regions';
import { codexItems } from '../game/codex';
import { useSpeak } from './useSpeak';
import { keepFocus } from './keepFocus';

// 圖鑑：收錄遇過的單字與文法，答對次數決定星數（★1：1 次、★2：3 次、★3：5 次）
export default function CodexModal() {
  const codex = useSaveStore(s => s.codex);
  const mistakes = useSaveStore(s => s.mistakes);
  const unlockedIndex = useSaveStore(s => s.unlockedIndex);
  const closeModal = useUiStore(s => s.closeModal);
  const say = useSpeak();
  const [levelIdx, setLevelIdx] = useState(Math.min(unlockedIndex, LEVELS.length - 1));
  const [openId, setOpenId] = useState<string | null>(null);

  const items = useMemo(() => codexItems(LEVELS[levelIdx], codex, mistakes), [levelIdx, codex, mistakes]);
  const seen = items.filter(i => i.seen).length;
  const mastered = items.filter(i => i.stars === 3).length;

  return (
    <Modal title="📚 單字圖鑑" onClose={closeModal}>
      <div className="tabs tabs-scroll" role="tablist">
        {LEVELS.map((lv, i) => (
          <button key={lv} role="tab" aria-selected={i === levelIdx} className={`tab ${i === levelIdx ? 'is-active' : ''}`}
            onMouseDown={keepFocus} onClick={() => { setLevelIdx(i); setOpenId(null); }}>{regionName(lv)}</button>
        ))}
      </div>
      <p className="codex-progress">已收錄 <b>{seen}</b> / {items.length} · 精通 ★★★ <b>{mastered}</b></p>
      <div className="progress-bar" aria-hidden="true"><span style={{ width: `${items.length ? (seen / items.length) * 100 : 0}%` }} /></div>

      <ul className="codex-grid">
        {items.map(item => {
          if (!item.seen) {
            return <li key={item.id} className="codex-card is-locked" aria-label="尚未遇到"><span className="codex-title">？？？</span><span className="muted">{item.kind === 'word' ? '單字' : '文法'}</span></li>;
          }
          const isOpen = openId === item.id;
          return (
            <li key={item.id} className={`codex-card ${isOpen ? 'is-open' : ''}`}>
              <button className="codex-head" onMouseDown={keepFocus} onClick={() => { setOpenId(isOpen ? null : item.id); if (item.audio) say(item.audio); }} aria-expanded={isOpen}>
                <span className="codex-title">{item.title}</span>
                <span className="stars" aria-label={`熟練度 ${item.stars} 星`}>{'★'.repeat(item.stars)}{'☆'.repeat(3 - item.stars)}</span>
                {item.needsReview && <span className="review-tag">待複習</span>}
              </button>
              {isOpen && (
                <div className="codex-detail">
                  <p>{item.pos && <span className="pos">{item.pos} </span>}{item.subtitle}</p>
                  {item.example && <p className="lesson-example">{item.example.split('\n')[0]}<br /><span className="muted">{item.example.split('\n')[1]}</span></p>}
                  <p className="muted">答對 {item.correct} 次 · 答錯 {item.wrong} 次</p>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
