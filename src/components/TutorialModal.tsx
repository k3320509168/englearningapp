import { useState } from 'react';
import Modal from './Modal';
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { keepFocus } from './keepFocus';

// 遊戲說明：從地圖的「更多 → 說明」打開。新玩家不會被強制看，操作改在戰鬥中用情境提示教。
// 新增系統時，在 STEPS 加一頁即可。

const STEPS = [
  { icon: '👋', title: '歡迎來到單字冒險', body: '這是一款「打怪學英文」的遊戲。不用怕犯錯——答錯也是學習的一部分，遊戲會陪你把每個字學會。' },
  { icon: '▶', title: '繼續征途', body: '地圖下方的「繼續征途」會帶你回到目前的進度。也可以點區域，選擇其中的任一張地圖重打、拿星星。' },
  { icon: '⚔️', title: '答對就攻擊', body: '選擇題點答案或按 A～D；拼寫題用鍵盤輸入；口說題按 🎤 唸出單字。答對時隊員輪流衝上去攻擊，答錯時怪物會反擊。' },
  { icon: '🔥', title: 'Combo 與計時', body: '連續答對累積 Combo，傷害越來越高。每題 20 秒內答對才能延續 Combo，5 秒內答對還有快答加成。' },
  { icon: '😈', title: '魔王題與錯題複習', body: '每 5 題會出一次魔王題，答對倍率大增。答錯的字會記進錯題本，之後以魔王題或復仇魔王的形式回來，間隔越拉越長，幫你長期記住。' },
  { icon: '🔮', title: '英雄與成長', body: '用召喚券召喚英雄組成 4 人隊伍；主角升級後可以轉職、鍛造裝備。有紅點的按鈕代表有事可以做。' },
  { icon: '📅', title: '每天一點點', body: '每日任務每天換新，完成可以領金幣和召喚券；連續登入還有額外獎勵。每天 5 分鐘，就能穩穩進步。' },
];

export default function TutorialModal() {
  const [step, setStep] = useState(0);
  const setTutorialDone = useSaveStore(s => s.setTutorialDone);
  const closeModal = useUiStore(s => s.closeModal);
  const close = () => {
    setTutorialDone(true);
    closeModal();
  };
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
            ? <button className="btn btn-primary" onMouseDown={keepFocus} onClick={close}>知道了</button>
            : <button className="btn btn-primary" onMouseDown={keepFocus} onClick={() => setStep(step + 1)}>下一步</button>}
        </div>
      </div>
    </Modal>
  );
}
