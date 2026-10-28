import { useShallow } from 'zustand/react/shallow';
import { useUiStore } from '../store/uiStore';
import { useSaveStore } from '../store/saveStore';
import { vocabByKey, vocabSenses } from '../game/vocab';
import { masteryStars } from '../game/progression';
import Modal from './Modal';
import { useSpeak } from './useSpeak';
import { keepFocus } from './keepFocus';

// 單字學習視窗：專心看一個字——每個詞性的意思、好幾個例句（都可以正常或慢速播放），以及自己的熟練度。
// 從戰前情報、答錯的解說、錯題本、圖鑑都可以打開；疊在其他視窗上，關掉後回到原本的畫面
export default function WordStudy() {
  const key = useUiStore(s => s.studyWord);
  const close = useUiStore(s => s.closeStudy);
  // 這個字在所有題目中答對／答錯的總次數
  const stats = useSaveStore(useShallow(s => {
    let correct = 0, wrong = 0;
    if (!key) return { correct, wrong };
    for (const c of Object.values(s.codex)) {
      const q = c.question;
      const ans = q.type === 'fill' ? (q.speak ?? '').toUpperCase().replace(/[^A-Z]/g, '') : q.ans;
      if (ans === key) { correct += c.correct; wrong += c.wrong; }
    }
    return { correct, wrong };
  }));
  const say = useSpeak();
  if (!key) return null;
  const v = vocabByKey(key);
  if (!v) return null;
  const senses = vocabSenses(v);
  const stars = masteryStars(stats.correct);

  return (
    <Modal title="📖 單字學習" onClose={close}>
      <div className="word-study">
        <div className="word-study-head">
          <p className="lesson-word">{v.display}</p>
          <div className="feedback-actions">
            <button className="btn btn-small" onMouseDown={keepFocus} onClick={() => say(v.display)}>🔊 發音</button>
            <button className="btn btn-small" onMouseDown={keepFocus} onClick={() => say(v.display, true)}>🐢 慢速</button>
          </div>
          <p className="muted">
            熟練度 <span className="stars">{'★'.repeat(stars)}{'☆'.repeat(3 - stars)}</span>・答對 {stats.correct} 次・答錯 {stats.wrong} 次
          </p>
        </div>
        {senses.map((sense, i) => (
          <section key={i} className="word-sense">
            <p className="word-sense-head"><span className="pos">{sense.pos}</span> <b>{sense.meaning}</b></p>
            <ul className="word-examples">
              {sense.examples.map((ex, j) => (
                <li key={j}>
                  <p className="lesson-example">
                    {ex.en}
                    {' '}<button className="btn btn-ghost btn-small inline-say" onMouseDown={keepFocus} onClick={() => say(ex.en)} aria-label="唸出例句">🔊</button>
                    <button className="btn btn-ghost btn-small inline-say" onMouseDown={keepFocus} onClick={() => say(ex.en, true)} aria-label="慢速唸出例句">🐢</button>
                  </p>
                  <p className="lesson-example-zh">{ex.zh}</p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Modal>
  );
}
