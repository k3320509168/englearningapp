import { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useBattleStore } from '../store/battleStore';
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { answerSlots, completedSentence, questionHint } from '../game/battle';
import { vocabFor } from '../game/vocab';
import type { Question } from '../game/types';
import { createRecognizer } from '../game/speech';
import type { Recognizer } from '../game/speech';
import { useSpeak } from './useSpeak';
import { keepFocus } from './keepFocus';
import LessonPanel from './LessonPanel';
import SummaryPanel from './SummaryPanel';
import { BattleStatusBar } from './BattleExtras';
import { BossQuestionTag, CastConfirm, PartyBar, TimerBars } from './BattleParty';
import { useBattleClock } from './useBattleClock';

// 作答介面：電腦用實體鍵盤，手機用螢幕鍵盤與按鈕（RWD）。

const TYPE_LABEL: Record<string, string> = { spell: '拼寫', fill: '填空', choice: '選擇', voice: '口說' };
const KEYBOARD_ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

const correctWord = (q: Question) => (q.type === 'fill' ? (q.speak ?? q.ans).toUpperCase() : q.ans);

export default function BattleHUD() {
  const { question, questionSeq, phase, stageName, stageNo, stageCount, shield } = useBattleStore(useShallow(s => ({
    question: s.question,
    questionSeq: s.questionSeq,
    phase: s.phase,
    stageName: s.stages[s.stageIdx]?.name ?? '',
    stageNo: s.stageIdx + 1,
    stageCount: s.stages.length,
    shield: s.shield,
  })));
  const openModal = useUiStore(s => s.openModal);
  const say = useSpeak();
  useBattleClock();

  // 新題目出現時自動播放發音（可在設定關閉）
  useEffect(() => {
    const { question: q, phase: p } = useBattleStore.getState();
    if (q?.speak && p === 'answering' && useSaveStore.getState().settings.autoSpeak) say(q.speak);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionSeq]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || useUiStore.getState().modal) return;
      const s = useBattleStore.getState();
      const q = s.question;
      const handled = () => e.preventDefault();

      if (s.phase === 'casting') {
        if (e.key === 'Escape') { handled(); return s.cancelSkill(); }
        if (e.key === 'Enter') { handled(); return s.confirmSkill(); }
        return;
      }
      if (e.key === 'Escape') { handled(); return s.exitToMap(); }
      if (s.phase === 'lesson' && e.key === 'Enter') { handled(); return s.startBattle(); }
      if (s.phase === 'feedback' && (e.key === 'Enter' || e.key === ' ')) { handled(); return s.continueAfterFeedback(); }
      if ((s.phase === 'monsterDown' || s.phase === 'summary') && e.key === 'Enter') { handled(); return s.nextStage(); }
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
        <button className="btn btn-ghost btn-small" onMouseDown={keepFocus} onClick={() => useBattleStore.getState().exitToMap()} aria-label="撤退回地圖">←<span className="btn-label"> 撤退</span></button>
        <span className="hud-stage">
          {stageName}<small> {stageNo}/{stageCount}</small>
          {shield && <span className="shield-badge" title="護盾：下一次答錯不扣血">🛡️</span>}
        </span>
        <div className="hud-tools">
          <button className="btn btn-ghost btn-small" onMouseDown={keepFocus} onClick={() => useBattleStore.getState().openLesson()} disabled={phase !== 'answering'} aria-label="戰前預習">📖</button>
          <button className="btn btn-ghost btn-small" onMouseDown={keepFocus} onClick={() => say(question.speak)} disabled={!question.speak || phase !== 'answering'} aria-label="播放發音">🔊</button>
          <button className="btn btn-ghost btn-small" onMouseDown={keepFocus} onClick={() => openModal('settings')} aria-label="設定">⚙️</button>
        </div>
      </header>

      <BattleStatusBar />
      <PartyBar />
      <TimerBars />
      {phase === 'lesson' && <LessonPanel />}
      {phase === 'casting' && <CastConfirm />}
      {(phase === 'answering' || phase === 'casting') && <AnswerPanel question={question} />}
      {phase === 'feedback' && <FeedbackPanel />}
      {phase === 'monsterDown' && <StageClearPanel />}
      {(phase === 'summary' || phase === 'levelClear' || phase === 'gameOver') && <SummaryPanel />}
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

function AssistBanner({ question }: { question: Question }) {
  const assist = useBattleStore(s => s.assist);
  const source = useBattleStore(s => s.assistSource);
  if (!assist) return null;
  const tip = question.type === 'choice' ? '刪掉了兩個錯誤選項'
    : assist.revealed ? `填好了第一個字母「${assist.revealed}」`
    : question.type === 'voice' ? '把要唸的字寫出來了'
    : '重播了發音';
  if (source === 'item') return <p className="assist-banner">💡 提示卷軸：{tip}</p>;
  return <p className="assist-banner">🧚 援軍登場！幫你{tip}，還會替你擋下一次傷害 🛡️</p>;
}

function AnswerPanel({ question }: { question: Question }) {
  return (
    <>
      <AssistBanner question={question} />
      <BossQuestionTag />
      <QuestionCard question={question} />
      {(question.type === 'spell' || question.type === 'fill') && <TypingAnswer question={question} />}
      {question.type === 'choice' && <ChoiceAnswer question={question} />}
      {question.type === 'voice' && <VoiceAnswer key={question.desc} question={question} />}
    </>
  );
}

function TypingAnswer({ question }: { question: Question }) {
  const typed = useBattleStore(s => s.typed);
  const revealed = useBattleStore(s => s.assist?.revealed.length ?? 0);
  const { inputLetter, backspace } = useBattleStore.getState();
  const slots = answerSlots(question, typed);
  const nextBlank = slots.findIndex(sl => sl.blank && !sl.char);
  let blankIdx = 0;

  return (
    <>
      <div className="slots" aria-label={`已輸入 ${typed || '（空）'}`}>
        {slots.map((sl, i) => {
          const isRevealed = sl.blank && blankIdx++ < revealed;
          return (
            <span key={i} className={`slot ${sl.blank ? 'slot-blank' : 'slot-fixed'} ${i === nextBlank ? 'slot-cursor' : ''} ${isRevealed ? 'slot-revealed' : ''}`}>{sl.char}</span>
          );
        })}
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
  const hidden = useBattleStore(s => s.assist?.hiddenOptions);
  const { chooseOption } = useBattleStore.getState();
  return (
    <>
      <div className="options">
        {question.options?.map(opt => {
          const isHidden = hidden?.includes(opt[0]);
          return (
            <button key={opt} className={`option-btn ${isHidden ? 'is-hidden' : ''}`} disabled={isHidden} onMouseDown={keepFocus} onClick={() => chooseOption(opt[0])}>
              <b>{opt[0]}</b>{opt.slice(2)}
            </button>
          );
        })}
      </div>
      <p className="kbd-hint">點選答案，或按鍵盤 A / B / C / D</p>
    </>
  );
}

function VoiceAnswer({ question }: { question: Question }) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');
  const showWord = useBattleStore(s => s.assist?.showWord ?? false);
  const recognizer = useRef<Recognizer | null>(null);
  const say = useSpeak();

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
      if (e.key === 'Enter' && useBattleStore.getState().phase === 'answering' && !useUiStore.getState().modal) {
        e.preventDefault();
        recognizer.current?.start();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); recognizer.current?.stop(); };
  }, []);

  // 援軍：顯示要唸的字並慢速示範
  useEffect(() => {
    if (showWord) say(question.speak ?? question.ans, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showWord]);

  return (
    <div className="voice">
      {showWord && <p className="voice-word">{(question.speak ?? question.ans).toLowerCase()}</p>}
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
  const vocab = vocabFor(q);
  const hint = vocab?.meaning ?? questionHint(q);
  const sentence = completedSentence(q);
  const correctOption = q.options?.find(o => o.startsWith(`${q.ans}.`));
  const audioText = q.type === 'choice' ? sentence : q.speak ?? q.ans;

  return (
    <div className="feedback" role="alert">
      <p className="feedback-title">{feedback.timeout ? '⏰ 時間到！一起看看正確答案' : '差一點！一起看看正確答案'}</p>
      <dl className="feedback-grid">
        <dt>你的答案</dt>
        <dd className="given">{feedback.timeout ? '（沒有在時間內作答）' : q.type === 'voice' ? `聽成「${feedback.given || '（沒聽到）'}」` : feedback.given}</dd>
        <dt>正確答案</dt>
        <dd className="correct">{q.type === 'choice' ? correctOption : correctWord(q)}</dd>
        {hint && (<><dt>中文</dt><dd>{vocab?.pos && <span className="pos">{vocab.pos}</span>} {hint}</dd></>)}
        {sentence && (<><dt>完整句子</dt><dd className="sentence">{sentence}</dd></>)}
        {q.explain && (<><dt>解說</dt><dd>💡 {q.explain}</dd></>)}
        {vocab && (<><dt>例句</dt><dd><span className="sentence">{vocab.example}</span><br /><span className="muted">{vocab.exampleZh}</span></dd></>)}
      </dl>
      <div className="feedback-actions">
        <button className="btn" onMouseDown={keepFocus} onClick={() => say(audioText)}>🔊 再聽一次</button>
        <button className="btn" onMouseDown={keepFocus} onClick={() => say(audioText, true)}>🐢 慢速</button>
        {vocab && <button className="btn" onMouseDown={keepFocus} onClick={() => say(vocab.example)}>🔊 例句</button>}
        <button className="btn btn-primary" onMouseDown={keepFocus} onClick={() => useBattleStore.getState().continueAfterFeedback()}>記住了，再試一次 ⏎</button>
      </div>
      <p className="feedback-note">這個字已加入錯題本，之後會再出現讓你複習</p>
    </div>
  );
}

function StageClearPanel() {
  const nextStage = useBattleStore(s => s.nextStage);
  return (
    <div className="result">
      <p className="result-title">💥 擊敗怪獸！</p>
      <button className="btn btn-primary" onMouseDown={keepFocus} onClick={nextStage}>前往下一關 ⏎</button>
    </div>
  );
}
