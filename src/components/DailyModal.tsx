import { useEffect } from 'react';
import Modal from './Modal';
import { SHARD_QUIZ_MAX, useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { STREAK_MILESTONES, claimableMilestones, nextMilestone, taskDef } from '../game/daily';
import type { DailyTask } from '../game/daily';
import { sfx } from '../game/sfx';
import { keepFocus } from './keepFocus';

// 任務清單（每日、每週共用）
function renderTasks(tasks: DailyTask[], claim: (id: string) => boolean) {
  return (
    <ul className="daily-list">
      {tasks.map(t => {
        const def = taskDef(t.id);
        if (!def) return null;
        const done = t.progress >= def.goal;
        return (
          <li key={t.id} className={`daily-item ${t.claimed ? 'is-claimed' : done ? 'is-done' : ''}`}>
            <div className="daily-info">
              <b>{def.label}</b>
              <span className="daily-track"><span style={{ width: `${Math.min(100, (t.progress / def.goal) * 100)}%` }} /></span>
              <small className="muted">{t.progress} / {def.goal}・獎勵 🪙{def.reward.gold}{def.reward.tickets ? ` 🎫×${def.reward.tickets}` : ''}</small>
            </div>
            {t.claimed ? <span className="hero-tag">已領取</span> : (
              <button className="btn btn-small btn-primary" onMouseDown={keepFocus} disabled={!done}
                onClick={() => { if (claim(t.id)) sfx.coin(); }}>{done ? '領取' : '進行中'}</button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// 每日與每週任務：完成後領取獎勵；顯示連續登入天數
export default function DailyModal() {
  const closeModal = useUiStore(s => s.closeModal);
  const daily = useSaveStore(s => s.daily);
  const weekly = useSaveStore(s => s.weekly);
  const shardQuizDone = useSaveStore(s => s.shardQuizDay === new Date().toDateString());
  const { ensureDaily, claimDaily, claimStreak, claimWeekly } = useSaveStore.getState();
  useEffect(() => { ensureDaily(); }, [ensureDaily]);
  if (!daily) return null;
  const claimable = claimableMilestones(daily);
  const next = nextMilestone(daily.streak);

  return (
    <Modal title="📅 每日・每週任務" onClose={closeModal}>
      <button className="btn btn-primary shard-quiz-btn" onMouseDown={keepFocus}
        onClick={() => useUiStore.getState().openModal('shardQuiz')}>
        💎 每日碎片英文題{shardQuizDone ? '（今天已完成）' : `（答對最多拿 ${SHARD_QUIZ_MAX} 片）`}
      </button>
      <section className="streak" aria-label="連續登入">
        <p className="shop-gold">🔥 連續登入 <b>{daily.streak}</b> 天
          {next && <span className="muted">・再 {next.days - daily.streak} 天領 🪙{next.gold} 🎫×{next.tickets}</span>}
        </p>
        {/* 這一週的 7 格：今天以前都點亮 */}
        <ol className="streak-week">
          {Array.from({ length: 7 }, (_, i) => {
            const week = (daily.streak - 1) % 7;
            return <li key={i} className={i < week ? 'on' : i === week ? 'today' : ''}>{i === 6 ? '🎁' : i + 1}</li>;
          })}
        </ol>
        <ul className="streak-milestones">
          {STREAK_MILESTONES.map(m => {
            const claimed = (daily.milestones ?? []).includes(m.days);
            const ready = claimable.includes(m);
            return (
              <li key={m.days} className={claimed ? 'is-claimed' : ready ? 'is-ready' : ''}>
                <b>{m.days} 天</b>
                <span>🪙{m.gold} 🎫×{m.tickets}</span>
                {claimed ? <small className="muted">已領取</small> : (
                  <button className="btn btn-small btn-primary" onMouseDown={keepFocus} disabled={!ready}
                    onClick={() => { if (claimStreak(m.days)) sfx.coin(); }}>{ready ? '領取' : '未達成'}</button>
                )}
              </li>
            );
          })}
        </ul>
        <p className="muted streak-note">每天午夜換新任務；中斷後天數重新計算，里程碑可以再領一次。</p>
      </section>
      <p className="summary-label">📅 今日任務 <span className="muted">（每天午夜換新）</span></p>
      {renderTasks(daily.tasks, claimDaily)}
      {weekly && (
        <>
          <p className="summary-label">📆 本週任務 <span className="muted">（每週一換新・{weekly.week} 起）</span></p>
          {renderTasks(weekly.tasks, claimWeekly)}
        </>
      )}
    </Modal>
  );
}
