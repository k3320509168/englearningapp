import { useEffect, useState } from 'react';
import Modal from './Modal';
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { checkFlag, firstCheckAnswer, practiceFlag, startFlag, TRANSFER_PRACTICE_ITEMS, transferDueAt } from '../game/transferPractice';

const practice = TRANSFER_PRACTICE_ITEMS;

export default function TransferModal() {
  const seen = useSaveStore(s => s.storySeen);
  const open = useUiStore(s => s.openModal);
  const [feedback, setFeedback] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const [checks, setChecks] = useState<readonly import('../game/transferPractice').TransferItem[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);
  const due = transferDueAt(seen);
  const unlocked = due !== null && now >= due;
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!unlocked) return;
    let active = true;
    void import('../game/transferCheckItems').then(
      module => { if (active) setChecks(module.TRANSFER_CHECK_ITEMS); },
      () => { if (active) setLoadError(true); },
    );
    return () => { active = false; };
  }, [unlocked, retry]);
  const remaining = practice.find(item => !seen.includes(practiceFlag(item.id)));
  const check = unlocked ? checks.find(item => firstCheckAnswer(seen, item) === undefined) : undefined;
  const item = remaining ?? check;

  return <Modal title="📜 新情境挑戰" onClose={() => open('caravan')}>
    <div className="caravan-scenario">
      {item ? <>
        <h3>{item.context}</h3>
        <p lang="en">{item.source}</p>
        <p>選出最符合新條件的安排。</p>
        {item.options.map((option, index) => <button type="button" className="btn" lang="en" key={option}
          style={{ height: 'auto', whiteSpace: 'normal', textAlign: 'left' }}
          onClick={() => {
            const current = useSaveStore.getState();
            if (item.role === 'check') {
              const availableAt = transferDueAt(current.storySeen);
              if (availableAt === null || Date.now() < availableAt || firstCheckAnswer(current.storySeen, item) !== undefined) return;
              current.markStorySeen(checkFlag(item.id, index));
              return;
            }
            if (current.storySeen.includes(practiceFlag(item.id))) return;
            setFeedback(index === item.answer ? item.explanation : '再讀一次條件，找出能同時滿足限制的安排。');
            if (index !== item.answer) return;
            const flag = practiceFlag(item.id);
            if (practice.every(entry => entry.id === item.id || current.storySeen.includes(practiceFlag(entry.id)))) {
              useSaveStore.setState({ storySeen: [...current.storySeen, flag, startFlag(Date.now())] });
            } else current.markStorySeen(flag);
          }}>{option}</button>)}
        {item.role === 'check' && <p>檢核會保存每題第一次作答，全題完成後查看解析。</p>}
      </> : due !== null && !unlocked ? <>
        <h3>三種情境練習完成</h3>
        <p>新的檢核題將於 {new Date(due).toLocaleString('zh-TW')} 開放。</p>
        <p>屆時會以陌生情境確認你是否還能根據限制調整安排。</p>
      </> : checks.length === 0 || !unlocked ? <p role="status">{loadError ? <button className="btn" onClick={() => { setLoadError(false); setRetry(retry + 1); }}>題目載入失敗，重試</button> : '正在準備檢核題…'}</p> : <>
        <h3>延後檢核完成</h3>
        <p>首次作答答對 {checks.filter(entry => firstCheckAnswer(seen, entry) === entry.answer).length} / {checks.length} 題。</p>
        <p>這份結果反映你在兩道陌生閱讀題的表現。</p>
        {checks.map(entry => <p key={entry.id}>{entry.context}：{entry.explanation}</p>)}
      </>}
      {feedback && <p role="status">{feedback}</p>}
    </div>
  </Modal>;
}
