import { useState } from 'react';
import Modal from './Modal';
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { useBattleStore } from '../store/battleStore';
import { keepFocus } from './keepFocus';

// 第一次遇到口說題時（戰鬥暫停），先說明為什麼需要麥克風，再由玩家按鈕觸發瀏覽器的權限視窗，
// 避免瀏覽器突然跳出權限要求。
type Status = 'idle' | 'asking' | 'granted' | 'denied' | 'unsupported';

export default function MicPermissionModal() {
  const setMicAsked = useSaveStore(s => s.setMicAsked);
  const closeModal = useUiStore(s => s.closeModal);
  // 依製作人指令：不預設切換拼寫，初始狀態一律為 idle，讓玩家可主動嘗試開啟麥克風；只有確定不能開啟時才切換
  const [status, setStatus] = useState<Status>('idle');

  const close = () => { setMicAsked(); closeModal(); };
  // 確定沒有麥克風可用時才轉拼寫
  const fallbackToSpelling = () => {
    useSaveStore.getState().updateSettings({ voiceAsSpelling: true });
    useBattleStore.getState().switchToSpelling();
  };

  const ask = async () => {
    setStatus('asking');
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('mediaDevices unavailable');
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // 只是為了取得權限，立刻關掉麥克風
      stream.getTracks().forEach(t => t.stop());
      setStatus('granted');
    } catch {
      setStatus('denied');
      fallbackToSpelling();
    }
  };


  return (
    <Modal title="🎤 開啟麥克風" onClose={close}>
      <div className="tutorial-step">
        <div className="tutorial-icon" aria-hidden="true">🎤</div>
        {status === 'idle' || status === 'asking' ? (
          <>
            <h3>口說題需要用到麥克風</h3>
            <p>遊戲裡的「口說題」和口說大絕招，需要你對著麥克風唸出英文。按下面的按鈕後，瀏覽器會跳出視窗詢問，請選「允許」。</p>
            <p className="muted mic-note">聲音只用來辨識你唸的英文；Chrome 會把語音送到 Google 伺服器辨識，遊戲本身不會錄音或保存。</p>
          </>
        ) : status === 'granted' ? (
          <>
            <h3>✅ 麥克風已開啟</h3>
            <p>準備好了！遇到口說題時按下 🎤 就能開始說。</p>
          </>
        ) : status === 'denied' ? (
          <>
            <h3>麥克風沒有開啟</h3>
            <p>沒關係！口說題已經自動改成拼寫題，一樣可以練到這些字。之後想開啟時，點瀏覽器網址列左邊的 🔒 圖示把「麥克風」改成允許，再到設定取消「口說題改成拼寫題」。</p>
          </>
        ) : (
          <>
            <h3>麥克風暫時無法啟用</h3>
            <p style={{ lineHeight: 1.6, fontSize: 13.5 }}>
              設備或瀏覽器目前無法讀取麥克風（在正式發布的 HTTPS 網站將支援正常語音辨識）。<br />
              已先為您切換為拼寫作答，所有題目與關卡進度完全正常推進！之後若想開啟，可隨時在「⚙️ 設定」中切換。
            </p>
          </>
        )}
      </div>
      <div className="tutorial-actions">
        {status === 'idle' || status === 'asking' ? (
          <>
            <button className="btn btn-ghost" onMouseDown={keepFocus} onClick={() => { fallbackToSpelling(); close(); }}>先改用拼寫</button>
            <button className="btn btn-primary" onMouseDown={keepFocus} onClick={ask} disabled={status === 'asking'}>
              {status === 'asking' ? '請在瀏覽器視窗中選擇…' : '🎤 允許麥克風'}
            </button>
          </>
        ) : (
          <>
            <span />
            <button className="btn btn-primary" onMouseDown={keepFocus} onClick={close}>繼續</button>
          </>
        )}
      </div>
    </Modal>
  );
}
