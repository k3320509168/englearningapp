import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import MapScene from './MapScene';
import MainScene from './MainScene';
import { useBattleStore } from '../store/battleStore';
import BattleHUD from '../components/BattleHUD';
import MapToolbar from '../components/MapToolbar';
import SettingsModal from '../components/SettingsModal';
import TutorialModal from '../components/TutorialModal';
import ShopModal from '../components/ShopModal';
import HeroModal from '../components/HeroModal';
import CodexModal from '../components/CodexModal';
import MapLevelBar from '../components/MapLevelBar';
import MicPermissionModal from '../components/MicPermissionModal';
import CharacterModal from '../components/CharacterModal';
import SummonModal from '../components/SummonModal';
import RegionModal from '../components/RegionModal';
import StoryModal from '../components/StoryModal';
import GrowthModal from '../components/GrowthModal';
import TrueNameModal from '../components/TrueNameModal';
import GoldenModal from '../components/GoldenModal';
import DailyModal from '../components/DailyModal';
import SkillBossModal from '../components/SkillBossModal';
import CelebrationOverlay from '../components/CelebrationOverlay';
import ReviewModal from '../components/ReviewModal';
import PlacementModal from '../components/PlacementModal';
import GateTrialModal from '../components/GateTrialModal';
import { CloudConflict } from '../components/CloudSave';
import SaveRecoveryNotice from '../components/SaveRecoveryNotice';
import { initCloud } from '../cloud/cloudSave';
import { backfillMainTitle } from './startLevel';
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { setSfxVolume } from './sfx';
import { stopSpeaking } from './speech';
import { playMusic, setMusicVolume, unlockMusic } from './music';

// 遊戲畫布固定 800x480 的邏輯座標，由 Phaser 依容器大小等比縮放（RWD）
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 480;

export default function Game() {
  const gameRef = useRef<HTMLDivElement>(null);
  const inBattle = useBattleStore(s => s.active);
  const modal = useUiStore(s => s.modal);

  // 地圖與戰鬥切換時回到頁面頂端，避免畫面上方（關卡名稱）被捲出畫面
  useEffect(() => { window.scrollTo(0, 0); }, [inBattle]);

  // 切到別的 App 或分頁時停止英文發音（音樂與音效在各自的模組裡暫停）
  useEffect(() => {
    const onHide = () => { if (document.hidden) stopSpeaking(); };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, []);

  // 第一次進入遊戲：建立主角 → 序章，然後直接開始冒險。
  // 操作說明改成戰鬥中的情境提示，麥克風等第一次遇到口說題時才詢問
  useEffect(() => {
    const loginFailed = initCloud();
    // 同時開好幾個分頁：別的分頁存檔時，這裡跟著讀取最新的存檔，避免互相覆蓋（英雄消失、召喚券被刷回來）
    const onStorage = (e: StorageEvent) => { if (e.key === 'english-rpg-save') void useSaveStore.persist.rehydrate(); };
    window.addEventListener('storage', onStorage);
    backfillMainTitle();
    useSaveStore.getState().ensureDaily();
    const { character, tutorialDone } = useSaveStore.getState();
    if (!character) useUiStore.getState().openModal('character');
    // 從失敗的登入連結回來：直接打開設定，顯示原因與重新寄送
    else if (loginFailed) useUiStore.getState().openModal('settings');
    else if (!tutorialDone) useSaveStore.getState().setTutorialDone(true);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // 音效與背景音樂的音量、文字大小、減少動態效果跟著設定走
  useEffect(() => {
    const apply = () => {
      const { sfxVolume, musicVolume, textScale, reduceMotion } = useSaveStore.getState().settings;
      setSfxVolume(sfxVolume);
      setMusicVolume(musicVolume);
      const root = document.documentElement;
      root.style.setProperty('--text-scale', String(textScale ?? 1));
      root.dataset.textScale = (textScale ?? 1) > 1 ? 'large' : 'normal';
      if (reduceMotion) root.dataset.reduceMotion = 'true';
      else delete root.dataset.reduceMotion;
    };
    apply();
    return useSaveStore.subscribe(apply);
  }, []);

  // 背景音樂：地圖、戰鬥、頭目各一首。瀏覽器要求使用者互動後才能播放聲音
  useEffect(() => {
    const pick = () => {
      const s = useBattleStore.getState();
      if (!s.active) return playMusic('map');
      const stage = s.stages[s.stageIdx];
      playMusic(stage?.bossMode ? 'boss' : 'battle');
    };
    pick();
    const unsubscribe = useBattleStore.subscribe((s, prev) => {
      if (s.active !== prev.active || s.stageIdx !== prev.stageIdx) pick();
    });
    const unlock = () => unlockMusic();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      unsubscribe();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  useEffect(() => {
    const parent = gameRef.current;
    if (!parent) return;
    let game: Phaser.Game | null = null;
    let observer: ResizeObserver | null = null;
    let cancelled = false;

    // 先載入像素字型，避免 Phaser 用預設字型畫出文字
    Promise.all([
      document.fonts.load('700 20px "Pixelify Sans"'),
      document.fonts.load('400 20px "Pixelify Sans"'),
      document.fonts.load('400 20px "Press Start 2P"'),
    ]).catch(() => undefined).finally(() => {
      if (cancelled) return;
      const g = new Phaser.Game({
        type: Phaser.AUTO,
        parent,
        backgroundColor: '#14152b',
        // 不用 pixelArt 全域設定：它會讓整個畫布以硬邊縮放，畫面縮小時文字會糊掉。
        // 像素圖改在註冊貼圖時個別設定最近鄰濾鏡。
        antialias: true,
        roundPixels: true,
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          width: GAME_WIDTH,
          height: GAME_HEIGHT,
        },
        scene: [MapScene, MainScene],
      });
      game = g;
      // 開發模式下開放給瀏覽器 console 偵錯用
      if (import.meta.env.DEV) Object.assign(window, { __game: g, __battle: useBattleStore, __save: useSaveStore });
      // 地圖與戰鬥的容器大小不同（CSS 決定），容器尺寸變化時通知 Phaser 重新計算縮放
      // 注意：Phaser 的 refresh() 只用快取的父層尺寸，必須先 getParentBounds() 重新量測
      observer = new ResizeObserver(() => {
        g.scale.getParentBounds();
        g.scale.refresh();
      });
      observer.observe(parent);
    });

    return () => {
      cancelled = true;
      observer?.disconnect();
      game?.destroy(true);
    };
  }, []);

  return (
    <div className={`game-shell ${inBattle ? 'is-battle' : 'is-map'}`}>
      {!inBattle && <MapToolbar />}
      <div ref={gameRef} className="game-canvas" />
      {inBattle ? <BattleHUD /> : <MapLevelBar />}
      {modal === 'settings' && <SettingsModal />}
      {modal === 'tutorial' && <TutorialModal />}
      {modal === 'shop' && <ShopModal />}
      {modal === 'heroes' && <HeroModal />}
      {modal === 'codex' && <CodexModal />}
      {modal === 'mic' && <MicPermissionModal />}
      {modal === 'character' && <CharacterModal />}
      {modal === 'summon' && <SummonModal />}
      {modal === 'region' && <RegionModal />}
      {modal === 'story' && <StoryModal />}
      {modal === 'growth' && <GrowthModal />}
      {modal === 'trueName' && <TrueNameModal />}
      {modal === 'golden' && <GoldenModal />}
      {modal === 'daily' && <DailyModal />}
      {modal === 'review' && <ReviewModal />}
      {modal === 'placement' && <PlacementModal />}
      {modal === 'gateTrial' && <GateTrialModal />}
      <CelebrationOverlay />
      <CloudConflict />
      <SaveRecoveryNotice />
      {modal === 'skillBoss' && <SkillBossModal />}
    </div>
  );
}
