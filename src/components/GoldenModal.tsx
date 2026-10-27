import Modal from './Modal';
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { GOLDEN_CLEAR_TICKETS, GOLDEN_STAGE_COUNT, GOLDEN_STAGES_PER_TIER, GOLDEN_TITLE } from '../game/golden';
import { REGIONS } from '../game/regions';
import { beginGoldenRoad } from '../game/startLevel';
import { keepFocus } from './keepFocus';

// 黃金之路入口：說明規則、最佳紀錄與獎勵
export default function GoldenModal() {
  const closeModal = useUiStore(s => s.closeModal);
  const best = useSaveStore(s => s.goldenBest);
  const cleared = useSaveStore(s => s.titles.includes(GOLDEN_TITLE));

  return (
    <Modal title="👑 黃金之路" onClose={closeModal}>
      <section className="golden-intro">
        <p className="golden-lead">只憑英文能力，從最初的草原一路走到王座之間，擊敗沉默魔王。</p>
        <ul className="golden-rules">
          <li>⚔️ 只用<b>初始角色</b>：Lv 1、沒有轉職、沒有裝備、沒有夥伴英雄、沒有商店升級。</li>
          <li>🧭 共 {GOLDEN_STAGE_COUNT} 關：{REGIONS.map(r => r.name).join(' → ')}，每個區域 {GOLDEN_STAGES_PER_TIER} 關，題目越來越難。</li>
          <li>💀 <b>不能答錯、不能超時</b>（20 秒），一次失誤就結束。</li>
          <li>🔥 Combo 與魔王題倍率從頭到尾不會重置，要靠連續答對打出數億傷害。</li>
          <li>🏆 通關獎勵：稱號「{GOLDEN_TITLE}」、特殊結局、召喚券 🎫 ×{GOLDEN_CLEAR_TICKETS}。</li>
        </ul>
        <p className="golden-best">
          {cleared ? `✨ 已通關！稱號「${GOLDEN_TITLE}」` : best > 0 ? `最佳紀錄：通過 ${best} / ${GOLDEN_STAGE_COUNT} 關` : '還沒有挑戰紀錄'}
        </p>
      </section>
      <div className="tutorial-actions">
        <button className="btn btn-ghost" onMouseDown={keepFocus} onClick={closeModal}>再準備一下</button>
        <button className="btn btn-primary" onMouseDown={keepFocus} onClick={() => { closeModal(); beginGoldenRoad(); }}>踏上黃金之路</button>
      </div>
    </Modal>
  );
}
