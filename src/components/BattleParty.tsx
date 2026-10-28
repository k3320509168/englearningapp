import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useBattleStore } from '../store/battleStore';
import { useSaveStore } from '../store/saveStore';
import { SKILLS, SKILL_ENERGY, bossStep } from '../game/progression';
import { elementDef, elementMultiplier } from '../game/character';
import { isAlive, leaderIndex, skillReady } from '../game/party';
import { RELAY } from '../game/synergy';
import { avatarDataUrl, heroDataUrl } from '../game/art/sprites';
import { FAST_TIME, QUICK_TIME, isLenientStage } from '../game/battle';
import { keepFocus } from './keepFocus';

// 戰鬥計時、隊伍狀態列與技能施放確認

const seconds = (ms: number) => Math.max(0, ms / 1000).toFixed(1);

// 每題 20 秒的 combo 計時。越快答對傷害越高（5 秒內 ×1.5、10 秒內 ×1.2）
export function TimerBars() {
  const { phase, questionLeft, questionLimit, overtime, stageIdx, treasureLeft } = useBattleStore(useShallow(s => ({
    phase: s.phase, questionLeft: s.questionLeft, questionLimit: s.questionLimit,
    overtime: s.overtime, stageIdx: s.stageIdx, treasureLeft: s.treasureLeft,
  })));
  if (phase !== 'answering' && phase !== 'casting') return null;
  const pct = Math.max(0, questionLeft / questionLimit) * 100;
  const elapsed = questionLimit - questionLeft;
  const speed = elapsed <= FAST_TIME ? 'FAST ×1.5' : elapsed <= QUICK_TIME ? 'QUICK ×1.2' : '';
  const lenient = isLenientStage(stageIdx);
  return (
    <div className={`timers ${phase !== 'answering' ? 'is-paused' : ''}`}>
      <div className="timer" title={lenient ? '20 秒內答對 combo +1；超時只會讓 combo 中斷' : '20 秒內要答對，超時算答錯'}>
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
      {!overtime && !lenient && <span className="timer-note is-enemy">超時算答錯</span>}
      {treasureLeft > 0 && <span className="timer-note treasure">💰 寶箱逃走倒數 {seconds(treasureLeft)}</span>}
    </div>
  );
}

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
              className={`member ${isAlive(m) ? '' : 'is-down'} ${i === striker && isAlive(m) ? 'is-striker' : ''} ${ready ? 'is-ready' : ''}`}
              style={{ '--el': el.color } as CSSProperties}
              onMouseDown={keepFocus}
              onClick={() => useBattleStore.getState().requestSkill(i)}
              disabled={!ready}
              title={`${m.name}（${el.name}）｜${skill.icon} ${skill.name}：${skill.desc}｜接力 ${relayDef.icon} ${relayDef.name}：${relayDef.desc}`}
              aria-label={`${m.name}，HP ${m.hp}/${m.maxHp}${ready ? `，可以施放${skill.name}` : ''}`}
            >
              <span className="member-portrait">
                <img src={portraits[m.id]} alt="" />
                {mult > 1 && <span className="member-adv" title="剋制這隻怪物">▲</span>}
                {mult < 1 && <span className="member-dis" title="被這隻怪物剋制">▼</span>}
                {inChain && <span className="member-chain" title="這一輪已經出手">🔗</span>}
              </span>
              <span className="member-info">
                <span className="member-name">{m.name}</span>
                <span className="member-hp"><span style={{ width: `${(m.hp / m.maxHp) * 100}%` }} /></span>
                <span className="member-energy" aria-hidden="true">
                  {Array.from({ length: SKILL_ENERGY }, (_, k) => <i key={k} className={k < m.energy ? 'on' : ''} />)}
                  {ready && <em>{skill.icon}</em>}
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

// 施放確認：計時暫停 5 秒，題目仍然看得到（刻意留給玩家思考）
export function CastConfirm() {
  const { casting, party, phaseLeft } = useBattleStore(useShallow(s => ({ casting: s.casting, party: s.party, phaseLeft: s.phaseLeft })));
  if (casting === null) return null;
  const m = party[casting];
  const skill = SKILLS[m.skill];
  const { confirmSkill, cancelSkill } = useBattleStore.getState();
  return (
    <div className="cast-confirm" role="dialog" aria-label="施放技能">
      <p><b>{skill.icon} {m.name}：{skill.name}</b><br /><span className="muted">{skill.desc}</span></p>
      <span className="cast-timer">⏸ {seconds(phaseLeft)}</span>
      <div className="cast-actions">
        <button className="btn btn-ghost btn-small" onMouseDown={keepFocus} onClick={cancelSkill}>取消 Esc</button>
        <button className="btn btn-primary btn-small" onMouseDown={keepFocus} onClick={confirmSkill}>施放 ⏎</button>
      </div>
    </div>
  );
}

// 魔王題標籤：答對可得到的倍率
export function BossQuestionTag() {
  const { isBossQuestion, bossChain, amplify } = useBattleStore(useShallow(s => ({
    isBossQuestion: s.isBossQuestion, bossChain: s.bossChain, amplify: s.amplifyLeft > 0,
  })));
  if (!isBossQuestion) return null;
  const step = bossStep(bossChain) * (amplify ? 2 : 1);
  return <p className="boss-q-tag">👹 魔王題（你答錯過的題目）——答對傷害 ×{step}，倍率會一路累乘！</p>;
}

// 技能按鈕：有隊員能量滿時，在答案上方出現大按鈕（拇指按得到），
// 按下後進入原本的 5 秒確認。電腦可以按 1～4 對應隊員
export function SkillButtons() {
  const party = useBattleStore(s => s.party);
  const phase = useBattleStore(s => s.phase);
  if (phase !== 'answering') return null;
  const ready = party.map((m, i) => ({ m, i })).filter(({ m }) => skillReady(m));
  if (ready.length === 0) return null;
  return (
    <div className="skill-buttons">
      {ready.map(({ m, i }) => {
        const skill = SKILLS[m.skill];
        return (
          <button key={m.id} className="btn skill-btn" style={{ '--el': elementDef(m.element).color } as CSSProperties}
            onMouseDown={keepFocus} onClick={() => useBattleStore.getState().requestSkill(i)} title={skill.desc}>
            <span aria-hidden>{skill.icon}</span>
            <span><b>{skill.name}</b><small>{m.name}</small></span>
            <kbd className="only-desktop">{i + 1}</kbd>
          </button>
        );
      })}
    </div>
  );
}
