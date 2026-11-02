import { useEffect, useMemo, useState } from 'react';
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { PROLOGUE_CLEAR_STORY, SPEAKERS, STORIES } from '../game/story';
import { getStoryChoice } from '../game/storyChoices';
import { avatarDataUrl } from '../game/art/sprites';
import { sfx } from '../game/sfx';
import { keepFocus } from './keepFocus';

// 打字機速度與標點停頓（第十六輪 v1.6：每秒 28 字、標點多停 150ms）
export const TYPE_CPS = 28;
export const PUNCT_PAUSE_MS = 150;
const PUNCT = /[，。！？、…；：,.!?]/;
const reduceMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// 劇情對話：畫面底部的像素對話框，一句一句打字播放。點對話框：還在打字就整句顯示，再點下一句；
// 空白鍵／Enter 也可以。右上角略過整段（略過也算看過）。看完後依劇情決定接下來開啟什麼
// （序章 → 程度測驗；區域開場 → 回到區域地圖；逃出失語邊境 → 翠綠草原）。
export default function StoryModal() {
  const storyId = useUiStore(s => s.storyId);
  const regionIdx = useUiStore(s => s.regionIdx);
  const { closeModal, openRegion } = useUiStore.getState();
  const character = useSaveStore(s => s.character);
  const markStorySeen = useSaveStore(s => s.markStorySeen);
  const [step, setStep] = useState(0);
  const [chosenReplies, setChosenReplies] = useState<Record<number, string>>({});
  const lines = STORIES[storyId] ?? [];
  const heroPortrait = useMemo(() => (character ? avatarDataUrl(character, 'idle', 3) : ''), [character]);
  const name = character?.name ?? '勇者';
  const fill = (t: string) => t.replaceAll('{name}', name);

  const choice = getStoryChoice(storyId, step);
  const needChoice = choice && !chosenReplies[step];

  const finish = () => {
    markStorySeen(storyId);
    if (useUiStore.getState().storyReplay) return closeModal();
    // 序章看完：問玩家要從頭冒險，還是先做程度測驗跳級
    if (storyId === 'prologue') {
      useSaveStore.getState().setTutorialDone(true);
      return useUiStore.getState().openModal('placement');
    }
    if (storyId.startsWith('region-')) return openRegion(regionIdx);
    // 逃出失語邊境：前往翠綠草原（區域地圖會播 A1 開場）
    if (storyId === PROLOGUE_CLEAR_STORY) return openRegion(0);
    closeModal();
  };

  const line = lines[step];
  const rawText = chosenReplies[step] ?? (line ? line.text : '');
  const text = fill(rawText);
  // 打到第幾個字（換句時重新從 0 開始；系統偏好減少動畫時直接整句）
  const [typed, setTyped] = useState({ step: -1, n: 0 });
  const shown = reduceMotion() || needChoice ? text.length : typed.step === step ? typed.n : 0;
  const typing = shown < text.length;
  const showAll = () => setTyped({ step, n: text.length });

  // 打字機：每個字 1000/28ms，遇到標點多停一下
  useEffect(() => {
    if (reduceMotion() || needChoice) return;
    let i = 0;
    let timer = 0;
    const tick = () => {
      i += 1;
      setTyped(t => (t.step === step && t.n >= text.length ? t : { step, n: i }));
      if (i < text.length) timer = window.setTimeout(tick, 1000 / TYPE_CPS + (PUNCT.test(text[i - 1]) ? PUNCT_PAUSE_MS : 0));
    };
    timer = window.setTimeout(tick, 1000 / TYPE_CPS);
    return () => window.clearTimeout(timer);
  }, [text, step, needChoice]);

  const selectChoice = (reply: string) => {
    sfx.click();
    setChosenReplies(prev => ({ ...prev, [step]: reply }));
  };

  const next = () => {
    if (needChoice) return;
    if (typing) return showAll();
    sfx.click();
    if (step + 1 >= lines.length) finish();
    else setStep(step + 1);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); finish(); return; }
      if (needChoice) return;
      if (e.key !== ' ' && e.key !== 'Enter') return;
      e.preventDefault(); e.stopImmediatePropagation();
      next();
    };
    // capture：比戰鬥介面的鍵盤處理先收到
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  });

  if (!line) return null;
  const speaker = SPEAKERS[line.speaker];

  return (
    <div className="story-backdrop">
      <div className={`story-box speaker-${line.speaker}`} role="dialog" aria-modal="true" aria-label="故事" onClick={next}>
        <button className="btn btn-ghost btn-small story-skip" onMouseDown={keepFocus} onClick={e => { e.stopPropagation(); finish(); }}>略過整段 ⏭</button>
        <div className="story-portrait" aria-hidden="true">
          {line.speaker === 'hero' && heroPortrait ? <img src={heroPortrait} alt="" /> : <span>{speaker.icon}</span>}
        </div>
        <div className="story-bubble">
          <div className="story-head">
            {speaker.name && <b>{fill(speaker.name)}</b>}
            <small className="muted">{step + 1}／{lines.length}</small>
          </div>
          {needChoice ? (
            <div className="story-choices-overlay" onClick={e => e.stopPropagation()}>
              <p style={{ margin: '0 0 6px', color: '#ffd15c', fontWeight: 'bold' }}>💭 做出你的回應：</p>
              {choice.options.map(opt => (
                <button
                  key={opt.id}
                  className="story-choice-btn"
                  onMouseDown={keepFocus}
                  onClick={() => selectChoice(opt.reply)}
                >
                  <span className="story-choice-letter">{opt.id}</span>
                  <span>{fill(opt.label)}</span>
                </button>
              ))}
            </div>
          ) : (
            <p aria-live="polite">{text.slice(0, shown)}<span className="story-rest" aria-hidden="true">{text.slice(shown)}</span></p>
          )}
          <div className="story-actions">
            <small className="muted">{needChoice ? '請點選上方選項回應' : typing ? '點一下顯示整句' : '點一下繼續'}</small>
            {!needChoice && (
              <button className="btn btn-primary" onMouseDown={keepFocus} onClick={e => { e.stopPropagation(); next(); }}>
                {step + 1 >= lines.length && !typing ? '繼續' : '下一句 ⏎'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
