import { useState } from 'react';
import Modal from './Modal';
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { keepFocus } from './keepFocus';

// 新手引導：第一次進入時自動開啟，可跳過；之後可從地圖上的「❓ 說明」重看。
// 新增系統（商店、英雄…）時，在 STEPS 加一頁即可。

const STEPS = [
  { icon: '👋', title: '歡迎來到單字冒險', body: '這是一款「打怪背多益單字」的遊戲。不用怕犯錯——答錯也是學習的一部分，遊戲會陪你把每個字學會。' },
  { icon: '🗺️', title: '選擇區域', body: '地圖上有 A1～C1 五個區域，對應多益分數。每個區域 50 關，第 10、20…關是守門 Boss，全部通關就會解鎖下一區。' },
  { icon: '📖', title: '戰前預習', body: '每 10 關開始前，會先用卡片預習這一段會出現的單字和文法。趕時間可以跳過，戰鬥中也能隨時按 📖 再看一次。' },
  { icon: '⚔️', title: '四種題型', body: '拼寫／填空：用鍵盤輸入字母（手機會出現螢幕鍵盤）。選擇：點選答案或按 A～D。口說：按 🎤 對麥克風唸出單字。任何時候都能按 🔊 聽發音。' },
  { icon: '🔥', title: '連擊 Combo', body: '連續答對會累積 Combo，每一層攻擊力 +10%，最高 2 倍。答錯時 Combo 歸零，玩家也會受到傷害。' },
  { icon: '💡', title: '答錯沒關係', body: '答錯時會顯示正確答案、中文和例句，看完再試一次。答錯的字會記進錯題本，之後會再出現讓你複習。' },
  { icon: '🧚', title: '援軍', body: '連續答錯 3 次時，援軍會登場：刪掉錯誤選項或提示第一個字母，還會幫你擋下一次傷害。' },
  { icon: '🪙', title: '金幣與道具（下個版本開放）', body: '之後打倒怪獸會獲得金幣，可以升級血量和攻擊力、購買提示道具、解鎖不同能力的英雄。' },
  { icon: '✅', title: '準備出發！', body: '這份說明隨時可以從地圖上方的「❓ 說明」重新打開。祝你冒險愉快！' },
];

export default function TutorialModal() {
  const [step, setStep] = useState(0);
  const setTutorialDone = useSaveStore(s => s.setTutorialDone);
  const closeModal = useUiStore(s => s.closeModal);
  const close = () => { setTutorialDone(true); closeModal(); };
  const isLast = step === STEPS.length - 1;
  const s = STEPS[step];

  return (
    <Modal title="遊戲說明" onClose={close}>
      <div className="tutorial-step" key={step}>
        <div className="tutorial-icon" aria-hidden="true">{s.icon}</div>
        <h3>{s.title}</h3>
        <p>{s.body}</p>
      </div>
      <div className="dots" aria-label={`第 ${step + 1} 頁，共 ${STEPS.length} 頁`}>
        {STEPS.map((_, i) => <span key={i} className={i === step ? 'dot is-active' : 'dot'} />)}
      </div>
      <div className="tutorial-actions">
        {isLast ? <span /> : <button className="btn btn-ghost" onMouseDown={keepFocus} onClick={close}>跳過</button>}
        <div className="tutorial-nav">
          {step > 0 && <button className="btn" onMouseDown={keepFocus} onClick={() => setStep(step - 1)}>上一步</button>}
          {isLast
            ? <button className="btn btn-primary" onMouseDown={keepFocus} onClick={close}>開始冒險</button>
            : <button className="btn btn-primary" onMouseDown={keepFocus} onClick={() => setStep(step + 1)}>下一步</button>}
        </div>
      </div>
    </Modal>
  );
}
