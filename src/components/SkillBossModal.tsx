import type { CSSProperties } from 'react';
import Modal from './Modal';
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { useBattleStore } from '../store/battleStore';
import { SKILL_BOSSES, SKILL_BOSS_FIRST_TICKETS, reachablePool, skillBossQuestions } from '../game/skillBosses';
import { elementDef } from '../game/character';
import { isSpeechRecognitionSupported } from '../game/speech';
import { keepFocus } from './keepFocus';

// 擴充魔王（聽說讀寫）：每位只用一種能力的題目，題目來自已到達的區域
export default function SkillBossModal() {
  const closeModal = useUiStore(s => s.closeModal);
  const cleared = useSaveStore(s => s.skillBossCleared);
  const unlockedIndex = useSaveStore(s => s.unlockedIndex);
  const voiceAsSpelling = useSaveStore(s => s.settings.voiceAsSpelling);
  const canSpeak = isSpeechRecognitionSupported() && !voiceAsSpelling;
  const pool = reachablePool(unlockedIndex);

  return (
    <Modal title="⚔️ 魔王挑戰：聽說讀寫" onClose={closeModal} wide>
      <p className="muted party-note">四位魔王各自只用一種能力的題目，題目來自你已經到達的區域，越往後越難。第一次擊敗可得到稱號與召喚券 🎫 ×{SKILL_BOSS_FIRST_TICKETS}，之後可以一直重複挑戰。</p>
      <ul className="skill-boss-grid">
        {SKILL_BOSSES.map(b => {
          const el = elementDef(b.element);
          const count = skillBossQuestions(b.id, pool).length;
          const blocked = b.id === 'speaking' && !canSpeak;
          const done = cleared.includes(b.id);
          return (
            <li key={b.id} className={`skill-boss ${done ? 'is-cleared' : ''}`} style={{ '--el': el.color } as CSSProperties}>
              <span className="skill-boss-icon">{b.icon}</span>
              <b>{b.skill}・{b.name}</b>
              <span>{b.desc}</span>
              <small className="muted">題目 {count} 題{done ? ` ・ 🏅 已獲得「${b.title}」` : ` ・ 擊敗獲得稱號「${b.title}」`}</small>
              {blocked && <small className="voice-error">需要可以使用麥克風的瀏覽器（並在設定關閉「口說題改成拼寫題」）</small>}
              <button className="btn btn-primary btn-small" onMouseDown={keepFocus} disabled={blocked || count < 4}
                onClick={() => { closeModal(); useBattleStore.getState().startSkillBoss(b.id); }}>
                {done ? '再次挑戰' : '挑戰'}
              </button>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
