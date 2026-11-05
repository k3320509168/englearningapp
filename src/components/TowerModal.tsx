import { useState } from 'react';
import Modal from './Modal';
import QuizRunner from './QuizRunner';
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { TOWER_PASS, TOWER_QUESTIONS, dayIndex, featuredHero, isEndlessFloor, towerQuestions, towerRegion, towerReward } from '../game/modes';
import { REGIONS } from '../game/regions';
import { heroDef, heroWord } from '../game/heroes';
import { heroDataUrl } from '../game/art/sprites';
import type { Question } from '../game/types';
import { sfx } from '../game/sfx';
import { keepFocus } from './keepFocus';

// 英雄時空之塔與無盡之塔：每層 5 題、答對 4 題通過。
// 30 層後開啟無盡之塔挑戰，每 5 層送 🎫 召喚券！
export default function TowerModal() {
  const closeModal = useUiStore(s => s.closeModal);
  const { towerFloor, heroes, clearTowerFloor } = useSaveStore();
  const hero = featuredHero(heroes, dayIndex());
  const floor = towerFloor + 1;
  const isEndless = isEndlessFloor(floor);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [score, setScore] = useState({ answered: 0, correct: 0 });
  const [attemptFloor, setAttemptFloor] = useState(floor);
  const [result, setResult] = useState<'pass' | 'fail' | null>(null);
  const [lastPaid, setLastPaid] = useState<{
    gold: number;
    shards: number;
    tickets: number;
    xp: number;
    bonus: number;
    allowanceGold: number;
    badges: number;
  } | null>(null);

  const isBossFloor = floor % 5 === 0;
  const reward = towerReward(floor);

  const startChallenge = (targetFloor: number) => {
    setAttemptFloor(targetFloor);
    setQuestions(towerQuestions(targetFloor));
    setScore({ answered: 0, correct: 0 });
    setResult(null);
    setLastPaid(null);
    sfx.click();
  };

  const onAnswer = (correct: boolean) => {
    const s = { answered: score.answered + 1, correct: score.correct + (correct ? 1 : 0) };
    setScore(s);
    if (!questions || s.answered < questions.length) return;

    if (s.correct >= TOWER_PASS) {
      const paid = clearTowerFloor(attemptFloor, hero);
      sfx.victory();
      setResult('pass');
      if (paid) {
        setLastPaid({
          ...paid,
          tickets: paid.tickets ?? 0,
          shards: reward.shards,
          badges: reward.badges,
        });
        useUiStore.getState().celebrate({
          icon: isEndless ? '🌌' : '🗼',
          title: `${isEndless ? '無盡之塔 ' : ''}第 ${attemptFloor} 層通過！`,
          sub: `${hero ? `${heroWord(heroDef(hero))} 碎片` : '願望碎片'} +${reward.shards}、🪙 ${paid.gold}${paid.tickets ? `、🎫 召喚券 +${paid.tickets}` : ''}、EXP ${paid.xp}${paid.bonus > 0 ? `（追趕祝福 +25%，多得${paid.bonus}）` : ''}${paid.allowanceGold > 0 ? `（含修練津貼${paid.allowanceGold}）` : ''}`,
          img: hero ? heroDataUrl(hero, 4) : undefined,
          color: '#c9a8ff',
        });
      }
    } else {
      sfx.wrong();
      setResult('fail');
    }
  };

  const heroItem = hero ? heroDef(hero) : null;

  return (
    <Modal title={isEndless ? '🌌 無盡時空之塔' : '🗼 英雄時空之塔'} onClose={closeModal} wide>
      <p className="muted">此副本的口說題改用拼寫練習，不驗證口說能力；獎勵不受影響。</p>
      {!questions && (
        <div className="tower-panel">
          <div className="tower-header-card">
            <div className="tower-floor-badge">
              <span className="tower-floor-num">{isEndless ? '無盡 ' : ''}第 {floor} 層</span>
              {isBossFloor && <span className="tower-boss-pill">👑 首領守護層</span>}
            </div>
            <div className="tower-region-indicator">
              考驗領域：<b>{REGIONS[towerRegion(floor)].name}</b> 題庫（每層 {TOWER_QUESTIONS} 題，答對 {TOWER_PASS} 題過關）
            </div>
          </div>

          <div className="tower-hero-box">
            <div className="tower-hero-avatar">
              {heroItem ? (
                <img src={heroDataUrl(heroItem.id, 3)} alt={heroWord(heroItem)} />
              ) : (
                <span className="tower-shard-icon">🧩</span>
              )}
            </div>
            <div className="tower-hero-info">
              <div className="tower-hero-title">
                <span>今日主角英雄：</span>
                <b>{heroItem ? heroWord(heroItem) : '願望碎片'}</b>
                {heroItem && <span className="rarity-tag inline">{heroItem.rarity}</span>}
              </div>
              <p className="tower-hero-desc">
                通關本層即可獲取該英雄碎片，每日更換主角！每 5 層首領層獎勵 3 倍！
              </p>
            </div>
          </div>

          <div className="tower-rewards-grid">
            <div className="tower-reward-chip">
              <span className="reward-icon">🧩</span>
              <div className="reward-detail">
                <small>{heroItem ? `${heroWord(heroItem)} 碎片` : '願望碎片'}</small>
                <b>+{reward.shards}</b>
              </div>
            </div>
            <div className="tower-reward-chip">
              <span className="reward-icon">🪙</span>
              <div className="reward-detail">
                <small>通關金幣</small>
                <b>+{reward.gold}</b>
              </div>
            </div>
            <div className="tower-reward-chip">
              <span className="reward-icon">🎖️</span>
              <div className="reward-detail">
                <small>職業徽章</small>
                <b>+{reward.badges}</b>
              </div>
            </div>
            <div className="tower-reward-chip">
              <span className="reward-icon">⚡</span>
              <div className="reward-detail">
                <small>基礎經驗</small>
                <b>+{reward.xp}</b>
              </div>
            </div>
            {reward.tickets > 0 && (
              <div className="tower-reward-chip is-highlight">
                <span className="reward-icon">🎫</span>
                <div className="reward-detail">
                  <small>英雄召喚券</small>
                  <b>+{reward.tickets}</b>
                </div>
              </div>
            )}
          </div>

          <div className="tower-rule-note">
            {isEndless
              ? '🌌 已突破 30 層！進入無盡攀爬模式，層數無上限，每 5 層必定奉上 🎫 召喚券！'
              : '💡 提示：卡關時攀爬時空之塔是累積金幣、英雄碎片與經驗的最快途徑。'}
          </div>

          <div className="tower-actions">
            <button
              className="btn btn-primary tower-start-btn"
              onMouseDown={keepFocus}
              onClick={() => startChallenge(floor)}
            >
              ⚔️ 開始挑戰第 {floor} 層
            </button>
          </div>
        </div>
      )}

      {questions && result === null && (
        <QuizRunner
          questions={questions}
          label={i => `${isEndless ? '無盡 ' : ''}第 ${attemptFloor} 層・第 ${i + 1} / ${questions.length} 題`}
          onAnswer={onAnswer}
        />
      )}

      {result && (
        <div className="tower-result-card">
          {result === 'pass' ? (
            <>
              <div className="tower-result-header is-victory">
                <span className="tower-result-icon">🏆</span>
                <h3>第 {attemptFloor} 層 挑戰成功！</h3>
                <p>答對 {score.correct} / {TOWER_QUESTIONS} 題（達標要求：{TOWER_PASS} 題）</p>
              </div>

              {lastPaid && (
                <div className="tower-settle-rewards">
                  <p className="summary-label">獲取通關獎勵：</p>
                  <div className="tower-rewards-grid">
                    <div className="tower-reward-chip">
                      <span className="reward-icon">🧩</span>
                      <div className="reward-detail">
                        <small>碎片</small>
                        <b>+{lastPaid.shards}</b>
                      </div>
                    </div>
                    <div className="tower-reward-chip">
                      <span className="reward-icon">🪙</span>
                      <div className="reward-detail">
                        <small>金幣</small>
                        <b>+{lastPaid.gold}</b>
                      </div>
                    </div>
                    <div className="tower-reward-chip">
                      <span className="reward-icon">🎖️</span>
                      <div className="reward-detail"><small>職業徽章</small><b>+{lastPaid.badges}</b></div>
                    </div>
                    <div className="tower-reward-chip">
                      <span className="reward-icon">⚡</span>
                      <div className="reward-detail">
                        <small>經驗 EXP</small>
                        <b>+{lastPaid.xp}</b>
                      </div>
                    </div>
                    {lastPaid.tickets > 0 && (
                      <div className="tower-reward-chip is-highlight">
                        <span className="reward-icon">🎫</span>
                        <div className="reward-detail">
                          <small>召喚券</small>
                          <b>+{lastPaid.tickets}</b>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="tower-actions-row">
                <button
                  className="btn btn-primary"
                  onMouseDown={keepFocus}
                  onClick={() => startChallenge(towerFloor + 1)}
                >
                  🚀 繼續挑戰第 {towerFloor + 1} 層
                </button>
                <button
                  className="btn btn-secondary"
                  onMouseDown={keepFocus}
                  onClick={() => { setQuestions(null); setResult(null); }}
                >
                  🗼 查看塔樓總覽
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="tower-result-header is-defeat">
                <span className="tower-result-icon">💪</span>
                <h3>再接再厲！</h3>
                <p>本層答對 {score.correct} / {TOWER_QUESTIONS} 題（通過需要 {TOWER_PASS} 題）</p>
              </div>
              <p className="muted" style={{ textAlign: 'center', margin: '12px 0' }}>
                別氣餒！題目不限作答時間，仔細閱讀題幹與選項，隨時可以再次挑戰！
              </p>
              <div className="tower-actions-row">
                <button
                  className="btn btn-primary"
                  onMouseDown={keepFocus}
                  onClick={() => startChallenge(attemptFloor)}
                >
                  🔄 重新挑戰第 {attemptFloor} 層
                </button>
                <button
                  className="btn btn-secondary"
                  onMouseDown={keepFocus}
                  onClick={() => { setQuestions(null); setResult(null); }}
                >
                  返回塔樓
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
