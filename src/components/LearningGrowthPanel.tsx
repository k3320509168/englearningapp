import { useState } from 'react';
import { useSaveStore } from '../store/saveStore';
import { readLearningEvidence } from '../game/learningEvidence';
import { firstCheckAnswer, practiceFlag, TRANSFER_PRACTICE_ITEMS } from '../game/transferPractice';

export default function LearningGrowthPanel() {
  const seen = useSaveStore(s => s.storySeen);
  const [entries] = useState(() => readLearningEvidence().entries);
  const practiced = TRANSFER_PRACTICE_ITEMS.filter(item => seen.includes(practiceFlag(item.id))).length;
  const speaking = entries.filter(entry => entry.skill === 'speaking' && entry.mode === 'speech' && !entry.voiceFallback);
  const fallback = entries.filter(entry => entry.voiceFallback && entry.mode === 'typed').length;
  const skipped = entries.filter(entry => entry.mode === 'skipped').length;
  // 已完成檢核才載入成績內容，成長頁在等待期間也不曝光題面。
  const [checks, setChecks] = useState<readonly import('../game/transferPractice').TransferItem[]>([]);
  const answered = seen.filter(flag => /^scenario:transfer:v1:check:[a-z0-9-]+:\d+$/.test(flag)).length;

  return <section role="tabpanel" aria-label="英文練習" className="caravan-scenario">
    <h3>本機答題紀錄</h3>
    {entries.length > 0 ? <>
      <p>固定答案練習 {entries.length} 次，其中 {entries.filter(entry => entry.outcome === 'correct').length} 次答對。</p>
      <p>指定表達語音作答 {speaking.length} 次，口說改鍵盤 {fallback} 次，跳過 {skipped} 次。</p>
      <p>近期紀錄只留在這台裝置。自由說寫程度尚未評量。</p>
    </> : <p>還沒有這台裝置的答題紀錄。</p>}
    <h3>新情境挑戰</h3>
    <p>練習完成 {practiced} / {TRANSFER_PRACTICE_ITEMS.length} 個情境。</p>
    {answered > 0 && checks.length === 0 && <button type="button" className="btn"
      onClick={() => void import('../game/transferCheckItems').then(module => setChecks(module.TRANSFER_CHECK_ITEMS)).catch(() => setChecks([]))}>
      查看檢核進度
    </button>}
    {checks.length > 0 && (checks.every(item => firstCheckAnswer(seen, item) !== undefined)
      ? <p>陌生情境檢核，首次答對 {checks.filter(item => firstCheckAnswer(seen, item) === item.answer).length} / {checks.length} 題。</p>
      : <p>陌生情境檢核已做 {checks.filter(item => firstCheckAnswer(seen, item) !== undefined).length} / {checks.length} 題。</p>)}
  </section>;
}
