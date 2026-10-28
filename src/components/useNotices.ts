import { useShallow } from 'zustand/react/shallow';
import { useSaveStore } from '../store/saveStore';
import { computeNotices } from '../game/notices';

// 地圖上各入口的紅點提醒；回傳的都是基本型別，用 shallow 比較避免多餘的重繪
export const useNotices = () => useSaveStore(useShallow(s => computeNotices(s)));
