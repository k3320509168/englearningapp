import { useEffect } from 'react';
import { useSaveStore } from '../store/saveStore';

// 分頁可能在背景跨過午夜；回到前景時不能只等下一次計時器。
export function useDailyRefresh() {
  useEffect(() => {
    const refresh = () => useSaveStore.getState().ensureDaily();
    const interval = window.setInterval(refresh, 60_000);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);
}
