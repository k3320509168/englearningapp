import { useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import Modal from './Modal';
import { useBattleStore } from '../store/battleStore';
import { useUiStore } from '../store/uiStore';
import { useSaveStore } from '../store/saveStore';
import { questionKey, voiceFallback } from '../game/battle';
import type { Question } from '../game/types';
import QuizRunner from './QuizRunner';
import { keepFocus } from './keepFocus';

// 全隊倒下：先讓倒地動畫播完，再跳出失敗畫面，直接帶玩家去變強（強化角色、強化裝備、抽角色），
// 或重新挑戰、回地圖。關掉視窗可以看下面的結算與要加強的字。黃金之路一次失誤就結束，不用這個畫面
const RECENT = 30;
const WEAK_ACCURACY = 0.7;

export default function DefeatModal() {
  const { phase, mode, maxCombo, runGold, answers } = useBattleStore(useShallow(s => ({ phase: s.phase, mode: s.mode, maxCombo: s.maxCombo, runGold: s.runGold, answers: s.answers })));
  const tickets = useSaveStore(s => s.tickets);
  const [open, setOpen] = useState(false);
  const [warmup, setWarmup] = useState<Question[] | null>(null);
  const [warmupAnswersCount, setWarmupAnswersCount] = useState(0);

  // 提取本場戰鬥中答錯的題目（去重）
  const wrongQuestions = useMemo(() => {
    const seen = new Set<string>();
    const list: Question[] = [];
    for (const a of answers) {
      if (!a.correct && a.question) {
        const k = questionKey(a.question);
        if (!seen.has(k)) {
          seen.add(k);
          list.push(a.question);
        }
      }
    }
    return list;
  }, [answers]);

  useEffect(() => {
    if (phase !== 'gameOver' || mode === 'golden') return;
    const t = window.setTimeout(() => setOpen(true), 1400);
    return () => {
      window.clearTimeout(t);
      setOpen(false);
      setWarmup(null);
      setWarmupAnswersCount(0);
    };
  }, [phase, mode]);

  if (!open) return null;

  // 戰敗熱身：複習本場答錯的題目，完成後帶著首擊加成與護盾重返戰場
  const startWarmup = () => {
    if (wrongQuestions.length === 0) {
      setOpen(false);
      useBattleStore.getState().retryWithWarmupBonus();
      useUiStore.getState().celebrate({
        icon: '🛡️',
        title: '女神庇佑！戰力激發',
        sub: '獲得「首擊傷害 ×2 ＋ 神聖守護護盾」！重返戰場！',
        color: '#88f4ff',
      });
      return;
    }
    const list = wrongQuestions.slice(0, 3).map(q => voiceFallback(q));
    setWarmup(list);
    setWarmupAnswersCount(0);
  };

  const handleWarmupAnswer = () => {
    const nextCount = warmupAnswersCount + 1;
    setWarmupAnswersCount(nextCount);
    if (warmup && nextCount >= warmup.length) {
      setOpen(false);
      setWarmup(null);
      setWarmupAnswersCount(0);
      useBattleStore.getState().retryWithWarmupBonus();
      useUiStore.getState().celebrate({
        icon: '🔥',
        title: '熱身完成！戰力激發',
        sub: '獲得「首擊傷害 ×2 ＋ 神聖守護護盾」！立即重返戰場！',
        color: '#ffd15c',
      });
    }
  };

  // 熱身模式視窗
  if (warmup) {
    return (
      <Modal title="🥋 戰敗熱身修煉" onClose={() => setWarmup(null)}>
        <div className="defeat-warmup">
          <div className="defeat-warmup-banner">
            <span className="defeat-warmup-icon" aria-hidden>🔥</span>
            <div>
              <b className="defeat-warmup-title">複習剛才的錯題，突破戰局！</b>
              <p className="defeat-warmup-desc">
                完成 {warmup.length} 題熱身複習，重返戰場時將直接獲得<b>「💥 首擊傷害 ×2 ＋ 🛡️ 神聖守護護盾」</b>！
              </p>
            </div>
          </div>
          <QuizRunner
            key={warmup.length}
            questions={warmup}
            label={i => `熱身題 ${i + 1} / ${warmup.length}`}
            onAnswer={handleWarmupAnswer}
            lastLabel="💥 領取加成・重返戰場！"
          />
          <div className="defeat-actions" style={{ marginTop: '12px' }}>
            <button className="btn btn-ghost" onMouseDown={keepFocus} onClick={() => setWarmup(null)}>返回戰敗選單</button>
          </div>
        </div>
      </Modal>
    );
  }

  // 失敗原因：最近 30 題正確率低於 70% → 英文是瓶頸，先去錯題修煉場；否則是角色不夠強，先強化
  const recent = answers.slice(-RECENT);
  const accuracy = recent.length ? recent.filter(a => a.correct).length / recent.length : 1;
  const needEnglish = accuracy < WEAK_ACCURACY;
  const { exitToMap, retryLevel } = useBattleStore.getState();
  const ui = useUiStore.getState();
  const goTo = (openAction: () => void) => { exitToMap(); openAction(); };

  return (
    <Modal title="💀 全隊倒下" onClose={() => setOpen(false)}>
      <div className="defeat">
        <p>這次最高 Combo <b>{maxCombo}</b>，帶回 🪙 <b>{runGold}</b>。變強一點再回來吧！</p>
        <p className="defeat-advice">
          最近 {recent.length} 題正確率 <b>{Math.round(accuracy * 100)}%</b>：
          {needEnglish ? '英文是這次的關鍵，先到錯題修煉場把答錯的字練熟，回來會輕鬆很多。' : '英文答得不錯，是隊伍撐不住——強化角色或裝備再回來挑戰。'}
          同一關失敗越多次，女神給的援助越多（祝福、復活、減傷）。
        </p>

        <div className="defeat-warmup-tip">
          <span className="defeat-tip-icon" aria-hidden>💡</span>
          <span className="defeat-tip-text">
            {wrongQuestions.length > 0
              ? `剛才戰鬥中有 ${wrongQuestions.length} 道錯題。點擊「🥋 戰敗熱身」快速複習前 ${Math.min(wrongQuestions.length, 3)} 題，重開局享有「首擊傷害 ×2 ＋ 神聖護盾」！`
              : '剛才戰鬥表現頑強！點擊「🛡️ 女神庇佑重戰」帶著「首擊傷害 ×2 ＋ 神聖護盾」重新出發！'}
          </span>
        </div>

        <div className="defeat-grid">
          {needEnglish && (
            <button className="btn defeat-btn is-recommended" onMouseDown={keepFocus} onClick={() => goTo(() => ui.openModal('review'))}>
              <span aria-hidden>📕</span><b>錯題修煉場</b><small>把答錯的字練熟（推薦）</small>
            </button>
          )}
          <button className={`btn defeat-btn ${needEnglish ? '' : 'is-recommended'}`} onMouseDown={keepFocus} onClick={() => goTo(() => ui.openGrowth('hero'))}>
            <span aria-hidden>💪</span><b>強化角色</b><small>升級、轉職、訓練英雄</small>
          </button>
          <button className="btn defeat-btn" onMouseDown={keepFocus} onClick={() => goTo(() => ui.openGrowth('gear'))}>
            <span aria-hidden>🗡️</span><b>強化裝備</b><small>打造、強化武器與飾品</small>
          </button>
          <button className="btn defeat-btn" onMouseDown={keepFocus} onClick={() => goTo(() => ui.openModal('summon'))}>
            <span aria-hidden>🔮</span><b>抽角色</b><small>召喚新英雄（🎫 {tickets}）</small>
          </button>
          <button className="btn defeat-btn" onMouseDown={keepFocus} onClick={exitToMap}>
            <span aria-hidden>🗺️</span><b>返回地圖</b><small>回到世界地圖</small>
          </button>
        </div>
        <div className="defeat-actions">
          <button className="btn btn-ghost" onMouseDown={keepFocus} onClick={() => setOpen(false)}>看這次的結算</button>
          <button className="btn btn-secondary" onMouseDown={keepFocus} onClick={retryLevel}>一般重試</button>
          <button className="btn btn-primary defeat-warmup-btn" onMouseDown={keepFocus} onClick={startWarmup}>
            {wrongQuestions.length > 0 ? `🥋 戰敗熱身 (${Math.min(wrongQuestions.length, 3)}題)` : '🛡️ 女神庇佑重戰'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
