import { useState, useMemo } from 'react';
import Modal from './Modal';
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { STORIES, storyRegion, storyTitle } from '../game/story';
import { PROLOGUE, REGIONS } from '../game/regions';
import { sfx } from '../game/sfx';
import { keepFocus } from './keepFocus';

// 劇情回顧：全頁畫廊，支援區域分類、關鍵字篩選、未看過章節鎖定提示，以及首次觀看獎勵
export default function StoryLogModal() {
  const closeModal = useUiStore(s => s.closeModal);
  const openStory = useUiStore(s => s.openStory);
  const storySeen = useSaveStore(s => s.storySeen);
  const storyRewardClaimed = useSaveStore(s => s.storyRewardClaimed) ?? [];
  const claimStoryReward = useSaveStore(s => s.claimStoryReward);

  const [activeTab, setActiveTab] = useState<number | 'all'>('all');
  const [search, setSearch] = useState('');

  // 取得所有劇情 ID
  const allIds = useMemo(() => Object.keys(STORIES), []);
  const seenSet = useMemo(() => new Set(storySeen), [storySeen]);
  const claimedSet = useMemo(() => new Set(storyRewardClaimed), [storyRewardClaimed]);

  const groupName = (r: number) => (r === -1 ? `序章・${PROLOGUE.name}` : r === 99 ? '黃金之路' : (REGIONS[r]?.name ?? `第 ${r + 1} 區`));

  // 章節標題
  const getTitle = (id: string, r: number) => {
    const t = storyTitle(id, i => REGIONS[i]?.name ?? '', (ri, m) => REGIONS[ri]?.maps[m] ?? '');
    const prefix = `${r === -1 ? PROLOGUE.name : REGIONS[r]?.name ?? ''}・`;
    return t.startsWith(prefix) ? t.slice(prefix.length) : t;
  };

  const groups = useMemo(() => {
    const regionKeys = [-1, ...REGIONS.map((_, i) => i), 99];
    return regionKeys.map(r => {
      let ids = allIds.filter(id => storyRegion(id) === r);
      if (search.trim()) {
        const query = search.trim().toLowerCase();
        ids = ids.filter(id => {
          const title = storyTitle(id, i => REGIONS[i]?.name ?? '', (ri, m) => REGIONS[ri]?.maps[m] ?? '').toLowerCase();
          return title.includes(query) || id.toLowerCase().includes(query);
        });
      }
      return { r, name: groupName(r), ids };
    }).filter(g => g.ids.length > 0);
  }, [allIds, search]);

  const filteredGroups = useMemo(() => {
    if (activeTab === 'all') return groups;
    return groups.filter(g => g.r === activeTab);
  }, [groups, activeTab]);

  const totalSeenInFilter = filteredGroups.reduce((acc, g) => acc + g.ids.filter(id => seenSet.has(id)).length, 0);
  const totalInFilter = filteredGroups.reduce((acc, g) => acc + g.ids.length, 0);

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
    <Modal title="📜 冒險史詩・劇情回顧" onClose={closeModal}>
      <div className="story-header-bar">
        <p className="story-bonus-tip">
          💡 重溫回味劇情的冒險者，首次重溫每一幕皆可獲得 <b>🎟️ 掃蕩券</b>（重要魔王與序章贈 <b>🎫 召喚券</b>）！
        </p>
        <div className="story-stats-row">
          <span className="story-progress-badge">
            📖 劇情解鎖進度：<b>{totalSeenInFilter}</b> / {totalInFilter}
          </span>
          <input
            type="search"
            className="story-search-input"
            placeholder="🔍 搜尋劇情或章節..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* 區域分頁選單 */}
      <div className="story-tabs-scroll">
        <button
          className={`story-tab-btn ${activeTab === 'all' ? 'is-active' : ''}`}
          onMouseDown={keepFocus}
          onClick={() => setActiveTab('all')}
        >
          全部章節
        </button>
        <button
          className={`story-tab-btn ${activeTab === -1 ? 'is-active' : ''}`}
          onMouseDown={keepFocus}
          onClick={() => setActiveTab(-1)}
        >
          序章
        </button>
        {REGIONS.map((reg, idx) => (
          <button
            key={idx}
            className={`story-tab-btn ${activeTab === idx ? 'is-active' : ''}`}
            onMouseDown={keepFocus}
            onClick={() => setActiveTab(idx)}
          >
            {reg.name}
          </button>
        ))}
        <button
          className={`story-tab-btn ${activeTab === 99 ? 'is-active' : ''}`}
          onMouseDown={keepFocus}
          onClick={() => setActiveTab(99)}
        >
          黃金之路
        </button>
      </div>

      {filteredGroups.length === 0 ? (
        <p className="muted" style={{ padding: '24px 0', textAlign: 'center' }}>
          無符合條件的章節劇情。
        </p>
      ) : (
        filteredGroups.map(g => (
          <section key={g.r} className="story-chapter">
            <div className="story-chapter-header">
              <h3>{g.name}</h3>
              <span className="story-chapter-count">
                已解鎖 {g.ids.filter(id => seenSet.has(id)).length}/{g.ids.length}
              </span>
            </div>
            <div className="story-grid">
              {g.ids.map(id => {
                const isSeen = seenSet.has(id);
                const claimed = claimedSet.has(id);
                const isMajor = id.includes('clear') || id.includes('boss') || id === 'prologue';
                const titleText = getTitle(id, g.r);

                if (!isSeen) {
                  return (
                    <div key={id} className="story-log-card is-locked" title="通關主線對應關卡後解鎖此劇情">
                      <span className="story-lock-icon">🔒</span>
                      <span className="story-card-title">{titleText}</span>
                      <span className="story-lock-tag">未解鎖</span>
                    </div>
                  );
                }

                return (
                  <button
                    key={id}
                    className={`btn story-log-card is-unlocked ${claimed ? 'is-claimed' : 'is-unclaimed'}`}
                    onMouseDown={keepFocus}
                    onClick={() => onSelectStory(id)}
                    title={claimed ? '點擊重溫劇情' : `首次重溫贈送 ${isMajor ? '🎫 召喚券×1' : '🎟️ 掃蕩券×1'}`}
                  >
                    <div className="story-card-body">
                      <span className="story-play-icon">▶</span>
                      <span className="story-card-title">{titleText}</span>
                    </div>
                    <div className="story-card-footer">
                      {!claimed ? (
                        <span className="story-reward-pill">{isMajor ? '🎁 🎫×1' : '🎁 🎟️×1'}</span>
                      ) : (
                        <span className="story-claimed-check">✔ 已領取</span>
                      )}
                    </div>
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
