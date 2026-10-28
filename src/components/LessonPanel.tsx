import { useEffect, useMemo, useState } from 'react';
import { useBattleStore } from '../store/battleStore';
import { useSaveStore } from '../store/saveStore';
import { buildLesson, segmentRange } from '../game/lesson';
import type { LessonGrammar, LessonWord } from '../game/lesson';
import { useSpeak } from './useSpeak';
import { keepFocus } from './keepFocus';

// 戰前預習：以卡片一張一張看本區段（10 關）會出現的單字與文法，可隨時跳過

type Card = { kind: 'word'; word: LessonWord } | { kind: 'grammar'; grammar: LessonGrammar };

export default function LessonPanel() {
  const stages = useBattleStore(s => s.stages);
  const stageIdx = useBattleStore(s => s.stageIdx);
  const showLessons = useSaveStore(s => s.settings.showLessons);
  const updateSettings = useSaveStore(s => s.updateSettings);
  const say = useSpeak();
  const [index, setIndex] = useState(0);

  const cards = useMemo<Card[]>(() => {
    const lesson = buildLesson(stages, stageIdx);
    return [
      ...lesson.words.map(word => ({ kind: 'word' as const, word })),
      ...lesson.grammar.map(grammar => ({ kind: 'grammar' as const, grammar })),
    ];
  }, [stages, stageIdx]);

  const [from, to] = segmentRange(stageIdx, stages.length);
  const card = cards[index];
  const isLast = index >= cards.length - 1;
  const start = () => useBattleStore.getState().startBattle();
  const audioText = card?.kind === 'word' ? card.word.display : card?.grammar.sentence;

  // 翻到新卡片時自動唸出單字
  useEffect(() => {
    if (card?.kind === 'word') say(card.word.display);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setIndex(i => Math.min(i + 1, cards.length - 1));
      else if (e.key === 'ArrowLeft') setIndex(i => Math.max(i - 1, 0));
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cards.length]);

  return (
    <div className="lesson">
      <div className="lesson-head">
        <p className="lesson-title">📖 戰前情報：第 {from + 1}–{to} 關</p>
        <button className="btn btn-ghost btn-small" onMouseDown={keepFocus} onClick={start}>跳過 ⏭</button>
      </div>

      {card ? (
        <div className="lesson-card" key={index}>
          {card.kind === 'word' ? (
            <>
              <p className="lesson-word">{card.word.display} <span className="pos">{card.word.pos}</span></p>
              <p className="lesson-meaning">{card.word.meaning}</p>
              <p className="lesson-example">
                {card.word.example}
                {' '}<button className="btn btn-ghost btn-small inline-say" onMouseDown={keepFocus} onClick={() => say(card.word.example)} aria-label="唸出整個例句">🔊 例句</button>
                <button className="btn btn-ghost btn-small inline-say" onMouseDown={keepFocus} onClick={() => say(card.word.example, true)} aria-label="慢速唸出例句">🐢</button>
              </p>
              <p className="lesson-example-zh">{card.word.exampleZh}</p>
            </>
          ) : (
            <>
              <span className="q-tag q-choice">文法</span>
              <p className="lesson-example">{card.grammar.sentence || card.grammar.desc}</p>
              <p className="lesson-explain">💡 {card.grammar.explain}</p>
            </>
          )}
          {audioText && (
            <div className="feedback-actions">
              <button className="btn" onMouseDown={keepFocus} onClick={() => say(audioText)}>🔊 {card.kind === 'word' ? '單字' : '句子'}</button>
              <button className="btn" onMouseDown={keepFocus} onClick={() => say(audioText, true)}>🐢 慢速</button>
            </div>
          )}
        </div>
      ) : (
        <p className="lesson-empty">這一段沒有新的預習內容，直接開戰吧！</p>
      )}

      <div className="lesson-nav">
        <button className="btn" onMouseDown={keepFocus} onClick={() => setIndex(i => i - 1)} disabled={index === 0} aria-label="上一張">◀</button>
        <span className="lesson-count">{cards.length ? `${index + 1} / ${cards.length}` : ''}</span>
        {isLast ? (
          <button className="btn btn-primary" onMouseDown={keepFocus} onClick={start}>開始戰鬥 ⏎</button>
        ) : (
          <button className="btn btn-primary" onMouseDown={keepFocus} onClick={() => setIndex(i => i + 1)} aria-label="下一張">▶</button>
        )}
      </div>

      <label className="check">
        <input type="checkbox" checked={!showLessons} onChange={e => updateSettings({ showLessons: !e.target.checked })} />
        以後不要自動顯示（戰鬥中仍可按 📖 查看）
      </label>
    </div>
  );
}
