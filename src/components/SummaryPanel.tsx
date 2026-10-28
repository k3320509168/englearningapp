import { useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useBattleStore } from '../store/battleStore';
import { segmentRange, summarize } from '../game/lesson';
import { questionHint, completedSentence, questionKey } from '../game/battle';
import { vocabFor } from '../game/vocab';
import type { Question } from '../game/types';
import { useSpeak } from './useSpeak';
import { regionOf } from '../game/regions';
import { starConditions } from '../game/stars';
import { finishGoldenRoad, finishRegion } from '../game/startLevel';
import { useSaveStore } from '../store/saveStore';
import { GOLDEN_CLEAR_TICKETS, GOLDEN_TITLE, MAIN_TITLE } from '../game/golden';
import { LEVELS } from '../game/QuestionData';
import { skillBossDef } from '../game/skillBosses';
import { materialIcon, materialName } from '../game/equipment';
import { TEN_PULL } from '../game/heroes';
import { useUiStore } from '../store/uiStore';
import { keepFocus } from './keepFocus';

// 結算畫面：Boss 後（區段結算）、全區通關、體力耗盡時顯示

function answerLabel(q: Question): { text: string; audio: string; meaning: string } {
  const v = vocabFor(q);
  if (v) return { text: v.display, audio: v.display, meaning: v.meaning };
  // 選擇題：有空格就顯示完整句子，否則（例如「早餐的英文是？」）顯示正確選項
  const sentence = completedSentence(q);
  const option = q.options?.find(o => o.startsWith(`${q.ans}.`))?.replace(/^[A-D]\.\s*/, '') ?? '';
  return { text: sentence || option || q.desc, audio: sentence || option, meaning: q.explain ?? questionHint(q) };
}

export default function SummaryPanel() {
  const { phase, answers, stageIdx, stages, maxCombo, runGold, mapResult, levelKey, levelIdx, runXp, runDrops, mode } = useBattleStore(useShallow(s => ({
    phase: s.phase, answers: s.answers, stageIdx: s.stageIdx, stages: s.stages, maxCombo: s.maxCombo, runGold: s.runGold,
    mapResult: s.mapResult, levelKey: s.levelKey, levelIdx: s.levelIdx, runXp: s.runXp, runDrops: s.runDrops, mode: s.mode,
  })));
  const goldenBest = useSaveStore(s => s.goldenBest);
  const titles = useSaveStore(s => s.titles);
  // 新手引導：第一次打完地圖、還沒召喚過，而且召喚券夠十連
  const tickets = useSaveStore(s => s.tickets);
  // 學習成果：圖鑑裡答對過的題目數，以及答對 5 次以上（熟練）的數量
  const learned = useSaveStore(useShallow(s => {
    const list = Object.values(s.codex);
    return { known: list.filter(c => c.correct > 0).length, mastered: list.filter(c => c.correct >= 5).length };
  }));
  const firstSummon = useSaveStore(s => s.summonCounter.spark === 0 && s.heroes.length <= 1) && tickets >= TEN_PULL;
  const golden = mode === 'golden';
  const { nextStage, exitToMap, retryLevel } = useBattleStore.getState();
  const say = useSpeak();
  const ref = useRef<HTMLDivElement>(null);
  // 結算出現時捲到畫面中，手機或小螢幕上才不會漏看
  useEffect(() => { ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, [phase]);

  // 區段結算只看這 10 關；通關與失敗看整個區域
  const [from] = phase === 'summary' ? segmentRange(stageIdx, stages.length) : [0];
  const summary = summarize(answers, from, stageIdx);

  const region = regionOf(levelKey);
  const map = region.maps[Math.floor(stageIdx / 10)] ?? '';
  const bossName = stages[stageIdx]?.revenge ? '😈 擊敗復仇魔王' : '🏆 擊敗守門 Boss';
  const skillDef = mode === 'skill' ? skillBossDef(useBattleStore.getState().skillBoss ?? '') : undefined;
  const title = skillDef
    ? (phase === 'levelClear' ? `⚔️ 擊敗${skillDef.name}！` : `⚔️ ${skillDef.name}挑戰失敗`)
    : golden
    ? (phase === 'levelClear' ? `👑 黃金之路通關！你就是「${GOLDEN_TITLE}」` : `👑 黃金之路：在第 ${stageIdx + 1} / ${stages.length} 關止步`)
    : phase === 'summary' ? `${bossName}！「${map}」通關`
    : phase === 'levelClear' ? '🎉 區域完全通關！' : '💀 體力耗盡';

  return (
    <div ref={ref} className={`result summary ${phase === 'gameOver' ? 'is-fail' : ''}`}>
      <p className="result-title">{title}</p>
      {skillDef && phase === 'levelClear' && <p>你的{skillDef.skill}能力證明了自己！{titles.includes(skillDef.title) ? `稱號「${skillDef.title}」` : ''}</p>}
      {phase === 'levelClear' && !golden && !skillDef && <p>{levelIdx === LEVELS.length - 1 ? `沉默魔王倒下了！你獲得了稱號「${MAIN_TITLE}」。` : '下一個區域已解鎖'}</p>}
      {golden && phase === 'gameOver' && <p>一次失誤就結束——這就是黃金之路。最佳紀錄：通過 {goldenBest} / {stages.length} 關。看看是哪一題，再挑戰一次吧！</p>}
      {golden && phase === 'levelClear' && <p>沒有夥伴、沒有裝備，只憑英文能力擊敗了沉默魔王。獲得召喚券 🎫 ×{GOLDEN_CLEAR_TICKETS}！</p>}
      {mapResult && phase !== 'gameOver' && (
        <section className="star-result" aria-label="三星評價">
          <div className="star-row">
            {mapResult.stars.map((on, i) => <span key={i} className={`big-star ${on ? 'on' : ''}`} style={{ animationDelay: `${i * 0.25}s` }}>★</span>)}
          </div>
          <ul>
            {starConditions(levelIdx).map((c, i) => (
              <li key={c.label} className={mapResult.stars[i] ? 'met' : ''}>{mapResult.stars[i] ? '✔' : '✘'} {c.label}</li>
            ))}
          </ul>
          {mapResult.gained > 0 && <p className="star-gain">新星星 +{mapResult.gained}，獲得召喚券 🎫 ×{mapResult.gained}！</p>}
        </section>
      )}
      {firstSummon && mapResult && phase === 'summary' && (
        <div className="first-summon">
          <span aria-hidden>🔮</span>
          <p>你已經有 <b>{tickets}</b> 張召喚券了！做第一次十連召喚，找新夥伴加入隊伍吧。</p>
          <button className="btn btn-primary btn-small" onMouseDown={keepFocus} onClick={() => { exitToMap(); useUiStore.getState().openModal('summon'); }}>去召喚</button>
        </div>
      )}
      {phase === 'gameOver' && !golden && <p>別灰心！賺到的金幣都保留了，可以到商店升級。下面是這次要加強的字。</p>}
      {stages[stageIdx]?.revenge && phase === 'summary' && <p>復仇成功！這些錯題的複習間隔已經拉長，下次會在幾天後再考你。</p>}

      <div className="stats">
        <div><b>{summary.accuracy}%</b><span>正確率</span></div>
        <div><b>{summary.correct}/{summary.total}</b><span>答對題數</span></div>
        <div><b>{maxCombo}</b><span>最高 Combo</span></div>
        <div><b>🪙 {runGold}</b><span>本趟金幣</span></div>
        <div><b>+{runXp}</b><span>經驗值</span></div>
      </div>
      {Object.keys(runDrops).length > 0 && (
        <p className="drop-line">獲得素材：{Object.entries(runDrops).map(([k, v]) => `${materialIcon(k)}${materialName(k)}×${v}`).join('、')}</p>
      )}

      {!golden && !skillDef && phase !== 'gameOver' && (
        <section className="learned-card" aria-label="學習成果">
          <div><b>{summary.mastered.length}</b><span>這趟學會</span></div>
          <div><b>{learned.known}</b><span>累積答對過的字詞</span></div>
          <div><b>{learned.mastered}</b><span>已熟練（答對 5 次）</span></div>
        </section>
      )}

      {summary.mastered.length > 0 && (
        <section className="summary-section">
          <p className="summary-label">🎓 這趟學會的單字（一次就答對，點一下聽發音）</p>
          <div className="chips">
            {summary.mastered.map(q => {
              const l = answerLabel(q);
              return <button key={questionKey(q)} className="chip" onMouseDown={keepFocus} onClick={() => say(l.audio)} title={l.meaning}>{l.text}</button>;
            })}
          </div>
        </section>
      )}

      {summary.mistakes.length > 0 && (
        <section className="summary-section">
          <p className="summary-label">📌 需要加強（已加入錯題本）</p>
          <ul className="mistake-list">
            {summary.mistakes.map(q => {
              const l = answerLabel(q);
              return (
                <li key={questionKey(q)}>
                  <button className="btn btn-ghost btn-small" onMouseDown={keepFocus} onClick={() => say(l.audio)} aria-label="播放發音" disabled={!l.audio}>🔊</button>
                  <span className="mistake-text">{l.text}</span>
                  <span className="mistake-meaning">{l.meaning}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="feedback-actions">
        {phase === 'summary' && <button className="btn btn-primary" onMouseDown={keepFocus} onClick={nextStage}>繼續冒險 ⏎</button>}
        {phase === 'levelClear' && <button className="btn btn-primary" onMouseDown={keepFocus} onClick={() => (golden ? finishGoldenRoad() : skillDef ? exitToMap() : finishRegion(levelIdx))}>回到世界地圖 ⏎</button>}
        {phase === 'gameOver' && (
          <>
            <button className="btn btn-primary" onMouseDown={keepFocus} onClick={retryLevel}>重新挑戰 ⏎</button>
            <button className="btn" onMouseDown={keepFocus} onClick={exitToMap}>回地圖</button>
          </>
        )}
      </div>
    </div>
  );
}

