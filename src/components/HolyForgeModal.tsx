import { useState } from 'react';
import Modal from './Modal';
import QuizRunner from './QuizRunner';
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { LEVELS, getPool } from '../game/QuestionData';
import { shuffleArray } from '../game/battle';
import { HOLY_FORGE_QUESTIONS, displayName, enhanceCost, equipDef } from '../game/equipment';
import type { Question } from '../game/types';
import { sfx } from '../game/sfx';
import { keepFocus } from './keepFocus';

// 神聖鍛造：從目前區域的頭目題出 3 題，全部答對強化就一定成功，還會得到神聖加護（效果 +10%）。
// 沒全對不扣任何材料，可以再挑戰（反正是在練英文）。
export default function HolyForgeModal() {
  const { closeModal, openGrowth } = useUiStore.getState();
  const uid = useUiStore(s => s.forgeUid);
  const { equipment, unlockedIndex, character, enhance } = useSaveStore();
  const item = equipment.find(e => e.uid === uid);
  const def = item ? equipDef(item.defId) : undefined;
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [score, setScore] = useState({ answered: 0, correct: 0 });
  const [result, setResult] = useState<'ok' | 'miss' | null>(null);

  const start = () => {
    const pool = getPool(LEVELS[Math.min(unlockedIndex, LEVELS.length - 1)]);
    setQuestions(shuffleArray(pool.boss.length >= HOLY_FORGE_QUESTIONS ? pool.boss : [...pool.boss, ...pool.normal]).slice(0, HOLY_FORGE_QUESTIONS));
    setScore({ answered: 0, correct: 0 });
    setResult(null);
  };

  const onAnswer = (correct: boolean) => {
    const s = { answered: score.answered + 1, correct: score.correct + (correct ? 1 : 0) };
    setScore(s);
    if (!questions || !item || s.answered < questions.length) return;
    if (s.correct === questions.length && enhance(item.uid, true) === 'ok') {
      sfx.victory();
      setResult('ok');
      useUiStore.getState().celebrate({ icon: '✨', title: '神聖鍛造成功！', sub: `${def && character ? displayName(def, character.classId) : ''} +${item.plus + 1}，得到神聖加護`, color: '#ffcd4b' });
    } else setResult('miss');
  };

  const back = () => { closeModal(); openGrowth('gear'); };

  if (!item || !def || !character) return <Modal title="✨ 神聖鍛造" onClose={closeModal}><p>找不到這件裝備。</p></Modal>;
  const cost = enhanceCost(item);
  return (
    <Modal title="✨ 神聖鍛造" onClose={back}>
      {!questions && (
        <>
          <p>答對 {HOLY_FORGE_QUESTIONS} 題英文（目前區域的頭目題），「{displayName(def, character.classId)} +{item.plus}」強化就一定成功，
            而且得到神聖加護（效果 +10%）。</p>
          <p className="muted">成功時才扣 🪙{cost.gold}、🪨{cost.ore}；沒有全對不扣任何東西，可以再挑戰。</p>
          <button className="btn btn-primary" onMouseDown={keepFocus} onClick={start}>開始挑戰</button>
        </>
      )}
      {questions && result === null && (
        <QuizRunner questions={questions} label={i => `第 ${i + 1} / ${questions.length} 題`} onAnswer={onAnswer} />
      )}
      {result === 'ok' && <><p>✨ 成功！裝備強化到 +{item.plus}，並得到神聖加護。</p><button className="btn btn-primary" onMouseDown={keepFocus} onClick={back}>回到裝備</button></>}
      {result === 'miss' && (
        <>
          <p>答對 {score.correct} / {questions?.length} 題，差一點！這次沒有消耗任何材料。</p>
          <button className="btn btn-primary" onMouseDown={keepFocus} onClick={start}>再挑戰一次</button>{' '}
          <button className="btn" onMouseDown={keepFocus} onClick={back}>回到裝備</button>
        </>
      )}
    </Modal>
  );
}
