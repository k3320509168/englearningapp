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

const KIND_TABS: { id: KindFilter; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'word', label: '📖 單字' },
  { id: 'phrase', label: '🧩 片語' },
  { id: 'grammar', label: '📐 文法' },
];

const REGION_TABS = [
  { key: 'PRE', name: '失語之境 (Pre-A1)' },
  ...LEVELS.map(lv => ({ key: lv, name: regionName(lv) })),
];

// 圖鑑：收錄遇過的單字、片語與文法，答對次數決定星數（★1：1 次、★2：3 次、★3：5 次）
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
  const [selectedItem, setSelectedItem] = useState<CodexItem | null>(null);

  const items = useMemo(() => codexItems(regionKey, codex, mistakes), [regionKey, codex, mistakes]);
  const filteredItems = useMemo(() => {
    if (kindFilter === 'all') return items;
    return items.filter(i => i.kind === kindFilter);
  }, [items, kindFilter]);

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
            onClick={() => { setRegionKey(tab.key); setSelectedItem(null); }}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* 單字／片語／文法分類過濾膠囊 */}
      <div className="codex-kind-bar">
        {KIND_TABS.map(t => (
          <button
            key={t.id}
            className={`pill ${kindFilter === t.id ? 'is-on' : ''}`}
            onMouseDown={keepFocus}
            onClick={() => setKindFilter(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 頂部收集進度與滿星精通儀表板 */}
      <div className="codex-dashboard">
        <div className="codex-stat-chip">
          <div className="codex-stat-top">
            <span className="codex-stat-label">
              {kindFilter === 'word' ? '📖 已收錄單字' : kindFilter === 'phrase' ? '🧩 已收錄片語' : kindFilter === 'grammar' ? '📐 已收錄文法' : '📖 已收錄全部'}
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

      {/* 卡片網格（固定大小，點擊彈出視窗） */}
      <ul className="codex-grid">
        {filteredItems.map(item => {
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
