import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import Modal from './Modal';
import { useSaveStore } from '../store/saveStore';
import type { SummonOutcome } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import {
  HEROES, PITY_SSR, RARITY_INFO, SPARK_COST, SUMMON_RATES, TEN_PULL, TICKET_GOLD_PRICE, heroDef, heroTitle, heroWord,
} from '../game/heroes';
import { heroDataUrl } from '../game/art/sprites';
import { sfx } from '../game/sfx';
import { keepFocus } from './keepFocus';

// 召喚：用遊戲內的召喚券抽英雄（不付費）。
// 保底：第 50 抽內必出 SSR；累積：每抽 1 點，100 點可任選一位 SSR；十連至少一位 SR 以上。
export default function SummonModal() {
  const { tickets, gold, summonCounter, buyTicket, summonHeroes, exchangeSpark } = useSaveStore();
  const { closeModal, openModal } = useUiStore();
  const [results, setResults] = useState<SummonOutcome[] | null>(null);
  const [picking, setPicking] = useState(false);
  const ssr = useMemo(() => HEROES.filter(h => h.rarity === 'SSR'), []);

  const pull = (count: number) => {
    const out = summonHeroes(count);
    if (!out) return;
    setPicking(false);
    setResults(out);
    if (out.some(r => r.rarity === 'SSR')) sfx.victory(); else sfx.coin();
  };

  const pick = (id: string) => {
    const out = exchangeSpark(id);
    if (!out) return;
    sfx.victory();
    setPicking(false);
    setResults([out]);
  };

  const sparkReady = summonCounter.spark >= SPARK_COST;
  const pityLeft = PITY_SSR - summonCounter.sinceSsr;

  return (
    <Modal title="🔮 英雄召喚" onClose={closeModal} wide>
      <section className="summon-banner">
        <p className="summon-title">古代咒語的召喚陣</p>
        <p className="muted">召喚出以英文單字為名的英雄。稀有度越高，名字的單字越進階。</p>
        <p className="summon-rates">
          {SUMMON_RATES.map(r => <span key={r.rarity} style={{ color: RARITY_INFO[r.rarity].color }}>{r.rarity} {r.weight}%</span>)}
        </p>
        <div className="summon-meters">
          <span>🎯 保底：再 <b>{pityLeft}</b> 抽內必出 SSR</span>
          <span className="spark">
            ✨ 累積 <b>{summonCounter.spark}/{SPARK_COST}</b>
            <span className="spark-track"><span style={{ width: `${Math.min(100, (summonCounter.spark / SPARK_COST) * 100)}%` }} /></span>
            <button className="btn btn-small" onMouseDown={keepFocus} onClick={() => setPicking(p => !p)} disabled={!sparkReady}>任選 SSR</button>
          </span>
        </div>
      </section>

      <div className="summon-actions">
        <span className="ticket-count">🎫 召喚券 <b>{tickets}</b></span>
        <button className="btn btn-small btn-ghost" onMouseDown={keepFocus} onClick={buyTicket} disabled={gold < TICKET_GOLD_PRICE}>用 🪙<b className="num">{TICKET_GOLD_PRICE}</b> 買 1 張</button>
        <button className="btn btn-primary" onMouseDown={keepFocus} onClick={() => pull(1)} disabled={tickets < 1}>召喚 ×1</button>
        <button className="btn btn-primary" onMouseDown={keepFocus} onClick={() => pull(TEN_PULL)} disabled={tickets < TEN_PULL}>十連召喚 ×10</button>
      </div>
      <p className="muted party-note">召喚券來源：打倒守門頭目 +1、復仇魔王 +2、區域通關 +5，也可以用金幣購買。</p>

      {picking && (
        <section>
          <p className="summon-sub">選一位 SSR 英雄（消耗 {SPARK_COST} 點）</p>
          <ul className="summon-results">
            {ssr.map(h => (
              <li key={h.id}>
                <button className="summon-card" style={{ '--rarity': RARITY_INFO.SSR.color } as CSSProperties} onMouseDown={keepFocus} onClick={() => pick(h.id)}>
                  <img src={heroDataUrl(h.id, 2)} alt="" />
                  <b>{heroWord(h)}</b>
                  <small>{heroTitle(h)}</small>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {results && !picking && (
        <section>
          <p className="summon-sub">召喚結果</p>
          <ul className="summon-results">
            {results.map((r, i) => {
              const h = heroDef(r.id);
              return (
                <li key={i}>
                  <div className={`summon-card is-revealed rarity-${r.rarity}`} style={{ '--rarity': RARITY_INFO[r.rarity].color, animationDelay: `${i * 0.12}s` } as CSSProperties}>
                    <span className="rarity-tag">{r.rarity}</span>
                    <img src={heroDataUrl(r.id, 2)} alt="" />
                    <b>{heroWord(h)}</b>
                    <small>{h.meaning}</small>
                    <span className={r.isNew ? 'new-tag' : 'shard-tag'}>{r.isNew ? 'NEW!' : `◆+${r.shards}`}</span>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="tutorial-actions">
            <span />
            <button className="btn" onMouseDown={keepFocus} onClick={() => openModal('heroes')}>查看英雄與隊伍</button>
          </div>
        </section>
      )}
    </Modal>
  );
}
