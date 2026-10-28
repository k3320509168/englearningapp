import { useState } from 'react';
import Modal from './Modal';
import QuizRunner from './QuizRunner';
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { REGIONS } from '../game/regions';
import { GATE_LEVEL, GATE_PASS, GATE_QUESTIONS, canChallengeGate, gateQuestions } from '../game/placement';
import type { Question } from '../game/types';
import { keepFocus } from './keepFocus';

// 守門試煉：證明自己的英文能力，直接通關目前的區域（不送等級、星星；之後可以回來拿星星）
export default function GateTrialModal() {
  const regionIdx = useUiStore(s => s.regionIdx);
  const { closeModal, openRegion, celebrate } = useUiStore.getState();
  const level = useSaveStore(s => s.player.level);
  const skipRegions = useSaveStore(s => s.skipRegions);
  const region = REGIONS[regionIdx];
  const next = REGIONS[regionIdx + 1];
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState({ answered: 0, correct: 0 });
  const allowed = canChallengeGate(regionIdx, level);
  const done = questions !== null && score.answered >= questions.length;
  const passed = done && score.correct >= GATE_PASS;

  const start = () => {
    setQuestions(gateQuestions(regionIdx));
    setScore({ answered: 0, correct: 0 });
    setRound(r => r + 1);
  };

  const onAnswer = (correct: boolean) => {
    const s = { answered: score.answered + 1, correct: score.correct + (correct ? 1 : 0) };
    setScore(s);
    if (questions && s.answered >= questions.length && s.correct >= GATE_PASS) {
      skipRegions(regionIdx + 1);
      celebrate({ icon: '🏰', title: `守門試煉通過！`, sub: `「${region.name}」通關，${next ? `「${next.name}」已解鎖` : ''}`, color: '#ffcd4b' });
    }
  };

  return (
    <Modal title={`🏰 守門試煉：${region?.name ?? ''}`} onClose={closeModal}>
      {!allowed ? (
        <p>主角達到 <b>Lv {GATE_LEVEL[regionIdx]}</b> 才能挑戰這個區域的守門試煉（目前 Lv {level}）。繼續冒險升級吧！</p>
      ) : questions === null ? (
        <>
          <p>覺得這個區域太簡單？通過守門試煉就能直接通關，前往「{next?.name}」。</p>
          <ul className="muted gate-rules">
            <li>{GATE_QUESTIONS} 題這個區域的題目，答對 {GATE_PASS} 題以上就通過。</li>
            <li>沒有計時、不會受傷；沒通過也沒有損失，可以再挑戰。</li>
            <li>跳過的區域不會得到經驗值與星星，之後隨時可以回來打、拿星星和召喚券。</li>
          </ul>
          <div className="tutorial-actions">
            <button className="btn btn-ghost" onMouseDown={keepFocus} onClick={closeModal}>先不要</button>
            <button className="btn btn-primary" onMouseDown={keepFocus} onClick={start}>開始試煉</button>
          </div>
        </>
      ) : !done ? (
        <QuizRunner key={round} questions={questions} label={i => `第 ${i + 1} / ${questions.length} 題・答對 ${score.correct}`} onAnswer={onAnswer} />
      ) : (
        <>
          <p className="result-title">{passed ? '🏰 試煉通過！' : '試煉未通過'}</p>
          <p>答對 <b>{score.correct}</b> / {questions.length} 題{passed ? `。「${region.name}」已通關，「${next?.name}」解鎖了！` : `，需要 ${GATE_PASS} 題。答錯的字已記進錯題本，複習後再來挑戰吧！`}</p>
          <div className="tutorial-actions">
            {passed ? (
              <>
                <button className="btn btn-ghost" onMouseDown={keepFocus} onClick={closeModal}>關閉</button>
                <button className="btn btn-primary" onMouseDown={keepFocus} onClick={() => openRegion(regionIdx + 1)}>前往「{next?.name}」</button>
              </>
            ) : (
              <>
                <button className="btn btn-ghost" onMouseDown={keepFocus} onClick={closeModal}>關閉</button>
                <button className="btn btn-primary" onMouseDown={keepFocus} onClick={start}>再挑戰一次</button>
              </>
            )}
          </div>
        </>
      )}
    </Modal>
  );
}
