import { useState } from 'react';
import Modal from './Modal';
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { useSpeak } from './useSpeak';
import { keepFocus } from './keepFocus';
import { CARAVAN_EXAMPLE, CARAVAN_MANIFEST, CARAVAN_NOTICE, CARAVAN_STAGES, CARAVAN_UPDATE, caravanFlag, caravanListenAnswer, caravanReadAnswer, caravanResponseAnswer, caravanResume } from '../game/caravanScenario';
import './CaravanModal.css';

type Card = { value: string; text: string };
function Cards({ title, name, value, onChange, cards, disabled }: { title: string; name: string; value: string; onChange: (v: string) => void; cards: Card[]; disabled: boolean }) {
  return <fieldset className="caravan-cards" disabled={disabled}><legend>{title}</legend>{cards.map(card => <label key={card.value} className={value === card.value ? 'is-selected' : ''}>
    <input type="radio" name={name} value={card.value} checked={value === card.value} onChange={() => onChange(card.value)} />
    <span>{card.text}</span>
  </label>)}</fieldset>;
}
export default function CaravanModal() {
  const seen = useSaveStore(s => s.storySeen);
  const mark = useSaveStore(s => s.markStorySeen);
  const { closeModal } = useUiStore.getState();
  const [stage, setStage] = useState(() => caravanResume(seen));
  const [route, setRoute] = useState('');
  const [reason, setReason] = useState('');
  const [alternative, setAlternative] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'retry' | null>(null);
  const say = useSpeak();
  const supported = seen.includes(caravanFlag('listen:subtitles'));
  const hinted = seen.includes(caravanFlag('read:hint'));
  const audioRequested = seen.includes(caravanFlag('listen:audio-requested'));
  const resetInputs = () => { setRoute(''); setReason(''); setAlternative(''); setFeedback(null); };
  const jump = (next: number) => { resetInputs(); setStage(next); };
  const check = () => {
    const correct = stage === 0 ? caravanReadAnswer(route, reason)
      : stage === 1 ? caravanListenAnswer(route, reason) : caravanResponseAnswer(route, reason, alternative);
    setFeedback(correct ? 'correct' : 'retry');
    if (correct) mark(caravanFlag(`done:${CARAVAN_STAGES[stage]}`));
  };
  const next = () => jump(stage === 2 ? -1 : stage + 1);
  const locked = feedback === 'correct';
  const hasAnswer = !!route && !!reason && (stage !== 2 || !!alternative);
  return <Modal title="🛒 護送商隊・路線之爭" onClose={closeModal} wide>
    <div className="caravan-scenario">
      <p className="caravan-note">商隊正等你指路！讀公告、聽新消息，再說服隊長安全改道。無計時，可使用文字輔助。</p>
      <nav className="caravan-progress" aria-label="商隊任務進度">{CARAVAN_STAGES.map((name, i) => <span key={name}>{seen.includes(caravanFlag(`done:${name}`)) ? '✓' : '○'} {i + 1}. {['讀公告', '更新路線', '回應隊長'][i]}</span>)}</nav>
      {stage === -1 ? <section className="caravan-complete">
        <h3>商隊安全抵達！</h3>
        <p>你根據新消息調整了路線，也替隊長解決了顧慮。商隊可以安全出發了！</p>
        <p>{hinted ? '選路曾使用提示。' : '選路未開啟提示。'}{supported ? '更新路線曾開啟字幕，記為文字輔助練習。' : audioRequested ? '曾要求播放音訊；尚不能據此確認獨立聽力能力。' : '沒有音訊播放紀錄，聽力未驗證。'}</p>
        <p>參考表達（其中一種可行安排）：</p><blockquote lang="en">{CARAVAN_EXAMPLE}</blockquote>
        <p className="caravan-note">本次為引導式情境練習，自由口說與寫作程度尚未評量。</p>
        <div className="caravan-actions"><button className="btn btn-primary" onMouseDown={keepFocus} onClick={() => jump(0)}>重玩三節（無額外獎勵）</button><button className="btn" onMouseDown={keepFocus} onClick={closeModal}>回到冒險</button><button className="btn" onClick={() => useUiStore.getState().openModal('transfer')}>新情境挑戰</button></div>
      </section> : <>
        <h3>{['第一節：選最快的安全路線', '第二節：商人帶來新消息', '第三節：說服商隊長'][stage]}</h3>
        <details className="caravan-reference" open={stage === 0}>
          <summary>查看原始公告與出發清單</summary><p lang="en">{CARAVAN_NOTICE}</p><p lang="en">{CARAVAN_MANIFEST}</p>
        </details>
        {stage === 0 && <>
          <p>依公告與商隊重量，選擇最快而且安全的路線，再選出依據。</p>
          <Cards title="選擇路線" name="read-route" value={route} onChange={setRoute} disabled={locked} cards={[{ value: 'bridge', text: 'Take the stone bridge.' }, { value: 'forest', text: 'Take the forest road.' }]} />
          <Cards title="選擇依據" name="read-reason" value={reason} onChange={setReason} disabled={locked} cards={[{ value: 'under-limit', text: 'The caravan weighs 2.2 tonnes, below the 2.5-tonne bridge limit.' }, { value: 'shortest-only', text: 'The shortest route is always safe, regardless of weight.' }]} />
          {!hinted && !locked && <button className="btn btn-ghost" onMouseDown={keepFocus} onClick={() => mark(caravanFlag('read:hint'))}>需要提示</button>}
          {hinted && <p className="caravan-support">提示：比較 2.2 和 2.5，再看看哪條路多花十分鐘。使用提示仍可完成故事。</p>}
        </>}
        {stage === 1 && <>
          <p>出發前，商人增加了貨物。聽消息後，更新總重與路線；原公告仍可回看。</p>
          <div className="caravan-actions"><button className="btn" onMouseDown={keepFocus} onClick={() => { mark(caravanFlag('listen:audio-requested')); say(CARAVAN_UPDATE); }}>🔊 播放商人消息</button><button className="btn btn-ghost" onMouseDown={keepFocus} onClick={() => mark(caravanFlag('listen:subtitles'))}>顯示字幕（文字輔助）</button></div>
          {supported && <div className="caravan-support"><p lang="en">{CARAVAN_UPDATE}</p><p>此節已開啟文字輔助，不記為獨立聽力驗證。</p></div>}
          <Cards title="更新後總重" name="listen-weight" value={reason} onChange={setReason} disabled={locked} cards={[{ value: '2.2', text: '2.2 tonnes' }, { value: '2.8', text: '2.8 tonnes' }, { value: '0.6', text: '0.6 tonnes' }]} />
          <Cards title="更新後路線" name="listen-route" value={route} onChange={setRoute} disabled={locked} cards={[{ value: 'bridge', text: 'Keep using the stone bridge.' }, { value: 'forest', text: 'Use the forest road, which has a 6-tonne limit.' }]} />
        </>}
        {stage === 2 && <>
          <blockquote lang="en">Captain: “The forest road takes ten minutes longer. Why can't we just use the bridge?”</blockquote>
          <p>已知商隊現在重 2.8 噸，橋限重 2.5 噸，森林路限重 6 噸。組出「立場＋理由＋可行安排」，回應隊長的顧慮。</p>
          <Cards title="你的立場" name="respond-stance" value={route} onChange={setRoute} disabled={locked} cards={[{ value: 'forest', text: 'I suggest taking the forest road.' }, { value: 'bridge', text: 'We should cross the bridge as fast as possible.' }]} />
          <Cards title="提出理由" name="respond-reason" value={reason} onChange={setReason} disabled={locked} cards={[{ value: 'over-limit', text: 'Our wagon now exceeds the bridge limit.' }, { value: 'hurry', text: 'Being in a hurry makes the bridge stronger.' }]} />
          <Cards title="提出可行安排" name="respond-alternative" value={alternative} onChange={setAlternative} disabled={locked} cards={[{ value: 'message', text: 'We can send a message ahead to explain the delay.' }, { value: 'call', text: 'We can call the customer and confirm a later arrival time.' }, { value: 'ignore', text: 'We can ignore the weight limit.' }]} />
        </>}
        <div aria-live="polite" className="caravan-feedback">
          {feedback === 'retry' && <p>再想一下：{stage === 0 ? '安全要看總重量是否低於上限；兩條都安全時，再比較行程時間。' : stage === 1 ? '消息已說明更新後總重；用這個新重量和橋及森林路的限重比較。' : '回應需兼顧安全理由與可行安排；趕時間不會改變限重。'} 選項可以重新調整。</p>}
          {locked && <><p>✓ {stage === 0 ? '2.2 ≤ 2.5，橋可通行，而且不用多花十分鐘。' : stage === 1 ? '2.2 + 0.6 = 2.8，超過橋限重；森林路的 6 噸上限仍足夠。' : '你的組卡回應兼顧了安全與隊長的顧慮。這是引導式組句練習。'}</p>{stage === 2 && <blockquote lang="en">{route === 'forest' ? 'I suggest taking the forest road. ' : ''}Our wagon now exceeds the bridge limit. {alternative === 'call' ? 'We can call the customer and confirm a later arrival time.' : 'We can send a message ahead to explain the delay.'}</blockquote>}</>}
        </div>
        <div className="caravan-actions">{locked ? <button className="btn btn-primary" onMouseDown={keepFocus} onClick={next}>{stage === 2 ? '查看故事結局' : '下一節'}</button> : <button className="btn btn-primary" disabled={!hasAnswer} onMouseDown={keepFocus} onClick={check}>確認安排</button>}{stage > 0 && <button className="btn btn-ghost" onMouseDown={keepFocus} onClick={() => jump(stage - 1)}>回看上一節</button>}</div>
      </>}
    </div>
  </Modal>;
}
