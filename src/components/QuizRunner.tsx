import { useEffect, useRef, useState } from 'react';
import type { Question } from '../game/types';
import { checkQuizAnswer } from '../game/placement';
import { spellingExtra } from '../game/questionHelp';
import { answerLabel } from '../game/answerLabel';
import { useSaveStore } from '../store/saveStore';
import { sfx } from '../game/sfx';
import { useSpeak } from './useSpeak';
import { keepFocus } from './keepFocus';

// 測驗作答：一題一題出，答完立刻顯示對錯與正確答案，按「下一題」繼續。
// 沒有計時、不扣血；答錯的字一樣記進錯題本。
export default function QuizRunner({ questions, label, onAnswer, lastLabel = '看結果' }: {
  questions: Question[];
  label: (idx: number) => string;   // 例如「第 3 / 10 題」
  onAnswer: (correct: boolean) => void; // 按「下一題」時回報這一題的結果
  lastLabel?: string;               // 最後一題按鈕的文字（程度測驗會繼續測下一區，用「繼續」）
}) {
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<{ correct: boolean } | null>(null);
  const [ime, setIme] = useState(false);
  const recordAnswer = useSaveStore(s => s.recordAnswer);
  const say = useSpeak();
  const q = questions[idx];

  const judge = (given: string) => {
    if (!q || result || !given.trim()) return;
    const correct = checkQuizAnswer(q, given);
    recordAnswer(q, correct, false);
    setResult({ correct });
    if (correct) sfx.coin(); else sfx.wrong();
    if (q.speak) say(q.speak);
  };

  const next = () => {
    const correct = result?.correct ?? false;
    setResult(null);
    setInput('');
    setIdx(i => i + 1);
    onAnswer(correct);
  };

  // 鍵盤：選擇題按 A～D 作答，看完對錯按 Enter 下一題（和戰鬥中的操作一樣）
  const keyRef = useRef<(e: KeyboardEvent) => void>(() => undefined);
  useEffect(() => {
    keyRef.current = (e: KeyboardEvent) => {
      if (!q || e.ctrlKey || e.metaKey || e.altKey) return;
      // 焦點在按鈕上時，Enter 由按鈕自己處理（避免按一次跳兩題）
      if (result && e.key === 'Enter' && document.activeElement?.tagName !== 'BUTTON') { e.preventDefault(); next(); return; }
      if (!result && q.type === 'choice' && /^[a-dA-D]$/.test(e.key)) { e.preventDefault(); judge(e.key.toUpperCase()); }
    };
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => keyRef.current(e);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  if (!q) return null;

  const correctText = q.type === 'choice'
    ? q.options?.find(o => o.startsWith(`${q.ans}.`)) ?? q.ans
    : answerLabel(q).text;

  return (
    <section className="quiz">
      <p className="quiz-count">{label(idx)}</p>
      <div className="question-card">
        <p className="q-desc">{q.desc.replace(/^【[^】]*試煉】/, '')}{spellingExtra(q) && <small className="q-extra">（{spellingExtra(q)}）</small>}</p>
        {q.speak && q.type !== 'choice' && <button className="btn btn-ghost btn-small" onMouseDown={keepFocus} onClick={() => say(q.speak)}>🔊 聽發音</button>}
      </div>

      {q.type === 'choice' ? (
        <div className="options">
          {q.options?.map(opt => (
            <button key={opt} className="option-btn" disabled={!!result} onMouseDown={keepFocus} onClick={() => judge(opt[0])}>
              <b>{opt[0]}</b>{opt.slice(2)}
            </button>
          ))}
        </div>
      ) : (
        <form className="trial-input" onSubmit={e => { e.preventDefault(); judge(input); }}>
          <input value={input} onChange={e => setInput(e.target.value)} disabled={!!result} autoFocus autoComplete="off" autoCapitalize="characters" spellCheck={false}
            onCompositionStart={() => setIme(true)} onCompositionEnd={() => setIme(false)}
            aria-label="輸入答案" placeholder={q.type === 'fill' ? '填入空格的字母（或整個單字）' : '輸入英文單字'} />
          <button className="btn btn-primary" type="submit" disabled={!!result}>確認 ⏎</button>
        </form>
      )}

      {ime && <p className="ime-warning">⌨️ 正在用中文輸入法，請按 Shift 或切換成英文輸入。</p>}
      {result && (
        <div className={`trial-result ${result.correct ? 'is-correct' : 'is-wrong'}`}>
          <p>{result.correct ? '✔ 正確！' : <>✘ 正確答案是 <b>{correctText}</b></>}</p>
          <button className="btn btn-primary btn-small" autoFocus onMouseDown={keepFocus} onClick={next}>{idx + 1 < questions.length ? '下一題 ⏎' : `${lastLabel} ⏎`}</button>
        </div>
      )}
    </section>
  );
}
