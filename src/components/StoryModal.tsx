import { useMemo, useState } from 'react';
import Modal from './Modal';
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { SPEAKERS, STORIES } from '../game/story';
import { avatarDataUrl } from '../game/art/sprites';
import { sfx } from '../game/sfx';
import { keepFocus } from './keepFocus';

// 劇情對話：一句一句播放，可以跳過。看完後依劇情決定接下來開啟什麼
// （序章 → 新手引導／麥克風；區域開場 → 回到區域地圖）。
export default function StoryModal() {
  const storyId = useUiStore(s => s.storyId);
  const regionIdx = useUiStore(s => s.regionIdx);
  const { closeModal, openModal, openRegion } = useUiStore.getState();
  const character = useSaveStore(s => s.character);
  const markStorySeen = useSaveStore(s => s.markStorySeen);
  const [step, setStep] = useState(0);
  const lines = STORIES[storyId] ?? [];
  const heroPortrait = useMemo(() => (character ? avatarDataUrl(character, 'idle', 3) : ''), [character]);
  const name = character?.name ?? '勇者';
  const fill = (t: string) => t.replaceAll('{name}', name);

  const finish = () => {
    markStorySeen(storyId);
    if (storyId === 'prologue') {
      const { tutorialDone, micAsked } = useSaveStore.getState();
      if (!tutorialDone) return openModal('tutorial');
      if (!micAsked) return openModal('mic');
      return closeModal();
    }
    if (storyId.startsWith('region-')) return openRegion(regionIdx);
    closeModal();
  };

  const next = () => {
    sfx.click();
    if (step + 1 >= lines.length) finish();
    else setStep(step + 1);
  };

  const line = lines[step];
  if (!line) return null;
  const speaker = SPEAKERS[line.speaker];

  return (
    <Modal title="📜 故事" onClose={finish}>
      <div className={`story-line speaker-${line.speaker}`} key={step} onClick={next}>
        <div className="story-portrait" aria-hidden="true">
          {line.speaker === 'hero' && heroPortrait ? <img src={heroPortrait} alt="" /> : <span>{speaker.icon}</span>}
        </div>
        <div className="story-bubble">
          {speaker.name && <b>{fill(speaker.name)}</b>}
          <p>{fill(line.text)}</p>
        </div>
      </div>
      <div className="tutorial-actions">
        <button className="btn btn-ghost btn-small" onMouseDown={keepFocus} onClick={finish}>跳過</button>
        <span className="muted">{step + 1} / {lines.length}</span>
        <button className="btn btn-primary" onMouseDown={keepFocus} onClick={next} autoFocus>{step + 1 >= lines.length ? '繼續' : '下一句 ⏎'}</button>
      </div>
    </Modal>
  );
}
