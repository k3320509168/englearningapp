import { openClassAdvance } from './openClassAdvance';
import { classAdvanceMessage } from '../game/growth';
import { useSaveStore } from '../store/saveStore';
import { PROLOGUE, REGIONS } from '../game/regions';
import { useUiStore } from '../store/uiStore';
import { continueJourney } from '../game/startLevel';
import { continueTarget, nextStep } from '../game/notices';
import { useNotices } from './useNotices';
import { dailyDef } from '../game/daily';
import { MAP_SIZE, mapName, stageLabel } from '../game/regions';
import { keepFocus } from './keepFocus';
import { SKIPPABLE_REGIONS } from '../game/placement';

// 地圖下方（第二十一輪 E4）：大大的「繼續征途」＋一行下一步提示，第二列是一排小按鈕
// （今天的冒險、副本與挑戰、程度測驗、轉盤）。副本收進「副本與挑戰」視窗，不用往下捲。
export default function MapLevelBar() {
  const unlockedIndex = useSaveStore(s => s.unlockedIndex);
  const progress = useSaveStore(s => s.levelProgress);
  const storySeen = useSaveStore(s => s.storySeen);
  const prologueDone = useSaveStore(s => s.prologueDone);
  const notices = useNotices();
  const classHint = useSaveStore(s => classAdvanceMessage(s.character?.classId, s.player, s.classPaths, s.homeClass, s.classBadges));
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
    if (classHint) return openClassAdvance();
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
        {/* 下一步：只佔一行的提示，點了直接去做 */}
        {(classHint || step.action !== 'continue') && (
          <button className="next-step" onMouseDown={keepFocus} onClick={doStep}>
            <span aria-hidden>{classHint ? '⚡' : step.icon}</span><small>下一步</small><span>{classHint ?? step.text}</span>
          </button>
        )}
      </div>
      {/* 第二列：今天的冒險、副本與挑戰、程度測驗、轉盤，一列小按鈕，不用往下捲 */}
      <div className="quick-row">
        {daily && (
          <>
            <button className="today-chip" onMouseDown={keepFocus} onClick={() => openModal('daily')} title="今天的冒險（約 5 分鐘）">
              📅 任務 <b>{tasksDone}/{daily.tasks.length}</b>
            </button>
            <button className="today-chip" onMouseDown={keepFocus} onClick={() => openModal('review')} title="今天該複習的錯題">
              📌 複習 <b>{notices.dueMistakes}</b>
            </button>
            <button className="today-chip" onMouseDown={keepFocus} onClick={() => openModal('loginReward')} title={`連續登入 ${daily.streak} 天・每日簽到與全勤獎勵`}>
              🔥 <b>{daily.streak}</b> 天
            </button>
          </>
        )}
        <button className="today-chip is-adventure" onMouseDown={keepFocus} onClick={() => openModal('adventure')}>
          ⚔️ 副本與挑戰
        </button>
        {/* 前 20 關都可以做程度測驗：英文好的玩家隨時可以跳到後面的區域 */}
        {unlockedIndex === 0 && (progress[REGIONS[0].id] ?? 0) < MAP_SIZE && (
          <button className="today-chip is-placement" onMouseDown={keepFocus} onClick={() => openModal('placement')} title="英文不錯？直接跳到適合你的區域">
            🧭 程度測驗
          </button>
        )}
        {wheelPending > 0 && (
          <button className="today-chip is-wheel" onMouseDown={keepFocus} onClick={() => useUiStore.getState().setWheelHidden(false)}>
            🎡 轉盤 <b>×{wheelPending}</b>
          </button>
        )}
      </div>
    </section>
  );
}
