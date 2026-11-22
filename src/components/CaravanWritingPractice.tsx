import { useState } from 'react';
import { CARAVAN_EXAMPLE } from '../game/caravanScenario';

const CRITERIA = [
  '有交代目前的建議與安全限制。',
  '有回應隊長對延誤的顧慮。',
  '有提出對方可以採取的下一步。',
];

export default function CaravanWritingPractice() {
  const [draft, setDraft] = useState('');
  const [showReview, setShowReview] = useState(false);
  return <details className="caravan-reference">
    <summary>用自己的話回應隊長（選練）</summary>
    <p>假設隊長擔心客戶因延誤離開。寫兩三句英文，解釋為什麼改道，並說明怎麼通知客戶。</p>
    <p>這段練習只留在目前視窗。你可以對照下面的要點自行修改。</p>
    <label className="caravan-draft">
      英文回應
      <textarea lang="en" value={draft} maxLength={1200} rows={4} onChange={event => setDraft(event.target.value)} />
    </label>
    <div className="caravan-actions">
      <button className="btn" type="button" disabled={!draft.trim()} onClick={() => setShowReview(true)}>對照寫作要點</button>
    </div>
    {showReview && <section className="caravan-support" aria-label="寫作自我檢查">
      <ul>{CRITERIA.map(criterion => <li key={criterion}>{criterion}</li>)}</ul>
      <blockquote lang="en">{CARAVAN_EXAMPLE}</blockquote>
      <p>你可以保留原本的寫法，或依要點再改一版。</p>
    </section>}
  </details>;
}
