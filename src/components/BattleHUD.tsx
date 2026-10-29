import { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useBattleStore } from '../store/battleStore';
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { answerSlots, completedSentence, questionHint } from '../game/battle';
import { vocabFor } from '../game/vocab';
import type { Question } from '../game/types';
import { VOICE_WAIT_MS, createRecognizer, hasEnglishVoice, isSpeechRecognitionSupported, recognitionErrorText } from '../game/speech';
import { spellingExtra } from '../game/questionHelp';
import { HINTS, pickHint } from '../game/hints';
import { skillReady } from '../game/party';
import type { Recognizer } from '../game/speech';
import { useSpeak } from './useSpeak';
import { keepFocus } from './keepFocus';
import LessonPanel from './LessonPanel';
import SummaryPanel from './SummaryPanel';
import { BattleStatusBar, ItemMenu } from './BattleExtras';
import { mapName, stageLabel } from '../game/regions';
import { BossQuestionTag, CastConfirm, PartyBar, SkillButtons, TimerBars } from './BattleParty';
import { useBattleClock } from './useBattleClock';
import { finishBattle } from '../game/startLevel';

// 作答介面：電腦用實體鍵盤，手機用螢幕鍵盤與按鈕（RWD）。

const TYPE_LABEL: Record<string, string> = { spell: '拼寫', fill: '填空', choice: '選擇', voice: '口說' };
const KEYBOARD_ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

const correctWord = (q: Question) => (q.type === 'fill' ? (q.speak ?? q.ans).toUpperCase() : q.ans);

export default function BattleHUD() {
  const { question, questionSeq, phase, stageName, stageNo, stageCount, shield } = useBattleStore(useShallow(s => ({
    question: s.question,
    questionSeq: s.questionSeq,
    phase: s.phase,
    // 例如「風車丘 2-5：菁英怪」
    stageName: s.mode === 'skill' ? `⚔️ 魔王挑戰：${s.stages[0]?.name ?? ''}`
      : s.mode === 'golden'
      ? `👑 黃金之路・${(s.stages[s.stageIdx]?.name ?? '').replace(/^第 \d+ 關：/, '')}`
      : `${mapName(s.levelKey, s.stageIdx)} ${stageLabel(s.stageIdx)}：${(s.stages[s.stageIdx]?.name ?? '').replace(/^第 \d+ 關：/, '')}`,
    stageNo: s.stageIdx + 1,
    stageCount: s.stages.length,
    shield: s.shield,
  })));
  const openModal = useUiStore(s => s.openModal);
  const retreatAsk = useUiStore(s => s.retreatAsk);
  const setRetreatAsk = useUiStore(s => s.setRetreatAsk);
  const say = useSpeak();
  useBattleClock();
  // 離開戰鬥時關掉撤退確認
  useEffect(() => () => useUiStore.getState().setRetreatAsk(false), []);

  // 新題目出現時自動播放發音（可在設定關閉）
  useEffect(() => {
    const { question: q, phase: p } = useBattleStore.getState();
    // 聽力題（題目只有聲音）不管設定都要播放
    // 魔王的「視覺剝奪」看不到題目時也一定要播放
    if (q?.speak && p === 'answering' && (useSaveStore.getState().settings.autoSpeak || q.desc.startsWith('🎧') || useBattleStore.getState().blind)) say(q.speak);
    // 第一次遇到口說題才詢問麥克風（視窗打開時戰鬥計時會暫停）
    if (q?.type === 'voice' && !useSaveStore.getState().micAsked && isSpeechRecognitionSupported()) openModal('mic');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionSeq]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || useUiStore.getState().modal) return;
      // 注音等中文輸入法開著時，瀏覽器給的是 Process 而不是字母：提示玩家切換成英文
      if (e.key === 'Process' || e.isComposing) { useUiStore.getState().setImeWarning(true); return; }
      const s = useBattleStore.getState();
      const q = s.question;
      const handled = () => e.preventDefault();

      // 撤退確認：Enter 撤退、Esc 取消
      const ui = useUiStore.getState();
      if (ui.retreatAsk) {
        if (e.key === 'Enter') { handled(); ui.setRetreatAsk(false); return s.exitToMap(); }
        if (e.key === 'Escape') { handled(); return ui.setRetreatAsk(false); }
        return;
      }
      if (s.phase === 'casting') {
        if (e.key === 'Escape') { handled(); return s.cancelSkill(); }
        if (e.key === 'Enter') { handled(); return s.confirmSkill(); }
        return;
      }
      // Esc 先問要不要撤退，不會一按就離開（戰鬥結束後的結算畫面才直接離開）
      if (e.key === 'Escape') {
        handled();
        return s.phase === 'answering' || s.phase === 'feedback' || s.phase === 'lesson' ? ui.setRetreatAsk(true) : s.exitToMap();
      }
      if (s.phase === 'lesson' && e.key === 'Enter') { handled(); return s.startBattle(); }
      if (s.phase === 'feedback' && (e.key === 'Enter' || e.key === ' ')) { handled(); return s.continueAfterFeedback(); }
      if ((s.phase === 'monsterDown' || s.phase === 'summary') && e.key === 'Enter') { handled(); return s.nextStage(); }
      // 通關：和「回到世界地圖」按鈕走同一個流程（通關劇情、稱號、黃金之路結局）
      if (s.phase === 'levelClear' && e.key === 'Enter') { handled(); return finishBattle(); }
      // 失敗畫面不接受 Enter：連按 Enter 的玩家才不會沒看到結算就直接重來
      if (s.phase !== 'answering' || !q) return;

      if (e.key === ' ') { handled(); return say(q.speak); }
      // 1～4：施放對應隊員的技能（答案只會是英文字母，數字鍵不會衝突）
      if (/^[1-4]$/.test(e.key)) { handled(); return s.requestSkill(Number(e.key) - 1); }
      if (e.key === 'Backspace') { handled(); return s.backspace(); }
      if (e.key === 'Enter' && (q.type === 'spell' || q.type === 'fill')) { handled(); return s.submitTyped(); }
      if (/^[a-zA-Z]$/.test(e.key)) {
        handled();
        useUiStore.getState().setImeWarning(false);
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
        <button className="btn btn-ghost btn-small" onMouseDown={keepFocus} onClick={() => setRetreatAsk(true)} aria-label="撤退回地圖">←<span className="btn-label"> 撤退</span></button>
        <span className="hud-stage">
          {stageName}<small> {stageNo}/{stageCount}</small>
          {shield && <span className="shield-badge" title="護盾：下一次答錯不扣血">🛡️</span>}
        </span>
        <div className="hud-tools">
          <ItemMenu />
          <button className="btn btn-ghost btn-small" onMouseDown={keepFocus} onClick={() => useBattleStore.getState().openLesson()} disabled={phase !== 'answering'} aria-label="戰前預習">📖</button>
          <button className="btn btn-ghost btn-small" onMouseDown={keepFocus} onClick={() => say(question.speak)} disabled={!question.speak || phase !== 'answering'} aria-label="播放發音">🔊</button>
          <button className="btn btn-ghost btn-small" onMouseDown={keepFocus} onClick={() => openModal('settings')} aria-label="設定">⚙️</button>
        </div>
      </header>

      {retreatAsk && (
        <div className="retreat-ask" role="dialog" aria-label="確定撤退">
          <span>確定要撤退回地圖嗎？目前的關卡進度、金幣和經驗都會保留。</span>
          <button className="btn btn-small btn-ghost" onMouseDown={keepFocus} onClick={() => setRetreatAsk(false)}>繼續戰鬥 Esc</button>
          <button className="btn btn-small btn-danger" onMouseDown={keepFocus} onClick={() => { setRetreatAsk(false); useBattleStore.getState().exitToMap(); }}>撤退 ⏎</button>
        </div>
      )}
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

// 有沒有英文語音：語音清單載入完成（或等待逾時）後重新判斷一次
function useEnglishVoice(): boolean {
  const [has, setHas] = useState(hasEnglishVoice);
  useEffect(() => {
    const update = () => setHas(hasEnglishVoice());
    const t = window.setTimeout(update, VOICE_WAIT_MS + 50);
    window.speechSynthesis?.addEventListener?.('voiceschanged', update);
    return () => { window.clearTimeout(t); window.speechSynthesis?.removeEventListener?.('voiceschanged', update); };
  }, []);
  return has;
}

function QuestionCard({ question }: { question: Question }) {
  const extra = spellingExtra(question);
  // 聽力題（題目只有聲音）：這台裝置沒有英文語音時改成顯示單字，不然完全無法作答
  const englishVoice = useEnglishVoice();
  const silent = question.desc.startsWith('🎧') && !englishVoice;
  // 魔王「視覺剝奪」：有發音的題目把題目文字藏起來，只能用聽的（沒有英文語音的裝置照常顯示）
  const blind = useBattleStore(s => s.blind) && !!question.speak && englishVoice;
  return (
    <div className="question-card">
      <span className={`q-tag q-${question.type}`}>{TYPE_LABEL[question.type] ?? question.type}</span>
      {blind
        ? <p className="q-desc">🌫️ 迷霧遮住了題目，仔細聽發音！</p>
        : <p className="q-desc">{question.desc}{extra && <small className="q-extra">（{extra}）</small>}</p>}
      {silent && question.speak && <p className="q-silent">這台裝置沒有英文語音，改成顯示單字：<b>{question.speak}</b></p>}
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

// 情境提示：遇到才教，每則只出現一次；按「知道了」或答完這題就不再出現
function BattleHint({ question }: { question: Question }) {
  const { combo, isBossQuestion, ready, questionSeq, partySize } = useBattleStore(useShallow(s => ({
    combo: s.combo, isBossQuestion: s.isBossQuestion, ready: s.party.some(skillReady), questionSeq: s.questionSeq,
    partySize: s.party.length,
  })));
  const seen = useSaveStore(s => s.hintsSeen);
  const markHint = useSaveStore(s => s.markHint);
  const id = pickHint({ questionType: question.type, combo, isBossQuestion, skillReady: ready, partySize }, seen);

  // 提示顯示時計時暫停，按「知道了」才開始計時（不讓讀說明吃掉作答時間）
  useEffect(() => {
    useUiStore.getState().setHintOpen(!!id);
    return () => useUiStore.getState().setHintOpen(false);
  }, [id]);

  // 提示顯示過、而且這題答完（換題或離開作答）後就算看過了
  useEffect(() => {
    if (!id) return;
    return () => {
      const s = useBattleStore.getState();
      if (s.questionSeq !== questionSeq || s.phase !== 'answering') markHint(id);
    };
  }, [id, questionSeq, markHint]);

  if (!id) return null;
  const hint = HINTS[id];
  return (
    <p className="battle-hint" role="note">
      <span aria-hidden>{hint.icon}</span>
      <span>{hint.text}<small className="hint-paused">⏸ 計時暫停中，按「知道了」開始</small></span>
      <button className="btn btn-ghost btn-small" onMouseDown={keepFocus} onClick={() => markHint(id)}>知道了</button>
    </p>
  );
}

function ImeWarning() {
  const on = useUiStore(s => s.imeWarning);
  if (!on) return null;
  return <p className="ime-warning" role="alert">⌨️ 偵測到中文輸入法（注音），英文字母打不進去。請按 <b>Shift</b> 或切換成英文輸入再作答。</p>;
}

function AnswerPanel({ question }: { question: Question }) {
  return (
    <>
      <ImeWarning />
      <BattleHint question={question} />
      <SkillButtons />
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
  const { inputLetter, backspace, submitTyped } = useBattleStore.getState();
  const slots = answerSlots(question, typed);
  const full = typed.length >= question.ans.length;
  const slotsRef = useRef<HTMLDivElement>(null);
  // 手機：鍵盤固定在下方，換題時把字母格捲到畫面中間，打字時看得到
  useEffect(() => {
    if (window.matchMedia?.('(max-width: 560px) and (pointer: coarse)').matches) slotsRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [question]);
  const nextBlank = slots.findIndex(sl => sl.blank && !sl.char);
  let blankIdx = 0;

  return (
    <>
      <div className="slots" ref={slotsRef} aria-label={`已輸入 ${typed || '（空）'}`}>
        {slots.map((sl, i) => {
          const isRevealed = sl.blank && blankIdx++ < revealed;
          return (
            <span key={i} className={`slot ${sl.blank ? 'slot-blank' : 'slot-fixed'} ${i === nextBlank ? 'slot-cursor' : ''} ${isRevealed ? 'slot-revealed' : ''}`}>{sl.char}</span>
          );
        })}
      </div>
      <div className="submit-row">
        <p className="kbd-hint">用鍵盤輸入字母，Backspace 修改，<b>Enter 送出</b>；空白鍵聽發音</p>
        <button className={`btn btn-small ${full ? 'btn-primary' : ''}`} onMouseDown={keepFocus} onClick={submitTyped} disabled={!typed}>送出 ⏎</button>
      </div>
      <div className="vkbd">
        {KEYBOARD_ROWS.map((row, r) => (
          <div className="vkbd-row" key={row}>
            {row.split('').map(ch => (
              <button key={ch} className="vkbd-key" onMouseDown={keepFocus} onClick={() => inputLetter(ch)}>{ch}</button>
            ))}
            {r === KEYBOARD_ROWS.length - 1 && (
              <>
                <button className="vkbd-key vkbd-wide" onMouseDown={keepFocus} onClick={backspace} aria-label="刪除">⌫</button>
                <button className={`vkbd-key vkbd-wide vkbd-enter ${full ? 'is-ready' : ''}`} onMouseDown={keepFocus} onClick={submitTyped} disabled={!typed} aria-label="送出">⏎</button>
              </>
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

// 改用拼寫：眼前這題立刻轉成拼寫，並打開「口說題改成拼寫題」設定（之後的關卡也適用）
function switchVoiceToSpelling() {
  useSaveStore.getState().updateSettings({ voiceAsSpelling: true });
  useBattleStore.getState().switchToSpelling();
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
      onError: (err) => {
        // 玩家拒絕使用麥克風：口說題改成拼寫，之後的關卡也是（設定可以再改回來）。
        // 其他錯誤（麥克風暫時被占用、網路、辨識服務）只是這一次失敗，說明原因讓玩家再試，不自動改設定
        if (err === 'not-allowed') return switchVoiceToSpelling();
        setError(recognitionErrorText(err));
      },
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
      <button className="btn btn-ghost btn-small" onMouseDown={keepFocus} onClick={switchVoiceToSpelling}>⌨️ 不方便說話？改用拼寫作答</button>
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
        {vocab && <button className="btn" onMouseDown={keepFocus} onClick={() => useUiStore.getState().openStudy(vocab.key)}>📖 學這個字</button>}
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
