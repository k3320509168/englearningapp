import { useEffect, useState } from 'react';
import { isBankLoaded } from '../game/QuestionData';
import { loadBank } from '../game/questions/bank/loader';

// 等區域題庫及詞庫載完才開題。離線時沿用題庫內建備援。
export function useRegionBankReady(regionIdx: number): boolean {
  const [readyRegion, setReadyRegion] = useState<number | null>(null);
  useEffect(() => {
    let active = true;
    void loadBank(regionIdx).then(() => {
      if (active) setReadyRegion(regionIdx);
    });
    return () => { active = false; };
  }, [regionIdx]);
  return readyRegion === regionIdx || isBankLoaded(regionIdx);
}
