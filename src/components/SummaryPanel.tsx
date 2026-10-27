import { useShallow } from 'zustand/react/shallow';
import { useBattleStore } from '../store/battleStore';
import { segmentRange, summarize } from '../game/lesson';
import { questionHint, completedSentence, questionKey } from '../game/battle';
import { vocabFor } from '../game/vocab';
import type { Question } from '../game/types';
import { useSpeak } from './useSpeak';
import { keepFocus } from './keepFocus';

// 結算畫面：Boss 後（區段結算）、全區通關、體力耗盡時顯示

function answerLabel(q: Question): { text: string; audio: string; meaning: string } {
  const v = vocabFor(q);
  if (v) return { text: v.display, audio: v.display, meaning: v.meaning };
  // 選擇題：有空格就顯示完整句子，否則（例如「早餐的英文是？」）顯示正確選項
  const sentence = completedSentence(q);
  const option = q.options?.find(o => o.startsWith(`${q.ans}.`))?.replace(/^[A-D]\.\s*/, '') ?? '';
  return { text: sentence || option || q.desc, audio: sentence || option, meaning: q.explain ?? questionHint(q) };
}

export default function SummaryPanel() {
  const { phase, answers, stageIdx, stages, maxCombo } = useBattleStore(useShallow(s => ({
    phase: s.phase, answers: s.answers, stageIdx: s.stageIdx, stages: s.stages, maxCombo: s.maxCombo,
  })));
  const { nextStage, exitToMap, retryLevel } = useBattleStore.getState();
  const say = useSpeak();

  // 區段結算只看這 10 關；通關與失敗看整個區域
  const [from] = phase === 'summary' ? segmentRange(stageIdx, stages.length) : [0];
  const summary = summarize(answers, from, stageIdx);

  const title = phase === 'summary' ? `🏆 擊敗守門 Boss！第 ${from + 1}–${stageIdx + 1} 關結算`
    : phase === 'levelClear' ? '🎉 區域完全通關！' : '💀 體力耗盡';

  return (
    <div className={`result summary ${phase === 'gameOver' ? 'is-fail' : ''}`}>
      <p className="result-title">{title}</p>
      {phase === 'levelClear' && <p>下一個區域已解鎖</p>}
      {phase === 'gameOver' && <p>別灰心！下面是這次要加強的字，記住它們再挑戰一次。</p>}

      <div className="stats">
        <div><b>{summary.accuracy}%</b><span>正確率</span></div>
        <div><b>{summary.correct}/{summary.total}</b><span>答對題數</span></div>
        <div><b>{maxCombo}</b><span>最高 Combo</span></div>
      </div>

      {summary.mastered.length > 0 && (
        <section className="summary-section">
          <p className="summary-label">✅ 一次就答對（{summary.mastered.length}）</p>
          <div className="chips">
            {summary.mastered.map(q => {
              const l = answerLabel(q);
              return <button key={questionKey(q)} className="chip" onMouseDown={keepFocus} onClick={() => say(l.audio)} title={l.meaning}>{l.text}</button>;
            })}
          </div>
        </section>
      )}

      {summary.mistakes.length > 0 && (
        <section className="summary-section">
          <p className="summary-label">📌 需要加強（已加入錯題本）</p>
          <ul className="mistake-list">
            {summary.mistakes.map(q => {
              const l = answerLabel(q);
              return (
                <li key={questionKey(q)}>
                  <button className="btn btn-ghost btn-small" onMouseDown={keepFocus} onClick={() => say(l.audio)} aria-label="播放發音" disabled={!l.audio}>🔊</button>
                  <span className="mistake-text">{l.text}</span>
                  <span className="mistake-meaning">{l.meaning}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="feedback-actions">
        {phase === 'summary' && <button className="btn btn-primary" onMouseDown={keepFocus} onClick={nextStage}>繼續冒險 ⏎</button>}
        {phase === 'levelClear' && <button className="btn btn-primary" onMouseDown={keepFocus} onClick={exitToMap}>回到世界地圖 ⏎</button>}
        {phase === 'gameOver' && (
          <>
            <button className="btn btn-primary" onMouseDown={keepFocus} onClick={retryLevel}>重新挑戰 ⏎</button>
            <button className="btn" onMouseDown={keepFocus} onClick={exitToMap}>回地圖</button>
          </>
        )}
      </div>
    </div>
  );
}
