import { useSaveStore } from '../store/saveStore';
import { REGIONS } from '../game/regions';
import { useUiStore } from '../store/uiStore';
import { beginLevel } from '../game/startLevel';
import { mapName } from '../game/regions';
import { GOLDEN_STAGE_COUNT } from '../game/golden';
import { keepFocus } from './keepFocus';

// 地圖下方的區域按鈕：比點畫布上的旗幟更明顯，手機上也好點。
// 有進度的區域顯示「繼續 第 N 關」，另附一個從第 1 關重新開始的小按鈕。
export default function MapLevelBar() {
  const unlockedIndex = useSaveStore(s => s.unlockedIndex);
  const progress = useSaveStore(s => s.levelProgress);
  const goldenBest = useSaveStore(s => s.goldenBest);

  return (
    <section className="level-bar" aria-label="選擇區域開始冒險">
      <p className="muted level-bar-hint">選擇區域開始冒險（也可以直接點地圖上的旗幟）</p>
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
      <button className="btn golden-btn" onMouseDown={keepFocus} onClick={() => useUiStore.getState().openModal('golden')}>
        👑 黃金之路<small>{goldenBest > 0 ? `最佳：通過 ${goldenBest} / ${GOLDEN_STAGE_COUNT} 關` : '只憑英文能力挑戰沉默魔王'}</small>
      </button>
    </section>
  );
}
