import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import Modal from './Modal';
import { useBattleStore } from '../store/battleStore';
import { useUiStore } from '../store/uiStore';
import { useSaveStore } from '../store/saveStore';
import { keepFocus } from './keepFocus';

// 全隊倒下：先讓倒地動畫播完，再跳出失敗畫面，直接帶玩家去變強（強化角色、強化裝備、抽角色），
// 或重新挑戰、回地圖。關掉視窗可以看下面的結算與要加強的字。黃金之路一次失誤就結束，不用這個畫面
const RECENT = 30;
const WEAK_ACCURACY = 0.7;

export default function DefeatModal() {
  const { phase, mode, maxCombo, runGold, answers } = useBattleStore(useShallow(s => ({ phase: s.phase, mode: s.mode, maxCombo: s.maxCombo, runGold: s.runGold, answers: s.answers })));
  const tickets = useSaveStore(s => s.tickets);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (phase !== 'gameOver' || mode === 'golden') return;
    const t = window.setTimeout(() => setOpen(true), 1400);
    return () => { window.clearTimeout(t); setOpen(false); };
  }, [phase, mode]);

  if (!open) return null;
  // 失敗原因：最近 30 題正確率低於 70% → 英文是瓶頸，先去錯題修煉場；否則是角色不夠強，先強化
  const recent = answers.slice(-RECENT);
  const accuracy = recent.length ? recent.filter(a => a.correct).length / recent.length : 1;
  const needEnglish = accuracy < WEAK_ACCURACY;
  const { exitToMap, retryLevel } = useBattleStore.getState();
  const ui = useUiStore.getState();
  const goTo = (open: () => void) => { exitToMap(); open(); };
  return (
    <Modal title="💀 全隊倒下" onClose={() => setOpen(false)}>
      <div className="defeat">
        <p>這次最高 Combo <b>{maxCombo}</b>，帶回 🪙 <b>{runGold}</b>。變強一點再回來吧！</p>
        <p className="defeat-advice">
          最近 {recent.length} 題正確率 <b>{Math.round(accuracy * 100)}%</b>：
          {needEnglish ? '英文是這次的關鍵，先到錯題修煉場把答錯的字練熟，回來會輕鬆很多。' : '英文答得不錯，是隊伍撐不住——強化角色或裝備再回來挑戰。'}
          同一關失敗越多次，女神給的援助越多（祝福、復活、減傷）。
        </p>
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
          <button className="btn btn-primary" onMouseDown={keepFocus} onClick={retryLevel}>重新挑戰</button>
        </div>
      </div>
    </Modal>
  );
}
