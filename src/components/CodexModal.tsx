import { useMemo, useState } from 'react';
import Modal from './Modal';
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { LEVELS } from '../game/QuestionData';
import { regionName } from '../game/regions';
import { codexItems } from '../game/codex';
import type { CodexItem } from '../game/codex';
import { useSpeak } from './useSpeak';
import { keepFocus } from './keepFocus';

type KindFilter = 'all' | 'word' | 'phrase' | 'grammar';
type StatusFilter = 'all' | 'seen' | 'review' | 'master';

const KIND_TABS: { id: KindFilter; label: string }[] = [
  { id: 'all', label: '全部類型' },
  { id: 'word', label: '📖 單字' },
  { id: 'phrase', label: '🧩 片語' },
  { id: 'grammar', label: '📐 文法' },
];

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: '全部狀態' },
  { id: 'seen', label: '🔓 僅已解鎖' },
  { id: 'review', label: '⚠️ 待複習' },
  { id: 'master', label: '🏆 滿星精通' },
];

const REGION_TABS = [
  { key: 'PRE', name: '失語之境 (Pre-A1)' },
  ...LEVELS.map(lv => ({ key: lv, name: regionName(lv) })),
];

const PAGE_SIZE = 80;

// 圖鑑：收錄遇過的單字、片語與文法，支援即時關鍵字搜尋、進階狀態過濾與高效平滑分批載入
export default function CodexModal() {
  const codex = useSaveStore(s => s.codex);
  const mistakes = useSaveStore(s => s.mistakes);
  const unlockedIndex = useSaveStore(s => s.unlockedIndex);
  const closeModal = useUiStore(s => s.closeModal);
  const say = useSpeak();

  // 預設切換到目前解鎖的最高區域（索引 0 為 PRE，之後為 LEVELS）
  const [regionKey, setRegionKey] = useState<string>(() => {
    if (unlockedIndex < 0) return 'PRE';
    return LEVELS[Math.min(unlockedIndex, LEVELS.length - 1)];
  });
  const [kindFilter, setKindFilter] = useState<KindFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedItem, setSelectedItem] = useState<CodexItem | null>(null);

  const items = useMemo(() => codexItems(regionKey, codex, mistakes), [regionKey, codex, mistakes]);

  const filteredItems = useMemo(() => {
    let result = items;
    if (kindFilter !== 'all') {
      result = result.filter(i => i.kind === kindFilter);
    }
    if (statusFilter === 'seen') {
      result = result.filter(i => i.seen);
    } else if (statusFilter === 'review') {
      result = result.filter(i => i.needsReview);
    } else if (statusFilter === 'master') {
      result = result.filter(i => i.stars === 3);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(i =>
        i.title.toLowerCase().includes(q) ||
        i.subtitle.toLowerCase().includes(q) ||
        i.example.toLowerCase().includes(q)
      );
    }
    return result;
  }, [items, kindFilter, statusFilter, searchQuery]);

  const displayedItems = useMemo(() => {
    return filteredItems.slice(0, visibleCount);
  }, [filteredItems, visibleCount]);

  const seen = filteredItems.filter(i => i.seen).length;
  const mastered = filteredItems.filter(i => i.stars === 3).length;

  const onCardClick = (item: CodexItem) => {
    setSelectedItem(item);
    if (item.audio) say(item.audio);
  };

  const getKindLabel = (k: CodexItem['kind']) => {
    if (k === 'word') return '單字';
    if (k === 'phrase') return '片語';
    return '文法';
  };

  const handleRegionChange = (key: string) => {
    setRegionKey(key);
    setSelectedItem(null);
    setVisibleCount(PAGE_SIZE);
  };

  const handleKindChange = (k: KindFilter) => {
    setKindFilter(k);
    setVisibleCount(PAGE_SIZE);
  };

  const handleStatusChange = (s: StatusFilter) => {
    setStatusFilter(s);
    setVisibleCount(PAGE_SIZE);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <Modal title="📚 冒險圖鑑" onClose={closeModal}>
      {/* 區域橫向滑動分頁：涵蓋 Pre-A1 失語之境到 C2 王城 */}
      <div className="tabs tabs-scroll" role="tablist">
        {REGION_TABS.map(tab => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={tab.key === regionKey}
            className={`tab ${tab.key === regionKey ? 'is-active' : ''}`}
            onMouseDown={keepFocus}
            onClick={() => handleRegionChange(tab.key)}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* 搜尋與進階過濾控制列 */}
      <div className="codex-filter-panel">
        <div className="codex-search-row">
          <input
            type="text"
            className="codex-search-input"
            placeholder="🔍 搜尋單字、片語、中文釋義或例句關鍵字..."
            value={searchQuery}
            onChange={e => handleSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              className="codex-search-clear"
              onClick={() => handleSearchChange('')}
              aria-label="清除搜尋"
            >
              ✕
            </button>
          )}
        </div>

        {/* 類型膠囊 */}
        <div className="codex-filter-row">
          <span className="codex-filter-label">類型：</span>
          {KIND_TABS.map(t => (
            <button
              key={t.id}
              className={`pill ${kindFilter === t.id ? 'is-on' : ''}`}
              onMouseDown={keepFocus}
              onClick={() => handleKindChange(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 狀態膠囊 */}
        <div className="codex-filter-row">
          <span className="codex-filter-label">狀態：</span>
          {STATUS_TABS.map(t => (
            <button
              key={t.id}
              className={`pill ${statusFilter === t.id ? 'is-on' : ''}`}
              onMouseDown={keepFocus}
              onClick={() => handleStatusChange(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 頂部收集進度與滿星精通儀表板 */}
      <div className="codex-dashboard">
        <div className="codex-stat-chip">
          <div className="codex-stat-top">
            <span className="codex-stat-label">
              {kindFilter === 'word' ? '📖 已收錄單字' : kindFilter === 'phrase' ? '🧩 已收錄片語' : kindFilter === 'grammar' ? '📐 已收錄文法' : '📖 已收錄項目'}
            </span>
            <span className="codex-stat-val"><b>{seen}</b> / {filteredItems.length}</span>
          </div>
          <div className="codex-mini-bar" aria-hidden>
            <span style={{ width: `${filteredItems.length ? (seen / filteredItems.length) * 100 : 0}%` }} />
          </div>
        </div>

        <div className="codex-stat-chip is-mastered">
          <div className="codex-stat-top">
            <span className="codex-stat-label">🏆 滿星精通（★★★）</span>
            <span className="codex-stat-val"><b className="gold-text">{mastered}</b> 條</span>
          </div>
          <div className="codex-mini-bar is-gold" aria-hidden>
            <span style={{ width: `${seen ? (mastered / seen) * 100 : 0}%` }} />
          </div>
        </div>
      </div>

      {/* 無匹配結果空狀態提示 */}
      {filteredItems.length === 0 && (
        <div className="codex-empty-tip">
          🔍 未找到符合條件的圖鑑卡片，換個關鍵字或切換狀態試試看吧！
        </div>
      )}

      {/* 卡片網格（高效分批渲染） */}
      {displayedItems.length > 0 && (
        <ul className="codex-grid">
          {displayedItems.map(item => {
            if (!item.seen) {
              return (
                <li key={item.id} className="codex-card is-locked" aria-label="尚未遇到">
                  <span className="codex-title">？？？</span>
                  <span className="codex-pos-tag">{getKindLabel(item.kind)}</span>
                </li>
              );
            }
            const isMaster = item.stars === 3;
            return (
              <li key={item.id} className={`codex-card ${isMaster ? 'is-master' : ''}`}>
                <button
                  className="codex-card-btn"
                  onMouseDown={keepFocus}
                  onClick={() => onCardClick(item)}
                  aria-label={`查看 ${item.title}`}
                >
                  <div className="codex-card-top">
                    <span className="codex-title">{item.title}</span>
                    {item.needsReview && <span className="review-tag">待複習</span>}
                  </div>
                  <div className="codex-card-bottom">
                    <span className="stars" aria-label={`熟練度 ${item.stars} 星`}>
                      {'★'.repeat(item.stars)}{'☆'.repeat(3 - item.stars)}
                    </span>
                    <span className="codex-pos-tag">{item.pos || getKindLabel(item.kind)}</span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* 底部平滑分批載入控制 */}
      {filteredItems.length > visibleCount && (
        <div className="codex-load-more-box">
          <button
            className="codex-load-more-btn"
            onMouseDown={keepFocus}
            onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
          >
            ⏬ 載入更多卡片 (+{Math.min(PAGE_SIZE, filteredItems.length - visibleCount)})
          </button>
          <span className="codex-load-info">
            已顯示 {displayedItems.length} / 總共 {filteredItems.length} 條卡片
          </span>
        </div>
      )}

      {/* 獨立彈出的單字／片語／文法詳情卡片 (Popup Card) */}
      {selectedItem && (
        <div className="codex-popup-overlay" onClick={() => setSelectedItem(null)}>
          <div className="codex-popup-card" onClick={e => e.stopPropagation()}>
            <div className="codex-popup-header">
              <button
                className="codex-popup-audio-btn"
                onMouseDown={keepFocus}
                onClick={() => say(selectedItem.audio || selectedItem.title)}
                aria-label="播放發音"
                disabled={!selectedItem.audio && !selectedItem.title}
              >
                🔊
              </button>
              <div className="codex-popup-title-box">
                <h3 className="codex-popup-word">{selectedItem.title}</h3>
                <span className="codex-popup-pos">
                  {selectedItem.kind === 'word' ? '📖 單字' : selectedItem.kind === 'phrase' ? '🧩 片語' : '📐 文法考點'}
                  {selectedItem.pos && selectedItem.pos !== 'grammar' && selectedItem.pos !== 'phrase' ? ` · ${selectedItem.pos}` : ''}
                </span>
              </div>
              <button
                className="codex-popup-close-btn"
                onMouseDown={keepFocus}
                onClick={() => setSelectedItem(null)}
                aria-label="關閉卡片"
              >
                ✕
              </button>
            </div>

            <div className="codex-popup-body">
              <div className="codex-popup-section">
                <h4>釋義與解析</h4>
                <p className="codex-popup-def">{selectedItem.subtitle || '暫無中文釋義'}</p>
              </div>

              {selectedItem.example && (
                <div className="codex-popup-section">
                  <h4>冒險例句 / 考點原句</h4>
                  <div className="codex-popup-example-box">
                    {selectedItem.example.split('\n').map((line, idx) => (
                      <p key={idx} className={idx === 0 ? 'codex-popup-en' : 'codex-popup-zh'}>{line}</p>
                    ))}
                  </div>
                </div>
              )}

              <div className="codex-popup-stats">
                <span className="muted">戰鬥作答紀錄：答對 {selectedItem.correct} 次 / 答錯 {selectedItem.wrong} 次</span>
                <span className="codex-popup-star-track">
                  {'★'.repeat(selectedItem.stars)}{'☆'.repeat(3 - selectedItem.stars)}
                </span>
              </div>
            </div>

            <div className="codex-popup-actions">
              <button
                className="btn btn-primary"
                onMouseDown={keepFocus}
                onClick={() => {
                  if (selectedItem.audio) say(selectedItem.audio);
                }}
              >
                🔊 重複發音
              </button>
              <button
                className="btn btn-ghost"
                onMouseDown={keepFocus}
                onClick={() => setSelectedItem(null)}
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
