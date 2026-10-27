import { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useBattleStore } from '../store/battleStore';
import { useSaveStore } from '../store/saveStore';
import { answerSlots, completedSentence, questionHint } from '../game/battle';
import type { Question } from '../game/types';
import { createRecognizer, speak } from '../game/speech';
import type { Recognizer } from '../game/speech';

// 作答介面：電腦用實體鍵盤，手機用螢幕鍵盤與按鈕（RWD）。

const TYPE_LABEL: Record<string, string> = { spell: '拼寫', fill: '填空', choice: '選擇', voice: '口說' };
const KEYBOARD_ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

const correctWord = (q: Question) => (q.type === 'fill' ? (q.speak ?? q.ans).toUpperCase() : q.ans);
// 按鈕被點擊後不搶走焦點，避免之後按 Enter / 空白鍵又觸發同一顆按鈕
const keepFocus = (e: React.MouseEvent) => e.preventDefault();

function useSpeak() {
  const rate = useSaveStore(s => s.settings.speechRate);
  return (text: string | undefined, slow = false) => { if (text) speak(text, slow ? rate * 0.7 : rate); };
}

export default function BattleHUD() {
  const { question, questionSeq, phase, stageName, stageNo, stageCount } = useBattleStore(useShallow(s => ({
    question: s.question,
    questionSeq: s.questionSeq,
    phase: s.phase,
    stageName: s.stages[s.stageIdx]?.name ?? '',
    stageNo: s.stageIdx + 1,
    stageCount: s.stages.length,
  })));
  const say = useSpeak();

  // 新題目出現時自動播放發音
  useEffect(() => {
    const q = useBattleStore.getState().question;
    if (q?.speak && useBattleStore.getState().phase === 'answering') say(q.speak);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionSeq]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const s = useBattleStore.getState();
      const q = s.question;
      const handled = () => e.preventDefault();

      if (e.key === 'Escape') { handled(); return s.exitToMap(); }
      if (s.phase === 'feedback' && (e.key === 'Enter' || e.key === ' ')) { handled(); return s.continueAfterFeedback(); }
      if (s.phase === 'monsterDown' && e.key === 'Enter') { handled(); return s.nextStage(); }
      if (s.phase === 'levelClear' && e.key === 'Enter') { handled(); return s.exitToMap(); }
      if (s.phase === 'gameOver' && e.key === 'Enter') { handled(); return s.retryLevel(); }
      if (s.phase !== 'answering' || !q) return;

      if (e.key === ' ') { handled(); return say(q.speak); }
      if (e.key === 'Backspace') { handled(); return s.backspace(); }
      if (/^[a-zA-Z]$/.test(e.key)) {
        handled();
        if (q.type === 'choice') return s.chooseOption(e.key);
        return s.inputLetter(e.key);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!question) return null;

  return (
    <section className="hud" aria-live="polite">
      <header className="hud-top">
        <button className="btn btn-ghost" onMouseDown={keepFocus} onClick={() => useBattleStore.getState().exitToMap()}>← 撤退</button>
        <span className="hud-stage">{stageName}<small> {stageNo}/{stageCount}</small></span>
        <button className="btn btn-ghost" onMouseDown={keepFocus} onClick={() => say(question.speak)} aria-label="播放發音" disabled={!question.speak}>🔊</button>
      </header>

      {phase === 'answering' && <AnswerPanel question={question} />}
      {phase === 'feedback' && <FeedbackPanel />}
      {(phase === 'monsterDown' || phase === 'levelClear' || phase === 'gameOver') && <ResultPanel />}
    </section>
  );
}

function QuestionCard({ question }: { question: Question }) {
  return (
    <div className="question-card">
      <span className={`q-tag q-${question.type}`}>{TYPE_LABEL[question.type] ?? question.type}</span>
      <p className="q-desc">{question.desc}</p>
    </div>
  );
}

function AnswerPanel({ question }: { question: Question }) {
  return (
    <>
      <QuestionCard question={question} />
      {(question.type === 'spell' || question.type === 'fill') && <TypingAnswer question={question} />}
      {question.type === 'choice' && <ChoiceAnswer question={question} />}
      {question.type === 'voice' && <VoiceAnswer key={question.desc} />}
    </>
  );
}

function TypingAnswer({ question }: { question: Question }) {
  const typed = useBattleStore(s => s.typed);
  const { inputLetter, backspace } = useBattleStore.getState();
  const slots = answerSlots(question, typed);
  const nextBlank = slots.findIndex(sl => sl.blank && !sl.char);

  return (
    <>
      <div className="slots" aria-label={`已輸入 ${typed || '（空）'}`}>
        {slots.map((sl, i) => (
          <span key={i} className={`slot ${sl.blank ? 'slot-blank' : 'slot-fixed'} ${i === nextBlank ? 'slot-cursor' : ''}`}>{sl.char}</span>
        ))}
      </div>
      <p className="kbd-hint">直接用鍵盤輸入字母，Backspace 刪除，空白鍵聽發音</p>
      <div className="vkbd">
        {KEYBOARD_ROWS.map((row, r) => (
          <div className="vkbd-row" key={row}>
            {row.split('').map(ch => (
              <button key={ch} className="vkbd-key" onMouseDown={keepFocus} onClick={() => inputLetter(ch)}>{ch}</button>
            ))}
            {r === KEYBOARD_ROWS.length - 1 && (
              <button className="vkbd-key vkbd-wide" onMouseDown={keepFocus} onClick={backspace} aria-label="刪除">⌫</button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

function ChoiceAnswer({ question }: { question: Question }) {
  const { chooseOption } = useBattleStore.getState();
  return (
    <>
      <div className="options">
        {question.options?.map(opt => (
          <button key={opt} className="option-btn" onMouseDown={keepFocus} onClick={() => chooseOption(opt[0])}>
            <b>{opt[0]}</b>{opt.slice(2)}
          </button>
        ))}
      </div>
      <p className="kbd-hint">點選答案，或按鍵盤 A / B / C / D</p>
    </>
  );
}

function VoiceAnswer() {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');
  const recognizer = useRef<Recognizer | null>(null);

  useEffect(() => {
    recognizer.current = createRecognizer({
      onStart: () => { setListening(true); setError(''); },
      onResult: (t) => useBattleStore.getState().submitVoice(t),
      onError: (err) => setError(
        err === 'not-allowed' ? '請允許瀏覽器使用麥克風' :
        err === 'no-speech' ? '沒有聽到聲音，再試一次' : `辨識失敗（${err}），再試一次`),
      onEnd: () => setListening(false),
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && useBattleStore.getState().phase === 'answering') {
        e.preventDefault();
        recognizer.current?.start();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); recognizer.current?.stop(); };
  }, []);

  return (
    <div className="voice">
      <button className={`mic-btn ${listening ? 'is-listening' : ''}`} onMouseDown={keepFocus} onClick={() => recognizer.current?.start()} disabled={listening}>
        {listening ? '🎤 聆聽中…' : '🎤 點我開始說'}
      </button>
      {error && <p className="voice-error">{error}</p>}
      <p className="kbd-hint">也可以按 Enter 開始錄音</p>
    </div>
  );
}

function FeedbackPanel() {
  const feedback = useBattleStore(s => s.feedback);
  const say = useSpeak();
  const q = feedback?.question;

  useEffect(() => {
    if (q) say(q.type === 'choice' ? completedSentence(q) : q.speak ?? q.ans);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  if (!feedback || !q) return null;
  const hint = questionHint(q);
  const sentence = completedSentence(q);
  const correctOption = q.options?.find(o => o.startsWith(`${q.ans}.`));
  const audioText = q.type === 'choice' ? sentence : q.speak ?? q.ans;

  return (
    <div className="feedback" role="alert">
      <p className="feedback-title">差一點！一起看看正確答案</p>
      <dl className="feedback-grid">
        <dt>你的答案</dt>
        <dd className="given">{q.type === 'voice' ? `聽成「${feedback.given || '（沒聽到）'}」` : feedback.given}</dd>
        <dt>正確答案</dt>
        <dd className="correct">{q.type === 'choice' ? correctOption : correctWord(q)}</dd>
        {hint && (<><dt>中文</dt><dd>{hint}</dd></>)}
        {sentence && (<><dt>完整句子</dt><dd className="sentence">{sentence}</dd></>)}
      </dl>
      <div className="feedback-actions">
        <button className="btn" onMouseDown={keepFocus} onClick={() => say(audioText)}>🔊 再聽一次</button>
        <button className="btn" onMouseDown={keepFocus} onClick={() => say(audioText, true)}>🐢 慢速</button>
        <button className="btn btn-primary" onMouseDown={keepFocus} onClick={() => useBattleStore.getState().continueAfterFeedback()}>記住了，再試一次 ⏎</button>
      </div>
      <p className="feedback-note">這個字已加入錯題本，之後會再出現讓你複習</p>
    </div>
  );
}

function ResultPanel() {
  const phase = useBattleStore(s => s.phase);
  const { nextStage, exitToMap, retryLevel } = useBattleStore.getState();

  if (phase === 'monsterDown') {
    return (
      <div className="result">
        <p className="result-title">💥 擊敗怪獸！</p>
        <button className="btn btn-primary" onMouseDown={keepFocus} onClick={nextStage}>前往下一關 ⏎</button>
      </div>
    );
  }
  if (phase === 'levelClear') {
    return (
      <div className="result">
        <p className="result-title">🎉 區域完全通關！</p>
        <p>下一個區域已解鎖</p>
        <button className="btn btn-primary" onMouseDown={keepFocus} onClick={exitToMap}>回到世界地圖 ⏎</button>
      </div>
    );
  }
  return (
    <div className="result">
      <p className="result-title">💀 體力耗盡</p>
      <p>別灰心！答錯的單字都記在錯題本裡，下次會更熟。</p>
      <div className="feedback-actions">
        <button className="btn btn-primary" onMouseDown={keepFocus} onClick={retryLevel}>重新挑戰 ⏎</button>
        <button className="btn" onMouseDown={keepFocus} onClick={exitToMap}>回地圖</button>
      </div>
    </div>
  );
}
