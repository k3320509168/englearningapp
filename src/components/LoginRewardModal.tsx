import { useEffect } from 'react';
import Modal from './Modal';
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { STREAK_MILESTONES, claimableMilestones, nextMilestone } from '../game/daily';
import { sfx } from '../game/sfx';
import { keepFocus } from './keepFocus';

// 7 日循環登入獎勵預覽
const WEEK_GIFTS = [
  { day: 1, label: '🪙 50' },
  { day: 2, label: '🪙 80' },
  { day: 3, label: '🎫 召喚券×1' },
  { day: 4, label: '🪙 120' },
  { day: 5, label: '🎟️ 掃蕩券×1' },
  { day: 6, label: '🪙 200' },
  { day: 7, label: '🎁 召喚券×2' },
];

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
        <section className="streak-section" aria-label="本週簽到">
          <div className="streak-section-header">
            <span className="streak-section-title">📅 本週登入進度</span>
            <span className="streak-section-hint">每天登入即算簽到，第 7 天可獲神秘召喚禮盒</span>
          </div>
          <div className="streak-week-grid">
            {WEEK_GIFTS.map((g, i) => {
              const isChecked = i < currentWeekDay;
              const isToday = i === currentWeekDay;
              return (
                <div key={g.day} className={`streak-day-chip ${isChecked ? 'is-checked' : ''} ${isToday ? 'is-today' : ''}`}>
                  <span className="streak-day-label">第 {g.day} 天</span>
                  <span className="streak-day-icon">{i === 6 ? '🎁' : isChecked ? '✔' : '⭐'}</span>
                  <span className="streak-day-reward">{g.label}</span>
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
          💡 貼心提示：每天午夜（00:00）自動結算新的一天；堅持每日冒險累積全勤，讓英文成為最強大的冒險力量！
        </p>
      </div>
    </Modal>
  );
}
