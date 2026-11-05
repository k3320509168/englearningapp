import { useShallow } from 'zustand/react/shallow';
import { foeKindOf, useBattleStore } from '../store/battleStore';
import { monsterName } from '../game/enemyNames';
import { monsterAttack, monsterLevel } from '../game/progression';
import { ELITE_POWER } from '../game/enemyPatterns';

// 手機不用從縮小的像素畫布辨認敵名、HP及ATK；數值與場景同源。
export default function EnemyStatus() {
  const enemy = useBattleStore(useShallow(s => {
    const stage = s.stages[s.stageIdx];
    if (!stage || !s.active || !['answering', 'casting', 'feedback', 'monsterDown'].includes(s.phase)) return null;
    const kind = foeKindOf(stage, s.stageIdx, s.stages.length);
    const ordinary = s.mode === 'normal' && !stage.revenge;
    const level = ordinary ? monsterLevel(s.levelIdx, s.stageIdx, kind) : null;
    const atk = ordinary && stage.kind !== 'treasure'
      ? Math.round(monsterAttack(stage.bossMode, s.levelIdx, s.stageIdx, kind) * (stage.kind === 'elite' ? ELITE_POWER : 1)) : null;
    return {
      name: s.mode === 'skill' ? stage.name : monsterName(s.monsterKind, s.monsterElement),
      hp: Math.max(0, s.monsterHp), maxHp: s.monsterMaxHp, level, atk,
    };
  }));
  if (!enemy) return null;
  return (
    <section className="enemy-status" aria-label="敵方資訊" aria-live="off">
      <b>{enemy.name}{enemy.level !== null && `・Lv ${enemy.level}`}</b>
      <span>HP {enemy.hp.toLocaleString()} / {enemy.maxHp.toLocaleString()}</span>
      {enemy.atk !== null && <span>基礎ATK {enemy.atk.toLocaleString()}</span>}
    </section>
  );
}
