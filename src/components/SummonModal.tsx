import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import Modal from './Modal';
import { TICKET_BUY_WEEKLY, useSaveStore } from '../store/saveStore';
import type { SummonOutcome } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import {
  HEROES, PITY_SSR, RARITY_INFO, SPARK_COST, SUMMON_RATES, TEN_PULL, TICKET_GOLD_PRICE, heroDef, heroTitle, heroWord,
} from '../game/heroes';
import { heroDataUrl } from '../game/art/sprites';
import { sfx } from '../game/sfx';
import { keepFocus } from './keepFocus';
import {
  ALL_WEAPONS,
  WEAPON_PITY_SSR,
  WEAPON_SPARK_COST,
  WEAPON_UNLOCK_REGION,
  weaponDef,
  type WeaponSummonDrop,
} from '../game/weapons';

// 召喚：用遊戲內的召喚券抽英雄（不付費）。
// 保底：第 50 抽內必出 SSR；累積：每抽 1 點，100 點可任選一位 SSR；十連至少一位 SR 以上。
export default function SummonModal() {
  const {
    tickets,
    gold,
    summonCounter,
    buyTicket,
    summonHeroes,
    exchangeSpark,
    weaponTickets,
    weaponCounter,
    summonWeapons,
    exchangeWeaponSpark,
  } = useSaveStore();
  const boughtThisWeek = useSaveStore(s => (s.ticketBuys.week === s.weekly?.week ? s.ticketBuys.count : 0));
  const { closeModal, openModal } = useUiStore();
  const [results, setResults] = useState<SummonOutcome[] | null>(null);
  const [picking, setPicking] = useState(false);
  const [weaponResults, setWeaponResults] = useState<WeaponSummonDrop[] | null>(null);
  const [pickingWeapon, setPickingWeapon] = useState(false);
  // 召喚池分頁（第二十一輪 D2）：英雄池／專武池。專武池在打倒 B1 黃金沙漠的區域魔王或跳級通過後解鎖
  const [pool, setPool] = useState<'hero' | 'weapon'>('hero');
  const weaponUnlocked = useSaveStore(s => s.bossDown.includes(WEAPON_UNLOCK_REGION) || s.unlockedIndex > WEAPON_UNLOCK_REGION);
  const ssr = useMemo(() => HEROES.filter(h => h.rarity === 'SSR'), []);

  const pull = (count: number) => {
    const out = summonHeroes(count);
    if (!out) return;
    setPicking(false);
    setResults(out);
    if (out.some(r => r.rarity === 'SSR')) sfx.victory(); else sfx.coin();
    celebrateNew(out);
  };

  const pullWeapons = (count: number) => {
    const out = summonWeapons(count);
    if (!out) return;
    setPickingWeapon(false);
    setWeaponResults(out);
    if (out.some(r => r.kind === 'weapon')) sfx.victory(); else sfx.coin();
    out.filter(r => r.kind === 'weapon' && r.isNew).forEach(r => {
      useUiStore.getState().celebrate({ icon: '⚔️', title: '神兵鍛造完成！', sub: r.name, color: '#ffd15c' });
    });
  };

  // 新的 SSR 以上英雄：全螢幕登場
  const celebrateNew = (out: SummonOutcome[]) => {
    out.filter(r => r.isNew && (r.rarity === 'SSR' || r.rarity === 'UR')).forEach(r => {
      const h = heroDef(r.id);
      useUiStore.getState().celebrate({ icon: '🌟', title: `${r.rarity} 英雄登場！`, sub: `${heroWord(h)}・${heroTitle(h)}`, img: heroDataUrl(r.id, 4), color: RARITY_INFO[r.rarity].color });
    });
  };

  const pick = (id: string) => {
    const out = exchangeSpark(id);
    if (!out) return;
    sfx.victory();
    setPicking(false);
    setResults([out]);
    celebrateNew([out]);
  };

  const pickWeapon = (id: string) => {
    const ok = exchangeWeaponSpark(id);
    if (!ok) return;
    sfx.victory();
    setPickingWeapon(false);
    const wp = weaponDef(id);
    if (wp) {
      setWeaponResults([{ kind: 'weapon', weaponId: wp.id, name: wp.name, icon: wp.icon, amount: 1, isNew: true }]);
      useUiStore.getState().celebrate({ icon: '⚔️', title: '神兵鍛造完成！', sub: wp.name, color: '#ffd15c' });
    }
  };

  const sparkReady = summonCounter.spark >= SPARK_COST;
  const pityLeft = PITY_SSR - summonCounter.sinceSsr;
  const weaponPityLeft = WEAPON_PITY_SSR - weaponCounter.sinceSsr;
  const weaponSparkReady = weaponCounter.spark >= WEAPON_SPARK_COST;

  return (
    <Modal title="🔮 召喚" onClose={closeModal} wide>
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={pool === 'hero'} className={`tab ${pool === 'hero' ? 'is-active' : ''}`} onMouseDown={keepFocus} onClick={() => setPool('hero')}>🧙 英雄召喚</button>
        <button role="tab" aria-selected={pool === 'weapon'} className={`tab ${pool === 'weapon' ? 'is-active' : ''}`} onMouseDown={keepFocus} onClick={() => setPool('weapon')}>{weaponUnlocked ? '⚔️' : '🔒'} 專武召喚</button>
      </div>
      {pool === 'weapon' ? (
        !weaponUnlocked ? (
          <section className="summon-banner is-weapon">
            <p className="summon-title">真名鍛爐</p>
            <p>🔒 打倒 B1「黃金沙漠」的區域魔王「流沙法老」後解鎖，解鎖時贈送專武召喚券 ×10。</p>
            <p className="muted">專武召喚券和英雄召喚券分開，保底也分開計算。</p>
          </section>
        ) : (
          <>
            <section className="summon-banner is-weapon">
              <p className="summon-title">真名鍛爐</p>
              <p className="muted">鍛造英雄與主角的專屬神兵。專武擁有強大攻擊加成與特色被動。</p>
              <p className="summon-rates">
                <span style={{ color: '#ffd15c' }}>專武 5%</span>
                <span style={{ color: '#a855f7' }}>稀有素材 15%</span>
                <span style={{ color: '#38bdf8' }}>願望碎片 30%</span>
                <span style={{ color: '#94a3b8' }}>強化礦石 50%</span>
              </p>
              <div className="summon-meters">
                <span>🎯 保底：再 <b>{weaponPityLeft}</b> 次鍛造內必出專武</span>
                <span className="spark">
                  ✨ 累積 <b>{weaponCounter.spark}/{WEAPON_SPARK_COST}</b>
                  <span className="spark-track"><span style={{ width: `${Math.min(100, (weaponCounter.spark / WEAPON_SPARK_COST) * 100)}%` }} /></span>
                  <button className="btn btn-small" onMouseDown={keepFocus} onClick={() => setPickingWeapon(p => !p)} disabled={!weaponSparkReady}>任選專武</button>
                </span>
              </div>
            </section>

            <div className="summon-actions-card">
              <div className="summon-wallet-row">
                <span className="ticket-count">⚔️ 持有專武券 <b>{weaponTickets}</b></span>
                <span className="summon-ways-chip" title="通關 B1 贈送 10 張、擊敗區域魔王、高難度試煉或活動取得">
                  ⓘ 取得途徑
                </span>
              </div>

              <div className="summon-buttons-row">
                <button className="btn btn-primary btn-summon-single" onMouseDown={keepFocus} onClick={() => pullWeapons(1)} disabled={weaponTickets < 1}>
                  鍛造 ×1
                </button>
                <button className="btn btn-primary btn-summon-ten" onMouseDown={keepFocus} onClick={() => pullWeapons(TEN_PULL)} disabled={weaponTickets < TEN_PULL}>
                  十連鍛造 ×10
                </button>
              </div>
            </div>

            {pickingWeapon && (
              <section>
                <p className="summon-sub">選一把專武（消耗 {WEAPON_SPARK_COST} 點）</p>
                <ul className="summon-results">
                  {ALL_WEAPONS.map(w => (
                    <li key={w.id}>
                      <button className="summon-card" style={{ '--rarity': '#ffd15c' } as CSSProperties} onMouseDown={keepFocus} onClick={() => pickWeapon(w.id)}>
                        <div style={{ fontSize: 36, margin: '8px 0' }}>{w.icon}</div>
                        <b>{w.name}</b>
                        <small>{w.heroId ? '英雄專武' : '主角專武'}</small>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {weaponResults && !pickingWeapon && (
              <section>
                <p className="summon-sub">鍛造結果</p>
                <ul className="summon-results">
                  {weaponResults.map((r, i) => (
                    <li key={i}>
                      <div className="summon-card is-revealed" style={{ '--rarity': r.kind === 'weapon' ? '#ffd15c' : '#38bdf8', animationDelay: `${i * 0.12}s` } as CSSProperties}>
                        <span className="rarity-tag">{r.kind === 'weapon' ? '專武' : '素材'}</span>
                        <div style={{ fontSize: 32, margin: '6px 0' }}>{r.icon}</div>
                        <b>{r.name}</b>
                        <small>{r.kind === 'weapon' ? (r.isNew ? 'NEW!' : '重複轉為碎片') : `x${r.amount}`}</small>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="tutorial-actions">
                  <span />
                  <button className="btn" onMouseDown={keepFocus} onClick={() => openModal('heroes')}>查看英雄與專武</button>
                </div>
              </section>
            )}
          </>
        )
      ) : (<>
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

      <div className="summon-actions-card">
        <div className="summon-wallet-row">
          <span className="ticket-count">🎫 持有召喚券 <b>{tickets}</b></span>
          <button
            className="btn btn-small btn-ghost buy-ticket-btn"
            onMouseDown={keepFocus}
            onClick={buyTicket}
            disabled={gold < TICKET_GOLD_PRICE || boughtThisWeek >= TICKET_BUY_WEEKLY}
            title="每週可在商會用金幣兌換 5 張召喚券"
          >
            用 🪙<b className="num">{TICKET_GOLD_PRICE}</b> 買 1 張（本週 {boughtThisWeek}/{TICKET_BUY_WEEKLY}）
          </button>
          <span className="summon-ways-chip" title="打倒守門頭目 +1、復仇魔王 +2、區域通關 +5，或每週金幣購買">
            ⓘ 取得途徑
          </span>
        </div>

        <div className="summon-buttons-row">
          <button className="btn btn-primary btn-summon-single" onMouseDown={keepFocus} onClick={() => pull(1)} disabled={tickets < 1}>
            召喚 ×1
          </button>
          <button className="btn btn-primary btn-summon-ten" onMouseDown={keepFocus} onClick={() => pull(TEN_PULL)} disabled={tickets < TEN_PULL}>
            十連召喚 ×10
          </button>
        </div>
      </div>

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
      </>)}
    </Modal>
  );
}
