import { useSaveStore } from '../store/saveStore';
import { REGIONS } from '../game/regions';
import { useUiStore } from '../store/uiStore';
import { beginLevel, continueJourney } from '../game/startLevel';
import { continueTarget, nextStep } from '../game/notices';
import { useNotices } from './useNotices';
import { dailyDef } from '../game/daily';
import { MAP_SIZE, mapName, stageLabel } from '../game/regions';
import { GOLDEN_STAGE_COUNT } from '../game/golden';
import { keepFocus } from './keepFocus';

// 地圖下方的區域按鈕：比點畫布上的旗幟更明顯，手機上也好點。
// 有進度的區域顯示「繼續 第 N 關」，另附一個從第 1 關重新開始的小按鈕。
export default function MapLevelBar() {
  const unlockedIndex = useSaveStore(s => s.unlockedIndex);
  const progress = useSaveStore(s => s.levelProgress);
  const goldenBest = useSaveStore(s => s.goldenBest);
  const storySeen = useSaveStore(s => s.storySeen);
  const notices = useNotices();
  const daily = useSaveStore(s => s.daily);
  const tasksDone = daily?.tasks.filter(t => t.claimed || t.progress >= (dailyDef(t.id)?.goal ?? Infinity)).length ?? 0;
  const target = continueTarget({ unlockedIndex, levelProgress: progress, storySeen });
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
        <button className="btn btn-primary journey-btn" onMouseDown={keepFocus} onClick={continueJourney}>
          <b>▶ {target.kind === 'golden' ? '挑戰黃金之路' : target.stage > 0 ? '繼續征途' : '踏上征途'}</b>
          <small>{target.kind === 'golden' ? '主線已通關，向沉默魔王證明你的英文' : `${REGIONS[target.regionIdx].name}・${mapName(REGIONS[target.regionIdx].id, target.stage)}・第 ${stageLabel(target.stage)} 關`}</small>
        </button>
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
      <p className="muted level-bar-hint">或選擇區域（也可以直接點地圖上的旗幟）</p>
      <div className="level-buttons">
        {REGIONS.map(({ id: levelKey, name }, i) => {
          const locked = i > unlockedIndex;
          const stage = progress[levelKey] ?? 0;
          return (
            <div key={levelKey} className="level-cell">
              <button
                className={`btn level-btn ${i === unlockedIndex ? 'btn-primary' : ''}`}
                onMouseDown={keepFocus} onClick={() => useUiStore.getState().openRegion(i)} disabled={locked}
                aria-label={locked ? `${name}（尚未解鎖）` : stage > 0 ? `繼續 ${name} 第 ${stage + 1} 關` : `開始 ${name}`}>
                <b>{locked ? '🔒' : '▶'} {name}</b>
                {!locked && stage > 0 && <small className="level-progress">{mapName(levelKey, stage)}</small>}
              </button>
              {!locked && stage > 0 && (
                <button className="level-restart" onMouseDown={keepFocus} onClick={() => beginLevel(levelKey, 0)}>
                  ↺ 從第 1 關開始
                </button>
              )}
            </div>
          );
        })}
      </div>
      <div className="challenge-row">
      <button className="btn skill-boss-btn" onMouseDown={keepFocus} onClick={() => useUiStore.getState().openModal('skillBoss')}>
        ⚔️ 魔王挑戰<small>聽・說・讀・寫</small>
      </button>
      <button className="btn golden-btn" onMouseDown={keepFocus} onClick={() => useUiStore.getState().openModal('golden')}>
        👑 黃金之路<small>{goldenBest > 0 ? `最佳：通過 ${goldenBest} / ${GOLDEN_STAGE_COUNT} 關` : '只憑英文能力挑戰沉默魔王'}</small>
      </button>
      </div>
    </section>
  );
}
