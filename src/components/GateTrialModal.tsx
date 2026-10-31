import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import Modal from './Modal';
import QuizRunner from './QuizRunner';
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { REGIONS } from '../game/regions';
import { GATE_LEVEL, canChallengeGate } from '../game/placement';
import { STRICT_TRIALS_PER_DAY, TRIAL_PASS, TRIAL_PER_SKILL, TRIAL_SKILLS, TRIAL_STRICT, emptyTrialScore, regionMastery, strictTrialWait, trialPassed, trialQuestions } from '../game/knowledge';
import type { TrialScore } from '../game/knowledge';
import { questionSkill } from '../game/QuestionData';
import { questionKey } from '../game/battle';
import { loadBank } from '../game/questions/bank/loader';
import type { Question, QuestionSkill } from '../game/types';
import { keepFocus } from './keepFocus';
import { grammarName } from '../game/grammar';

const SKILL_LABEL: Record<QuestionSkill, string> = { listening: '🎧 聽', reading: '📖 讀', speaking: '🗣️ 說', writing: '✍️ 寫' };

// 守門人：打倒區域魔王之後，重建封印（跨日穩定的知識點）並通過區域試煉，才開啟下一區。
// - 封印完成：試煉 24 題答對 18 題、每種能力至少 4 題。
// - 封印還沒完成，或還沒打倒魔王就想跳級（主角要到一定等級）：答對 21 題、每種至少 5 題——用更好的表現證明實力。
// 沒有計時、不會受傷；沒通過沒有損失，可以再挑戰（每次換一批題目）。
export default function GateTrialModal() {
  const regionIdx = useUiStore(s => s.regionIdx);
  const { closeModal, openRegion, celebrate } = useUiStore.getState();
  const { level, knowledge, codex, bossDown, strictTries, skipRegions } = useSaveStore(useShallow(s => ({ level: s.player.level, knowledge: s.knowledge, codex: s.codex, bossDown: s.bossDown, strictTries: s.strictTrials[regionIdx], skipRegions: s.skipRegions })));
  const region = REGIONS[regionIdx];
  const next = REGIONS[regionIdx + 1];
  const [ready, setReady] = useState(false);
  const [now] = useState(() => Date.now());
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState<TrialScore>(emptyTrialScore);
  const [answered, setAnswered] = useState(0);

  useEffect(() => { loadBank(regionIdx).then(() => setReady(true)); }, [regionIdx]);

  const beaten = bossDown.includes(regionIdx);
  const mastery = ready ? regionMastery(regionIdx, knowledge, now) : null;
  const strict = !beaten || !mastery?.sealMet;
  const rule = strict ? TRIAL_STRICT : TRIAL_PASS;
  const wait = strict ? strictTrialWait(strictTries, now) : 0;
  const allowed = (beaten || canChallengeGate(regionIdx, level)) && wait === 0;
  const done = questions !== null && answered >= questions.length;
  const passed = done && trialPassed(score, strict);
  const correct = TRIAL_SKILLS.reduce((n, s) => n + score[s].correct, 0);

  const start = () => {
    if (strict) useSaveStore.getState().recordStrictTrial(regionIdx, Date.now());
    setQuestions(trialQuestions(regionIdx, q => !!codex[questionKey(q)]));
    setScore(emptyTrialScore());
    setAnswered(0);
    setRound(r => r + 1);
  };

  const onAnswer = (ok: boolean) => {
    if (!questions) return;
    const skill = questionSkill(questions[answered]);
    const s = { ...score, [skill]: { correct: score[skill].correct + (ok ? 1 : 0), total: score[skill].total + 1 } };
    setScore(s);
    setAnswered(answered + 1);
    if (answered + 1 >= questions.length && trialPassed(s, strict)) {
      skipRegions(regionIdx + 1);
      celebrate({ icon: '🗿', title: '區域試煉通過！', sub: `守門人讓開了道路${next ? `，「${next.name}」已解鎖` : ''}`, color: '#ffcd4b' });
    }
  };

  return (
    <Modal title={`🗿 守門人：${region?.name ?? ''}`} onClose={closeModal}>
      {!ready ? <p>守門人正在醒來…</p> : questions === null ? (
        <>
          {mastery && mastery.pool > 0 && <SealPanel mastery={mastery} />}
          <p>
            {beaten
              ? (mastery?.sealMet ? '封印已經重建！通過區域試煉，證明你真的學會了，就能前往' : '封印還沒完成也可以直接挑戰試煉，但標準比較高。前往')
              : '覺得這個區域太簡單？通過區域試煉就能直接跳過，前往'}
            「{next?.name}」。
          </p>
          <ul className="muted gate-rules">
            <li>{TRIAL_SKILLS.length * TRIAL_PER_SKILL} 題這一區的題目（聽、讀、說、寫各 {TRIAL_PER_SKILL} 題），盡量出你還沒看過的。</li>
            <li>答對 <b>{rule.total}</b> 題以上，而且每種能力至少 <b>{rule.each}</b> 題，就通過。</li>
            <li>沒有計時、不會受傷；沒通過也沒有損失，可以再挑戰{strict ? `（高標準每天最多 ${STRICT_TRIALS_PER_DAY} 次）` : ''}。</li>
            {!beaten && <li>跳過的區域之後隨時可以回來打，拿星星和召喚券。</li>}
          </ul>
          {wait > 0 && <p>高標準試煉每天最多挑戰 {STRICT_TRIALS_PER_DAY} 次，約 <b>{Math.ceil(wait / 3600000)}</b> 小時後可以再來；完成封印後就沒有這個限制，標準也比較低。</p>}
          {!beaten && !canChallengeGate(regionIdx, level) && <p>主角達到 <b>Lv {GATE_LEVEL[regionIdx]}</b> 才能跳級挑戰（目前 Lv {level}）；或打倒這一區的魔王後再來。</p>}
          <div className="tutorial-actions">
            <button className="btn btn-ghost" onMouseDown={keepFocus} onClick={closeModal}>先不要</button>
            <button className="btn btn-primary" onMouseDown={keepFocus} onClick={start} disabled={!allowed}>開始試煉</button>
          </div>
        </>
      ) : !done ? (
        <QuizRunner key={round} questions={questions} label={i => `第 ${i + 1} / ${questions.length} 題・答對 ${correct}`} onAnswer={onAnswer} />
      ) : (
        <>
          <p className="result-title">{passed ? '🗿 試煉通過！' : '試煉未通過'}</p>
          <p>答對 <b>{correct}</b> / {questions.length} 題（需要 {rule.total} 題、每種至少 {rule.each} 題）</p>
          <ul className="trial-skills">
            {TRIAL_SKILLS.filter(s => score[s].total > 0).map(s => (
              <li key={s} className={score[s].correct >= Math.ceil(rule.each * score[s].total / TRIAL_PER_SKILL) ? 'met' : ''}>
                {SKILL_LABEL[s]} {score[s].correct} / {score[s].total}
              </li>
            ))}
          </ul>
          <p>{passed ? `「${next?.name}」解鎖了！` : '答錯的字已記進錯題本。多複習幾天、讓封印更穩，再來挑戰吧！'}</p>
          <div className="tutorial-actions">
            <button className="btn btn-ghost" onMouseDown={keepFocus} onClick={closeModal}>關閉</button>
            {passed
              ? <button className="btn btn-primary" onMouseDown={keepFocus} onClick={() => openRegion(regionIdx + 1)}>前往「{next?.name}」</button>
              : <button className="btn btn-primary" onMouseDown={keepFocus} onClick={start} disabled={wait > 0}>{wait > 0 ? `${Math.ceil(wait / 3600000)} 小時後再挑戰` : '再挑戰一次'}</button>}
          </div>
        </>
      )}
    </Modal>
  );
}

// 封印進度：已學、跨日穩定（同一天答對很多次只算一次，要分不同天回來複習）
export function SealPanel({ mastery }: { mastery: ReturnType<typeof regionMastery> }) {
  const bar = (n: number, target: number) => <span className="seal-bar"><i style={{ width: `${Math.min(100, (n / Math.max(1, target)) * 100)}%` }} /></span>;
  return (
    <section className={`seal-panel ${mastery.sealMet ? 'is-done' : ''}`}>
      <p className="summary-label">🔮 守門人的封印{mastery.sealMet ? '：已重建 ✔' : ''}</p>
      <p>單字已學會 <b>{Math.min(mastery.learned, mastery.learnTarget)}</b> / {mastery.learnTarget}{bar(mastery.learned, mastery.learnTarget)}</p>
      <p>單字跨日穩定 <b>{Math.min(mastery.stable, mastery.stableTarget)}</b> / {mastery.stableTarget}{bar(mastery.stable, mastery.stableTarget)}</p>
      {mastery.grammarTotal > 0 && (
        <>
          <p>文法已學會 <b>{mastery.grammarLearned}</b> / {mastery.grammarTotal}{bar(mastery.grammarLearned, mastery.grammarTotal)}</p>
          <p>文法跨日穩定 <b>{Math.min(mastery.grammarStable, mastery.grammarStableTarget)}</b> / {mastery.grammarStableTarget}{bar(mastery.grammarStable, mastery.grammarStableTarget)}</p>
          <ul className="grammar-chips" aria-label="核心文法">
            {mastery.grammar.filter(g => g.counted).map(g => (
              <li key={g.id} className={g.stable ? 'is-stable' : g.learned ? 'is-learned' : ''} title={g.stable ? '跨日穩定' : g.learned ? '已學會' : '還沒學會'}>
                {g.stable ? '✔' : g.learned ? '◐' : '○'} {grammarName(g.id)}
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="muted">
        同一個字（或文法）在三個不同的日子答對，才算「穩定」；文法還要答對至少兩道不同的題。{mastery.due > 0 ? `現在有 ${mastery.due} 個到期，打主線就會出現，答對就是封印能量 🔮。` : '今天的複習都做完了，明天再回來，到期的會出現在主線裡。'}
      </p>
    </section>
  );
}
