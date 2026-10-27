import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import MapScene from './MapScene';
import MainScene from './MainScene';
import { useBattleStore } from '../store/battleStore';
import BattleHUD from '../components/BattleHUD';

// 遊戲畫布固定 800x480 的邏輯座標，由 Phaser 依容器大小等比縮放（RWD）
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 480;

export default function Game() {
  const gameRef = useRef<HTMLDivElement>(null);
  const inBattle = useBattleStore(s => s.active);

  useEffect(() => {
    if (!gameRef.current) return;
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: gameRef.current,
      backgroundColor: '#000000',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
      },
      scene: [MapScene, MainScene],
    });
    if (import.meta.env.DEV) (window as unknown as { __game: Phaser.Game }).__game = game;
    // 地圖與戰鬥的容器大小不同（CSS 決定），容器尺寸變化時通知 Phaser 重新計算縮放
    const observer = new ResizeObserver(() => game.scale.refresh());
    observer.observe(gameRef.current);
    return () => {
      observer.disconnect();
      game.destroy(true);
    };
  }, []);

  return (
    <div className={`game-shell ${inBattle ? 'is-battle' : 'is-map'}`}>
      <div ref={gameRef} className="game-canvas" />
      {inBattle && <BattleHUD />}
    </div>
  );
}
