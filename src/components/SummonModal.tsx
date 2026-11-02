import { useEffect, useMemo, useRef, useState } from 'react';
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
  WEAPON_SUMMON_RATES,
  WEAPON_TICKET_BUY_WEEKLY,
  WEAPON_TICKET_GOLD_PRICE,
  WEAPON_UNLOCK_REGION,
  weaponDef,
  type WeaponSummonDrop,
} from '../game/weapons';

// 召喚：用遊戲內的召喚券抽英雄與神兵（不付費）。
export default function SummonModal() {
  const {
    tickets,
    gold,
    summonCounter,
    buyTicket,
    buyWeaponTicket,
    summonHeroes,
    exchangeSpark,
    weaponTickets,
    weaponCounter,
    summonWeapons,
    exchangeWeaponSpark,
  } = useSaveStore();
  const boughtThisWeek = useSaveStore(s => (s.ticketBuys.week === s.weekly?.week ? s.ticketBuys.count : 0));
  const weaponBoughtThisWeek = useSaveStore(s => (s.weaponTicketBuys?.week === s.weekly?.week ? s.weaponTicketBuys.count : 0));
  const { closeModal, openModal } = useUiStore();
  const [results, setResults] = useState<SummonOutcome[] | null>(null);
  const [picking, setPicking] = useState(false);
  const [weaponResults, setWeaponResults] = useState<WeaponSummonDrop[] | null>(null);
  const [pickingWeapon, setPickingWeapon] = useState(false);
  const [pool, setPool] = useState<'hero' | 'weapon'>('hero');
  const [showRates, setShowRates] = useState(false);
  const [showWays, setShowWays] = useState(false);

  const weaponUnlocked = useSaveStore(s => s.bossDown.includes(WEAPON_UNLOCK_REGION) || s.unlockedIndex > WEAPON_UNLOCK_REGION);
  const ssr = useMemo(() => HEROES.filter(h => h.rarity === 'SSR'), []);
  const heroResultsRef = useRef<HTMLElement | null>(null);
  const weaponResultsRef = useRef<HTMLElement | null>(null);

  // 抽卡結果平滑自動滾動到視野正中，第一時間展示抽卡驚喜
  const scrollToTarget = (el: HTMLElement | null) => {
    if (!el) return;
    const modalEl = el.closest('.modal') as HTMLElement | null;
    if (modalEl) {
      const modalRect = modalEl.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const targetTop = modalEl.scrollTop + (elRect.top - modalRect.top) - 50;
      modalEl.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  // 英雄抽卡結果自動滑動到底部結果區
  useEffect(() => {
    if (!results || results.length === 0) return;
    const t1 = setTimeout(() => scrollToTarget(heroResultsRef.current), 60);
    const t2 = setTimeout(() => scrollToTarget(heroResultsRef.current), 200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [results]);

  // 專武抽卡結果自動滑動
  useEffect(() => {
    if (!weaponResults || weaponResults.length === 0) return;
    const t1 = setTimeout(() => scrollToTarget(weaponResultsRef.current), 60);
    const t2 = setTimeout(() => scrollToTarget(weaponResultsRef.current), 200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [weaponResults]);

  const pull = (count: number) => {
    sfx.summonPull();
    const out = summonHeroes(count);
    if (!out) return;
    setPicking(false);
    setResults(out);
    if (out.some(r => r.rarity === 'SSR')) sfx.starUp(); else sfx.coin();
    celebrateNew(out);
  };

  const pullWeapons = (count: number) => {
    sfx.summonPull();
    const out = summonWeapons(count);
    if (!out) return;
    setPickingWeapon(false);
    setWeaponResults(out);
    if (out.some(r => r.kind === 'weapon')) sfx.starUp(); else sfx.coin();
    out.filter(r => r.kind === 'weapon' && r.isNew).forEach(r => {
      useUiStore.getState().celebrate({ icon: '⚔️', title: '神兵鍛造完成！', sub: r.name, color: '#ffd15c' });
    });
  };

  const celebrateNew = (out: SummonOutcome[]) => {
    out.filter(r => r.isNew && (r.rarity === 'SSR' || r.rarity === 'UR')).forEach(r => {
      const h = heroDef(r.id);
      useUiStore.getState().celebrate({
        icon: '🌟',
        title: `${r.rarity} 英雄登場！`,
        sub: `${heroWord(h)}・${heroTitle(h)}`,
        img: heroDataUrl(r.id, 4),
        color: RARITY_INFO[r.rarity].color,
      });
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
    <>
      <Modal title="🔮 召喚" onClose={closeModal}>
        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={pool === 'hero'} className={`tab ${pool === 'hero' ? 'is-active' : ''}`} onMouseDown={keepFocus} onClick={() => setPool('hero')}>🧙 英雄召喚</button>
          <button role="tab" aria-selected={pool === 'weapon'} className={`tab ${pool === 'weapon' ? 'is-active' : ''}`} onMouseDown={keepFocus} onClick={() => setPool('weapon')}>{weaponUnlocked ? '⚔️' : '🔒'} 專武召喚</button>
        </div>

        {pool === 'weapon' ? (
          !weaponUnlocked ? (
            <>
              <section className="summon-banner is-weapon">
                <div className="summon-banner-header">
                  <p className="summon-title">真名鍛爐・專屬神兵</p>
                  <button className="summon-rate-btn" onMouseDown={keepFocus} onClick={() => setShowRates(true)}>
                    📊 機率詳情
                  </button>
                </div>
                <p className="muted">鍛造英雄與主角的專屬神兵。專武擁有獨立攻擊加成與特色被動。</p>
                
                <div className="summon-crystal-pills">
                  {WEAPON_SUMMON_RATES.map(r => (
                    <span key={r.kind} className="crystal-pill" style={{ '--pill-color': r.color } as CSSProperties}>
                      {r.icon} {r.label} {r.rate}%
                    </span>
                  ))}
                </div>

                <div className="summon-meters">
                  <span style={{ color: '#ffd15c' }}>🔒 解鎖條件：通關 B1「黃金沙漠」區域魔王</span>
                  <span className="spark">
                    🎁 解鎖贈禮：<b>專武召喚券 ×10</b>
                  </span>
                </div>
              </section>

              <div className="summon-actions-card">
                <div className="summon-wallet-row">
                  <span className="ticket-count">⚔️ 持有專武券 <b>0</b></span>
                  <button className="btn btn-small btn-ghost buy-ticket-btn" disabled>
                    用 🪙600 買 1 張（解鎖後開放）
                  </button>
                  <button className="summon-rate-btn" onMouseDown={keepFocus} onClick={() => setShowWays(true)}>
                    ⓘ 取得途徑
                  </button>
                </div>

                <div className="summon-buttons-row">
                  <button className="btn btn-primary btn-summon-single" disabled>
                    🔒 鍛造 ×1（未解鎖）
                  </button>
                  <button className="btn btn-primary btn-summon-ten" disabled>
                    🔒 十連鍛造 ×10（未解鎖）
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <section className="summon-banner is-weapon">
                <div className="summon-banner-header">
                  <p className="summon-title">真名鍛爐・專屬神兵</p>
                  <button className="summon-rate-btn" onMouseDown={keepFocus} onClick={() => setShowRates(true)}>
                    📊 機率詳情
                  </button>
                </div>
                <p className="muted">鍛造英雄與主角的專屬神兵。專武擁有獨立攻擊加成與特色被動。</p>
                
                <div className="summon-crystal-pills">
                  {WEAPON_SUMMON_RATES.map(r => (
                    <span key={r.kind} className="crystal-pill" style={{ '--pill-color': r.color } as CSSProperties}>
                      {r.icon} {r.label} {r.rate}%
                    </span>
                  ))}
                </div>

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
                  <button
                    className="btn btn-small btn-ghost buy-ticket-btn"
                    onMouseDown={keepFocus}
                    onClick={() => { if (buyWeaponTicket()) sfx.coin(); else sfx.cantAfford(); }}
                    disabled={gold < WEAPON_TICKET_GOLD_PRICE || weaponBoughtThisWeek >= WEAPON_TICKET_BUY_WEEKLY}
                    title="每週可在商會用金幣兌換 2 張專武券"
                  >
                    用 🪙<b className="num">{WEAPON_TICKET_GOLD_PRICE}</b> 買 1 張（本週 {weaponBoughtThisWeek}/{WEAPON_TICKET_BUY_WEEKLY}）
                  </button>
                  <button className="summon-rate-btn" onMouseDown={keepFocus} onClick={() => setShowWays(true)}>
                    ⓘ 取得途徑
                  </button>
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
                <section ref={weaponResultsRef} className="summon-results-section">
                  <p className="summon-sub">⚔️ 鍛造結果</p>
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
        ) : (
          <>
            <section className="summon-banner">
              <div className="summon-banner-header">
                <p className="summon-title">古代咒語的召喚陣</p>
                <button className="summon-rate-btn" onMouseDown={keepFocus} onClick={() => setShowRates(true)}>
                  📊 機率詳情
                </button>
              </div>
              <p className="muted">召喚出以英文單字為名的英雄。稀有度越高，名字的單字越進階。</p>

              <div className="summon-crystal-pills">
                {SUMMON_RATES.map(r => (
                  <span key={r.rarity} className="crystal-pill" style={{ '--pill-color': RARITY_INFO[r.rarity].color } as CSSProperties}>
                    {r.rarity} {r.weight}%
                  </span>
                ))}
              </div>

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
                  onClick={() => { if (buyTicket()) sfx.coin(); else sfx.cantAfford(); }}
                  disabled={gold < TICKET_GOLD_PRICE || boughtThisWeek >= TICKET_BUY_WEEKLY}
                  title="每週可在商會用金幣兌換 5 張召喚券"
                >
                  用 🪙<b className="num">{TICKET_GOLD_PRICE}</b> 買 1 張（本週 {boughtThisWeek}/{TICKET_BUY_WEEKLY}）
                </button>
                <button className="summon-rate-btn" onMouseDown={keepFocus} onClick={() => setShowWays(true)}>
                  ⓘ 取得途徑
                </button>
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
              <section ref={heroResultsRef} className="summon-results-section">
                <p className="summon-sub">🎉 召喚成果</p>
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
          </>
        )}
      </Modal>

      {/* 機率與保底詳細說明視窗 */}
      {showRates && (
        <Modal title={pool === 'weapon' ? '⚔️ 專武鍛造機率與規則' : '🔮 英雄召喚機率與規則'} onClose={() => setShowRates(false)}>
          {pool === 'weapon' ? (
            <div>
              <p className="forge-tip">真名鍛爐為全公平鍛造系統，絕無任何隱形暗改，所有掉落機率公開透明：</p>
              <table className="rates-table">
                <thead>
                  <tr>
                    <th>品類</th>
                    <th>單次鍛造機率</th>
                    <th>說明</th>
                  </tr>
                </thead>
                <tbody>
                  {WEAPON_SUMMON_RATES.map(r => (
                    <tr key={r.kind}>
                      <td style={{ color: r.color, fontWeight: 700 }}>{r.icon} {r.label}</td>
                      <td><b>{r.rate}%</b></td>
                      <td className="muted">{r.kind === 'weapon' ? '獲得主角或 SSR 英雄神兵' : r.kind === 'rare_mat' ? '獲得魔核或龍晶' : r.kind === 'shards' ? '全英雄通用願望碎片' : '武器防具強化鐵礦'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="settings-group">
                <h3>🎯 保底與兌換機制</h3>
                <p>• <b>30 抽必中保底</b>：連續 29 次未獲得專屬神兵時，第 30 次鍛造必定獲得專武神兵。</p>
                <p>• <b>60 點自選神兵</b>：每次鍛造累積 1 點願望，累積 60 點即可在鍛造介面任意自選一把心儀神武。</p>
                <p>• <b>重複轉化強化碎片</b>：重複鍛造獲得已有神兵時，自動轉化為 20 枚該神兵的專屬強化碎片。</p>
              </div>

              <div className="settings-group" style={{ marginTop: 12 }}>
                <h3>✨ 收錄神兵一覽（共 {ALL_WEAPONS.length} 把）</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {ALL_WEAPONS.map(w => (
                    <span key={w.id} className="crystal-pill" style={{ '--pill-color': '#ffd15c' } as CSSProperties}>
                      {w.icon} {w.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <p className="forge-tip">英雄召喚池採用標準階梯機率，所有英雄皆有機會在旅途中伴隨您成長：</p>
              <table className="rates-table">
                <thead>
                  <tr>
                    <th>階級</th>
                    <th>單抽基礎機率</th>
                    <th>單字難度</th>
                  </tr>
                </thead>
                <tbody>
                  {SUMMON_RATES.map(r => (
                    <tr key={r.rarity}>
                      <td style={{ color: RARITY_INFO[r.rarity].color, fontWeight: 700 }}>{r.rarity} 英雄</td>
                      <td><b>{r.weight}%</b></td>
                      <td className="muted">{r.rarity === 'SSR' ? 'C1~C2 高階學術/神話單字' : r.rarity === 'SR' ? 'B1~B2 進階英文單字' : r.rarity === 'R' ? 'A2~A2+ 生活單字' : 'A1 基礎日常核心單字'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="settings-group">
                <h3>🎯 保底與任選機制</h3>
                <p>• <b>50 抽必出 SSR</b>：連續 49 抽未抽中 SSR 時，第 50 抽必定獲得 SSR 英雄。</p>
                <p>• <b>100 點任選契約</b>：每抽 1 次累積 1 點契約點數，滿 100 點即可隨時在召喚陣自選任意一位 SSR 英雄加入隊伍。</p>
                <p>• <b>十連保底</b>：十連召喚至少保底 1 位 SR 以上英雄。</p>
              </div>

              <div className="settings-group" style={{ marginTop: 12 }}>
                <h3>👑 當期收錄 SSR 英雄一覽（共 {ssr.length} 位）</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {ssr.map(h => (
                    <span key={h.id} className="crystal-pill" style={{ '--pill-color': RARITY_INFO.SSR.color } as CSSProperties}>
                      🌟 {heroWord(h)}・{heroTitle(h)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* 專武券取得途徑詳細說明視窗 */}
      {showWays && (
        <Modal title={pool === 'weapon' ? '⚔️ 專武券取得途徑指引' : '🎫 召喚券取得途徑指引'} onClose={() => setShowWays(false)}>
          {pool === 'weapon' ? (
            <ul className="ways-modal-list">
              <li className="ways-modal-item">
                <span className="ways-modal-icon">👑</span>
                <div className="ways-modal-content">
                  <b>主線區域魔王擊敗獎賞（必得 40 張）</b>
                  <p>• B1 黃金沙漠魔王通關：贈送 <b>10 張</b>（解鎖專武池）</p>
                  <p>• B1+ 赤岩峽谷、B2 極光雪嶺、B2+ 雷鳴高原、C1 熔岩魔域魔王通關：各贈送 <b>5 張</b></p>
                  <p>• C2 失落王城終極魔王通關：贈送 <b>10 張</b></p>
                </div>
              </li>
              <li className="ways-modal-item">
                <span className="ways-modal-icon">🏪</span>
                <div className="ways-modal-content">
                  <b>冒險商會每週金幣兌換</b>
                  <p>每週可在真名鍛爐或冒險工坊用金幣購買 <b>2 張專武券</b>（每張 🪙{WEAPON_TICKET_GOLD_PRICE}，每週一重置）。</p>
                </div>
              </li>
              <li className="ways-modal-item">
                <span className="ways-modal-icon">🗼</span>
                <div className="ways-modal-content">
                  <b>時空之塔挑戰首通層獎賞</b>
                  <p>時空之塔每逢 10 層（10F、20F、30F...）通關，首次登頂即可獲得專武券獎勵。</p>
                </div>
              </li>
              <li className="ways-modal-item">
                <span className="ways-modal-icon">📜</span>
                <div className="ways-modal-content">
                  <b>SSR 英雄真名考驗</b>
                  <p>完成任意 SSR 英雄的真名考驗，除了可直接領取該英雄專屬神兵，還可獲得專武強化資源。</p>
                </div>
              </li>
            </ul>
          ) : (
            <ul className="ways-modal-list">
              <li className="ways-modal-item">
                <span className="ways-modal-icon">⭐</span>
                <div className="ways-modal-content">
                  <b>地圖三星評價獎勵</b>
                  <p>每張冒險地圖初次達成三星評分時，每顆新獲得的星星皆贈送 <b>🎫 召喚券 ×1</b>！</p>
                </div>
              </li>
              <li className="ways-modal-item">
                <span className="ways-modal-icon">🏪</span>
                <div className="ways-modal-content">
                  <b>商會每週金幣兌換</b>
                  <p>每週可用金幣購買最多 <b>5 張召喚券</b>（每張 🪙{TICKET_GOLD_PRICE}，每週一重置）。</p>
                </div>
              </li>
              <li className="ways-modal-item">
                <span className="ways-modal-icon">📅</span>
                <div className="ways-modal-content">
                  <b>每日與每週任務、冒險簽到</b>
                  <p>每日完成任務、7 天連續簽到與 30 天全勤大獎皆有大量召喚券送出。</p>
                </div>
              </li>
              <li className="ways-modal-item">
                <span className="ways-modal-icon">📖</span>
                <div className="ways-modal-content">
                  <b>劇情章節首次回味</b>
                  <p>重溫通關的主線劇情回顧，重要章節首次觀看即送 <b>🎫 召喚券</b>。</p>
                </div>
              </li>
            </ul>
          )}
        </Modal>
      )}
    </>
  );
}
