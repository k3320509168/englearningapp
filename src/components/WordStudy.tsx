import { useState, useEffect, useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useUiStore } from '../store/uiStore';
import { useSaveStore } from '../store/saveStore';
import { VOCAB, vocabByKey, vocabSenses } from '../game/vocab';
import { masteryStars } from '../game/progression';
import Modal from './Modal';
import { useSpeak } from './useSpeak';
import { keepFocus } from './keepFocus';

// 詞性色彩分類輔助函式
function getPosClass(pos: string): string {
  const p = pos.toLowerCase();
  if (p.includes('n.')) return 'pos-noun';
  if (p.includes('v.')) return 'pos-verb';
  if (p.includes('adj.')) return 'pos-adj';
  if (p.includes('adv.')) return 'pos-adv';
  if (p.includes('phr.')) return 'pos-phr';
  if (p.includes('prep.')) return 'pos-prep';
  if (p.includes('conj.')) return 'pos-conj';
  return 'pos-default';
}

// 例句中智慧高亮目標詞彙
function highlightWord(text: string, target: string) {
  if (!target || !text) return text;
  // 將目標詞的標點清理乾淨
  const cleanTarget = target.replace(/[^A-Za-z0-9]/g, '');
  if (cleanTarget.length < 2) return text;

  try {
    const splitRegex = new RegExp(`\\b(${cleanTarget}[a-z]*)\\b`, 'gi');
    const testRegex = new RegExp(`^${cleanTarget}[a-z]*$`, 'i');
    const parts = text.split(splitRegex);
    return parts.map((part, idx) => {
      if (testRegex.test(part)) {
        return <mark key={idx} className="word-kw-highlight">{part}</mark>;
      }
      return part;
    });
  } catch {
    return text;
  }
}

// 單字學習視窗：專心看一個字——每個詞性的意思、例句（支援正常與慢速播放）、熟練度以及無縫前後切換導航。
export default function WordStudy() {
  const key = useUiStore(s => s.studyWord);
  const openStudy = useUiStore(s => s.openStudy);
  const close = useUiStore(s => s.closeStudy);
  const [copied, setCopied] = useState(false);

  // 取得全詞庫鍵值列表以便前後翻閱導航
  const vocabKeys = useMemo(() => Object.keys(VOCAB), []);
  const currentIndex = useMemo(() => (key ? vocabKeys.indexOf(key) : -1), [key, vocabKeys]);

  // 前後導航切換
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < vocabKeys.length - 1;

  const goPrev = useCallback(() => {
    if (hasPrev) openStudy(vocabKeys[currentIndex - 1]);
  }, [hasPrev, currentIndex, vocabKeys, openStudy]);

  const goNext = useCallback(() => {
    if (hasNext) openStudy(vocabKeys[currentIndex + 1]);
  }, [hasNext, currentIndex, vocabKeys, openStudy]);

  // 鍵盤左右箭頭導航支援
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goPrev, goNext]);

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

  const copyToClipboard = async () => {
    const textToCopy = `${v.display} (${v.pos}) ${v.meaning}\n例句: ${v.example}\n翻譯: ${v.exampleZh}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 剪貼簿存取失敗時靜默忽略
    }
  };

  return (
    <Modal title="📖 單字學習卡" onClose={close}>
      <div className="word-study">
        {/* 頂部單字、發音與操作導航 */}
        <div className="word-study-head">
          <div className="word-study-title-row">
            <span className={`word-study-pos-badge ${getPosClass(v.pos)}`}>{v.pos}</span>
            <p className="lesson-word">{v.display}</p>
          </div>

          <div className="feedback-actions">
            <button className="btn btn-small" onMouseDown={keepFocus} onClick={() => say(v.display)}>🔊 發音</button>
            <button className="btn btn-small" onMouseDown={keepFocus} onClick={() => say(v.display, true)}>🐢 慢速</button>
            <button className="btn btn-small btn-ghost copy-btn" onMouseDown={keepFocus} onClick={copyToClipboard} title="複製單字與例句">
              {copied ? '✅ 已複製' : '📋 複製'}
            </button>
          </div>

          <p className="muted word-study-stats">
            熟練度 <span className="stars">{'★'.repeat(stars)}{'☆'.repeat(3 - stars)}</span>・答對 {stats.correct} 次・答錯 {stats.wrong} 次
          </p>
        </div>

        {/* 詞義與例句列表 */}
        <div className="word-study-body">
          {senses.map((sense, i) => (
            <section key={i} className="word-sense">
              <p className="word-sense-head">
                <span className={`pos ${getPosClass(sense.pos)}`}>{sense.pos}</span>
                <b className="sense-meaning">{sense.meaning}</b>
              </p>
              <ul className="word-examples">
                {sense.examples.map((ex, j) => (
                  <li key={j} className="word-example-item">
                    <p className="lesson-example">
                      {highlightWord(ex.en, v.display)}
                      {' '}
                      <button className="btn btn-ghost btn-small inline-say" onMouseDown={keepFocus} onClick={() => say(ex.en)} aria-label="唸出例句">🔊</button>
                      <button className="btn btn-ghost btn-small inline-say" onMouseDown={keepFocus} onClick={() => say(ex.en, true)} aria-label="慢速唸出例句">🐢</button>
                    </p>
                    <p className="lesson-example-zh">{ex.zh}</p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {/* 底部前後切換快捷導航 */}
        <div className="word-study-nav-bar">
          <button
            className="btn btn-ghost btn-small word-nav-btn"
            disabled={!hasPrev}
            onMouseDown={keepFocus}
            onClick={goPrev}
            title="快捷鍵: ← 鍵"
          >
            ◀ 上一個詞
          </button>
          <span className="word-nav-counter muted">
            {currentIndex >= 0 ? `${currentIndex + 1} / ${vocabKeys.length}` : ''}
          </span>
          <button
            className="btn btn-ghost btn-small word-nav-btn"
            disabled={!hasNext}
            onMouseDown={keepFocus}
            onClick={goNext}
            title="快捷鍵: → 鍵"
          >
            下一個詞 ▶
          </button>
        </div>
      </div>
    </Modal>
  );
}
