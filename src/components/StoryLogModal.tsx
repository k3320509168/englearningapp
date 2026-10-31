import Modal from './Modal';
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { STORIES, storyRegion, storyTitle } from '../game/story';
import { PROLOGUE, REGIONS } from '../game/regions';
import { keepFocus } from './keepFocus';

// 劇情回顧：依章節（序章與失語邊境、九區、黃金之路）列出看過的劇情，點一下重看
export default function StoryLogModal() {
  const closeModal = useUiStore(s => s.closeModal);
  const openStory = useUiStore(s => s.openStory);
  const storySeen = useSaveStore(s => s.storySeen);
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

  return (
    <Modal title="📜 劇情回顧" onClose={closeModal}>
      {groups.length === 0 ? <p className="muted">還沒有看過的劇情。冒險途中看過的對話都會收在這裡。</p> : groups.map(g => (
        <section key={g.r} className="story-chapter">
          <h3>{groupName(g.r)}</h3>
          <div className="story-list">
            {g.ids.map(id => (
              <button key={id} className="btn btn-small" onMouseDown={keepFocus} onClick={() => openStory(id, true)}>{short(id, g.r)}</button>
            ))}
          </div>
        </section>
      ))}
    </Modal>
  );
}
