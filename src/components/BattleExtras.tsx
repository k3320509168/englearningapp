import { useShallow } from 'zustand/react/shallow';
import { useBattleStore } from '../store/battleStore';
import { useSaveStore } from '../store/saveStore';
import { BUFFS, ITEMS, buffDef } from '../game/progression';
import type { BuffId } from '../game/progression';
import { keepFocus } from './keepFocus';

// 戰鬥中的狀態列：本趟金幣、已取得的 Buff、可使用的道具
export function BattleStatusBar() {
  const { runGold, buffs, phase, playerHp, playerMaxHp, shield, assist } = useBattleStore(useShallow(s => ({
    runGold: s.runGold, buffs: s.buffs, phase: s.phase,
    playerHp: s.playerHp, playerMaxHp: s.playerMaxHp, shield: s.shield, assist: s.assist,
  })));
  const items = useSaveStore(s => s.items);
  const consumeItem = useBattleStore(s => s.consumeItem);
  const counts = BUFFS.map(b => ({ def: b, n: buffs.filter(id => id === b.id).length })).filter(x => x.n > 0);
  const canUse = phase === 'answering';
  // 已經有效果時不能再用（例如滿血時不能喝藥水）
  const disabledReason: Record<string, boolean> = {
    potion: playerHp >= playerMaxHp,
    shield,
    hint: assist !== null,
  };

  return (
    <div className="status-bar">
      <span className="gold-badge" title="這趟冒險獲得的金幣（已存入）">🪙 +{runGold}</span>
      <span className="buff-list" aria-label="已取得的 Buff">
        {counts.map(({ def, n }) => (
          <span key={def.id} className="buff-chip" title={`${def.name}：${def.desc}`}>{def.icon}{n > 1 && <small>×{n}</small>}</span>
        ))}
      </span>
      <span className="item-bar">
        {ITEMS.map(it => (
          <button key={it.id} className="item-btn" onMouseDown={keepFocus} onClick={() => consumeItem(it.id)}
            disabled={!canUse || items[it.id] <= 0 || disabledReason[it.id]}
            title={`${it.name}：${it.desc}`} aria-label={`使用${it.name}，剩 ${items[it.id]} 個`}>
            {it.icon}<small>{items[it.id]}</small>
          </button>
        ))}
      </span>
    </div>
  );
}

// 三選一 Buff：每打倒 3 隻怪物出現一次，只在這一趟冒險有效
export function BuffPanel() {
  const choices = useBattleStore(s => s.buffChoices);
  const pickBuff = useBattleStore(s => s.pickBuff);
  return (
    <div className="buff-panel">
      <p className="result-title">✨ 選擇一個祝福</p>
      <p className="muted">只在這一趟冒險有效，可以重複疊加</p>
      <div className="buff-options">
        {choices.map((id: BuffId, i) => {
          const b = buffDef(id);
          return (
            <button key={id} className="buff-card" onMouseDown={keepFocus} onClick={() => pickBuff(id)}>
              <span className="buff-icon" aria-hidden="true">{b.icon}</span>
              <b>{b.name}</b>
              <span className="muted">{b.desc}</span>
              <kbd className="kbd-hint">{i + 1}</kbd>
            </button>
          );
        })}
      </div>
    </div>
  );
}
