import { useState } from 'react';
import Modal from './Modal';
import QuizRunner from './QuizRunner';
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { TOWER_FLOORS, TOWER_PASS, TOWER_QUESTIONS, dayIndex, featuredHero, towerQuestions, towerRegion, towerReward } from '../game/modes';
import { REGIONS } from '../game/regions';
import { heroDef, heroWord } from '../game/heroes';
import { heroDataUrl } from '../game/art/sprites';
import type { Question } from '../game/types';
import { keepFocus } from './keepFocus';

// 英雄時空之塔：每層 5 題、答對 4 題通過，越往上題目越難（每 3 層換下一個 CEFR 區域）。
// 第一次通過每層，送「今日主角英雄」的碎片（沒有英雄時送願望碎片）與金幣。
export default function TowerModal() {
  const closeModal = useUiStore(s => s.closeModal);
  const { towerFloor, heroes, clearTowerFloor } = useSaveStore();
  const hero = featuredHero(heroes, dayIndex());
  const floor = Math.min(TOWER_FLOORS, towerFloor + 1);
  const finished = towerFloor >= TOWER_FLOORS;
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [score, setScore] = useState({ answered: 0, correct: 0 });
  const [result, setResult] = useState<'pass' | 'fail' | null>(null);
  const reward = towerReward(floor);

  const start = () => {
    setQuestions(towerQuestions(floor));
    setScore({ answered: 0, correct: 0 });
    setResult(null);
  };

  const onAnswer = (correct: boolean) => {
    const s = { answered: score.answered + 1, correct: score.correct + (correct ? 1 : 0) };
    setScore(s);
    if (!questions || s.answered < questions.length) return;
    if (s.correct >= TOWER_PASS && clearTowerFloor(floor, hero)) {
      setResult('pass');
      useUiStore.getState().celebrate({
        icon: '🗼', title: `第 ${floor} 層通過！`,
        sub: `${hero ? `${heroWord(heroDef(hero))} 碎片` : '願望碎片'} +${reward.shards}、🪙 ${reward.gold}`,
        img: hero ? heroDataUrl(hero, 4) : undefined, color: '#c9a8ff',
      });
    } else setResult(s.correct >= TOWER_PASS ? 'pass' : 'fail');
  };

  return (
    <Modal title="🗼 英雄時空之塔" onClose={closeModal}>
      {!questions && (
        <>
          <p>每層 {TOWER_QUESTIONS} 題，答對 {TOWER_PASS} 題就能往上爬，題目越往上越難。第一次通過每一層，送今日主角英雄的碎片（每 5 層三倍）與金幣，卡關時來衝碎片升星最快！</p>
          <p>今日主角英雄：<b>{hero ? heroWord(heroDef(hero)) : '（還沒有英雄，改送願望碎片）'}</b></p>
          {finished ? <p>🎉 已經登上第 {TOWER_FLOORS} 層頂端！</p> : (
            <>
              <p className="muted">下一層：第 {floor} 層（{REGIONS[towerRegion(floor)].name}的題目）・獎勵碎片 {reward.shards}、🪙 {reward.gold}</p>
              <button className="btn btn-primary" onMouseDown={keepFocus} onClick={start}>挑戰第 {floor} 層</button>
            </>
          )}
        </>
      )}
      {questions && result === null && (
        <QuizRunner questions={questions} label={i => `第 ${floor} 層・第 ${i + 1} / ${questions.length} 題`} onAnswer={onAnswer} />
      )}
      {result && (
        <>
          <p>{result === 'pass' ? `✔ 答對 ${score.correct} 題，通過第 ${floor} 層！` : `答對 ${score.correct} 題，還差一點（要 ${TOWER_PASS} 題）。`}</p>
          <button className="btn btn-primary" onMouseDown={keepFocus} onClick={() => { setQuestions(null); setResult(null); }}>{result === 'pass' ? '繼續往上' : '再挑戰一次'}</button>
        </>
      )}
    </Modal>
  );
}
