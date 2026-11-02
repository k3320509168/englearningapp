import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import MapScene from './MapScene';
import MainScene from './MainScene';
import { backgroundBackdrop } from './art/backgrounds';
import { useBattleStore } from '../store/battleStore';
import BattleHUD from '../components/BattleHUD';
import MapToolbar from '../components/MapToolbar';
import SettingsModal from '../components/SettingsModal';
import StoryLogModal from '../components/StoryLogModal';
import AdventureModal from '../components/AdventureModal';
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
import LoginRewardModal from '../components/LoginRewardModal';
import SkillBossModal from '../components/SkillBossModal';
import CelebrationOverlay from '../components/CelebrationOverlay';
import TicketWheel from '../components/TicketWheel';
import ReviewModal from '../components/ReviewModal';
import WordStudy from '../components/WordStudy';
import PlacementModal from '../components/PlacementModal';
import GateTrialModal from '../components/GateTrialModal';
import ShardQuizModal from '../components/ShardQuizModal';
import { loadBanksFrom } from './questions/bank/loader';
import HolyForgeModal from '../components/HolyForgeModal';
import RushModal from '../components/RushModal';
import TowerModal from '../components/TowerModal';
import { CloudConflict } from '../components/CloudSave';
import SaveRecoveryNotice from '../components/SaveRecoveryNotice';
import { initCloud } from '../cloud/cloudSave';
import { backfillMainTitle } from './startLevel';
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { setSfxVolume } from './sfx';
import { stopSpeaking } from './speech';
import { playMusic, setMusicVolume, unlockMusic } from './music';
import { musicTrackFor, regionMusic } from './musicData';
import { isPrologue, stageInMap } from './stageLayout';

// 遊戲畫布固定 800x480 的邏輯座標，由 Phaser 依容器大小等比縮放（RWD）
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 480;

export default function Game() {
  const gameRef = useRef<HTMLDivElement>(null);
  const inBattle = useBattleStore(s => s.active);
  const battleRegion = useBattleStore(s => s.levelIdx);
  const mapRegion = useSaveStore(s => s.unlockedIndex);
  useEffect(() => {
    const parent = gameRef.current;
    if (parent) parent.style.backgroundImage = `url("${backgroundBackdrop(inBattle ? battleRegion : mapRegion, parent.clientWidth / Math.max(1, parent.clientHeight))}")`;
  }, [inBattle, battleRegion, mapRegion]);
  const modal = useUiStore(s => s.modal);

  // 地圖與戰鬥切換時回到頁面頂端，避免畫面上方（關卡名稱）被捲出畫面
  useEffect(() => { window.scrollTo(0, 0); }, [inBattle]);
  // CEFR 題庫在背景分區域載入：目前冒險的區域優先
  useEffect(() => { void loadBanksFrom(useSaveStore.getState().unlockedIndex); }, []);

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

  // 背景音樂（第二十一輪）：世界地圖一首；打開區域地圖播該區的曲子；一般戰鬥是該區曲子的戰鬥變奏；
  // 第 15 關小 BOSS、第 20 關大 BOSS、區域魔王、沉默君王各有專屬曲。瀏覽器要求使用者互動後才能播放聲音
  useEffect(() => {
    const pick = () => {
      const s = useBattleStore.getState();
      const ui = useUiStore.getState();
      if (!s.active) return playMusic(ui.modal === 'region' ? musicTrackFor(regionMusic(ui.regionIdx), 'map') : 'world');
      const stage = s.stages[s.stageIdx];
      const region = isPrologue(s.levelKey) ? 'pre' : regionMusic(s.levelIdx);
      if (s.mode === 'skill') return playMusic('boss-big');
      if (!stage?.bossMode || stage.revenge) return playMusic(musicTrackFor(region, 'normal'));
      const final = s.mode === 'normal' && (stage.kind === 'final' || (s.stageIdx === s.stages.length - 1 && stage.kind !== 'gate'));
      if (final) return playMusic(musicTrackFor(region, 'region'));
      playMusic(musicTrackFor(region, isPrologue(s.levelKey) || stageInMap(s.stageIdx) === 20 ? 'big' : 'mini'));
    };
    pick();
    const unsubscribe = useBattleStore.subscribe((s, prev) => {
      if (s.active !== prev.active || s.stageIdx !== prev.stageIdx) pick();
    });
    const unsubscribeUi = useUiStore.subscribe((s, prev) => {
      if (s.modal !== prev.modal || s.regionIdx !== prev.regionIdx) pick();
    });
    const unlock = () => unlockMusic();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      unsubscribe();
      unsubscribeUi();
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
        // 遊戲的音樂與音效都自己用 Web Audio 合成，不用 Phaser 的音訊（少開一個音訊環境，避免和發音、麥克風互相干擾）
        audio: { noAudio: true },
      });
      game = g;
      // 開發模式下開放給瀏覽器 console 偵錯用
      if (import.meta.env.DEV) Object.assign(window, { __game: g, __battle: useBattleStore, __save: useSaveStore });
      // 地圖與戰鬥的容器大小不同（CSS 決定），容器尺寸變化時通知 Phaser 重新計算縮放
      // 注意：Phaser 的 refresh() 只用快取的父層尺寸，必須先 getParentBounds() 重新量測
      observer = new ResizeObserver(() => {
        g.scale.getParentBounds();
        g.scale.refresh();
        const b = useBattleStore.getState();
        const r = b.active ? b.levelIdx : useSaveStore.getState().unlockedIndex;
        parent.style.backgroundImage = `url("${backgroundBackdrop(r, parent.clientWidth / Math.max(1, parent.clientHeight))}")`;
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
      {modal === 'storyLog' && <StoryLogModal />}
      {modal === 'adventure' && <AdventureModal />}
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
      {modal === 'loginReward' && <LoginRewardModal />}
      {modal === 'review' && <ReviewModal />}
      {modal === 'placement' && <PlacementModal />}
      {modal === 'gateTrial' && <GateTrialModal />}
      {modal === 'shardQuiz' && <ShardQuizModal />}
      {modal === 'holyForge' && <HolyForgeModal />}
      {modal === 'rush' && <RushModal />}
      {modal === 'tower' && <TowerModal />}
      <CelebrationOverlay />
      <TicketWheel />
      <CloudConflict />
      <SaveRecoveryNotice />
      {modal === 'skillBoss' && <SkillBossModal />}
      <WordStudy />
    </div>
  );
}
