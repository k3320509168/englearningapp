import { useState } from 'react';
import Modal from './Modal';
import QuizRunner from './QuizRunner';
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { REGIONS } from '../game/regions';
import { PLACEMENT_PASS, PLACEMENT_PER_LEVEL, SKIPPABLE_REGIONS, placementQuestions } from '../game/placement';
import type { Question } from '../game/types';
import { continueJourney } from '../game/startLevel';
import { keepFocus } from './keepFocus';

// 程度測驗：新玩家看完序章時可以選擇。從第一區開始每區 3 題，答對 2 題就往下一區，
// 最後建議從哪個區域開始（不送等級）。也可以直接從頭冒險。
export default function PlacementModal() {
  const closeModal = useUiStore(s => s.closeModal);
  const skipRegions = useSaveStore(s => s.skipRegions);
  const [level, setLevel] = useState<number | null>(null);  // 正在測的區域；null = 還沒開始
  const [questions, setQuestions] = useState<Question[]>([]);
  const [score, setScore] = useState({ answered: 0, correct: 0 });
  const [result, setResult] = useState<number | null>(null); // 建議的起點區域

  const testLevel = (idx: number) => {
    setLevel(idx);
    setQuestions(placementQuestions(idx));
    setScore({ answered: 0, correct: 0 });
  };

  const onAnswer = (correct: boolean) => {
    const s = { answered: score.answered + 1, correct: score.correct + (correct ? 1 : 0) };
    setScore(s);
    if (s.answered < PLACEMENT_PER_LEVEL || level === null) return;
    const passed = s.correct >= PLACEMENT_PASS;
    if (passed && level + 1 < SKIPPABLE_REGIONS) testLevel(level + 1);
    else setResult(passed ? level + 1 : level);
  };

  const finish = (start: number) => {
    if (start > 0) skipRegions(start);
    closeModal();
    continueJourney();
  };

  return (
    <Modal title="🧭 程度測驗" onClose={closeModal}>
      {result !== null ? (
        <>
          <p className="result-title">建議從「{REGIONS[result].name}」開始</p>
          <p>{result === 0
            ? '從第一個區域開始，打好基礎、一路升級！'
            : `你的英文已經超過前 ${result} 個區域的程度。直接從「${REGIONS[result].name}」出發吧！跳過的區域之後隨時可以回去打、拿星星和召喚券。`}</p>
          {result > 0 && <p className="muted">注意：不會增加等級，前期怪物比較耐打；你答對時隊伍才會攻擊、答錯時怪物才會反擊，所以英文好就不容易輸。</p>}
          <div className="tutorial-actions">
            {result > 0 && <button className="btn btn-ghost" onMouseDown={keepFocus} onClick={() => finish(0)}>還是從頭開始</button>}
            <button className="btn btn-primary" onMouseDown={keepFocus} onClick={() => finish(result)}>從「{REGIONS[result].name}」出發</button>
          </div>
        </>
      ) : level === null ? (
        <>
          <p>有英文基礎的話，可以先做個小測驗，直接從適合你的區域開始；也可以從頭慢慢冒險。</p>
          <ul className="muted gate-rules">
            <li>每個區域 3 題，答對 2 題就往下一區，最多 15 題、約 3 分鐘。</li>
            <li>沒有計時、不會受傷；之後也可以在區域地圖用「守門試煉」繼續跳級。</li>
          </ul>
          <div className="tutorial-actions">
            <button className="btn btn-ghost" onMouseDown={keepFocus} onClick={() => finish(0)}>從頭開始冒險</button>
            <button className="btn btn-primary" onMouseDown={keepFocus} onClick={() => testLevel(0)}>做程度測驗</button>
          </div>
        </>
      ) : (
        <QuizRunner key={level} questions={questions}
          label={i => `${REGIONS[level].name}・第 ${i + 1} / ${questions.length} 題`} onAnswer={onAnswer} />
      )}
    </Modal>
  );
}
