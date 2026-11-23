import { useEffect, useRef, useState } from 'react';
import Modal from './Modal';
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { GOLDEN_CLEAR_TICKETS, GOLDEN_STAGE_COUNT, GOLDEN_STAGES_PER_TIER, GOLDEN_TITLE } from '../game/golden';
import { REGIONS } from '../game/regions';
import { beginGoldenRoad } from '../game/startLevel';
import { loadBanksFrom } from '../game/questions/bank/loader';
import { keepFocus } from './keepFocus';

// 黃金之路入口：說明規則、最佳紀錄與獎勵
export default function GoldenModal() {
  const closeModal = useUiStore(s => s.closeModal);
  const best = useSaveStore(s => s.goldenBest);
  const cleared = useSaveStore(s => s.titles.includes(GOLDEN_TITLE));
  const [loading, setLoading] = useState(false);
  const pending = useRef(false);
  useEffect(() => () => { pending.current = false; }, []);

  const close = () => {
    pending.current = false;
    closeModal();
  };

  const begin = async () => {
    if (pending.current) return;
    pending.current = true;
    setLoading(true);
    await loadBanksFrom(0);
    if (!pending.current) return;
    close();
    beginGoldenRoad();
  };

  return (
    <Modal title="👑 黃金之路" onClose={close}>
      <section className="golden-intro">
        <p className="golden-lead">只憑英文能力，從最初的草原一路走到王座之間，擊敗沉默魔王。</p>
        <ul className="golden-rules">
          <li>⚔️ 只用<b>初始角色</b>：Lv 1、沒有轉職、沒有裝備、沒有夥伴英雄、沒有商店升級。</li>
          <li>🧭 共 {GOLDEN_STAGE_COUNT} 關：{REGIONS.map(r => r.name).join(' → ')}，每個區域 {GOLDEN_STAGES_PER_TIER} 關，題目越來越難。</li>
          <li>💀 <b>不能答錯、不能超時</b>，一次失誤就結束。基本限時 20 秒，長閱讀依題目與選項字數延長，長口說也有朗讀時間。</li>
          <li>🔥 Combo 從頭到尾不會重置，困難題 Bonus 還會讓 combo 翻倍，要靠連續答對才打得倒魔王。</li>
          <li>🏆 首次通關可獲稱號「{GOLDEN_TITLE}」和召喚券 🎫 ×{GOLDEN_CLEAR_TICKETS}，並解鎖特殊結局。</li>
        </ul>
        <p className="golden-best">
          {cleared ? `✨ 已通關！稱號「${GOLDEN_TITLE}」` : best > 0 ? `最佳紀錄：通過 ${best} / ${GOLDEN_STAGE_COUNT} 關` : '還沒有挑戰紀錄'}
        </p>
      </section>
      <div className="tutorial-actions">
        <button className="btn btn-ghost" onMouseDown={keepFocus} onClick={close}>{loading ? '取消載入' : '再準備一下'}</button>
        <button className="btn btn-primary" onMouseDown={keepFocus} disabled={loading} onClick={() => void begin()}>
          {loading ? '載入九區題庫…' : '踏上黃金之路'}
        </button>
      </div>
    </Modal>
  );
}
