import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import Modal from './Modal';
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import {
  BODY_NAMES, CLASSES, DEFAULT_CHARACTER, DEFAULT_NAME, ELEMENTS, FACE_NAMES, HAIR_COLORS, HAIR_NAMES, NAME_MAX_LENGTH, SKIN_TONES,
  cleanName, elementDef, elementRelation, randomCharacter,
} from '../game/character';
import type { Character } from '../game/character';
import { avatarDataUrl } from '../game/art/sprites';
import { sfx } from '../game/sfx';
import { keepFocus } from './keepFocus';

// 主角創建／外觀修改。第一次進入遊戲時不能關閉，建立完才進入新手引導。
export default function CharacterModal() {
  const saved = useSaveStore(s => s.character);
  const setCharacter = useSaveStore(s => s.setCharacter);
  const closeModal = useUiStore(s => s.closeModal);
  const openModal = useUiStore(s => s.openModal);
  const isNew = saved === null;
  const [draft, setDraft] = useState<Character>(saved ?? DEFAULT_CHARACTER);
  const [attackPose, setAttackPose] = useState(false);

  const update = (patch: Partial<Character>) => { sfx.click(); setDraft(d => ({ ...d, ...patch })); };
  const cycle = (key: 'face' | 'body' | 'hair', count: number, step: number) =>
    update({ [key]: (draft[key] + step + count) % count });

  const preview = useMemo(() => avatarDataUrl(draft, attackPose ? 'attack' : 'idle', 6), [draft, attackPose]);
  // 職業卡片用目前的外觀預覽各職業
  const classPreviews = useMemo(
    () => Object.fromEntries(CLASSES.map(c => [c.id, avatarDataUrl({ ...draft, classId: c.id }, 'idle', 3)])),
    [draft],
  );
  const el = elementDef(draft.element);

  const confirm = () => {
    sfx.victory();
    setCharacter({ ...draft, name: cleanName(draft.name) });
    closeModal();
    if (!isNew) return;
    const { tutorialDone, micAsked } = useSaveStore.getState();
    // 新玩家：先看序章，序章結束後再接新手引導與麥克風
    if (!useSaveStore.getState().storySeen.includes('prologue')) useUiStore.getState().openStory('prologue');
    else if (!tutorialDone) openModal('tutorial');
    else if (!micAsked) openModal('mic');
  };

  const randomize = () => {
    sfx.click();
    // 隨機只換外觀與職業屬性，保留玩家已經輸入的名字
    setDraft(d => ({ ...randomCharacter(), name: d.name }));
  };

  return (
    <Modal title={isNew ? '✨ 建立你的勇者' : '✨ 主角'} onClose={closeModal} closable={!isNew} wide>
      {isNew && <p className="creator-intro muted">沉默魔王奪走了王國的語言。只有掌握古代咒語——英文——的勇者，才能奪回家園。</p>}
      <div className="creator">
        <section className="creator-preview" style={{ '--el': el.color } as CSSProperties}>
          <button
            className="creator-avatar"
            onMouseDown={keepFocus}
            onClick={() => setAttackPose(p => !p)}
            aria-label={attackPose ? '切換成待機姿勢' : '切換成攻擊姿勢'}
            title="點一下切換姿勢"
          >
            <img src={preview} alt="主角預覽" />
          </button>
          <label className="creator-name">
            <span>名字</span>
            <input
              value={draft.name}
              maxLength={NAME_MAX_LENGTH}
              placeholder={DEFAULT_NAME}
              onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
            />
          </label>
          <p className="creator-summary">
            <b style={{ color: el.color }}>{el.name}</b>屬性・{CLASSES.find(c => c.id === draft.classId)!.name}
          </p>
        </section>

        <div className="creator-options">
          <section className="creator-section">
            <h3>職業</h3>
            <div className="class-grid" role="radiogroup" aria-label="職業">
              {CLASSES.map(c => (
                <button
                  key={c.id}
                  role="radio"
                  aria-checked={draft.classId === c.id}
                  className={`class-card ${draft.classId === c.id ? 'is-selected' : ''}`}
                  onMouseDown={keepFocus}
                  onClick={() => update({ classId: c.id })}
                >
                  <img src={classPreviews[c.id]} alt="" />
                  <b>{c.name}</b>
                  <span className="class-role">{c.weapon}・{c.role}</span>
                  <span className="muted">{c.desc}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="creator-section">
            <h3>屬性</h3>
            <div className="element-row" role="radiogroup" aria-label="屬性">
              {ELEMENTS.map(e => (
                <button
                  key={e.id}
                  role="radio"
                  aria-checked={draft.element === e.id}
                  aria-label={`${e.name}屬性`}
                  className={`element-btn ${draft.element === e.id ? 'is-selected' : ''}`}
                  style={{ '--el': e.color } as CSSProperties}
                  onMouseDown={keepFocus}
                  onClick={() => update({ element: e.id })}
                >{e.name}</button>
              ))}
            </div>
            <p className="muted creator-hint">{elementRelation(draft.element)}。剋制敵人時傷害 ×1.5。</p>
          </section>

          <section className="creator-section">
            <h3>外觀</h3>
            <div className="looks">
              <span className="look-label">性別</span>
              <div className="segmented" role="radiogroup" aria-label="性別">
                {(['male', 'female'] as const).map(g => (
                  <button
                    key={g}
                    role="radio"
                    aria-checked={draft.gender === g}
                    className={draft.gender === g ? 'is-selected' : ''}
                    onMouseDown={keepFocus}
                    onClick={() => update({ gender: g })}
                  >{g === 'male' ? '男' : '女'}</button>
                ))}
              </div>
              <Stepper label="臉型" names={FACE_NAMES} value={draft.face} onStep={s => cycle('face', FACE_NAMES.length, s)} />
              <Stepper label="體型" names={BODY_NAMES} value={draft.body} onStep={s => cycle('body', BODY_NAMES.length, s)} />
              <Stepper label="髮型" names={HAIR_NAMES} value={draft.hair} onStep={s => cycle('hair', HAIR_NAMES.length, s)} showCount />
              <span className="look-label">髮色</span>
              <Swatches label="髮色" colors={HAIR_COLORS} value={draft.hairColor} onPick={i => update({ hairColor: i })} />
              <span className="look-label">膚色</span>
              <Swatches label="膚色" colors={SKIN_TONES} value={draft.skin} onPick={i => update({ skin: i })} />
            </div>
          </section>
        </div>
      </div>

      <div className="tutorial-actions">
        <button className="btn btn-ghost" onMouseDown={keepFocus} onClick={randomize}>🎲 隨機</button>
        <button className="btn btn-primary" onMouseDown={keepFocus} onClick={confirm}>{isNew ? '開始冒險' : '儲存'}</button>
      </div>
    </Modal>
  );
}

function Stepper({ label, names, value, onStep, showCount = false }: {
  label: string; names: string[]; value: number; onStep: (step: number) => void; showCount?: boolean;
}) {
  return (
    <>
      <span className="look-label">{label}</span>
      <div className="stepper">
        <button className="btn btn-small" onMouseDown={keepFocus} onClick={() => onStep(-1)} aria-label={`上一個${label}`}>◀</button>
        <span className="stepper-value" aria-live="polite">
          {names[value]}{showCount && <small> {value + 1}/{names.length}</small>}
        </span>
        <button className="btn btn-small" onMouseDown={keepFocus} onClick={() => onStep(1)} aria-label={`下一個${label}`}>▶</button>
      </div>
    </>
  );
}

function Swatches({ label, colors, value, onPick }: {
  label: string; colors: { name: string; base: string }[]; value: number; onPick: (i: number) => void;
}) {
  return (
    <div className="swatches" role="radiogroup" aria-label={label}>
      {colors.map((c, i) => (
        <button
          key={c.name}
          role="radio"
          aria-checked={value === i}
          aria-label={c.name}
          title={c.name}
          className={`swatch ${value === i ? 'is-selected' : ''}`}
          style={{ background: c.base }}
          onMouseDown={keepFocus}
          onClick={() => onPick(i)}
        />
      ))}
    </div>
  );
}
