import { useState } from 'react';
import Modal from './Modal';
import QuizRunner from './QuizRunner';
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { TOWER_PASS, TOWER_QUESTIONS, dayIndex, featuredHero, isEndlessFloor, towerQuestions, towerRegion, towerReward } from '../game/modes';
import { REGIONS } from '../game/regions';
import { heroDef, heroWord } from '../game/heroes';
import { heroDataUrl } from '../game/art/sprites';
import type { Question } from '../game/types';
import { sfx } from '../game/sfx';
import { keepFocus } from './keepFocus';

// 英雄時空之塔與無盡之塔：每層 5 題、答對 4 題通過。
// 30 層後開啟無盡之塔挑戰，每 5 層送 🎫 召喚券！
export default function TowerModal() {
  const closeModal = useUiStore(s => s.closeModal);
  const { towerFloor, heroes, clearTowerFloor } = useSaveStore();
  const hero = featuredHero(heroes, dayIndex());
  const floor = towerFloor + 1;
  const isEndless = isEndlessFloor(floor);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [score, setScore] = useState({ answered: 0, correct: 0 });
  const [attemptFloor, setAttemptFloor] = useState(floor);
  const [result, setResult] = useState<'pass' | 'fail' | null>(null);
  const reward = towerReward(floor);

  const start = () => {
    setAttemptFloor(floor);
    setQuestions(towerQuestions(floor));
    setScore({ answered: 0, correct: 0 });
    setResult(null);
  };

  const onAnswer = (correct: boolean) => {
    const s = { answered: score.answered + 1, correct: score.correct + (correct ? 1 : 0) };
    setScore(s);
    if (!questions || s.answered < questions.length) return;
    const paid = s.correct >= TOWER_PASS ? clearTowerFloor(floor, hero) : null;
    if (paid) {
      sfx.victory();
      setResult('pass');
      useUiStore.getState().celebrate({
        icon: isEndless ? '🌌' : '🗼',
        title: `${isEndless ? '無盡之塔 ' : ''}第 ${floor} 層通過！`,
        sub: `${hero ? `${heroWord(heroDef(hero))} 碎片` : '願望碎片'} +${reward.shards}、🪙 ${paid.gold}${paid.tickets ? `、🎫 召喚券 +${paid.tickets}` : ''}、EXP ${paid.xp}${paid.bonus > 0 ? `（追趕祝福 +25%，多得${paid.bonus}）` : ''}${paid.allowanceGold > 0 ? `（含修練津貼${paid.allowanceGold}）` : ''}`,
        img: hero ? heroDataUrl(hero, 4) : undefined, color: '#c9a8ff',
      });
    } else {
      if (s.correct >= TOWER_PASS) sfx.victory(); else sfx.wrong();
      setResult(s.correct >= TOWER_PASS ? 'pass' : 'fail');
    }
  };

  return (
    <Modal title={isEndless ? '🌌 無盡時空之塔' : '🗼 英雄時空之塔'} onClose={closeModal}>
      {!questions && (
        <>
          <p>
            {isEndless
              ? '🎉 恭喜已登上時空之塔頂端！現在進入「無盡之塔」挑戰模式，層數無上限攀爬，考驗全面英語實力！每 5 層頭目戰必定獲得 🎫 召喚券！'
              : `每層 ${TOWER_QUESTIONS} 題，答對 ${TOWER_PASS} 題就能往上爬，題目越往上越難。第一次通過每一層，送今日主角英雄的碎片（每 5 層三倍）與金幣，卡關時來衝碎片升星最快！`}
          </p>
          <p>今日主角英雄：<b>{hero ? heroWord(heroDef(hero)) : '（還沒有英雄，改送願望碎片）'}</b></p>
          <p className="muted">
            下一層：{isEndless ? '無盡 ' : ''}第 {floor} 層（{REGIONS[towerRegion(floor)].name}題庫）
            ・獎勵碎片 {reward.shards}、🪙 {reward.gold}
            {reward.tickets ? '、🎫 召喚券 ×1' : ''}
            、基礎EXP {reward.xp}（依追趕進度結算）
          </p>
          <button className="btn btn-primary" onMouseDown={keepFocus} onClick={start}>
            挑戰{isEndless ? '無盡' : ''}第 {floor} 層
          </button>
        </>
      )}
      {questions && result === null && (
        <QuizRunner questions={questions} label={i => `${isEndless ? '無盡 ' : ''}第 ${attemptFloor} 層・第 ${i + 1} / ${questions.length} 題`} onAnswer={onAnswer} />
      )}
      {result && (
        <>
          <p>{result === 'pass' ? `✔ 答對 ${score.correct} 題，通過${isEndless ? '無盡 ' : ''}第 ${attemptFloor} 層！` : `答對 ${score.correct} 題，還差一點（要 ${TOWER_PASS} 題）。`}</p>
          <button className="btn btn-primary" onMouseDown={keepFocus} onClick={() => { setQuestions(null); setResult(null); }}>{result === 'pass' ? '繼續往上' : '再挑戰一次'}</button>
        </>
      )}
    </Modal>
  );
}
