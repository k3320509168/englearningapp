import Modal from './Modal';
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import type { ModalName } from '../store/uiStore';
import { GOLDEN_STAGE_COUNT } from '../game/golden';
import { useNotices } from './useNotices';
import { keepFocus } from './keepFocus';

interface DungeonCard {
  id: ModalName;
  icon: string;
  name: string;
  tag: string;
  reward: string;
  status: string;
  tone: string;
  btnLabel: string;
}

// 副本與挑戰：奇幻 RPG 地下城卡牌風格，告別陽春感
export default function AdventureModal() {
  const { closeModal, openModal } = useUiStore.getState();
  const notices = useNotices();
  const goldenBest = useSaveStore(s => s.goldenBest);
  const towerFloor = useSaveStore(s => s.towerFloor);

  const dungeons: DungeonCard[] = [
    {
      id: 'rush',
      icon: '⚡',
      name: '每日素材本',
      tag: '每日快速',
      reward: '大量金幣、英雄訓練素材',
      status: '60 秒極速作答・高倍率經驗',
      tone: 'tone-rush',
      btnLabel: '極速挑戰 ⚔️',
    },
    {
      id: 'review',
      icon: '📕',
      name: '錯題修煉場',
      tag: notices.dueMistakes > 0 ? `待複習 ${notices.dueMistakes}` : '無錯題',
      reward: '金幣、副本掃蕩券',
      status: notices.dueMistakes > 0 ? `累積 ${notices.dueMistakes} 題待攻克` : '錯題皆已掌握・保持手感',
      tone: 'tone-review',
      btnLabel: '進入修煉 📖',
    },
    {
      id: 'tower',
      icon: '🗼',
      name: '英雄時空之塔',
      tag: towerFloor > 0 ? `第 ${towerFloor} 層` : '第 1 層',
      reward: '指定英雄碎片、職業徽章',
      status: towerFloor > 0 ? `目前推進至第 ${towerFloor} 層` : '無盡之塔・逐層試煉角逐頂端',
      tone: 'tone-tower',
      btnLabel: '攀登時空塔 🗼',
    },
    {
      id: 'skillBoss',
      icon: '⚔️',
      name: '四大領域魔王挑戰',
      tag: '首領死鬥',
      reward: '專屬榮譽稱號、召喚券',
      status: '聽・說・讀・寫四座魔王神殿',
      tone: 'tone-boss',
      btnLabel: '迎戰魔王 ⚔️',
    },
    {
      id: 'golden',
      icon: '👑',
      name: '黃金之路・沉默考驗',
      tag: '終極傳說',
      reward: '金色神話稱號、海量召喚券',
      status: goldenBest > 0 ? `歷史最佳紀錄：第 ${goldenBest} / ${GOLDEN_STAGE_COUNT} 關` : '純靠語言實力・無數值輾壓的終極試煉',
      tone: 'tone-golden',
      btnLabel: '踏上黃金之路 👑',
    },
    {
      id: 'worldBoss',
      icon: '🐉',
      name: '世界王突襲・法夫納',
      tag: '語音詠唱破盾',
      reward: '🎫 專武召喚券 ×2、🪙 3000金幣、神話稱號',
      status: '限時 60 秒・朗讀神聖英文古咒直擊魔王核心護盾',
      tone: 'tone-boss',
      btnLabel: '開啟詠唱突襲 🐉',
    },
  ];

  return (
    <Modal title="⚔️ 冒險副本與地下城挑戰" onClose={closeModal} wide>
      <div className="adventure-grid">
        {dungeons.map(d => (
          <section key={d.id} className={`adventure-card ${d.tone}`}>
            <div className="adventure-card-head">
              <div className="adventure-title-group">
                <span className="adventure-icon">{d.icon}</span>
                <div>
                  <h3 className="adventure-name">{d.name}</h3>
                  <span className="adventure-badge">{d.tag}</span>
                </div>
              </div>
            </div>
            <p className="adventure-status">{d.status}</p>
            <div className="adventure-reward-pill">
              <span className="reward-icon">🎁</span>
              <span className="reward-desc">{d.reward}</span>
            </div>
            <div className="adventure-card-foot">
              <button
                className="btn btn-primary adventure-btn"
                onMouseDown={keepFocus}
                onClick={() => openModal(d.id)}
              >
                {d.btnLabel}
              </button>
            </div>
          </section>
        ))}
      </div>
    </Modal>
  );
}
