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
  // 確定暫時無法使用麥克風時，僅將眼前題目切換為拼寫，絕不永久改寫全域設定
  const fallbackToSpelling = () => {
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

  const isHttps = typeof window !== 'undefined' && window.isSecureContext;

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
            <h3>麥克風暫未開啟</h3>
            <p>沒關係！當前題目已為您切換為拼寫作答，一樣可以練到這個單字。之後想開啟時，可點瀏覽器網址列左邊的圖示將「麥克風」設為允許即可！</p>
          </>
        ) : (
          <>
            <h3>麥克風暫時無法啟用</h3>
            <p style={{ lineHeight: 1.6, fontSize: 13.5 }}>
              {!isHttps
                ? '提示：您的 Chrome 瀏覽器支援完整語音辨識！因目前為局域網 (HTTP) 開發測試，瀏覽器安全規範限制了麥克風；遊戲正式上架 (HTTPS) 後將完全支援語音！目前這道題目已切換為拼寫作答，完全不影響冒險！'
                : '設備或瀏覽器目前無法讀取麥克風。已先為您切換為拼寫作答，所有關卡進度完全正常推進！'}
            </p>
          </>
        )}
      </div>
      <div className="tutorial-actions">
        {status === 'idle' || status === 'asking' ? (
          <>
            <button className="btn btn-ghost" onMouseDown={keepFocus} onClick={() => { fallbackToSpelling(); close(); }}>本題改用拼寫</button>
            <button className="btn btn-primary" onMouseDown={keepFocus} onClick={ask} disabled={status === 'asking'}>
              {status === 'asking' ? '請在瀏覽器視窗中選擇…' : '🎤 允許麥克風'}
            </button>
          </>
        ) : (
          <>
            <span />
            <button className="btn btn-primary" onMouseDown={keepFocus} onClick={close}>繼續冒險</button>
          </>
        )}
      </div>
    </Modal>
  );
}
