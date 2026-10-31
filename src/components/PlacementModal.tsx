import { useState } from 'react';
import Modal from './Modal';
import QuizRunner from './QuizRunner';
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { PROLOGUE, REGIONS } from '../game/regions';
import { isSpeechRecognitionSupported } from '../game/speech';
import {
  CONFIRM_SIZE, MAX_PROBE_QUESTIONS, PLACEMENT_LEVELS, TIME_LIMIT_MS, answerPlacement, answeredCount, currentQuestion,
  maxTestable, retestWaitMs, skipSpeaking, startPlacement,
} from '../game/placementTest';
import type { PlacementState } from '../game/placementTest';
import { beginLevel, continueJourney } from '../game/startLevel';
import { keepFocus } from './keepFocus';

// 自評的起點（之後自動升降）
const STARTS = [
  { level: 1, label: '幾乎不會' },
  { level: 3, label: '會一點' },
  { level: 4, label: '還可以' },
  { level: 6, label: '不錯' },
];

// 程度測驗 v1.6：自適應聽讀探測＋口說寫作確認（docs/STAGE_PLAN.md 第 17 節）。
// 測驗中不顯示對錯；結果決定從失語邊境或哪個區域出發。跳級的玩家先用臨時戰力試玩，通過區域試煉才正式補等級
export default function PlacementModal() {
  const closeModal = useUiStore(s => s.closeModal);
  const lastAt = useSaveStore(s => s.placement?.at);
  const voice = useSaveStore(s => isSpeechRecognitionSupported() && !s.settings.voiceAsSpelling);
  const [start, setStart] = useState(Math.min(4, maxTestable()));
  const [test, setTest] = useState<PlacementState | null>(null);
  const wait = retestWaitMs(lastAt);
  const top = maxTestable();

  const begin = () => setTest(startPlacement(start, { voice }));
  const onAnswer = (correct: boolean, viaSpelling?: boolean) => {
    if (!test) return;
    const q = currentQuestion(test);
    setTest(q?.type === 'voice' && viaSpelling ? skipSpeaking(test) : answerPlacement(test, correct));
  };

  // 出發：Pre-A1 去失語邊境；其他從推薦區域開始（前面的區域不算通關、不補獎勵，之後可以回去打）
  const go = (level: number) => {
    const save = useSaveStore.getState();
    closeModal();
    if (level <= 0) return beginLevel(PROLOGUE.id, 0);
    const region = Math.min(level - 1, REGIONS.length - 2);
    save.finishPrologue();
    if (test?.result !== null && test) {
      save.setPlacement({
        level, region, at: Date.now(), speakingVerified: test.speakingVerified, confidence: test.confidence, weak: test.weak, verified: region === 0,
      });
    }
    if (region > 0) save.skipRegions(region);
    continueJourney();
  };

  const q = test ? currentQuestion(test) : null;
  const result = test?.phase === 'done' ? test.result ?? 0 : null;
  const regionOf = (level: number) => (level <= 0 ? PROLOGUE.name : REGIONS[Math.min(level - 1, REGIONS.length - 2)].name);

  return (
    <Modal title="🧭 程度測驗" onClose={closeModal}>
      {result !== null && test ? (
        <>
          <p className="result-title">你的程度：{PLACEMENT_LEVELS[result]}</p>
          <p>{result === 0
            ? '先到「失語邊境」熟悉操作、建立基本單字，十個小關卡就能前往翠綠草原。'
            : `建議從「${regionOf(result)}」開始。${result > 1 ? '前面的區域不會算通關，之後隨時可以回去打、拿星星和召喚券。' : ''}`}</p>
          {result > 1 && <p className="muted">在這一區戰鬥時，隊伍會以這一區的最低推薦等級計算（臨時戰力）；打倒區域魔王、通過區域試煉後，主角正式升到這個等級。</p>}
          {test.weak.length > 0 && <p className="muted">需要加強：{test.weak.map(w => (w === 'speaking' ? '口說' : '寫作')).join('、')}（落點已降一級）</p>}
          {!test.speakingVerified && <p className="muted">這次沒有考口說（口說未驗證），之後在關卡裡練習就好。</p>}
          {test.confidence === 'low' && <p className="muted">這次的資料不太夠，先推薦保守一點的區域；想挑戰的話也可以往上一級。</p>}
          <div className="tutorial-actions">
            {result > 0 && <button className="btn btn-ghost" onMouseDown={keepFocus} onClick={() => go(0)}>先去「{PROLOGUE.name}」</button>}
            {test.confidence === 'low' && result + 1 <= top && <button className="btn btn-ghost" onMouseDown={keepFocus} onClick={() => go(result + 1)}>挑戰「{regionOf(result + 1)}」</button>}
            <button className="btn btn-primary" onMouseDown={keepFocus} onClick={() => go(result)}>從「{regionOf(result)}」出發</button>
          </div>
        </>
      ) : test && q ? (
        <QuizRunner key={`${answeredCount(test)}-${test.queue.length}`} questions={[q]} blind lastLabel="下一題"
          label={() => `${test.phase === 'probe' ? '聽讀' : q.type === 'voice' ? '口說確認' : '寫作確認'}・第 ${answeredCount(test) + 1} 題`}
          onAnswer={onAnswer} />
      ) : (
        <>
          <p>英文已經有基礎的話，做個測驗就能直接從適合的區域開始；英文很弱的話，從「{PROLOGUE.name}」開始最輕鬆。</p>
          <ul className="muted gate-rules">
            <li>聽力、閱讀會依你的作答自動變難或變簡單，最後再考口說、寫作各 {CONFIRM_SIZE} 題。通常 {Math.round(MAX_PROBE_QUESTIONS * 0.8)}～{MAX_PROBE_QUESTIONS + CONFIRM_SIZE * 2} 題、{Math.round(TIME_LIMIT_MS / 60_000)} 分鐘內。</li>
            <li>測驗中不顯示對錯、沒有計時、不會受傷。亂猜很難跳級，照實作答最準。</li>
            <li>麥克風不方便可以改拼寫，口說會記成「未驗證」，不扣分。</li>
            {top < PLACEMENT_LEVELS.length - 1 && <li>目前題庫最高測到 {PLACEMENT_LEVELS[top]}，更高的等級之後開放。</li>}
          </ul>
          <p>你覺得自己的英文：</p>
          <div className="pill-row">
            {STARTS.filter(s => s.level <= top).map(s => (
              <button key={s.level} className={`pill ${start === s.level ? 'is-on' : ''}`} onMouseDown={keepFocus} onClick={() => setStart(s.level)}>{s.label}</button>
            ))}
          </div>
          {wait > 0 && <p className="muted">完整測驗每 7 天可以免費重測一次，還要 {Math.ceil(wait / 86_400_000)} 天。</p>}
          <div className="tutorial-actions">
            <button className="btn btn-ghost" onMouseDown={keepFocus} onClick={() => go(0)}>我是新手，從頭開始</button>
            <button className="btn btn-primary" onMouseDown={keepFocus} onClick={begin} disabled={wait > 0}>開始測驗</button>
          </div>
        </>
      )}
    </Modal>
  );
}
