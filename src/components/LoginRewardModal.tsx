import { useEffect } from 'react';
import Modal from './Modal';
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { STREAK_MILESTONES, claimableMilestones, nextMilestone } from '../game/daily';
import { sfx } from '../game/sfx';
import { keepFocus } from './keepFocus';

export default function LoginRewardModal() {
  const closeModal = useUiStore(s => s.closeModal);
  const daily = useSaveStore(s => s.daily);
  const { ensureDaily, claimStreak } = useSaveStore.getState();

  useEffect(() => { ensureDaily(); }, [ensureDaily]);
  if (!daily) return null;

  const claimable = claimableMilestones(daily);
  const next = nextMilestone(daily.streak);
  const currentWeekDay = ((daily.streak - 1) % 7);

  return (
    <Modal title="🔥 每日簽到與全勤獎勵" onClose={closeModal}>
      <div className="login-reward-container">
        {/* 連續登入狀態橫幅 */}
        <div className="streak-hero-card">
          <div className="streak-hero-icon" aria-hidden>🔥</div>
          <div className="streak-hero-info">
            <h3 className="streak-hero-title">連續冒險 <b>{daily.streak}</b> 天</h3>
            <p className="streak-hero-sub">
              {next
                ? `距離下一階段【${next.days} 天大獎】還差 ${next.days - daily.streak} 天！`
                : '太強了！您已達成連續冒險最高榮譽！'}
            </p>
          </div>
          {next && (
            <div className="streak-next-badge">
              <span>下一里程碑</span>
              <b>🪙{next.gold} 🎫×{next.tickets}</b>
            </div>
          )}
        </div>

        {/* 7 日冒險簽到日曆 */}
        <section className="streak-section" aria-label="連續登入週期">
          <div className="streak-section-header">
            <span className="streak-section-title">📅 連續登入週期</span>
            <span className="streak-section-hint">每天登入即算簽到，達到下方里程碑即可領獎</span>
          </div>
          <div className="streak-week-grid">
            {Array.from({ length: 7 }, (_, i) => {
              const isChecked = i < currentWeekDay;
              const isToday = i === currentWeekDay;
              return (
                <div key={i} className={`streak-day-chip ${isChecked ? 'is-checked' : ''} ${isToday ? 'is-today' : ''}`}>
                  <span className="streak-day-label">第 {i + 1} 天</span>
                  <span className="streak-day-icon">{isChecked || isToday ? '✔' : '☆'}</span>
                  {isToday && <span className="streak-today-tag">今日</span>}
                </div>
              );
            })}
          </div>
        </section>

        {/* 累計登入與全勤大獎 */}
        <section className="streak-section" aria-label="累計天數獎勵">
          <div className="streak-section-header">
            <span className="streak-section-title">🏆 累計冒險與全勤里程碑</span>
            <span className="streak-section-hint">達到天數即可點擊領取，中斷後重新累積可再領一次</span>
          </div>
          <div className="streak-milestones-grid">
            {STREAK_MILESTONES.map(m => {
              const claimed = (daily.milestones ?? []).includes(m.days);
              const ready = claimable.includes(m);
              const is30 = m.days === 30;
              return (
                <div key={m.days} className={`streak-milestone-card ${claimed ? 'is-claimed' : ready ? 'is-ready' : ''} ${is30 ? 'is-full-month' : ''}`}>
                  <div className="milestone-badge-box">
                    <span className="milestone-days">{m.days} 天{is30 ? ' 全勤' : ''}</span>
                    <span className="milestone-icon">{is30 ? '👑' : ready ? '🎁' : '🔒'}</span>
                  </div>
                  <div className="milestone-reward-info">
                    <b>🪙 {m.gold} 金幣</b>
                    <b>🎫 召喚券 ×{m.tickets}</b>
                  </div>
                  <div className="milestone-action">
                    {claimed ? (
                      <span className="milestone-claimed-tag">已領取 ✔</span>
                    ) : (
                      <button
                        className="btn btn-small btn-primary milestone-btn"
                        onMouseDown={keepFocus}
                        disabled={!ready}
                        onClick={() => {
                          if (claimStreak(m.days)) {
                            sfx.victory();
                            useUiStore.getState().celebrate({
                              icon: '🎉',
                              title: `領取 ${m.days} 天連續登入大獎！`,
                              sub: `獲得金幣 🪙${m.gold}、召喚券 🎫×${m.tickets}！`,
                              color: '#ffd15c',
                            });
                          }
                        }}
                      >
                        {ready ? '領取大獎 🎁' : `還差 ${Math.max(0, m.days - daily.streak)} 天`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <p className="streak-footer-note">
          簽到按裝置的本地日期更新。回到遊戲時會刷新進度。
        </p>
      </div>
    </Modal>
  );
}
