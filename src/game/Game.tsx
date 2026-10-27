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
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { setSfxVolume } from './sfx';

// 遊戲畫布固定 800x480 的邏輯座標，由 Phaser 依容器大小等比縮放（RWD）
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 480;

export default function Game() {
  const gameRef = useRef<HTMLDivElement>(null);
  const inBattle = useBattleStore(s => s.active);
  const modal = useUiStore(s => s.modal);

  // 地圖與戰鬥切換時回到頁面頂端，避免畫面上方（關卡名稱）被捲出畫面
  useEffect(() => { window.scrollTo(0, 0); }, [inBattle]);

  // 第一次進入遊戲：建立主角 → 新手引導 → 麥克風
  useEffect(() => {
    const { character, tutorialDone, micAsked } = useSaveStore.getState();
    if (!character) useUiStore.getState().openModal('character');
    else if (!tutorialDone) useUiStore.getState().openModal('tutorial');
    else if (!micAsked) useUiStore.getState().openModal('mic');
  }, []);

  // 音效音量跟著設定走
  useEffect(() => {
    setSfxVolume(useSaveStore.getState().settings.sfxVolume);
    return useSaveStore.subscribe(s => setSfxVolume(s.settings.sfxVolume));
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
    </div>
  );
}
