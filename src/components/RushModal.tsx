import { useEffect, useMemo, useRef, useState } from 'react';
import Modal from './Modal';
import { RUSH_PER_DAY, RUSH_SECONDS, rushQuestions, rushReward } from '../game/modes';
import type { Question } from '../game/types';
import { checkQuizAnswer } from '../game/placement';
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { useSpeak } from './useSpeak';
import { sfx } from '../game/sfx';
import { keepFocus } from './keepFocus';

// 每日素材本：60 秒狂熱快答。只出玩家學過（圖鑑裡）的題目，答完立刻下一題，練語感和反應速度；
// 依答對題數與最高連擊給金幣、經驗與礦石。一天 3 次。
export default function RushModal() {
  const closeModal = useUiStore(s => s.closeModal);
  const save = useSaveStore();
  const today = new Date().toDateString();
  const runsLeft = RUSH_PER_DAY - (save.rushDay === today ? save.rushRuns : 0);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [left, setLeft] = useState(RUSH_SECONDS * 1000);
  const [stats, setStats] = useState({ correct: 0, combo: 0, best: 0 });
  const [flash, setFlash] = useState<'ok' | 'ng' | null>(null);
  const [input, setInput] = useState('');
  const [done, setDone] = useState<ReturnType<typeof rushReward> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const say = useSpeak();
  const q = questions?.[idx % (questions?.length || 1)];

  const start = () => {
    setQuestions(rushQuestions(save.codex, save.unlockedIndex));
    setIdx(0);
    setLeft(RUSH_SECONDS * 1000);
    setStats({ correct: 0, combo: 0, best: 0 });
    setDone(null);
    save.startRush();
  };

  // 倒數計時：時間到就結算（用 ref 拿最新的成績，避免在 effect 裡連鎖 setState）
  const statsRef = useRef(stats);
  useEffect(() => { statsRef.current = stats; }, [stats]);
  useEffect(() => {
    if (!questions || done) return;
    const end = Date.now() + RUSH_SECONDS * 1000;
    const t = window.setInterval(() => {
      const remain = Math.max(0, end - Date.now());
      setLeft(remain);
      if (remain > 0) return;
      window.clearInterval(t);
      const { correct, best } = statsRef.current;
      const sv = useSaveStore.getState();
      const reward = rushReward(correct, best, sv.unlockedIndex);
      sv.grantRush(reward);
      setDone(reward);
      sfx.victory();
    }, 100);
    return () => window.clearInterval(t);
  }, [questions, done]);

  // 聽力題自動播放；拼寫題自動聚焦
  useEffect(() => {
    if (!q) return;
    if (q.speak && q.desc.startsWith('🎧')) say(q.speak);
    inputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, questions]);

  const answer = (given: string) => {
    if (!q || done || left <= 0) return;
    const ok = checkQuizAnswer(q, given);
    save.recordAnswer(q, ok, false);
    setStats(s => {
      const combo = ok ? s.combo + 1 : 0;
      return { correct: s.correct + (ok ? 1 : 0), combo, best: Math.max(s.best, combo) };
    });
    setFlash(ok ? 'ok' : 'ng');
    window.setTimeout(() => setFlash(null), 250);
    if (ok) sfx.coin(); else sfx.wrong();
    setInput('');
    setIdx(i => i + 1);
  };

  const options = useMemo(() => q?.options ?? [], [q]);

  return (
    <Modal title="⚡ 每日素材本：60 秒狂熱快答" onClose={closeModal}>
      {!questions && (
        <>
          <p>只出你學過的題目，{RUSH_SECONDS} 秒內答越多越好！答錯不扣血，但會斷連擊。答對越多、連擊越高，金幣、經驗和礦石越多。</p>
          <p className="muted">今天還可以挑戰 {Math.max(0, runsLeft)} / {RUSH_PER_DAY} 次</p>
          <button className="btn btn-primary" onMouseDown={keepFocus} disabled={runsLeft <= 0} onClick={start}>{runsLeft > 0 ? '開始！' : '今天的次數用完了'}</button>
        </>
      )}
      {questions && !done && q && (
        <div className={`rush ${flash ? `rush-${flash}` : ''}`}>
          <div className="rush-bar"><span style={{ width: `${(left / (RUSH_SECONDS * 1000)) * 100}%` }} /></div>
          <p className="rush-score">✔ {stats.correct}・🔥 {stats.combo} combo・⏱ {Math.ceil(left / 1000)} 秒</p>
          <p className="q-desc">{q.desc}</p>
          {q.speak && q.desc.startsWith('🎧') && <button className="btn btn-small" onMouseDown={keepFocus} onClick={() => say(q.speak)}>🔊 再聽一次</button>}
          {q.type === 'choice' ? (
            <div className="rush-options">
              {options.map(o => <button key={o} className="btn" onMouseDown={keepFocus} onClick={() => answer(o.slice(0, 1))}>{o}</button>)}
            </div>
          ) : (
            <form className="trial-input" onSubmit={e => { e.preventDefault(); answer(input); }}>
              <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} autoComplete="off" autoCapitalize="characters" spellCheck={false}
                aria-label="輸入答案" placeholder={q.type === 'fill' ? '填入空格的字母（或整個單字）' : '輸入英文單字'} />
              <button className="btn btn-primary" type="submit">確認 ⏎</button>
            </form>
          )}
        </div>
      )}
      {done && (
        <>
          <p>答對 <b>{stats.correct}</b> 題、最高 <b>{stats.best}</b> combo！</p>
          <p>得到 🪙 {done.gold}、⭐ 經驗 {done.xp}、🪨 礦石 {done.ore}</p>
          <button className="btn btn-primary" onMouseDown={keepFocus} onClick={closeModal}>完成</button>
        </>
      )}
    </Modal>
  );
}
