import { useEffect, useRef, useState } from 'react';
import Modal from './Modal';
import { useUiStore } from '../store/uiStore';
import { useSaveStore } from '../store/saveStore';
import {
  CHANT_SPELLS,
  COMBO_BONUS_DAMAGE,
  DAMAGE_PER_CHANT,
  WORLD_BOSS_HP,
  WORLD_BOSS_TIME,
  checkChant,
  type ChantSpell,
} from '../game/worldBoss';
import { createRecognizer, isSpeechRecognitionSupported, speakableText, type Recognizer } from '../game/speech';
import { sfx } from '../game/sfx';
import { keepFocus } from './keepFocus';
import { useSpeak } from './useSpeak';

export default function WorldBossModal() {
  const closeModal = useUiStore(s => s.closeModal);
  const celebrate = useUiStore(s => s.celebrate);
  const { addWeaponTickets, addGold, addTitle, titles } = useSaveStore();

  const [bossHp, setBossHp] = useState(WORLD_BOSS_HP);
  const [timeLeft, setTimeLeft] = useState(WORLD_BOSS_TIME);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [combo, setCombo] = useState(0);
  const [listening, setListening] = useState(false);
  const [statusText, setStatusText] = useState('準備開始詠唱破盾！');
  const [spellTyped, setSpellTyped] = useState('');
  const [battleState, setBattleState] = useState<'intro' | 'active' | 'victory' | 'defeat'>('intro');

  const recognizer = useRef<Recognizer | null>(null);
  const raid = useRef({ hp: WORLD_BOSS_HP, combo: 0, index: 0, remaining: WORLD_BOSS_TIME, active: false });
  const say = useSpeak();
  const currentSpell: ChantSpell = CHANT_SPELLS[currentIndex % CHANT_SPELLS.length];

  const handleChantSuccess = () => {
    const current = raid.current;
    // 舊辨識回呼或勝利後的重複事件不得再次傷害／發獎。
    if (!current.active || current.index !== currentIndex) return;
    const nextCombo = current.combo + 1;
    const isCrit = nextCombo % 3 === 0;
    const damage = isCrit ? DAMAGE_PER_CHANT + COMBO_BONUS_DAMAGE : DAMAGE_PER_CHANT;
    const nextHp = Math.max(0, current.hp - damage);
    raid.current = { ...current, hp: nextHp, combo: nextCombo, index: current.index + 1, active: nextHp > 0 };
    setBossHp(nextHp);
    setCombo(nextCombo);
    setSpellTyped('');
    sfx.crit();
    if (nextHp === 0) {
      setBattleState('victory');
      sfx.victory();
      addWeaponTickets(2);
      addGold(3000);
      if (!titles.includes('👑 屠龍詠唱者')) addTitle('👑 屠龍詠唱者');
      celebrate({
        icon: '🐉', title: '世界王法夫納・核心護盾完全破滅！',
        sub: '討伐大成功！獲得 🎫 專武召喚券 ×2、🪙 3,000 金幣，並解鎖稱號【👑 屠龍詠唱者】！',
        color: '#ffd15c',
      });
    } else {
      setStatusText(isCrit ? `🔥 神聖大裁決爆發！造成 ${damage.toLocaleString()} 點破盾打擊！` : `✨ 詠唱成功！造成 ${damage.toLocaleString()} 點破盾傷害！`);
      setCurrentIndex(current.index + 1);
      setTimeout(() => { if (raid.current.active) recognizer.current?.start(); }, 200);
    }
  };

  useEffect(() => {
    if (battleState !== 'active') return;
    const timer = window.setInterval(() => {
      if (!raid.current.active) return;
      const remaining = Math.max(0, raid.current.remaining - 1);
      raid.current = { ...raid.current, remaining, active: remaining > 0 };
      setTimeLeft(remaining);
      if (remaining === 0) { setBattleState('defeat'); sfx.wrong(); }
    }, 1000);
    return () => clearInterval(timer);
  }, [battleState]);

  useEffect(() => () => { raid.current.active = false; }, []);

  // 語音辨識綁定
  useEffect(() => {
    if (battleState !== 'active') {
      recognizer.current?.stop();
      return;
    }

    if (isSpeechRecognitionSupported()) {
      recognizer.current = createRecognizer({
        onStart: () => {
          setListening(true);
          setStatusText('🎙️ 正在聆聽您的詠唱聲……請朗讀當前古咒！');
        },
        accept: (transcripts) => checkChant(currentSpell, transcripts),
        onResult: (transcripts) => {
          if (checkChant(currentSpell, transcripts)) {
            handleChantSuccess();
          } else {
            setStatusText(`聽到「${transcripts[0] ?? ''}」，與古咒未完全吻合，請繼續朗讀！`);
          }
        },
        onError: (err) => {
          setListening(false);
          setStatusText(`辨識暫停（${err}），您也可以使用鍵盤拼寫關鍵詞破盾！`);
        },
        onEnd: () => {
          setListening(false);
        },
      });
    }

    return () => {
      recognizer.current?.stop();
    };
  }, [battleState, currentIndex]);

  const startRaid = () => {
    raid.current = { hp: WORLD_BOSS_HP, combo: 0, index: 0, remaining: WORLD_BOSS_TIME, active: true };
    setBossHp(WORLD_BOSS_HP);
    setTimeLeft(WORLD_BOSS_TIME);
    setCurrentIndex(0);
    setCombo(0);
    setSpellTyped('');
    setBattleState('active');
    sfx.boss();
    setTimeout(() => {
      if (raid.current.active) recognizer.current?.start();
    }, 300);
  };

  // 拼寫備援：打入 keyword 直接破盾
  const handleKeywordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (spellTyped.trim().toUpperCase() === currentSpell.keyword) {
      handleChantSuccess();
    } else {
      setStatusText(`關鍵詞應為【${currentSpell.keyword}】，請重新確認！`);
    }
  };

  const playDemo = () => {
    say(speakableText(currentSpell.en));
  };

  const hpPercent = Math.max(0, (bossHp / WORLD_BOSS_HP) * 100);

  return (
    <Modal title="🐉 世界王突襲・天穹暴君法夫納" onClose={closeModal} wide>
      <div className="worldboss-container" style={{ textAlign: 'center', padding: '12px' }}>
        {battleState === 'intro' && (
          <div className="worldboss-intro">
            <div style={{ fontSize: '64px', marginBottom: '8px' }}>🐉⚡</div>
            <h2 style={{ color: '#ffd15c', margin: '8px 0' }}>遠古滅世巨龍・天穹暴君法夫納</h2>
            <p style={{ color: '#a9b0ce', maxWidth: '560px', margin: '0 auto 16px', lineHeight: '1.6' }}>
              法夫納展開了厚達 <b>1,000,000 HP</b> 的遠古暗黑護盾，正在引導「末日大審判」！
              勇者們必須在 <b>60 秒</b>內，透過神聖英語古咒詠唱引導天界雷霆直擊巨龍心臟破盾！
            </p>
            <div style={{ background: '#1c1f3b', padding: '12px', borderRadius: '8px', marginBottom: '16px', display: 'inline-block' }}>
              <div style={{ color: '#5fb3ff' }}>🎙️ 支援麥克風語音詠唱（推薦）</div>
              <div style={{ color: '#c9a8ff', fontSize: '13px', marginTop: '4px' }}>⌨️ 亦支援安靜環境下的高速鍵盤拼寫備援</div>
            </div>
            <div>
              <button className="btn btn-primary" style={{ fontSize: '18px', padding: '12px 28px' }} onMouseDown={keepFocus} onClick={startRaid}>
                ⚔️ 開始詠唱破盾突襲！
              </button>
            </div>
          </div>
        )}

        {battleState === 'active' && (
          <div className="worldboss-battle">
            {/* 倒數計時與血條 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ color: '#ff5af0', fontWeight: 'bold' }}>⏳ 末日倒數：{timeLeft} 秒</span>
              <span style={{ color: '#ffd15c', fontWeight: 'bold' }}>連擊共鳴：{combo} 層（每 3 層大裁決）</span>
            </div>

            <div style={{ background: '#1c1f3b', height: '22px', borderRadius: '11px', overflow: 'hidden', border: '2px solid #ffcd4b', marginBottom: '12px', position: 'relative' }}>
              <div
                style={{
                  width: `${hpPercent}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #ff4d4d, #ffcd4b)',
                  transition: 'width 0.3s ease',
                }}
              />
              <span style={{ position: 'absolute', width: '100%', left: 0, top: '2px', fontSize: '12px', fontWeight: 'bold', color: '#fff', textShadow: '0 1px 2px #000' }}>
                {bossHp.toLocaleString()} / {WORLD_BOSS_HP.toLocaleString()} HP ({hpPercent.toFixed(1)}%)
              </span>
            </div>

            {/* 當前古咒卡片 */}
            <div style={{ background: '#202448', border: '2px solid #5fb3ff', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ color: '#5fb3ff', fontSize: '13px' }}>📜 第 {currentIndex + 1} 節神聖古咒</span>
                <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }} onMouseDown={keepFocus} onClick={playDemo}>
                  🔊 聆聽示範
                </button>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f1f0f8', margin: '8px 0', lineHeight: '1.4' }}>
                "{currentSpell.en}"
              </div>
              <div style={{ color: '#a9b0ce', fontSize: '14px' }}>
                {currentSpell.zh}
              </div>
            </div>

            {/* 辨識與狀態提示 */}
            <div style={{ minHeight: '36px', color: '#ffcd4b', fontSize: '14px', marginBottom: '12px' }}>
              {statusText}
            </div>

            {/* 快捷朗讀與鍵盤拼寫 */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                className={`btn ${listening ? 'btn-primary' : 'btn-secondary'}`}
                onMouseDown={keepFocus}
                onClick={() => recognizer.current?.start()}
                style={{ padding: '10px 20px', fontSize: '15px' }}
              >
                {listening ? '🎙️ 正在收音……' : '🎙️ 點擊開始朗讀'}
              </button>

              <form onSubmit={handleKeywordSubmit} style={{ display: 'inline-flex', gap: '6px' }}>
                <input
                  type="text"
                  placeholder={`拼寫關鍵詞：${currentSpell.keyword}`}
                  value={spellTyped}
                  onChange={e => setSpellTyped(e.target.value.toUpperCase())}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #30365f',
                    background: '#101127',
                    color: '#fff',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    width: '180px',
                  }}
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '8px 14px' }} onMouseDown={keepFocus}>
                  送出破盾 ⚡
                </button>
              </form>
            </div>
          </div>
        )}

        {battleState === 'victory' && (
          <div className="worldboss-victory">
            <div style={{ fontSize: '64px', marginBottom: '8px' }}>🎉👑</div>
            <h2 style={{ color: '#ffd15c' }}>世界王討伐大獲全勝！</h2>
            <p style={{ color: '#a9b0ce', marginBottom: '16px' }}>
              遠古巨龍的滅世護盾在神聖詠唱的萬鈞雷霆下徹底碎裂消散！
            </p>
            <div style={{ background: '#1c1f3b', padding: '12px 24px', borderRadius: '8px', display: 'inline-block', marginBottom: '16px' }}>
              <div style={{ color: '#fff' }}>🎁 <b>獲得獎勵：</b></div>
              <div style={{ color: '#ffcd4b', marginTop: '4px' }}>🎫 專武召喚券 ×2</div>
              <div style={{ color: '#ffcd4b' }}>🪙 3,000 金幣</div>
              <div style={{ color: '#c9a8ff' }}>👑 榮譽稱號【屠龍詠唱者】</div>
            </div>
            <div>
              <button className="btn btn-primary" onMouseDown={keepFocus} onClick={closeModal}>
                收下獎勵並返回
              </button>
            </div>
          </div>
        )}

        {battleState === 'defeat' && (
          <div className="worldboss-defeat">
            <div style={{ fontSize: '64px', marginBottom: '8px' }}>💥🌑</div>
            <h2 style={{ color: '#ff4d4d' }}>末日審判降臨……</h2>
            <p style={{ color: '#a9b0ce', marginBottom: '16px' }}>
              詠唱時間耗盡，巨龍的混沌吐息吞沒了戰場。但您的勇氣已銘刻在群星之中！
            </p>
            <button className="btn btn-primary" onMouseDown={keepFocus} onClick={startRaid}>
              ⚔️ 再次發起挑戰！
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
