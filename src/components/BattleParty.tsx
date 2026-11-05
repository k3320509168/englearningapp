import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useBattleStore } from '../store/battleStore';
import { useSaveStore } from '../store/saveStore';
import { SKILLS, skillDesc, BOSS_BONUS_FLOOR } from '../game/progression';
import Modal from './Modal';
import { elementDef, elementMultiplier } from '../game/character';
import { isAlive, leaderIndex, skillReady } from '../game/party';
import { RELAY } from '../game/synergy';
import { avatarDataUrl, heroDataUrl } from '../game/art/sprites';
import { FAST_TIME, QUICK_TIME, isLenientStage } from '../game/battle';
import { untimedStage } from '../game/stageLayout';
import { keepFocus } from './keepFocus';

// 戰鬥計時、隊伍狀態列與技能施放確認

const seconds = (ms: number) => Math.max(0, ms / 1000).toFixed(1);

// 每題 20 秒的 combo 計時。越快答對傷害越高（5 秒內 ×1.5、10 秒內 ×1.2）
export function TimerBars() {
  const { phase, questionLeft, questionLimit, overtime, stageIdx, treasureLeft, untimed, golden } = useBattleStore(useShallow(s => ({
    golden: s.mode === 'golden', phase: s.phase, questionLeft: s.questionLeft, questionLimit: s.questionLimit,
    overtime: s.overtime, stageIdx: s.stageIdx, treasureLeft: s.treasureLeft,
    untimed: s.mode === 'normal' && untimedStage(s.levelIdx, s.stageIdx, s.levelKey),
  })));
  if (phase !== 'answering' && phase !== 'casting') return null;
  // 新手關不計時：只顯示快答加成，不顯示會讓人緊張的倒數
  if (untimed) {
    const elapsed = questionLimit - questionLeft;
    const speed = elapsed <= FAST_TIME ? 'FAST ×1.5' : elapsed <= QUICK_TIME ? 'QUICK ×1.2' : '';
    return (
      <div className="timers">
        <span className="timer-note">⏳ 新手關不計時，慢慢想沒關係</span>
        {speed && <span className="timer-note">⚡ 快答 {speed}</span>}
      </div>
    );
  }
  const pct = Math.max(0, questionLeft / questionLimit) * 100;
  const elapsed = questionLimit - questionLeft;
  const speed = elapsed <= FAST_TIME ? 'FAST ×1.5' : elapsed <= QUICK_TIME ? 'QUICK ×1.2' : '';
  const lenient = isLenientStage(stageIdx);
  return (
    <div className={`timers ${phase !== 'answering' ? 'is-paused' : ''}`}>
      <div className="timer" title={golden ? '黃金之路：答錯或超時立即止步' : lenient ? '20 秒內答對 combo +1；超時只會讓 combo 中斷' : '20 秒內要答對，超時算答錯'}>
        <span className="timer-label">Combo</span>
        <span className="timer-track">
          <span className={`timer-fill question ${pct < 25 ? 'is-low' : ''}`} style={{ width: `${pct}%` }} />
          <i className="timer-mark" style={{ left: `${(1 - FAST_TIME / questionLimit) * 100}%` }} />
          <i className="timer-mark" style={{ left: `${(1 - QUICK_TIME / questionLimit) * 100}%` }} />
        </span>
        <b>{seconds(questionLeft)}</b>
      </div>
      {overtime
        ? <span className="timer-note is-enemy">⏰ 超過 20 秒：這題答對不加 combo，慢慢想沒關係</span>
        : speed && <span className="timer-note">⚡ {speed}</span>}
      {golden && <span className="timer-note is-enemy">答錯或超時立即止步</span>}
      {!golden && !overtime && !lenient && <span className="timer-note is-enemy">超時算答錯</span>}
      {treasureLeft > 0 && <span className="timer-note treasure">💰 寶箱逃走倒數 {seconds(treasureLeft)}</span>}
    </div>
  );
}

// 隊伍列：頭像、血量、技能能量。左上角是出手順序（和角色腳下的光圈同色），能量集滿時右上角出現技能圖示，點一下施放
export function PartyBar() {
  const { party, attackerIdx, isBossQuestion, phase, monsterElement, relay, chain } = useBattleStore(useShallow(s => ({
    party: s.party, attackerIdx: s.attackerIdx, isBossQuestion: s.isBossQuestion, phase: s.phase, monsterElement: s.monsterElement,
    relay: s.relay, chain: s.chain,
  })));
  const aliveCount = party.filter(isAlive).length;
  const character = useSaveStore(s => s.character);
  const portraits = useMemo(() => Object.fromEntries(party.map(m => [
    m.id, m.id === 'player' && character ? avatarDataUrl(character, 'idle', 2, useSaveStore.getState().player.classPath.length) : heroDataUrl(m.id, 2),
  ])), [party, character]);
  const striker = isBossQuestion ? leaderIndex(party) : attackerIdx;

  return (
    <>
    {aliveCount >= 2 && (
      <p className="chain-line" title="所有站著的隊員輪流答對一次（中間沒答錯）就會觸發連攜攻擊">
        🔗 連攜 <b>{chain.length}/{aliveCount}</b>
        {relay && relay.by !== party[striker]?.id && <span>・下一擊 {RELAY[relay.classId].icon} {RELAY[relay.classId].name}</span>}
      </p>
    )}
    <ul className="party-bar" aria-label="隊伍">
      {party.map((m, i) => {
        const ready = skillReady(m) && phase === 'answering';
        const el = elementDef(m.element);
        const mult = elementMultiplier(m.element, monsterElement);
        const skill = SKILLS[m.skill];
        const relayDef = RELAY[m.classId];
        const inChain = chain.includes(m.id);
        return (
          <li key={m.id}>
            <button
              className={`member order-${i + 1} ${isAlive(m) ? '' : 'is-down'} ${i === striker && isAlive(m) ? 'is-striker' : ''} ${ready ? 'is-ready' : ''}`}
              style={{ '--el': el.color } as CSSProperties}
              onMouseDown={keepFocus}
              onClick={() => useBattleStore.getState().requestSkill(i)}
              disabled={!ready}
              title={`${m.name}（${el.name}）｜${skill.icon} ${skill.name}：${skillDesc(m.skill, m.skillPower)}｜接力 ${relayDef.icon} ${relayDef.name}：${relayDef.desc}`}
              aria-label={`第 ${i + 1} 位 ${m.name}，HP ${m.hp}/${m.maxHp}${ready ? `，可以施放${skill.name}` : ''}`}
            >
              <span className={`member-order order-${i + 1}`} aria-hidden>{i + 1}</span>
              {ready && <span className="skill-orb member-orb" aria-hidden>{skill.icon}</span>}
              <span className="member-portrait">
                <img src={portraits[m.id]} alt="" />
                {mult > 1 && <span className="member-adv" title="剋制這隻怪物">▲</span>}
                {mult < 1 && <span className="member-dis" title="被這隻怪物剋制">▼</span>}
                {inChain && <span className="member-chain" title="這一輪已經出手">🔗</span>}
              </span>
              <span className="member-info">
                <span className="member-name">{m.name}</span>
                <span className={`member-hp ${m.hp > 0 && m.hp < m.maxHp * 0.3 ? 'is-low' : ''}`}><span style={{ width: `${(m.hp / m.maxHp) * 100}%` }} /></span>
                <span className="member-energy" aria-hidden="true">
                  {Array.from({ length: m.energyMax }, (_, k) => <i key={k} className={k < m.energy ? 'on' : ''} />)}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
    </>
  );
}

// 技能視窗：點能量集滿的隊員時跳出，計時和敵人行動條暫停，按施放或取消才繼續。
// 取消不會用掉能量；施放後能量歸零，重新累積（CD）
export function CastConfirm() {
  const { casting, party } = useBattleStore(useShallow(s => ({ casting: s.casting, party: s.party })));
  const character = useSaveStore(s => s.character);
  if (casting === null) return null;
  const m = party[casting];
  const skill = SKILLS[m.skill];
  const el = elementDef(m.element);
  const portrait = m.id === 'player' && character
    ? avatarDataUrl(character, 'idle', 3, useSaveStore.getState().player.classPath.length) : heroDataUrl(m.id, 3);
  const { confirmSkill, cancelSkill } = useBattleStore.getState();
  return (
    <Modal title="施放技能" onClose={cancelSkill}>
      <div className="cast-card" style={{ '--el': el.color } as CSSProperties}>
        <span className="cast-portrait">
          <img src={portrait} alt="" />
          <span className="skill-orb" aria-hidden>{skill.icon}</span>
        </span>
        <div>
          <h3>{skill.icon} {skill.name}{skill.signature && <span className="rarity-tag inline">專屬</span>}</h3>
          <p className="muted">{m.name}・{el.name}屬性</p>
          <p className="cast-effect">{skillDesc(m.skill, m.skillPower)}</p>
          <p className="muted cast-note">施放後能量歸零，再答對 {m.energyMax} 題才能再放。⏸ 計時暫停中</p>
        </div>
      </div>
      <div className="cast-actions">
        <button className="btn btn-ghost" onMouseDown={keepFocus} onClick={cancelSkill}>取消 <kbd className="only-desktop">Esc</kbd></button>
        <button className="btn btn-primary" onMouseDown={keepFocus} onClick={confirmSkill}>施放 <kbd className="only-desktop">Enter</kbd></button>
      </div>
    </Modal>
  );
}

// 困難題標籤：答對時 combo 乘上隨機倍數
export function BossQuestionTag() {
  const { isBossQuestion, boost } = useBattleStore(useShallow(s => ({ isBossQuestion: s.isBossQuestion, boost: s.bossBoost })));
  if (!isBossQuestion) return null;
  return (
    <p className="boss-q-tag">
      🔥 困難題 Bonus（複習你答錯過的題目）——答對 combo ×{boost ? `${BOSS_BONUS_FLOOR}～10（保底）` : '1～10'}！
    </p>
  );
}
