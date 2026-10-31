import Modal from './Modal';
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import type { ModalName } from '../store/uiStore';
import { GOLDEN_STAGE_COUNT } from '../game/golden';
import { useNotices } from './useNotices';
import { keepFocus } from './keepFocus';

// 副本與挑戰（第二十一輪 E5）：地圖下方只留一個入口，這裡用卡片列出五種副本：名稱、獎勵、狀態、一個「挑戰」按鈕
export default function AdventureModal() {
  const { closeModal, openModal } = useUiStore.getState();
  const notices = useNotices();
  const goldenBest = useSaveStore(s => s.goldenBest);
  const towerFloor = useSaveStore(s => s.towerFloor);
  const cards: { id: ModalName; icon: string; name: string; reward: string; status: string; tone?: string }[] = [
    { id: 'rush', icon: '⚡', name: '每日素材本', reward: '金幣、訓練素材', status: '60 秒快速複習' },
    { id: 'review', icon: '📕', name: '錯題修煉場', reward: '金幣、掃蕩券', status: notices.dueMistakes > 0 ? `待複習 ${notices.dueMistakes} 題` : '目前沒有到期的錯題' },
    { id: 'tower', icon: '🗼', name: '英雄時空之塔', reward: '英雄碎片、職業徽章', status: towerFloor > 0 ? `已到第 ${towerFloor} 層` : '從第 1 層開始' },
    { id: 'skillBoss', icon: '⚔️', name: '魔王挑戰', reward: '稱號、召喚券', status: '聽・說・讀・寫各一位魔王', tone: 'is-boss' },
    { id: 'golden', icon: '👑', name: '黃金之路', reward: '傳說稱號、召喚券', status: goldenBest > 0 ? `最佳 ${goldenBest} / ${GOLDEN_STAGE_COUNT} 關` : '只憑英文挑戰沉默魔王', tone: 'is-golden' },
  ];
  return (
    <Modal title="⚔️ 副本與挑戰" onClose={closeModal} wide>
      <div className="adventure-grid">
        {cards.map(c => (
          <section key={c.id} className={`adventure-card ${c.tone ?? ''}`}>
            <h3>{c.icon} {c.name}</h3>
            <p className="muted">{c.status}</p>
            <p className="adventure-reward">🎁 {c.reward}</p>
            <button className="btn btn-primary btn-small" onMouseDown={keepFocus} onClick={() => openModal(c.id)}>挑戰</button>
          </section>
        ))}
      </div>
    </Modal>
  );
}
