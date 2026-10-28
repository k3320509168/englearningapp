import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import Modal from './Modal';
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { RARITY_INFO, currentRarity, heroDef, heroTitle, heroWord } from '../game/heroes';
import { TRIALS, TRIAL_COUNT, TRIAL_SHARDS, TRUE_NAME_BONUS, checkTyped, isTrueName, revealedName, trialQuestion, trialsDone } from '../game/trueName';
import type { TrialQuestion } from '../game/trueName';
import { checkVoice } from '../game/battle';
import { createRecognizer, isSpeechRecognitionSupported } from '../game/speech';
import type { Recognizer } from '../game/speech';
import { heroDataUrl } from '../game/art/sprites';
import { sfx } from '../game/sfx';
import { useSpeak } from './useSpeak';
import { keepFocus } from './keepFocus';

type Result = { correct: boolean; given: string } | null;

// 真名考驗：英雄的名字是空白的刻痕，完成五項考驗把字母填滿，成為真名英雄（基礎能力 +50%）
export default function TrueNameModal() {
  const heroId = useUiStore(s => s.heroId);
  const { openModal } = useUiStore.getState();
  const progress = useSaveStore(s => s.trueName[heroId]);
  const tier = useSaveStore(s => s.heroTier[heroId] ?? 0);
  const completeTrial = useSaveStore(s => s.completeTrial);
  const [active, setActive] = useState<number | null>(null);
  const [round, setRound] = useState(0); // 重新出題（答錯後再試一次）
  const h = heroDef(heroId);
  const rarity = currentRarity(h, tier);
  const letters = revealedName(heroId, progress);
  const done = trialsDone(progress);
  const named = isTrueName(progress);
  const portrait = useMemo(() => heroDataUrl(heroId, 3), [heroId]);
  // 同一次挑戰固定題目（選項不會因為畫面更新而重新洗牌）；round 改變（再試一次）時才重新出題
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const question = useMemo(() => (active === null ? null : trialQuestion(heroId, active)), [heroId, active, round]);

  const back = () => openModal('heroes');

  return (
    <Modal title="✦ 真名考驗" onClose={back} wide>
      <section className={`truename-head ${named ? 'is-named' : ''}`} style={{ '--rarity': RARITY_INFO[rarity].color } as CSSProperties}>
        <img src={portrait} alt="" />
        <div>
          <div className="name-slots" aria-label={named ? `真名 ${h.id}` : `已解開 ${done} / ${TRIAL_COUNT}`}>
            {letters.map((ch, i) => <span key={i} className={ch ? 'is-filled' : ''}>{ch}</span>)}
          </div>
          <p className="muted">{heroTitle(h)}・{h.meaning}</p>
          <p className={named ? 'req-ok' : 'muted'}>
            {named ? `✦ 真名英雄：基礎能力 +${TRUE_NAME_BONUS * 100}%` : `完成 ${done} / ${TRIAL_COUNT} 項。全部完成後基礎能力 +${TRUE_NAME_BONUS * 100}%，每項送碎片 ◆${TRIAL_SHARDS}`}
          </p>
        </div>
      </section>

      <ol className="trial-list">
        {TRIALS.map((t, i) => {
          const passed = progress?.[i] ?? false;
          return (
            <li key={t.id} className={`trial-row ${passed ? 'is-done' : ''} ${active === i ? 'is-active' : ''}`}>
              <span className="trial-icon">{t.icon}</span>
              <b>{t.name}</b>
              {passed ? <span className="req-ok">✔ 完成</span> : (
                <button className="btn btn-small btn-primary" onMouseDown={keepFocus} onClick={() => { setActive(i); setRound(r => r + 1); }}>
                  {active === i ? '重新出題' : '挑戰'}
                </button>
              )}
            </li>
          );
        })}
      </ol>

      {active !== null && question && !(progress?.[active]) && (
        <TrialPanel
          key={`${active}-${round}`}
          question={question}
          onPass={() => {
            completeTrial(heroId, active);
            sfx.victory();
            // 五項全部完成：真名英雄誕生
            if (isTrueName(useSaveStore.getState().trueName[heroId])) {
              const h = heroDef(heroId);
              useUiStore.getState().celebrate({ icon: '✨', title: `真名覺醒：${heroWord(h)}`, sub: `${heroTitle(h)}的基礎能力 +${Math.round(TRUE_NAME_BONUS * 100)}%`, img: heroDataUrl(heroId, 4), color: '#ffcd4b' });
            }
            window.setTimeout(() => setActive(null), 900);
          }}
          onRetry={() => setRound(r => r + 1)}
        />
      )}

      <div className="tutorial-actions">
        <button className="btn btn-ghost" onMouseDown={keepFocus} onClick={back}>← 回到英雄</button>
      </div>
    </Modal>
  );
}

function TrialPanel({ question, onPass, onRetry }: { question: TrialQuestion; onPass: () => void; onRetry: () => void }) {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<Result>(null);
  const [listening, setListening] = useState(false);
  const say = useSpeak();
  const recognizer = useRef<Recognizer | null>(null);
  const voiceAsSpelling = useSaveStore(s => s.settings.voiceAsSpelling);
  // 沒有麥克風（或設定暫不使用）時，發音考驗改成「聽寫」
  const dictation = question.kind === 'voice' && (!isSpeechRecognitionSupported() || voiceAsSpelling);

  const judge = (given: string, correct: boolean) => {
    setResult({ correct, given });
    if (correct) onPass(); else sfx.wrong();
  };

  useEffect(() => {
    if (question.kind !== 'voice' || dictation) return;
    recognizer.current = createRecognizer({
      onStart: () => setListening(true),
      onResult: (t) => judge(t[0] ?? '', checkVoice({ type: 'voice', desc: '', ans: question.answer }, t)),
      onError: () => setListening(false),
      onEnd: () => setListening(false),
    });
    return () => recognizer.current?.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitTyped = () => { if (input.trim()) judge(input.trim(), checkTyped(question.answer, input)); };

  return (
    <section className="trial-panel">
      <p className="trial-prompt">{dictation ? '聽發音，拼出這個字' : question.prompt}</p>
      {question.sub && !dictation && <p className="muted">{question.sub}</p>}
      {question.speak && question.kind !== 'type' || dictation ? (
        <span className="feedback-actions">
          <button className="btn btn-small" onMouseDown={keepFocus} onClick={() => say(question.speak)}>🔊 聽發音</button>
          <button className="btn btn-small" onMouseDown={keepFocus} onClick={() => say(question.speak, true)}>🐢 慢速</button>
        </span>
      ) : null}

      {result === null || !result.correct ? (
        <>
          {(question.kind === 'type' || dictation) && (
            <form className="trial-input" onSubmit={e => { e.preventDefault(); submitTyped(); }}>
              <input value={input} onChange={e => setInput(e.target.value)} autoFocus autoComplete="off" autoCapitalize="characters" spellCheck={false} aria-label="輸入答案" />
              <button className="btn btn-primary" type="submit">確認 ⏎</button>
            </form>
          )}
          {question.kind === 'choice' && (
            <div className="options">
              {question.options!.map(opt => (
                <button key={opt} className="option-btn" onMouseDown={keepFocus} onClick={() => judge(opt, opt === question.answer)} disabled={result !== null}>{opt}</button>
              ))}
            </div>
          )}
          {question.kind === 'voice' && !dictation && (
            <button className={`mic-btn ${listening ? 'is-listening' : ''}`} onMouseDown={keepFocus} onClick={() => recognizer.current?.start()} disabled={listening}>
              {listening ? '🎤 聆聽中…' : '🎤 點我開始說'}
            </button>
          )}
        </>
      ) : null}

      {result && (
        result.correct
          ? <p className="trial-result is-correct">✔ 正確！名字又亮起了幾個字母。</p>
          : (
            <div className="trial-result is-wrong">
              <p>差一點！{question.kind === 'voice' && !dictation ? `聽成「${result.given}」，` : ''}正確答案是 <b>{question.kind === 'choice' ? question.answer : question.answer.toLowerCase()}</b></p>
              <button className="btn btn-small" onMouseDown={keepFocus} onClick={onRetry}>再試一次</button>
            </div>
          )
      )}
    </section>
  );
}
