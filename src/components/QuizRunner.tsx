import { useState } from 'react';
import type { Question } from '../game/types';
import { checkQuizAnswer } from '../game/placement';
import { answerLabel } from '../game/answerLabel';
import { useSaveStore } from '../store/saveStore';
import { sfx } from '../game/sfx';
import { useSpeak } from './useSpeak';
import { keepFocus } from './keepFocus';

// 測驗作答：一題一題出，答完立刻顯示對錯與正確答案，按「下一題」繼續。
// 沒有計時、不扣血；答錯的字一樣記進錯題本。
export default function QuizRunner({ questions, label, onAnswer }: {
  questions: Question[];
  label: (idx: number) => string;   // 例如「第 3 / 10 題」
  onAnswer: (correct: boolean) => void; // 按「下一題」時回報這一題的結果
}) {
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<{ correct: boolean } | null>(null);
  const recordAnswer = useSaveStore(s => s.recordAnswer);
  const say = useSpeak();
  const q = questions[idx];
  if (!q) return null;

  const judge = (given: string) => {
    if (result || !given.trim()) return;
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

  const correctText = q.type === 'choice'
    ? q.options?.find(o => o.startsWith(`${q.ans}.`)) ?? q.ans
    : answerLabel(q).text;

  return (
    <section className="quiz">
      <p className="quiz-count">{label(idx)}</p>
      <div className="question-card">
        <p className="q-desc">{q.desc}</p>
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
            aria-label="輸入答案" placeholder={q.type === 'fill' ? '填入空格的字母（或整個單字）' : '輸入英文單字'} />
          <button className="btn btn-primary" type="submit" disabled={!!result}>確認 ⏎</button>
        </form>
      )}

      {result && (
        <div className={`trial-result ${result.correct ? 'is-correct' : 'is-wrong'}`}>
          <p>{result.correct ? '✔ 正確！' : <>✘ 正確答案是 <b>{correctText}</b></>}</p>
          <button className="btn btn-primary btn-small" autoFocus onMouseDown={keepFocus} onClick={next}>{idx + 1 < questions.length ? '下一題 ⏎' : '看結果 ⏎'}</button>
        </div>
      )}
    </section>
  );
}
