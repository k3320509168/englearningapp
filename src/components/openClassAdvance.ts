import { classAdvanceOffer } from '../game/growth';
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';

export function openClassAdvance() {
  const s = useSaveStore.getState();
  const offer = classAdvanceOffer(s.character?.classId, s.player, s.classPaths, s.homeClass, s.classBadges);
  if (!offer) return;
  if (s.character?.classId !== offer.targetClass) s.switchClass(offer.targetClass);
  useUiStore.getState().openGrowth('hero');
}
