import { useSaveStore } from '../store/saveStore';
import { LEVELS } from '../game/QuestionData';
import { beginLevel } from '../game/startLevel';
import { keepFocus } from './keepFocus';

// 地圖下方的區域按鈕：比點畫布上的圓點更明顯，手機上也好點
export default function MapLevelBar() {
  const unlockedIndex = useSaveStore(s => s.unlockedIndex);

  return (
    <section className="level-bar" aria-label="選擇區域開始冒險">
      <p className="muted level-bar-hint">選擇區域開始冒險（也可以直接點地圖上的圓點）</p>
      <div className="level-buttons">
        {LEVELS.map((levelKey, i) => {
          const locked = i > unlockedIndex;
          const [code, ...rest] = levelKey.split(' ');
          return (
            <button key={levelKey}
              className={`btn level-btn ${i === unlockedIndex ? 'btn-primary' : ''}`}
              onMouseDown={keepFocus} onClick={() => beginLevel(levelKey)} disabled={locked}
              aria-label={locked ? `${levelKey}（尚未解鎖）` : `開始 ${levelKey}`}>
              <b>{locked ? '🔒' : '▶'} {code}</b>
              <small>{rest.join(' ')}</small>
            </button>
          );
        })}
      </div>
    </section>
  );
}
