import { useEffect, useRef, useState } from 'react';
import type { Question } from '../game/types';
import { checkQuizAnswer } from '../game/placement';
import { checkVoice, voiceFallback } from '../game/battle';
import { questionSkill } from '../game/QuestionData';
import { createRecognizer, isSpeechRecognitionSupported } from '../game/speech';
import type { Recognizer } from '../game/speech';
import { spellingExtra } from '../game/questionHelp';
import { answerLabel } from '../game/answerLabel';
import { useSaveStore } from '../store/saveStore';
import { sfx } from '../game/sfx';
import { useSpeak } from './useSpeak';
import { keepFocus } from './keepFocus';

// 測驗作答：一題一題出，答完立刻顯示對錯與正確答案，按「下一題」繼續。
// 沒有計時、不扣血；答錯的字一樣記進錯題本。聽力題一出就播放，可以重播、慢速。
// 口說題：有麥克風就用說的（區域試煉），沒有或設定不用麥克風時改成拼寫（一樣要真的會才算對）
export default function QuizRunner({ questions, label, onAnswer, lastLabel = '看結果' }: {
  questions: Question[];
  label: (idx: number) => string;   // 例如「第 3 / 10 題」
  onAnswer: (correct: boolean) => void; // 按「下一題」時回報這一題的結果
  lastLabel?: string;               // 最後一題按鈕的文字（程度測驗會繼續測下一區，用「繼續」）
}) {
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<{ correct: boolean; heard?: string } | null>(null);
  const [ime, setIme] = useState(false);
  const [typed, setTyped] = useState(-1); // 這一題的口說改成拼寫
  const [listening, setListening] = useState(false);
  const recordAnswer = useSaveStore(s => s.recordAnswer);
  const voiceAsSpelling = useSaveStore(s => s.settings.voiceAsSpelling);
  const autoSpeak = useSaveStore(s => s.settings.autoSpeak);
  const say = useSpeak();
  const raw = questions[idx];
  const canVoice = isSpeechRecognitionSupported() && !voiceAsSpelling && typed !== idx;
  const q = raw && raw.type === 'voice' && !canVoice ? voiceFallback(raw) : raw;
  const listeningQ = !!q && q.type === 'choice' && !!q.speak && questionSkill(q) === 'listening';
  const recognizer = useRef<Recognizer | null>(null);

  const finish = (correct: boolean, heard?: string) => {
    recordAnswer(raw, correct, false, true);
    setResult({ correct, heard });
    if (correct) sfx.coin(); else sfx.wrong();
    if (q.speak) say(q.speak);
  };

  // 聽力題：出題時自動播放
  useEffect(() => {
    if (listeningQ && autoSpeak) say(q.speak);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  useEffect(() => {
    if (q?.type !== 'voice') return;
    recognizer.current = createRecognizer({
      onStart: () => setListening(true),
      accept: (t) => checkVoice(q, t),
      onResult: (t) => finish(checkVoice(q, t), t[0] ?? ''),
      onError: () => setListening(false),
      onEnd: () => setListening(false),
    });
    return () => recognizer.current?.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, q?.type]);

  const judge = (given: string) => {
    if (!q || result || !given.trim()) return;
    const correct = checkQuizAnswer(q, given);
    recordAnswer(raw, correct, false, true);
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
        {q.speak && (q.type !== 'choice' || listeningQ) && (
          <span className="feedback-actions">
            <button className="btn btn-ghost btn-small" onMouseDown={keepFocus} onClick={() => say(q.speak)}>🔊 {listeningQ ? '再聽一次' : '聽發音'}</button>
            {listeningQ && <button className="btn btn-ghost btn-small" onMouseDown={keepFocus} onClick={() => say(q.speak, true)}>🐢 慢速</button>}
          </span>
        )}
      </div>

      {q.type === 'choice' ? (
        <div className="options">
          {q.options?.map(opt => (
            <button key={opt} className="option-btn" disabled={!!result} onMouseDown={keepFocus} onClick={() => judge(opt[0])}>
              <b>{opt[0]}</b>{opt.slice(2)}
            </button>
          ))}
        </div>
      ) : q.type === 'voice' ? (
        <div className="quiz-voice">
          <button className={`mic-btn ${listening ? 'is-listening' : ''}`} onMouseDown={keepFocus} disabled={!!result || listening} onClick={() => recognizer.current?.start()}>
            {listening ? '🎤 聆聽中…' : '🎤 點我開始說'}
          </button>
          {!result && <button className="btn btn-ghost btn-small" onMouseDown={keepFocus} onClick={() => setTyped(idx)}>麥克風不方便？改用拼寫</button>}
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
          <p>{result.correct ? '✔ 正確！' : <>✘ {result.heard ? `聽成「${result.heard}」，` : ''}正確答案是 <b>{correctText}</b></>}</p>
          <button className="btn btn-primary btn-small" autoFocus onMouseDown={keepFocus} onClick={next}>{idx + 1 < questions.length ? '下一題 ⏎' : `${lastLabel} ⏎`}</button>
        </div>
      )}
    </section>
  );
}
