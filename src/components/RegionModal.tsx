import { useEffect, useMemo, useState } from 'react';
import Modal from './Modal';
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { MAP_SIZE, REGIONS, mapIndexOf, mapKey } from '../game/regions';
import { countStars, starConditions } from '../game/stars';
import { regionStoryId } from '../game/story';
import { avatarDataUrl, heroDataUrl } from '../game/art/sprites';
import { beginLevel } from '../game/startLevel';
import { sfx } from '../game/sfx';
import { keepFocus } from './keepFocus';
import { GATE_LEVEL, SKIPPABLE_REGIONS, canChallengeGate } from '../game/placement';

// 區域地圖：5 張地圖沿著小路排列，主角站在目前的地圖上。
// 點一張已解鎖的地圖，主角會跑過去，然後進入那張地圖的第 1 關。
export default function RegionModal() {
  const regionIdx = useUiStore(s => s.regionIdx);
  const { closeModal, openStory } = useUiStore.getState();
  const { character, party, levelProgress, bestStage, mapStars, storySeen, unlockedIndex } = useSaveStore();
  const level = useSaveStore(s => s.player.level);
  const region = REGIONS[regionIdx] ?? REGIONS[0];
  const progress = levelProgress[region.id] ?? 0;
  const best = bestStage[region.id] ?? 0;
  const currentMap = mapIndexOf(progress);
  const [heroAt, setHeroAt] = useState(currentMap);
  const [running, setRunning] = useState(false);
  const portrait = useMemo(
    () => (character && party.includes('player') ? avatarDataUrl(character, 'idle', 2) : heroDataUrl(party[0] ?? 'knight', 2)),
    [character, party],
  );
  const conditions = starConditions(regionIdx);
  const totalStars = region.maps.reduce((sum, _, i) => sum + countStars(mapStars[mapKey(region.id, i)]), 0);

  // 第一次進入這個區域：先播開場劇情
  useEffect(() => {
    const id = regionStoryId(regionIdx);
    if (!storySeen.includes(id)) openStory(id);
  }, [regionIdx, storySeen, openStory]);

  // 解鎖到「打到過最遠的那張地圖」；通關過的區域全部解鎖
  const unlocked = (mapIdx: number) => mapIdx <= mapIndexOf(best) || countStars(mapStars[mapKey(region.id, region.maps.length - 1)]) > 0;

  const go = (mapIdx: number, fromStage: number) => {
    if (running) return;
    sfx.click();
    setRunning(true);
    setHeroAt(mapIdx);
    // 等主角跑到地圖節點再開始
    window.setTimeout(() => { closeModal(); beginLevel(region.id, fromStage); }, mapIdx === heroAt ? 250 : 650);
  };

  return (
    <Modal title={`🗺️ ${region.name}`} onClose={closeModal} wide>
      <div className="region-head">
        <span>⭐ <b>{totalStars}</b> / {region.maps.length * 3}</span>
        <button className="btn btn-ghost btn-small" onMouseDown={keepFocus} onClick={() => openStory(regionStoryId(regionIdx))}>📜 重看劇情</button>
        {/* 目前的最前線區域（王城以外）可以挑戰守門試煉直接通關 */}
        {regionIdx === unlockedIndex && regionIdx < SKIPPABLE_REGIONS && (
          <button className={`btn btn-small ${canChallengeGate(regionIdx, level) ? 'btn-primary' : 'btn-ghost'}`} onMouseDown={keepFocus}
            onClick={() => useUiStore.getState().openGate(regionIdx)} title="答對 8/10 題就能直接通關這個區域">
            🏰 守門試煉{canChallengeGate(regionIdx, level) ? '' : `（Lv ${GATE_LEVEL[regionIdx]}）`}
          </button>
        )}
      </div>

      <ol className={`region-route theme-${region.theme}`}>
        {region.maps.map((name, i) => {
          const open = unlocked(i);
          const stars = mapStars[mapKey(region.id, i)];
          const isCurrent = i === currentMap && progress > 0;
          return (
            <li key={name} className={`route-node ${open ? '' : 'is-locked'} ${i === heroAt ? 'has-hero' : ''}`}>
              {i === heroAt && <img className={`route-hero ${running ? 'is-running' : ''}`} src={portrait} alt="" />}
              <button className="route-flag" onMouseDown={keepFocus} disabled={!open || running}
                onClick={() => go(i, isCurrent ? progress : i * MAP_SIZE)}
                aria-label={`${name}${open ? '' : '（尚未解鎖）'}${isCurrent ? `，繼續第 ${(progress % MAP_SIZE) + 1} 關` : ''}`}>
                <span className="route-no">{open ? i + 1 : '🔒'}</span>
              </button>
              <b>{name}</b>
              <span className="route-stars" aria-label={`${countStars(stars)} 顆星`}>
                {[0, 1, 2].map(k => <i key={k} className={stars?.[k] ? 'on' : ''}>★</i>)}
              </span>
              {isCurrent && <small className="route-progress">進行到第 {(progress % MAP_SIZE) + 1} 關</small>}
              {isCurrent && (
                <button className="level-restart" onMouseDown={keepFocus} disabled={running} onClick={() => go(i, i * MAP_SIZE)}>↺ 從頭開始</button>
              )}
            </li>
          );
        })}
      </ol>

      <section className="star-rules">
        <p className="summary-label">⭐ 這個區域的三星條件（每張地圖結算時評分，每顆新星星送 1 張召喚券）</p>
        <ol>{conditions.map(c => <li key={c.label}>{c.label}</li>)}</ol>
      </section>
    </Modal>
  );
}
