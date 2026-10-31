import { useSaveStore } from '../store/saveStore';
import { PROLOGUE, REGIONS } from '../game/regions';
import { useUiStore } from '../store/uiStore';
import { continueJourney } from '../game/startLevel';
import { continueTarget, nextStep } from '../game/notices';
import { useNotices } from './useNotices';
import { dailyDef } from '../game/daily';
import { MAP_SIZE, mapName, stageLabel } from '../game/regions';
import { GOLDEN_STAGE_COUNT } from '../game/golden';
import { keepFocus } from './keepFocus';
import { SKIPPABLE_REGIONS } from '../game/placement';

// 地圖下方的區域按鈕：比點畫布上的旗幟更明顯，手機上也好點。
// 有進度的區域顯示「繼續 第 N 關」，另附一個從第 1 關重新開始的小按鈕。
export default function MapLevelBar() {
  const unlockedIndex = useSaveStore(s => s.unlockedIndex);
  const progress = useSaveStore(s => s.levelProgress);
  const goldenBest = useSaveStore(s => s.goldenBest);
  const storySeen = useSaveStore(s => s.storySeen);
  const prologueDone = useSaveStore(s => s.prologueDone);
  const notices = useNotices();
  const daily = useSaveStore(s => s.daily);
  const tasksDone = daily?.tasks.filter(t => t.claimed || t.progress >= (dailyDef(t.id)?.goal ?? Infinity)).length ?? 0;
  const target = continueTarget({ unlockedIndex, prologueDone, levelProgress: progress, storySeen });
  // 最前線的魔王已經打倒、下一區還沒開：主按鈕帶玩家去找守門人（封印進度、區域試煉、回去複習）
  const atGate = useSaveStore(s => s.bossDown.includes(unlockedIndex)) && unlockedIndex < SKIPPABLE_REGIONS;
  const wheelPending = useSaveStore(s => s.wheelPending);
  const step = nextStep(notices);
  const { openModal, openGrowth } = useUiStore.getState();
  // 下一步建議的按鈕：鍛造直接打開鍛造坊分頁
  const doStep = () => {
    if (step.action === 'continue') return continueJourney();
    if (step.action === 'growth') return openGrowth(notices.classAdvance ? 'hero' : notices.forge ? 'forge' : 'gear');
    openModal(step.action);
  };

  return (
    <section className="level-bar" aria-label="選擇區域開始冒險">
      <div className="journey">
        {atGate ? (
          <button className="btn btn-primary journey-btn" onMouseDown={keepFocus} onClick={() => useUiStore.getState().openRegion(unlockedIndex)}>
            <b>🗿 守門人的考驗</b>
            <small>重建封印、挑戰區域試煉，前往「{REGIONS[unlockedIndex + 1]?.name}」</small>
          </button>
        ) : (
          <button className="btn btn-primary journey-btn" onMouseDown={keepFocus} onClick={continueJourney}>
            <b>▶ {target.kind === 'golden' ? '挑戰黃金之路' : target.stage > 0 ? '繼續征途' : '踏上征途'}</b>
            <small>{target.kind === 'golden' ? '主線已通關，向沉默魔王證明你的英文'
              : target.kind === 'prologue' ? `${PROLOGUE.name}・${PROLOGUE.maps[0]}・第 P-${target.stage + 1} 關`
              : `${REGIONS[target.regionIdx].name}・${mapName(REGIONS[target.regionIdx].id, target.stage)}・第 ${stageLabel(target.stage, target.regionIdx)} 關`}</small>
          </button>
        )}
        {step.action !== 'continue' ? (
          <button className="next-step" onMouseDown={keepFocus} onClick={doStep}>
            <span className="next-step-icon" aria-hidden>{step.icon}</span>
            <span><small>下一步</small>{step.text}</span>
          </button>
        ) : null}
      </div>
      {/* 前 10 關都可以做程度測驗：英文好的玩家隨時可以跳到後面的區域 */}
      {unlockedIndex === 0 && (progress[REGIONS[0].id] ?? 0) < MAP_SIZE && (
        <button className="placement-entry" onMouseDown={keepFocus} onClick={() => openModal('placement')}>
          🧭 英文不錯？<b>做程度測驗</b>，直接跳到適合你的區域
        </button>
      )}
      {wheelPending > 0 && (
        <button className="placement-entry wheel-entry" onMouseDown={keepFocus} onClick={() => useUiStore.getState().setWheelHidden(false)}>
          🎡 還有 <b>{wheelPending}</b> 次獎勵轉盤沒轉，點我轉！
        </button>
      )}
      {daily && (
        <div className="today-card" aria-label="今天的冒險">
          <span className="today-title">📅 今天的冒險 <small className="muted">約 5 分鐘</small></span>
          <button className="today-chip" onMouseDown={keepFocus} onClick={() => openModal('daily')}>
            ✅ 任務 <b>{tasksDone}/{daily.tasks.length}</b>
          </button>
          <button className="today-chip" onMouseDown={keepFocus} onClick={() => openModal('review')}>
            📌 今日複習 <b>{notices.dueMistakes}</b>
          </button>
          <button className="today-chip" onMouseDown={keepFocus} onClick={() => openModal('daily')}>
            🔥 連續 <b>{daily.streak}</b> 天
          </button>
        </div>
      )}
      {/* 副本：區域請直接點上面地圖的旗幟。這裡放邊複習邊賺資源的副本與挑戰 */}
      <p className="muted level-bar-hint">⚔️ 副本與挑戰</p>
      <div className="side-modes">
        <button className="side-mode" onMouseDown={keepFocus} onClick={() => openModal('rush')}>
          <b>⚡ 每日素材本</b><small>60 秒快速複習，賺金幣與素材</small>
        </button>
        <button className="side-mode" onMouseDown={keepFocus} onClick={() => openModal('review')}>
          <b>📕 錯題修煉場</b><small>練熟答錯的字，拿掃蕩券</small>
        </button>
        <button className="side-mode" onMouseDown={keepFocus} onClick={() => openModal('tower')}>
          <b>🗼 英雄時空之塔</b><small>一層層往上，拿英雄碎片</small>
        </button>
        <button className="side-mode is-boss" onMouseDown={keepFocus} onClick={() => openModal('skillBoss')}>
          <b>⚔️ 魔王挑戰</b><small>聽・說・讀・寫</small>
        </button>
        <button className="side-mode is-golden" onMouseDown={keepFocus} onClick={() => openModal('golden')}>
          <b>👑 黃金之路</b><small>{goldenBest > 0 ? `最佳：${goldenBest} / ${GOLDEN_STAGE_COUNT} 關` : '只憑英文挑戰沉默魔王'}</small>
        </button>
      </div>
    </section>
  );
}
