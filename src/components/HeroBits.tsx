import { useState } from 'react';
import { useSaveStore } from '../store/saveStore';
import { MAX_STARS, STAR_BONUS, STAR_COSTS, STAR_GOLD, heroDef, heroWord } from '../game/heroes';
import type { HeroId } from '../game/heroes';
import { TRIAL_COUNT, isTrueName, trialsDone } from '../game/trueName';

// 英雄畫面共用的小元件（第十二輪，和 ChatGPT 討論）：隊伍格子、英雄卡、詳細資料都用同一個

// 星星：SSR 英雄才有（升星最多四星）。滑鼠移上去或點一下，跳出碎片與升下一星的需求
export function StarBadge({ id, compact = false }: { id: HeroId; compact?: boolean }) {
  const stars = useSaveStore(s => s.heroStars[id] ?? 0);
  const shards = useSaveStore(s => s.heroShards[id] ?? 0);
  const wish = useSaveStore(s => s.wishShards);
  const gold = useSaveStore(s => s.gold);
  const [open, setOpen] = useState(false);
  if (heroDef(id).rarity !== 'SSR') return null;
  const maxed = stars >= MAX_STARS;
  const need = STAR_COSTS[stars] ?? 0;
  return (
    <span className={`star-badge ${compact ? 'is-compact' : ''} ${open ? 'is-open' : ''}`} tabIndex={0} role="button"
      aria-label={`${stars} 星（共 ${MAX_STARS} 星）`}
      onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
      onPointerDown={e => e.stopPropagation()}
      onBlur={() => setOpen(false)}>
      {/* 亮的和暗的用同一個字形（★），只差顏色，大小才一致 */}
      <span className="star-row" aria-hidden>{'★'.repeat(stars)}<span className="star-off">{'★'.repeat(MAX_STARS - stars)}</span></span>
      <span className="star-pop" role="tooltip">
        <b>★ {stars} / {MAX_STARS}</b>
        {maxed ? <>已滿星，可以挑戰升 UR 品階</> : (
          <>
            <span>升下一星：碎片 <b className={shards + wish >= need ? 'req-ok' : 'req-no'}>◆{shards}/{need}</b>{wish > 0 && `（願望碎片 ${wish} 可補）`}</span>
            <span>金幣 <b className={gold >= STAR_GOLD(stars) ? 'req-ok' : 'req-no'}>🪙{STAR_GOLD(stars)}</b></span>
            <span className="muted">每顆星：生命與攻擊 +{Math.round(STAR_BONUS * 100)}%</span>
          </>
        )}
      </span>
    </span>
  );
}

// 真名：名字一開始是暗的（看得清楚），每完成一項考驗就點亮幾個字母、變成金色外框；五項全部完成整個名字發光
export function NameGlow({ id, progress }: { id: HeroId; progress: boolean[] | undefined }) {
  const word = heroWord(heroDef(id));
  const lit = Math.ceil((word.length * trialsDone(progress)) / TRIAL_COUNT);
  const named = isTrueName(progress);
  return (
    <span className={`name-glow ${named ? 'is-named' : ''}`} aria-label={`${word}（真名 ${trialsDone(progress)}/${TRIAL_COUNT}）`}>
      {[...word].map((ch, i) => <span key={i} className={i < lit ? 'is-lit' : ''} aria-hidden>{ch}</span>)}
    </span>
  );
}
