import { useShallow } from 'zustand/react/shallow';
import { useBattleStore } from '../store/battleStore';
import { useSaveStore } from '../store/saveStore';
import { ITEMS } from '../game/progression';
import { keepFocus } from './keepFocus';

// 戰鬥中的狀態列：本趟金幣、可使用的道具
export function BattleStatusBar() {
  const { runGold, phase, playerHp, playerMaxHp, shield, assist } = useBattleStore(useShallow(s => ({
    runGold: s.runGold, phase: s.phase,
    playerHp: s.playerHp, playerMaxHp: s.playerMaxHp, shield: s.shield, assist: s.assist,
  })));
  const items = useSaveStore(s => s.items);
  const consumeItem = useBattleStore(s => s.consumeItem);
  const canUse = phase === 'answering';
  // 藥水：全隊滿血時不能用
  // 已經有效果時不能再用（例如滿血時不能喝藥水）
  const disabledReason: Record<string, boolean> = {
    potion: playerHp >= playerMaxHp,
    shield,
    hint: assist !== null,
  };

  return (
    <div className="status-bar">
      <span className="gold-badge" title="這趟冒險獲得的金幣（已存入，可到商店兌換）">🪙 +{runGold}</span>
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
