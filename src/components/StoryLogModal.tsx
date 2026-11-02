import Modal from './Modal';
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { STORIES, storyRegion, storyTitle } from '../game/story';
import { PROLOGUE, REGIONS } from '../game/regions';
import { sfx } from '../game/sfx';
import { keepFocus } from './keepFocus';

// 劇情回顧：依章節（序章與失語邊境、九區、黃金之路）列出看過的劇情，點一下重看
export default function StoryLogModal() {
  const closeModal = useUiStore(s => s.closeModal);
  const openStory = useUiStore(s => s.openStory);
  const storySeen = useSaveStore(s => s.storySeen);
  const storyRewardClaimed = useSaveStore(s => s.storyRewardClaimed) ?? [];
  const claimStoryReward = useSaveStore(s => s.claimStoryReward);

  const seen = Object.keys(STORIES).filter(id => storySeen.includes(id));
  const groups = [-1, ...REGIONS.map((_, i) => i), 99]
    .map(r => ({ r, ids: seen.filter(id => storyRegion(id) === r) }))
    .filter(g => g.ids.length > 0);
  const groupName = (r: number) => (r === -1 ? `序章・${PROLOGUE.name}` : r === 99 ? '黃金之路' : REGIONS[r].name);
  // 章節裡只顯示「地圖・開場」，不重複區域名
  const short = (id: string, r: number) => {
    const t = storyTitle(id, i => REGIONS[i]?.name ?? '', (ri, m) => REGIONS[ri]?.maps[m] ?? '');
    const prefix = `${r === -1 ? PROLOGUE.name : groupName(r)}・`;
    return t.startsWith(prefix) ? t.slice(prefix.length) : t;
  };

  const onSelectStory = (id: string) => {
    openStory(id, true);
    const reward = claimStoryReward(id);
    if (reward) {
      sfx.victory();
      useUiStore.getState().celebrate({
        icon: reward.rewardType === 'ticket' ? '🎫' : '🎟️',
        title: '首次重溫劇情獎勵！',
        sub: reward.rewardType === 'ticket' ? '獲得 🎫 召喚券×1！' : '獲得 🎟️ 掃蕩券×1！回味冒險劇情的勇者值得嘉許',
        color: '#ffcd4b',
      });
    }
  };

  return (
    <Modal title="📜 劇情回顧" onClose={closeModal}>
      <p className="story-bonus-tip">
        💡 勇於重溫回味劇情的冒險者，首次重溫每一幕皆可獲得 <b>🎟️ 掃蕩券</b>（重要章節贈 <b>🎫 召喚券</b>）！
      </p>
      {groups.length === 0 ? (
        <p className="muted">還沒有看過的劇情。冒險途中看過的對話都會收在這裡。</p>
      ) : (
        groups.map(g => (
          <section key={g.r} className="story-chapter">
            <h3>{groupName(g.r)}</h3>
            <div className="story-list">
              {g.ids.map(id => {
                const claimed = storyRewardClaimed.includes(id);
                const isMajor = id.includes('clear') || id.includes('boss') || id === 'prologue';
                return (
                  <button
                    key={id}
                    className={`btn btn-small story-log-btn ${claimed ? 'is-claimed' : 'is-unclaimed'}`}
                    onMouseDown={keepFocus}
                    onClick={() => onSelectStory(id)}
                    title={claimed ? '已領取首看獎勵' : `首次重溫贈送 ${isMajor ? '🎫 召喚券×1' : '🎟️ 掃蕩券×1'}`}
                  >
                    <span>{short(id, g.r)}</span>
                    {!claimed ? (
                      <span className="story-reward-pill">{isMajor ? '🎁 🎫×1' : '🎁 🎟️×1'}</span>
                    ) : (
                      <span className="story-claimed-check">✔</span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        ))
      )}
    </Modal>
  );
}
